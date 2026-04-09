// Package core provides pricing calculation, session analysis, and plan configuration.
package core

import "strings"

// modelPricing holds per-million-token costs for a model tier.
type modelPricing struct {
	// Input is the cost per million input tokens in USD.
	Input float64
	// Output is the cost per million output tokens in USD.
	Output float64
	// CacheCreation is the cost per million cache-write tokens in USD.
	CacheCreation float64
	// CacheRead is the cost per million cache-read tokens in USD.
	CacheRead float64
}

// openAIPricing maps normalized OpenAI model names to pricing tiers.
// Prices per million tokens in USD. Source: OpenAI pricing page (2026).
// CacheCreation = 0 (OpenAI cache is read-only from Codex CLI perspective).
var openAIPricing = map[string]modelPricing{
	// codex-mini-latest
	"codex-mini": {Input: 1.50, Output: 6.00, CacheCreation: 0, CacheRead: 0.375},
	// codex-latest (full)
	"codex": {Input: 3.00, Output: 12.00, CacheCreation: 0, CacheRead: 0.750},
}

// knownPricing maps normalised model names to their pricing tier.
// Prices are per million tokens in USD.
// Source: Anthropic API pricing (2026) — claude-opus-4.6, claude-sonnet-4.6, claude-haiku-4.5.
// Prompt cache: write = 1.25× input price (5-min ephemeral); read = 0.10× input price.
var knownPricing = map[string]modelPricing{
	// claude-opus-4.5, claude-opus-4.6
	"opus": {
		Input:         5.0,
		Output:        25.0,
		CacheCreation: 6.25, // 1.25 × $5
		CacheRead:     0.50, // 0.10 × $5
	},
	// claude-sonnet-4.5, claude-sonnet-4.6
	"sonnet": {
		Input:         3.0,
		Output:        15.0,
		CacheCreation: 3.75, // 1.25 × $3
		CacheRead:     0.30, // 0.10 × $3
	},
	// claude-haiku-4.5
	"haiku": {
		Input:         1.0,
		Output:        5.0,
		CacheCreation: 1.25, // 1.25 × $1
		CacheRead:     0.10, // 0.10 × $1
	},
}

// CalculateCost returns the estimated USD cost for the given token counts and model name.
// The cost is computed from token counts regardless of any cached costUSD field.
func CalculateCost(model string, inputTokens, outputTokens, cacheCreate, cacheRead int) float64 {
	p := pricingForModel(model)
	cost := (float64(inputTokens)/1_000_000)*p.Input +
		(float64(outputTokens)/1_000_000)*p.Output +
		(float64(cacheCreate)/1_000_000)*p.CacheCreation +
		(float64(cacheRead)/1_000_000)*p.CacheRead
	return cost
}

// pricingForModel returns the pricing tier for a given model name.
// Checks OpenAI models first (contains "gpt" or "codex"), then falls through to Anthropic.
// Falls back to sonnet pricing for unknown models.
func pricingForModel(model string) modelPricing {
	lower := strings.ToLower(model)
	// Check OpenAI models before Anthropic checks.
	if strings.Contains(lower, "gpt") || strings.Contains(lower, "codex") {
		if strings.Contains(lower, "mini") {
			return openAIPricing["codex-mini"]
		}
		return openAIPricing["codex"]
	}
	if strings.Contains(lower, "opus") {
		return knownPricing["opus"]
	}
	if strings.Contains(lower, "haiku") {
		return knownPricing["haiku"]
	}
	// Default to sonnet for unknown or sonnet models.
	return knownPricing["sonnet"]
}
