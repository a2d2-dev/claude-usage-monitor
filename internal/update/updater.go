// Package update implements self-update for the claude-top binary.
// It fetches the latest release from GitHub, downloads the platform binary
// with a live progress bar, and atomically replaces the running executable.
package update

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

const githubRepo = "a2d2-dev/claude-top"

// githubRelease is the subset of the GitHub releases API response we need.
type githubRelease struct {
	// TagName is the release tag, e.g. "v0.3.1".
	TagName string `json:"tag_name"`
	// Assets lists the downloadable files attached to this release.
	Assets []githubAsset `json:"assets"`
}

// githubAsset represents a single downloadable file in a release.
type githubAsset struct {
	// Name is the filename, e.g. "claude-top-darwin-arm64".
	Name string `json:"name"`
	// BrowserDownloadURL is the direct download URL.
	BrowserDownloadURL string `json:"browser_download_url"`
	// Size is the expected file size in bytes (used for progress).
	Size int64 `json:"size"`
}

// LatestVersion fetches the latest release tag from GitHub without downloading
// the binary. Returns the tag string (e.g. "v0.3.1") or an error.
func LatestVersion() (string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", githubRepo)
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("fetch latest release: %w", err)
	}
	defer resp.Body.Close()

	var rel githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
		return "", fmt.Errorf("parse release JSON: %w", err)
	}
	return rel.TagName, nil
}

// Run performs the full self-update flow:
//  1. Fetch the latest release from GitHub.
//  2. Compare with currentVersion; skip if already up to date.
//  3. Detect the platform asset name and find it in the release assets.
//  4. Download the binary to a temp file next to the running executable,
//     printing a live progress bar to stderr.
//  5. Atomically replace the running executable.
//
// currentVersion should be the embedded version string (e.g. "v0.3.0" or "dev").
func Run(currentVersion string) error {
	fmt.Println("Checking for latest version…")

	url := fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", githubRepo)
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("fetch release info: %w", err)
	}
	defer resp.Body.Close()

	var rel githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
		return fmt.Errorf("parse release: %w", err)
	}

	latest := strings.TrimPrefix(rel.TagName, "v")
	current := strings.TrimPrefix(currentVersion, "v")

	if latest == current {
		fmt.Printf("Already up to date (%s)\n", rel.TagName)
		return nil
	}
	if current == "dev" {
		fmt.Printf("Running development build; latest release is %s\n", rel.TagName)
		fmt.Print("Proceed with update? [y/N] ")
		var answer string
		fmt.Scanln(&answer)
		if !strings.EqualFold(strings.TrimSpace(answer), "y") {
			fmt.Println("Aborted.")
			return nil
		}
	}

	assetName := platformAssetName()
	if assetName == "" {
		return fmt.Errorf("unsupported platform: %s/%s", runtime.GOOS, runtime.GOARCH)
	}

	var target *githubAsset
	for i := range rel.Assets {
		if rel.Assets[i].Name == assetName {
			target = &rel.Assets[i]
			break
		}
	}
	if target == nil {
		return fmt.Errorf("asset %q not found in release %s", assetName, rel.TagName)
	}

	// Resolve the path of the running binary.
	binPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("locate executable: %w", err)
	}
	binPath, err = filepath.EvalSymlinks(binPath)
	if err != nil {
		return fmt.Errorf("resolve symlinks: %w", err)
	}

	// Warn if running inside an npm node_modules tree.
	if isNpmInstall(binPath) {
		fmt.Println("Detected npm installation.")
		fmt.Println("To update, run:  npm install -g @a2d2/claude-top")
		return nil
	}

	fmt.Printf("Downloading %s → %s\n", rel.TagName, assetName)

	tmpPath := binPath + ".new"
	if err := downloadWithProgress(target.BrowserDownloadURL, tmpPath, target.Size); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("download: %w", err)
	}

	if err := os.Chmod(tmpPath, 0o755); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("chmod: %w", err)
	}

	// Atomic replace — on Windows os.Rename may fail if the binary is in use,
	// but this is acceptable for a CLI tool.
	if err := os.Rename(tmpPath, binPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("replace binary: %w", err)
	}

	fmt.Printf("\nUpdated to %s — restart claude-top to use the new version.\n", rel.TagName)
	return nil
}

// isNpmInstall returns true when binPath looks like it lives inside a
// node_modules directory (typical of npm global installs).
func isNpmInstall(binPath string) bool {
	return strings.Contains(filepath.ToSlash(binPath), "node_modules")
}

// platformAssetName returns the GitHub release asset filename for the current
// OS/architecture, or "" when the platform is not supported.
func platformAssetName() string {
	switch runtime.GOOS {
	case "darwin":
		switch runtime.GOARCH {
		case "arm64":
			return "claude-top-darwin-arm64"
		case "amd64":
			return "claude-top-darwin-x64"
		}
	case "linux":
		switch runtime.GOARCH {
		case "amd64":
			return "claude-top-linux-x64"
		case "arm64":
			return "claude-top-linux-arm64"
		}
	case "windows":
		if runtime.GOARCH == "amd64" {
			return "claude-top-windows-x64.exe"
		}
	}
	return ""
}

// downloadWithProgress streams url into destPath while printing a live progress
// bar to stderr.  totalBytes is the expected size; 0 means unknown (falls back
// to Content-Length from the response).
func downloadWithProgress(url, destPath string, totalBytes int64) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d from %s", resp.StatusCode, url)
	}

	if totalBytes == 0 {
		totalBytes = resp.ContentLength
	}

	f, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("create temp file: %w", err)
	}
	defer f.Close()

	pr := &progressReader{Reader: resp.Body, total: totalBytes}
	if _, err := io.Copy(f, pr); err != nil {
		return err
	}
	fmt.Fprintln(os.Stderr) // move past the progress line
	return nil
}

// progressReader wraps an io.Reader and prints download progress to stderr.
type progressReader struct {
	io.Reader
	// total is the expected byte count; 0 means unknown.
	total int64
	// downloaded tracks bytes read so far.
	downloaded int64
	// lastPct is the last percentage printed, used to avoid redundant redraws.
	lastPct int
}

// Read implements io.Reader, printing a progress bar after every chunk.
func (r *progressReader) Read(p []byte) (int, error) {
	n, err := r.Reader.Read(p)
	r.downloaded += int64(n)
	r.printProgress()
	return n, err
}

// printProgress writes a \r-terminated progress line to stderr.
func (r *progressReader) printProgress() {
	const barWidth = 40
	if r.total > 0 {
		pct := int(r.downloaded * 100 / r.total)
		if pct == r.lastPct {
			return
		}
		r.lastPct = pct
		filled := barWidth * pct / 100
		bar := strings.Repeat("█", filled) + strings.Repeat("░", barWidth-filled)
		fmt.Fprintf(os.Stderr, "\r[%s] %3d%%  %s / %s",
			bar, pct, formatBytes(r.downloaded), formatBytes(r.total))
	} else {
		// Unknown total — show only bytes downloaded.
		fmt.Fprintf(os.Stderr, "\r%s downloaded", formatBytes(r.downloaded))
	}
}

// formatBytes formats a byte count as a human-readable string.
func formatBytes(b int64) string {
	switch {
	case b >= 1<<20:
		return fmt.Sprintf("%.1f MB", float64(b)/float64(1<<20))
	case b >= 1<<10:
		return fmt.Sprintf("%.1f KB", float64(b)/float64(1<<10))
	default:
		return fmt.Sprintf("%d B", b)
	}
}
