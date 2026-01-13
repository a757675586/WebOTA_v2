/**
 * app.js - 主应用逻辑
 * Web BLE OTA Application
 */

import bleService from './BleService.js';
import otaService from './OtaService.js';

// ============== DOM 元素 ==============
const elements = {
    // 导航栏状态
    statusBadge: document.getElementById('statusBadge'),
    connectionStatus: document.getElementById('connectionStatus'),

    // 连接控制
    btnScan: document.getElementById('btnScan'),
    btnDisconnect: document.getElementById('btnDisconnect'),
    deviceName: document.getElementById('deviceName'),

    // 设备信息
    hwVersion: document.getElementById('hwVersion'),
    swVersion: document.getElementById('swVersion'),
    carModel: document.getElementById('carModel'),
    mtuValue: document.getElementById('mtuValue'),
    otaOffset: document.getElementById('otaOffset'),

    // OTA 升级
    fileInput: document.getElementById('fileInput'),
    fileDropZone: document.getElementById('fileDropZone'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    btnUpgrade: document.getElementById('btnUpgrade'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    upgradeStatus: document.getElementById('upgradeStatus'),

    // 日志
    logContainer: document.getElementById('logContainer'),
    btnClearLog: document.getElementById('btnClearLog'),
};

// ============== 状态变量 ==============
let selectedFile = null;

// ============== 初始化 ==============
function init() {
    // 检查 Web Bluetooth 支持
    if (!bleService.isAvailable()) {
        showError('您的浏览器不支持 Web Bluetooth API。请使用 Chrome 或 Edge 浏览器。');
        elements.btnScan.disabled = true;
        return;
    }

    // 绑定事件
    bindEvents();

    // 设置 BLE 回调
    setupBleCallbacks();

    // 设置 OTA 回调
    setupOtaCallbacks();

    addLog('应用已就绪，请扫描设备开始连接', 'info');
}

// ============== 事件绑定 ==============
function bindEvents() {
    // 扫描按钮
    elements.btnScan.addEventListener('click', async () => {
        try {
            elements.btnScan.disabled = true;
            elements.btnScan.innerHTML = '<span class="btn-icon">⏳</span>扫描中...';
            await bleService.connect();
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                addLog(`连接错误: ${error.message}`, 'error');
            }
        } finally {
            elements.btnScan.disabled = false;
            elements.btnScan.innerHTML = '<span class="btn-icon">🔍</span>扫描设备';
        }
    });

    // 断开按钮
    elements.btnDisconnect.addEventListener('click', () => {
        bleService.disconnect();
    });

    // 文件拖放区点击
    elements.fileDropZone.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // 文件拖放
    elements.fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.fileDropZone.classList.add('drag-over');
    });

    elements.fileDropZone.addEventListener('dragleave', () => {
        elements.fileDropZone.classList.remove('drag-over');
    });

    elements.fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.fileDropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.bin')) {
            handleFileSelect(file);
        } else {
            addLog('请选择 .bin 格式的固件文件', 'error');
        }
    });

    // 文件选择
    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });

    // 升级按钮
    elements.btnUpgrade.addEventListener('click', async () => {
        if (!selectedFile) {
            showError('请先选择固件文件');
            return;
        }

        try {
            elements.btnUpgrade.disabled = true;
            elements.btnUpgrade.innerHTML = '<span class="btn-icon">⏳</span>升级中...';
            const fileData = await selectedFile.arrayBuffer();
            await otaService.startUpgrade(fileData);
        } catch (error) {
            addLog(`升级错误: ${error.message}`, 'error');
        } finally {
            elements.btnUpgrade.disabled = !bleService.isConnected() || !selectedFile;
            elements.btnUpgrade.innerHTML = '<span class="btn-icon">⬆️</span>开始升级';
        }
    });

    // 清空日志
    elements.btnClearLog.addEventListener('click', () => {
        elements.logContainer.innerHTML = '';
        addLog('日志已清空', 'info');
    });
}

