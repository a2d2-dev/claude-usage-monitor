---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
workflowType: 'prd'
lastStep: 11
project_name: 'claude-top'
user_name: 'Neov'
date: '2026-04-08'
lastRevised: '2026-04-10'
revisions:
  - date: '2026-04-10'
    summary: '新增 Epic 3：Codex CLI 多源支持 + 双排行榜'
---

# 产品需求文档 — claude-top

**作者：** Neov
**日期：** 2026-04-08

---

## 执行摘要

**claude-top** 是一款开源终端 UI（TUI）工具，直接读取本地 JSONL 日志，实时监控 AI 编码工具（Claude Code、Codex CLI）的 token 用量和费用。面向重度使用 AI 的开发者，帮助他们清晰了解各 session 的消费情况，不被工具边界割裂视图。

新增的**社交排行榜**功能为工具引入社区维度：用户通过 GitHub 认证后，可上传匿名化的月度用量数据，在各工具的独立榜单中查看全球排名，并分享统计卡片——将一款单机效率工具转变为开发者社区的流量入口。

### 核心差异点

- **零配置、本地优先**：直接读取本地 JSONL 日志，无需 API Key 或注册即可使用核心功能
- **多工具统一视图**：同时支持 Claude Code（`~/.claude/projects/`）和 Codex CLI（`~/.codex/sessions/`），一个工具掌握全部 AI 支出
- **多设备聚合**：同一 GitHub 身份跨多台机器，月度用量自动汇总
- **独立排行榜**：Claude Code 和 Codex CLI 用户各玩各的排行榜，公平竞争
- **病毒式统计卡片**：可分享的 URL / 图片驱动开发者圈有机传播
- **商业漏斗清晰**：排行榜天然筛选出高消费用户，是 token 转卖的精准目标客群

## 项目分类

**技术类型：** CLI 工具 + API 后端 + Web 应用（混合型）
**领域：** 开发者工具 / 通用
**复杂度：** 中等
**项目背景：** 棕地项目——在现有开源 TUI 工具基础上扩展

---

## 成功标准

### 用户成功

- 用户安装工具后，30 秒内看到自己的 Claude 消费情况（无需任何配置）
- 用户上传数据后，5 秒内收到全球排名
- 用户分享统计卡片链接，在 Twitter/X、微信、Slack 中正确渲染预览
- 用户在 3 台不同设备上，看到正确合并后的月度总消费

### 业务成功

- **3 个月**：500+ GitHub 账号至少上传过一次
- **6 个月**：2000+ 月活上传用户；月消费 >$50 的前 20% 用户可被识别，用于 token 转卖触达
- **转化率**：排行榜用户中 5%+ 点击 token 转卖入口（上线后）
- **病毒系数**：每位上传用户平均 1.2+ 次统计卡片分享

### 技术成功

- API 在前 1 万用户规模内保持在 Cloudflare 免费套餐内
- 上传接口延迟 < 1 秒（p95）
- 排行榜页面加载 < 500ms（KV 缓存命中）
- 仅存储 GitHub 公开信息（login、avatar、id），零 PII 风险

### 可量化指标

| 指标 | 3 个月 | 6 个月 |
|------|--------|--------|
| 注册 GitHub 账号数 | 200 | 2,000 |
| 月度上传次数 | 400 | 5,000 |
| 排行榜页面访问量 | 2,000 | 20,000 |
| 统计卡片分享次数 | 100 | 1,000 |

## 产品范围

### MVP — 第一阶段

- TUI 内 GitHub OAuth Device Flow（`u` 键触发）
- 多设备支持（每台设备生成 UUID，按 github_id 聚合）
- 上传 API（Cloudflare Worker + D1）
- 基础排行榜页面（按月度总费用）
- 个人统计页 `/u/:github_login`
- 统计卡片 OG 图自动生成（用于社交分享）

### 成长期 — 第二阶段

- 全时间排行榜 + 模型维度排行榜
- 周报 / 排名变动通知
- 排行榜嵌入 Widget
- 针对高消费用户的 token 转卖 CTA

