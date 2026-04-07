---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ["_bmad-output/prd.md"]
project: claude-top
generated: 2026-04-08
---

# claude-top — Epic Breakdown

## Requirements Inventory

### Functional Requirements

- FR1: TUI 内 GitHub Device Flow 认证（无需浏览器回调）
- FR2: 本地 JWT 跨会话保持登录
- FR3: 通过 GitHub 身份识别多设备
- FR4: 首次设置可选设备命名
- FR5: JWT 过期后重新认证
- FR6: `u` 键一键上传当月聚合统计
- FR7: 上传前显示确认框（周期/设备/费用/token数）
- FR8: 多设备统计聚合为月度总量
- FR9: 同设备重复上传同周期执行覆盖
- FR10: 上传后立即返回全球排名
- FR11: 无需认证查看月度排行榜（TOP 100）
- FR12: 任意上传后 5 分钟内更新排行榜
- FR13: 排行榜展示排名/头像/用户名/费用/token数/设备数
- FR14: 固定 URL `/u/:github_login` 访问个人统计页
- FR15: 个人统计页展示排名/月度费用/token数/模型分布/session数
- FR16: OG 图自动生成（Twitter/X、Slack、微信预览）
- FR17: 上传成功后 TUI 展示可分享 URL
- FR18: 统计卡片 URL 永久有效
- FR19: 多台设备同一 GitHub 账号上传
- FR20: 排行榜与统计页反映所有设备合计数据
- FR21: 统计页显示贡献数据的设备数
- FR22: 仅存储聚合统计（不含 prompt/路径）
- FR23: 上传前可查看具体数据内容
- FR24: 运营方可按周期查询高消费用户

### NonFunctional Requirements

- NFR1: 上传 API < 1s p95
- NFR2: 排行榜页面 < 500ms（KV 缓存命中）
- NFR3: OG 图生成 < 2s
- NFR4: JWT HS256，30天有效期，GitHub token 不持久化
- NFR5: 单日 1 万次上传量在 Cloudflare 免费套餐内
- NFR6: D1 不可用时 KV 缓存兜底

### FR Coverage Map

| Epic | Stories | FRs |
|------|---------|-----|
| Epic 1: TUI 认证 | 1.1, 1.2, 1.3 | FR1-5 |
| Epic 2: 上传功能 | 2.1, 2.2 | FR6-10, FR17, FR22-23 |
| Epic 3: 后端 API | 3.1, 3.2, 3.3, 3.4 | FR8-12, FR19-21, FR24 |
| Epic 4: Web 前端 | 4.1, 4.2, 4.3 | FR11-18, FR20-21 |

## Epic List

1. Epic 1: TUI GitHub 认证
2. Epic 2: 上传功能（TUI 侧）
3. Epic 3: Cloudflare Worker 后端
4. Epic 4: Web 前端与社交分享

---

## Epic 1: TUI GitHub 认证

目标：用户在 TUI 内完成 GitHub Device Flow 认证，JWT 本地持久化，多设备通过 github_id 识别。

### Story 1.1: GitHub Device Flow 认证

As a Claude 重度用户,
I want 在 TUI 内按 `u` 触发 GitHub Device Flow 认证，
So that 我无需离开终端完成 GitHub 授权并开始使用上传功能.

**Acceptance Criteria:**

Given 用户未认证
When 用户按 `u` 键
Then TUI 显示设备码和授权 URL (github.com/login/device)
And TUI 轮询 GitHub 直到用户在浏览器完成授权
And 认证成功后 JWT 存储至 `~/.claude-top/auth.json`
And TUI 显示"认证成功，欢迎 @{github_login}"

**Tasks:**
- 实现 `internal/auth/github.go`：Device Flow API 调用（request code → poll token）
- 实现 `internal/auth/storage.go`：auth.json 读写
- 实现 `internal/auth/backend.go`：POST /auth/verify 调用
- 新增 TUI 状态 `viewAuth`，展示设备码 + 进度
- `u` 键路由：未认证 → viewAuth，已认证 → 上传确认

