package auth

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// AuthInfo stores the JWT and GitHub identity after a successful Device Flow.
type AuthInfo struct {
	JWT         string    `json:"jwt"`
	GitHubID    int64     `json:"github_id"`
	GitHubLogin string    `json:"github_login"`
	AvatarURL   string    `json:"avatar_url"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// DeviceInfo stores the per-device UUID and optional friendly name.
type DeviceInfo struct {
	DeviceID   string `json:"device_id"`
	DeviceName string `json:"device_name"`
}

// configDir returns the path to ~/.claude-top/ and creates it if needed.
func configDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("get home dir: %w", err)
	}
	dir := filepath.Join(home, ".claude-top")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", fmt.Errorf("create config dir %s: %w", dir, err)
	}
	return dir, nil
}

// LoadAuth reads and returns the stored AuthInfo, or nil if not present.
// Returns an error only for unexpected I/O or parse failures.
func LoadAuth() (*AuthInfo, error) {
	dir, err := configDir()
	if err != nil {
		return nil, err
	}
	path := filepath.Join(dir, "auth.json")
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read auth.json: %w", err)
	}
	var info AuthInfo
	if err := json.Unmarshal(data, &info); err != nil {
		return nil, fmt.Errorf("parse auth.json: %w", err)
	}
	return &info, nil
}

// SaveAuth writes AuthInfo to ~/.claude-top/auth.json with 0600 permissions.
func SaveAuth(info *AuthInfo) error {
	dir, err := configDir()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(info, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal auth: %w", err)
	}
	path := filepath.Join(dir, "auth.json")
	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("write auth.json: %w", err)
	}
	return nil
}

// IsAuthValid returns true when info is non-nil and the JWT has not expired.
func IsAuthValid(info *AuthInfo) bool {
	if info == nil {
		return false
	}
	return time.Now().Before(info.ExpiresAt)
}

// LoadDevice reads the stored DeviceInfo, or nil if not present.
func LoadDevice() (*DeviceInfo, error) {
	dir, err := configDir()
	if err != nil {
		return nil, err
	}
	path := filepath.Join(dir, "device.json")
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read device.json: %w", err)
	}
	var info DeviceInfo
	if err := json.Unmarshal(data, &info); err != nil {
		return nil, fmt.Errorf("parse device.json: %w", err)
	}
	return &info, nil
}

// SaveDevice writes DeviceInfo to ~/.claude-top/device.json with 0600 permissions.
func SaveDevice(info *DeviceInfo) error {
	dir, err := configDir()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(info, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal device: %w", err)
	}
	path := filepath.Join(dir, "device.json")
	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("write device.json: %w", err)
	}
	return nil
}