### 愿景 — 第三阶段

- Anthropic 官方 API 验证徽章（待 Anthropic 开放用量查询 API）
- 团队 / 组织排行榜
- Token 交易市场集成

---

## 用户旅程

### 旅程一：Wei——好奇的重度用户

Wei 是深圳某创业公司的高级工程师，频繁使用 Claude Code 做代码审查和架构设计。他隐约觉得花了不少钱，但毫无数据可看。他在 GitHub 上发现了 claude-top，执行 `npx @a2d2/claude-top`，几秒钟后看到上个月消费了 $340，下巴差点掉下来。

他注意到屏幕底部的 `u` 键提示，按下去，经过 GitHub Device Flow（浏览器里 30 秒搞定），上传成功。TUI 显示：**"所有设备合计：$340.50 · 全球排名 #42 · 分享：claude-top.dev/u/wei"**

他把链接丢进团队 Slack，一小时内三个同事装上了这个工具。他成了自发的传播者。

### 旅程二：Sarah——喜欢竞争的开发者

Sarah 是柏林的一名开发者，热爱排行榜文化。她看到一条推文："我这个月在 claude-top 全球排名 #12 🔥 Claude 消费 $1,200"。她点开链接，看到精美的统计卡片，立刻想知道自己的排名。

她装上工具，上传数据，发现自己排 #87。从此她开始关注 TUI 里的每日用量，努力往前冲排名。她每周都会刷一次排行榜页面。她留下来了。

### 旅程三：Neov——多设备重度用户

Neov 家里用 MacBook，公司用 Linux 工作站，两台机器都装了 Claude Code。他希望排行榜上的排名能反映两台设备的合计用量。

他在两台设备上分别按 `u`（同一 GitHub 账号）。服务端在他的 github_id 下存了两条设备记录并聚合。排行榜和统计页显示：`MacBook ($180) + Linux ($220) = 合计 $400`，排名准确。

### 旅程四：运营视角——管理员监控

Neov 作为运营者，登录 Cloudflare 查看 D1 和 KV 面板，了解上传量、TOP 用户消费、错误率。通过一条简单 SQL 找出月消费 >$200 的用户，将其标记为 token 转卖的目标客户：
```sql
SELECT github_login, SUM(cost_usd)
FROM uploads
WHERE period = '2026-04'
GROUP BY github_id
ORDER BY 2 DESC
LIMIT 20;
```

---

## 创新与差异化

### 创新点

- **TUI 内社交排行榜**：现有 Claude 监控工具均无社区/排行榜层；将本地隐私优先与可选社交分享结合
- **Go TUI 内 Device Flow OAuth**：少见的实现路径，无需本地浏览器回调服务
- **统计卡片作为分发机制**：以可分享卡片为主要增长渠道，而非传统应用商店或 SEO

### 验证方式

- 先在 Neov 自己的网络中试运行（吃自己的狗粮）
- 前两周监测统计卡片的分享率
- 分享率 < 0.5 次/上传用户 → 重新设计卡片；> 1.5 次 → 加速推进第二阶段

### 风险对冲

- 若 GitHub OAuth 摩擦过高：增加匿名"访客模式"（仅本地统计，不参与排行榜），保留核心工具价值
- 若超出 Cloudflare 免费额度：D1 + KV 付费套餐中等规模下 < $5/月

---

## CLI 工具专项需求

### 命令结构

```
claude-top                    # 启动 TUI（现有功能）
  u                           # 上传当月统计数据（新功能）
  ESC（在上传确认框内）        # 取消上传
```

### 认证流程

1. 首次上传：GitHub Device Flow（访问 `github.com/login/device`，输入 8 位验证码）
2. JWT 存储至 `~/.claude-top/auth.json`
3. 设备 UUID 及可选名称存储至 `~/.claude-top/device.json`
4. 后续上传：静默使用存储的 JWT，无需再次认证

