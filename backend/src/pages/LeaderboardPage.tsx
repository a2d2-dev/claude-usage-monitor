/**
 * LeaderboardPage.tsx — 排行榜落地页。
 *
 * 包含：Hero 区、功能特性卡片、使用步骤、CTA 横幅、排行榜表格。
 * 所有动态数据由 Hono JSX 运行时自动转义，无需手动 escapeHtml。
 */

import { Layout, GithubIcon } from './Layout';

/** 单条排行榜数据（来自 buildLeaderboard 查询结果）。 */
export interface LeaderboardRow {
  rank: number;
  github_login: string;
  avatar_url: string;
  total_cost_usd: number;
  total_tokens: number;
  device_count: number;
}

interface LeaderboardPageProps {
  rows: LeaderboardRow[];
  period: string;
}

// ── 功能特性数据 ─────────────────────────────────────────────

const FEATURES = [
  {
    icon: '📊',
    tag: 'F1',
    title: '实时概览',
    desc: '活跃会话进度条、Token 燃烧率、预计剩余时间，每 10 秒自动刷新。',
  },
  {
    icon: '📋',
    tag: 'F2',
    title: 'Session 历史',
    desc: '可排序的历史记录表，钻取任意 Session 查看逐条消息的 Token 拆解。',
  },
  {
    icon: '📅',
    tag: 'F3',
    title: '日历热力图',
    desc: '52 周贡献图，一眼看出你哪天用 Claude 最狠，带每日费用汇总。',
  },
  {
    icon: '🌐',
    tag: 'F4',
    title: '全球排行榜',
    desc: '按 u 键自愿上传本月聚合数据，多设备自动合并，登上全球榜单。',
  },
] as const;

// ── 使用步骤数据 ─────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    title: '安装 CLI',
    desc: '无需全局安装，直接用 npx 运行。claude-top 读取本地 ~/.claude/projects 目录，数据不会自动外传。',
    code: '$ npx @a2d2/claude-top',
  },
  {
    num: '02',
    title: '查看用量',
    desc: '启动后进入终端 TUI 界面，用 1 / 2 / 3 切换概览、Session 列表、日历视图。',
    code: null,
    keys: ['1', '2', '3', '↑↓'],
  },
  {
    num: '03',
    title: '上传并上榜',
    desc: '在主界面按 u，工具将本月聚合统计（费用、Token 数、设备数）上传至排行榜，仅含汇总数字，不含任何 prompt 内容。',
    code: '✓ Uploaded! Global rank: #42',
    codeColor: 'var(--green)',
  },
] as const;

// ── 子组件 ────────────────────────────────────────────────────

