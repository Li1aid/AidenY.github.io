# aidenyang.me

Personal portfolio of **Xuejian (Aiden) Yang** — Sydney-based design engineer.

Live at **[aidenyang.me](https://aidenyang.me)** · Bilingual (EN / 中文)

## Architecture

- **Static site** — plain HTML/CSS/JS, hosted on GitHub Pages (this repo), custom domain via `CNAME`
- **AI chatbot** — Cloudflare Worker (`worker/`) at `ai.aidenyang.me`, proxying the Anthropic API
  - Knowledge base: `knowledge.md` (single source of truth for what the bot can say)
  - Conversation log: Cloudflare D1, auto-purged after 30 days (cron)
  - Admin dashboard on `/admin/*`, protected by Cloudflare Access
- **Animations** — GSAP + ScrollTrigger, canvas particle effects
- **Availability badge** — driven by `status.json`, editable from the worker admin panel

## Structure

```
index.html, style.css, script.js   # homepage
projects/                          # case-study pages (one html/css/js set per project)
Assets/                            # images used by the site
worker/                            # Cloudflare Worker source (deployed separately)
knowledge.md                       # chatbot knowledge base
sitemap.xml, robots.txt            # SEO
```

## Projects on the site

1. **Chunks** — language-learning app; Claude extracts phrases into SRS flashcards (PWA + iOS)
2. **Investment Assistant** — production portfolio dashboard (Flask + SQLite on Railway)
3. **Gyn Research Dashboard** — AI literature radar built for a medical researcher (Python + Claude)
5. **This Portfolio** — the site itself as a vibecoding case study
6. **CoLab** — hybrid learning platform for international design students
7. **ANNO** — companion health robot for older adults
8. **vividXperience** — Vision Pro spatial experience for Vivid Sydney
9. **Whisperfield** — ADHD-focused immersive meditation installation

## Development

Static site: open `index.html` in a browser — no build step.

Worker:

```bash
cd worker
npm install
npx wrangler dev      # local
npx wrangler deploy   # production
```

The Anthropic API key is set via `wrangler secret put`, never committed.

## Bilingual content

All translatable elements carry `data-en` / `data-zh` attributes:

```html
<element data-en="English text" data-zh="中文文本">English text</element>
```

## Contact

- Email: aidenyang5995@gmail.com
- LinkedIn: [aiden-yang-ty](https://www.linkedin.com/in/aiden-yang-ty)

---

© 2026 Xuejian (Aiden) Yang. All rights reserved.
