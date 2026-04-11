package ui

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"

	"github.com/a2d2-dev/claude-usage-monitor/internal/config"
	"github.com/a2d2-dev/claude-usage-monitor/internal/core"
	"github.com/a2d2-dev/claude-usage-monitor/internal/data"
)

// ── Settings overlay state ────────────────────────────────────────────────────

// settingsPhase tracks whether the Settings modal is open or closed.
type settingsPhase int

const (
	settingsIdle   settingsPhase = iota // settings modal not shown
	settingsOpen                        // settings modal visible
)

// settingsSourceOption holds a source filter option displayed in the modal.
type settingsSourceOption struct {
	value string // "all", "claude", "codex"
	label string // display label
}

var settingsSourceOptions = []settingsSourceOption{
	{"all", "All sources (Claude Code + Codex CLI)"},
	{"claude", "Claude Code only"},
	{"codex", "Codex CLI only"},
}

// settingsPlanOption holds a plan option displayed in the modal.
type settingsPlanOption struct {
	value string // "pro", "max5", "max20"
	label string // display label
}

var settingsPlanOptions = []settingsPlanOption{
	{"pro",   "Pro"},
	{"max5",  "Max (5×)"},
	{"max20", "Max (20×)"},
}

// settingsSection identifies which section of the settings modal has focus.
type settingsSection int

const (
	settingsSectionSource settingsSection = iota
	settingsSectionPlan
	settingsSectionCodexPath
)

// settingsState holds the UI state for the Settings modal.
type settingsState struct {
	phase     settingsPhase
	section   settingsSection // which section has keyboard focus
	srcCursor int    // index into settingsSourceOptions
	planCursor int   // index into settingsPlanOptions
	selected  string // current source value
	plan      string // current plan value
	codexPath string // editable codex path
	editing   bool   // true when the codex path text field is focused
}

// selectedSourceIndex returns the cursor index for a given source string.
func selectedSourceIndex(source string) int {
	for i, opt := range settingsSourceOptions {
		if opt.value == source {
			return i
		}
	}
	return 0 // default to "all"
}

// selectedPlanIndex returns the cursor index for a given plan key.
func selectedPlanIndex(plan string) int {
	for i, opt := range settingsPlanOptions {
		if opt.value == plan {
			return i
		}
	}
	return 0 // default to "pro"
}

// ── Settings key handler ──────────────────────────────────────────────────────

// handleSettingsKey processes key events when the Settings modal is open.
func (m Model) handleSettingsKey(key string) (Model, settingsReloadMsg) {
	switch key {
	case "esc", "q":
		// Close without saving.
		m.settings.phase = settingsIdle
		return m, settingsReloadMsg{}

	case "tab", "shift+tab":
		// Cycle between sections: Source → Plan → Codex Path → Source
		if m.settings.editing {
			m.settings.editing = false
		} else if key == "shift+tab" {
			m.settings.section = (m.settings.section + settingsSectionCodexPath) % (settingsSectionCodexPath + 1)
		} else {
			m.settings.section = (m.settings.section + 1) % (settingsSectionCodexPath + 1)
			if m.settings.section == settingsSectionCodexPath {
				m.settings.editing = true
			}
		}

	case "up", "k":
		if m.settings.editing {
			break
		}
		switch m.settings.section {
		case settingsSectionSource:
			if m.settings.srcCursor > 0 {
				m.settings.srcCursor--
			}
		case settingsSectionPlan:
			if m.settings.planCursor > 0 {
				m.settings.planCursor--
			}
		}

	case "down", "j":
		if m.settings.editing {
			break
		}
		switch m.settings.section {
		case settingsSectionSource:
			if m.settings.srcCursor < len(settingsSourceOptions)-1 {
				m.settings.srcCursor++
			}
		case settingsSectionPlan:
			if m.settings.planCursor < len(settingsPlanOptions)-1 {
				m.settings.planCursor++
			}
		}

	case "enter":
		if m.settings.editing {
			// Confirm codex path edit.
			m.settings.editing = false
			m.settings.section = settingsSectionSource
		} else {
			// Save all settings and close.
			src := settingsSourceOptions[m.settings.srcCursor].value
			plan := settingsPlanOptions[m.settings.planCursor].value
			m.settings.selected = src
			m.settings.plan = plan
			m.source = src
			m.plan = core.GetPlan(plan)
			m.codexPath = m.settings.codexPath
			m.settings.phase = settingsIdle
			// Persist to config.
			cfg := config.Config{Source: src, Plan: plan, CodexPath: m.settings.codexPath}
			_ = config.Save(cfg)
			return m, settingsReloadMsg{reload: true}
		}

	default:
		// Text input for codex path when editing.
		if m.settings.editing {
			switch key {
			case "backspace":
				if len(m.settings.codexPath) > 0 {
					runes := []rune(m.settings.codexPath)
					m.settings.codexPath = string(runes[:len(runes)-1])
				}
			default:
				if len(key) == 1 {
					m.settings.codexPath += key
				}
			}
		}
	}
	return m, settingsReloadMsg{}
}

