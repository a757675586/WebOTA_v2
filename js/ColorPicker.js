/**
 * ColorPicker - 颜色选择器组件
 * 基于 Canvas 的 HSL 渐变条颜色选择器
 */
export class ColorPicker {
    constructor(canvasId, indicatorId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.indicator = document.getElementById(indicatorId);
        this.ctx = this.canvas.getContext('2d');

        this.options = {
            onChange: options.onChange || (() => { }),
            onSelect: options.onSelect || (() => { }),
        };

        this.currentHue = 0;
        this.currentColor = { r: 255, g: 0, b: 0 };
        this.isDragging = false;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.drawGradient();
        this.bindEvents();
        this.updateIndicator(0);
    }

    setupCanvas() {
        // 设置高 DPI 支持
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        // 存储实际显示尺寸
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;
    }

    drawGradient() {
        // 绘制 HSL 色相渐变
        const gradient = this.ctx.createLinearGradient(0, 0, this.displayWidth, 0);

        // 添加色相停止点
        const stops = [
            { pos: 0, color: 'hsl(0, 100%, 50%)' },
            { pos: 0.17, color: 'hsl(60, 100%, 50%)' },
            { pos: 0.33, color: 'hsl(120, 100%, 50%)' },
            { pos: 0.5, color: 'hsl(180, 100%, 50%)' },
            { pos: 0.67, color: 'hsl(240, 100%, 50%)' },
            { pos: 0.83, color: 'hsl(300, 100%, 50%)' },
            { pos: 1, color: 'hsl(360, 100%, 50%)' },
        ];

        stops.forEach(stop => {
            gradient.addColorStop(stop.pos, stop.color);
        });

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
    }

    bindEvents() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        document.addEventListener('mousemove', (e) => this.handleMove(e));
        document.addEventListener('mouseup', () => this.handleEnd());

        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        document.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.handleMove(e.touches[0]);
            }
        }, { passive: false });
        document.addEventListener('touchend', () => this.handleEnd());

        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.drawGradient();
            this.updateIndicator(this.currentHue / 360);
        });
    }

    handleStart(e) {
        this.isDragging = true;
        this.updateFromEvent(e);
    }

    handleMove(e) {
        if (!this.isDragging) return;
        this.updateFromEvent(e);
    }

    handleEnd() {
        if (this.isDragging) {
            this.isDragging = false;
            this.options.onSelect(this.currentColor, this.getHexColor());
        }
    }

    updateFromEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;

        // 限制范围
        x = Math.max(0, Math.min(x, this.displayWidth));

        const position = x / this.displayWidth;
        this.currentHue = position * 360;

        this.updateIndicator(position);
        this.updateColor();
    }

    updateIndicator(position) {
        const x = position * this.displayWidth;
        this.indicator.style.left = `${x}px`;
        this.indicator.style.backgroundColor = `hsl(${position * 360}, 100%, 50%)`;
    }

    updateColor() {
        // 将 HSL 转换为 RGB
        this.currentColor = this.hslToRgb(this.currentHue, 100, 50);
        this.options.onChange(this.currentColor, this.getHexColor());
    }

    hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;

        let r, g, b;

        if (h >= 0 && h < 60) {
            [r, g, b] = [c, x, 0];
        } else if (h >= 60 && h < 120) {
            [r, g, b] = [x, c, 0];
        } else if (h >= 120 && h < 180) {
            [r, g, b] = [0, c, x];
        } else if (h >= 180 && h < 240) {
            [r, g, b] = [0, x, c];
        } else if (h >= 240 && h < 300) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    getHexColor() {
        const { r, g, b } = this.currentColor;
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    getRgbColor() {
        return this.currentColor;
    }

    setColor(hex) {
        // 从 hex 设置颜色
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);

            this.currentColor = { r, g, b };

            // 转换为 HSL 并更新指示器
            const hsl = this.rgbToHsl(r, g, b);
            this.currentHue = hsl.h;
            this.updateIndicator(hsl.h / 360);
        }
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
                    break;
                case g:
                    h = ((b - r) / d + 2) * 60;
                    break;
                case b:
                    h = ((r - g) / d + 4) * 60;
                    break;
            }
        }

        return { h, s: 100, l: l * 100 };
    }
}

export default ColorPicker;
