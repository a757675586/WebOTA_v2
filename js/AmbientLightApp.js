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

        // 加载保存的状态
        this.loadState();

        this.renderPresetColors();
        this.renderMultiPresets();
        this.renderDynamicPresets();

        // 恢复 UI 状态
        this.restoreUIState();

        console.log('[AmbientLightApp] 初始化完成');
    }

    loadState() {
        try {
            const saved = localStorage.getItem('ambientAppState');
            if (saved) {
                const state = JSON.parse(saved);
                this.currentMode = state.currentMode || 'single';
                this.currentColor = state.currentColor || { r: 255, g: 0, b: 0 };
                this.selectedMultiIndex = state.selectedMultiIndex || 0;
                this.selectedDynamicIndex = state.selectedDynamicIndex || 0;
                this.isDynamicToggleOn = state.isDynamicToggleOn !== undefined ? state.isDynamicToggleOn : false;
                this.isSyncToggleOn = state.isSyncToggleOn !== undefined ? state.isSyncToggleOn : true;
            }
        } catch (e) {
            console.error('加载状态失败:', e);
        }
    }

    saveState() {
        try {
            const state = {
                currentMode: this.currentMode,
                currentColor: this.currentColor,
                selectedMultiIndex: this.selectedMultiIndex,
                selectedDynamicIndex: this.selectedDynamicIndex,
                isDynamicToggleOn: this.dynamicToggle ? this.dynamicToggle.checked : false,
                isSyncToggleOn: this.syncToggle ? this.syncToggle.checked : true
            };
            localStorage.setItem('ambientAppState', JSON.stringify(state));
        } catch (e) {
            console.error('保存状态失败:', e);
        }
    }

    restoreUIState() {
        // 恢复模式 Tab
        this.switchMode(this.currentMode);

        // 恢复 Toggle 状态
        if (this.dynamicToggle) {
            this.dynamicToggle.checked = this.isDynamicToggleOn;
            if (this.dynamicModeLabel) {
                this.dynamicModeLabel.textContent = this.isDynamicToggleOn ? '动态模式' : '静态模式';
            }
        }
        if (this.syncToggle) {
            this.syncToggle.checked = this.isSyncToggleOn;
            if (this.syncModeLabel) {
                this.syncModeLabel.textContent = this.isSyncToggleOn ? '同步模式' : '独立模式';
            }
            this.syncChannels.classList.toggle('hidden', !this.isSyncToggleOn);
            this.separateChannels.classList.toggle('hidden', this.isSyncToggleOn);
        }

        // 恢复自定义通道控制可见性
        if (this.customChannelControls) {
            const isCustom = this.selectedMultiIndex === this.multiPresets.length - 1;
            this.customChannelControls.classList.toggle('hidden', !isCustom);
        }

        // 恢复颜色选择器
        if (this.colorPicker) {
            const hex = `#${((1 << 24) + (this.currentColor.r << 16) + (this.currentColor.g << 8) + this.currentColor.b).toString(16).slice(1).toUpperCase()}`;
            this.colorPicker.setColor(hex);
            this.updateColorPreview(hex);
        }
    }

    bindElements() {
        // 导航栏
        this.btnScan = document.getElementById('btnScan');
        this.btnDisconnect = document.getElementById('btnDisconnect');
        this.statusBadge = document.getElementById('statusBadge');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.deviceName = document.getElementById('deviceName');
        this.deviceStatus = document.getElementById('deviceStatus');
        this.deviceStatus = document.getElementById('deviceStatus');
        this.deviceCard = document.getElementById('deviceCard');
        this.deviceDetails = document.getElementById('deviceDetails');

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
        this.customChannelControls = document.getElementById('customChannelControls');
        this.btnClearMulti = document.getElementById('btnClearMulti');
        this.btnApplyMulti = document.getElementById('btnApplyMulti');

        // 工厂模式相关元素
        this.btnFactory = document.getElementById('btnFactory');
        this.btnEnterFactory = document.getElementById('btnEnterFactory');
        this.btnExitFactory = document.getElementById('btnExitFactory');
        this.factoryPanel = document.getElementById('factoryPanel');
        this.ledConfigGrid = document.getElementById('ledConfigGrid');
        this.sensitivityLevels = document.getElementById('sensitivityLevels');

        // 工厂模式输入框
        this.factoryVIN = document.getElementById('factoryVIN');
        this.factoryCarCode = document.getElementById('factoryCarCode');
        this.factoryFuncCode = document.getElementById('factoryFuncCode');

        // 工厂模式按钮
        this.btnRegisterVIN = document.getElementById('btnRegisterVIN');
        this.btnSetCarCode = document.getElementById('btnSetCarCode');
        this.btnSetFuncCode = document.getElementById('btnSetFuncCode');
        this.btnFactoryReset = document.getElementById('btnFactoryReset');

        // 高级功能开关
        this.featureWelcome = document.getElementById('featureWelcome');
        this.featureDoor = document.getElementById('featureDoor');
        this.featureSpeed = document.getElementById('featureSpeed');
        this.featureTurn = document.getElementById('featureTurn');
        this.featureAC = document.getElementById('featureAC');
        this.featureCrash = document.getElementById('featureCrash');
    }

    initColorPicker() {
        this.colorPicker = new ColorPicker('colorPickerCanvas', 'colorIndicator', {
            onChange: (rgb, hex) => {
                this.currentColor = rgb;
                this.updateColorPreview(hex);
                // Debounce save? simplified for now
                this.saveState();
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
            if (this.syncModeLabel) {
                this.syncModeLabel.textContent = isSync ? '同步模式' : '独立模式';
            }
            this.syncChannels.classList.toggle('hidden', !isSync);
            this.separateChannels.classList.toggle('hidden', isSync);
            this.protocol.setSyncMode(isSync);
            this.protocol.setZoneMode(false);
            this.saveState();
        });

        // 动态/静态模式切换
        this.dynamicToggle?.addEventListener('change', (e) => {
            const isDynamic = e.target.checked;
            if (this.dynamicModeLabel) {
                this.dynamicModeLabel.textContent = isDynamic ? '动态模式' : '静态模式';
            }
            this.log(`切换模式: ${isDynamic ? '动态' : '静态'}`);
            this.log(`切换模式: ${isDynamic ? '动态' : '静态'}`);
            this.protocol.setDynamicMode(isDynamic);
            this.saveState();
        });

        // 设备信息相关事件已移除

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
        if (this.deviceDetails) this.deviceDetails.classList.remove('hidden');

        this.btnScan.style.display = 'none';
        this.btnDisconnect.style.display = 'flex';

        // 显示工厂模式按钮
        if (this.btnEnterFactory) {
            this.btnEnterFactory.classList.remove('hidden');
        }

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
        if (this.deviceDetails) this.deviceDetails.classList.add('hidden');

        this.btnScan.style.display = 'flex';
        this.btnDisconnect.style.display = 'none';

        // 隐藏工厂模式按钮
        if (this.btnEnterFactory) {
            this.btnEnterFactory.classList.add('hidden');
        }

        // 如果在工厂模式中，退出
        if (this.isFactoryMode) {
            this.factoryPanel?.classList.add('hidden');
            this.modeTabs?.classList.remove('hidden');
            this.switchMode(this.currentMode);
            this.isFactoryMode = false;
        }

        this.log('设备已断开');
    }

    onDataReceived(data) {
        console.log('[AmbientLightApp] 收到数据:', data);

        // 将 ArrayBuffer/Uint8Array 转为字符串
        let text = '';
        if (data instanceof ArrayBuffer) {
            text = new TextDecoder().decode(data);
        } else if (data instanceof Uint8Array) {
            text = new TextDecoder().decode(data);
        } else if (typeof data === 'string') {
            text = data;
        }

        // 解析工厂配置响应 <FD...>
        if (text.startsWith('<FD') && this.isFactoryMode) {
            this.parseFactoryConfig(text);
        }
    }

    /**
     * 解析工厂配置响应
     * 格式: <FD{LENGTH}{DATA...}>
     * DATA 格式 (每个 2 字符 hex):
     *   - numZj, ltrZj (主驾灯数, 方向)
     *   - numFj, ltrFj (副驾灯数, 方向)
     *   - numZqm, ltrZqm (左前门灯数, 方向)
     *   - numYqm, ltrYqm (右前门灯数, 方向)
     *   - numZhm, ltrZhm (左后门灯数, 方向)
     *   - numYhm, ltrYhm (右后门灯数, 方向)
     *   - isMic (音源: 0=麦克风, 1=原车)
     *   - dynamicDang (灵敏度 1-5)
     *   - yb, cm, cs, zx, kt, clpz (高级功能开关)
     */
    parseFactoryConfig(text) {
        try {
            const length = parseInt(text.substring(3, 5), 16);
            this.log(`工厂配置响应长度: ${length}, 原始数据: ${text}`);

            if (text.length < (length + 3) * 2) {
                this.log('工厂配置数据不完整', 'warning');
                return;
            }

            // 读取一个字节 (2 hex 字符)
            let index = 5;
            const readByte = () => {
                const hex = text.substring(index, index + 2);
                const val = parseInt(hex, 16);
                this.log(`  [${index}] 读取: ${hex} = ${val}`);
                index += 2;
                return val;
            };

            // 按顺序解析 6 个区域 (每个区域: 灯珠数 + 方向)
            const zones = [];
            const zoneNames = ['主驾', '副驾', '左前', '右前', '左后', '右后'];
            for (let i = 0; i < 6; i++) {
                const count = readByte();
                const dirFlag = readByte();
                const ltr = dirFlag === 0;  // 0 = 左到右, 1 = 右到左
                zones.push({ count, ltr });
                this.log(`  区域[${zoneNames[i]}]: 灯数=${count}, 方向=${ltr ? '左→右' : '右→左'}`);
            }

            // 解析音源和灵敏度
            const micFlag = readByte();
            const isMic = micFlag === 0;  // 0 = 麦克风, 1 = 原车
            const sensitivity = readByte();
            this.log(`  音源: ${isMic ? '麦克风' : '原车'}, 灵敏度: ${sensitivity}档`);

            // 解析高级功能 (6 个开关)
            const features = {
                welcome: readByte() === 1,
                door: readByte() === 1,
                speed: readByte() === 1,
                turn: readByte() === 1,
                ac: readByte() === 1,
                crash: readByte() === 1
            };
            this.log(`  高级功能: ${JSON.stringify(features)}`);

            const config = { zones, isMic, sensitivity, features };
            this.log('工厂配置解析完成');
            this.applyFactoryConfig(config);

        } catch (e) {
            console.error('[AmbientLightApp] 解析工厂配置失败:', e);
        }
    }

    /**
     * 应用工厂配置到 UI
     */
    applyFactoryConfig(config) {
        // 初始化 LED 区域配置 (带名称和图标)
        const zoneDefaults = [
            { name: '主驾', icon: '🚗' },
            { name: '副驾', icon: '🚗' },
            { name: '左前', icon: '⬅️' },
            { name: '右前', icon: '➡️' },
            { name: '左后', icon: '⬅️' },
            { name: '右后', icon: '➡️' }
        ];

        // 合并设备返回的数据和默认名称/图标
        this.ledZones = config.zones.map((zone, i) => ({
            ...zoneDefaults[i],
            count: zone.count,
            ltr: zone.ltr
        }));

        this.log(`LED 区域数据已更新: ${JSON.stringify(this.ledZones)}`);

        // 重新渲染 LED 网格
        this.renderLedConfigGrid();

        // 更新音源选择
        const micRadio = document.querySelector('input[name="soundSource"][value="mic"]');
        const speakerRadio = document.querySelector('input[name="soundSource"][value="speaker"]');
        if (micRadio) micRadio.checked = config.isMic;
        if (speakerRadio) speakerRadio.checked = !config.isMic;

        // 更新灵敏度
        if (this.sensitivityLevels) {
            this.sensitivityLevels.querySelectorAll('.level-btn').forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.level) === config.sensitivity);
            });
        }

        // 更新高级功能开关
        if (this.featureWelcome) this.featureWelcome.checked = config.features.welcome;
        if (this.featureDoor) this.featureDoor.checked = config.features.door;
        if (this.featureSpeed) this.featureSpeed.checked = config.features.speed;
        if (this.featureTurn) this.featureTurn.checked = config.features.turn;
        if (this.featureAC) this.featureAC.checked = config.features.ac;
        if (this.featureCrash) this.featureCrash.checked = config.features.crash;

        this.log('工厂配置已应用到 UI');
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

        this.saveState();

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

        // 判断是否是"自定义"预设 (最后一个)
        const isCustom = index === this.multiPresets.length - 1;

        // 显示/隐藏通道颜色控制区域
        if (this.customChannelControls) {
            this.customChannelControls.classList.toggle('hidden', !isCustom);
        }

        // 发送多色主题命令 (索引 + 1)，自定义模式不发送主题命令
        if (!isCustom) {
            this.protocol.setMultiTheme(index + 1);
        }
        this.saveState();
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
        this.saveState();
    }

    // ============ 设备信息 UI 更新 ============

    updateDeviceInfoUI() {
        if (!this.deviceInfo) return;

        const setSafeText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text || '-';
        };

        // 更新侧边栏 directly
        setSafeText('detailCarModel', this.deviceInfo.carModel);
        setSafeText('detailHwVersion', this.deviceInfo.hwVersion || this.deviceInfo.hardware);
        setSafeText('detailSwVersion', this.deviceInfo.swVersion || this.deviceInfo.firmware);
    }

    async enterFactoryMode() {
        // 显示工厂模式面板，隐藏其他面板
        this.singleColorPanel?.classList.add('hidden');
        this.multiColorPanel?.classList.add('hidden');
        this.dynamicPanel?.classList.add('hidden');
        this.factoryPanel?.classList.remove('hidden');

        // 隐藏模式标签
        this.modeTabs?.classList.add('hidden');

        this.isFactoryMode = true;
        this.log('进入工厂模式');

        // 发送进入工厂模式命令
        await this.protocol.enterFactoryMode();

        // 延迟后请求读取配置
        await this.delay(200);

        // 发送读取配置命令 <FC0102>
        await this.protocol.readFactoryConfig();
        this.log('请求读取工厂配置...');

        // 渲染 LED 配置网格
        this.renderLedConfigGrid();

        // 绑定工厂模式事件
        this.bindFactoryEvents();
    }

    exitFactoryMode() {
        // 发送退出工厂模式命令
        this.protocol.exitFactoryMode();

        // 隐藏工厂模式面板
        this.factoryPanel?.classList.add('hidden');

        // 显示模式标签
        this.modeTabs?.classList.remove('hidden');

        // 恢复当前模式
        this.switchMode(this.currentMode);

        this.isFactoryMode = false;
        this.log('退出工厂模式');
    }

    bindFactoryEvents() {
        // 退出按钮
        this.btnExitFactory?.addEventListener('click', () => this.exitFactoryMode());

        // VIN 注册
        this.btnRegisterVIN?.addEventListener('click', () => {
            const vin = this.factoryVIN?.value?.trim();
            if (!vin || vin.length !== 17) {
                alert('请输入17位VIN码');
                return;
            }
            this.protocol.registerVIN(vin);
            this.log(`注册 VIN: ${vin}`);
        });

        // 车型编号
        this.btnSetCarCode?.addEventListener('click', () => {
            const code = parseInt(this.factoryCarCode?.value);
            if (isNaN(code) || code < 0 || code > 255) {
                alert('请输入 0-255 之间的数字');
                return;
            }
            this.protocol.setCarCode(code);
            this.log(`设置车型编号: ${code}`);
        });

        // 功能编号
        this.btnSetFuncCode?.addEventListener('click', () => {
            const code = parseInt(this.factoryFuncCode?.value);
            if (isNaN(code) || code < 0 || code > 255) {
                alert('请输入 0-255 之间的数字');
                return;
            }
            this.protocol.setFunctionCode(code);
            this.log(`设置功能编号: ${code}`);
        });

        // 音源选择
        document.querySelectorAll('input[name="soundSource"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const isMic = e.target.value === 'mic';
                this.protocol.setSoundSource(isMic);
                this.log(`设置音源: ${isMic ? '内置麦克风' : '原车喇叭'}`);
            });
        });

        // 灵敏度
        this.sensitivityLevels?.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.target.dataset.level);
                this.sensitivityLevels.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.protocol.setSensitivity(level);
                this.log(`设置灵敏度: ${level}档`);
            });
        });

        // 高级功能开关
        const features = [
            { el: this.featureWelcome, id: 0x1C, name: '迎宾灯' },
            { el: this.featureDoor, id: 0x1D, name: '车门联动' },
            { el: this.featureSpeed, id: 0x1E, name: '车速响应' },
            { el: this.featureTurn, id: 0x1F, name: '转向联动' },
            { el: this.featureAC, id: 0x20, name: '空调联动' },
            { el: this.featureCrash, id: 0x21, name: '碰撞警示' }
        ];

        features.forEach(({ el, id, name }) => {
            el?.addEventListener('change', (e) => {
                this.protocol.setAdvancedFeature(id, e.target.checked);
                this.log(`${name}: ${e.target.checked ? '开启' : '关闭'}`);
            });
        });

        // 恢复出厂设置
        this.btnFactoryReset?.addEventListener('click', () => {
            if (confirm('确定要恢复出厂设置吗？此操作不可撤销！')) {
                this.protocol.factoryReset();
                this.log('恢复出厂设置');
                alert('已发送恢复出厂设置命令');
            }
        });
    }

    renderLedConfigGrid() {
        if (!this.ledConfigGrid) return;

        // LED 区域配置数据 (只在首次初始化时设置默认值)
        if (!this.ledZones || this.ledZones.length === 0) {
            this.ledZones = [
                { name: '主驾', icon: '🚗', count: 0, ltr: true },
                { name: '副驾', icon: '🚗', count: 0, ltr: true },
                { name: '左前', icon: '⬅️', count: 0, ltr: true },
                { name: '右前', icon: '➡️', count: 0, ltr: false },
                { name: '左后', icon: '⬅️', count: 0, ltr: true },
                { name: '右后', icon: '➡️', count: 0, ltr: false }
            ];
        }

        this.ledConfigGrid.innerHTML = this.ledZones.map((zone, index) => `
            <div class="led-config-item" data-zone="${index}">
                <div class="zone-icon">${zone.icon}</div>
                <div class="zone-name">${zone.name}</div>
                <div class="stepper-control">
                    <button class="stepper-btn" data-action="decrease">−</button>
                    <span class="stepper-value" data-zone="${index}">${zone.count}</span>
                    <button class="stepper-btn" data-action="increase">+</button>
                </div>
                <div class="direction-toggle">
                    <button class="dir-btn ${zone.ltr ? 'active' : ''}" data-dir="ltr">左→右</button>
                    <button class="dir-btn ${!zone.ltr ? 'active' : ''}" data-dir="rtl">右→左</button>
                </div>
            </div>
        `).join('');

        // 绑定 LED 配置事件
        this.ledConfigGrid.querySelectorAll('.led-config-item').forEach(item => {
            const zoneIndex = parseInt(item.dataset.zone);

            // 灯珠数量加减
            item.querySelectorAll('.stepper-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    const valueEl = item.querySelector('.stepper-value');
                    let count = parseInt(valueEl.textContent);

                    if (action === 'increase' && count < 255) {
                        count++;
                    } else if (action === 'decrease' && count > 0) {
                        count--;
                    }

                    valueEl.textContent = count;
                    this.ledZones[zoneIndex].count = count;

                    // 发送 LED 数量命令
                    this.protocol.setLedCount(zoneIndex, count);
                    this.log(`${this.ledZones[zoneIndex].name} 灯珠数: ${count}`);
                });
            });

            // 方向切换
            item.querySelectorAll('.dir-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const dir = e.target.dataset.dir;
                    const isLtr = dir === 'ltr';

                    item.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');

                    this.ledZones[zoneIndex].ltr = isLtr;

                    // 发送方向命令
                    this.protocol.setLedDirection(zoneIndex, isLtr);
                    this.log(`${this.ledZones[zoneIndex].name} 方向: ${isLtr ? '左→右' : '右→左'}`);
                });
            });
        });
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

