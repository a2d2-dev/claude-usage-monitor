/**
 * POST /auth/verify
 *
 * Receives a GitHub OAuth access_token (from Device Flow) and a device_id.
 * Calls the GitHub User API to verify the token and get user info.
 * Upserts a row in the `devices` D1 table.
 * Returns a signed JWT — the GitHub token is never stored.
 */

import { Hono } from 'hono';
import type { Bindings } from '../index';
import { signJWT } from '../jwt';

export const authRoutes = new Hono<{ Bindings: Bindings }>();

/** GitHub User API response subset. */
interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

authRoutes.post('/verify', async (c) => {
  let body: { token?: string; device_id?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid JSON body' }, 400);
  }

  const { token: accessToken, device_id: deviceId } = body;
  if (!accessToken || !deviceId) {
    return c.json({ error: 'token and device_id are required' }, 400);
  }

  // Verify the GitHub access token by fetching user info.
  const ghResp = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'claude-top/1.0',
    },
  });
  if (!ghResp.ok) {
    return c.json({ error: 'invalid GitHub token' }, 401);
  }

  const ghUser = (await ghResp.json()) as GitHubUser;
  const { id: githubId, login, avatar_url: avatarUrl } = ghUser;

  // Upsert device record — we never store the GitHub access token.
  await c.env.DB.prepare(
    `INSERT INTO devices (github_id, github_login, avatar_url, device_id)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (github_id, device_id)
     DO UPDATE SET github_login = excluded.github_login,
                   avatar_url   = excluded.avatar_url`,
  )
    .bind(githubId, login, avatarUrl, deviceId)
    .run();

  // Issue a 30-day JWT.
  const { token: jwt, expiresAt } = await signJWT(
    c.env.JWT_SECRET,
    githubId,
    login,
    deviceId,
  );

  return c.json({
    jwt,
    github_id: githubId,
    github_login: login,
    avatar_url: avatarUrl,
    expires_at: expiresAt,
  });
});
