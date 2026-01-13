@echo off
chcp 65001 >nul
title Web BLE OTA 本地服务器
cls

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║                                                      ║
echo  ║         ⚡ Web BLE OTA 本地服务器                    ║
echo  ║                                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  正在启动服务器...
echo.

cd /d "%~dp0"

:: 检测 Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  ✓ 检测到 Python
    echo.
    echo  ────────────────────────────────────────────────────────
    echo.
    echo  🌐 本地访问: http://localhost:8080
    echo.
    echo  📱 手机访问: 需部署到 GitHub Pages
    echo     https://a757675586.github.io/WebOTA/
    echo.
    echo  ────────────────────────────────────────────────────────
    echo.
    echo  按 Ctrl+C 停止服务器
    echo.
    python -m http.server 8080
    goto :end
)

:: 检测 Python3
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  ✓ 检测到 Python3
    echo.
    echo  ────────────────────────────────────────────────────────
    echo.
    echo  🌐 本地访问: http://localhost:8080
    echo.
    echo  📱 手机访问: 需部署到 GitHub Pages
    echo     https://a757675586.github.io/WebOTA/
    echo.
    echo  ────────────────────────────────────────────────────────
    echo.
    echo  按 Ctrl+C 停止服务器
    echo.
    python3 -m http.server 8080
    goto :end
)

:: 检测 Node.js
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  ✓ 检测到 Node.js
    echo.
    echo  ────────────────────────────────────────────────────────
    echo.
    echo  🌐 本地访问: http://localhost:8080
    echo.
    echo  📱 手机访问: 需部署到 GitHub Pages
    echo     https://a757675586.github.io/WebOTA/
    echo.
    echo  ────────────────────────────────────────────────────────
    echo.
    echo  按 Ctrl+C 停止服务器
    echo.
    npx serve -l 8080 .
    goto :end
)

:: 未找到任何环境
echo.
echo  ❌ 错误: 未找到 Python 或 Node.js
echo.
echo  请安装以下任意一个:
echo    - Python: https://www.python.org/downloads/
echo    - Node.js: https://nodejs.org/
echo.
echo  或者直接使用在线版本:
echo    https://a757675586.github.io/WebOTA/
echo.
pause

:end
