# Task: Portfolio site refresh for job hunting (Design Engineer, Sydney startups)

Read this whole file before touching anything. Work in this repo (`AidenY.github.io`) on branch `main`. When done, commit in logical chunks and push to `origin main`. Do NOT commit `projects/vivid-map3d.js`, `projects/vivid.css`, `projects/vivid.html`, `worker/package-lock 2.json` unless Aiden says so — they are WIP from another branch.

## Why

Aiden is applying for Design Engineer / Product Designer roles at Sydney AI startups starting Monday. Recruiters will read the CV, open this site, then click GitHub. The site currently contradicts the CV and the code in three places, hides Aiden's strongest projects, and its AI chatbot has a stale knowledge base. Fix all of that. **Truthfulness beats polish: never describe a feature that does not exist in the actual code.**

The CV this site must agree with says, in short:

- Title: **Design Engineer** (drop "AIGC Creator" as the primary label; keep it only as a secondary tag if at all)
- Master of Interaction Design, USYD — **completed July 2026** (not "currently studying", not "2024–Present")
- Five products built solo with Claude Code / Codex: Chunks, Investment Assistant, Gynaecology Research Dashboard, Prime Bilingual, this portfolio
- Content background: Weibo 200K+ followers, Camera360 overseas content intern 2023

## Ground truth for each project (verify against the code before writing copy)

Sibling repos are at `../Investment Assistant`, `../yuyukai` (Chunks), `../prime-bilingual`, `../TCM Gynecology frontier assistant`. Read their README / CLAUDE.md / source. If something below disagrees with the code, the code wins.

### Investment Assistant — `../Investment Assistant`
- Flask app factory + blueprints, SQLite, Alpine.js single-page dashboard (Tailwind CDN)
- **Deployed on Railway** at invest.aidenyang.me, SQLite on a `/data` volume. NOT local-first, NOT Cloudflare Tunnel — the current page says the opposite and must be rewritten.
- APScheduler in-process cron: prices every 5 min, daily P&L after US close (ET trading day); Sydney display timezone
- Markets: US, HK, A-share ETFs, China mainland funds, ASX, physical gold; 4 currencies with FX conversion
- Quote sources: Tencent qt, yfinance, akshare; multi-market ticker search with 24h cache
- Transactions ledger drives holdings and day-P&L; daily market-value snapshots → equity curve; buckets (资金池)
- REST API (`/api/holdings`, `/api/buckets`, `/api/watchlist`, `/api/summary`, etc.) is consumed by a **scheduled Claude agent** (Cowork + Chrome plugin) every weekday morning to write a pre-market briefing — see `docs/cowork-playbook.md`. This is the interesting angle: **API-first, designed to be consumed by an agent as well as a person.**
- Things the current page claims that are NOT in the code and must be removed: "Daily AI advice" button, "AI alignment / action auto-classified against advice", "launchd × 6", "MY LAPTOP · DATA NEVER LEAVES", "CF Tunnel". Check whether a P&L calendar view actually exists before keeping that feature card.

### Chunks (语块) — `../yuyukai`
- Read `CLAUDE.md` there first — it is thorough.
- Chinese sentence → Claude returns natural English + extracts 1–4 reusable phrases ("chunks") → each becomes a flashcard → spaced repetition (simplified SM-2 on PWA, FSRS on iOS)
- PWA: vanilla JS, no build step, iOS-style UI, in daily use. Backend: Cloudflare Worker (`/v1/messages` proxy + `/sync/cards`) + D1.
- Offline-first, last-write-wins sync by `updatedAt`, soft deletes with tombstones, dual cursors for pull/push
- iOS native rewrite in SwiftUI + SwiftData in progress (Bundle `com.aidenyang.Chunks`), target App Store — **say "in progress", never "published"**
- Product decision worth telling: shipped an auto scene-tagging feature, validated it in real use, found the AI labels unreliable, **removed it** (2026-05-09). Prompt halved, product simpler.

