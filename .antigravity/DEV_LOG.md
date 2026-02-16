# DEV_LOG - 2026-02-15

## 任务：项目文档体系建立

### 1. 需求背景
- 增加主 README 说明及 `docs` 详细设计文档，提升项目的可维护性与功能清晰度。

### 3. 工作回顾
1. 创建中文化的 `docs/modes.md`，详细对比 Universe 与 Firework 模式的技术特性。
2. 重写 `README.md`，提供完整的中文化项目全景说明。
4. 创建 `docs/ai_architecture.md`，详述了基于 Demucs 和本地 GPU (4060) 的音源分离架构决策，为后续实现“清晰看到不同乐器表现”奠定理论基础。
5. 成功执行后端 API 联调（基于 `backend/README.md`）：使用 `public/Badminton.mp3` 验证了上传、异步分离及特征 JSON 下载的完整流程。
7. 环境工程化：将前端 API 硬编码地址迁移至环境变量 `VITE_API_BASE_URL`，并提供 `.env.example` 模板，支持远程后端灵活配置。

---