### Story 1.2: 设备 UUID 管理

As a 多设备用户,
I want 每台设备有唯一 UUID，
So that 后端能区分不同设备的上传数据.

**Acceptance Criteria:**

Given 首次在设备上运行
When 触发上传流程
Then 生成并存储 device UUID 至 `~/.claude-top/device.json`
And 可选设置设备名称（默认使用 hostname）
And 后续上传自动使用存储的 device_id

**Tasks:**
- 实现 `internal/auth/device.go`：device.json 读写，UUID 生成
- 首次认证时提示输入设备名（可跳过，默认 hostname）

---

## Epic 2: 上传功能（TUI 侧）

目标：用户按 `u` 键后看到确认框，确认后上传当月数据并显示排名和分享链接。

### Story 2.1: 上传确认 UI

As a 认证用户,
I want 按 `u` 后看到上传确认框（含数据预览），
So that 我在上传前清楚知道将分享的内容.

**Acceptance Criteria:**

Given 用户已认证
When 按 `u` 键
Then 显示确认框：当前周期/设备名/总费用/token 数/session 数
And 按 Enter 确认上传，ESC 取消
And 上传中显示进度状态
And 上传成功后显示：排名 + 分享链接 `claude-top.dev/u/{login}`
And 上传失败显示错误信息（不阻塞主 TUI）

**Tasks:**
- 新增 `viewUploadConfirm` 和 `viewUploadResult` TUI 状态
- 实现当月聚合统计计算（从现有 data 层）
- 渲染确认框和结果框（用 lipgloss）
- `internal/upload/client.go`：POST /api/upload 调用

### Story 2.2: 数据聚合与上传 payload

As a 系统,
I want 将当月所有 session 聚合为一条 payload，
So that 上传内容精确且不含敏感信息.

**Acceptance Criteria:**

Given 用户确认上传
When 系统准备 payload
Then payload 包含：period(YYYY-MM)、device_id、total_cost_usd、total_tokens、input_tokens、output_tokens、cache_read_tokens、cache_write_tokens、session_count、model_breakdown（各模型 token 分布）
And payload 不包含任何 prompt 文本或文件路径
And payload 以 JSON 格式通过 JWT 认证的 POST 请求发送

**Tasks:**
- `internal/upload/aggregator.go`：从现有 data 层计算月度聚合
- 定义 `UploadPayload` struct
- 单元测试聚合逻辑

---

## Epic 3: Cloudflare Worker 后端

目标：提供认证、上传、排行榜 API，数据存储在 D1，排行榜缓存在 KV。

### Story 3.1: 后端项目初始化与 D1 Schema

As a 开发者,
I want 初始化 Cloudflare Worker 项目并建立数据库结构，
So that 后续 API 开发有完整基础.

**Acceptance Criteria:**

Given 空的 backend/ 目录
When 初始化项目
Then 存在 `backend/` Hono/Cloudflare Worker TypeScript 项目
And D1 schema 包含 `devices`、`uploads` 表及正确索引
And KV namespace `LEADERBOARD` 已配置
And `wrangler.toml` 正确配置 D1 和 KV 绑定

**Tasks:**
- `backend/` 目录创建 Cloudflare Worker + Hono 项目
- `backend/schema.sql`：devices、uploads 表 DDL
- `backend/wrangler.toml`：D1、KV、JWT_SECRET 配置

### Story 3.2: 认证端点 POST /auth/verify

As a TUI 客户端,
I want 提交 GitHub access_token 换取 JWT，
So that 后续 API 调用可以用轻量 JWT 认证.

**Acceptance Criteria:**

Given 有效的 GitHub access_token
When POST /auth/verify { token }
Then 调用 GitHub API 获取用户信息（login、id、avatar_url）
And 在 devices 表 upsert 设备记录
And 返回 JWT { github_id, github_login, device_id, exp: 30天 }
And GitHub token 不存储到数据库

