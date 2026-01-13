/**
 * Protocol.js - BLE 协议定义与解析
 * 基于 CarLight Android 应用协议
 */

import { hexToString, concatBytes, stringToFixedBytes, serializeLE } from './Utils.js';

// ============== 命令常量定义 ==============
export const CMD = {
    // 本地升级命令
    LOCAL_UPGRADE: 0xD8,
    RESPONSE_UPGRADE: 0xD9,
    CLOSE_MODULE: 0xDC,

    // 升级子命令
    UPGRADE_REQUEST: 0x80,
    UPGRADE_ACK: 0x81,
    UPGRADE_DATA_FRAME: 0x82,
    UPGRADE_DATA_FRAME_ACK: 0x83,
    UPGRADE_DATA_END: 0x84,
    UPGRADE_DATA_END_ACK: 0x85,
    UPGRADE_SUCCESS: 0x86,
    UPGRADE_CANCEL: 0x89,
};

// ============== 帧生成函数 ==============

/**
 * 生成升级请求帧
 * 格式: [0xFF, 0xD8, 0x80, filename(32B), fileSize(8B), major(2B), minor(2B), build(2B)]
 */
export function generateUpgradeRequestFrame(fileData, major = 1, minor = 0, build = 0) {
    const header = new Uint8Array([0xFF, CMD.LOCAL_UPGRADE, CMD.UPGRADE_REQUEST]);
    const filename = stringToFixedBytes('AMBL3.bin', 32);
    const fileSize = serializeLE(fileData.byteLength, 8);
    const version = concatBytes(
        serializeLE(major, 2),
        serializeLE(minor, 2),
        serializeLE(build, 2)
    );
    return concatBytes(header, filename, fileSize, version);
}

/**
 * 生成数据帧
 * 格式: [0xFF, 0xD8, 0x82, offset(4B), length(2B), data...]
 */
export function generateDataFrame(fileData, offset, length) {
    const header = new Uint8Array([0xFF, CMD.LOCAL_UPGRADE, CMD.UPGRADE_DATA_FRAME]);
    const offsetBytes = serializeLE(offset, 4);
    const lengthBytes = serializeLE(length, 2);
    const data = new Uint8Array(fileData.slice(offset, offset + length));
    return concatBytes(header, offsetBytes, lengthBytes, data);
}

/**
 * 生成结束帧
 * 格式: [0xFF, 0xD8, 0x84]
 */
export function generateFinishFrame() {
    return new Uint8Array([0xFF, CMD.LOCAL_UPGRADE, CMD.UPGRADE_DATA_END]);
}

/**
 * 生成关闭模块帧
 */
export function generateCloseModuleFrame() {
    return new Uint8Array([0xFF, CMD.CLOSE_MODULE]);
}

// ============== 响应解析函数 ==============

/**
 * 解析设备版本信息 (CMD 0x09)
 * 格式: <09 LEN HW_LEN HW_DATA... MODEL_LEN MODEL_DATA... SW_LEN SW_DATA...>
 */
export function parseVersionInfo(data) {
    if (!data.startsWith('<09')) return null;

    try {
        const length = parseInt(data.substring(3, 5), 16);
        if (data.length !== (length + 3) * 2) return null;

        // 硬件版本
        const hwLen = parseInt(data.substring(5, 7), 16);
        let idx = 7 + hwLen * 2;
        const hwVersion = hexToString(data.substring(7, idx));

        // 车型信息
        const modelLen = parseInt(data.substring(idx, idx + 2), 16);
        idx += 2;
        const carModel = hexToString(data.substring(idx, idx + modelLen * 2));
        idx += modelLen * 2;

        // 软件版本
        const swLen = parseInt(data.substring(idx, idx + 2), 16);
        idx += 2;
        const swVersion = hexToString(data.substring(idx, idx + swLen * 2));

        return { hwVersion, carModel, swVersion };
    } catch (e) {
        console.error('解析版本信息失败:', e);
        return null;
    }
}

/**
 * 解析 MTU/OTA 配置 (CMD 0x25)
 * 格式: <2504MMMMOOOO>
 * MMMM: MTU数量 (2字节)
 * OOOO: OTA偏移值 (2字节)
 */
export function parseMtuConfig(data) {
    if (!data.startsWith('<25')) return null;

    try {
        const length = parseInt(data.substring(3, 5), 16);
        if (length !== 4) return null;

        const mtu = parseInt(data.substring(5, 9), 16);
        const otaOffset = parseInt(data.substring(9, 13), 16);

        return { mtu, otaOffset };
    } catch (e) {
        console.error('解析MTU配置失败:', e);
        return null;
    }
}

/**
 * 解析升级响应帧 (CMD 0xD9)
 */
export function parseUpgradeResponse(data) {
    if (data.length < 8) return null;

    const subCmd = data[2];
    const offset = data[3] | (data[4] << 8) | (data[5] << 16) | (data[6] << 24);
    const result = data[7];

    return { subCmd, offset, result };
}

/**
 * 解析任意文本响应
 */
export function parseTextResponse(data) {
    // 检查版本信息
    const versionInfo = parseVersionInfo(data);
    if (versionInfo) return { type: 'version', data: versionInfo };

    // 检查 MTU 配置
    const mtuConfig = parseMtuConfig(data);
    if (mtuConfig) return { type: 'mtu', data: mtuConfig };

    // VIN 注册反馈 <2401XX>
    if (data.startsWith('<2401')) {
        const result = parseInt(data.substring(5, 7), 16);
        return { type: 'vin_register', data: { success: result === 0, result } };
    }

    return { type: 'unknown', data };
}
