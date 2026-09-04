/* ── Chunks 语块 · interactive architecture ───────────────────────── */

(function () {
    const nodes = {
        pwa: {
            eyebrow: { en: 'NODE · CLIENT', zh: '节点 · 客户端' },
            title:   { en: 'The PWA — zero build', zh: 'PWA——零构建' },
            body: {
                en: 'Three files of vanilla JS with an iOS-style UI, installable to the home screen, working offline through a service worker. This is the version in daily use — it is where every product decision got validated before the native rewrite.',
                zh: '三个原生 JS 文件加 iOS 风格界面，可安装到主屏幕，靠 service worker 离线工作。这是日常使用中的版本——每个产品决策都先在这里被真实使用验证，然后才进原生重写。'
            },
            why: {
                en: 'No npm, no bundler, no build step. For a product I was still figuring out, iteration speed mattered more than tooling — edit, refresh, learn.',
                zh: '没有 npm、没有打包器、没有构建步骤。产品形态还没想清楚的时候，迭代速度比工具链重要——改完刷新就能学到东西。'
            },
            flows: ['arch-line-pwa']
        },
        ios: {
            eyebrow: { en: 'NODE · CLIENT', zh: '节点 · 客户端' },
            title:   { en: 'The iOS rewrite — in progress', zh: 'iOS 重写——进行中' },
            body: {
                en: 'SwiftUI + SwiftData, targeting the China App Store. It runs full FSRS scheduling (the PWA keeps simplified SM-2), maps swipe gestures onto review grades, and back-fills old SM-2 cards into FSRS state — an algorithm migration over live data, not a reset.',
                zh: 'SwiftUI + SwiftData，目标是中国区 App Store。它跑完整的 FSRS 调度（PWA 保留简化 SM-2），把滑动手势映射到复习评分，还把老的 SM-2 卡片回填进 FSRS 状态——在真实数据上做算法迁移，而不是清零。'
            },
            why: {
                en: 'The PWA proved the product; the native app is for shipping it properly — real gestures, real offline storage, and an app store people actually install from.',
                zh: 'PWA 验证了产品；原生 app 是为了把它正经交付——真实的手势、真实的本地存储，以及用户真正会去下载的应用商店。'
            },
            flows: ['arch-line-ios']
        },
        worker: {
            eyebrow: { en: 'NODE · BACKEND', zh: '节点 · 后端' },
            title:   { en: 'One Cloudflare Worker', zh: '一个 Cloudflare Worker' },
            body: {
                en: 'Every route is gated by an app token. It does exactly three jobs: proxy Claude\'s API, proxy DeepSeek\'s API, and upsert cards into D1 — injecting the AI keys server-side so they never reach any client.',
                zh: '每个路由都由 app token 把守。它只做三件事：代理 Claude API、代理 DeepSeek API、把卡片 upsert 进 D1——AI 密钥在服务端注入，永远不会到达任何客户端。'
            },
            why: {
                en: 'The clients had to stay static and key-free. A Worker is the thinnest possible backend that can hold secrets — no server to run, and the sync endpoint is the same code path for both clients.',
                zh: '客户端必须保持静态、不携带密钥。Worker 是能保管机密的最薄后端——不用运维服务器，而且两个客户端走同一条同步代码路径。'
            },
            flows: ['arch-line-pwa', 'arch-line-ios', 'arch-line-llm', 'arch-line-sync']
        },
        llm: {
            eyebrow: { en: 'NODE · LLM', zh: '节点 · 大模型' },
            title:   { en: 'Claude · DeepSeek', zh: 'Claude · DeepSeek' },
            body: {
                en: 'Claude Sonnet by default; the iOS app switches to DeepSeek for mainland-region devices. One prompt returns the natural translation plus 1–4 extracted chunks in dictionary lemma form — deduplication is enforced in the prompt, not patched in code.',
                zh: '默认 Claude Sonnet；iOS 上大陆地区设备自动切到 DeepSeek。一次调用返回地道翻译加 1–4 个语块，语块强制词典原形——去重靠 prompt 约束，而不是在代码里补救。'
            },
            why: {
                en: 'A China App Store product cannot depend on one provider\'s reachability. Two providers behind one Worker means the product decides per user, and the clients never know the difference.',
                zh: '面向中国区商店的产品不能押注单一模型商的可达性。一个 Worker 背后放两个模型商，产品可以按用户选择，客户端完全无感。'
            },
            flows: ['arch-line-llm']
        },
        d1: {
            eyebrow: { en: 'NODE · STORAGE', zh: '节点 · 存储' },
            title:   { en: 'Cloudflare D1', zh: 'Cloudflare D1' },
            body: {
                en: 'One cards table holding both scheduling models side by side — SM-2 columns for the PWA, FSRS stability/difficulty/state for iOS — so either client can pick up any card. The upsert re-checks last-write-wins in SQL: a stale device physically cannot overwrite newer state.',
                zh: '一张 cards 表并排存两套调度模型——PWA 用的 SM-2 列，iOS 用的 FSRS stability/difficulty/state——任何客户端都能接手任何卡片。upsert 在 SQL 里再验一次"最后写入者胜"：过期设备物理上覆盖不了新数据。'
            },
            why: {
                en: 'The sync contract lives in the database, not in client goodwill. Enforcing LWW in the WHERE clause means even a buggy client can\'t corrupt the deck.',
                zh: '同步契约写在数据库里，而不是寄希望于客户端自觉。把 LWW 写进 WHERE 子句，就算客户端有 bug 也毁不掉卡组。'
            },
            flows: ['arch-line-sync']
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
