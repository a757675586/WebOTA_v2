/**
 * LightController - 亮度和开关控制器
 * 管理灯光亮度调节和开关状态
 */
export class LightController {
    constructor(protocol, options = {}) {
        this.protocol = protocol;

        this.options = {
            onBrightnessChange: options.onBrightnessChange || (() => { }),
            onSwitchChange: options.onSwitchChange || (() => { }),
        };

        // 状态
        this.zoneMode = false; // false: 统一, true: 区域
        this.brightness = {
            total: 5,
            zone1: 5,
            zone2: 5,
            zone3: 5
        };
        this.switchState = 1; // 0: 关闭, 1: 打开, 2: 跟随车灯

        this.switchState = 1; // 0: 关闭, 1: 打开, 2: 跟随车灯

        // Helper for i18n
        this._T = (key) => window.i18n ? window.i18n.get(key) : key;

        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadState();
        this.restoreUI();
    }

    bindElements() {
        // 区域模式切换
        this.zoneModeSwitch = document.getElementById('zoneMode');
        this.zoneModeLabel = document.getElementById('zoneModeLabel');
        this.unifiedZone = document.getElementById('unifiedZone');
        this.zoneControls = document.getElementById('zoneControls');

        // 亮度滑块
        this.brightnessTotal = document.getElementById('brightnessTotal');
        this.brightnessTotalValue = document.getElementById('brightnessTotalValue');
        this.brightnessZone1 = document.getElementById('brightnessZone1');
        this.brightnessZone2 = document.getElementById('brightnessZone2');
        this.brightnessZone3 = document.getElementById('brightnessZone3');
        this.zone1Value = document.getElementById('zone1Value');
        this.zone2Value = document.getElementById('zone2Value');
        this.zone3Value = document.getElementById('zone3Value');

        // 开关控制
        this.switchControl = document.getElementById('switchControl');
    }

    bindEvents() {
        // 区域模式切换
        this.zoneModeSwitch?.addEventListener('change', (e) => {
            this.zoneMode = e.target.checked;
            this.updateZoneModeUI();
            this.saveState();
        });

        // 统一亮度
        this.brightnessTotal?.addEventListener('input', (e) => {
            this.brightness.total = parseInt(e.target.value);
            this.brightnessTotalValue.textContent = this.brightness.total;
        });

        this.brightnessTotal?.addEventListener('change', (e) => {
            // Zone 4 is Total/Unified zone in protocol
            this.sendBrightness(4, this.brightness.total);
            this.saveState();
        });

        // 区域亮度
        this.brightnessZone1?.addEventListener('input', (e) => {
            this.brightness.zone1 = parseInt(e.target.value);
            this.zone1Value.textContent = this.brightness.zone1;
        });
        this.brightnessZone1?.addEventListener('change', () => {
            this.sendBrightness(1, this.brightness.zone1);
            this.saveState();
        });

        this.brightnessZone2?.addEventListener('input', (e) => {
            this.brightness.zone2 = parseInt(e.target.value);
            this.zone2Value.textContent = this.brightness.zone2;
        });
        this.brightnessZone2?.addEventListener('change', () => {
            this.sendBrightness(2, this.brightness.zone2);
            this.saveState();
        });

        this.brightnessZone3?.addEventListener('input', (e) => {
            this.brightness.zone3 = parseInt(e.target.value);
            this.zone3Value.textContent = this.brightness.zone3;
        });
        this.brightnessZone3?.addEventListener('change', () => {
            this.sendBrightness(3, this.brightness.zone3);
            this.saveState();
        });

        // 开关控制
        this.switchControl?.addEventListener('click', (e) => {
            const btn = e.target.closest('.switch-option');
            if (!btn) return;

            const switchValue = parseInt(btn.dataset.switch);
            this.setSwitchState(switchValue);
        });
    }

    async updateZoneModeUI() {
        if (this.zoneMode) {
            this.zoneModeLabel.textContent = this._T('label_zone_mode');
            this.unifiedZone.classList.add('hidden');
            this.zoneControls.classList.remove('hidden');
        } else {
            this.zoneModeLabel.textContent = this._T('label_zone_mode');
            this.unifiedZone.classList.remove('hidden');
            this.zoneControls.classList.add('hidden');
        }

        // 发送区域模式切换命令
        await this.sendZoneMode(this.zoneMode);

        // 添加短暂延迟，确保设备处理完模式切换后再接收亮度命令
        await new Promise(r => setTimeout(r, 100));

        if (this.zoneMode) {
            // 切换到区域模式，重新发送各区域亮度
            await this.sendBrightness(1, this.brightness.zone1);
            await new Promise(r => setTimeout(r, 50));
            await this.sendBrightness(2, this.brightness.zone2);
            await new Promise(r => setTimeout(r, 50));
            await this.sendBrightness(3, this.brightness.zone3);
        } else {
            // 切换到统一模式，重新发送总亮度
            await this.sendBrightness(4, this.brightness.total);
        }
    }

