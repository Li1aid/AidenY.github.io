/* ── Interactive architecture diagram ─────────────────────────────
   Click any node → swap the panel content + highlight that node's
   request flow lines. Bilingual content is stored on each entry. */

(function () {
    const nodes = {
        user: {
            eyebrow: { en: 'NODE · BROWSER', zh: '节点 · 浏览器' },
            title:   { en: 'Visitor browser', zh: '访客浏览器' },
            body: {
                en: 'The starting point for every request. Loads static HTML/CSS/JS from GitHub Pages, then talks to the Cloudflare Worker for AI chat.',
                zh: '所有请求的起点。从 GitHub Pages 加载静态 HTML/CSS/JS，然后通过 Cloudflare Worker 处理 AI 对话。'
            },
            why: {
                en: 'No app to install — just a URL. Works on phones, tablets, and laptops without any platform-specific code.',
                zh: '不用装 app，只需要一个 URL。在手机、平板、电脑上都能跑，没有平台特定的代码。'
            },
            // Which lines should highlight when this node is active
            flows: ['arch-line-visit', 'arch-line-chat', 'arch-line-admin']
        },
        ghpages: {
            eyebrow: { en: 'NODE · HOSTING', zh: '节点 · 托管' },
            title:   { en: 'GitHub Pages', zh: 'GitHub Pages' },
            body: {
                en: 'Free static hosting from GitHub. I git push the front-end (vanilla JS, GSAP animations, project pages) and GitHub serves it through a global CDN.',
                zh: 'GitHub 提供的免费静态托管。我把前端（原生 JS、GSAP 动画、项目页）push 上去，GitHub 通过全球 CDN 分发。'
            },
            why: {
                en: 'For a portfolio I never need server-side rendering. GitHub Pages is free, fast, and version-controlled by default. Trying to be more clever would cost more and break easier.',
                zh: '作品集不需要任何服务端渲染。GitHub Pages 免费、快、自带版本控制。再"聪明"反而更贵、更脆弱。'
            },
            flows: ['arch-line-visit']
        },
        worker: {
            eyebrow: { en: 'NODE · BACKEND', zh: '节点 · 后端' },
            title:   { en: 'Cloudflare Worker', zh: 'Cloudflare Worker' },
            body: {
                en: 'A tiny JavaScript function that runs on Cloudflare\'s edge network — 300+ cities worldwide. It routes chat requests to the right AI provider, logs the conversation to D1, and serves the admin dashboard.',
                zh: '一个跑在 Cloudflare 全球边缘网络（300+ 城市）的小 JS 函数。它把聊天请求路由到合适的 AI、把对话写进 D1、还负责 admin 后台。'
            },
            why: {
                en: 'Cold start in ~50ms — twenty times faster than a typical VPS. Pay-per-request means $0 when nobody\'s visiting. The trade-off is a 50ms CPU limit per call, but AI chat is mostly waiting on upstream APIs — that\'s exactly the Worker sweet spot.',
                zh: '冷启动 50ms 左右——比传统 VPS 快 20 倍。按调用付费，没人访问就 0 成本。代价是单次 CPU 上限 50ms，但 AI 聊天主要是等上游 API 返回，正好是 Worker 的甜区。'
            },
            flows: ['arch-line-chat', 'arch-line-admin']
        },
        access: {
            eyebrow: { en: 'NODE · AUTH', zh: '节点 · 身份验证' },
            title:   { en: 'Cloudflare Access', zh: 'Cloudflare Access' },
            body: {
                en: 'A zero-trust gateway in front of the admin dashboard. Any request to /admin must pass Access first — it forces a Google or email login, verifies the email matches my allow-list, and only then forwards the request to the Worker.',
                zh: 'admin 后台前面的"零信任"网关。任何访问 /admin 的请求都要先过 Access——它强制 Google 或邮箱登录，验证邮箱在白名单里，然后才把请求转给 Worker。'
            },
            why: {
                en: 'I didn\'t want to write my own login system. Access gives me SSO with Google for free, including 2FA. The Worker then double-checks the email server-side for defense in depth.',
                zh: '我不想自己写登录系统。Access 免费给我 Google SSO，自带 2FA。Worker 在服务端再验一次邮箱，做防御纵深。'
            },
            flows: ['arch-line-admin']
        },
        ai: {
            eyebrow: { en: 'NODE · LLM', zh: '节点 · 大模型' },
            title:   { en: 'Claude · DeepSeek', zh: 'Claude · DeepSeek' },
            body: {
                en: 'Two AI providers, picked by the visitor\'s country. Claude Haiku 4.5 for everyone outside mainland China (low latency, strong English). DeepSeek for visitors inside China (server in CN bypasses network friction, excellent Chinese).',
                zh: '两个 AI 模型，按访客国家选。中国大陆以外 → Claude Haiku 4.5（低延迟、英文强）。中国大陆 → DeepSeek（国内服务器避开网络阻力，中文好）。'
            },
            why: {
                en: 'A single provider always disadvantages half the world. Geo-routing solves it with one if-statement in the Worker — costs nothing extra, gives both audiences a fast experience.',
                zh: '只用一个模型永远会让一半的人体验差。Worker 里一行 if-statement 就能搞定地理路由——不多花一分钱，两边访客都流畅。'
            },
            flows: ['arch-line-chat']
        },
        d1: {
            eyebrow: { en: 'NODE · STORAGE', zh: '节点 · 存储' },
            title:   { en: 'Cloudflare D1', zh: 'Cloudflare D1' },
            body: {
                en: 'Cloudflare\'s managed SQLite database. Every chat exchange gets a row: user message, AI reply, country, language, provider, and any "signal tags" matched (hire / contact / pricing / portfolio). A scheduled cron purges rows older than 30 days.',
                zh: 'Cloudflare 托管的 SQLite。每次对话存一行：用户消息、AI 回复、国家、语言、provider、命中的信号词（招聘 / 联系 / 价格 / 作品集）。定时任务每天清理 30 天前的数据。'
            },
            why: {
                en: 'D1 sits in the same Cloudflare network as the Worker — write latency is effectively zero. The free tier covers a hundred years of my traffic. Plain SQL means no exotic query language to learn.',
                zh: 'D1 和 Worker 在同一个 Cloudflare 内网——写延迟接近 0。免费额度够我用 100 年。标准 SQL，没有奇怪的查询语言要学。'
            },
            flows: ['arch-line-chat', 'arch-line-admin']
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
        // highlight relevant lines
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

        // Re-render panel content when language changes
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