/** 页面私有样式（仅排行榜页用到的部分）。 */
const pageStyles = `
/* ── Hero ── */
.hero {
  position: relative; z-index: 1;
  max-width: 960px; margin: 0 auto;
  padding: 4rem 1.5rem 3rem;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 3rem; align-items: center;
}
@media (max-width: 640px) {
  .hero { grid-template-columns: 1fr; gap: 2rem; }
  .hero-terminal { display: none; }
}
.hero-glow {
  position: absolute; border-radius: 50%;
  background: hsl(198 93% 59% / 0.08); filter: blur(80px);
  pointer-events: none;
}
.hero-badge {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-family: 'Space Mono', monospace; font-size: 0.75rem;
  color: var(--primary);
  background: var(--primary-10); border: 1px solid var(--primary-30);
  padding: 0.25rem 0.75rem; border-radius: 999px;
  margin-bottom: 1.25rem;
}
.hero-badge-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--primary);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.hero h1 {
  font-size: clamp(2rem, 5vw, 3rem); font-weight: 700;
  line-height: 1.15; letter-spacing: -0.03em; color: #fff;
  margin-bottom: 1rem;
}
.hero-sub {
  color: var(--text-muted); font-size: 1rem; line-height: 1.7;
  margin-bottom: 1.75rem; max-width: 440px;
}
.hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.hero-badges {
  display: flex; gap: 1.25rem;
  font-size: 0.8rem; color: var(--text-dim);
}
.hero-badges span {
  display: flex; align-items: center; gap: 0.35rem;
}
.hero-badges span::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); display: inline-block;
}

/* ── 终端窗口 ── */
.terminal {
  background: linear-gradient(180deg, hsl(220 18% 12%) 0%, hsl(220 18% 8%) 100%);
  border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
  font-family: 'Space Mono', monospace; font-size: 0.78rem;
  box-shadow: var(--glow);
}
.term-bar {
  background: hsl(220 18% 14%);
  padding: 0.65rem 1rem;
  display: flex; align-items: center; gap: 0.4rem;
  border-bottom: 1px solid var(--border);
}
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-r { background: #ff5f57; }
.dot-y { background: #febc2e; }
.dot-g { background: #28c840; }
.term-title { margin-left: auto; color: var(--text-dim); font-size: 0.7rem; }
.term-body { padding: 1rem 1.25rem; line-height: 2; }
.t-prompt { color: var(--text-dim); }
.t-cmd { color: var(--primary); }
.t-out  { color: var(--text-muted); }
.t-ok   { color: var(--green); }
.t-hi   { color: var(--amber); }

/* ── 分节 ── */
.section {
  position: relative; z-index: 1;
  max-width: 960px; margin: 0 auto; padding: 4.5rem 1.5rem;
}
.section-bg {
  background: linear-gradient(180deg, transparent, hsl(198 93% 59% / 0.04), transparent);
}
.section-header { text-align: center; margin-bottom: 3rem; }
.section-tag {
  display: inline-block;
  font-family: 'Space Mono', monospace; font-size: 0.7rem;
  color: var(--primary); letter-spacing: 0.12em; text-transform: uppercase;
  margin-bottom: 0.75rem;
}
.section-title {
  font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 700;
  color: #fff; letter-spacing: -0.02em; margin-bottom: 0.6rem;
}
.section-sub {
  color: var(--text-muted); font-size: 0.95rem;
  max-width: 520px; margin: 0 auto; line-height: 1.65;
}
.section-divider {
  border: none; border-top: 1px solid var(--border); margin: 0;
  position: relative; z-index: 1;
}

/* ── 功能卡片 ── */
.features-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}
.feat-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; padding: 1.4rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  animation: fade-in-up 0.5s ease-out forwards; opacity: 0;
}
.feat-card:hover { border-color: var(--primary-30); box-shadow: var(--glow-card); }
.feat-icon {
  width: 40px; height: 40px;
  background: var(--primary-10); border: 1px solid var(--primary-20);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; margin-bottom: 1rem;
}
.feat-tag {
  float: right; margin-top: 0.15rem;
  font-family: 'Space Mono', monospace; font-size: 0.65rem;
  color: var(--text-dim); letter-spacing: 0.1em; text-transform: uppercase;
}
.feat-title { font-size: 0.95rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem; }
.feat-desc  { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; }

/* ── 步骤 ── */
.steps { max-width: 680px; margin: 0 auto; }
.step  {
  position: relative; display: flex; gap: 1.5rem;
  padding-bottom: 2.5rem;
}
.step:last-child { padding-bottom: 0; }
.step-line {
  position: absolute; left: 23px; top: 48px; bottom: 0; width: 1px;
  background: linear-gradient(to bottom, var(--primary-30), transparent);
}
.step-num {
  flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%;
  background: var(--primary-10); border: 1px solid var(--primary-30);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Space Mono', monospace; font-size: 0.78rem;
  font-weight: 700; color: var(--primary); position: relative; z-index: 1;
}
.step-content { flex: 1; padding-top: 0.6rem; }
.step-title {
  font-size: 1.05rem; font-weight: 600; color: #fff;
  margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;
}
.step-title-check { color: var(--green); font-size: 0.9rem; }
.step-desc { color: var(--text-muted); font-size: 0.875rem; line-height: 1.65; margin-bottom: 0.75rem; }
.step-code {
  display: inline-block;
  font-family: 'Space Mono', monospace; font-size: 0.78rem;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 7px; padding: 0.55rem 1rem;
}
.step-keys { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.step-key {
  font-family: 'Space Mono', monospace; font-size: 0.72rem;
  background: hsl(38 92% 50% / 0.1); border: 1px solid hsl(38 92% 50% / 0.3);
  color: var(--amber); padding: 0.15rem 0.5rem; border-radius: 4px;
}

/* ── CTA 横幅 ── */
.cta-strip {
  position: relative; z-index: 1;
  background: linear-gradient(135deg, hsl(220 20% 8%) 0%, hsl(220 20% 12%) 100%);
  border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  overflow: hidden;
}
.cta-glow {
  position: absolute; bottom: -100px; left: 50%;
  transform: translateX(-50%);
  width: 600px; height: 300px;
  background: hsl(198 93% 59% / 0.12); border-radius: 50%; filter: blur(60px);
}
.cta-inner {
  position: relative; z-index: 1;
  max-width: 720px; margin: 0 auto;
  padding: 4rem 1.5rem; text-align: center;
}
.cta-badge {
  display: inline-flex; align-items: center; gap: 0.5rem;
  border: 1px solid var(--primary-30); background: var(--primary-10);
  padding: 0.35rem 1rem; border-radius: 999px;
  font-size: 0.82rem; color: var(--text); margin-bottom: 1.75rem;
}
.cta-inner h2 {
  font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 700;
  color: #fff; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 0.75rem;
}
.cta-inner p { color: var(--text-muted); font-size: 0.95rem; line-height: 1.65; margin-bottom: 2rem; }
.cta-btns { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2.5rem; }
.cta-tools {
  border-top: 1px solid hsl(215 19% 34% / 0.5);
  padding-top: 1.75rem; color: var(--text-dim); font-size: 0.8rem;
}
.cta-tools-row {
  display: flex; justify-content: center; gap: 2rem; margin-top: 0.75rem;
  font-family: 'Space Mono', monospace; font-size: 0.78rem; color: var(--text-dim);
}

/* ── 排行榜 ── */
.lb-header {
  position: relative; z-index: 1;
  max-width: 960px; margin: 0 auto;
  padding: 2.5rem 1.5rem 0.5rem;
  display: flex; align-items: baseline; gap: 1rem;
}
.lb-title { font-size: 1.15rem; font-weight: 700; color: #fff; }
.lb-period {
  font-family: 'Space Mono', monospace; font-size: 0.72rem;
  color: var(--primary);
  background: var(--primary-10); border: 1px solid var(--primary-30);
  padding: 0.2rem 0.65rem; border-radius: 6px;
}
.table-wrap {
  position: relative; z-index: 1;
  max-width: 960px; margin: 0 auto 3rem; padding: 0 1.5rem;
}
.table-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
  box-shadow: var(--glow-card);
}
table { width: 100%; border-collapse: collapse; }
thead tr {
  background: hsl(198 93% 59% / 0.04);
  border-bottom: 1px solid var(--border);
}
th {
  text-align: left; color: var(--text-dim);
  font-size: 0.68rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 0.75rem 1rem;
  font-family: 'Space Mono', monospace;
}
tbody tr { border-bottom: 1px solid hsl(215 19% 34% / 0.4); transition: background 0.12s; }
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--bg-card-hover); }
td { padding: 0.75rem 1rem; vertical-align: middle; }
.rank-badge { font-family: 'Space Mono', monospace; font-size: 0.85rem; color: var(--text-dim); }
.user-inner { display: flex; align-items: center; gap: 0.6rem; }
.user-inner img { border-radius: 50%; flex-shrink: 0; border: 1px solid var(--border); }
.user-link { color: var(--text); text-decoration: none; font-weight: 500; font-size: 0.9rem; }
.user-link:hover { color: var(--primary); }
.gh-link { color: var(--text-dim); display: flex; align-items: center; transition: color 0.12s; }
.gh-link:hover { color: var(--text-muted); }
.cost-val { font-family: 'Space Mono', monospace; font-size: 0.88rem; color: var(--green); font-weight: 700; }
.token-val { font-family: 'Space Mono', monospace; font-size: 0.88rem; color: hsl(198 93% 59%); }
td:last-child { color: var(--text-dim); font-family: 'Space Mono', monospace; font-size: 0.82rem; }
`;

