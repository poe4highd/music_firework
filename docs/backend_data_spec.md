# 后端数据要求说明文档 (Backend Data Requirements)

本文档旨在定义前端可视化引擎所需的后端处理输出规范。前端目前采用“数据驱动”架构，通过加载预处理后的 JSON 数据来执行高性能动画。

---

## 1. 数据交付格式 (Data Format)

- **文件类型**：标准 JSON (`.json`)。
- **编码**：UTF-8。
- **时间单位**：秒 (Float)，保留 3 位小数。
- **采样步长 (Step)**：所有时间序列数据（Energy, Centroid）统一采用 **0.1s** 的固定步长（即 10Hz 采样率）。
- **归一化策略 (Normalization)**：
    - **Energy (能量)**：采用**逐轨道独立归一化** (0.0 - 1.0)。即每音轨的最大能量映射为 1.0，最小映射为 0.0。这确保了即便贝斯绝对能量较低，也能在视觉上产生足够的反馈。
    - **Centroid (质心)**：需将原始频率值 (Hz) **归一化为 0.0 - 1.0**。通常映射范围为轨道定义的有效频段（如 Vocals 映射 200Hz-5000Hz 为 0-1）。

## 2. 核心数据结构 (Root Structure)

JSON 根对象应包含以下轨道数据，对应 Demucs 的四大分类：

```json
{
  "version": "1.0",
  "metadata": {
    "duration": 180.5,           // 音轨总时长
    "sample_rate": 44100        // 原始采样率
  },
  "tracks": {
    "drums": { "events": [...], "energy": [...] },
    "vocals": { "energy": [...], "centroid": [...] },
    "bass": { "energy": [...] },
    "other": { "onsets": [...], "energy": [...] }
  }
}
```

---

## 3. 详细字段说明 (Field Specifications)

### 3.1 鼓组轨道 (Drums) —— 触发点核心
- **`events` (Array<Float>)**: 
  - **内容**：使用 `librosa.onset.onset_detect` 提取的打击起始点时间戳。
  - **用途**：前端每检测到当前播放时间匹配此时间点，即发射一颗主烟火。
- **`energy` (Array<Float>)**:
  - **内容**：每隔 0.1s 采样一次的 RMS 均方根能量值（归一化为 0.0 - 1.0）。
  - **用途**：控制烟火的爆炸力度。

### 3.2 人声轨道 (Vocals) —— 氛围核心
- **`energy` (Array<Float>)**: 
  - **内容**：归一化的能量波形数据 (0.0 - 1.0)。
  - **用途**：控制画面中心发光体的光晕脉动。
- **`centroid` (Array<Float>)**:
  - **内容**：归一化的频谱中心值 (0.0 - 1.0)。
  - **用途**：反映人声音高的相对明暗，用于动态微调烟火色值。

### 3.3 贝斯轨道 (Bass) —— 空间核心
- **`energy` (Array<Float>)**: 
  - **内容**：低频能量包络。
  - **用途**：控制背景草地的闪烁深度和场景震动感。

### 3.4 杂项轨道 (Other/Piano) —— 细节核心
- **`onsets` (Array<Float>)**:
  - **内容**：旋律声部的起始点时间戳。
  - **用途**：触发琴键上方的飘浮音符粒子。
- **`energy` (Array<Float>)**:
  - **内容**：归一化的能量记录 (0.0 - 1.0)，步长 0.1s。
  - **用途**：决定音符粒子的初始大小。

---

## 4. 后端处理建议 (Backend Logic)

为了生成上述数据，后端 Python 环境建议采用以下逻辑：
1. **音源分离**：运行 `demucs -n htdemucs_ft`。
2. **特征提取**：利用 `librosa` 处理各轨道文件：
   - 使用 `librosa.onset.onset_detect(units='time')` 提取时间戳。
   - 使用 `librosa.feature.rms()` 计算包络。
   - 使用 `librosa.feature.spectral_centroid()` 提取音色倾向。
3. **下采样 (Downsampling)**：对于能量包络（RMS），建议下采样至 **10Hz - 20Hz**（即每秒 10-20 个点），以减小 JSON 体积同时保证渲染丝滑。

## 5. 前端验证
前端将根据此文档编写 Mock 数据加载器，即使在没有 4060 显卡处理的情况下也能模拟出全功能的可视化效果。
