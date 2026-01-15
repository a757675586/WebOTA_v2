/**
 * Internationalization Support
 * Supports zh (Chinese) and en (English)
 */

const translations = {
    zh: {
        // Brand & Status
        "app_title": "CKCP LAMP - 氛围灯控制",
        "brand_name": "CKCP LAMP",
        "status_connected": "已连接",
        "status_disconnected": "未连接",
        "scan_device": "扫描设备",
        "disconnect": "断开连接",

        // Navigation & Tabs
        "tab_single": "单色模式",
        "tab_multi": "多色模式",
        "tab_dynamic": "律动模式",
        "nav_ambient": "氛围灯",
        "nav_ota": "OTA升级",
        "nav_factory": "工厂模式",

        // Device Card
        "card_device_conn": "设备连接",
        "device_none": "未选择设备",
        "device_scan_hint": "请扫描并连接设备",
        "label_car_model": "车型",
        "label_hw_ver": "硬件",
        "label_sw_ver": "软件",
        "btn_factory": "工厂模式",
        "btn_exit": "退出",

        // Light Settings
        "card_light_settings": "灯光设置",
        "label_zone_mode": "区域亮度",
        "label_total_brightness": "总亮度",
        "label_zone_1": "区域一",
        "label_zone_2": "区域二",
        "label_zone_3": "区域三",
        "title_switch_control": "开关控制",
        "switch_off": "关闭",
        "switch_on": "打开",
        "switch_follow": "跟随车灯",

        // Single Color
        "card_rgb_control": "RGB 颜色控制",
        "title_color_select": "颜色选择",
        "label_current_color": "当前颜色",
        "btn_apply_color": "应用颜色",
        "header_preset_colors": "常用颜色",
        "btn_add": "+ 添加",
        "btn_edit": "编辑",
        "btn_done": "完成",

        // Multi Color
        "card_multi_control": "多色 RGB 控制",
        "label_dynamic_mode": "动态模式",
        "label_static_mode": "静态模式",
        "header_presets": "预设方案",
        "header_channels": "通道颜色",
        "label_sync_mode": "同步模式",
        "label_independent_mode": "独立模式",
        "channel_all": "通道 1、2、3 颜色",
        "channel_1": "通道一颜色",
        "channel_2": "通道二颜色",
        "channel_3": "通道三颜色",
        "btn_clear_color": "清除颜色",
        "btn_apply": "应用",

        // Dynamic Mode
        "card_dynamic_mode": "律动模式",
        "header_dynamic_effects": "律动效果",

        // Factory Mode
        "card_factory_mode": "工厂模式",
        "header_device_reg": "设备注册",
        "label_vin": "VIN 码 (17位)",
        "ph_vin": "输入车辆VIN码",
        "btn_register": "注册",
        "label_car_code": "车型编号",
        "ph_code": "0-255",
        "btn_set": "设置",
        "label_func_code": "功能编号",

        "header_led_config": "灯带安装配置",
        "zone_left_front": "左前",
        "zone_right_front": "右前",
        "zone_left_rear": "左后",
        "zone_right_rear": "右后",
        "zone_seat_main": "主驾",
        "zone_seat_copilot": "副驾",

        "header_sound_source": "律动音源",
        "source_mic": "内置麦克风",
        "source_speaker": "原车喇叭",

        "header_sensitivity": "律动灵敏度",
        "level_1": "1档",
        "level_2": "2档",
        "level_3": "3档",
        "level_4": "4档",
        "level_5": "5档",

        "header_advanced": "高级功能",
        "feat_welcome": "迎宾灯",
        "feat_door": "车门联动",
        "feat_speed": "车速响应",
        "feat_turn": "转向联动",
        "feat_ac": "空调联动",
        "feat_crash": "碰撞警示",

        "header_danger": "危险操作",
        "btn_reset": "恢复出厂设置",
        "confirm_reset": "确定要恢复出厂设置吗？",

        "header_remote": "远程控制 (CAN/LIN)",
        "ph_can_id": "输入 CAN ID (如: 100 或 100,200)",
        "btn_start": "开始",
        "btn_stop": "停止",
        "btn_clear_data": "清空数据",
        "btn_save_data": "保存数据",
        "status_remote_stopped": "未运行",
        "status_remote_running": "运行中",
        "log_placeholder": "监控数据将显示在这里...",

        // Alerts & Messages
        "msg_enter_lin": "请输入 LIN 数据",
        "msg_remote_start": "远程控制已启动",
        "msg_remote_stop": "远程控制已停止",
        "msg_copied": "已复制",
        "msg_saved": "已保存",
        "mode_pattern": "模式",
        "theme_custom": "自定义",

        // Index Page
        "card_device_info": "设备信息",
        "card_ota_upgrade": "固件升级",
        "card_log": "操作日志",
        "label_ota_mtu": "MTU",
        "label_ota_frame": "OTA 帧大小",
        "msg_drop_file": "拖放或点击选择固件",
        "msg_file_hint": "支持 .bin 格式",
        "btn_upgrade": "开始升级",
        "status_waiting": "等待中",
        "msg_log_ready": "应用已就绪，请扫描设备开始连接",

        "dir_ltr": "左→右",
        "dir_rtl": "右→左",

        // Presets
        "preset_mode_1": "湖滨晴雨",
        "preset_mode_2": "曲院风荷",
        "preset_mode_3": "雷峰夕照",
        "preset_mode_4": "月泉晓彻",
        "preset_mode_5": "琼岛春阴",
        "preset_mode_6": "西山晴雪",
        "preset_mode_7": "平湖秋月",
        "preset_mode_8": "云栖竹径",
        "preset_mode_9": "洞庭秋色",
        "preset_mode_10": "无极渐变",

        "log_led_count": "灯珠数",
        "log_direction": "方向",

        // BLE Service
        "log_scanning": "正在扫描设备...",
        "log_device_selected": "已选择设备",
        "log_connecting_gatt": "正在连接 GATT 服务器...",
        "log_discovering_services": "正在发现服务...",
        "log_getting_write_char": "正在获取写入特征...",
        "log_getting_notify_char": "正在获取通知特征...",
        "log_subscribing_notify": "正在订阅通知...",
        "log_connected": "连接成功!",
        "log_connection_failed": "连接失败",
        "log_disconnected": "已断开连接",
        "log_sending": "发送",
        "log_received_hex": "收到(HEX)",
        "log_received_text": "收到",
        "log_upgrade_response": "升级响应",
        "log_requesting_mtu": "请求 MTU 配置...",
        "log_requesting_version": "请求设备版本信息...",
        "log_request_info_failed": "请求设备信息失败",
        "err_browser_no_ble": "此浏览器不支持 Web Bluetooth API",
        "log_can_frame": "收到 CAN 帧响应"
    },
    en: {
        // Brand & Status
        "app_title": "CKCP LAMP - Control",
        "brand_name": "CKCP LAMP",
        "status_connected": "Connected",
        "status_disconnected": "Disconnected",
        "scan_device": "Scan Device",
        "disconnect": "Disconnect",

        // Navigation & Tabs
        "tab_single": "Single",
        "tab_multi": "Multi",
        "tab_dynamic": "Rhythm",
        "nav_ambient": "Ambient",
        "nav_ota": "OTA",
        "nav_factory": "Factory",

        // Device Card
        "card_device_conn": "Connection",
        "device_none": "No Device",
        "device_scan_hint": "Please scan to connect",
        "label_car_model": "Car Model",
        "label_hw_ver": "HW Ver",
        "label_sw_ver": "SW Ver",
        "btn_factory": "Factory",
        "btn_exit": "Exit",

        // Light Settings
        "card_light_settings": "Light Settings",
        "label_zone_mode": "Zone Mode",
        "label_total_brightness": "Brightness",
        "label_zone_1": "Zone 1",
        "label_zone_2": "Zone 2",
        "label_zone_3": "Zone 3",
        "title_switch_control": "Power Control",
        "switch_off": "OFF",
        "switch_on": "ON",
        "switch_follow": "Follow Car",

        // Single Color
        "card_rgb_control": "RGB Control",
        "title_color_select": "Color Select",
        "label_current_color": "Current",
        "btn_apply_color": "Apply",
        "header_preset_colors": "Favorites",
        "btn_add": "+ Add",
        "btn_edit": "Edit",
        "btn_done": "Done",

        // Multi Color
        "card_multi_control": "Multi-Color RGB",
        "label_dynamic_mode": "Dynamic",
        "label_static_mode": "Static",
        "header_presets": "Presets",
        "header_channels": "Channels",
        "label_sync_mode": "Sync Mode",
        "label_independent_mode": "Split Mode",
        "channel_all": "All Channels",
        "channel_1": "Channel 1",
        "channel_2": "Channel 2",
        "channel_3": "Channel 3",
        "btn_clear_color": "Clear",
        "btn_apply": "Apply",

        // Dynamic Mode
        "card_dynamic_mode": "Rhythm Mode",
        "header_dynamic_effects": "Effects",

        // Factory Mode
        "card_factory_mode": "Factory Mode",
        "header_device_reg": "Registration",
        "label_vin": "VIN (17 chars)",
        "ph_vin": "Enter Vehicle VIN",
        "btn_register": "Register",
        "label_car_code": "Car Code",
        "ph_code": "0-255",
        "btn_set": "Set",
        "label_func_code": "Func Code",

        "header_led_config": "LED Config",
        "zone_left_front": "L-Front",
        "zone_right_front": "R-Front",
        "zone_left_rear": "L-Rear",
        "zone_right_rear": "R-Rear",
        "zone_seat_main": "Driver",
        "zone_seat_copilot": "Co-Pilot",

        "header_sound_source": "Sound Source",
        "source_mic": "Microphone",
        "source_speaker": "Car Speaker",

        "header_sensitivity": "Sensitivity",
        "level_1": "Lv 1",
        "level_2": "Lv 2",
        "level_3": "Lv 3",
        "level_4": "Lv 4",
        "level_5": "Lv 5",

        "header_advanced": "Advanced",
        "feat_welcome": "Welcome Light",
        "feat_door": "Door Link",
        "feat_speed": "Speed Resp",
        "feat_turn": "Turn Signal",
        "feat_ac": "A/C Link",
        "feat_crash": "Crash Warn",

        "header_danger": "Danger Zone",
        "btn_reset": "Factory Reset",
        "confirm_reset": "Are you sure to factory reset?",

        "header_remote": "Remote (CAN/LIN)",
        "ph_can_id": "CAN ID (e.g. 100 or 100,200)",
        "btn_start": "Start",
        "btn_stop": "Stop",
        "btn_clear_data": "Clear",
        "btn_save_data": "Save",
        "status_remote_stopped": "Stopped",
        "status_remote_running": "Running",
        "log_placeholder": "Data log will appear here...",

        // Alerts & Messages
        "msg_enter_lin": "Please enter LIN data",
        "msg_remote_start": "Remote started",
        "msg_remote_stop": "Remote stopped",
        "msg_copied": "Copied",
        "msg_saved": "Saved",
        "mode_pattern": "Pattern",
        "theme_custom": "Custom",

        // Index Page
        "card_device_info": "Device Info",
        "card_ota_upgrade": "FW Upgrade",
        "card_log": "Operation Log",
        "label_ota_mtu": "MTU",
        "label_ota_frame": "Frame Size",
        "msg_drop_file": "Drop or click to select firmware",
        "msg_file_hint": "Supports .bin format",
        "btn_upgrade": "Start Upgrade",
        "status_waiting": "Waiting",
        "msg_log_ready": "App ready, please scan to connect",

        "dir_ltr": "L→R",
        "dir_rtl": "R→L",

        // Presets
        "preset_mode_1": "Lakeside Rain",
        "preset_mode_2": "Lotus Breeze",
        "preset_mode_3": "Sunset Glow",
        "preset_mode_4": "Forest Mist",
        "preset_mode_5": "Violet Dream",
        "preset_mode_6": "Sunny Snow",
        "preset_mode_7": "Autumn Moon",
        "preset_mode_8": "Bamboo Path",
        "preset_mode_9": "Pink Lady",
        "preset_mode_10": "Rainbow",

        "log_led_count": "LED Count",
        "log_direction": "Direction",

        // BLE Service
        "log_scanning": "Scanning for devices...",
        "log_device_selected": "Device selected",
        "log_connecting_gatt": "Connecting to GATT...",
        "log_discovering_services": "Discovering services...",
        "log_getting_write_char": "Getting write characteristic...",
        "log_getting_notify_char": "Getting notify characteristic...",
        "log_subscribing_notify": "Subscribing to notifications...",
        "log_connected": "Connected!",
        "log_connection_failed": "Connection failed",
        "log_disconnected": "Disconnected",
        "log_sending": "TX",
        "log_received_hex": "RX(HEX)",
        "log_received_text": "RX",
        "log_upgrade_response": "Upgrade Resp",
        "log_requesting_mtu": "Requesting MTU...",
        "log_requesting_version": "Requesting Version...",
        "log_request_info_failed": "Failed to request info",
        "err_browser_no_ble": "Browser does not support Web Bluetooth API",
        "log_can_frame": "RX CAN Frame"
    }
};