// ── 子组件 ────────────────────────────────────────────────────

/** 终端动效块（Hero 右栏）。 */
const TerminalBlock = () => (
  <div class="hero-terminal terminal">
    <div class="term-bar">
      <span class="dot dot-r" />
      <span class="dot dot-y" />
      <span class="dot dot-g" />
      <span class="term-title">claude-top — monitor mode</span>
    </div>
    <div class="term-body">
      <div><span class="t-prompt">$ </span><span class="t-cmd">npx @a2d2/claude-top</span></div>
      <div class="t-out">  Analyzing Claude usage data...</div>
      <div class="t-out">  Found <span class="t-hi">847</span> sessions across <span class="t-hi">3</span> devices</div>
      <div class="t-out">  Total cost this month: <span class="t-ok">$12.40</span></div>
      <div class="t-out">  Press <span class="t-hi">u</span> to upload &amp; join leaderboard</div>
      <div><span class="t-ok">✓ Uploaded! Global rank: #42</span></div>
      <div class="t-out">  Share: <span class="t-cmd">claude-top.a2d2.dev/u/you</span></div>
    </div>
  </div>
);

/** 单个功能卡片。 */
const FeatureCard = ({
  icon, tag, title, desc, delay,
}: { icon: string; tag: string; title: string; desc: string; delay: number }) => (
  <div class="feat-card" style={`animation-delay:${delay}ms`}>
    <span class="feat-tag">{tag}</span>
    <div class="feat-icon">{icon}</div>
    <div class="feat-title">{title}</div>
    <p class="feat-desc">{desc}</p>
  </div>
);

