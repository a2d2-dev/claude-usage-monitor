---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: ["_bmad-output/prd.md"]
project: claude-top
generated: 2026-04-08
lastRevised: 2026-04-10
revision: "Epic 5-6 added for Codex CLI support"
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

**Codex CLI 多源支持（Epic 5-6）**

- FR-C00a: TUI 新增 Settings 面板，`s` 键呼出 modal
- FR-C00b: 数据来源三档选项（全部 / 仅 Claude Code / 仅 Codex CLI）
- FR-C00c: 配置持久化至 `~/.claude-top/config.json`
- FR-C00d: `--source` 命令行参数优先级高于持久化配置
- FR-C00e: Settings 内可修改 Codex 数据路径
- FR-C01: 读取 `~/.codex/sessions/` Codex CLI JSONL 数据
- FR-C02: Sessions tab 每行显示来源前缀 `[C]`/`[X]`
- FR-C03: `--source` 启动参数（all / claude / codex）
- FR-C04: Codex 目录不存在时静默忽略，不报错
- FR-C05: Codex 使用相同 mod-time 文件级缓存机制
- FR-C06: Sessions 每行显示来源前缀（同 FR-C02，界面层实现）
- FR-C07: 混合模式下按时间倒序统一排列，不分组
- FR-C08: `--source claude` 行为与旧版完全一致（向后兼容）
- FR-C09: Overview 保留合并总数（现有展示不变）
- FR-C10: Overview 新增 per-source 分组行（Claude Code + Codex CLI）
- FR-C11: 仅两种数据都存在时显示分组行
- FR-C12: 排行榜页面顶部 Claude Code / Codex CLI tab 切换，默认 Claude Code
- FR-C13: 两榜数据完全独立，互不影响
- FR-C14: Codex 榜使用 OpenAI 绿色系（`#10A37F`）视觉区分
- FR-C15: 上传 API 请求体新增 `source` 字段（"claude" / "codex"）
- FR-C16: `GET /api/leaderboard` 新增 `source` 查询参数，无参数默认返回 claude
- FR-C17: 个人统计页 `/u/:login` 展示该用户所有来源数据（分 section）
- FR-C18: TUI 上传时按 source 自动选择目标榜单；all 时分别上传两份
- FR-C19: 排行榜页面总榜 tab 位置预留，标注"即将上线"（本期不实现）
- FR-C20: 分享卡片视觉区分（后续迭代，本期不实现）
- FR-C21: 排行榜 tab 对应独立 URL（`/leaderboard?source=claude` / `?source=codex`），分享链接直接定位 tab，刷新保持状态

### NonFunctional Requirements

- NFR1: 上传 API < 1s p95
- NFR2: 排行榜页面 < 500ms（KV 缓存命中）
- NFR3: OG 图生成 < 2s
- NFR4: JWT HS256，30天有效期，GitHub token 不持久化
- NFR5: 单日 1 万次上传量在 Cloudflare 免费套餐内
- NFR6: D1 不可用时 KV 缓存兜底
- NFR-C01: Codex 数据解析不阻塞 TUI 启动；初次加载进度提示与 Claude 数据一致
- NFR-C02: 后端双榜 KV namespace 前缀隔离，Codex 与 Claude 缓存 key 不冲突
- NFR-C03: 缓存版本号 v2→v3，旧缓存自动失效重建

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
5. Epic 5: TUI 多源数据视图（Codex CLI 接入）
6. Epic 6: 双排行榜与多源上传

### FR Coverage Map

| Epic | FRs |
|------|-----|
| Epic 1: TUI GitHub 认证 | FR1-5 |
| Epic 2: 上传功能（TUI 侧） | FR6-10, FR17, FR22-23 |
| Epic 3: Cloudflare Worker 后端 | FR8-12, FR19-21, FR24 |
| Epic 4: Web 前端与社交分享 | FR11-18, FR20-21 |
| Epic 5: TUI 多源数据视图 | FR-C00a～e, FR-C01～C11 |
| Epic 6: 双排行榜与多源上传 | FR-C12～C19, FR-C21 |

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

---

## Epic 5: TUI 多源数据视图（Codex CLI 接入）

目标：同时使用 Claude Code 和 Codex CLI 的开发者，在一个 TUI 中看到全部 AI 消费数据，通过 Settings 面板随时切换来源偏好，无需重启。

**FRs:** FR-C00a～e, FR-C01～C11 | **NFRs:** NFR-C01, NFR-C03

### Story 5.1: Codex CLI 数据解析与缓存

