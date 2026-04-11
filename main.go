// claude-usage-monitor is a terminal UI for monitoring Claude Code token and cost usage.
// It reads JSONL session data from ~/.claude/projects and optionally ~/.codex/sessions.
//
// Usage:
//
//	claude-usage-monitor [--claude-path /path/to/projects]
//	                     [--source all|claude|codex] [--codex-path /path/to/codex/sessions]
//
// Plan and other settings are configured interactively with the 's' key inside the TUI.
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/a2d2-dev/claude-usage-monitor/internal/config"
	"github.com/a2d2-dev/claude-usage-monitor/internal/ui"
)

func main() {
	claudePath := flag.String("claude-path", "", "Path to Claude projects dir (default: ~/.claude/projects)")
	source     := flag.String("source", "all", "Data source: all, claude, or codex")
	codexPath  := flag.String("codex-path", "", "Path to Codex sessions dir (default: ~/.codex/sessions)")
	flag.Parse()

	// Load persisted config; CLI flags override only when explicitly provided.
	cfg := config.Load()

	if *source == "all" && cfg.Source != "" && cfg.Source != "all" {
		*source = cfg.Source
	}
	if *codexPath == "" && cfg.CodexPath != "" {
		*codexPath = cfg.CodexPath
	}

	// Validate source flag.
	switch *source {
	case "all", "claude", "codex":
		// valid
	default:
		fmt.Fprintf(os.Stderr, "invalid --source value %q: must be all, claude, or codex\n", *source)
		os.Exit(1)
	}

	// Resolve default Claude data path.
	if *claudePath == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			fmt.Fprintf(os.Stderr, "cannot determine home directory: %v\n", err)
			os.Exit(1)
		}
		*claudePath = filepath.Join(home, ".claude", "projects")
	}

	// Verify Claude data path when it's needed (not codex-only mode).
	if *source != "codex" {
		if _, err := os.Stat(*claudePath); os.IsNotExist(err) {
			fmt.Fprintf(os.Stderr, "claude path does not exist: %s\n", *claudePath)
			os.Exit(1)
		}
	}

	// Plan comes from persisted config; default to "pro".
	planName := cfg.Plan
	if planName == "" {
		planName = "pro"
	}

	model := ui.NewModel(planName, *claudePath, *source, *codexPath)
	prog := tea.NewProgram(model, tea.WithAltScreen())
	if _, err := prog.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "error running monitor: %v\n", err)
		os.Exit(1)
	}
}