### Gynaecology Research Dashboard — `../TCM Gynecology frontier assistant`
- Built for Aiden's girlfriend, a [VERIFY WITH AIDEN: medical researcher / clinician / postgraduate] — describe as "built for a medical researcher, in daily use" unless told otherwise. Do not use her name.
- PubMed dual-route retrieval (journal whitelist + guideline route) + ~15 RSS/sitemap/HTML sources (WHO, FIGO, ACOG, ASRM, NICE, ESGO, ESMO…)
- Claude grades each paper A/B/C and produces a 10-field structured card; 8-type classification for news
- Dashboard: 4 tabs, favourites with tags, GitHub Gist cross-device sync, red banner for major updates
- Runs daily 8am via macOS launchd; local server on :8765

### Prime Bilingual — `../prime-bilingual`
- Chrome extension, Manifest V3. Content script + injected script intercept Prime Video's TTML subtitle stream; background service worker calls Claude; renders English on top, Chinese below in the player. Options page.

### This portfolio — this repo
- Already has a case study page; keep it. Update its copy only if it references stale facts.

## Changes

### 1. `index.html`
- Hero ROLE: "Design Engineer" primary. FOCUS: something like "Product Design & Vibecoding" is fine.
- About: rewrite the two `about-description` paragraphs to match the CV profile: designer who ships; five products built solo since 2025; content background. Keep the bilingual `data-en` / `data-zh` + `about-line` span structure the animation depends on.
- Timeline: USYD entry → "2024–2026", "Master of Interaction Design — completed July 2026". Camera360 title → "Overseas Content Planning Intern". Add a "2025–Present · Design Engineer (independent) — five shipped AI products" entry at the top.
- Showcase grid, new order:
  1. Chunks (new card + new page `projects/chunks.html`)
  2. Investment Assistant (rewritten page)
  3. Gynaecology Research Dashboard (new card + new page `projects/gyn-dashboard.html`)
  4. Prime Bilingual (new card + new page `projects/prime-bilingual.html`)
  5. This Portfolio
  6. CoLab
  7. ANNO
  8. VividXperience (fix the typo "VividXpirence" in the `<h3>`)
  9. Whisperfield
  Cards need a cover image in `Assets/`. For the three new projects, generate simple SVG posters in the site's existing visual style (dark, monospace labels, accent colour) if no screenshot exists — do not leave broken `<img>`s. If a real screenshot can be produced from the local project (e.g. open the Chunks PWA `index.html` in a headless browser), prefer that.
- Skills section: replace the three boxes with: **Design** (Figma, Prototyping, User research, Design systems) · **Build** (Claude Code / Codex, HTML·CSS·JS, Python · Flask, SwiftUI, Cloudflare Workers · D1, Railway) · **Content** (Content strategy, Trend insight, Short-form video). Keep the SVG-icon markup pattern.
- Structured data (`ld+json`): `jobTitle` → "Design Engineer"; add `"https://github.com/Li1aid"` to `sameAs`; add `knowsAbout` entries: "Claude Code", "Cloudflare Workers", "Flask", "SwiftUI".
- `<title>` / meta descriptions: lead with "Design Engineer", mention "builds and ships AI products".

### 2. `projects/investment.html` — rewrite
Keep the page skeleton, styles, bilingual pattern and the interactive architecture-diagram mechanic (clickable nodes with explanations). Replace content:
- Hero meta: USE "Personal · in production" · STACK "Flask · SQLite · Alpine.js" · HOSTING "Railway" · DATA "Private, single user"
- Features (only what exists): cross-market holdings & FX · transactions ledger → day P&L (ET trading day) · nightly snapshots → equity curve · buckets · multi-source quotes with fallback · **API consumed by a scheduled Claude agent for a morning briefing**
- Architecture diagram: Browser/Phone → Cloudflare (DNS/proxy, if applicable — verify) → Railway (Flask + APScheduler + SQLite on /data volume) ← quote sources (Tencent qt / yfinance / akshare); and a second consumer: "Scheduled Claude agent (Cowork + Chrome plugin) → GET /api/*". Node explanations should say *why* each choice: why Railway over a laptop, why SQLite on a volume, why APScheduler in-process, why REST for the agent.
- Demo section: keep only widgets that mirror real features. Remove "Generate today's advice" and "AI alignment". Synthetic data stays clearly labelled as synthetic.
- Add a short "What I'd do next" or "Trade-offs" block — recruiters like it. Keep honest.
- Update `<meta>` description/keywords/og accordingly.

