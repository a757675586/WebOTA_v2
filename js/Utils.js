/**
 * Utils.js - 工具函数
 * Web BLE OTA Application
 */

/**
 * 将十六进制字符串转换为字节数组
 * @param {string} hexStr - 十六进制字符串
 * @returns {Uint8Array}
 */
function hexStringToBytes(hexStr) {
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
    }
    return bytes;
}

/**
 * 将字节数组转换为十六进制字符串
 * @param {Uint8Array} bytes - 字节数组
 * @returns {string}
 */
function bytesToHexString(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('');
}

/**
 * 将十六进制字符串转换为ASCII字符串
 * @param {string} hexStr - 十六进制字符串
 * @returns {string}
 */
function hexToString(hexStr) {
    let str = '';
    for (let i = 0; i < hexStr.length; i += 2) {
        const charCode = parseInt(hexStr.substr(i, 2), 16);
        if (charCode === 0) break;
        str += String.fromCharCode(charCode);
    }
    return str;
}

/**
 * 将字符串转换为定长字节数组
 * @param {string} str - 输入字符串
 * @param {number} length - 目标长度
 * @returns {Uint8Array}
 */
function stringToFixedBytes(str, length) {
    const bytes = new Uint8Array(length);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, length));
    return bytes;
}

/**
 * 将数字序列化为小端字节数组
 * @param {number} value - 数值
 * @param {number} byteLength - 字节长度
 * @returns {Uint8Array}
 */
function serializeLE(value, byteLength) {
    const bytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
        bytes[i] = (value >> (i * 8)) & 0xFF;
    }
    return bytes;
}

/**
 * 将数字序列化为大端字节数组
 * @param {number} value - 数值
 * @param {number} byteLength - 字节长度
 * @returns {Uint8Array}
 */
function serializeBE(value, byteLength) {
    const bytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
        bytes[byteLength - 1 - i] = (value >> (i * 8)) & 0xFF;
    }
    return bytes;
}

/**
 * 合并多个 Uint8Array
 * @param {...Uint8Array} arrays - 要合并的数组
 * @returns {Uint8Array}
 */
function concatBytes(...arrays) {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

/**
 * 延时函数
 * @param {number} ms - 毫秒
 * @returns {Promise}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化时间戳
 * @returns {string}
 */
function formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour12: false });
}

export {
    hexStringToBytes,
    bytesToHexString,
    hexToString,
    stringToFixedBytes,
    serializeLE,
    serializeBE,
    concatBytes,
    delay,
    formatTimestamp
};
