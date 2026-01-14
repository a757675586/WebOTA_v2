/**
 * AmbientProtocol.js - 氛围灯 CKCP 协议命令生成器
 * 基于 CarLight Android 应用的协议分析
 * 
 * 命令格式: <CMD LEN DATA...>
 * - < > 为起止符
 * - CMD: 命令字节 (hex)
 * - LEN: 数据长度 (hex)
 * - DATA: 数据内容 (hex)
 */

/**
 * 辅助函数: 将数值转换为两位十六进制字符串
 */
function toHex(value) {
    return value.toString(16).padStart(2, '0').toUpperCase();
}

/**
 * 辅助函数: 将 RGB 颜色值转换为 hex 字符串
 */
function rgbToHex(r, g, b) {
    return toHex(r) + toHex(g) + toHex(b);
}

/**
 * 辅助函数: 解析 hex 颜色字符串为 RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// ============ 命令常量 ============
export const CMD = {
    SINGLE_COLOR: 0x01,          // 单色模式颜色设置
    ZONE_BRIGHTNESS_SWITCH: 0x02, // 区域亮度开关
    BRIGHTNESS: 0x03,            // 亮度调节
    LIGHT_SWITCH: 0x04,          // 开关控制
    DYNAMIC_MODE: 0x05,          // 动态/静态模式
    MULTI_THEME: 0x06,           // 多色主题预设
    SYNC_MODE: 0x07,             // 同步模式
    DIY_CHANNEL: 0x08,           // DIY 通道颜色
    MODULE_VERSION: 0x09,        // 模块版本信息 (响应)
    VIN_REGISTER: 0x0A,          // VIN 注册
    CAR_CODE: 0x0B,              // 车型编码
    TOTAL_CODE: 0x0C,            // 总编码
    FLOW_LIGHT_NUM: 0x0D,        // 流水灯数量 (左前)
    FLOW_LIGHT_DIR: 0x14,        // 流水灯方向
    DYNAMIC_SOURCE: 0x1A,        // 律动音源
    DYNAMIC_SENSITIVITY: 0x1B,   // 律动灵敏度
    ATTACHMENT: 0x1C,            // 附加功能
    FACTORY_PAGE: 0x22,          // 工厂页面
    REMOTE_LIN: 0x23,            // 远程 LIN 控制
    VIN_RESPONSE: 0x24,          // VIN 注册响应
    DYNAMIC_EFFECT: 0x24,        // 律动模式特效 (1-8)
    MODULE_CONFIG: 0x25,         // 模块配置 (MTU/OTA)
    QUERY: 0xFC,                 // 查询命令
    MODULE_INFO: 0xFD,           // 模块信息响应
    FACTORY_MODE: 0xFE,          // 工厂模式
    FACTORY_RESET: 0xFF,         // 恢复出厂设置
};

// 亮度区域常量
export const ZONE = {
    TOTAL: 0x04,   // 统一亮度
    ZONE1: 0x01,   // 区域1 (左前)
    ZONE2: 0x02,   // 区域2 (右前)
    ZONE3: 0x03,   // 区域3 (后排)
};

// 开关状态常量
export const SWITCH_STATE = {
    OFF: 0x00,           // 关闭
    ON: 0x01,            // 打开
    FOLLOW_CAR: 0x02,    // 跟随车灯
};

// DIY 通道常量
export const CHANNEL = {
    CH1: 0x01,     // 通道1
    CH2: 0x02,     // 通道2
    CH3: 0x03,     // 通道3
    ALL: 0x04,     // 全部通道 (同步模式)
};

// ============ 命令生成函数 ============

/**
 * 生成单色模式颜色命令
 * 格式: <0103RRGGBB>
 * @param {number} r - 红色 (0-255)
 * @param {number} g - 绿色 (0-255)
 * @param {number} b - 蓝色 (0-255)
 */
export function cmdSingleColor(r, g, b) {
    const rgb = rgbToHex(r, g, b);
    return `<0103${rgb}>`;
}