Given 无效 token
When POST /auth/verify
Then 返回 401

**Tasks:**
- `backend/src/routes/auth.ts`：verify endpoint
- GitHub User API 调用
- JWT 生成（HS256，30天）
- D1 devices 表 upsert

### Story 3.3: 上传端点 POST /api/upload

As a 认证用户,
I want 上传月度聚合统计，
So that 数据进入后端并触发排行榜更新.

**Acceptance Criteria:**

Given 有效 JWT
When POST /api/upload { period, device_id, cost, tokens... }
Then 在 uploads 表 upsert（UNIQUE device_id+period，执行覆盖）
And 刷新 KV 中该 period 的排行榜缓存
And 返回 { rank, total_users, share_url }

Given 无效或过期 JWT
When POST /api/upload
Then 返回 401

Given 同设备同周期重复上传
When POST /api/upload
Then 覆盖旧数据，重新计算排名

**Tasks:**
- `backend/src/routes/upload.ts`：上传 + D1 upsert + KV 刷新
- D1 聚合查询：按 github_id 合计多设备
- KV 写入 TOP 100 排行榜 JSON
- 排名计算函数

### Story 3.4: 排行榜 API GET /api/leaderboard

As a 访客,
I want 无需认证查看月度排行榜，
So that 我能了解全球 Claude 用量分布.

**Acceptance Criteria:**

Given 有 KV 缓存
When GET /api/leaderboard?period=2026-04
Then 在 < 100ms 内返回 TOP 100 列表（from KV）
And 每条记录含：rank/github_login/avatar_url/total_cost_usd/total_tokens/device_count

Given KV 无缓存（首次或缓存过期）
When GET /api/leaderboard?period=2026-04
Then 从 D1 聚合查询并写入 KV，返回结果

**Tasks:**
- `backend/src/routes/leaderboard.ts`：KV 读取 + D1 fallback
- GET /api/user/:login 个人统计端点

---

## Epic 4: Web 前端与社交分享

目标：提供排行榜页面、个人统计页和 OG 图，驱动病毒式传播。

### Story 4.1: 排行榜 Web 页面

As a 访客,
I want 打开网页看到精美的月度排行榜，
So that 我能了解自己相对其他开发者的用量.

**Acceptance Criteria:**

Given 访问 /leaderboard 或首页
When 页面加载
Then 展示 TOP 100 表格（排名/头像/用户名/费用/token数/设备数）
And 页面加载 < 500ms（KV 缓存命中）
And 支持月份切换

**Tasks:**
- `backend/src/pages/leaderboard.tsx`（或静态 HTML + Hono）
- 排行榜 API 调用与渲染
- 响应式设计

### Story 4.2: 个人统计页 /u/:login

As a 用户,
I want 有专属统计页，
So that 我能分享给朋友展示我的 Claude 用量.

**Acceptance Criteria:**

Given 访问 /u/{github_login}
When 页面加载
Then 展示用户头像/排名/月度费用/token数/模型分布/session数/设备数
And 包含正确的 OG meta 标签（og:image、og:title、og:description）
And 分享到 Twitter/Slack/微信时显示卡片预览

**Tasks:**
- `backend/src/pages/user.tsx`
- OG meta 标签生成
- 用户数据 API 调用

### Story 4.3: OG 图片生成

As a 分享用户,
I want 分享链接时自动生成精美的统计卡片，
So that 在社交媒体上吸引更多人安装工具.

**Acceptance Criteria:**

Given 访问 /og/:github_login.png
When 生成 OG 图
Then 生成 1200×630 图片，含：用户名/头像/排名/月度费用
And 生成时间 < 2s
And 图片 URL 永久有效

**Tasks:**
- `backend/src/routes/og.ts`：使用 Satori 或 resvg 生成 OG 图
- 设计卡片样式（dark theme，Claude 品牌色）
