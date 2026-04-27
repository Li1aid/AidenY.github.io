/* ========================================
   CoLab Subpage — Interactive Demos
   ======================================== */

(function () {
    'use strict';

    // ----- Demo 1: Team Up -----

    const teamUpData = [
        { name: 'Yuchen Men',  initials: 'YM', role: 'Visualization · Storytelling', tags: ['Critical', 'Open-Minded'] },
        { name: 'Bella Wu',    initials: 'BW', role: 'Detail-Oriented · Leader',     tags: ['Visualization', 'Communication'] },
        { name: 'Chris Li',    initials: 'CL', role: 'Storytelling · Adventurous',   tags: ['Visualization', 'Detail'] },
        { name: 'Erin Zhao',   initials: 'EZ', role: 'Open-Minded · Strategist',     tags: ['Prototyping', 'Communication'] },
        { name: 'Felix Tran',  initials: 'FT', role: 'Adventurous · Innovator',      tags: ['Storytelling', 'Critical'] },
        { name: 'Robin Park',  initials: 'RP', role: 'Methodical · Researcher',      tags: ['Data Viz', 'IA'] },
    ];

    const myProfile = {
        name: 'Aiden Yang',
        initials: 'AY',
        role: 'UI/UX · AIGC Creator',
        tags: ['Vibecoding', 'Storytelling', 'Prototyping'],
        isMe: true,
    };

    function renderEmptyTeamupState(grid, message) {
        const empty = document.createElement('div');
        empty.style.gridColumn = '1 / -1';
        empty.style.color = 'var(--text-grey)';
        empty.style.fontFamily = 'Rajdhani, sans-serif';
        empty.style.fontSize = '0.95rem';
        empty.style.padding = '2rem 0';
        empty.style.textAlign = 'center';
        empty.textContent = message;
        grid.appendChild(empty);
    }

    function buildTeamupCard(person, opts) {
        const { idx = -1, connected = false, isMe = false, onConnect = null } = opts || {};
        const card = document.createElement('div');
        card.className = 'teamup-card';
        if (connected) card.classList.add('connected');
        if (isMe) card.classList.add('is-me');

        const tagsHTML = person.tags.map(t => `<span class="teamup-tag">${t}</span>`).join('');
        const meBadge = isMe ? '<span class="teamup-me-badge">YOU</span>' : '';
        const buttonHTML = isMe
            ? ''
            : `<button class="teamup-connect" type="button">${connected ? 'Connected ✓' : 'Connect'}</button>`;

        card.innerHTML = `
            <div class="teamup-card-head">
                <div class="teamup-avatar">${person.initials}</div>
                <div>
                    <div class="teamup-name">${person.name}${meBadge}</div>
                    <div class="teamup-role">${person.role}</div>
                </div>
            </div>
            <div class="teamup-tags">${tagsHTML}</div>
            ${buttonHTML}
        `;

        if (!isMe && onConnect) {
            card.querySelector('.teamup-connect').addEventListener('click', () => onConnect(idx));
        }
        return card;
    }

    function initTeamUp() {
        const grid = document.getElementById('teamup-grid');
        const status = document.getElementById('teamup-status');
        const tabs = document.querySelectorAll('.teamup-tab');
        if (!grid) return;

        const connected = new Set();
        let activeFilter = 'all';

        function toggleConnect(idx) {
            if (connected.has(idx)) connected.delete(idx);
            else connected.add(idx);
            updateStatus();
            render(activeFilter);
        }

        function render(filter) {
            activeFilter = filter;
            grid.innerHTML = '';

            if (filter === 'myteam') {
                grid.appendChild(buildTeamupCard(myProfile, { isMe: true }));
                if (connected.size > 0) {
                    teamUpData.forEach((p, i) => {
                        if (connected.has(i)) {
                            grid.appendChild(buildTeamupCard(p, { idx: i, connected: true, onConnect: toggleConnect }));
                        }
                    });
                }
                return;
            }

            if (filter === 'saved') {
                if (connected.size === 0) {
                    renderEmptyTeamupState(grid, 'No saved teammates yet — connect with someone in Card List first.');
                    return;
                }
                teamUpData.forEach((p, i) => {
                    if (connected.has(i)) {
                        grid.appendChild(buildTeamupCard(p, { idx: i, connected: true, onConnect: toggleConnect }));
                    }
                });
                return;
            }

            // 'all' (Card List)
            teamUpData.forEach((p, i) => {
                grid.appendChild(buildTeamupCard(p, { idx: i, connected: connected.has(i), onConnect: toggleConnect }));
            });
        }

        function updateStatus() {
            status.textContent = connected.size + ' connected';
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                render(tab.dataset.tab);
            });
        });

        render('all');
        updateStatus();
    }

    // ----- Demo 2: Lecture Player -----

    function initLecturePlayer() {
        const playBtn = document.getElementById('lecture-play');
        const fill = document.getElementById('lecture-progress-fill');
        const knob = document.getElementById('lecture-progress-knob');
        const time = document.getElementById('lecture-current');
        const chapter = document.getElementById('lecture-chapter');
        const playstate = document.getElementById('lecture-playstate');
        const progress = document.getElementById('lecture-progress');
        const chips = document.querySelectorAll('.chapter-chip');
        if (!playBtn) return;

        const total = 765; // 12:45 in seconds
        let current = 0;
        let playing = false;
        let intervalId = null;

        function fmt(t) {
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60);
            return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }

        function updateUI() {
            const pct = (current / total) * 100;
            fill.style.width = pct + '%';
            knob.style.left = pct + '%';
            time.textContent = fmt(current);
            updateChapter();
        }

        function updateChapter() {
            const items = Array.from(chips).map(c => ({
                el: c,
                t: parseInt(c.dataset.time, 10),
                label: c.dataset.label,
            })).sort((a, b) => a.t - b.t);

            let active = null;
            for (const it of items) {
                if (current >= it.t) active = it;
            }
            chips.forEach(c => c.classList.remove('active'));
            if (active) {
                active.el.classList.add('active');
                chapter.textContent = '— ' + active.label;
            } else {
                chapter.textContent = '— Intro';
            }
        }

        function setPlay(state) {
            playing = state;
            playBtn.classList.toggle('playing', playing);
            // The center play triangle is shown only when paused.
            playstate.classList.toggle('show', !playing);
            if (playing) {
                intervalId = setInterval(() => {
                    current += 2; // 2x speed for demo
                    if (current >= total) {
                        current = total;
                        setPlay(false);
                    }
                    updateUI();
                }, 100);
            } else if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        playBtn.addEventListener('click', () => setPlay(!playing));

        // Allow clicking the big center area to toggle play
        const stage = document.querySelector('#demo-lecture .lecture-stage');
        if (stage) {
            stage.addEventListener('click', () => setPlay(!playing));
        }

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                current = parseInt(chip.dataset.time, 10);
                updateUI();
                if (!playing) setPlay(true);
            });
        });

        progress.addEventListener('click', (e) => {
            const rect = progress.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            current = Math.max(0, Math.min(total, ratio * total));
            updateUI();
        });

        playstate.classList.add('show');
        updateUI();
    }

    // ----- Demo 3: Quiz -----

    const quizQuestions = [
        {
            q: 'What is the primary purpose of a grid system in interaction design?',
            options: [
                'Make the page look symmetrical',
                'Provide invisible structure that guides attention',
                'Enforce a single column layout',
                'Replace the need for a designer',
            ],
            correct: 1,
            explain: 'Grids create rhythm and hierarchy without being visible themselves.',
        },
        {
            q: 'Which property defines the vertical rhythm of typography on a page?',
            options: [
                'Letter-spacing',
                'Baseline grid',
                'Margin',
                'Z-index',
            ],
            correct: 1,
            explain: 'A baseline grid aligns text to a consistent vertical interval.',
        },
        {
            q: 'In a 12-column responsive grid, what changes most between breakpoints?',
            options: [
                'The number of columns and gutter sizing',
                'The font of body text',
                'The browser engine',
                'The page title',
            ],
            correct: 0,
            explain: 'Responsive grids reflow column counts and gutters per device.',
        },
    ];

    function initQuiz() {
        const card = document.getElementById('quiz-card');
        const qNum = document.getElementById('quiz-q-num');
        const qEl = document.getElementById('quiz-question');
        const opts = document.getElementById('quiz-options');
        const fb = document.getElementById('quiz-feedback');
        const nextBtn = document.getElementById('quiz-next');
        if (!card) return;

        let idx = 0;
        let answered = false;

        function render() {
            const q = quizQuestions[idx];
            qNum.textContent = String(idx + 1);
            qEl.textContent = q.q;
            opts.innerHTML = '';
            fb.textContent = '';
            fb.className = 'quiz-feedback';
            nextBtn.disabled = true;
            answered = false;

            q.options.forEach((opt, i) => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.type = 'button';
                btn.innerHTML = `<span class="quiz-option-letter">${String.fromCharCode(65 + i)}</span>${opt}`;
                btn.addEventListener('click', () => {
                    if (answered) return;
                    answered = true;
                    const isCorrect = i === q.correct;
                    btn.classList.add(isCorrect ? 'correct' : 'wrong');
                    if (!isCorrect) {
                        opts.children[q.correct].classList.add('correct');
                    }
                    Array.from(opts.children).forEach(c => c.disabled = true);
                    fb.textContent = (isCorrect ? '✓ Correct. ' : '✗ Not quite. ') + q.explain;
                    fb.classList.add(isCorrect ? 'correct' : 'wrong');
                    nextBtn.disabled = false;
                });
                opts.appendChild(btn);
            });
        }

        nextBtn.addEventListener('click', () => {
            idx = (idx + 1) % quizQuestions.length;
            render();
        });

        render();
    }

    // ----- Demo 4: Tutorial Whiteboard -----

    const termGlossary = {
        kerning: {
            label: 'KERNING',
            text: 'The manual spacing between two specific letters — e.g. tightening "AV" so the shapes feel balanced rather than gappy.',
        },
        baseline: {
            label: 'BASELINE GRID',
            text: 'An invisible horizontal ruler that text sits on. Aligning lines to it creates calm vertical rhythm across columns.',
        },
        negative: {
            label: 'NEGATIVE SPACE',
            text: 'Empty area between elements — not "wasted." It lets the eye rest, groups related items, and gives content room to breathe.',
        },
        hierarchy: {
            label: 'HIERARCHY',
            text: 'Using size, weight, color and spacing to guide the eye in order of importance. Without it, every element competes equally.',
        },
    };

    function initWhiteboardTooltip() {
        const tooltip = document.getElementById('term-tooltip');
        const terms = document.querySelectorAll('.term');
        if (!tooltip || terms.length === 0) return;

        const container = tooltip.parentElement; // .tutorial-content (positioned)

        function show(termEl) {
            const key = termEl.dataset.term;
            const data = termGlossary[key];
            if (!data) return;

            tooltip.innerHTML = `<div class="term-tooltip-head">${data.label}</div>${data.text}`;
            tooltip.setAttribute('aria-hidden', 'false');

            // Position tooltip below the hovered term, clamped to container bounds
            const containerRect = container.getBoundingClientRect();
            const termRect = termEl.getBoundingClientRect();

            const left = termRect.left - containerRect.left;
            const top = termRect.bottom - containerRect.top + 8;

            tooltip.style.left = Math.max(8, Math.min(left, container.clientWidth - 296)) + 'px';
            tooltip.style.top = top + 'px';
            tooltip.classList.add('visible');
            termEl.classList.add('active');
        }

        function hide() {
            tooltip.classList.remove('visible');
            tooltip.setAttribute('aria-hidden', 'true');
            terms.forEach(t => t.classList.remove('active'));
        }

        terms.forEach(t => {
            t.addEventListener('mouseenter', () => show(t));
            t.addEventListener('mouseleave', hide);
            t.addEventListener('focus', () => show(t));
            t.addEventListener('blur', hide);
            t.tabIndex = 0;
        });
    }

    function initWhiteboardToolbar() {
        const tools = document.querySelectorAll('.wb-tool');
        const toggle = document.getElementById('wb-toggle');
        const state = document.getElementById('wb-toggle-state');

        tools.forEach(t => {
            t.addEventListener('click', () => {
                tools.forEach(x => x.classList.remove('active'));
                t.classList.add('active');
            });
        });

        if (toggle && state) {
            toggle.addEventListener('click', () => {
                const on = toggle.classList.toggle('on');
                state.textContent = on ? 'ON' : 'OFF';
            });
        }
    }

    function initChat() {
        const stream = document.getElementById('chat-stream');
        const form = document.getElementById('chat-form');
        const input = document.getElementById('chat-input');
        const count = document.getElementById('chat-count');
        if (!stream || !form) return;

        const seed = [
            { name: 'Hannah Lee', cls: 'instructor', text: 'Welcome — drop questions here.' },
            { name: 'Mia',  cls: '', text: 'Loving the kerning part ✨' },
            { name: 'Sam',  cls: '', text: 'Can someone share the figma?' },
            { name: 'Hannah Lee', cls: 'instructor', text: 'Pinning it now — resources tab.' },
        ];

        const ambient = [
            'so helpful 🙌',
            'baseline grid finally clicked',
            '+1 to the figma file',
            'recording later?',
            'love the AV kerning example',
            'is this in the slides?',
        ];
        const ambientNames = ['Liu', 'Aaron', 'Priya', 'Jules', 'Noa', 'Theo', 'Ren', 'Casey'];

        function addMsg(name, cls, text) {
            const msg = document.createElement('div');
            msg.className = 'chat-msg';
            msg.innerHTML = `<span class="chat-msg-name ${cls}">${name}</span><span class="chat-msg-text">${text}</span>`;
            stream.appendChild(msg);
            stream.scrollTop = stream.scrollHeight;
            while (stream.children.length > 30) stream.removeChild(stream.firstChild);
        }

        seed.forEach(m => addMsg(m.name, m.cls, m.text));

        let viewers = 847;
        setInterval(() => {
            viewers += Math.floor(Math.random() * 5) - 2;
            if (viewers < 800) viewers = 800;
            if (viewers > 920) viewers = 920;
            if (count) count.textContent = String(viewers);
        }, 3000);

        function scheduleAmbient() {
            const delay = 4500 + Math.random() * 5500;
            setTimeout(() => {
                const name = ambientNames[Math.floor(Math.random() * ambientNames.length)];
                const text = ambient[Math.floor(Math.random() * ambient.length)];
                addMsg(name, '', text);
                scheduleAmbient();
            }, delay);
        }
        scheduleAmbient();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const v = input.value.trim();
            if (!v) return;
            addMsg('You', 'you', v);
            input.value = '';
            if (Math.random() < 0.5) {
                setTimeout(() => {
                    addMsg('Hannah Lee', 'instructor', 'Great point — let\'s circle back.');
                }, 1200 + Math.random() * 800);
            }
        });
    }

    const aiKnowledge = {
        kerning: 'Kerning adjusts the space between two specific letters so visual rhythm reads evenly — e.g. tightening "AV" so the angled shapes feel balanced.',
        baseline: 'A baseline grid is an invisible horizontal ruler text sits on. Aligning to it creates calm vertical rhythm across columns.',
        rhythm: 'Visual rhythm is the repeated cadence of size, spacing or color across a layout. Like music, it sets the tempo of how you scan a page.',
        negative: 'Negative space (whitespace) is the empty area around elements. It is an active design element — it groups, separates, and gives focus.',
        hierarchy: 'Hierarchy is how a layout signals what to read first, second, third. It uses scale, weight, contrast and spacing to lead the eye.',
        whitespace: 'Whitespace is the breathing room around content. Generous whitespace looks premium; cramped layouts feel busy and cheap.',
        leading: 'Leading is the vertical space between baselines of lines. Tight leading feels dense; loose leading feels airy.',
        modular: 'A modular scale is a sequence of sizes derived from a ratio (e.g. 1.25x). It gives typography proportional harmony.',
    };

    function initAI() {
        const stream = document.getElementById('ai-stream');
        const form = document.getElementById('ai-form');
        const input = document.getElementById('ai-input');
        if (!stream || !form) return;

        function addMsg(text, who) {
            const msg = document.createElement('div');
            msg.className = 'ai-msg ai-msg-' + who;
            msg.textContent = text;
            stream.appendChild(msg);
            stream.classList.add('has-msgs');
            stream.scrollTop = stream.scrollHeight;
            return msg;
        }

        function answer(question) {
            const q = question.toLowerCase();
            const key = Object.keys(aiKnowledge).find(k => q.includes(k));
            const reply = key
                ? aiKnowledge[key]
                : `Good question — for "${question}" I'd point you to the highlighted terms in the principles list above. Hover any of them for an inline explanation.`;

            const typing = addMsg('…', 'bot');
            let i = 0;
            const tick = setInterval(() => {
                i++;
                typing.textContent = reply.slice(0, i);
                stream.scrollTop = stream.scrollHeight;
                if (i >= reply.length) clearInterval(tick);
            }, 16);
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const v = input.value.trim();
            if (!v) return;
            addMsg(v, 'user');
            input.value = '';
            setTimeout(() => answer(v), 300);
        });
    }

    // ----- Init on DOM ready -----

    function init() {
        initTeamUp();
        initLecturePlayer();
        initQuiz();
        initWhiteboardTooltip();
        initWhiteboardToolbar();
        initChat();
        initAI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