/**
 * 从 hex 颜色字符串生成单色命令
 * @param {string} hexColor - 例如 "#FF00FF"
 */
export function cmdSingleColorHex(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return null;
    return cmdSingleColor(rgb.r, rgb.g, rgb.b);
}

/**
 * 生成区域亮度开关命令
 * 格式: <020101> 或 <020100>
 * @param {boolean} enabled - true 启用区域模式, false 统一模式
 */
export function cmdZoneBrightnessSwitch(enabled) {
    return `<02010${enabled ? '1' : '0'}>`;
}

/**
 * 生成亮度调节命令
 * 格式: <0302ZONEVAL>
 * @param {number} zone - 区域 (ZONE.TOTAL, ZONE.ZONE1, ZONE.ZONE2, ZONE.ZONE3)
 * @param {number} value - 亮度值 (0-255, 通常 0-100)
 */
export function cmdBrightness(zone, value) {
    // 0-10 直接发送，无需映射到 0-100
    // 参考: Android view_light_set_device.xml SeekBar max=10
    // BaseColorFragment.kt 直接发送 progress 值
    return `<03020${zone}${toHex(value)}>`;
}

/**
 * 生成开关控制命令
 * 格式: <04010X>
 * @param {number} state - SWITCH_STATE.OFF / ON / FOLLOW_CAR
 */
export function cmdLightSwitch(state) {
    return `<04010${state}>`;
}

/**
 * 生成动态/静态模式命令
 * 格式: <050101> 或 <050100>
 * @param {boolean} isDynamic - true 动态模式, false 静态模式
 */
export function cmdDynamicMode(isDynamic) {
    return `<05010${isDynamic ? '1' : '0'}>`;
}

/**
 * 生成多色主题预设命令
 * 格式: <0601X>
 * @param {number} themeIndex - 主题索引 (1-10)
 */
export function cmdMultiTheme(themeIndex) {
    const idx = Math.max(1, Math.min(10, themeIndex));
    return `<0601${idx.toString(16).toUpperCase()}>`;
}

/**
 * 生成同步模式命令
 * 格式: <070101> 或 <070100>
 * @param {boolean} isSync - true 同步, false 独立
 */
export function cmdSyncMode(isSync) {
    return `<07010${isSync ? '1' : '0'}>`;
}

/**
 * 生成 DIY 通道颜色命令
 * 格式: <08 LEN CH NUM COLORS>
 * @param {number} channel - CHANNEL.CH1 / CH2 / CH3 / ALL
 * @param {string[]} colors - hex 颜色数组, 例如 ["#FF0000", "#00FF00"]
 */
export function cmdDiyChannel(channel, colors) {
    if (!colors || colors.length === 0) return null;

    const maxColors = 6;
    const validColors = colors.slice(0, maxColors);
    const num = validColors.length;

    // 构建颜色数据
    let colorData = '';
    for (const hex of validColors) {
        const rgb = hexToRgb(hex);
        if (rgb) {
            colorData += rgbToHex(rgb.r, rgb.g, rgb.b);
        }
    }

    // 计算长度: 通道(1) + 数量(1) + RGB数据(num*3)
    const len = num * 3 + 2;

    return `<08${toHex(len)}0${channel}0${num}${colorData}>`;
}

/**
 * 生成查询模块版本命令
 * 格式: <FC0101>
 */
export function cmdQueryVersion() {
    return '<FC0101>';
}

/**
 * 生成查询模块配置命令 (MTU/OTA)
 * 格式: <FC0103>
 */
export function cmdQueryConfig() {
    return '<FC0103>';
}

/**
 * 生成查询模块信息命令
 * 格式: <FC0102>
 */
export function cmdQueryModuleInfo() {
    return '<FC0102>';
}

/**
 * 生成进入/退出工厂模式命令
 * 格式: <FE0101> 进入, <FE0100> 退出
 * @param {boolean} enter - true 进入, false 退出
 */
export function cmdFactoryMode(enter) {
    return `<FE010${enter ? '1' : '0'}>`;
}

