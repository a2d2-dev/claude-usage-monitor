#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Map Node.js platform/arch to our npm package names.
const PLATFORM_MAP = {
  "darwin-arm64":  "@a2d2/claude-top-darwin-arm64",
  "darwin-x64":    "@a2d2/claude-top-darwin-x64",
  "linux-x64":     "@a2d2/claude-top-linux-x64",
  "linux-arm64":   "@a2d2/claude-top-linux-arm64",
  "win32-x64":     "@a2d2/claude-top-windows-x64",
};

// Binary name inside each platform package.
const BIN_NAME =
  process.platform === "win32" ? "claude-top.exe" : "claude-top";

/**
 * Locate the platform-specific binary using two strategies:
 *
 * 1. require.resolve — standard Node module resolution; works for both local
 *    and global npm installs as well as most npx environments.
 *
 * 2. Sibling path fallback — when require.resolve fails (e.g. some npx cache
 *    layouts or npm versions that don't expose optional deps to the resolver),
 *    we calculate the sibling package path directly:
 *      __dirname = .../node_modules/@a2d2/claude-top/bin
 *      target    = .../node_modules/@a2d2/<platform-pkg>/bin/<binary>
 *
 * @returns {string} Absolute path to the binary.
 * @throws  {Error}  If neither strategy succeeds.
 */
function findBinary() {
  const key = `${process.platform}-${process.arch}`;
  const pkgName = PLATFORM_MAP[key];

  if (!pkgName) {
    throw new Error(
      `@a2d2/claude-top: unsupported platform "${key}".\n` +
      `Supported: ${Object.keys(PLATFORM_MAP).join(", ")}\n` +
      `Download a binary directly: https://github.com/a2d2-dev/claude-top/releases/latest`
    );
  }

  // Strategy 1: require.resolve (most reliable in normal installs).
  try {
    const pkgJson = require.resolve(`${pkgName}/package.json`);
    const candidate = path.join(path.dirname(pkgJson), "bin", BIN_NAME);
    if (fs.existsSync(candidate)) return candidate;
  } catch (_) {
    // Fall through to strategy 2.
  }

  // Strategy 2: direct sibling path under the same @a2d2 scope directory.
  // Works when require.resolve can't find the package (e.g. certain npx
  // cache layouts) but the binary is still installed alongside this package.
  const pkgBaseName = pkgName.split("/")[1]; // e.g. "claude-top-windows-x64"
  const sibling = path.resolve(__dirname, "..", "..", pkgBaseName, "bin", BIN_NAME);
  if (fs.existsSync(sibling)) return sibling;

  throw new Error(
    `@a2d2/claude-top: could not find platform binary for "${pkgName}".\n\n` +
    `Possible fixes:\n` +
    `  1. Reinstall globally:  npm install -g @a2d2/claude-top\n` +
    `  2. Re-run with npx:     npx @a2d2/claude-top@latest\n` +
    `  3. Download binary:     https://github.com/a2d2-dev/claude-top/releases/latest\n\n` +
    `Searched:\n` +
    `  - require.resolve("${pkgName}/package.json")\n` +
    `  - ${sibling}`
  );
}

let binPath;
try {
  binPath = findBinary();
} catch (err) {
  process.stderr.write(err.message + "\n");
  process.exit(1);
}

const result = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit" });
process.exit(result.status ?? 1);
