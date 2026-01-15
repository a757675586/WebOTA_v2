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
        this._T = (key) => window.i18n ? window.i18n.get(key) : key;
    }

    /**
     * 开始固件升级
     * @param {ArrayBuffer} fileData - 固件文件数据
     * @param {Object} version - 版本信息 { major, minor, build }
     */
    async startUpgrade(fileData, version = { major: 1, minor: 0, build: 0 }) {
        if (this.isUpgrading) {
            throw new Error(this._T('err_upgrade_in_progress'));
        }

        if (!bleService.isConnected()) {
            throw new Error(this._T('err_device_not_connected'));
        }

        this.isUpgrading = true;
        this.updateStatus(this._T('status_preparing_upgrade'));

        try {
            const fileSize = fileData.byteLength;
            const frameDataCount = bleService.frameDataCount || 64;

            this.log(`${this._T('log_file_size')}: ${fileSize} ${this._T('unit_bytes')}`);
            this.log(`${this._T('log_frame_size')}: ${frameDataCount} ${this._T('unit_bytes')}`);

            // 清空响应队列
            bleService.clearResponseQueue();

            // 1. 发送升级请求帧
            this.updateStatus(this._T('status_sending_request'));
            const requestFrame = generateUpgradeRequestFrame(fileData, version.major, version.minor, version.build);
            await bleService.send(requestFrame);

            // 2. 等待确认
            this.log(this._T('status_waiting_ack'));
            const ack = await bleService.waitForResponse(CMD.UPGRADE_ACK, 3000);
            if (!ack) {
                throw new Error(this._T('err_no_ack'));
            }
            this.log(this._T('log_ack_received'));

            // 3. 分帧发送数据
            let offset = 0;
            let lastProgress = 0;

            while (offset < fileSize) {
                let count = Math.min(frameDataCount, fileSize - offset);

                // 发送数据帧,带重试
                const success = await this.sendFrameWithRetry(fileData, offset, count, 3);
                if (!success) {
                    throw new Error(`${this._T('err_frame_failed')} ${offset}`);
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
            this.updateStatus(this._T('status_sending_finish'));
            const finishFrame = generateFinishFrame();
            await bleService.send(finishFrame);

            // 5. 等待结束确认
            const endAck = await bleService.waitForResponse(CMD.UPGRADE_DATA_END_ACK, 3000);
            if (!endAck) {
                throw new Error(this._T('err_no_finish_ack'));
            }

            this.updateStatus(this._T('status_upgrade_success'));
            this.log(this._T('log_upgrade_complete'));
            this.isUpgrading = false;

            if (this.onComplete) {
                this.onComplete(true);
            }

            return true;
        } catch (error) {
            this.log(`${this._T('status_upgrade_failed')}: ${error.message}`);
            this.updateStatus(`${this._T('status_upgrade_failed')}: ${error.message}`);
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
                    this.log(this._T('log_upgrade_canceled'));
                    return false;
                }

                // result == 0 或 result == 1 都表示成功
                if (frameAck.result === 0 || frameAck.result === 1) {
                    return true; // 成功
                }

                // result == 0xFF 表示失败
                if (frameAck.result === 0xFF || frameAck.result === 255) {
                    this.log(`${this._T('log_device_refused')} ${frameAck.result}`);
                    return false;
                }

                // 其他情况也尝试作为成功处理
                return true;
            }

            this.log(`${this._T('log_frame_retry')} ${retry + 1}/${maxRetries}, ${this._T('log_offset')}: ${offset}`);
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
