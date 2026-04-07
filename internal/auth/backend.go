package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// VerifyResponse is the response from the backend POST /auth/verify endpoint.
type VerifyResponse struct {
	JWT         string    `json:"jwt"`
	GitHubID    int64     `json:"github_id"`
	GitHubLogin string    `json:"github_login"`
	AvatarURL   string    `json:"avatar_url"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// VerifyWithBackend exchanges a GitHub access_token for a backend JWT by calling
// POST {APIBase}/auth/verify. The GitHub token is never stored locally.
//
// Parameters:
//   - ctx: request context for cancellation / timeout
//   - deviceID: the unique device identifier from EnsureDevice()
//   - accessToken: the GitHub OAuth access token from the Device Flow
//
// Returns the VerifyResponse containing the JWT and GitHub user info.
func VerifyWithBackend(ctx context.Context, deviceID, accessToken string) (*VerifyResponse, error) {
	payload := map[string]string{
		"token":     accessToken,
		"device_id": deviceID,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal verify payload: %w", err)
	}

	url := APIBase + "/auth/verify"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("build verify request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("POST /auth/verify: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read verify response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("backend verify failed (HTTP %d): %s", resp.StatusCode, respBody)
	}

	var result VerifyResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse verify response: %w", err)
	}
	if result.JWT == "" {
		return nil, fmt.Errorf("backend returned empty JWT")
	}
	return &result, nil
}