### 本地配置结构

```
~/.claude-top/
  auth.json      # { jwt, github_id, github_login, expires_at }
  device.json    # { device_id, device_name }
```

---

## 项目范围与分阶段开发

### MVP 策略

**方式：** 体验型 MVP——以最精简的后端交付完整的「上传→排名→分享」体验
**资源：** 1 名开发者（Neov），兼职，约 2-3 周

### MVP 功能集（第一阶段）

**必须有：**
- TUI 内 GitHub Device Flow 认证
- `u` 键触发上传确认框（显示周期、设备、费用、token 数）
- `POST /auth/verify`——验证 GitHub token，返回 JWT
- `POST /api/upload`——存储设备统计，刷新 KV 排行榜缓存
- `GET /api/leaderboard?period=YYYY-MM`——从 KV 返回 TOP 100
- Web 页面：排行榜表格 + 个人统计页（含 OG meta 标签）
- 按 github_id 多设备聚合

**MVP 不含：**
- 全时间排行榜
- 邮件 / 通知
- Token 转卖入口
- 团队排行榜

### 风险对冲

- **技术风险**：Cloudflare D1 SQLite 限制 → 保持查询简单，上传时即时写入 KV 聚合结果
- **市场风险**：分享率低 → 上线前 A/B 测试卡片设计
- **认证摩擦**：Device Flow 约 30 秒——对开发者用户群体可接受

---

## 功能需求

### 认证与身份

- FR1：用户可在 TUI 内通过 GitHub Device Flow 完成认证（无需浏览器重定向回调）
- FR2：用户可通过本地存储的 JWT 在多次 TUI 会话间保持登录状态
- FR3：系统可通过 GitHub 身份识别同一用户在不同设备上的操作
- FR4：用户可在首次设置时为设备命名（可选）
- FR5：用户可在 JWT 过期后重新认证

### 用量数据上传

- FR6：用户可通过单次按键（`u`）上传当月聚合用量统计
- FR7：系统在上传前显示确认框（周期、设备、费用、token 数）
- FR8：系统将同一用户所有设备的统计数据聚合为月度总量
- FR9：同一设备重复上传同一周期的数据时，执行覆盖而非叠加
- FR10：上传完成后立即返回用户当前全球排名

### 排行榜

- FR11：任何访客无需认证即可查看月度排行榜（TOP 100，按总费用）
- FR12：排行榜在任意新上传后 5 分钟内完成更新
- FR13：排行榜展示：排名、GitHub 头像、用户名、总费用、总 token 数、设备数
- FR14：用户可通过固定 URL（`/u/:github_login`）访问个人统计页
- FR15：个人统计页展示：排名、月度费用、token 数、模型分布、session 数

### 社交分享

- FR16：每位用户的统计页自动生成适配 Twitter/X、Slack、微信预览的 OG 图
- FR17：TUI 在上传成功后展示可分享的 URL
- FR18：统计卡片 URL 永久有效，随时可分享（不依赖上传时机）

### 多设备

- FR19：用户可在多台设备上使用同一 GitHub 账号上传数据
- FR20：排行榜与统计页反映所有设备的合计数据
- FR21：统计页显示贡献数据的设备数量

### 数据与隐私

- FR22：系统仅存储聚合统计数据（不含原始 prompt、文件路径、目录名）
- FR23：用户在确认上传前可查看将要上传的具体数据内容
- FR24：运营方可按周期查询高消费用户，用于商业分析

---

## 非功能需求

### 性能

- 上传 API 全球响应时间 < 1 秒（p95，借助 Cloudflare 边缘节点）
- 排行榜页面加载 < 500ms（KV 缓存命中时）
- 统计卡片 OG 图生成 < 2 秒

### 安全

- GitHub OAuth token 不在服务端持久化存储；仅用于一次性身份验证
- JWT 使用服务端密钥签名（HS256），有效期 30 天
- 所有 API 端点强制 HTTPS（由 Cloudflare 保障）
- 上传 payload 经 schema 校验，拒绝任何含敏感数据（prompt、路径）的请求