/**
 * 生成恢复出厂设置命令
 * 格式: <FF0101>
 */
export function cmdFactoryReset() {
    return '<FF0101>';
}

/**
 * 生成流水灯数量配置命令
 * @param {number} zone - 位置 (0x0D-0x13 对应不同位置)
 * @param {number} count - 灯珠数量
 */
export function cmdFlowLightCount(zone, count) {
    return `<${toHex(zone)}01${toHex(count)}>`;
}

/**
 * 生成流水灯方向配置命令
 * @param {number} zone - 位置
 * @param {boolean} leftToRight - true 从左到右, false 从右到左
 */
export function cmdFlowLightDirection(zone, leftToRight) {
    const pos = 0x14 + (zone - 0x0D);
    return `<${toHex(pos)}010${leftToRight ? '0' : '1'}>`;
}

/**
 * 生成律动音源配置命令
 * @param {boolean} original - true 原车音源, false 麦克风
 */
export function cmdDynamicSource(original) {
    return `<1A010${original ? '1' : '0'}>`;
}

/**
 * 生成律动灵敏度命令
 * @param {number} level - 灵敏度 (1-5)
 */
export function cmdDynamicSensitivity(level) {
    const val = Math.max(1, Math.min(5, level));
    return `<1B010${val}>`;
}

/**
 * 生成附加功能开关命令
 * @param {number} func - 功能类型 (0x1C 欢迎灯, 0x1D 门锁, 0x1E 加速, 0x1F 转向, 0x20 空调, 0x21 仪表)
 * @param {boolean} enabled - true 开启, false 关闭
 */
export function cmdAttachment(func, enabled) {
    return `<${toHex(func)}010${enabled ? '1' : '0'}>`;
}

// 附加功能常量
export const ATTACHMENT = {
    WELCOME: 0x1C,    // 欢迎灯
    DOOR_LOCK: 0x1D,  // 门锁灯
    ACCELERATE: 0x1E, // 加速灯
    TURN_SIGNAL: 0x1F,// 转向灯
    AC: 0x20,         // 空调灯
    DASHBOARD: 0x21,  // 仪表灯
};

// ============ 命令发送辅助类 ============

/**
 * 协议命令管理器
 * 与 BleService 集成发送命令
 */
export class AmbientProtocol {
    constructor(bleService) {
        this.bleService = bleService;
    }

    /**
     * 发送命令文本
     */
    async send(cmdText) {
        if (!this.bleService || !this.bleService.isConnected()) {
            console.warn('[AmbientProtocol] 设备未连接');
            return false;
        }

        console.log('[AmbientProtocol] 发送命令:', cmdText);
        const data = new TextEncoder().encode(cmdText);
        await this.bleService.send(data);
        return true;
    }

    // ============ 快捷方法 ============

    /** 设置单色 */
    async setSingleColor(r, g, b) {
        return this.send(cmdSingleColor(r, g, b));
    }

    /** 设置单色 (hex) */
    async setSingleColorHex(hexColor) {
        const cmd = cmdSingleColorHex(hexColor);
        return cmd ? this.send(cmd) : false;
    }

    /** 设置亮度 */
    async setBrightness(zone, value) {
        return this.send(cmdBrightness(zone, value));
    }

    /** 设置总亮度 */
    async setTotalBrightness(value) {
        return this.send(cmdBrightness(ZONE.TOTAL, value));
    }

    /** 设置区域亮度 */
    async setZoneBrightness(zone1, zone2, zone3) {
        await this.send(cmdBrightness(ZONE.ZONE1, zone1));
        await this.send(cmdBrightness(ZONE.ZONE2, zone2));
        await this.send(cmdBrightness(ZONE.ZONE3, zone3));
        return true;
    }

    /** 设置开关状态 */
    async setSwitch(state) {
        return this.send(cmdLightSwitch(state));
    }

    /** 关闭灯光 */
    async turnOff() {
        return this.send(cmdLightSwitch(SWITCH_STATE.OFF));
    }

