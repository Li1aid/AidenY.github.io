/* ── Prime Bilingual · interactive architecture ───────────────────── */

(function () {
    const nodes = {
        player: {
            eyebrow: { en: 'NODE · PAGE', zh: '节点 · 页面' },
            title:   { en: 'Prime Video player', zh: 'Prime Video 播放器' },
            body: {
                en: 'The unmodified official player. It requests its own TTML subtitle file exactly as always — the extension never blocks or edits that request, it only reads a clone of the response.',
                zh: '未经修改的官方播放器。它照常请求自己的 TTML 字幕文件——扩展从不拦截或修改这个请求，只读取响应的一份副本。'
            },
            why: {
                en: 'Riding on top of the official page means Prime updates rarely affect me, and a bug in my code can never break playback — the player\'s own copy of every response is untouched.',
                zh: '骑在官方页面之上意味着 Prime 的更新很少影响我，而且我的 bug 永远弄不坏播放——播放器自己那份响应从未被动过。'
            },
            flows: ['arch-line-ttml']
        },
        hook: {
            eyebrow: { en: 'NODE · PAGE WORLD', zh: '节点 · 页面主环境' },
            title:   { en: 'injected.js — the hook', zh: 'injected.js——钩子' },
            body: {
                en: 'A tiny script injected into the page\'s main world that patches both window.fetch and XMLHttpRequest. Every response is sniffed by URL pattern, then by content (does it start like a TTML document?). Matches get posted to the content script via postMessage.',
                zh: '注入页面主环境的小脚本，同时修补 window.fetch 和 XMLHttpRequest。每个响应先按 URL 特征、再按内容（开头像不像 TTML 文档）嗅探，命中的通过 postMessage 发给内容脚本。'
            },
            why: {
                en: 'Content scripts run in an isolated world — patching fetch there would hook my own fetch, not the player\'s. Injecting into the main world is structurally the only way to see the player\'s traffic.',
                zh: '内容脚本活在隔离环境里——在那里修补 fetch 只会钩到我自己的 fetch，钩不到播放器的。注入主环境是唯一能看到播放器流量的结构性办法。'
            },
            flows: ['arch-line-ttml', 'arch-line-msg']
        },
        content: {
            eyebrow: { en: 'NODE · ISOLATED WORLD', zh: '节点 · 隔离环境' },
            title:   { en: 'content.js — parse & sync', zh: 'content.js——解析与同步' },
            body: {
                en: 'Parses the TTML into timed cues (it handles four different timecode formats), asks the service worker for translations, then paints the overlay — re-synced every frame by binary search over the cue list against video.currentTime, with a delay you can tune live while the video plays.',
                zh: '把 TTML 解析成带时间轴的字幕条（兼容四种时间码格式），向 service worker 请求翻译，然后绘制叠加层——每帧对字幕列表二分查找、与 video.currentTime 对齐，延迟可以边播边调。'
            },
            why: {
                en: 'I never read Prime\'s caption DOM — I only read the video clock. If Prime redesigns their player UI tomorrow, the sync loop doesn\'t care.',
                zh: '我从不读 Prime 的字幕 DOM——只读视频时钟。哪怕 Prime 明天改版播放器界面，同步循环也毫不在意。'
            },
            flows: ['arch-line-msg', 'arch-line-tr', 'arch-line-render']
        },
        sw: {
            eyebrow: { en: 'NODE · EXTENSION WORLD', zh: '节点 · 扩展环境' },
            title:   { en: 'Background service worker', zh: '后台 service worker' },
            body: {
                en: 'Owns all network work: batches the episode 25 lines at a time, streams progress back to the player, and keeps a local translation cache keyed by a hash of the cue content, trimmed LRU-style at 50 episodes.',
                zh: '负责所有网络工作：整集按 25 行一批翻译、把进度实时发回播放器，并维护一个以字幕内容哈希为键的本地翻译缓存，LRU 方式保留 50 集。'
            },
            why: {
                en: 'MV3 pushes network work into the service worker anyway — but centralising it also means one cache and one API key shared by every tab.',
                zh: 'MV3 本来就要求网络请求走 service worker——但集中处理还带来一个额外好处：所有标签页共享同一份缓存和同一个 API key。'
            },
            flows: ['arch-line-tr', 'arch-line-api']
        },
        claude: {
            eyebrow: { en: 'NODE · LLM', zh: '节点 · 大模型' },
            title:   { en: 'Claude API', zh: 'Claude API' },
            body: {
                en: 'Claude Haiku 4.5 by default, Sonnet or Opus selectable in the options page. Output is forced through a tool schema so subtitle punctuation can\'t break parsing, and prompt caching makes every batch after the first cheaper.',
                zh: '默认 Claude Haiku 4.5，选项页可切 Sonnet 或 Opus。输出强制走 tool schema，字幕里的标点符号弄不坏解析；prompt 缓存让第一批之后的每批都更便宜。'
            },
            why: {
                en: 'Haiku is fast and cheap enough to finish a whole episode before the opening credits end. When a show deserves better prose, the quality models are one dropdown away.',
                zh: 'Haiku 又快又便宜，片头曲放完前就能翻完一整集。遇到值得更好译文的剧，高档模型就在下拉框里。'
            },
            flows: ['arch-line-api']
        },
        overlay: {
            eyebrow: { en: 'NODE · RENDER', zh: '节点 · 渲染' },
            title:   { en: 'The bilingual overlay', zh: '双语叠加层' },
            body: {
                en: 'English on top in white, Chinese below in amber, triple text-shadow for legibility over any frame, sized with clamp() from laptop to TV-sized windows. Clicks pass straight through to the player controls.',
                zh: '英文在上（白色）、中文在下（琥珀色），三层文字阴影保证任何画面上都清晰，clamp() 缩放适配从笔记本到电视大小的窗口。点击直接穿透到播放器控件。'
            },
            why: {
                en: 'Native captions are hidden with opacity, not display:none — their layout box stays alive, so Prime\'s own caption logic keeps running undisturbed, and one checkbox brings them back for side-by-side comparison.',
                zh: '原生字幕是用 opacity 隐藏的，不是 display:none——它们的布局盒还活着，Prime 自己的字幕逻辑照常运行；一个复选框就能把原字幕调回来做对照。'
            },
            flows: ['arch-line-render']
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
