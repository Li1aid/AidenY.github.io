/* ── Investment Assistant · interactive architecture ─────────────── */

(function () {
    const nodes = {
        me: {
            eyebrow: { en: 'NODE · CLIENT', zh: '节点 · 客户端' },
            title:   { en: 'My phone or Mac', zh: '我的手机或 Mac' },
            body: {
                en: 'The only user is me. The dashboard is a single-page app — Alpine.js + Tailwind in one HTML template — that fetches JSON from my local Flask backend and re-renders every 30 seconds for fresh prices.',
                zh: '唯一的用户就是我。Dashboard 是一个单页应用——Alpine.js + Tailwind 写在一个 HTML 模板里——从本地 Flask 后端 fetch JSON，每 30 秒重新渲染拿最新价。'
            },
            why: {
                en: 'No login screen inside the app. Auth happens one layer up at Cloudflare Access, so the front-end stays focused on its actual job: showing money clearly.',
                zh: 'app 里没有登录页。认证在上一层的 Cloudflare Access 完成，前端专注于真正该做的事：清楚地呈现资金状况。'
            },
            flows: ['arch-line-request', 'arch-line-data', 'arch-line-external']
        },
        tunnel: {
            eyebrow: { en: 'NODE · NETWORK', zh: '节点 · 网络' },
            title:   { en: 'Cloudflare Tunnel + Access', zh: 'Cloudflare Tunnel + Access' },
            body: {
                en: 'My Mac never opens a port to the public internet. Instead, a cloudflared process holds an outbound encrypted tunnel to Cloudflare, and Cloudflare answers invest.aidenyang.me on its behalf. Cloudflare Access sits in front and requires my email login before any request reaches the laptop.',
                zh: '我的 Mac 从来不对公网开端口。cloudflared 进程从内向外建一条加密隧道连到 Cloudflare，Cloudflare 替我应答 invest.aidenyang.me。Access 在最前面，任何请求都要先通过我的邮箱登录，才能到达我的 Mac。'
            },
            why: {
                en: 'I wanted to check my portfolio from my phone without ever exposing my laptop. Tunnel + Access gives me a public HTTPS URL with proper auth, but the actual server is still my MacBook — physically off when I close the lid.',
                zh: '我想在手机上看自己的持仓，但又不想把电脑暴露在公网。Tunnel + Access 给我一个带正经认证的 HTTPS URL，但真正的服务器仍然是我的 MacBook——合盖就物理下线。'
            },
            flows: ['arch-line-request']
        },
        flask: {
            eyebrow: { en: 'NODE · BACKEND', zh: '节点 · 后端' },
            title:   { en: 'Flask app on localhost:5180', zh: '本地的 Flask 应用' },
            body: {
                en: 'A small Flask application using an app-factory pattern. Three layers: api/ for HTTP endpoints (holdings, actions, pnl, news, recommendations), services/ for the real work (price fetching, news ingestion, AI advisor), and a single views.py that serves the SPA shell.',
                zh: '一个使用 app-factory 模式的小型 Flask 应用。三层架构：api/ 是 HTTP 端点（holdings / actions / pnl / news / recommendations）；services/ 干实际的活（拉价格、抓新闻、AI 建议）；一个 views.py 提供 SPA 入口页。'
            },
            why: {
                en: 'Flask hits the sweet spot: enough structure to keep code organised, almost no boilerplate, and Python\'s ecosystem (akshare, yfinance, anthropic) is exactly where the data lives. Django would have been overkill; FastAPI would have added async complexity I don\'t need for a single user.',
                zh: 'Flask 处在甜蜜点：足以让代码有组织，但几乎没有样板。Python 生态（akshare、yfinance、anthropic）正好是数据所在。Django 是杀鸡用牛刀；FastAPI 的 async 复杂度对单用户场景是浪费。'
            },
            flows: ['arch-line-request', 'arch-line-data', 'arch-line-external', 'arch-line-cron']
        },
        upstreams: {
            eyebrow: { en: 'NODE · EXTERNAL', zh: '节点 · 外部依赖' },
            title:   { en: 'akshare · yfinance · Anthropic', zh: 'akshare · yfinance · Anthropic' },
            body: {
                en: 'Three families of external data: akshare for A-share ETFs, fund NAVs and Shanghai gold; yfinance for ASX equities; and the Anthropic API for the daily AI advice. Everything runs as a one-way pull from my machine — no third party can call in.',
                zh: '三类外部数据：akshare 拉 A 股 ETF、基金净值、上海金；yfinance 拉澳股；Anthropic API 跑每日 AI 建议。全部是从我机器单向"拉"——没有任何第三方能反向调用进来。'
            },
            why: {
                en: 'I picked libraries, not paid data vendors. akshare and yfinance are free and good enough for a personal tracker. The trade-off is occasional flakiness — but if a feed fails, I just see stale prices, not a broken app.',
                zh: '我选的是库，不是付费数据商。akshare 和 yfinance 免费、对个人追踪来说够用。代价是偶尔不稳——但即便某个 feed 失败，我也只是看到过时的价格，不会出现 app 崩溃。'
            },
            flows: ['arch-line-external']
        },
        db: {
            eyebrow: { en: 'NODE · STORAGE', zh: '节点 · 存储' },
            title:   { en: 'portfolio.db (SQLite)', zh: 'portfolio.db（SQLite）' },
            body: {
                en: '11 tables in a single ~200KB SQLite file: holdings, daily_actions, daily_pnl, daily_snapshots, recommendations, news_cache, fx_rates, and a few more. WAL mode is enabled so reads and writes never block each other. The file lives in data/ and is gitignored.',
                zh: '11 张表存在一个约 200KB 的 SQLite 文件里：holdings、daily_actions、daily_pnl、daily_snapshots、recommendations、news_cache、fx_rates 等。开了 WAL 模式让读写互不阻塞。文件放在 data/ 下，git 忽略。'
            },
            why: {
                en: 'For a single-user personal app, SQLite is unbeatable — no separate database process, no network call, no migration tooling. A nightly launchd job uses `sqlite3 .backup` to copy the file to iCloud, rolling 30 days. The whole "database" is one file I can grep, diff, and back up like any other file.',
                zh: '对单用户个人 app，SQLite 无敌——没有单独的数据库进程、没有网络调用、不用迁移工具。一个 launchd 任务每晚 `sqlite3 .backup` 把文件拷到 iCloud，滚动 30 天。整个"数据库"就是一个文件，能 grep、能 diff、能像任何文件一样备份。'
            },
            flows: ['arch-line-data']
        },
        launchd: {
            eyebrow: { en: 'NODE · ORCHESTRATION', zh: '节点 · 编排' },
            title:   { en: '6 launchd agents', zh: '6 个 launchd 代理' },
            body: {
                en: 'Six native macOS launchd agents keep the system alive without my attention: server (boots Flask), tunnel (keeps cloudflared up), prices (every 5 min during market hours), daily (AI advice at 09:20 and 14:30), pnl (close-of-day at 17:30 Sydney), and backup (23:00 sqlite backup to iCloud). Crash → auto-restart. Mac reboot → everything comes back.',
                zh: '6 个原生 macOS launchd 代理在我不操心的情况下维持整个系统：server（拉起 Flask）、tunnel（保持 cloudflared 在线）、prices（交易时段每 5 分钟刷价）、daily（09:20 与 14:30 跑 AI 建议）、pnl（悉尼 17:30 算当日盈亏）、backup（23:00 备份到 iCloud）。崩了自动重启，重启 Mac 整套自动回来。'
            },
            why: {
                en: 'I considered cron, a Python scheduler, even a long-running asyncio task. launchd won because it\'s already there, it handles process supervision (KeepAlive), and the .plist files live in git so my whole setup is reproducible on a fresh Mac.',
                zh: '我考虑过 cron、Python scheduler、甚至常驻 asyncio 任务。launchd 胜出，因为它本来就在系统里、它带进程监管（KeepAlive），而且 .plist 文件可以放进 git——一台新 Mac 整套环境可以复现。'
            },
            flows: ['arch-line-cron']
        }
    };

    function currentLang() {
        const active = document.querySelector('.lang-option.active');
        return active && active.dataset.lang === 'zh' ? 'zh' : 'en';
    }

    function renderPanel(key) {
        const panel = document.getElementById('arch-panel');
        const content = panel.querySelector('.arch-panel-content');
        const data = nodes[key];
        const lang = currentLang();
        if (!data) return;
        content.innerHTML = `
            <div class="arch-panel-eyebrow">${escapeHtml(data.eyebrow[lang] || data.eyebrow.en)}</div>
            <h3 class="arch-panel-title">${escapeHtml(data.title[lang] || data.title.en)}</h3>
            <p>${escapeHtml(data.body[lang] || data.body.en)}</p>
            <div class="why-row">
                <strong>${lang === 'zh' ? '为什么这样选' : 'Why this choice'}</strong>
                <p>${escapeHtml(data.why[lang] || data.why.en)}</p>
            </div>
        `;
        content.dataset.nodeDetail = key;
    }

    function highlightNode(key) {
        const svg = document.getElementById('arch-svg');
        if (!svg) return;
        svg.classList.add('has-active');
        svg.querySelectorAll('.arch-node').forEach(n => {
            n.classList.toggle('active', n.dataset.node === key);
        });
        const flows = nodes[key]?.flows || [];
        svg.querySelectorAll('.arch-line').forEach(l => {
            const matches = flows.some(f => l.classList.contains(f));
            l.classList.toggle('arch-active-flow', matches);
        });
    }

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    document.addEventListener('DOMContentLoaded', () => {
        const svg = document.getElementById('arch-svg');
        if (!svg) return;
        svg.querySelectorAll('.arch-node').forEach(node => {
            node.addEventListener('click', () => {
                const key = node.dataset.node;
                renderPanel(key);
                highlightNode(key);
            });
        });

        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                const active = document.querySelector('.arch-panel-content');
                if (active && active.dataset.nodeDetail && active.dataset.nodeDetail !== 'default') {
                    setTimeout(() => renderPanel(active.dataset.nodeDetail), 30);
                }
            });
        }
    });
})();