// ============== 文件选择处理 ==============
function handleFileSelect(file) {
    selectedFile = file;
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    elements.fileDropZone.classList.add('has-file');
    elements.btnUpgrade.disabled = !bleService.isConnected();
    addLog(`已选择固件: ${file.name} (${formatFileSize(file.size)})`, 'info');
}

// ============== BLE 回调设置 ==============
function setupBleCallbacks() {
    // 连接状态变化
    bleService.onConnectionChange = (connected, name) => {
        updateConnectionUI(connected, name);

        if (connected) {
            elements.btnUpgrade.disabled = !selectedFile;
        } else {
            elements.btnUpgrade.disabled = true;
            clearDeviceInfo();
        }
    };

    // 设备信息
    bleService.onDeviceInfo = (info) => {
        elements.hwVersion.textContent = info.hwVersion || '-';
        elements.swVersion.textContent = info.swVersion || '-';
        elements.carModel.textContent = info.carModel || '-';
        addLog(`设备信息: HW=${info.hwVersion}, SW=${info.swVersion}`, 'info');
    };

    // MTU 配置
    bleService.onMtuConfig = (config) => {
        elements.mtuValue.textContent = config.mtu + ' bytes';
        elements.otaOffset.textContent = config.otaOffset + ' bytes';
        addLog(`MTU=${config.mtu}, 帧大小=${config.otaOffset}`, 'info');
    };

    // 日志
    bleService.onLog = (message) => {
        addLog(message);
    };
}

// ============== OTA 回调设置 ==============
function setupOtaCallbacks() {
    // 进度更新
    otaService.onProgress = (progress) => {
        elements.progressBar.style.width = `${progress}%`;
        elements.progressText.textContent = `${progress}%`;
    };

    // 状态更新
    otaService.onStatusChange = (status) => {
        elements.upgradeStatus.textContent = status;
    };

    // 升级完成
    otaService.onComplete = (success, error) => {
        if (success) {
            elements.upgradeStatus.textContent = '✓ 升级成功';
            addLog('固件升级成功完成!', 'success');
        } else {
            elements.upgradeStatus.textContent = `✗ ${error}`;
            addLog(`升级失败: ${error}`, 'error');
        }
    };
}

// ============== UI 更新 ==============
function updateConnectionUI(connected, name) {
    if (connected) {
        elements.connectionStatus.textContent = '已连接';
        elements.statusBadge.classList.add('connected');
        elements.deviceName.textContent = name || '未知设备';
        elements.btnScan.style.display = 'none';
        elements.btnDisconnect.style.display = 'flex';
    } else {
        elements.connectionStatus.textContent = '未连接';
        elements.statusBadge.classList.remove('connected');
        elements.deviceName.textContent = '未选择';
        elements.btnScan.style.display = 'flex';
        elements.btnDisconnect.style.display = 'none';
    }
}

function clearDeviceInfo() {
    elements.hwVersion.textContent = '-';
    elements.swVersion.textContent = '-';
    elements.carModel.textContent = '-';
    elements.mtuValue.textContent = '-';
    elements.otaOffset.textContent = '-';
    elements.progressBar.style.width = '0%';
    elements.progressText.textContent = '0%';
    elements.upgradeStatus.textContent = '等待中';
}

// ============== 工具函数 ==============
function addLog(message, type = '') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry${type ? ` log-${type}` : ''}`;
    logEntry.textContent = message;
    elements.logContainer.appendChild(logEntry);
    elements.logContainer.scrollTop = elements.logContainer.scrollHeight;

    // 限制日志数量
    while (elements.logContainer.children.length > 200) {
        elements.logContainer.removeChild(elements.logContainer.firstChild);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showError(message) {
    addLog(`错误: ${message}`, 'error');
    alert(message);
}

// ============== 启动 ==============
document.addEventListener('DOMContentLoaded', init);