### 扩展性

- 单日 1 万次上传量需在 Cloudflare 免费套餐内承载
- KV 缓存承接排行榜读流量；D1 写入按 github_id 限速（每设备每小时最多 1 次）
- 架构支持 10 倍增长无需修改代码（升级 Cloudflare 付费套餐即可）

### 可靠性

- D1 临时不可用时，排行榜仍可从 KV 缓存正常提供服务
- TUI 上传失败为非阻塞操作：显示错误信息，核心工具继续正常运行
- 上传操作幂等：重试失败的上传是安全的

### 集成

- GitHub OAuth App：仅需 `read:user` 权限
- Cloudflare D1（SQLite）：主数据存储
- Cloudflare KV：排行榜缓存层
- Web OG 图：通过 Cloudflare Worker 服务端生成（Satori 或同类方案）

---

## Epic 3：Codex CLI 多源支持与双排行榜

> **修订日期：** 2026-04-10
> **背景：** claude-top 的核心价值是「你花了多少钱用 AI」，而不局限于 Claude Code。OpenAI Codex CLI 是另一个重度命令行 AI 工具，同样在本地产生 JSONL 日志。将两者统一在一个工具里，符合 A2D2 / BMAD 开源精神——让开发者对自己的 AI 支出有完整视图，而非被工具边界人为割裂。
> **用户诉求：** 同时使用 Claude Code 和 Codex CLI 的开发者，希望在一个地方看到所有 AI 消费，并在社区排行榜中与"同类"竞争。

---

### 3.1 TUI 多源数据接入

#### 功能需求

- **FR-C01**：TUI 读取 `~/.codex/sessions/YYYY/MM/DD/*.jsonl` 中的 Codex CLI 会话数据
- **FR-C02**：支持 `--source` 启动参数（`all`（默认）/ `claude` / `codex`），控制加载的数据来源
- **FR-C03**：支持 `--codex-path` 参数覆盖 Codex 数据默认路径
- **FR-C04**：`~/.codex/sessions` 不存在时静默忽略，不报错，核心功能不受影响
- **FR-C05**：Codex 数据与 Claude 数据使用相同的 mod-time 文件级缓存机制，避免重复解析

#### Token 字段映射

| Codex 字段 | TUI 内部字段 |
|---|---|
| `input_tokens` | `InputTokens` |
| `cached_input_tokens` | `CacheReadTokens` |
| `output_tokens` + `reasoning_output_tokens` | `OutputTokens` |
| （不适用） | `CacheCreationTokens` = 0 |

---

### 3.0 TUI 配置界面

> 启动参数（`--source`）仅适用于一次性调用；常驻用户需要一个可持久化的配置界面，在 TUI 内直接调整偏好，无需每次重新输入参数。

#### 功能需求

- **FR-C00a**：TUI 新增 **Settings 面板**，通过快捷键（建议 `s`）呼出/关闭，覆盖在当前界面之上（modal 形式）
- **FR-C00b**：Settings 面板提供「数据来源」选项，三档可选：
  ```
  数据来源
  ● 全部（Claude Code + Codex CLI）  ← 默认
  ○ 仅 Claude Code
  ○ 仅 Codex CLI
  ```
- **FR-C00c**：配置持久化至本地文件 `~/.claude-top/config.json`，下次启动自动读取，无需重新设置
- **FR-C00d**：`--source` 命令行参数优先级高于持久化配置（方便脚本/临时覆盖）
- **FR-C00e**：Settings 面板中可设置 Codex 数据路径（默认 `~/.codex/sessions`），方便非标准安装路径的用户

#### 交互设计

```
┌─── Settings ──────────────────────────────┐
│                                           │
│  数据来源                                  │
│  ▶ [●] All (Claude Code + Codex CLI)      │
│    [ ] Claude Code only                   │
│    [ ] Codex CLI only                     │
│                                           │
│  Codex 数据路径                            │
│  > ~/.codex/sessions                      │
│                                           │
│  [Enter] 确认   [Esc] 关闭                │
└───────────────────────────────────────────┘
```