// settingsReloadMsg signals that settings were saved and data should reload.
type settingsReloadMsg struct {
	reload bool
}

// ── Settings rendering ────────────────────────────────────────────────────────

// renderSettingsOverlay renders the Settings modal, replacing the content area.
func renderSettingsOverlay(m Model, height int) string {
	innerW := m.width - 4
	if innerW < 40 {
		innerW = 40
	}

	lines := []string{
		sectionTitleStyle.Render("  SETTINGS"),
		"",
	}

	// ── Data Source section ──
	srcActive := m.settings.section == settingsSectionSource
	lines = append(lines, renderSettingsSectionHeader("Data Source", srcActive))
	for i, opt := range settingsSourceOptions {
		isCursor := i == m.settings.srcCursor
		lines = append(lines, renderSettingsOption(opt.label, isCursor, isCursor && srcActive))
	}

	lines = append(lines, "")

	// ── Plan section ──
	planActive := m.settings.section == settingsSectionPlan
	lines = append(lines, renderSettingsSectionHeader("Claude Code Plan", planActive))
	for i, opt := range settingsPlanOptions {
		isCursor := i == m.settings.planCursor
		lines = append(lines, renderSettingsOption(opt.label, isCursor, isCursor && planActive))
	}

	lines = append(lines, "")

	// ── Codex Path field ──
	pathActive := m.settings.section == settingsSectionCodexPath
	lines = append(lines, renderSettingsSectionHeader("Codex Path", pathActive))
	codexPathValue := m.settings.codexPath
	if codexPathValue == "" {
		codexPathValue = mutedStyle.Render("~/.codex/sessions (default)")
	}
	if m.settings.editing {
		codexPathValue = accentValueStyle.Render(codexPathValue + "█")
	}
	lines = append(lines, "    "+codexPathValue)
	lines = append(lines, "")

	// Footer hints.
	if m.settings.editing {
		lines = append(lines, mutedStyle.Render("  Type path  Tab switch  Enter confirm  Esc cancel"))
	} else {
		lines = append(lines, mutedStyle.Render("  ↑↓ select  Tab next section  Enter save  Esc cancel"))
	}

	content := padToHeight(strings.Join(lines, "\n"), height-2)
	boxStyle := cardStyle.Width(innerW).Height(height - 2)
	return boxStyle.Render(content)
}

// renderSettingsSectionHeader renders a section label, highlighted when active.
func renderSettingsSectionHeader(label string, active bool) string {
	if active {
		return accentValueStyle.Render("  " + label + ":")
	}
	return labelStyle.Render("  " + label + ":")
}

// renderSettingsOption renders one source option row in the settings modal.
func renderSettingsOption(label string, isCursor bool, isActive bool) string {
	indicator := "  ○ "
	style := mutedStyle
	if isCursor {
		indicator = "  ● "
		style = lipgloss.NewStyle().Bold(true).Foreground(colorText)
	}
	if isActive {
		indicator = "  ▶ "
		style = lipgloss.NewStyle().Bold(true).Foreground(colorAccent)
	}
	return fmt.Sprintf("%s%s", indicator, style.Render(label))
}

// openSettings opens the Settings modal, pre-populated with current settings.
func (m Model) openSettings() Model {
	m.settings = settingsState{
		phase:      settingsOpen,
		section:    settingsSectionSource,
		srcCursor:  selectedSourceIndex(m.source),
		planCursor: selectedPlanIndex(m.plan.Name),
		selected:   m.source,
		plan:       m.plan.Name,
		codexPath:  m.codexPath,
	}
	return m
}

// buildBlocks converts usage entries to session blocks using the core package.
func buildBlocks(entries []data.UsageEntry) []data.SessionBlock {
	return core.BuildSessionBlocks(entries)
}
