package core

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/a2d2-dev/claude-usage-monitor/internal/data"
)

func TestBuildSessionBlocks_RealData(t *testing.T) {
	home, err := os.UserHomeDir()
	if err != nil {
		t.Fatalf("cannot get home dir: %v", err)
	}
	dataPath := filepath.Join(home, ".claude", "projects")
	if _, err := os.Stat(dataPath); os.IsNotExist(err) {
		t.Skip("no Claude projects data found")
	}

	entries, err := data.LoadEntries(dataPath)
	if err != nil {
		t.Fatalf("LoadEntries: %v", err)
	}

	blocks := BuildSessionBlocks(entries)
	t.Logf("Built %d session blocks from %d entries", len(blocks), len(entries))

	var activeCnt, gapCnt, normalCnt int
	var totalCost float64
	for _, b := range blocks {
		switch {
		case b.IsActive:
			activeCnt++
		case b.IsGap:
			gapCnt++
		default:
			normalCnt++
		}
		totalCost += b.CostUSD
	}

	t.Logf("Active: %d, Gap: %d, Normal: %d", activeCnt, gapCnt, normalCnt)
	t.Logf("Total cost across all sessions: $%.4f", totalCost)

	// Verify block invariants.
	for i, b := range blocks {
		if !b.IsGap {
			if b.StartTime.IsZero() {
				t.Errorf("block %d has zero start time", i)
			}
			if b.EndTime.Before(b.StartTime) {
				t.Errorf("block %d end before start", i)
			}
		}
		if b.CostUSD < 0 {
			t.Errorf("block %d has negative cost: %.6f", i, b.CostUSD)
		}
	}

	// Print summary of last 3 blocks.
	start := len(blocks) - 3
	if start < 0 {
		start = 0
	}
	for _, b := range blocks[start:] {
		if b.IsGap {
			fmt.Printf("  [GAP]  %s → %s\n", b.StartTime.Local().Format("01-02 15:04"), b.EndTime.Local().Format("15:04"))
		} else {
			fmt.Printf("  [SESS] %s active=%-5v msgs=%3d tokens=%7d cost=$%.4f\n",
				b.StartTime.Local().Format("01-02 15:04"),
				b.IsActive, b.MessageCount,
				b.TokenCounts.TotalTokens(), b.CostUSD,
			)
		}
	}
}

// TestBuildSessionBlocks_SourceSplit verifies that Claude and Codex entries in the
// same time window are placed in separate blocks, never merged together.
func TestBuildSessionBlocks_SourceSplit(t *testing.T) {
	base := mustParseTime("2026-04-10T10:00:00Z")

	entries := []data.UsageEntry{
		// Claude entry at T+0
		{Timestamp: base, Source: "claude", Model: "claude-sonnet-4-6", InputTokens: 100, OutputTokens: 50, SessionID: "s1", MessageID: "m1"},
		// Codex entry at T+1m (same hour, different source)
		{Timestamp: base.Add(time.Minute), Source: "codex", Model: "gpt-5-codex", InputTokens: 200, OutputTokens: 80, SessionID: "s2", MessageID: "m2"},
		// Claude entry at T+2m
		{Timestamp: base.Add(2 * time.Minute), Source: "claude", Model: "claude-sonnet-4-6", InputTokens: 150, OutputTokens: 60, SessionID: "s1", MessageID: "m3"},
	}

	blocks := BuildSessionBlocks(entries)

	// Must produce at least 2 blocks (one claude, one codex).
	if len(blocks) < 2 {
		t.Fatalf("expected ≥2 blocks (one per source), got %d", len(blocks))
	}

	// Collect non-gap blocks.
	var nonGap []data.SessionBlock
	for _, b := range blocks {
		if !b.IsGap {
			nonGap = append(nonGap, b)
		}
	}
	if len(nonGap) < 2 {
		t.Fatalf("expected ≥2 non-gap blocks, got %d", len(nonGap))
	}

	// Each non-gap block must have a single Source.
	for _, b := range nonGap {
		for _, e := range b.Entries {
			if e.Source != b.Source {
				t.Errorf("block source=%q contains entry with source=%q", b.Source, e.Source)
			}
		}
	}
}

// TestBuildSessionBlocks_SourceTag verifies that the Source field is correctly
// set to "codex" or "claude" on the resulting blocks.
func TestBuildSessionBlocks_SourceTag(t *testing.T) {
	base := mustParseTime("2026-04-10T10:00:00Z")

	entries := []data.UsageEntry{
		{Timestamp: base, Source: "codex", Model: "gpt-5-codex", InputTokens: 100, OutputTokens: 50, SessionID: "s1", MessageID: "m1"},
		{Timestamp: base.Add(time.Minute), Source: "codex", Model: "gpt-5-codex", InputTokens: 120, OutputTokens: 60, SessionID: "s1", MessageID: "m2"},
	}

	blocks := BuildSessionBlocks(entries)
	var nonGap []data.SessionBlock
	for _, b := range blocks {
		if !b.IsGap {
			nonGap = append(nonGap, b)
		}
	}
	if len(nonGap) != 1 {
		t.Fatalf("expected 1 non-gap block, got %d", len(nonGap))
	}
	if nonGap[0].Source != "codex" {
		t.Errorf("block Source: want 'codex', got %q", nonGap[0].Source)
	}
}

func mustParseTime(s string) time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		panic(err)
	}
	return t
}

func TestNormalizeModel(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"claude-opus-4-6", "Opus 4.6"},
		{"claude-sonnet-4-6", "Sonnet 4.6"},
		{"claude-haiku-4-5-20251001", "Haiku 4.5"},
		{"claude-opus-4-5-20251101", "Opus 4.5"},
		{"claude-3-5-sonnet-20241022", "Sonnet 3.5"},
		{"claude-3-haiku-20240307", "Haiku 3"},
		{"unknown-model", "unknown-model"},
		{"", "unknown"},
	}
	for _, tc := range cases {
		got := normalizeModel(tc.input)
		if got != tc.want {
			t.Errorf("normalizeModel(%q) = %q, want %q", tc.input, got, tc.want)
		}
	}
}
