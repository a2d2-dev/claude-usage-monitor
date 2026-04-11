# Contributing to claude-top

## Development workflow

### Prerequisites

- Go 1.22+
- Node.js 20+ (for npm package testing)
- `pnpm` (preferred over `npm`)

### Running tests

```bash
go test ./...
```

### Building locally

```bash
go run .
```

---

## Release checklist

Before tagging a release, complete the following steps **in order**.

### 1. Run unit tests

```bash
go test ./...
```

All tests must pass. The CI pipeline (`.github/workflows/release.yml`) also enforces this — a failed test job blocks the build and publish steps.

### 2. Run the performance benchmark

Benchmarks are **not** run in CI (cloud runners have unstable performance, making the numbers meaningless for regression detection). Instead, run them locally before each release and compare against the previous baseline.

```bash
go test -bench=. -benchmem -benchtime=3s -timeout=600s ./internal/data/...
```

**What to look for:**

| Benchmark | Baseline (Apple M1) | Concern threshold |
|---|---|---|
| `BenchmarkParseFile` | ~1.80ms/op | > 5ms/op |
| `BenchmarkLoadEntries_1k` | ~400ms/op | > 1.5s/op |
| `BenchmarkLoadEntries_10k` | ~11s/op | > 30s/op |
| `BenchmarkLoadEntries_WarmCache_1k` | ~6ms/op | > 30ms/op |
| `BenchmarkLoadEntries_WarmCache_10k` | ~83ms/op | > 300ms/op |
| `BenchmarkCacheLoad_200k_entries` | ~3µs/op | > 1ms/op |
| `BenchmarkFindJSONLFiles_10k` | ~15ms/op | > 60ms/op |

> **Note:** Cold-parse benchmarks (`LoadEntries_*`) use the same 4-worker parallel pool as
> production `LoadEntries()`. The gob cache is wiped before each iteration, so all 10k JSONL
> files are fully re-parsed. Baseline timings assume OS page cache is warm (files were just
> written by the synthetic data generator).

If any metric crosses its concern threshold, investigate before releasing.

**Interpreting results:**
- Cold parse (`LoadEntries_*`) — first startup with no cache. Expected to be slow at scale; I/O-bound.
- Warm cache (`WarmCache_*`) — steady-state 10s refresh tick. Must stay fast.
- `CacheLoad` — pure gob decode. Should be near-zero thanks to the in-memory mtime cache.

**Saving a baseline snapshot** (recommended before releasing):

```bash
go test -bench=. -benchmem -benchtime=3s -timeout=600s ./internal/data/... \
  | tee bench-$(git describe --tags --abbrev=0).txt
```

### 3. Tag and push

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

CI will run unit tests, then cross-compile for all platforms, publish GitHub Release assets, and publish to npm automatically.

---

## Benchmark context

The benchmarks in `internal/data/bench_test.go` simulate large-scale session datasets:

- **Synthetic data generator** creates realistic `.jsonl` files with configurable session count and messages-per-session.
- **Cold-parse benchmarks** (`LoadEntries_100/1k/5k/10k`) measure worst-case startup time — all files parsed from scratch, no cache.
- **Warm-cache benchmarks** (`WarmCache_1k/10k`) measure the steady-state 10s refresh tick where the cache file has not changed.
- **Cache I/O benchmarks** (`CacheSave/CacheLoad`) measure gob encode/decode in isolation.
- **Utility benchmarks** (`MergeEntries`, `FindJSONLFiles`) isolate deduplication and directory-walk overhead.

The in-memory mtime cache in `loadCache()` is the key optimisation for warm-cache performance. If the cache file on disk has not changed since the last load, the gob decode is skipped entirely (~3µs mtime check vs ~62ms full decode for 200k entries).