class I18n {
    constructor() {
        this.lang = localStorage.getItem('app_language') || 'zh';
        this.observers = [];
    }

    setLanguage(lang) {
        if (lang !== 'zh' && lang !== 'en') return;
        this.lang = lang;
        localStorage.setItem('app_language', lang);
        this.updatePage();
        this.notifyObservers();
    }

    toggleLanguage() {
        this.setLanguage(this.lang === 'zh' ? 'en' : 'zh');
    }

    get(key) {
        return translations[this.lang][key] || key;
    }

    // Update all elements with data-i18n attribute
    updatePage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const str = this.get(key);

            if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                el.placeholder = str;
            } else {
                el.textContent = str;
            }
        });

        // Update title
        document.title = this.get('app_title');

        // Update HTML lang attribute
        document.documentElement.lang = this.lang === 'zh' ? 'zh-CN' : 'en-US';

        // Update switcher button text
        const langText = document.getElementById('langText');
        if (langText) {
            langText.textContent = this.lang === 'zh' ? 'EN' : '中';
        }
    }

    subscribe(callback) {
        this.observers.push(callback);
    }

    notifyObservers() {
        this.observers.forEach(cb => cb(this.lang));
    }
}

// Global instance
window.i18n = new I18n();

// Global toggle function for button click
window.toggleLanguage = () => window.i18n.toggleLanguage();

// Auto-init when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.i18n.updatePage();
});
