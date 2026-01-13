/**
 * OtaService.js - OTA 固件升级服务
 */

import bleService from './BleService.js';
import { generateUpgradeRequestFrame, generateDataFrame, generateFinishFrame, CMD } from './Protocol.js';
import { delay } from './Utils.js';

class OtaService {
    constructor() {
        this.isUpgrading = false;
        this.onProgress = null;
        this.onStatusChange = null;
        this.onComplete = null;
    }

    /**
     * 开始固件升级
     * @param {ArrayBuffer} fileData - 固件文件数据
     * @param {Object} version - 版本信息 { major, minor, build }
     */
    async startUpgrade(fileData, version = { major: 1, minor: 0, build: 0 }) {
        if (this.isUpgrading) {
            throw new Error('升级正在进行中');
        }

        if (!bleService.isConnected()) {
            throw new Error('设备未连接');
        }

        this.isUpgrading = true;
        this.updateStatus('正在准备升级...');

        try {
            const fileSize = fileData.byteLength;
            const frameDataCount = bleService.frameDataCount || 64;

            this.log(`文件大小: ${fileSize} 字节`);
            this.log(`每帧数据量: ${frameDataCount} 字节`);

            // 清空响应队列
            bleService.clearResponseQueue();

            // 1. 发送升级请求帧
            this.updateStatus('发送升级请求...');
            const requestFrame = generateUpgradeRequestFrame(fileData, version.major, version.minor, version.build);
            await bleService.send(requestFrame);

            // 2. 等待确认
            this.log('等待设备确认...');
            const ack = await bleService.waitForResponse(CMD.UPGRADE_ACK, 3000);
            if (!ack) {
                throw new Error('设备未响应升级请求');
            }
            this.log('设备已确认,开始传输数据...');

            // 3. 分帧发送数据
            let offset = 0;
            let lastProgress = 0;

            while (offset < fileSize) {
                let count = Math.min(frameDataCount, fileSize - offset);

                // 发送数据帧,带重试
                const success = await this.sendFrameWithRetry(fileData, offset, count, 3);
                if (!success) {
                    throw new Error(`数据帧发送失败,偏移: ${offset}`);
                }

                offset += count;

                // 更新进度
                const progress = Math.round((offset * 100) / fileSize);
                if (progress !== lastProgress) {
                    lastProgress = progress;
                    this.updateProgress(progress);
                }
            }

            // 4. 发送结束帧
            this.updateStatus('发送结束帧...');
            const finishFrame = generateFinishFrame();
            await bleService.send(finishFrame);

            // 5. 等待结束确认
            const endAck = await bleService.waitForResponse(CMD.UPGRADE_DATA_END_ACK, 3000);
            if (!endAck) {
                throw new Error('未收到升级完成确认');
            }

            this.updateStatus('升级成功!');
            this.log('固件升级完成');
            this.isUpgrading = false;

            if (this.onComplete) {
                this.onComplete(true);
            }

            return true;
        } catch (error) {
            this.log(`升级失败: ${error.message}`);
            this.updateStatus(`升级失败: ${error.message}`);
            this.isUpgrading = false;

            if (this.onComplete) {
                this.onComplete(false, error.message);
            }

            throw error;
        }
    }

    /**
     * 发送单个数据帧(带重试)
     * 参考 CarLight Utils.kt waitResponseNum:
     * - result == 0 或 result == 1 表示成功
     * - result == 0xFF (-1) 表示失败/取消
     */
    async sendFrameWithRetry(fileData, offset, count, maxRetries) {
        for (let retry = 0; retry < maxRetries; retry++) {
            const dataFrame = generateDataFrame(fileData, offset, count);
            await bleService.send(dataFrame);

            // 等待帧确认
            const frameAck = await bleService.waitForResponse(CMD.UPGRADE_DATA_FRAME_ACK, 1000);

            if (frameAck) {
                // 参考 CarLight: result == 0 或匹配都算成功
                // subCmd == COMMAND_UPGRADE_CANCEL (0x89) 时返回失败
                if (frameAck.subCmd === CMD.UPGRADE_CANCEL) {
                    this.log('设备取消升级');
                    return false;
                }

                // result == 0 或 result == 1 都表示成功
                if (frameAck.result === 0 || frameAck.result === 1) {
                    return true; // 成功
                }

                // result == 0xFF 表示失败
                if (frameAck.result === 0xFF || frameAck.result === 255) {
                    this.log(`设备拒绝,result=${frameAck.result}`);
                    return false;
                }

                // 其他情况也尝试作为成功处理
                return true;
            }

            this.log(`帧重试 ${retry + 1}/${maxRetries}, 偏移: ${offset}`);
            await delay(100);
        }

        return false;
    }

    /**
     * 取消升级
     */
    cancelUpgrade() {
        this.isUpgrading = false;
        this.updateStatus('升级已取消');
    }

    /**
     * 更新进度
     */
    updateProgress(progress) {
        if (this.onProgress) {
            this.onProgress(progress);
        }
    }

    /**
     * 更新状态
     */
    updateStatus(status) {
        this.log(status);
        if (this.onStatusChange) {
            this.onStatusChange(status);
        }
    }

    /**
     * 日志
     */
    log(message) {
        bleService.log(`[OTA] ${message}`);
    }
}

// 导出单例
const otaService = new OtaService();
export default otaService;
