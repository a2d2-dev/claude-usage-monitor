// Package auth handles GitHub OAuth Device Flow authentication and local
// credential storage for the claude-top upload feature.
package auth

// ClientID is the GitHub OAuth App client ID used for Device Flow.
// Override at build time:
//
//	go build -ldflags "-X github.com/a2d2-dev/claude-usage-monitor/internal/auth.ClientID=Ov23liXXXXXX"
var ClientID = "GITHUB_CLIENT_ID_PLACEHOLDER"

// APIBase is the base URL of the claude-top backend API.
// Override at build time:
//
//	go build -ldflags "-X github.com/a2d2-dev/claude-usage-monitor/internal/auth.APIBase=https://claude-top.a2d2.dev"
var APIBase = "https://claude-top.a2d2.dev"

// Scope is the GitHub OAuth scope requested during Device Flow.
const Scope = "read:user"
