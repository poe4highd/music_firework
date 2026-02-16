# Split Tracks

基于 Demucs 的音乐分离 API 服务。上传音频文件，自动分离为人声、鼓组、贝斯、其他四轨，提取音频特征数据（能量、节拍、频谱质心），返回结构化 JSON。

## 功能

- **音源分离**：使用 `htdemucs_ft` 模型（GPU 加速），分离为 drums / vocals / bass / other
- **特征提取**：基于 librosa 提取 RMS 能量、onset 事件、频谱质心
- **异步处理**：上传后异步处理，支持进度查询
- **可选音频导出**：可选返回分离后的 MP3 文件
- **存储管理**：5GB 空间限额，自动清理 2 月前的旧数据

## 环境要求

- Python 3.12+
- NVIDIA GPU（推荐 RTX 4060 及以上）
- ffmpeg（pydub 依赖）

## 安装

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 启动

```bash
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8002
```

访问 http://localhost:8002/docs 查看交互式 API 文档。

## API 使用方法

### 完整流程示例

```bash
# 第一步：上传音频文件（仅返回 JSON 分析数据）
curl -X POST http://localhost:8002/api/upload \
  -F "file=@你的音乐.mp3"

# 返回: {"task_id":"5aa6c794d0e2","status":"queued","duration":180.5}

# 如果还需要分离后的 MP3 音频文件：
curl -X POST http://localhost:8002/api/upload \
  -F "file=@你的音乐.mp3" \
  -F "include_audio=true"
```

```bash
# 第二步：轮询任务状态（用上一步返回的 task_id）
curl http://localhost:8002/api/task/5aa6c794d0e2

# 处理中: {"task_id":"...","status":"processing","progress":"分离音轨中..."}
# 完成后: {"task_id":"...","status":"completed","files":["/api/download/.../analysis.json",...]}
```

```bash
# 第三步：下载结果
# 下载 JSON 分析数据
curl -o analysis.json http://localhost:8002/api/download/5aa6c794d0e2/analysis.json

# 下载分离后的音频（仅 include_audio=true 时可用）
curl -o drums.mp3  http://localhost:8002/api/download/5aa6c794d0e2/drums.mp3
curl -o vocals.mp3 http://localhost:8002/api/download/5aa6c794d0e2/vocals.mp3
curl -o bass.mp3   http://localhost:8002/api/download/5aa6c794d0e2/bass.mp3
curl -o other.mp3  http://localhost:8002/api/download/5aa6c794d0e2/other.mp3
```

### Python 调用示例

```python
import requests, time

# 上传
resp = requests.post("http://localhost:8002/api/upload",
    files={"file": open("你的音乐.mp3", "rb")},
    data={"include_audio": "false"})
task_id = resp.json()["task_id"]

# 轮询等待完成
while True:
    status = requests.get(f"http://localhost:8002/api/task/{task_id}").json()
    print(f"状态: {status['status']} - {status.get('progress','')}")
    if status["status"] in ("completed", "failed"):
        break
    time.sleep(3)

# 下载 JSON 结果
if status["status"] == "completed":
    for url in status["files"]:
        filename = url.split("/")[-1]
        data = requests.get(f"http://localhost:8002{url}")
        with open(filename, "wb") as f:
            f.write(data.content)
        print(f"已下载: {filename}")
```

### JavaScript (fetch) 调用示例

```javascript
// 上传
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('include_audio', 'false');

const { task_id } = await fetch('http://localhost:8002/api/upload', {
  method: 'POST', body: form
}).then(r => r.json());

// 轮询
const poll = async () => {
  const res = await fetch(`http://localhost:8002/api/task/${task_id}`).then(r => r.json());
  if (res.status === 'completed') return res;
  if (res.status === 'failed') throw new Error(res.error);
  await new Promise(r => setTimeout(r, 3000));
  return poll();
};
const result = await poll();

// 获取 JSON 分析数据
const analysis = await fetch(`http://localhost:8002${result.files[0]}`).then(r => r.json());
console.log(analysis.tracks.drums.events); // 鼓点时间戳
console.log(analysis.tracks.vocals.energy); // 人声能量
```

---

## API 端点参考

### POST /api/upload

上传音频文件，创建分离任务。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 音频文件（mp3/wav/flac/ogg/m4a），时长 ≤10 分钟 |
| `include_audio` | bool | 否 | 是否返回分离后的 MP3，默认 `false` |

### GET /api/task/{task_id}

查询任务状态。状态流转：`queued` → `processing` → `completed` / `failed`

### GET /api/download/{task_id}/{filename}

下载结果文件。可用文件名：`analysis.json`、`drums.mp3`、`vocals.mp3`、`bass.mp3`、`other.mp3`

## JSON 输出格式

详见 [backend_data_spec.md](backend_data_spec.md)。

```json
{
  "version": "1.0",
  "metadata": { "duration": 180.5, "sample_rate": 44100 },
  "tracks": {
    "drums":  { "events": [0.5, 1.0, ...], "energy": [0.0, 0.3, ...] },
    "vocals": { "energy": [...], "centroid": [...] },
    "bass":   { "energy": [...] },
    "other":  { "onsets": [...], "energy": [...] }
  }
}
```

- 能量数据：10Hz 采样（步长 0.1s），逐轨道归一化 0-1
- 频谱质心：映射 200-5000Hz 至 0-1
- 时间戳：秒，保留 3 位小数

## 测试

```bash
# 先启动服务，然后运行测试
uvicorn app.main:app --port 8002 &
python tests/test_e2e.py                # 仅 JSON
python tests/test_e2e.py --include-audio # 含 MP3 导出
```

## 项目结构

```
split_tracks/
├── app/
│   ├── main.py        # FastAPI 路由
│   ├── worker.py      # 异步任务队列 + Demucs 调用
│   ├── analyzer.py    # librosa 特征提取
│   ├── storage.py     # 存储管理（过期清理 + 空间限额）
│   └── config.py      # 配置常量
├── tests/
│   └── test_e2e.py    # 端到端测试
├── data/              # 运行时数据（gitignore）
├── requirements.txt
└── backend_data_spec.md
```
