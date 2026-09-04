/* ── Gyn Research Dashboard · interactive architecture ────────────── */

(function () {
    const nodes = {
        pubmed: {
            eyebrow: { en: 'NODE · RETRIEVAL', zh: '节点 · 检索' },
            title:   { en: 'PubMed, twice', zh: '两条 PubMed 路线' },
            body: {
                en: 'Route one searches the subject and keeps only papers from a 51-journal whitelist, tiered by field relevance. Route two searches by publication type — guideline, practice guideline, consensus — and deliberately ignores the whitelist, with a date window four times wider.',
                zh: '第一条路线按主题检索，只保留 51 本白名单期刊的论文，按领域相关性分层。第二条按文献类型检索——指南、实践指南、共识——刻意无视白名单，检索窗口放宽四倍。'
            },
            why: {
                en: 'Precision and recall want different queries. The whitelist keeps daily noise near zero; the type-keyed route exists because the single most important category — guidelines — can be published anywhere, and "recent" for a guideline means months, not days.',
                zh: '查准率和查全率需要不同的查询。白名单让每日噪音接近于零；按类型检索的路线存在的原因是：最重要的一类文献——指南——可能发表在任何地方，而且指南的"新"以月计，不以天计。'
            },
            flows: ['arch-line-fetch']
        },
        sources: {
            eyebrow: { en: 'NODE · SOURCES', zh: '节点 · 来源' },
            title:   { en: '26 feeds beyond PubMed', zh: 'PubMed 之外的 26 个来源' },
            body: {
                en: '18 RSS feeds (STAT, Healio, ScienceDaily, WHO, FDA…), 6 society sitemaps (FIGO, ACOG, ASRM, NICE, ESGO, ESMO) and 2 scraped guideline pages, plus a manual channel for societies that cannot be scraped. Each source carries a hand-tuned rank.',
                zh: '18 个 RSS 源（STAT、Healio、ScienceDaily、WHO、FDA……）、6 个学会站点地图（FIGO、ACOG、ASRM、NICE、ESGO、ESMO）、2 个抓取的指南页，外加一个手动频道收录无法抓取的学会。每个来源都有手工调校的权重。'
            },
            why: {
                en: 'Guidelines and safety alerts surface in society feeds days before they reach PubMed. The mix of RSS, sitemap and raw HTML scraping is ugly on purpose — each source gets whatever access method it actually supports.',
                zh: '指南和安全警示在学会动态里出现的时间，比进 PubMed 早好几天。RSS、站点地图、HTML 抓取混着用是故意的——每个来源用它真正支持的访问方式。'
            },
            flows: ['arch-line-fetch']
        },
        fetchers: {
            eyebrow: { en: 'NODE · PIPELINE', zh: '节点 · 流水线' },
            title:   { en: 'Two stdlib-only scripts', zh: '两个纯标准库脚本' },
            body: {
                en: 'fetch_papers.py and fetch_news.py — raw urllib, no frameworks, no packages. They filter, deduplicate the same story across outlets by text similarity, call Claude with bounded concurrency, and write results incrementally under a lock so a crash never loses paid analysis.',
                zh: 'fetch_papers.py 和 fetch_news.py——裸 urllib，没有框架，没有依赖包。它们做过滤、按文本相似度对同一事件的多家报道去重、限并发调用 Claude，并在锁保护下增量写入结果——中途崩溃也不会丢掉已付费的分析。'
            },
            why: {
                en: 'A tool meant to run unattended for years should have nothing that can rot. The standard library never breaks on install day — the price is hand-rolled RSS and date parsing, paid once.',
                zh: '一个要无人值守跑好几年的工具，不该有任何会腐烂的东西。标准库永远不会在安装那天崩掉——代价是手写 RSS 和日期解析，但只付一次。'
            },
            flows: ['arch-line-fetch', 'arch-line-grade', 'arch-line-store']
        },
        claude: {
            eyebrow: { en: 'NODE · LLM', zh: '节点 · 大模型' },
            title:   { en: 'Claude as the reader', zh: 'Claude 作为读者' },
            body: {
                en: 'Every paper gets an A/B/C grade (or FILTER, and it disappears) plus a structured Chinese reading card — core question, design, results, limitations, next steps. Guideline-type items switch to a version-diff prompt. News gets a type label and a 1–5 importance score.',
                zh: '每篇论文得到 A/B/C 评级（或 FILTER，直接消失）加一张结构化中文阅读卡——核心问题、研究设计、主要结果、局限性、后续方向。指南类条目切换成版本对比 prompt。新闻则获得类型标签和 1–5 重要性评分。'
            },
            why: {
                en: 'The grade is the product. A feed of titles is just another inbox; a graded, structured card in the reader\'s own language is a decision already half-made — read now, save, or skip.',
                zh: '评级本身就是产品。一列标题只是另一个收件箱；一张用读者母语写好的结构化评级卡，等于替读者做完了一半决定——现在读、收藏、还是跳过。'
            },
            flows: ['arch-line-grade']
        },
        store: {
            eyebrow: { en: 'NODE · STORAGE', zh: '节点 · 存储' },
            title:   { en: 'Flat JSON + per-item caches', zh: '扁平 JSON + 按条缓存' },
            body: {
                en: 'Results land in data.json and news.json; every analysed paper and news item is also cached by its ID. Re-runs skip anything already analysed. Favourites live server-side with atomic writes and 30 days of dated snapshots.',
                zh: '结果落在 data.json 和 news.json；每篇分析过的论文和新闻还按 ID 单独缓存。重跑时自动跳过已分析的内容。收藏存在服务端，原子写入，保留 30 天快照。'
            },
            why: {
                en: 'No database because there is nothing relational here — each day\'s output replaces the last, and the caches are the real asset: they are the record of every dollar already spent on analysis.',
                zh: '不用数据库，因为这里没有任何关系型数据——每天的输出覆盖前一天，而缓存才是真正的资产：它们记录着每一分已经花掉的分析成本。'
            },
            flows: ['arch-line-store', 'arch-line-serve']
        },
        dashboard: {
            eyebrow: { en: 'NODE · FRONT-END', zh: '节点 · 前端' },
            title:   { en: 'One HTML file, four tabs', zh: '一个 HTML 文件，四个标签页' },
            body: {
                en: 'A single dependency-free HTML file served by a ~400-line stdlib server on port 8765: latest papers, academic news, weekly picks (A-grade papers + major news), and favourites with folders and tags. A rotating banner surfaces importance-5 items.',
                zh: '一个零依赖的 HTML 文件，由约 400 行的标准库服务器跑在 8765 端口：最新论文、学术动态、本周精选（A 级论文 + 重大新闻）、带文件夹和标签的收藏。重要性 5 级的条目由顶部轮播横幅提示。'
            },
            why: {
                en: 'The reader is one person with a routine: open it with coffee, read the picks, star what matters. Four tabs and a banner is the entire information architecture — anything more would be an app to learn instead of a page to read.',
                zh: '读者是一个有固定习惯的人：端着咖啡打开、看精选、收藏重要的。四个标签页加一条横幅就是全部信息架构——再多就成了需要学习的 app，而不是拿来读的页面。'
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
