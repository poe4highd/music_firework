# 🎵 Music Firework - 音乐烟火可视化

Music Firework 是一款高端、实时的音乐视觉艺术工具。它能够将您喜爱的旋律实时转化为惊艳的数字艺术。基于 React 和 Web Audio API 构建。

## ✨ 核心特性

- **双重视觉模式**：在浩瀚的 🪐 **Universe (宇宙)** 与充满诗意的 🎹 **Firework (钢琴烟火)** 模式间自由切换。
- **实时音频分析**：高精度 FFT 处理，确保画面与节奏达到帧级同步。
- **现代 UI 设计**：简洁的暗色系界面，采用玻璃拟态（Glassmorphism）风格控制面板。
- **PWA 优化**：支持独立应用安装，配有高分辨率应用图标。

## 🚀 快速上手

### 环境要求
- Node.js **v22.12.0+** (已通过 `.nvmrc` 配置)

### 安装依赖
```bash
npm install
```

### 开发环境运行
```bash
npm run dev
```

### 生产环境构建
```bash
npm run build
```

## 📖 详细文档
关于每种可视化模式的技术实现和具体特性，请参阅：
👉 [视觉模式技术特性详情](./docs/modes.md)

## 🛠 技术栈
- **框架**：React 19
- **构建工具**：Vite 7
- **样式**：Tailwind CSS 4
- **核心引擎**：Canvas API & Web Audio API
