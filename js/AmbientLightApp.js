/**
 * AmbientLightApp - 氛围灯控制主应用
 * 整合 BLE 连接、颜色选择、灯光控制等功能
 */

import bleService from './BleService.js';
import { ColorPicker } from './ColorPicker.js';
import { LightController } from './LightController.js';
import { AmbientProtocol, ZONE, SWITCH_STATE, CHANNEL, cmdSingleColor, cmdBrightness, cmdLightSwitch, cmdDynamicMode, cmdMultiTheme, cmdSyncMode, cmdDiyChannel } from './AmbientProtocol.js';

class AmbientLightApp {
    constructor() {
        // 服务实例 - 使用导入的单例
        this.bleService = bleService;
        this.protocol = new AmbientProtocol(bleService);
        this.colorPicker = null;
        this.lightController = null;

        // 状态
        this.currentMode = 'single'; // single, multi, dynamic
        this.currentColor = { r: 255, g: 0, b: 0 };
        this.presetColors = this.loadPresetColors();
        this.isConnected = false;
        this.deviceInfo = null;

        // 多色模式状态
        this.selectedMultiIndex = 0;
        this.selectedDynamicIndex = 0;
        this.multiPresets = [
            { name: '湖滨晴雨', image: 'images/ic_mm_1.png', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'] },
            { name: '曲院风荷', image: 'images/ic_mm_2.png', colors: ['#006994', '#40E0D0', '#00CED1', '#20B2AA'] },
            { name: '雷峰夕照', image: 'images/ic_mm_3.png', colors: ['#FF4500', '#FF6347', '#FF7F50', '#FFD700'] },
            { name: '月泉晓彻', image: 'images/ic_mm_4.png', colors: ['#228B22', '#32CD32', '#00FA9A', '#98FB98'] },
            { name: '琼岛春阴', image: 'images/ic_mm_5.png', colors: ['#9400D3', '#8A2BE2', '#9932CC', '#BA55D3'] },
            { name: '西山晴雪', image: 'images/ic_mm_6.png', colors: ['#FF0000', '#FF4500', '#FF6600', '#FF8C00'] },
            { name: '平湖秋月', image: 'images/ic_mm_7.png', colors: ['#87CEEB', '#ADD8E6', '#B0E0E6', '#E0FFFF'] },
            { name: '云栖竹径', image: 'images/ic_mm_8.png', colors: ['#191970', '#000080', '#4169E1', '#6495ED'] },
            { name: '洞庭秋色', image: 'images/ic_mm_9.png', colors: ['#FFB6C1', '#FFC0CB', '#FF69B4', '#FF1493'] },
            { name: '无极渐变', image: 'images/ic_mm_10.png', colors: [] },
            { name: '自定义', image: '', colors: [] },
        ];

        // 律动模式预设 (参考 Android App: DataRepository.kt -> model_1="模式")
        this.dynamicPresets = [
            { name: '模式 1', id: 1, color: 'linear-gradient(45deg, #FF0000, #FF7F00)' },
            { name: '模式 2', id: 2, color: 'linear-gradient(45deg, #FFFF00, #00FF00)' },
            { name: '模式 3', id: 3, color: 'linear-gradient(45deg, #00FFFF, #0000FF)' },
            { name: '模式 4', id: 4, color: 'linear-gradient(45deg, #8B00FF, #FF00FF)' },
            { name: '模式 5', id: 5, color: 'linear-gradient(45deg, #FF0000, #0000FF)' },
            { name: '模式 6', id: 6, color: 'linear-gradient(45deg, #00FF00, #FF00FF)' },
            { name: '模式 7', id: 7, color: 'linear-gradient(45deg, #FF7F00, #00FFFF)' },
            { name: '模式 8', id: 8, color: 'linear-gradient(45deg, #FFFF00, #8B00FF)' },
        ];

        this.init();
    }

    async init() {
        console.log('[AmbientLightApp] 初始化...');

        this.bindElements();
        this.initColorPicker();
        this.initLightController();
        this.bindEvents();
        this.renderPresetColors();
        this.renderMultiPresets();
        this.renderDynamicPresets();

        console.log('[AmbientLightApp] 初始化完成');
    }

    bindElements() {
        // 导航栏
        this.btnScan = document.getElementById('btnScan');
        this.btnDisconnect = document.getElementById('btnDisconnect');
        this.btnDeviceInfo = document.getElementById('btnDeviceInfo');
        this.statusBadge = document.getElementById('statusBadge');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.deviceName = document.getElementById('deviceName');
        this.deviceStatus = document.getElementById('deviceStatus');
        this.deviceCard = document.getElementById('deviceCard');

        // 模式切换
        this.modeTabs = document.getElementById('modeTabs');
        this.singleColorPanel = document.getElementById('singleColorPanel');
        this.multiColorPanel = document.getElementById('multiColorPanel');
        this.dynamicPanel = document.getElementById('dynamicPanel');

        // 颜色控制
        this.colorPreview = document.getElementById('colorPreview');
        this.colorHexValue = document.getElementById('colorHexValue');
        this.btnApplyColor = document.getElementById('btnApplyColor');
        this.presetColorsContainer = document.getElementById('presetColors');
        this.btnAddColor = document.getElementById('btnAddColor');
        this.btnEditColors = document.getElementById('btnEditColors');

        // 多色模式
        this.dynamicToggle = document.getElementById('dynamicToggle');
        this.dynamicModeLabel = document.getElementById('dynamicModeLabel');
        this.syncToggle = document.getElementById('syncToggle');
        this.syncModeLabel = document.getElementById('syncModeLabel');
        this.syncChannels = document.getElementById('syncChannels');
        this.separateChannels = document.getElementById('separateChannels');
        this.multiPresetsContainer = document.getElementById('multiPresets');
        this.dynamicPresetsContainer = document.getElementById('dynamicPresets');
        this.btnClearMulti = document.getElementById('btnClearMulti');
        this.btnApplyMulti = document.getElementById('btnApplyMulti');

        // 设备信息弹窗
        this.deviceInfoModal = document.getElementById('deviceInfoModal');
        this.btnCloseInfo = document.getElementById('btnCloseInfo');
        this.btnEnterFactory = document.getElementById('btnEnterFactory');
        this.btnFactory = document.getElementById('btnFactory');
        this.btnAbout = document.getElementById('btnAbout');
    }

    initColorPicker() {
        this.colorPicker = new ColorPicker('colorPickerCanvas', 'colorIndicator', {
            onChange: (rgb, hex) => {
                this.currentColor = rgb;
                this.updateColorPreview(hex);
            },
            onSelect: (rgb, hex) => {
                console.log('[ColorPicker] 选择颜色:', hex);
            }
        });
    }

    initLightController() {
        this.lightController = new LightController(this.protocol, {
            onBrightnessChange: (zone, value) => {
                this.log(`亮度调节: 区域${zone} = ${value}`);
            },
            onSwitchChange: (state) => {
                const states = ['关闭', '打开', '跟随车灯'];
                this.log(`开关状态: ${states[state]}`);
            }
        });
    }

    bindEvents() {
        // 扫描设备
        this.btnScan?.addEventListener('click', () => this.scanDevices());
        this.btnDisconnect?.addEventListener('click', () => this.disconnect());

        // 模式切换
        this.modeTabs?.addEventListener('click', (e) => {
            const tab = e.target.closest('.mode-tab');
            if (tab) {
                this.switchMode(tab.dataset.mode);
            }
        });

        // 应用颜色
        this.btnApplyColor?.addEventListener('click', () => this.applyColor());
        this.btnAddColor?.addEventListener('click', () => this.addPresetColor());

        // 同步模式切换
        this.syncToggle?.addEventListener('change', (e) => {
            const isSync = e.target.checked;
            this.syncModeLabel.textContent = isSync ? '同步模式' : '独立模式';
            this.syncChannels.classList.toggle('hidden', !isSync);
            this.separateChannels.classList.toggle('hidden', isSync);
            this.protocol.setSyncMode(isSync);
            this.protocol.setZoneMode(false);
        });

        // 动态/静态模式切换
        this.dynamicToggle?.addEventListener('change', (e) => {
            const isDynamic = e.target.checked;
            this.dynamicModeLabel.textContent = isDynamic ? '动态模式' : '静态模式';
            this.log(`切换模式: ${isDynamic ? '动态' : '静态'}`);
            this.protocol.setDynamicMode(isDynamic);
        });

        // 设备信息
        this.btnDeviceInfo?.addEventListener('click', () => this.showDeviceInfo());
        this.btnAbout?.addEventListener('click', () => this.showDeviceInfo());
        this.btnCloseInfo?.addEventListener('click', () => this.hideDeviceInfo());

        // 工厂模式
        this.btnFactory?.addEventListener('click', () => this.enterFactoryMode());
        this.btnEnterFactory?.addEventListener('click', () => this.enterFactoryMode());

        // 多色模式按钮
        this.btnClearMulti?.addEventListener('click', () => this.clearMultiColors());
        this.btnApplyMulti?.addEventListener('click', () => this.applyMultiColors());

        // BLE 回调绑定
        this.bleService.onConnectionChange = (connected, deviceName) => {
            if (connected) {
                this.onConnected({ name: deviceName });
            } else {
                this.onDisconnected();
            }
        };
        this.bleService.onDataReceived = (data, parsed) => this.onDataReceived(data, parsed);
        this.bleService.onDeviceInfo = (info) => {
            this.deviceInfo = { ...this.deviceInfo, ...info };
            console.log('[AmbientLightApp] 设备信息:', info);

            // 收到信息时立即更新界面
            this.updateDeviceInfoUI();
        };
    }

    // ============ 设备连接 ============

    async scanDevices() {
        try {
            this.log('开始扫描设备...');
            this.btnScan.disabled = true;
            this.btnScan.innerHTML = '<span class="btn-icon">⏳</span> 扫描中...';

            await this.bleService.connect();

        } catch (error) {
            console.error('[AmbientLightApp] 扫描失败:', error);
            this.log('扫描失败: ' + error.message, 'error');
        } finally {
            this.btnScan.disabled = false;
            this.btnScan.innerHTML = '<span class="btn-icon">🔍</span> 扫描设备';
        }
    }

    async disconnect() {
        try {
            await this.bleService.disconnect();
            this.log('设备已断开');
        } catch (error) {
            console.error('[AmbientLightApp] 断开失败:', error);
        }
    }

    onConnected(device) {
        this.isConnected = true;
        this.deviceInfo = device;

        // 更新 UI
        this.statusBadge.classList.add('connected');
        this.connectionStatus.textContent = '已连接';
        this.deviceName.textContent = device?.name || '未知设备';
        this.deviceStatus.textContent = '已连接';
        this.deviceCard.classList.add('connected');

        this.btnScan.style.display = 'none';
        this.btnDisconnect.style.display = 'flex';
        this.btnDeviceInfo.style.display = 'flex';

        this.log('设备已连接: ' + (device?.name || '未知'));

        // 连接成功后同步状态
        setTimeout(async () => {
            if (this.lightController) {
                await this.lightController.syncToDevice();
            }
            // 触发当前模式的指令发送
            this.switchMode(this.currentMode);
        }, 500); // 延迟一点，确保连接稳定
    }

    onDisconnected() {
        this.isConnected = false;
        this.deviceInfo = null;

        // 更新 UI
        this.statusBadge.classList.remove('connected');
        this.connectionStatus.textContent = '未连接';
        this.deviceName.textContent = '未选择设备';
        this.deviceStatus.textContent = '请扫描并连接设备';
        this.deviceCard.classList.remove('connected');

        this.btnScan.style.display = 'flex';
        this.btnDisconnect.style.display = 'none';
        this.btnDeviceInfo.style.display = 'none';

        this.log('设备已断开');
    }

    onDataReceived(data) {
        console.log('[AmbientLightApp] 收到数据:', data);
        // 处理设备返回的数据
    }

    // ============ 模式切换 ============

    async switchMode(mode) {
        this.currentMode = mode;

        // 更新 Tab 状态
        const tabs = this.modeTabs.querySelectorAll('.mode-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // 显示对应面板
        this.singleColorPanel.classList.toggle('hidden', mode !== 'single');
        this.multiColorPanel.classList.toggle('hidden', mode !== 'multi');
        this.dynamicPanel.classList.toggle('hidden', mode !== 'dynamic');

        this.log(`切换到${mode === 'single' ? '单色' : mode === 'multi' ? '多色' : '律动'}模式`);

        // 切换模式时自动发送当前选中状态
        if (this.isConnected) {
            try {
                switch (mode) {
                    case 'single':
                        await this.applyColor();
                        break;
                    case 'multi':
                        // 发送当前工作模式 (静态/动态)
                        await this.protocol.setDynamicMode(this.dynamicToggle.checked);
                        await this.delay(50);
                        // 发送同步模式状态
                        await this.protocol.setSyncMode(this.syncToggle.checked);
                        await this.delay(50);
                        // 发送当前选中主题
                        await this.protocol.setMultiTheme(this.selectedMultiIndex + 1);
                        break;
                    case 'dynamic':
                        // 如果存在预设，发送当前选中预设
                        if (this.dynamicPresets[this.selectedDynamicIndex]) {
                            await this.protocol.setDynamicEffect(this.dynamicPresets[this.selectedDynamicIndex].id);
                        }
                        break;
                }
            } catch (error) {
                console.error('[AmbientLightApp] 切换模式发送指令失败:', error);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============ 颜色控制 ============

    updateColorPreview(hex) {
        this.colorPreview.style.backgroundColor = hex;
        this.colorHexValue.textContent = hex;
    }

    async applyColor() {
        if (!this.isConnected) {
            this.log('请先连接设备', 'warning');
            return;
        }

        try {
            const { r, g, b } = this.currentColor;
            await this.protocol.setSingleColor(r, g, b);
            this.log(`应用颜色: RGB(${r}, ${g}, ${b})`);
        } catch (error) {
            console.error('[AmbientLightApp] 发送颜色失败:', error);
            this.log('发送颜色失败', 'error');
        }
    }

    // ============ 预设颜色 ============

    loadPresetColors() {
        const saved = localStorage.getItem('ambientPresetColors');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('加载预设颜色失败:', e);
            }
        }
        // 默认预设
        return [
            '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
            '#00FFFF', '#0000FF', '#8B00FF', '#FF00FF',
            '#FFFFFF', '#FF6B6B', '#4ECDC4', '#45B7D1'
        ];
    }

    savePresetColors() {
        localStorage.setItem('ambientPresetColors', JSON.stringify(this.presetColors));
    }

    renderPresetColors() {
        if (!this.presetColorsContainer) return;

        this.presetColorsContainer.innerHTML = '';

        this.presetColors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            swatch.dataset.index = index;

            // 默认选中状态 (比较 RGB 可能会有轻微误差，这里比较 Hex)
            // 注意: initial currentColor 是 R255 G0 B0 (#FF0000)
            const currentHex = this.colorPicker ? this.colorPicker.getHexColor() : '#FF0000';
            if (color.toLowerCase() === currentHex.toLowerCase()) {
                swatch.classList.add('active');
            }

            swatch.addEventListener('click', () => {
                this.selectPresetColor(color);
            });

            this.presetColorsContainer.appendChild(swatch);
        });

        // 添加按钮
        const addBtn = document.createElement('div');
        addBtn.className = 'color-swatch color-swatch-add';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', () => this.addPresetColor());
        this.presetColorsContainer.appendChild(addBtn);
    }

    selectPresetColor(hex) {
        this.colorPicker.setColor(hex);
        this.currentColor = this.colorPicker.getRgbColor();
        this.updateColorPreview(hex);

        // 更新选中状态
        const swatches = this.presetColorsContainer.querySelectorAll('.color-swatch');
        swatches.forEach(s => {
            s.classList.toggle('active', s.dataset.color === hex);
        });
    }

    addPresetColor() {
        const hex = this.colorPicker.getHexColor();
        if (!this.presetColors.includes(hex)) {
            this.presetColors.push(hex);
            this.savePresetColors();
            this.renderPresetColors();
            this.log(`添加预设颜色: ${hex}`);
        }
    }

    // ============ 多色模式 ============

    renderMultiPresets() {
        if (!this.multiPresetsContainer) return;

        this.multiPresetsContainer.innerHTML = '';

        this.multiPresets.forEach((preset, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';

            // Use image if available
            if (preset.image) {
                swatch.style.backgroundImage = `url('${preset.image}')`;
                swatch.style.backgroundSize = 'cover';
                swatch.style.backgroundPosition = 'center';
            } else if (preset.colors && preset.colors.length > 0) {
                // Fallback to gradient
                const gradient = `linear-gradient(135deg, ${preset.colors.join(', ')})`;
                swatch.style.background = gradient;
            } else {
                swatch.style.background = 'conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
            }

            swatch.title = preset.name;
            swatch.dataset.index = index;

            // 默认选中状态
            if (index === this.selectedMultiIndex) {
                swatch.classList.add('active');
            }

            // Add name element
            const nameEl = document.createElement('span');
            nameEl.className = 'preset-name';
            nameEl.textContent = preset.name;
            swatch.appendChild(nameEl);

            swatch.addEventListener('click', () => {
                this.selectMultiPreset(index);
            });

            this.multiPresetsContainer.appendChild(swatch);
        });
    }

    selectMultiPreset(index) {
        const preset = this.multiPresets[index];
        if (!preset) return;

        // 更新选中状态
        const swatches = this.multiPresetsContainer.querySelectorAll('.color-swatch');
        swatches.forEach((s, i) => {
            s.classList.toggle('active', i === index);
        });

        this.selectedMultiIndex = index;
        this.log(`选择多色方案: ${preset.name}`);

        // 发送多色主题命令 (索引 + 1)
        this.protocol.setMultiTheme(index + 1);
    }

    clearMultiColors() {
        this.log('清除通道颜色');
    }

    applyMultiColors() {
        if (!this.isConnected) {
            this.log('请先连接设备', 'warning');
            return;
        }
        this.log('应用多色方案');
    }

    // ============ 律动模式 ============

    renderDynamicPresets() {
        if (!this.dynamicPresetsContainer) return;

        this.dynamicPresetsContainer.innerHTML = '';

        this.dynamicPresets.forEach((preset, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.background = preset.color;
            swatch.dataset.index = index;
            swatch.title = preset.name;

            // 默认选中状态
            if (index === this.selectedDynamicIndex) {
                swatch.classList.add('active');
            }

            // Add name element
            const nameEl = document.createElement('span');
            nameEl.className = 'preset-name';
            nameEl.textContent = preset.name;
            swatch.appendChild(nameEl);

            swatch.addEventListener('click', () => {
                this.selectDynamicPreset(index);
            });

            this.dynamicPresetsContainer.appendChild(swatch);
        });
    }

    selectDynamicPreset(index) {
        const preset = this.dynamicPresets[index];
        if (!preset) return;

        // 更新选中状态
        const swatches = this.dynamicPresetsContainer.querySelectorAll('.color-swatch');
        swatches.forEach((s, i) => {
            s.classList.toggle('active', i === index);
        });

        this.selectedDynamicIndex = index;
        this.log(`选择律动效果: ${preset.name}`);

        // 发送律动效果命令 (1-8)
        this.protocol.setDynamicEffect(preset.id);
    }

    // ============ 设备信息 ============

    showDeviceInfo() {
        if (this.deviceInfoModal) {
            this.deviceInfoModal.classList.remove('hidden');
            this.updateDeviceInfoUI();
        }
    }

    updateDeviceInfoUI() {
        if (!this.deviceInfo) return;

        const setSafeText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text || '-';
        };

        setSafeText('infoCarModel', this.deviceInfo.carModel);
        setSafeText('infoAddress', this.deviceInfo.address || this.deviceInfo.name);
        setSafeText('infoFirmware', this.deviceInfo.swVersion || this.deviceInfo.firmware); // 兼容 swVersion 和 firmware 字段
        setSafeText('infoHardware', this.deviceInfo.hwVersion || this.deviceInfo.hardware); // 兼容 hwVersion 和 hardware 字段

        // 同时更新 OTA 面板的信息 (如果存在)
        setSafeText('hwVersion', this.deviceInfo.hwVersion || this.deviceInfo.hardware);
        setSafeText('swVersion', this.deviceInfo.swVersion || this.deviceInfo.firmware);
        setSafeText('carModel', this.deviceInfo.carModel);
    }

    hideDeviceInfo() {
        if (this.deviceInfoModal) {
            this.deviceInfoModal.classList.add('hidden');
        }
    }

    enterFactoryMode() {
        this.hideDeviceInfo();
        // 跳转到工厂模式页面或打开工厂模式
        // 跳转到工厂模式页面或打开工厂模式
        this.log('进入工厂模式');

        // 发送进入工厂模式命令
        this.protocol.enterFactoryMode();

        // 可以添加密码验证
        window.location.href = 'index.html'; // 暂时跳转到 OTA 页面
    }

    // ============ 日志 ============

    log(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    window.ambientApp = new AmbientLightApp();
});

export default AmbientLightApp;
