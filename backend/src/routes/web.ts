/**
 * Web routes for the leaderboard HTML pages and OG images.
 *
 * GET /             — leaderboard page
 * GET /u/:login     — user stats page with OG meta tags
 * GET /og/:login    — OG image (1200×630) for social sharing
 */

import { Hono } from 'hono';
import type { Bindings } from '../index';
import { buildLeaderboard, queryUserStats } from './leaderboard';

export const webRoutes = new Hono<{ Bindings: Bindings }>();

/** Returns the current YYYY-MM period string. */
function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * escapeHtml encodes the five special HTML characters in a string.
 * Must be applied to ALL user-controlled values before inserting into HTML.
 *
 * @param str - Raw string from user data or DB
 * @returns HTML-safe string
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Leaderboard page ──────────────────────────────────────────────────────────

webRoutes.get('/', async (c) => {
  const period = c.req.query('period') ?? currentPeriod();
  const rows = await buildLeaderboard(c.env.DB, period);

  // Build table rows with all user-supplied fields escaped.
  const tableRows = rows.map((r) => {
    const login = escapeHtml(r.github_login);
    // avatar_url comes from GitHub OAuth — escape it defensively.
    const avatarSrc = escapeHtml(
      r.avatar_url.includes('?') ? `${r.avatar_url}&s=32` : `${r.avatar_url}?s=32`,
    );
    const cost = r.total_cost_usd.toFixed(2);
    const tokens = (r.total_tokens / 1_000_000).toFixed(1);
    return `
    <tr>
      <td class="rank">#${r.rank}</td>
      <td class="user">
        <span class="user-inner">
          <img src="${avatarSrc}" alt="${login}" width="24" height="24" loading="lazy">
          <a href="/u/${login}">@${login}</a>
        </span>
      </td>
      <td class="cost">$${cost}</td>
      <td class="tokens">${tokens}M</td>
      <td class="devices">${r.device_count}</td>
    </tr>`;
  }).join('');

  const safePeriod = escapeHtml(period);

  // Use a plain string template — no tagged-template escaping — so that the
  // pre-escaped tableRows HTML is inserted verbatim.
  const body = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>claude-top 排行榜 ${safePeriod}</title>
  <meta property="og:title" content="claude-top 全球排行榜 ${safePeriod}">
  <meta property="og:description" content="Claude API 月度消费排行榜 — 你用了多少？">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f0f13; color: #e5e7eb; font-family: 'SF Mono', 'Fira Code', monospace; }
    header { background: #7c3aed; padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; }
    header h1 { font-size: 1.4rem; color: #fff; }
    header .sub { color: #c4b5fd; font-size: 0.85rem; }
    .container { max-width: 860px; margin: 2rem auto; padding: 0 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; color: #6b7280; font-size: 0.8rem; padding: 0.5rem; border-bottom: 1px solid #374151; }
    td { padding: 0.55rem 0.5rem; border-bottom: 1px solid #1f2937; vertical-align: middle; }
    .rank { color: #f59e0b; font-weight: bold; width: 3rem; }
    .user-inner { display: flex; align-items: center; gap: 0.5rem; }
    .user-inner img { border-radius: 50%; flex-shrink: 0; }
    .user-inner a { color: #a78bfa; text-decoration: none; }
    .user-inner a:hover { color: #c4b5fd; }
    .cost { color: #34d399; font-weight: bold; }
    .tokens { color: #60a5fa; }
    .devices { color: #9ca3af; font-size: 0.85rem; }
    footer { text-align: center; color: #6b7280; font-size: 0.75rem; margin: 2rem 0; }
    .install { background: #1f2937; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
    .install code { background: #374151; padding: 0.2rem 0.6rem; border-radius: 4px; color: #f59e0b; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>claude-top 排行榜</h1>
      <div class="sub">${safePeriod} · 全球 Claude API 消费排名</div>
    </div>
  </header>
  <div class="container">
    <div class="install">
      安装工具并上传数据：<code>npx @a2d2/claude-top</code> 然后按 <code>u</code>
    </div>
    <table>
      <thead>
        <tr>
          <th>排名</th><th>用户</th><th>费用</th><th>Token 数</th><th>设备数</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
  <footer>claude-top · 数据由用户自愿上传 · 仅含聚合统计</footer>
</body>
</html>`;

  return c.html(body);
});

// ── User stats page ───────────────────────────────────────────────────────────

webRoutes.get('/u/:login', async (c) => {
  const login = c.req.param('login');
  const period = currentPeriod();

  // Query DB directly — avoids Cloudflare Workers loopback self-fetch issues.
  const user = await queryUserStats(c.env.DB, login, period);
  if (!user) {
    return c.html('<h1>用户不存在或暂无数据</h1>', 404);
  }

  const origin = new URL(c.req.url).origin;
  const safeLogin = escapeHtml(user.github_login);
  const safeAvatar = escapeHtml(user.avatar_url);
  const ogImg = `${origin}/og/${encodeURIComponent(login)}`;
  const shareUrl = `${origin}/u/${encodeURIComponent(login)}`;

  const body = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@${safeLogin} 的 Claude 用量统计</title>
  <meta property="og:title" content="@${safeLogin} 的 Claude 用量 ${escapeHtml(period)}">
  <meta property="og:description" content="月消费 $${user.total_cost_usd.toFixed(2)} · 全球排名 #${user.rank}">
  <meta property="og:image" content="${escapeHtml(ogImg)}">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${escapeHtml(ogImg)}">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f0f13; color: #e5e7eb; font-family: 'SF Mono', 'Fira Code', monospace; display: flex; min-height: 100vh; align-items: center; justify-content: center; }
    .card { background: #1f2937; border-radius: 16px; padding: 2.5rem; max-width: 480px; width: 100%; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 1rem; }
    .name { font-size: 1.5rem; font-weight: bold; color: #fff; margin-bottom: 0.2rem; }
    .period { color: #6b7280; font-size: 0.85rem; margin-bottom: 1.5rem; }
    .stat { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #374151; }
    .stat:last-child { border: none; }
    .label { color: #9ca3af; }
    .value { font-weight: bold; }
    .rank-val { color: #f59e0b; }
    .cost-val { color: #34d399; }
    .share { margin-top: 1.5rem; text-align: center; }
    .share a { color: #a78bfa; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="card">
    <img class="avatar" src="${safeAvatar}" alt="${safeLogin}">
    <div class="name">@${safeLogin}</div>
    <div class="period">${escapeHtml(period)}</div>
    <div class="stat"><span class="label">全球排名</span><span class="value rank-val">#${user.rank}</span></div>
    <div class="stat"><span class="label">月度费用</span><span class="value cost-val">$${user.total_cost_usd.toFixed(4)}</span></div>
    <div class="stat"><span class="label">总 Token 数</span><span class="value">${(user.total_tokens / 1_000_000).toFixed(1)}M</span></div>
    <div class="stat"><span class="label">Session 数</span><span class="value">${user.session_count}</span></div>
    <div class="stat"><span class="label">设备数</span><span class="value">${user.device_count}</span></div>
    <div class="share"><a href="/">← 查看排行榜</a></div>
  </div>
</body>
</html>`;

  return c.html(body);
});

// ── OG image ──────────────────────────────────────────────────────────────────

webRoutes.get('/og/:login', async (c) => {
  const login = c.req.param('login');
  const period = currentPeriod();

  // Query DB directly — avoids Cloudflare Workers loopback self-fetch issues.
  const stats = await queryUserStats(c.env.DB, login, period);
  const user = stats ?? { rank: 0, total_cost_usd: 0, total_tokens: 0 };

  // Escape login for SVG text content (SVG uses the same HTML entities).
  const safeLogin = escapeHtml(login);
  const safePeriod = escapeHtml(period);

  // Generate a simple SVG-based OG image (1200×630).
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1e0a3c"/>
      <stop offset="100%" stop-color="#0f0f13"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#7c3aed"/>
  <text x="80" y="100" font-family="monospace" font-size="32" fill="#a78bfa">claude-top</text>
  <text x="80" y="200" font-family="monospace" font-size="72" font-weight="bold" fill="#ffffff">@${safeLogin}</text>
  <text x="80" y="260" font-family="monospace" font-size="28" fill="#6b7280">${safePeriod}</text>
  <text x="80" y="380" font-family="monospace" font-size="36" fill="#9ca3af">全球排名</text>
  <text x="80" y="450" font-family="monospace" font-size="96" font-weight="bold" fill="#f59e0b">#${user.rank}</text>
  <text x="700" y="380" font-family="monospace" font-size="36" fill="#9ca3af">月度消费</text>
  <text x="700" y="450" font-family="monospace" font-size="72" font-weight="bold" fill="#34d399">$${user.total_cost_usd.toFixed(2)}</text>
  <text x="80" y="590" font-family="monospace" font-size="22" fill="#374151">claude-top.a2d2.dev · 你也来上传？ npx @a2d2/claude-top</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