As a 同时使用 Claude Code 和 Codex CLI 的开发者,
I want TUI 自动读取我的 Codex CLI 会话数据,
So that 我无需任何配置即可看到 Codex 的用量和费用.

**Acceptance Criteria:**

Given `~/.codex/sessions/` 存在且含 JSONL 文件
When TUI 启动
Then 解析所有 `YYYY/MM/DD/*.jsonl` 文件，提取 token 用量（input/cached_input/output/reasoning）
And 使用 mod-time 文件缓存，仅重新解析有变更的文件（缓存版本升至 v3）
And 所有 Codex 条目标注 `Source: "codex"`，模型来自 `turn_context.payload.model`
And 流式重复 token_count 事件自动去重（仅当 last_token_usage 变化时记录）

Given `~/.codex/sessions/` 不存在
When TUI 启动
Then 静默忽略，正常启动，无报错（NFR-C01）

**Tasks:**
- 新建 `internal/data/codex_reader.go`：parseCodexFile、LoadCodexEntries、LoadCodexCached
- `internal/data/cache.go`：新增 `codexCachePath()`，cacheVersion v2→v3
- `internal/core/pricing.go`：新增 OpenAI 模型定价（codex-mini-latest / codex-latest / 未知模型 fallback）
- `internal/data/models.go`：UsageEntry 和 SessionBlock 新增 `Source string` 字段
- `internal/core/session.go`：`finalizeBlock()` 按 entry source 多数票设置 block.Source
- 单元测试：codex JSONL 解析、去重逻辑、定价计算

### Story 5.2: Sessions Tab 多源展示

As a 多源数据用户,
I want Sessions 列表每行显示 `[C]`/`[X]` 来源前缀,
So that 我能一眼区分 Claude Code 和 Codex CLI 的会话.

**Acceptance Criteria:**

Given `--source all`（默认）
When 查看 Sessions tab
Then 每行前显示 `[C]`（Claude）或 `[X]`（Codex），按时间倒序混合排列
And 列头间距与现有宽度一致

Given `--source claude`
When 查看 Sessions tab
Then 行为与旧版完全一致，无 `[C]` 前缀（向后兼容）

Given `--source codex`
When 查看 Sessions tab
Then 仅显示 Codex 会话，前缀为 `[X]`

**Tasks:**
- `internal/ui/tab_sessions.go`：header 新增 3 字符前缀空间
- `internal/ui/render.go`：`historyDataRow()` 按 `SessionBlock.Source` 输出 `[C]`/`[X]`

### Story 5.3: Overview Tab Per-Source 分组统计

As a 多源数据用户,
I want Overview 页面在合并总数下方看到 Claude / Codex 各自的消费分组,
So that 我清楚每个工具分别花了多少钱.

**Acceptance Criteria:**

Given 本地同时存在 Claude 和 Codex 数据
When 查看 Overview tab
Then ALL-TIME TOTALS 保持合并总数不变
And 其下方新增两行分组：
  `● Claude Code   Tokens: X   Cost: $X   Sessions: N`
  `✦ Codex CLI     Tokens: X   Cost: $X   Sessions: N`

Given 仅有一种来源数据
When 查看 Overview tab
Then 不显示分组行，仅显示合并总数

**Tasks:**
- `internal/ui/tab_overview.go`：统计各 source 的 block 数据，条件渲染分组行

### Story 5.4: Settings 面板（来源切换与路径配置）

As a 用户,
I want 在 TUI 内按 `s` 呼出 Settings 面板，持久化调整数据来源偏好,
So that 每次启动无需重新输入命令行参数.

**Acceptance Criteria:**

Given TUI 运行中
When 按 `s` 键
Then 弹出 Settings modal，显示数据来源选项（全部 / 仅 Claude / 仅 Codex）和 Codex 路径输入框
And 方向键 ↑↓ 切换选项，Enter 确认，Esc 关闭
And 确认后立即重新加载数据，无需重启

Given 用户修改来源偏好并确认
When 下次启动 TUI
Then 自动读取 `~/.claude-top/config.json` 中保存的偏好

Given 同时传入 `--source` 命令行参数
When TUI 启动
Then 命令行参数优先级高于持久化配置

**Tasks:**
- 新建 `internal/config/config.go`：config.json 读写（source、codexPath）
- `internal/ui/settings.go`：Settings modal 渲染（lipgloss）
- `main.go`：新增 `--source`（默认 all）和 `--codex-path` 标志
- `internal/ui/model.go`：新增 sources/codexPath 字段，loadData 调用 LoadAllEntries

---

## Epic 6: 双排行榜与多源上传