    setSwitchState(state) {
        this.switchState = state;

        // 更新 UI
        const buttons = this.switchControl.querySelectorAll('.switch-option');
        buttons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.switch) === state);
        });

        // 发送开关命令
        this.sendSwitchState(state);
        this.saveState();
    }

    // ============ BLE 命令发送 ============

    // ============ BLE 命令发送 ============

    async sendBrightness(zone, value) {
        if (!this.protocol) return;

        try {
            await this.protocol.setBrightness(zone, value);
            console.log(`[LightController] 发送亮度: zone=${zone}, value=${value}`);
            this.options.onBrightnessChange(zone, value);
        } catch (error) {
            console.error('[LightController] 发送亮度失败:', error);
        }
    }

    async sendZoneMode(isZoneMode) {
        if (!this.protocol) return;

        try {
            await this.protocol.setZoneMode(isZoneMode);
            console.log(`[LightController] 区域模式: ${isZoneMode ? '区域' : '统一'}`);
        } catch (error) {
            console.error('[LightController] 发送区域模式失败:', error);
        }
    }

    async sendSwitchState(state) {
        if (!this.protocol) return;

        try {
            await this.protocol.setSwitch(state);
            console.log(`[LightController] 开关状态: ${state}`);
            this.options.onSwitchChange(state);
        } catch (error) {
            console.error('[LightController] 发送开关状态失败:', error);
        }
    }

    async syncToDevice() {
        if (!this.protocol) return;

        console.log('[LightController] 同步状态到设备...');

        // 1. 发送开关状态
        await this.sendSwitchState(this.switchState);

        // 2. 发送区域模式
        await this.sendZoneMode(this.zoneMode);

        // 3. 发送亮度
        if (this.zoneMode) {
            await this.sendBrightness(1, this.brightness.zone1);
            await this.sendBrightness(2, this.brightness.zone2);
            await this.sendBrightness(3, this.brightness.zone3);
        } else {
            // Zone 4 is Total
            await this.sendBrightness(4, this.brightness.total);
        }
    }

    // ============ 状态获取 ============

    getBrightness() {
        return this.brightness;
    }

    getSwitchState() {
        return this.switchState;
    }

    isZoneMode() {
        return this.zoneMode;
    }

    // ============ 状态持久化 ============

    loadState() {
        try {
            const saved = localStorage.getItem('ambientLightState');
            if (saved) {
                const state = JSON.parse(saved);
                if (state.brightness) this.brightness = { ...this.brightness, ...state.brightness };
                if (state.switchState !== undefined) this.switchState = state.switchState;
                if (state.zoneMode !== undefined) this.zoneMode = state.zoneMode;
            }
        } catch (e) {
            console.error('[LightController] 加载状态失败:', e);
        }
    }

    saveState() {
        try {
            const state = {
                brightness: this.brightness,
                switchState: this.switchState,
                zoneMode: this.zoneMode
            };
            localStorage.setItem('ambientLightState', JSON.stringify(state));
        } catch (e) {
            console.error('[LightController] 保存状态失败:', e);
        }
    }

    restoreUI() {
        // 恢复区域模式 UI
        if (this.zoneModeSwitch) this.zoneModeSwitch.checked = this.zoneMode;
        this.updateZoneModeUI(); // 这会更新显示/隐藏区域

        // 恢复亮度滑块 UI
        if (this.brightnessTotal) {
            this.brightnessTotal.value = this.brightness.total;
            if (this.brightnessTotalValue) this.brightnessTotalValue.textContent = this.brightness.total;
        }
        if (this.brightnessZone1) {
            this.brightnessZone1.value = this.brightness.zone1;
            if (this.zone1Value) this.zone1Value.textContent = this.brightness.zone1;
        }
        if (this.brightnessZone2) {
            this.brightnessZone2.value = this.brightness.zone2;
            if (this.zone2Value) this.zone2Value.textContent = this.brightness.zone2;
        }
        if (this.brightnessZone3) {
            this.brightnessZone3.value = this.brightness.zone3;
            if (this.zone3Value) this.zone3Value.textContent = this.brightness.zone3;
        }

        // 恢复开关状态 UI
        // 注意：这里不调用 setSwitchState 以避免在初始化时发送 BLE 命令（虽然发送也没关系，但只需更新 UI）
        // 但我们需要更新按钮的 active 类
        if (this.switchControl) {
            const buttons = this.switchControl.querySelectorAll('.switch-option');
            buttons.forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.switch) === this.switchState);
            });
        }
    }
}

export default LightController;
