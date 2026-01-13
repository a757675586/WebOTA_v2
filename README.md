# Web BLE OTA

<div align="center">

**蓝牙固件升级 Web 应用** - 基于 Web Bluetooth API

[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-blue)](https://a757675586.github.io/WebOTA/)

</div>

---

## ✨ 功能特性

- 🔍 **设备连接** - BLE 设备扫描和一键连接
- 📋 **信息读取** - 硬件版本、软件版本、车型信息
- 📊 **MTU 配置** - 自动获取设备 MTU 和帧大小
- 🚀 **OTA 升级** - 固件分帧传输，实时进度显示
- 🎨 **现代 UI** - 玻璃态设计，响应式布局

---

## 🌐 在线访问

部署完成后访问：

```
https://a757675586.github.io/WebOTA/
```

---

## 📱 浏览器支持

| 浏览器 | 桌面版 | 移动端 |
|:------:|:------:|:------:|
| Chrome | ✅ | ✅ Android |
| Edge | ✅ | ✅ Android |
| Opera | ✅ | ✅ |
| Safari | ❌ | ❌ iOS |
| Firefox | ❌ | ❌ |

> ⚠️ **重要**: Web Bluetooth 需要 **HTTPS** 环境，本地开发需使用 `localhost`

---

## 🖥️ 本地运行

### 方法 1: 双击一键启动 (推荐)

```
双击 "启动服务器.bat"
```

### 方法 2: 命令行

```bash
# Python
cd WebOTA
python -m http.server 8080

# 或 Node.js
npx serve -l 8080 .
```

然后浏览器访问: **http://localhost:8080**

---

## 📁 项目结构

```
WebOTA/
├── index.html              # 主页面
├── README.md               # 项目文档
├── 启动服务器.bat           # 一键启动脚本
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages 自动部署
├── css/
│   └── style.css           # 样式文件
└── js/
    ├── app.js              # 主应用逻辑
    ├── BleService.js       # BLE 连接服务
    ├── Protocol.js         # 协议解析
    ├── OtaService.js       # OTA 升级服务
    └── Utils.js            # 工具函数
```

---

## 🔧 协议参考

基于 CarLight Android 应用协议移植：

| 类型 | UUID |
|------|------|
| 服务 | `0000ffe0-0000-1000-8000-00805f9b34fb` |
| 写入特征 | `0000ff03-0000-1000-8000-00805f9b34fb` |
| 通知特征 | `0000ffe1-0000-1000-8000-00805f9b34fb` |

### 命令格式

| 命令 | 代码 | 说明 |
|------|------|------|
| 版本信息 | `<FC0101>` | 获取硬件/软件版本 |
| MTU 配置 | `<FC0103>` | 获取 MTU 和帧大小 |
| 本地升级 | `0xD8` | OTA 固件升级 |

---

## 📝 License

MIT License