/** 单个使用步骤。 */
const Step = ({
  num, title, desc, code, codeColor, keys, isLast,
}: {
  num: string;
  title: string;
  desc: string;
  code?: string | null;
  codeColor?: string;
  keys?: readonly string[];
  isLast: boolean;
}) => (
  <div class="step">
    {!isLast && <div class="step-line" />}
    <div class="step-num">{num}</div>
    <div class="step-content">
      <div class="step-title">
        {title}
        <span class="step-title-check">✓</span>
      </div>
      <p class="step-desc">{desc}</p>
      {code && (
        <span class="step-code" style={codeColor ? `color:${codeColor}` : 'color:var(--primary)'}>
          {code}
        </span>
      )}
      {keys && (
        <div class="step-keys">
          {keys.map((k) => <span class="step-key">{k}</span>)}
        </div>
      )}
    </div>
  </div>
);

/** 排行榜表格行。 */
const TableRow = ({ row }: { row: LeaderboardRow }) => {
  const avatarSrc = row.avatar_url.includes('?')
    ? `${row.avatar_url}&s=40`
    : `${row.avatar_url}?s=40`;
  const rankDisplay = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`;
  return (
    <tr>
      <td><span class="rank-badge">{rankDisplay}</span></td>
      <td>
        <span class="user-inner">
          <img src={avatarSrc} alt={row.github_login} width="32" height="32" loading="lazy" />
          <a href={`/u/${row.github_login}`} class="user-link">@{row.github_login}</a>
          <a href={`https://github.com/${row.github_login}`} target="_blank" rel="noopener" class="gh-link" title="GitHub 主页">
            <GithubIcon />
          </a>
        </span>
      </td>
      <td><span class="cost-val">${row.total_cost_usd.toFixed(2)}</span></td>
      <td><span class="token-val">{(row.total_tokens / 1_000_000).toFixed(1)}M</span></td>
      <td>{row.device_count}</td>
    </tr>
  );
};

// ── 主组件 ────────────────────────────────────────────────────

/**
 * LeaderboardPage — 排行榜落地页根组件。
 *
 * @param rows   - 排行榜数据行
 * @param period - 当前周期（YYYY-MM）
 */
