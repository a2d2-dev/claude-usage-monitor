package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
)

// EnsureDevice loads or creates the DeviceInfo for this machine.
// If no device.json exists, a new UUID is generated and hostname is used as
// the default device name. The result is persisted to disk.
func EnsureDevice() (*DeviceInfo, error) {
	info, err := LoadDevice()
	if err != nil {
		return nil, fmt.Errorf("load device: %w", err)
	}
	if info != nil && info.DeviceID != "" {
		return info, nil
	}

	// Generate a new random device UUID (16 bytes → 32-char hex string).
	raw := make([]byte, 16)
	if _, err := rand.Read(raw); err != nil {
		return nil, fmt.Errorf("generate device UUID: %w", err)
	}
	deviceID := hex.EncodeToString(raw)

	// Use hostname as a friendly default name.
	hostname, _ := os.Hostname()
	if hostname == "" {
		hostname = "unknown"
	}

	info = &DeviceInfo{
		DeviceID:   deviceID,
		DeviceName: hostname,
	}
	if err := SaveDevice(info); err != nil {
		return nil, fmt.Errorf("save device: %w", err)
	}
	return info, nil
}
