/**
 * claude-top Cloudflare Worker — main entry point.
 *
 * Routes:
 *   POST /auth/verify        — exchange GitHub token for JWT
 *   POST /api/upload         — upload monthly usage stats
 *   GET  /api/leaderboard    — monthly leaderboard (KV cached)
 *   GET  /api/user/:login    — individual user stats
 *   GET  /u/:login           — user stats page (HTML)
 *   GET  /og/:login.png      — OG image for social sharing
 *   GET  /                   — leaderboard HTML page
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { uploadRoutes } from './routes/upload';
import { leaderboardRoutes } from './routes/leaderboard';
import { webRoutes } from './routes/web';

/** Cloudflare bindings available to all handlers. */
export interface Bindings {
  DB: D1Database;
  LEADERBOARD: KVNamespace;
  JWT_SECRET: string;
  GITHUB_CLIENT_ID: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// CORS for CLI clients.
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Mount route groups.
app.route('/auth', authRoutes);
app.route('/api', uploadRoutes);
app.route('/api', leaderboardRoutes);
app.route('/', webRoutes);

// Health check.
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
