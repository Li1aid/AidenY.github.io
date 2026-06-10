/* ── Investment Assistant · interactive demo ──────────────────────
   Bilingual (EN / 中). All dynamically-generated strings live in T().
   Listens to the global language toggle to re-render on switch. */

(function () {
    // ── Synthetic portfolio (entirely fictional) ──────────────────
    const FX = { CNY: 1, AUD: 4.72, HKD: 0.91, USD: 7.18 };
    const SYM = { CNY: '¥', AUD: 'A$', HKD: 'HK$', USD: 'US$' };

    const holdings = [
        { nameEn: 'Acme A-Share ETF',    nameZh: 'Acme A 股 ETF',    ticker: '510TEST',  marketEn: 'A-share',  marketZh: 'A 股',    ccy: 'CNY', qty: 8000, cost: 1.42,  price: 1.55,  vol: 0.012 },
        { nameEn: 'Phoenix Industries',  nameZh: 'Phoenix 工业',     ticker: 'PHX.AX',   marketEn: 'ASX',      marketZh: '澳股',     ccy: 'AUD', qty: 240,  cost: 12.40, price: 13.18, vol: 0.018 },
        { nameEn: 'Onyx Tech Group',     nameZh: 'Onyx 科技',        ticker: '0788.HK',  marketEn: 'HK',       marketZh: '港股',     ccy: 'HKD', qty: 1500, cost: 8.95,  price: 8.42,  vol: 0.022 },
        { nameEn: 'Crimson Growth Fund', nameZh: 'Crimson 成长基金', ticker: '008812',   marketEn: 'CN fund',  marketZh: '内地基金', ccy: 'CNY', qty: 3500, cost: 2.18,  price: 2.31,  vol: 0.009 },
        { nameEn: 'Aurum Physical Gold', nameZh: 'Aurum 实物黄金',   ticker: 'Au99.99',  marketEn: 'Gold',     marketZh: '实物金',   ccy: 'CNY', qty: 60,   cost: 612,   price: 638,   vol: 0.006 },
        { nameEn: 'Beacon Resources',    nameZh: 'Beacon 资源',      ticker: 'BEA.AX',   marketEn: 'ASX',      marketZh: '澳股',     ccy: 'AUD', qty: 180,  cost: 5.20,  price: 4.93,  vol: 0.020 },
    ];

    let displayCcy = 'CNY';
    let refreshTimer = null;
    let adviceBusy = false;

    // Initial action log (relative dates use bilingual buckets)
    const actionLog = [
        { dateKey: 'd5',     side: 'buy',  ticker: '510TEST', qty: 2000, price: 1.51 },
        { dateKey: 'd4',     side: 'sell', ticker: 'BEA.AX',  qty: 50,   price: 5.07 },
        { dateKey: 'd2',     side: 'buy',  ticker: 'Au99.99', qty: 10,   price: 632 },
        { dateKey: 'today',  side: 'buy',  ticker: 'PHX.AX',  qty: 30,   price: 13.05 },
    ];

    // ── Bilingual strings ────────────────────────────────────────
    const STRINGS = {
        priceUpdated:    { en: 'Prices updated just now · 1 AUD = 4.72 CNY', zh: '行情更新于刚刚 · 1 AUD = 4.72 CNY' },
        cost:            { en: 'Cost',  zh: '成本' },
        pnl:             { en: 'P&L',   zh: '盈亏' },
        generating:      { en: 'Generating…', zh: '生成中…' },
        generateBtn:     { en: "Generate today's advice", zh: '生成今日建议' },
        notAdvice:       { en: 'Not financial advice. Demo only.', zh: '不构成投资建议。仅为演示。' },
        todayPrefix:     { en: 'Today', zh: '今日' },
        days: {
            en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        },
        emptyLog:        { en: 'No actions yet.', zh: '暂无操作。' },
        sideBuy:         { en: 'BUY', zh: '买入' },
        sideSell:        { en: 'SELL', zh: '卖出' },
        dateLabels: {
            d5:    { en: '5d ago', zh: '5 天前' },
            d4:    { en: '4d ago', zh: '4 天前' },
            d2:    { en: '2d ago', zh: '2 天前' },
            today: { en: 'today', zh: '今日' },
            now:   { en: 'just now', zh: '刚刚' },
        },
    };

    // AI advice lines (also bilingual)
    const ADVICE_LINES = [
        {
            en: "**Acme A-Share ETF (510TEST)** — Strong momentum after breaking MA20. Hold the position; trim 15% if RSI14 exceeds 72.",
            zh: "**Acme A 股 ETF (510TEST)** — 突破 MA20 后动能强劲。建议持有；若 RSI14 超过 72，减仓 15%。",
        },
        {
            en: "**Phoenix Industries (PHX.AX)** — Earnings beat consensus by 8%. Continue holding. Watch AUD strengthening as a tailwind.",
            zh: "**Phoenix 工业 (PHX.AX)** — 财报超预期 8%。继续持有。关注澳元走强带来的顺风。",
        },
        {
            en: "**Onyx Tech Group (0788.HK)** — Sector rotation pressure. Reduce exposure by 20–30% to free capital for opportunities elsewhere.",
            zh: "**Onyx 科技 (0788.HK)** — 板块轮动压力。建议减仓 20–30%，释放资金寻找其他机会。",
        },
        {
            en: "**Crimson Growth Fund (008812)** — Steady NAV uptrend. No action needed. Small add on any 3%+ pullback.",
            zh: "**Crimson 成长基金 (008812)** — 净值稳步上行。无需操作。回调 3% 以上可少量加仓。",
        },
        {
            en: "**Aurum Gold (Au99.99)** — Approaching resistance. Hold — this is a hedge, not a trade. Don't time it.",
            zh: "**Aurum 黄金 (Au99.99)** — 接近阻力位。持有——这是对冲不是交易。不要做择时。",
        },
        {
            en: "**Beacon Resources (BEA.AX)** — Underperforming. If conviction in commodity cycle remains, hold; otherwise rotate out within 2 weeks.",
            zh: "**Beacon 资源 (BEA.AX)** — 表现不佳。若对大宗周期仍有信心，持有；否则两周内换仓。",
        },
    ];

    // Synthetic news (bilingual)
    const NEWS = [
        {
            tagEn: 'A-share', tagZh: 'A 股',
            titleEn: 'Mainland ETF inflows hit a 6-week high as policy support firms up.',
            titleZh: '政策预期回暖，内地 ETF 净流入创 6 周新高。',
            metaEn: 'Synthetic News · 2h ago', metaZh: '虚构新闻 · 2 小时前',
        },
        {
            tagEn: 'ASX', tagZh: '澳股',
            titleEn: 'Phoenix Industries posts H1 earnings 8% above guidance.',
            titleZh: 'Phoenix 工业上半年盈利超指引 8%。',
            metaEn: 'Synthetic Wire · 5h ago', metaZh: '虚构通讯 · 5 小时前',
        },
        {
            tagEn: 'HK tech', tagZh: '港股科技',
            titleEn: 'Onyx Tech Group flagged in HK regulatory review of cloud spend.',
            titleZh: 'Onyx 科技被纳入港交所对云支出的合规审查名单。',
            metaEn: 'Synthetic News · 7h ago', metaZh: '虚构新闻 · 7 小时前',
        },
        {
            tagEn: 'Gold', tagZh: '黄金',
            titleEn: 'Spot gold pauses near multi-month resistance after rapid run-up.',
            titleZh: '现货黄金在多月高点附近受阻，快速反弹后稍作停顿。',
            metaEn: 'Synthetic Markets · 1d ago', metaZh: '虚构市场 · 1 天前',
        },
    ];

    // ── Helpers ───────────────────────────────────────────────────
    const $ = (id) => document.getElementById(id);

    function lang() {
        const active = document.querySelector('.lang-option.active');
        return active && active.dataset.lang === 'zh' ? 'zh' : 'en';
    }
    function t(key) {
        const v = STRINGS[key];
        if (!v) return '';
        return v[lang()] || v.en;
    }

    function fmt(n) {
        if (n == null || isNaN(n)) return '0';
        const abs = Math.abs(n);
        if (abs >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
        if (abs >= 100)   return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
        return n.toFixed(2);
    }
    function fmtSigned(n) {
        return (n >= 0 ? '+' : '−') + fmt(Math.abs(n));
    }
    function inDisplay(amountCny) { return amountCny / FX[displayCcy]; }
    function withSym(amount, ccy = displayCcy) { return SYM[ccy] + ' ' + fmt(amount); }

    // ── Totals ───────────────────────────────────────────────────
    function totalValCny() { return holdings.reduce((s, h) => s + h.qty * h.price * FX[h.ccy], 0); }
    function totalCostCny() { return holdings.reduce((s, h) => s + h.qty * h.cost * FX[h.ccy], 0); }

    function renderTotals() {
        const v = totalValCny();
        const c = totalCostCny();
        const pnl = v - c;
        const pct = c ? (pnl / c) * 100 : 0;
        $('demo-total').textContent = withSym(inDisplay(v));
        $('demo-total-pnl').textContent =
            `${t('cost')} ${withSym(inDisplay(c))} · ${t('pnl')} ${fmtSigned(inDisplay(pnl))} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;

        const cny = holdings.filter(h => h.ccy === 'CNY')
            .reduce((s, h) => s + h.qty * (h.price - h.cost) * 0.10, 0);
        const aud = holdings.filter(h => h.ccy === 'AUD')
            .reduce((s, h) => s + h.qty * (h.price - h.cost) * 0.06, 0);
        setPnlCard('demo-pnl-cny', 'demo-pnl-cny-pct', cny, '¥');
        setPnlCard('demo-pnl-aud', 'demo-pnl-aud-pct', aud, 'A$');
    }

    function setPnlCard(valId, pctId, pnl, sym) {
        const el = $(valId), pe = $(pctId);
        const sign = pnl >= 0 ? '+' : '−';
        el.textContent = `${sign}${sym} ${fmt(Math.abs(pnl))}`;
        const pct = pnl >= 0 ? (Math.random() * 0.6 + 0.2) : -(Math.random() * 0.5 + 0.15);
        pe.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
        const cls = pnl >= 0 ? 'pos' : 'neg';
        el.closest('.demo-card-pnl').classList.remove('pos', 'neg');
        el.closest('.demo-card-pnl').classList.add(cls);
        el.classList.remove('pos', 'neg'); el.classList.add(cls);
        pe.classList.remove('pos', 'neg'); pe.classList.add(cls);
    }

    // ── Holdings rows ─────────────────────────────────────────────
    function renderRows(flashIdx = -1) {
        const L = lang();
        $('demo-rows').innerHTML = holdings.map((h, i) => {
            const dayPct = ((h.price - h.cost) / h.cost) * 100;
            const dayCls = dayPct >= 0 ? 'pos' : 'neg';
            const val = inDisplay(h.qty * h.price * FX[h.ccy]);
            const nm = L === 'zh' ? h.nameZh : h.nameEn;
            const mk = L === 'zh' ? h.marketZh : h.marketEn;
            return `
                <tr ${i === flashIdx ? 'class="demo-row-flash"' : ''}>
                    <td>
                        <div class="demo-name-main">${nm}</div>
                        <div class="demo-name-sub">${h.ticker} · ${mk}</div>
                    </td>
                    <td>${fmt(h.qty)}</td>
                    <td>${SYM[h.ccy]} ${h.price.toFixed(2)}</td>
                    <td><span class="demo-day-chip ${dayCls}">${dayPct >= 0 ? '+' : ''}${dayPct.toFixed(2)}%</span></td>
                    <td>${withSym(val)}</td>
                </tr>
            `;
        }).join('');
    }

    // ── Equity curve ──────────────────────────────────────────────
    function generateCurveData() {
        const days = 30;
        let cny = 100, aud = 100;
        const cnyData = [], audData = [];
        for (let i = 0; i < days; i++) {
            cny += (Math.sin(i * 0.4) * 0.7) + ((i % 7 === 0) ? 1.5 : 0) + (Math.cos(i * 0.31) * 0.4);
            aud += (Math.cos(i * 0.55) * 0.6) - ((i % 9 === 0) ? 0.8 : 0) + (Math.sin(i * 0.27) * 0.5);
            cnyData.push(cny);
            audData.push(aud);
        }
        return { cnyData, audData };
    }

    function renderCurve() {
        const svg = $('demo-curve');
        const { cnyData, audData } = generateCurveData();
        const W = 800, H = 160, pad = { top: 16, right: 12, bottom: 22, left: 12 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;
        const all = [...cnyData, ...audData];
        const min = Math.min(...all), max = Math.max(...all);
        const range = max - min || 1;

        function pathFor(data) {
            return data.map((v, i) => {
                const x = pad.left + (plotW / (data.length - 1)) * i;
                const y = pad.top + plotH - ((v - min) / range) * plotH;
                return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
            }).join(' ');
        }
        function areaFor(data) {
            const linePath = pathFor(data);
            const lastX = pad.left + plotW;
            const firstX = pad.left;
            const baseY = pad.top + plotH;
            return linePath + ` L${lastX},${baseY} L${firstX},${baseY} Z`;
        }

        let grid = '';
        for (let i = 0; i <= 3; i++) {
            const y = pad.top + (plotH / 3) * i;
            grid += `<line x1="${pad.left}" y1="${y}" x2="${pad.left + plotW}" y2="${y}" stroke="#1f1f2c" stroke-width="1"/>`;
        }
        const L = lang();
        const labelDays = L === 'zh' ? ['30 天前', '20 天前', '10 天前', '今天'] : ['30d', '20d', '10d', 'now'];
        let xLabels = '';
        labelDays.forEach((d, i) => {
            const x = pad.left + (plotW / 3) * i;
            xLabels += `<text x="${x}" y="${H - 6}" fill="#666" font-size="9" font-family="ui-monospace" text-anchor="${i === 0 ? 'start' : i === labelDays.length - 1 ? 'end' : 'middle'}">${d}</text>`;
        });

        svg.innerHTML = `
            ${grid}
            <path d="${areaFor(cnyData)}" fill="#ffffff" fill-opacity="0.08"/>
            <path d="${areaFor(audData)}" fill="#888888" fill-opacity="0.06"/>
            <path d="${pathFor(cnyData)}" stroke="#ffffff" stroke-width="1.7" fill="none"/>
            <path d="${pathFor(audData)}" stroke="#888888" stroke-width="1.5" fill="none" stroke-dasharray="3 3" stroke-opacity="0.85"/>
            ${xLabels}
        `;
    }

    // ── Currency switcher ─────────────────────────────────────────
    function setCcy(c) {
        displayCcy = c;
        document.querySelectorAll('.demo-ccy').forEach(b =>
            b.classList.toggle('active', b.dataset.ccy === c));
        renderTotals();
        renderRows();
        renderMonthStats();
    }

    // ── Live price ticks ──────────────────────────────────────────
    function tickPrices() {
        const i = Math.floor(Math.random() * holdings.length);
        const h = holdings[i];
        const drift = (Math.random() - 0.48) * h.vol * h.cost;
        h.price = Math.max(0.01, +(h.price + drift).toFixed(2));
        renderRows(i);
        renderTotals();
        $('demo-meta').textContent = t('priceUpdated');
    }

    // ── AI advice generator ──────────────────────────────────────
    async function generateAdvice() {
        if (adviceBusy) return;
        adviceBusy = true;
        const btn = $('demo-advice-btn'), body = $('demo-advice-body');
        const L = lang();
        btn.disabled = true; btn.textContent = t('generating');
        body.innerHTML = '<p class="demo-cursor"></p>';
        await wait(1100);

        const dateStr = new Date().toLocaleDateString(L === 'zh' ? 'zh-CN' : 'en-US',
            { month: 'short', day: 'numeric', year: 'numeric' });
        body.innerHTML = `<p><em>${t('todayPrefix')} · ${dateStr}</em></p>`;
        const out = document.createElement('div');
        body.appendChild(out);

        for (const lineObj of ADVICE_LINES) {
            const line = L === 'zh' ? lineObj.zh : lineObj.en;
            const p = document.createElement('p');
            p.className = 'demo-cursor';
            out.appendChild(p);
            for (let i = 0; i < line.length; i++) {
                p.innerHTML = mdInline(line.slice(0, i + 1));
                await wait(6);
            }
            p.classList.remove('demo-cursor');
            p.innerHTML = mdInline(line);
            await wait(120);
        }
        const foot = document.createElement('p');
        foot.innerHTML = `<em>${t('notAdvice')}</em>`;
        out.appendChild(foot);

        btn.disabled = false; btn.textContent = t('generateBtn');
        adviceBusy = false;
    }

    function mdInline(s) {
        return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>');
    }
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ── Action log + monthly totals ──────────────────────────────
    function dateLabel(key) {
        const v = STRINGS.dateLabels[key];
        if (v) return v[lang()] || v.en;
        return key;
    }
    function sideLabel(side) {
        return side === 'buy' ? t('sideBuy') : t('sideSell');
    }

    function renderLog() {
        const ul = $('demo-log');
        if (!actionLog.length) {
            ul.innerHTML = `<li class="demo-log-empty">${t('emptyLog')}</li>`;
        } else {
            ul.innerHTML = actionLog.slice().reverse().slice(0, 5).map(a => `
                <li class="demo-log-item">
                    <span class="tag ${a.side}">${sideLabel(a.side)}</span>
                    <span class="body">${a.qty} × <strong>${a.ticker}</strong> @ ${a.price.toFixed(2)}</span>
                    <span class="date">${dateLabel(a.dateKey)}</span>
                </li>
            `).join('');
        }
        renderMonthStats();
    }

    function renderMonthStats() {
        let buyCny = 0, sellCny = 0;
        actionLog.forEach(a => {
            const h = holdings.find(h => h.ticker === a.ticker);
            const ccy = h ? h.ccy : 'CNY';
            const cny = a.qty * a.price * FX[ccy];
            if (a.side === 'buy') buyCny += cny; else sellCny += cny;
        });
        $('month-buy').textContent  = withSym(inDisplay(buyCny));
        $('month-sell').textContent = withSym(inDisplay(sellCny));
    }

    function populateLogSymbolSelect() {
        const L = lang();
        $('log-symbol').innerHTML = holdings.map(h => {
            const nm = L === 'zh' ? h.nameZh : h.nameEn;
            return `<option value="${h.ticker}">${h.ticker} · ${nm}</option>`;
        }).join('');
    }

    function attachLogForm() {
        $('demo-log-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const ticker = $('log-symbol').value;
            const side   = $('log-side').value;
            const qty    = parseInt($('log-qty').value, 10) || 0;
            const h = holdings.find(h => h.ticker === ticker);
            if (!h || qty <= 0) return;
            actionLog.push({ dateKey: 'now', side, ticker, qty, price: h.price });
            $('log-qty').value = '100';
            renderLog();
        });
    }

    // ── News feed ─────────────────────────────────────────────────
    function renderNews() {
        const L = lang();
        $('demo-news').innerHTML = NEWS.map(n => `
            <li class="demo-news-item">
                <div class="demo-news-tag">${L === 'zh' ? n.tagZh : n.tagEn}</div>
                <div class="demo-news-title">${L === 'zh' ? n.titleZh : n.titleEn}</div>
                <div class="demo-news-meta">${L === 'zh' ? n.metaZh : n.metaEn}</div>
            </li>
        `).join('');
    }

    // ── Full re-render on language change ────────────────────────
    function rerenderAll() {
        renderTotals();
        renderRows();
        renderCurve();
        renderLog();
        renderNews();
        populateLogSymbolSelect();
        // Refresh meta text
        $('demo-meta').textContent = t('priceUpdated');
    }

    // ── Init ──────────────────────────────────────────────────────
    function init() {
        const root = $('invest-demo');
        if (!root) return;

        rerenderAll();
        attachLogForm();

        document.querySelectorAll('.demo-ccy').forEach(b =>
            b.addEventListener('click', () => setCcy(b.dataset.ccy)));
        $('demo-advice-btn').addEventListener('click', generateAdvice);
        $('demo-refresh-btn').addEventListener('click', () => { tickPrices(); tickPrices(); });

        // Auto price tick only when demo is in viewport
        const io = new IntersectionObserver(entries => {
            for (const e of entries) {
                if (e.isIntersecting) {
                    if (!refreshTimer) refreshTimer = setInterval(tickPrices, 4000);
                } else {
                    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
                }
            }
        }, { threshold: 0.15 });
        io.observe(root);

        // Listen to language toggle (the main script.js already updates
        // .lang-option.active class). When user clicks either option,
        // re-render every dynamic string.
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => {
                // The main script applies new lang first; we defer slightly
                setTimeout(rerenderAll, 30);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
