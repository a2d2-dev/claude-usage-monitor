---
id: 1-1
title: GitHub Device Flow 认证
status: ready-for-dev
epic: 1
---

# Story 1.1: GitHub Device Flow 认证

As a Claude 重度用户,
I want 在 TUI 内按 `u` 触发 GitHub Device Flow 认证，
So that 我无需离开终端完成 GitHub 授权并开始使用上传功能.

## Acceptance Criteria

**AC1: 未认证用户按 u 触发认证流程**
Given 用户未认证（无 ~/.claude-top/auth.json 或 JWT 已过期）
When 用户在 Sessions Tab 按 `u`
Then TUI 显示认证面板：设备码、授权 URL（github.com/login/device）、倒计时
And TUI 在后台轮询 GitHub token 状态

**AC2: 用户完成浏览器授权**
Given 用户在浏览器完成授权
When GitHub 轮询返回 access_token
Then TUI 调用 POST {API_BASE}/auth/verify 换取 JWT
And JWT 存储至 ~/.claude-top/auth.json
And TUI 显示"✓ 已认证，@{github_login}"并自动进入上传确认

**AC3: 认证成功持久化**
Given 用户已认证
When 下次启动 TUI 并按 `u`
Then 直接进入上传确认（跳过认证）

**AC4: 取消认证**
Given 认证面板显示中
When 用户按 ESC
Then 取消认证，返回正常 TUI

**AC5: 认证失败处理**
Given 网络错误或 GitHub 返回错误
When 认证流程失败
Then TUI 显示具体错误信息
And 用户可重试

## Technical Notes

- GitHub OAuth App Client ID: 环境变量 CLAUDE_TOP_GITHUB_CLIENT_ID（开发期间硬编码在代码中，后续可配置化）
- Scope: `read:user`
- Device Flow endpoints:
  - POST https://github.com/login/device/code
  - POST https://github.com/login/oauth/access_token
- 后端 API base: https://claude-top.a2d2.dev（开发期间可配置）
- auth.json 格式: `{ "jwt": "...", "github_id": 123, "github_login": "wei", "expires_at": "2026-05-08T..." }`

## Tasks

- [ ] 创建 `internal/auth/` 包
  - [ ] `github.go`: Device Flow 请求码、轮询 token
  - [ ] `storage.go`: auth.json 读写、JWT 过期检查
  - [ ] `backend.go`: POST /auth/verify HTTP 调用
- [ ] 创建 `internal/auth/device.go`: device.json UUID 管理（合并 Story 1.2 基础功能）
- [ ] 在 `internal/ui/model.go` 新增 `viewAuth` 状态
- [ ] 在 `internal/ui/tab_sessions.go` 路由 `u` 键
- [ ] 在 `internal/ui/render.go` 渲染认证面板
- [ ] 单元测试 auth storage 的 JWT 过期检查
