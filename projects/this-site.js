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
                zh: '一切请求从这里开始：先从 GitHub Pages 加载静态的 HTML/CSS/JS，聊天时再去找 Cloudflare Worker。'
            },
            why: {
                en: 'No app to install — just a URL. Works on phones, tablets, and laptops without any platform-specific code.',
                zh: '不用装 app，一个网址就够。手机、平板、电脑都能用，也不用为哪个平台单独写代码。'
            },
            // Which lines should highlight when this node is active
            flows: ['arch-line-visit', 'arch-line-chat', 'arch-line-admin']
        },
        ghpages: {
            eyebrow: { en: 'NODE · HOSTING', zh: '节点 · 托管' },
            title:   { en: 'GitHub Pages', zh: 'GitHub Pages' },
            body: {
                en: 'Free static hosting from GitHub. I git push the front-end (vanilla JS, GSAP animations, project pages) and GitHub serves it through a global CDN.',
                zh: 'GitHub 的免费静态托管。前端（原生 JS、GSAP 动画、项目页）git push 上去，GitHub 就通过全球 CDN 分发出去。'
            },
            why: {
                en: 'For a portfolio I never need server-side rendering. GitHub Pages is free, fast, and version-controlled by default. Trying to be more clever would cost more and break easier.',
                zh: '作品集根本用不上服务端渲染。GitHub Pages 免费、够快、天然带版本控制。花更多心思反而更贵，也更容易坏。'
            },
            flows: ['arch-line-visit']
        },
        worker: {
            eyebrow: { en: 'NODE · BACKEND', zh: '节点 · 后端' },
            title:   { en: 'Cloudflare Worker', zh: 'Cloudflare Worker' },
            body: {
                en: 'A tiny JavaScript function that runs on Cloudflare\'s edge network — 300+ cities worldwide. It routes chat requests to the right AI provider, logs the conversation to D1, and serves the admin dashboard.',
                zh: '一个跑在 Cloudflare 边缘网络上的小 JavaScript 函数，全球 300 多个城市都有节点。它负责把聊天请求转给合适的 AI、把对话记进 D1，还顺便托管后台。'
            },
            why: {
                en: 'Cold start in ~50ms — twenty times faster than a typical VPS. Pay-per-request means $0 when nobody\'s visiting. The trade-off is a 50ms CPU limit per call, but AI chat is mostly waiting on upstream APIs — that\'s exactly the Worker sweet spot.',
                zh: '冷启动大约 50ms，比一般 VPS 快二十倍。按请求计费，没人访问就一分钱不花。代价是每次调用只有 50ms CPU 时间，但 AI 聊天大部分时间都在等上游 API 返回，正好是 Worker 最擅长的场景。'
            },
            flows: ['arch-line-chat', 'arch-line-admin']
        },
        access: {
            eyebrow: { en: 'NODE · AUTH', zh: '节点 · 鉴权' },
            title:   { en: 'Cloudflare Access', zh: 'Cloudflare Access' },
            body: {
                en: 'A zero-trust gateway in front of the admin dashboard. Any request to /admin must pass Access first — it forces a Google or email login, verifies the email matches my allow-list, and only then forwards the request to the Worker.',
                zh: '挡在后台前面的零信任网关。所有到 /admin 的请求都得先过 Access：要求用 Google 或邮箱登录，核对邮箱在不在我的白名单里，通过了才转给 Worker。'
            },
            why: {
                en: 'I didn\'t want to write my own login system. Access gives me SSO with Google for free, including 2FA. The Worker then double-checks the email server-side for defense in depth.',
                zh: '我不想自己写一套登录。Access 免费提供 Google SSO，还带 2FA。Worker 在服务端再核对一次邮箱，多一层保险。'
            },
            flows: ['arch-line-admin']
        },
        ai: {
            eyebrow: { en: 'NODE · LLM', zh: '节点 · 大模型' },
            title:   { en: 'Claude · DeepSeek', zh: 'Claude · DeepSeek' },
            body: {
                en: 'Two AI providers, picked by the visitor\'s country. Claude Haiku 4.5 for everyone outside mainland China (low latency, strong English). DeepSeek for visitors inside China (server in CN bypasses network friction, excellent Chinese).',
                zh: '两家 AI 服务，按访客所在的国家切换。中国大陆以外用 Claude Haiku 4.5（延迟低、英文强）；大陆访客用 DeepSeek（服务器在国内，没有网络障碍，中文也好）。'
            },
            why: {
                en: 'A single provider always disadvantages half the world. Geo-routing solves it with one if-statement in the Worker — costs nothing extra, gives both audiences a fast experience.',
                zh: '只用一家，总有一半的世界体验很差。按地区分流在 Worker 里就是一个 if 判断，不多花一分钱，两边的访客都快。'
            },
            flows: ['arch-line-chat']
        },
        d1: {
            eyebrow: { en: 'NODE · STORAGE', zh: '节点 · 存储' },
            title:   { en: 'Cloudflare D1', zh: 'Cloudflare D1' },
            body: {
                en: 'Cloudflare\'s managed SQLite database. Every chat exchange gets a row: user message, AI reply, country, language, provider, and any "signal tags" matched (hire / contact / pricing / portfolio). A scheduled cron purges rows older than 30 days.',
                zh: 'Cloudflare 托管的 SQLite。每一轮对话存一行：用户消息、AI 回复、国家、语言、用的哪家模型，以及命中的「信号标签」（招聘 / 联系 / 报价 / 作品集）。定时任务会清掉 30 天以前的记录。'
            },
            why: {
                en: 'D1 sits in the same Cloudflare network as the Worker — write latency is effectively zero. The free tier covers a hundred years of my traffic. Plain SQL means no exotic query language to learn.',
                zh: 'D1 和 Worker 在同一张 Cloudflare 网络里，写入延迟基本为零。免费额度够我这点流量用一百年。就是普通 SQL，不用学什么新奇的查询语言。'
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
