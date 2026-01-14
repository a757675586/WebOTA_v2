/**
 * BleService.js - BLE 连接管理服务
 * Web Bluetooth API 封装
 */

import { bytesToHexString } from './Utils.js';
import { parseTextResponse, parseUpgradeResponse, CMD } from './Protocol.js';

// BLE UUID 常量
const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const WRITE_UUID = '0000ff03-0000-1000-8000-00805f9b34fb';
const NOTIFY_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

class BleService {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.writeChar = null;
        this.notifyChar = null;

        // 配置参数 (从设备获取)
        this.mtu = 100;
        this.frameDataCount = 64;

        // 回调函数
        this.onConnectionChange = null;
        this.onDataReceived = null;
        this.onUpgradeResponse = null;
        this.onDeviceInfo = null;
        this.onMtuConfig = null;
        this.onLog = null;

        // 升级响应队列
        this.upgradeResponseQueue = [];
    }

    /**
     * 检查 Web Bluetooth API 是否可用
     */
    isAvailable() {
        return navigator.bluetooth !== undefined;
    }

    /**
     * 扫描并连接设备
     */
    async connect() {
        if (!this.isAvailable()) {
            throw new Error('此浏览器不支持 Web Bluetooth API');
        }

        try {
            this.log('正在扫描设备...');

            // 请求设备 - 使用更宽松的过滤方式
            // 因为有些 BLE 设备不会在广播包中包含 Service UUID
            this.device = await navigator.bluetooth.requestDevice({
                // 方式1: 接受所有设备 (需要用户手动选择)
                acceptAllDevices: true,
                optionalServices: [SERVICE_UUID]

                // 方式2: 如果知道设备名称前缀，可以使用更精确的过滤
                // filters: [
                //     { namePrefix: 'AMBL' },   // 氛围灯设备前缀
                //     { namePrefix: 'CAR' },    // 车灯设备前缀
                //     { services: [SERVICE_UUID] }
                // ],
                // optionalServices: [SERVICE_UUID]
            });

            this.log(`已选择设备: ${this.device.name || this.device.id}`);

            // 监听断开连接事件
            this.device.addEventListener('gattserverdisconnected', () => {
                this.handleDisconnect();
            });

            // 连接 GATT 服务器
            this.log('正在连接 GATT 服务器...');
            this.server = await this.device.gatt.connect();

            // 获取服务
            this.log('正在发现服务...');
            this.service = await this.server.getPrimaryService(SERVICE_UUID);

            // 获取写入特征
            this.log('正在获取写入特征...');
            this.writeChar = await this.service.getCharacteristic(WRITE_UUID);

            // 获取通知特征
            this.log('正在获取通知特征...');
            this.notifyChar = await this.service.getCharacteristic(NOTIFY_UUID);

            // 订阅通知
            this.log('正在订阅通知...');
            await this.notifyChar.startNotifications();
            this.notifyChar.addEventListener('characteristicvaluechanged', (event) => {
                this.handleNotification(event);
            });

            this.log('连接成功!');

            if (this.onConnectionChange) {
                this.onConnectionChange(true, this.device.name || this.device.id);
            }

            // 连接成功后自动请求设备信息
            // 参考 CarLight: MyBleWrapperCallback.java 和 AboutActivity.java
            await this.requestDeviceInfo();

            return true;
        } catch (error) {
            this.log(`连接失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.handleDisconnect();
    }

    /**
     * 处理断开连接
     */
    handleDisconnect() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.writeChar = null;
        this.notifyChar = null;
        this.upgradeResponseQueue = [];

        this.log('已断开连接');

        if (this.onConnectionChange) {
            this.onConnectionChange(false, null);
        }
    }

    /**
     * 检查是否已连接
     */
    isConnected() {
        return this.device && this.device.gatt && this.device.gatt.connected;
    }

    /**
     * 发送数据
     */
    async send(data) {
        if (!this.isConnected() || !this.writeChar) {
            throw new Error('设备未连接');
        }

        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        this.log(`发送: ${bytesToHexString(bytes)}`);

        await this.writeChar.writeValue(bytes);
    }

    /**
     * 处理通知数据
     */
    handleNotification(event) {
        const value = event.target.value;
        const bytes = new Uint8Array(value.buffer);
        const hexStr = bytesToHexString(bytes);

        // 检查是否是二进制升级响应 (第一个字节是 0xFF 或 0xD9)
        // 设备可能返回简短的响应格式
        if (bytes.length >= 2 && (bytes[0] === 0xFF || bytes[0] === 0xD9)) {
            this.log(`收到(HEX): ${hexStr}`);

            // 解析升级响应
            // 格式可能是: [0xFF, 0xD9, subCmd, offset..., result] 或 [0xD9, subCmd, ...]
            let cmdIndex = bytes[0] === 0xFF ? 1 : 0;
            let cmd = bytes[cmdIndex];

            if (cmd === 0xD9 || cmd === CMD.RESPONSE_UPGRADE) {
                const subCmd = bytes[cmdIndex + 1];
                let offset = -1;
                let result = 0;

                // 如果有足够的字节,解析 offset 和 result
                if (bytes.length >= cmdIndex + 7) {
                    offset = bytes[cmdIndex + 2] | (bytes[cmdIndex + 3] << 8) |
                        (bytes[cmdIndex + 4] << 16) | (bytes[cmdIndex + 5] << 24);
                    result = bytes[cmdIndex + 6];
                } else if (bytes.length >= cmdIndex + 3) {
                    // 简短响应格式,可能只有 subCmd
                    result = bytes.length > cmdIndex + 2 ? bytes[cmdIndex + 2] : 0;
                }

                const response = { subCmd, offset, result };
                this.log(`升级响应: subCmd=0x${subCmd.toString(16)}, offset=${offset}, result=${result}`);

                this.upgradeResponseQueue.push(response);
                if (this.onUpgradeResponse) {
                    this.onUpgradeResponse(response);
                }
                return;
            }

            // CAN 帧响应 (0xDB) - 直接转发原始二进制数据
            if (cmd === 0xDB) {
                this.log(`收到 CAN 帧响应: ${hexStr}`);
                if (this.onDataReceived) {
                    this.onDataReceived(bytes, { type: 'can_frame', raw: bytes });
                }
                return;
            }

            // 其他 0xFF 开头的二进制响应也直接转发
            if (this.onDataReceived) {
                this.onDataReceived(bytes, { type: 'binary', raw: bytes });
            }
            return;
        }

        // 尝试解析为文本响应
        const textData = new TextDecoder().decode(bytes);
        this.log(`收到: ${textData}`);

        // 解析文本响应
        const parsed = parseTextResponse(textData);

        if (parsed.type === 'version' && this.onDeviceInfo) {
            this.onDeviceInfo(parsed.data);
        } else if (parsed.type === 'mtu' && this.onMtuConfig) {
            this.mtu = parsed.data.mtu;
            this.frameDataCount = parsed.data.otaOffset;
            this.onMtuConfig(parsed.data);
        }

        if (this.onDataReceived) {
            this.onDataReceived(textData, parsed);
        }
    }

    /**
     * 等待升级响应
     */
    async waitForResponse(expectedSubCmd, timeout = 500) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const idx = this.upgradeResponseQueue.findIndex(r => r.subCmd === expectedSubCmd);
            if (idx !== -1) {
                return this.upgradeResponseQueue.splice(idx, 1)[0];
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        return null;
    }

    /**
     * 请求设备信息
     * 参考 CarLight: MyBleWrapperCallback.onNotifySuccess() 和 AboutActivity.getDevice()
     */
    async requestDeviceInfo() {
        try {
            // 1. 请求 MTU 配置: <FC0103>
            // 参考: MyBleWrapperCallback.java line 59
            this.log('请求 MTU 配置...');
            const mtuCmd = new TextEncoder().encode('<FC0103>');
            await this.send(mtuCmd);

            // 等待一小段时间让设备响应
            await new Promise(resolve => setTimeout(resolve, 300));

            // 2. 请求版本信息: <FC0101>
            // 参考: AboutActivity.java line 77
            this.log('请求设备版本信息...');
            const versionCmd = new TextEncoder().encode('<FC0101>');
            await this.send(versionCmd);

        } catch (error) {
            this.log(`请求设备信息失败: ${error.message}`);
        }
    }

    /**
     * 清空响应队列
     */
    clearResponseQueue() {
        this.upgradeResponseQueue = [];
    }

    /**
     * 日志输出
     */
    log(message) {
        const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        console.log(`[BLE ${timestamp}] ${message}`);
        if (this.onLog) {
            this.onLog(`[${timestamp}] ${message}`);
        }
    }
}

// 导出单例
const bleService = new BleService();
export default bleService;