    /** 打开灯光 */
    async turnOn() {
        return this.send(cmdLightSwitch(SWITCH_STATE.ON));
    }

    /** 跟随车灯 */
    async followCar() {
        return this.send(cmdLightSwitch(SWITCH_STATE.FOLLOW_CAR));
    }

    /** 设置动态模式开关 */
    async setDynamicMode(isDynamic) {
        return this.send(cmdDynamicMode(isDynamic));
    }

    /** 设置律动特效 (1-8) */
    async setDynamicEffect(index) {
        const idx = Math.max(1, Math.min(8, index));
        return this.send(`<24010${idx}>`);
    }

    /** 设置多色主题 */
    async setMultiTheme(themeIndex) {
        return this.send(cmdMultiTheme(themeIndex));
    }

    /** 设置同步模式 */
    async setSyncMode(isSync) {
        return this.send(cmdSyncMode(isSync));
    }

    /** 设置 DIY 通道颜色 */
    async setDiyChannel(channel, colors) {
        const cmd = cmdDiyChannel(channel, colors);
        return cmd ? this.send(cmd) : false;
    }

    /** 设置区域亮度模式 */
    async setZoneMode(enabled) {
        return this.send(cmdZoneBrightnessSwitch(enabled));
    }

    /** 查询设备信息 */
    async queryDeviceInfo() {
        await this.send(cmdQueryConfig());
        await new Promise(resolve => setTimeout(resolve, 200));
        return this.send(cmdQueryVersion());
    }

    /** 进入工厂模式 */
    async enterFactoryMode() {
        return this.send(cmdFactoryMode(true));
    }

    /** 退出工厂模式 */
    async exitFactoryMode() {
        return this.send(cmdFactoryMode(false));
    }

    /** 读取工厂配置 */
    async readFactoryConfig() {
        return this.send(cmdQueryModuleInfo());  // <FC0102>
    }

    /** 恢复出厂设置 */
    async factoryReset() {
        return this.send(cmdFactoryReset());
    }

    /** 注册 VIN 码 */
    async registerVIN(vin) {
        // 将字符串转为 HEX
        const hexVin = Array.from(vin).map(c => toHex(c.charCodeAt(0))).join('');
        return this.send(`<0A1211${hexVin}>`);
    }

    /** 设置车型编号 */
    async setCarCode(code) {
        return this.send(`<0B01${toHex(code)}>`);
    }

    /** 设置功能编号 */
    async setFunctionCode(code) {
        return this.send(`<0C01${toHex(code)}>`);
    }

    /** 设置音源 */
    async setSoundSource(isMic) {
        return this.send(cmdDynamicSource(!isMic));  // API 反转: 原车=true, 麦克风=false
    }

    /** 设置灵敏度 */
    async setSensitivity(level) {
        return this.send(cmdDynamicSensitivity(level));
    }

    /** 设置高级功能开关 */
    async setAdvancedFeature(featureId, enabled) {
        return this.send(cmdAttachment(featureId, enabled));
    }

    /** 设置 LED 数量 */
    async setLedCount(zoneIndex, count) {
        // Zone 索引映射到命令: 0-5 -> 0x0D,0x0E,0x0F,0x10,0x12,0x13 (跳过 0x11)
        const zoneMap = [0x0D, 0x0E, 0x0F, 0x10, 0x12, 0x13];
        const cmd = zoneMap[zoneIndex] || 0x0D;
        return this.send(`<${toHex(cmd)}01${toHex(count)}>`);
    }

    /** 设置 LED 方向 */
    async setLedDirection(zoneIndex, leftToRight) {
        // Zone 索引映射到方向命令: 0x14-0x19
        const dirMap = [0x14, 0x15, 0x16, 0x17, 0x18, 0x19];
        const cmd = dirMap[zoneIndex] || 0x14;
        return this.send(`<${toHex(cmd)}010${leftToRight ? '0' : '1'}>`);
    }
}

export default AmbientProtocol;
