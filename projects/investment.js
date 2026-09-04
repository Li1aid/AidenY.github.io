/* ── Investment Assistant · interactive architecture ─────────────── */

(function () {
    const nodes = {
        me: {
            eyebrow: { en: 'NODE · CLIENT', zh: '节点 · 客户端' },
            title:   { en: 'My phone or Mac', zh: '我的手机或 Mac' },
            body: {
                en: 'The only human user is me. The dashboard is a single-page app — Alpine.js + Tailwind in one HTML template — that fetches JSON from the Flask API. Sydney and New York clocks sit side by side in the header, because the app lives in both timezones at once.',
                zh: '唯一的人类用户就是我。面板是个单页应用，Alpine.js + Tailwind 写在一个 HTML 模板里，从 Flask API 拉 JSON。页头并排放着悉尼和纽约两个时钟，因为这个 app 同时活在两个时区里。'
            },
            why: {
                en: 'For one user, a template plus Alpine beats a React build: no bundler, no build step, one file to read. The front-end stays focused on its actual job — showing money clearly.',
                zh: '只有一个用户，模板加 Alpine 比一整套 React 工程划算：没有打包器，没有构建步骤，一个文件从头读到尾。前端只管做好它真正的活：把钱的状况看清楚。'
            },
            flows: ['arch-line-request', 'arch-line-data']
        },
        flask: {
            eyebrow: { en: 'NODE · BACKEND', zh: '节点 · 后端' },
            title:   { en: 'Flask on Railway', zh: 'Railway 上的 Flask' },
            body: {
                en: 'An app-factory Flask application with 8 API blueprints — holdings, transactions, watchlist, prices, pnl, search, buckets, meta — behind gunicorn, health-checked at /api/health. The custom domain points here through Cloudflare DNS. Mutating routes require a bearer token; reads stay open.',
                zh: '一个 app-factory 模式的 Flask 应用，8 个 API blueprint（持仓、交易、自选、行情、盈亏、搜索、资金池、元信息），跑在 gunicorn 后面，/api/health 做健康检查。自定义域名经 Cloudflare DNS 指到这里。写操作要 bearer token，读保持开放。'
            },
            why: {
                en: 'It started on my laptop behind a Cloudflare Tunnel with six launchd agents keeping it alive. Moving to Railway deleted that entire ops layer — the dashboard no longer dies when my MacBook lid closes, and a deploy is a git push.',
                zh: '最早它跑在我的笔记本上，靠 Cloudflare Tunnel 对外暴露，六个 launchd 代理守着它别挂。搬到 Railway 之后，这一整层运维都没了：合上 MacBook 盖子面板也不会掉线，部署就是一次 git push。'
            },
            flows: ['arch-line-request', 'arch-line-data', 'arch-line-external', 'arch-line-cron', 'arch-line-agent']
        },
        db: {
            eyebrow: { en: 'NODE · STORAGE', zh: '节点 · 存储' },
            title:   { en: 'portfolio.db (SQLite)', zh: 'portfolio.db（SQLite）' },
            body: {
                en: 'One SQLite file in WAL mode on Railway\'s persistent /data volume. The transactions ledger is the single source of trade entry: buys update weighted-average cost, sells accrue realized P&L, and one daily P&L row per ET trading day feeds the calendar.',
                zh: '一个开了 WAL 模式的 SQLite 文件，放在 Railway 的持久 /data 卷上。所有交易只从账本录入：买入更新加权平均成本，卖出累计已实现盈亏，每个美东交易日生成一行日盈亏，喂给日历。'
            },
            why: {
                en: 'Single user, single writer — SQLite is unbeatable. No database server, no network hop, and migrations are additive PRAGMA-checked statements that can never break a running app. The whole database is one file on a volume.',
                zh: '单用户、单写入方，SQLite 没有对手。不用数据库服务，没有网络往返，迁移全是先 PRAGMA 检查再追加的语句，永远不会弄坏正在跑的应用。整个数据库就是卷上的一个文件。'
            },
            flows: ['arch-line-data']
        },
        upstreams: {
            eyebrow: { en: 'NODE · EXTERNAL', zh: '节点 · 外部依赖' },
            title:   { en: 'Tencent qt · yfinance · akshare', zh: '腾讯 qt · yfinance · akshare' },
            body: {
                en: 'Three families of quote data: one batched, GBK-decoded Tencent qt call covers every A-share and HK code at once; yfinance handles US stocks, ASX and FX pairs; akshare pulls mainland fund NAVs and Shanghai gold. Each source is wrapped so a failure marks its rows "no price" instead of aborting the refresh.',
                zh: '三路行情数据：腾讯 qt 一次批量调用（GBK 解码）覆盖全部 A 股和港股代码；yfinance 负责美股、澳股和汇率；akshare 拉内地基金净值和上海金。每个源都包了一层，出错只会让对应的行显示「无价格」，不会中断整次刷新。'
            },
            why: {
                en: 'Free libraries, not paid vendors — good enough for a personal tracker. The batched Tencent call replaced an akshare scrape that paginated 14 pages and took ~40 seconds; now the whole A-share + HK book refreshes in one request.',
                zh: '用免费库，不用付费数据商，个人记账够用了。批量腾讯调用取代了原来 akshare 翻 14 页、要花约 40 秒的抓取，现在 A 股加港股整本持仓一次请求就刷完。'
            },
            flows: ['arch-line-external']
        },
        sched: {
            eyebrow: { en: 'NODE · CRON', zh: '节点 · 定时任务' },
            title:   { en: 'APScheduler — exactly two jobs', zh: 'APScheduler：只有两个任务' },
            body: {
                en: 'In-process cron inside the same container: refresh prices and FX every 5 minutes, and compute the day\'s P&L at 16:15 New York time on weekdays — 15 minutes after the US close. The trading day is keyed to US Eastern; everything I see is displayed in Sydney time.',
                zh: '跑在同一个容器里的进程内 cron：每 5 分钟刷新行情和汇率；工作日纽约时间 16:15，也就是美股收盘 15 分钟后，算当天盈亏。交易日以美东为准，我看到的一切都按悉尼时间显示。'
            },
            why: {
                en: 'One container means in-process scheduling: nothing extra to deploy, and max_instances=1 stops overlapping runs. The two-clock model (ET trading day, Sydney display) is the subtlest logic in the app — it makes "today" mean the same thing to me and to the market.',
                zh: '只有一个容器，那就用进程内调度：不用多部署任何东西，max_instances=1 保证任务不会重叠。「双时钟」模型（美东交易日、悉尼显示）是整个 app 最微妙的一段逻辑，它让「今天」对我和对市场是同一个意思。'
            },
            flows: ['arch-line-cron']
        },
        agent: {
            eyebrow: { en: 'NODE · AGENT', zh: '节点 · AGENT' },
            title:   { en: 'A scheduled Claude agent', zh: '定时运行的 Claude agent' },
            body: {
                en: 'Every weekday at 09:20 Beijing time — ten minutes before the A-share open — a scheduled Claude agent (Cowork + Chrome plugin) reads /api/holdings, /api/buckets, /api/watchlist and /api/summary and writes me a pre-market briefing, under hard risk rules it is not allowed to override.',
                zh: '每个工作日北京时间 09:20，A 股开盘前十分钟，一个定时运行的 Claude agent（Cowork + Chrome 插件）读取 /api/holdings、/api/buckets、/api/watchlist 和 /api/summary，给我写一份盘前简报，而且要守几条它无权推翻的硬性风控规则。'
            },
            why: {
                en: 'This is why the API is REST with open reads: the dashboard was designed to be consumed by an agent as well as a person. The same JSON that renders my screen briefs my mornings — no scraping, no copy-paste.',
                zh: '这就是 API 做成 REST、读保持开放的原因：这个面板从一开始就是设计给人和 agent 一起用的。渲染我屏幕的那份 JSON，同时也在给我写早报，不用抓页面，不用复制粘贴。'
            },
            flows: ['arch-line-agent']
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
                <strong>${lang === 'zh' ? '为什么这么选' : 'Why this choice'}</strong>
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