目标：Claude Code 和 Codex CLI 用户各有独立排行榜，通过专属 URL 直接分享对应榜单；TUI 按 source 分别上传数据；后端按 source 隔离存储与查询。

**FRs:** FR-C12～C19, FR-C21 | **NFRs:** NFR-C02

### Story 6.1: 后端多源支持（source 字段）

As a 系统,
I want 上传和排行榜 API 支持 `source` 参数,
So that Claude Code 和 Codex CLI 数据完全隔离存储与查询.

**Acceptance Criteria:**

Given POST /api/upload 请求体含 `source: "claude"` 或 `source: "codex"`
When 处理上传
Then 数据存入对应 source 分区（D1 source 字段或独立表）
And KV 缓存 key 含 source 前缀（如 `leaderboard:claude:2026-04`）避免命名冲突（NFR-C02）
And 返回该 source 榜单的用户排名

Given GET /api/leaderboard?period=2026-04&source=claude
When 查询排行榜
Then 返回 Claude Code 榜 TOP 100

Given GET /api/leaderboard?period=2026-04&source=codex
When 查询排行榜
Then 返回 Codex CLI 榜 TOP 100

Given GET /api/leaderboard?period=2026-04（无 source 参数）
When 查询排行榜
Then 默认返回 claude（向后兼容）

**Tasks:**
- `backend/schema.sql`：uploads 表新增 `source` 字段，索引更新
- `backend/src/routes/upload.ts`：接收并存储 source 字段
- `backend/src/routes/leaderboard.ts`：支持 source 查询参数，KV key 加 source 前缀
- 迁移脚本：现有数据补填 `source = "claude"`

### Story 6.2: TUI 多源上传

As a 多源数据用户,
I want TUI 按数据来源分别上传到对应排行榜,
So that 我的 Claude 和 Codex 排名分别出现在各自的榜单上.

**Acceptance Criteria:**

Given `--source all` 且两种数据均存在
When 按 `u` 确认上传
Then 分别上传 Claude 数据（source: "claude"）和 Codex 数据（source: "codex"）
And 确认框显示两份数据预览
And 上传成功后分别显示两个榜单的排名

Given `--source claude`
When 按 `u` 确认上传
Then 仅上传 Claude 数据，行为与旧版一致

Given `--source codex`
When 按 `u` 确认上传
Then 仅上传 Codex 数据

**Tasks:**
- `internal/upload/aggregator.go`：新增 source 参数，按 source 过滤聚合
- `internal/upload/client.go`：payload 新增 source 字段
- `internal/ui/model.go`：all 模式下串行上传两次，结果合并展示

### Story 6.3: 排行榜双 Tab + 独立 URL

As a 开发者,
I want 排行榜页面有 Claude Code 和 Codex CLI 两个独立 tab，且每个 tab 有独立 URL,
So that 我可以直接分享对应榜单链接，朋友打开即看到正确的榜单.

**Acceptance Criteria:**

Given 访问 `/leaderboard` 或 `/leaderboard?source=claude`
When 页面加载
Then 默认显示 Claude Code 榜，tab 高亮 Claude，使用现有配色

Given 访问 `/leaderboard?source=codex`
When 页面加载
Then 直接显示 Codex CLI 榜，tab 高亮 Codex，使用 OpenAI 绿色系（#10A37F）

Given 用户在页面切换 tab
When 点击 Claude / Codex tab
Then URL 随之更新（`?source=claude` / `?source=codex`），刷新保持状态

Given 访问 `/leaderboard?source=all`（总榜预留位）
When 页面加载
Then 显示"总榜（即将上线）"占位提示

**Tasks:**
- `backend/src/pages/leaderboard.tsx`：新增 tab 切换组件，URL 参数驱动
- Codex tab 样式：绿色主题（#10A37F accent）
- 总榜 tab 预留占位 UI
- 更新 leaderboard API 调用，传入 source 参数

### Story 6.4: 个人统计页多源展示

As a 用户,
I want 我的个人统计页 `/u/:login` 展示所有 AI 工具的数据,
So that 访客看到我完整的 AI 使用概况.

**Acceptance Criteria:**

Given 用户同时上传了 Claude 和 Codex 数据
When 访问 `/u/:github_login`
Then 页面分两个 section 展示：Claude Code 排名/费用/token 数，Codex CLI 排名/费用/token 数
And 顶部显示合计总费用

Given 用户仅上传了 Claude 数据
When 访问 `/u/:github_login`
Then 仅显示 Claude section，无 Codex section

**Tasks:**
- `backend/src/pages/user.tsx`：按 source 分 section 渲染
- `backend/src/routes/leaderboard.ts`：GET /api/user/:login 返回多 source 数据