export const LeaderboardPage = ({ rows, period }: LeaderboardPageProps) => (
  <Layout
    title={`claude-top 排行榜 ${period}`}
    ogMeta={
      <>
        <meta property="og:title" content={`claude-top 全球排行榜 ${period}`} />
        <meta property="og:description" content="Claude API 月度消费排行榜 — 你用了多少？" />
      </>
    }
    navRight={
      <span style="font-family:'Space Mono',monospace;font-size:0.78rem;color:var(--text-dim)">
        <span style="color:var(--green)">$</span> npx @a2d2/claude-top
      </span>
    }
  >
    <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

    {/* ── Hero ── */}
    <section class="hero">
      <div class="hero-glow" style="width:400px;height:400px;top:-100px;left:-50px" />
      <div>
        <div class="hero-badge">
          <span class="hero-badge-dot" />
          实时更新 · 全球排行
        </div>
        <h1>
          Claude API<br />
          <span class="grad-text">消费排行榜</span>
        </h1>
        <p class="hero-sub">
          谁在用 Claude 最猛？<br />
          安装 claude-top，查看实时用量，上传数据和全球开发者一起卷。
        </p>
        <div class="hero-actions">
          <a class="btn-primary" href="https://www.npmjs.com/package/@a2d2/claude-top" target="_blank" rel="noopener">
            $ 安装工具
          </a>
          <a class="btn-ghost" href="https://github.com/a2d2-dev/claude-top" target="_blank" rel="noopener">
            <GithubIcon /> View on GitHub
          </a>
        </div>
        <div class="hero-badges">
          <span>npm Ready</span>
          <span>CLI First</span>
          <span>Privacy First</span>
        </div>
      </div>
      <TerminalBlock />
    </section>

    {/* ── 功能特性 ── */}
    <hr class="section-divider" />
    <div class="section-bg">
      <section class="section">
        <div class="section-header">
          <div class="section-tag">功能特性</div>
          <h2 class="section-title">
            掌握你的 <span class="grad-text">Claude 用量</span>
          </h2>
          <p class="section-sub">
            claude-top 是一个终端 TUI 工具，实时展示 Claude API 消费，并支持自愿上传参与全球排行榜。
          </p>
        </div>
        <div class="features-grid">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.tag} {...f} delay={(i + 1) * 100} />
          ))}
        </div>
      </section>
    </div>

    {/* ── 使用步骤 ── */}
    <hr class="section-divider" />
    <section class="section">
      <div class="section-header">
        <div class="section-tag">使用流程</div>
        <h2 class="section-title">
          三步<span class="grad-text">上榜</span>
        </h2>
        <p class="section-sub">
          从安装到上榜，无需注册账号，一条命令搞定。
        </p>
      </div>
      <div class="steps">
        {STEPS.map((s, i) => (
          <Step key={s.num} {...s} isLast={i === STEPS.length - 1} />
        ))}
      </div>
    </section>

    {/* ── CTA 横幅 ── */}
    <div class="cta-strip">
      <div class="cta-glow" />
      <div class="cta-inner">
        <div class="cta-badge">
          <span style="color:var(--amber)">★</span> 开源免费
        </div>
        <h2>
          你用了多少？<br />
          <span class="grad-text">现在就来比一比</span>
        </h2>
        <p>
          安装 claude-top，查看你这个月花了多少，然后按 <span style="color:var(--amber);font-family:'Space Mono',monospace">u</span> 键上传，看看自己排第几。
        </p>
        <div class="cta-btns">
          <a class="btn-primary" href="https://www.npmjs.com/package/@a2d2/claude-top" target="_blank" rel="noopener">
            立即安装 →
          </a>
          <a class="btn-ghost" href="https://github.com/a2d2-dev/claude-top" target="_blank" rel="noopener">
            <GithubIcon /> View on GitHub
          </a>
        </div>
        <div class="cta-tools">
          <div>兼容以下平台</div>
          <div class="cta-tools-row">
            <span>macOS</span>
            <span>Linux</span>
            <span>Windows</span>
            <span>Node.js</span>
          </div>
        </div>
      </div>
    </div>

    {/* ── 排行榜 ── */}
    <div class="lb-header">
      <span class="lb-title">本月排行榜</span>
      <span class="lb-period">{period}</span>
    </div>
    <div class="table-wrap">
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th style="width:4rem">排名</th>
              <th>用户</th>
              <th>月度费用</th>
              <th>Token 数</th>
              <th>设备数</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => <TableRow key={row.github_login} row={row} />)}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>
);