- 使用方向键 ↑↓ 切换选项，`Enter` 确认并立即重新加载数据
- 路径字段支持直接编辑（进入编辑模式后高亮显示）
- 变更立即生效，无需重启 TUI

---

#### 定价（按百万 token，估算值，随官方定价更新）

| 模型 | Input | Cached Input | Output |
|---|---|---|---|
| `codex-mini-latest` | $1.50 | $0.375 | $6.00 |
| `codex-latest` | $3.00 | $0.750 | $12.00 |
| 未知 OpenAI 模型 | 同 codex-mini | — | — |

---

### 3.2 TUI 界面调整

#### Sessions 标签页

- **FR-C06**：每行显示来源前缀：`[C]` = Claude Code，`[X]` = Codex CLI
- **FR-C07**：混合模式（`--source all`）下，按时间倒序统一排列，不分组
- **FR-C08**：`--source claude` 行为与现有版本完全一致（向后兼容）

#### Overview 标签页

- **FR-C09**：ALL-TIME TOTALS 保留合并总数（现有展示不变）
- **FR-C10**：合并总数下方新增 per-source 分组行：
  ```
  ● Claude Code   Tokens: 982,441   Cost: $2.91   Sessions: 47
  ✦ Codex CLI     Tokens: 302,460   Cost: $0.91   Sessions: 14
  ```
- **FR-C11**：仅当本地同时存在两种数据时才展示分组行；单一来源时不显示

---

### 3.3 双排行榜

#### 用户故事

> 作为 Codex CLI 重度用户，我希望在一个与 Claude Code 用户**分开**的排行榜中竞争，因为两个工具的用量数量级和用户群体不同，混合排名没有意义。

#### 功能需求

- **FR-C12**：排行榜页面顶部新增 **Claude Code / Codex CLI** tab 切换，默认显示 Claude Code 榜
- **FR-C13**：两个榜单数据完全独立，互不影响
- **FR-C14**：视觉区分：Claude Code 榜沿用现有配色；Codex CLI 榜采用 OpenAI 绿色系（`#10A37F`）
- **FR-C15**：上传 API 请求体新增 `source` 字段（`"claude"` / `"codex"`），服务端分表或分 namespace 存储
- **FR-C16**：`GET /api/leaderboard` 新增必填查询参数 `source`，现有无参调用返回 `claude`（向后兼容）
- **FR-C17**：个人统计页 `/u/:github_login` 展示该用户**所有来源**的数据（分 section 显示）
- **FR-C18**：TUI 上传时根据 `--source` 参数自动选择目标榜单；`--source all` 时分别上传两份数据

#### 未来预留（本期不实现）

- **FR-C19**：「总榜」tab（合并所有来源，按总 AI 支出排名）——tab 位置预留，内容标注"即将上线"
- **FR-C20**：分享卡片的视觉区分（Codex 卡片使用绿色主题）

---

### 3.4 非功能需求补充

- **NFR-C01**：Codex 数据解析不阻塞 TUI 启动；初次加载时进度提示与 Claude 数据一致
- **NFR-C02**：后端双榜数据隔离，Codex 排行榜的 KV 缓存 key 与 Claude 榜不冲突（namespace 前缀区分）
- **NFR-C03**：缓存版本号从 v2 升至 v3（`UsageEntry` 新增 `Source` 字段），旧缓存自动失效重建

---

### 3.5 成功标准（Epic 3 专项）

- `--source all` 启动后，Sessions 列表正确显示 `[C]`/`[X]` 前缀
- `--source codex` 只显示 Codex 数据，`--source claude` 行为与旧版完全一致
- 排行榜页面 Claude / Codex tab 切换正常，配色明确区分
- Codex 数据上传成功后，Codex 榜排名正确更新
- `~/.codex/sessions` 不存在时，工具正常启动，无报错
