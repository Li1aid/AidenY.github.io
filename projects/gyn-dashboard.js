/* ── Gyn Research Dashboard · interactive architecture ────────────── */

(function () {
    const nodes = {
        pubmed: {
            eyebrow: { en: 'NODE · RETRIEVAL', zh: '节点 · 检索' },
            title:   { en: 'PubMed, twice', zh: 'PubMed，查两遍' },
            body: {
                en: 'Route one searches the subject and keeps only papers from a 51-journal whitelist, tiered by field relevance. Route two searches by publication type — guideline, practice guideline, consensus — and deliberately ignores the whitelist, with a date window four times wider.',
                zh: '第一路按主题检索，只留 51 本白名单期刊里的论文，再按领域相关度分层。第二路按文献类型检索：指南、实践指南、共识，故意不看白名单，时间窗口放宽到四倍。'
            },
            why: {
                en: 'Precision and recall want different queries. The whitelist keeps daily noise near zero; the type-keyed route exists because the single most important category — guidelines — can be published anywhere, and "recent" for a guideline means months, not days.',
                zh: '查准和查全要的是两种不同的查询。白名单让每天的噪音几乎为零；而按类型这一路之所以存在，是因为最重要的那类文献（指南）什么地方都可能发，而且对指南来说，「最近」是按月算的，不是按天。'
            },
            flows: ['arch-line-fetch']
        },
        sources: {
            eyebrow: { en: 'NODE · SOURCES', zh: '节点 · 来源' },
            title:   { en: '26 feeds beyond PubMed', zh: 'PubMed 之外的 26 个来源' },
            body: {
                en: '18 RSS feeds (STAT, Healio, ScienceDaily, WHO, FDA…), 6 society sitemaps (FIGO, ACOG, ASRM, NICE, ESGO, ESMO) and 2 scraped guideline pages, plus a manual channel for societies that cannot be scraped. Each source carries a hand-tuned rank.',
                zh: '18 个 RSS 源（STAT、Healio、ScienceDaily、WHO、FDA……）、6 个学会站点地图（FIGO、ACOG、ASRM、NICE、ESGO、ESMO）、2 个直接抓取的指南页，再加一个手动频道，收那些抓不了的学会。每个来源的权重都是手调的。'
            },
            why: {
                en: 'Guidelines and safety alerts surface in society feeds days before they reach PubMed. The mix of RSS, sitemap and raw HTML scraping is ugly on purpose — each source gets whatever access method it actually supports.',
                zh: '指南和安全警示会先出现在学会的动态里，比进 PubMed 早好几天。RSS、站点地图、直接抓 HTML 混在一起用，看着乱，但是故意的：每个来源用它实际支持的方式来取。'
            },
            flows: ['arch-line-fetch']
        },
        fetchers: {
            eyebrow: { en: 'NODE · PIPELINE', zh: '节点 · 流水线' },
            title:   { en: 'Two stdlib-only scripts', zh: '两个纯标准库脚本' },
            body: {
                en: 'fetch_papers.py and fetch_news.py — raw urllib, no frameworks, no packages. They filter, deduplicate the same story across outlets by text similarity, call Claude with bounded concurrency, and write results incrementally under a lock so a crash never loses paid analysis.',
                zh: 'fetch_papers.py 和 fetch_news.py：裸 urllib，没有框架，没有第三方包。它们负责过滤、按文本相似度把同一件事的多家报道去重、限制并发调用 Claude，再在锁的保护下增量写结果，中途崩了也不会丢掉已经付过费的分析。'
            },
            why: {
                en: 'A tool meant to run unattended for years should have nothing that can rot. The standard library never breaks on install day — the price is hand-rolled RSS and date parsing, paid once.',
                zh: '一个要无人值守跑好几年的工具，不该有任何会坏掉的东西。标准库永远不会在安装那天出问题；代价是 RSS 和日期解析得自己写，但只用付一次。'
            },
            flows: ['arch-line-fetch', 'arch-line-grade', 'arch-line-store']
        },
        claude: {
            eyebrow: { en: 'NODE · LLM', zh: '节点 · 大模型' },
            title:   { en: 'Claude as the reader', zh: '让 Claude 来读' },
            body: {
                en: 'Every paper gets an A/B/C grade (or FILTER, and it disappears) plus a structured Chinese reading card — core question, design, results, limitations, next steps. Guideline-type items switch to a version-diff prompt. News gets a type label and a 1–5 importance score.',
                zh: '每篇论文都会拿到 A/B/C 评级（或 FILTER，直接消失），外加一张结构化的中文阅读卡：核心问题、研究设计、结果、局限、下一步。指南类条目换成版本对比的 prompt。新闻则打上类型标签和 1–5 的重要性分。'
            },
            why: {
                en: 'The grade is the product. A feed of titles is just another inbox; a graded, structured card in the reader\'s own language is a decision already half-made — read now, save, or skip.',
                zh: '评级才是产品本身。一列标题不过是又一个收件箱；而一张评过级、结构化、用读者母语写的卡片，等于先替读者做了一半决定：现在读、先收藏，还是跳过。'
            },
            flows: ['arch-line-grade']
        },
        store: {
            eyebrow: { en: 'NODE · STORAGE', zh: '节点 · 存储' },
            title:   { en: 'Flat JSON + per-item caches', zh: '扁平 JSON + 按条缓存' },
            body: {
                en: 'Results land in data.json and news.json; every analysed paper and news item is also cached by its ID. Re-runs skip anything already analysed. Favourites live server-side with atomic writes and 30 days of dated snapshots.',
                zh: '结果写进 data.json 和 news.json；每篇分析过的论文和新闻也会按 ID 各存一份缓存。重跑时，分析过的直接跳过。收藏放在服务端，原子写入，按日期保留 30 天快照。'
            },
            why: {
                en: 'No database because there is nothing relational here — each day\'s output replaces the last, and the caches are the real asset: they are the record of every dollar already spent on analysis.',
                zh: '不用数据库，因为这里没有任何关系型的东西：每天的输出直接覆盖前一天，真正的资产是缓存，它记着已经花在分析上的每一分钱。'
            },
            flows: ['arch-line-store', 'arch-line-serve']
        },
        dashboard: {
            eyebrow: { en: 'NODE · FRONT-END', zh: '节点 · 前端' },
            title:   { en: 'One HTML file, four tabs', zh: '一个 HTML 文件，四个标签页' },
            body: {
                en: 'A single dependency-free HTML file served by a ~400-line stdlib server on port 8765: latest papers, academic news, weekly picks (A-grade papers + major news), and favourites with folders and tags. A rotating banner surfaces importance-5 items.',
                zh: '一个没有任何依赖的 HTML 文件，由一个约 400 行的标准库服务器跑在 8765 端口：最新论文、学术动态、本周精选（A 级论文 + 重大新闻），以及带文件夹和标签的收藏。重要性 5 分的条目会出现在顶部的轮播横幅里。'
            },
            why: {
                en: 'The reader is one person with a routine: open it with coffee, read the picks, star what matters. Four tabs and a banner is the entire information architecture — anything more would be an app to learn instead of a page to read.',
                zh: '读者就一个人，习惯也固定：端着咖啡打开，看精选，把要紧的标上星。四个标签页加一条横幅，就是全部的信息架构；再多就变成一个要学的 app，而不是一个拿来读的页面。'
            },
            flows: ['arch-line-serve']
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
