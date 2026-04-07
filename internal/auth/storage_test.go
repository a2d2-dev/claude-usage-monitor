package auth

import (
	"testing"
	"time"
)

// TestIsAuthValid verifies JWT expiry logic.
func TestIsAuthValid(t *testing.T) {
	tests := []struct {
		name  string
		info  *AuthInfo
		valid bool
	}{
		{
			name:  "nil info is not valid",
			info:  nil,
			valid: false,
		},
		{
			name:  "expired JWT is not valid",
			info:  &AuthInfo{JWT: "tok", ExpiresAt: time.Now().Add(-1 * time.Hour)},
			valid: false,
		},
		{
			name:  "future expiry is valid",
			info:  &AuthInfo{JWT: "tok", ExpiresAt: time.Now().Add(24 * time.Hour)},
			valid: true,
		},
		{
			name:  "empty JWT with future expiry is still valid by time (JWT presence not checked)",
			info:  &AuthInfo{JWT: "", ExpiresAt: time.Now().Add(24 * time.Hour)},
			valid: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := IsAuthValid(tc.info)
			if got != tc.valid {
				t.Errorf("IsAuthValid() = %v, want %v", got, tc.valid)
			}
		})
	}
}