### 3. New pages — `projects/chunks.html`, `projects/gyn-dashboard.html`, `projects/prime-bilingual.html`
Copy the structure of `projects/this-site.html` (hero → what it does → architecture → decisions → back link). Each must have:
- Bilingual copy (`data-en` / `data-zh`) throughout
- An architecture diagram in the site's SVG style (clickable nodes optional but preferred)
- A **"Decisions"** section with 2–3 real trade-offs from the code/CLAUDE.md (e.g. Chunks: LWW vs CRDT, why soft deletes, why the scene-tag feature was removed; Gyn: why a journal whitelist plus a guideline route; Prime: why intercept TTML rather than OCR)
- Honest status line (Chunks: "PWA in daily use · iOS in progress"; Gyn: "in daily use by one researcher"; Prime: "personal use, not on the Chrome Web Store")
- Full `<head>` SEO block like the other project pages, canonical URL, og tags

### 4. `knowledge.md` (AI chatbot source of truth) — rewrite sections 1–4
- Section 1: title Design Engineer; USYD completed July 2026; add GitHub `https://github.com/Li1aid`; "Open to Design Engineer / Product Designer roles at early-stage teams in Sydney; full working rights (485 visa)".
- Section 2 table: fix dates/titles as above; add 2025–Present Design Engineer (independent).
- Section 3: mirror the new Skills section.
- Section 4: add entries 4.x for Chunks, Investment Assistant (accurate version), Gynaecology Research Dashboard, Prime Bilingual, This Portfolio — each with category, status, stack, what it is, key features, decisions, and the page URL. **Delete "4.5 Upcoming Projects"** (indie game / mobile app) — stale.
- Keep section 6 style rules. Add: "If asked whether Aiden is available for hire: yes, looking for Design Engineer / Product Designer roles in Sydney; direct them to email or LinkedIn."
- If the Worker caches the knowledge file, note in the commit message that it needs redeploying (`cd worker && npx wrangler deploy`).

### 5. Housekeeping
- `README.md`: update the "Projects on the site" list and the Investment Assistant line (it says Cloudflare Tunnel).
- `sitemap.xml`: add the three new pages; bump `lastmod` to today for changed pages.
- `humans.txt`, `status.json`: check for stale text ("student", "studying").
- Every `<img>` on the homepage must resolve. Every internal link must resolve. Run a quick link/asset check before the final commit (a small Node or Python script is fine).
- Mobile: the new cards and pages must not overflow horizontally at 375px.

## Constraints
- Do not change the visual design system, fonts, colours, animations, or the language-toggle mechanism.
- Do not add build tooling; the site is static with no build step.
- Do not invent metrics (user counts, downloads, revenue). "In daily use" and "in production" are the strongest claims allowed.
- Keep copy tight. Recruiter reading time per case study ≈ 90 seconds.
- Ask Aiden before: deleting any existing project page; changing the domain/CNAME; touching the `worker/` deployment.

## Commit plan (suggested)
1. `fix: correct Investment Assistant case study to match deployed architecture`
2. `feat: add Chunks, Gynaecology Research Dashboard and Prime Bilingual case studies`
3. `feat: homepage — reorder showcase, update about/timeline/skills for Design Engineer positioning`
4. `chore: refresh chatbot knowledge base, README, sitemap`

Then push to `origin main` and report what changed, what you could not verify, and anything you left for Aiden to decide.
