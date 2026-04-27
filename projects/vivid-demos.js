/* ========================================
   vividXperience — Interactive Demos
   Vision Pro shell + game-engine 3D map (drag + WASD)
   + 4 immersive scenes (Drone/Opera/Bridge/Walk)
   ======================================== */

(function () {
    'use strict';

    function $(s, r = document) { return r.querySelector(s); }
    function $$(s, r = document) { return r.querySelectorAll(s); }

    /* ---------- Vision Pro shell controller ---------- */

    let currentScreen = 'home';

    function setScreen(name) {
        const previous = currentScreen;
        currentScreen = name;

        const useGsap = typeof window.gsap !== 'undefined';
        $$('.vp-screen').forEach(s => {
            const isTarget = s.dataset.screen === name;
            const wasActive = s.dataset.screen === previous;
            if (isTarget && !s.classList.contains('active')) {
                s.classList.add('active');
                if (useGsap) {
                    gsap.fromTo(s,
                        { opacity: 0, scale: 1.04 },
                        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
                    );
                }
            } else if (!isTarget && s.classList.contains('active')) {
                if (useGsap && wasActive) {
                    gsap.to(s, {
                        opacity: 0, scale: 0.96, duration: 0.3, ease: 'power2.in',
                        onComplete: () => s.classList.remove('active'),
                    });
                } else {
                    s.classList.remove('active');
                }
            }
        });

        $$('.vp-sb-item').forEach(b => b.classList.toggle('active', b.dataset.screen === name));

        // Lifecycle hooks
        if (name === 'immersive') startImmersive();
        else stopImmersive();

        if (name === 'map') startMap();
        else stopMap();
    }

    function initShell() {
        const poster = $('#vp-poster');
        const enter = $('#vp-enter');
        const shell = $('#vp-shell');
        if (!poster || !enter || !shell) return;

        function launch() {
            poster.classList.add('hidden');
            shell.classList.add('active');
            shell.setAttribute('aria-hidden', 'false');
            setScreen('home');
        }

        enter.addEventListener('click', launch);
        poster.addEventListener('click', (e) => {
            if (e.target === poster || e.currentTarget === poster) launch();
        });
    }

    function initSidebar() {
        $$('.vp-sb-item').forEach(btn => {
            btn.addEventListener('click', () => setScreen(btn.dataset.screen));
        });
    }

    /* ---------- Tile/feature jumps ---------- */

    function jumpFromTile(target, eventName) {
        const screenMap = {
            map: 'map',
            events: 'events',
            immersive: 'immersive',
            album: 'favs',
            settings: 'settings',
        };
        if (eventName) switchImmersiveScene(eventName);
        setScreen(screenMap[target] || 'home');
    }

    function initJumps() {
        $$('[data-jump]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const target = el.dataset.jump;
                const eventName = el.dataset.event;
                jumpFromTile(target, eventName);

                if (!el.closest('#vivid-demo')) {
                    const demo = document.getElementById('vivid-demo');
                    if (demo) demo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        const poster = $('#vp-poster');
                        if (poster && !poster.classList.contains('hidden')) {
                            $('#vp-enter')?.click();
                        }
                    }, 600);
                }
            });
        });
    }

    /* ---------- 3D MAP — game-engine camera ---------- */

    // Camera state — only rotation (drag to look around). No translation.
    let cam = { rotZ: 0, rotX: 60 };
    let camAuto = true;
    let camAutoFrame = null;
    let mapDragging = false;
    let mapDragStart = { x: 0, y: 0, rotZ: 0, rotX: 60 };

    function applyCamera() {
        const world = $('#vp-world');
        if (!world) return;
        world.style.transform = `translate(-50%, -50%) rotateX(${cam.rotX}deg) rotateZ(${cam.rotZ}deg)`;
        // Push camera angles to CSS variables so each landmark / pin
        // can billboard itself toward the viewer.
        const canvas = $('#vp-map-canvas');
        if (canvas) {
            canvas.style.setProperty('--cam-rx', cam.rotX + 'deg');
            canvas.style.setProperty('--cam-rz', cam.rotZ + 'deg');
        }
    }

    function startMapAutoSpin() {
        stopMapAutoSpin();
        if (!camAuto) return;
        const tick = () => {
            if (!camAuto || mapDragging) {
                camAutoFrame = null;
                return;
            }
            cam.rotZ = (cam.rotZ + 0.05) % 360;
            applyCamera();
            camAutoFrame = requestAnimationFrame(tick);
        };
        camAutoFrame = requestAnimationFrame(tick);
    }

    function stopMapAutoSpin() {
        if (camAutoFrame) {
            cancelAnimationFrame(camAutoFrame);
            camAutoFrame = null;
        }
    }

    function initMap() {
        const canvas = $('#vp-map-canvas');
        const reset = $('#vp-map-reset');
        const startBtn = $('#vp-map-start');
        const title = $('#vp-map-title');
        const desc = $('#vp-map-desc');
        if (!canvas) return;

        const meta = {
            'Opera Light':    'Sydney Opera House — projection mapping turns the sails into a moving canvas.',
            'Harbour Bridge': 'Harbour Bridge — synchronised lights pulse along the steel arch.',
            'Drone Show':     'Botanic Gardens — 500 drones choreograph stories above the trees.',
        };

        let selected = null;

        // Drag to rotate the world (look around)
        canvas.addEventListener('mousedown', (e) => {
            mapDragging = true;
            camAuto = false;
            mapDragStart = { x: e.clientX, y: e.clientY, rotZ: cam.rotZ, rotX: cam.rotX };
            stopMapAutoSpin();
        });
        window.addEventListener('mousemove', (e) => {
            if (!mapDragging) return;
            const dx = e.clientX - mapDragStart.x;
            const dy = e.clientY - mapDragStart.y;
            cam.rotZ = mapDragStart.rotZ + dx * 0.4;
            cam.rotX = Math.max(25, Math.min(80, mapDragStart.rotX - dy * 0.25));
            applyCamera();
        });
        window.addEventListener('mouseup', () => { mapDragging = false; });

        // Reset camera
        if (reset) {
            reset.addEventListener('click', () => {
                cam = { rotZ: 0, rotX: 60 };
                applyCamera();
                camAuto = true;
                startMapAutoSpin();
            });
        }

        // Pin clicks
        $$('.vp-landmark-pin').forEach(pin => {
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                const event = pin.dataset.event;
                $$('.vp-landmark').forEach(l => l.classList.remove('selected'));
                const lm = pin.closest('.vp-landmark');
                if (lm) lm.classList.add('selected');

                selected = event;
                if (title) title.textContent = event;
                if (desc) desc.textContent = meta[event] || '';
                if (startBtn) startBtn.disabled = false;
            });
        });

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (!selected) return;
                switchImmersiveScene(selected);
                setScreen('immersive');
            });
        }

        applyCamera();
    }

    function startMap() { startMapAutoSpin(); }
    function stopMap() { stopMapAutoSpin(); }

    /* ---------- EVENTS list ---------- */

    const allEvents = [
        { name: 'Drone Symphony',        cat: 'drone',    c1: '#ff64c8', c2: '#64c8ff', event: 'Drone Show' },
        { name: 'Opera Mapping',         cat: 'light',    c1: '#b450ff', c2: '#ff5050', event: 'Opera Light' },
        { name: 'Bridge Pulse',          cat: 'light',    c1: '#2cd9ff', c2: '#ffc864', event: 'Harbour Bridge' },
        { name: 'Drone Dragon',          cat: 'drone',    c1: '#ff5050', c2: '#ffc864', event: 'Drone Show' },
        { name: 'Virtual Sydney',        cat: 'vr',       c1: '#2cd9ff', c2: '#c45cff', event: 'Opera Light' },
        { name: 'Photographer Workshop', cat: 'workshop', c1: '#ffc864', c2: '#ff64c8', event: 'Opera Light' },
    ];
    const catLabels = { light: 'LIGHT SHOW', drone: 'DRONE', vr: 'VIRTUAL TOUR', workshop: 'WORKSHOP' };

    function thumbBg(c1, c2) {
        return `radial-gradient(circle at 30% 30%, ${c1}cc, transparent 55%),` +
               `radial-gradient(circle at 70% 70%, ${c2}cc, transparent 55%),` +
               `linear-gradient(135deg, #1a0a2e, #050218)`;
    }

    function renderEvents(filter) {
        const grid = $('#vp-events-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const list = filter === 'all' ? allEvents : allEvents.filter(e => e.cat === filter);
        list.forEach(ev => {
            const card = document.createElement('button');
            card.className = 'vp-evt-card';
            card.innerHTML = `
                <div class="vp-evt-thumb" style="background: ${thumbBg(ev.c1, ev.c2)}"></div>
                <div class="vp-evt-info">
                    <div class="vp-evt-cat">${catLabels[ev.cat]}</div>
                    <div class="vp-evt-name">${ev.name}</div>
                </div>
            `;
            card.addEventListener('click', () => {
                switchImmersiveScene(ev.event);
                setScreen('immersive');
            });
            grid.appendChild(card);
        });
    }

    function initEvents() {
        $$('.vp-evt-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.vp-evt-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderEvents(tab.dataset.cat);
            });
        });
        renderEvents('all');
    }

    /* ---------- IMMERSIVE — orchestrates 4 scenes ---------- */

    let immersivePlaying = false;
    let immersiveControlsVisible = false;

    function switchImmersiveScene(scene) {
        const bg = $('#vp-imm-bg');
        const title = $('#vp-imm-title');
        if (bg) {
            bg.dataset.scene = scene;
            bg.classList.remove('scene-Opera-Light', 'scene-Harbour-Bridge', 'scene-Drone-Show');
            bg.classList.add('scene-' + scene.replace(/\s+/g, '-'));
            bg.style.animation = 'none';
            requestAnimationFrame(() => { bg.style.animation = ''; });
        }
        if (title) title.textContent = scene;
        $$('.vp-imm-scene').forEach(s => s.classList.toggle('active', s.dataset.scene === scene));

        // Lifecycle per scene
        stopAllSceneEffects();
        if (scene === 'Drone Show') startDroneSwarm();
        else if (scene === 'Harbour Bridge') startBridgeFireworks();
        // Opera Light is pure CSS — no JS needed.
    }

    function stopAllSceneEffects() {
        stopDroneSwarm();
        stopBridgeFireworks();
    }

    function showImmersiveControls() {
        immersiveControlsVisible = true;
        $('#vp-imm-scenes')?.classList.add('show');
        $('#vp-imm-exit')?.classList.add('show');
    }
    function hideImmersiveControls() {
        immersiveControlsVisible = false;
        $('#vp-imm-scenes')?.classList.remove('show');
        $('#vp-imm-exit')?.classList.remove('show');
    }

    function startImmersive() {
        if (immersivePlaying) return;
        immersivePlaying = true;
        immersiveControlsVisible = false;
        const bg = $('#vp-imm-bg');
        if (bg) {
            const scene = bg.dataset.scene;
            bg.classList.remove('scene-Opera-Light', 'scene-Harbour-Bridge', 'scene-Drone-Show');
            bg.classList.add('scene-' + scene.replace(/\s+/g, '-'));
            stopAllSceneEffects();
            if (scene === 'Drone Show') startDroneSwarm();
            else if (scene === 'Harbour Bridge') startBridgeFireworks();
        }
    }

    function stopImmersive() {
        immersivePlaying = false;
        hideImmersiveControls();
        stopAllSceneEffects();
    }

    function initImmersive() {
        const stage = $('#vp-imm-stage');
        const exit = $('#vp-imm-exit');
        const parallax = $('#vp-imm-parallax');
        if (!stage) return;

        if (parallax) {
            stage.addEventListener('mousemove', (e) => {
                const rect = stage.getBoundingClientRect();
                const cx = (e.clientX - rect.left) / rect.width - 0.5;
                const cy = (e.clientY - rect.top) / rect.height - 0.5;
                parallax.style.transform = `translate3d(${cx * -20}px, ${cy * -15}px, 0) rotateY(${cx * 4}deg) rotateX(${cy * -4}deg)`;
            });
            stage.addEventListener('mouseleave', () => { parallax.style.transform = ''; });
        }

        // Track whether the click came from a drag
        let stageMouseDownX = null;
        let stageMouseDownY = null;
        stage.addEventListener('mousedown', (e) => {
            stageMouseDownX = e.clientX;
            stageMouseDownY = e.clientY;
        });
        stage.addEventListener('click', (e) => {
            // Don't toggle controls if it was a drag (>6px movement)
            if (stageMouseDownX !== null) {
                const dx = Math.abs(e.clientX - stageMouseDownX);
                const dy = Math.abs(e.clientY - stageMouseDownY);
                if (dx > 6 || dy > 6) { stageMouseDownX = null; return; }
            }
            stageMouseDownX = null;
            if (immersiveControlsVisible) hideImmersiveControls();
            else showImmersiveControls();
        });

        ['#vp-imm-scenes', '#vp-imm-exit', '#opera-mode-picker', '#drone-shape-stepper'].forEach(sel => {
            const el = $(sel);
            if (el) el.addEventListener('click', e => e.stopPropagation());
        });

        $$('.vp-imm-scene').forEach(chip => {
            chip.addEventListener('click', () => switchImmersiveScene(chip.dataset.scene));
        });

        // Opera light-mode picker
        $$('.opera-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.dataset.mode;
                const svg = document.querySelector('.vp-imm-art-opera');
                if (svg) svg.dataset.lightMode = mode;
                $$('.opera-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
            });
        });

        if (exit) exit.addEventListener('click', () => setScreen('home'));
    }

    /* ---------- DRONE SHOW — user-pickable recognisable shape morphs ----------
       Each shape function returns an array of [x, y] points where x,y in [0,1]
       (x = horizontal, y = vertical, 0 at top). The number of points returned
       determines how many drones are needed; we provision enough particles to
       cover the largest shape, and "park" extras around the edge when smaller
       shapes are active. */

    const DRONE_COUNT = 130; // enough capacity for SYDNEY 6-letter pixel art
    let droneSwarmTimer = null;
    let droneShapeKey = 'infinity';
    let droneSwarmInited = false;
    let droneAutoEnabled = true;

    // ---- Helper: convert pixel-grid into [0,1] coordinates ---------------
    function pixelsTo01(pixels, gridW, gridH, padX = 0.06, padY = 0.12) {
        return pixels.map(([x, y]) => [
            padX + (x / (gridW - 1)) * (1 - 2 * padX),
            padY + (y / (gridH - 1)) * (1 - 2 * padY),
        ]);
    }

    // Pad/trim a points list to exactly DRONE_COUNT.
    // If the shape uses fewer points than DRONE_COUNT, we duplicate
    // existing points (with a tiny jitter) — that keeps every extra drone
    // ON the shape, never floating outside it.
    function padToCount(points, count) {
        if (points.length >= count) return points.slice(0, count);
        if (points.length === 0) return [];

        const out = points.slice();
        let cursor = 0;
        while (out.length < count) {
            const [x, y] = points[cursor % points.length];
            // Tiny jitter (deterministic) so duplicates aren't perfectly
            // stacked — produces a slightly thicker line look.
            const jx = ((cursor * 7919) % 11 - 5) * 0.0008;
            const jy = ((cursor * 6113) % 11 - 5) * 0.0008;
            out.push([x + jx, y + jy]);
            cursor++;
        }
        return out;
    }

    // ---- Shape: INFINITY (∞) — Bernoulli lemniscate -----------------
    // A clean, dense, continuously-traced infinity loop. Reads as a
    // confident abstract symbol (motion / endlessness) and is dense
    // enough that every drone lands on the curve.
    function shape_infinity() {
        const pts = [];
        const n = 130;
        const a = 0.36; // overall scale of the lobes
        for (let i = 0; i < n; i++) {
            const t = (i / n) * Math.PI * 2;
            // Lemniscate parametric form
            const denom = 1 + Math.sin(t) * Math.sin(t);
            const x = (a * Math.cos(t)) / denom;
            const y = (a * Math.sin(t) * Math.cos(t)) / denom;
            pts.push([0.5 + x, 0.5 + y * 0.95]);
        }
        return pts;
    }

    // Linear-interpolate along a closed polyline, returning `count`
    // evenly-spaced points around its perimeter.
    function resampleClosedPath(pts, count) {
        if (pts.length < 2) return pts;
        // Cumulative segment lengths (treating last->first as closing seg).
        const segs = [];
        let total = 0;
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            const dx = b[0] - a[0], dy = b[1] - a[1];
            const len = Math.hypot(dx, dy);
            segs.push({ a, b, len });
            total += len;
        }
        const out = [];
        const step = total / count;
        let segIdx = 0;
        let segConsumed = 0;
        for (let i = 0; i < count; i++) {
            let target = i * step;
            // Advance through segments until target falls inside current.
            while (segIdx < segs.length && target > segConsumed + segs[segIdx].len) {
                segConsumed += segs[segIdx].len;
                segIdx++;
            }
            if (segIdx >= segs.length) { out.push(pts[0]); continue; }
            const s = segs[segIdx];
            const t = s.len === 0 ? 0 : (target - segConsumed) / s.len;
            out.push([s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t]);
        }
        return out;
    }

    // ---- Shape: HARBOUR BRIDGE — single arch + deck + pylons -----------
    function shape_bridge() {
        const pts = [];
        // Main arch (top curve) — 30 drones along it
        const archCount = 36;
        for (let i = 0; i < archCount; i++) {
            const t = i / (archCount - 1);
            const x = 0.1 + t * 0.8;
            const y = 0.55 - 0.32 * Math.sin(t * Math.PI);
            pts.push([x, y]);
        }
        // Deck (horizontal line)
        const deckCount = 24;
        for (let i = 0; i < deckCount; i++) {
            const t = i / (deckCount - 1);
            pts.push([0.1 + t * 0.8, 0.6]);
        }
        // Vertical hangers connecting deck to arch
        const hangerCount = 9;
        for (let i = 0; i < hangerCount; i++) {
            const t = (i + 0.5) / hangerCount;
            const x = 0.15 + t * 0.7;
            const yArch = 0.55 - 0.32 * Math.sin(((x - 0.1) / 0.8) * Math.PI);
            // Add 2 dots per hanger
            pts.push([x, yArch + (0.6 - yArch) * 0.33]);
            pts.push([x, yArch + (0.6 - yArch) * 0.66]);
        }
        // Pylons (left + right rectangles)
        const pylonY = [0.55, 0.6, 0.65, 0.7];
        pylonY.forEach(y => {
            pts.push([0.07, y]);
            pts.push([0.93, y]);
        });
        return pts;
    }

    // ---- Shape: OPERA HOUSE — sail silhouettes -------------------------
    function shape_opera() {
        const pts = [];
        // Three main sail outlines using parametric arcs
        const sails = [
            { cx: 0.30, cy: 0.55, w: 0.10, h: 0.30 },
            { cx: 0.45, cy: 0.50, w: 0.13, h: 0.36 },
            { cx: 0.60, cy: 0.55, w: 0.10, h: 0.28 },
            { cx: 0.74, cy: 0.60, w: 0.07, h: 0.20 },
        ];
        sails.forEach(s => {
            // Each sail uses ~16 dots tracing the curved triangle outline
            for (let i = 0; i < 16; i++) {
                const t = i / 15;
                const x = s.cx - s.w / 2 + s.w * t;
                const y = s.cy + 0.05 - s.h * Math.sin(t * Math.PI) * 0.95;
                pts.push([x, y]);
            }
        });
        // Base / waterline
        for (let i = 0; i < 18; i++) {
            const t = i / 17;
            pts.push([0.18 + t * 0.65, 0.66]);
        }
        // Reflection in water (mirrored sails, dimmer cluster of dots)
        sails.forEach(s => {
            for (let i = 0; i < 5; i++) {
                const t = i / 4;
                pts.push([s.cx - s.w / 2 + s.w * t, s.cy + 0.18 + 0.04 * Math.sin(t * Math.PI)]);
            }
        });
        return pts;
    }

    // ---- Shape: WAVE — flowing horizontal wave -------------------------
    function shape_wave() {
        const pts = [];
        const rows = 3;
        const cols = 28;
        for (let r = 0; r < rows; r++) {
            for (let i = 0; i < cols; i++) {
                const t = i / (cols - 1);
                const phase = r * 0.6;
                const y = 0.4 + r * 0.08 + 0.16 * Math.sin(t * Math.PI * 3 + phase);
                pts.push([0.05 + t * 0.9, y]);
            }
        }
        return pts;
    }

    // ---- Shape: HEART --------------------------------------------------
    function shape_heart() {
        const pts = [];
        const n = 70;
        for (let i = 0; i < n; i++) {
            const t = (i / n) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            pts.push([0.5 + x / 38, 0.55 + y / 38]);
        }
        return pts;
    }

    // ---- Shape: SYDNEY pixel-letter text -------------------------------
    function shape_sydney() {
        const letters = {
            S: [[0,0],[1,0],[2,0],[0,1],[0,2],[1,2],[2,2],[2,3],[2,4],[0,4],[1,4]],
            Y: [[0,0],[2,0],[1,1],[1,2],[1,3],[1,4]],
            D: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,4],[2,1],[2,2],[2,3]],
            N: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,1],[2,2],[3,3],[3,0],[3,1],[3,2],[3,3],[3,4]],
            E: [[0,0],[1,0],[2,0],[0,1],[0,2],[1,2],[0,3],[0,4],[1,4],[2,4]],
        };
        const word = ['S','Y','D','N','E','Y'];
        const widths = { S: 3, Y: 3, D: 3, N: 4, E: 3 };
        const rows = 5;
        const sourcePts = [];
        let cursorX = 0;
        word.forEach(L => {
            const lw = widths[L];
            letters[L].forEach(([x, y]) => {
                sourcePts.push([cursorX + x, y]);
            });
            cursorX += lw + 1;
        });
        const totalW = cursorX - 1;
        return sourcePts.map(([x, y]) => [
            0.05 + (x / (totalW - 1)) * 0.9,
            0.35 + (y / (rows - 1)) * 0.3,
        ]);
    }

    const droneShapes = {
        infinity: { name: 'INFINITY',       fn: shape_infinity, pal: ['#2cd9ff', '#c45cff', '#ffffff'] },
        bridge:   { name: 'HARBOUR BRIDGE', fn: shape_bridge,   pal: ['#2cd9ff', '#ffc864', '#ffffff'] },
        opera:    { name: 'OPERA HOUSE',    fn: shape_opera,    pal: ['#ff3da6', '#c45cff', '#ffffff'] },
        sydney:   { name: 'SYDNEY',         fn: shape_sydney,   pal: ['#2cd9ff', '#c45cff', '#ffffff'] },
        wave:     { name: 'WAVE',           fn: shape_wave,     pal: ['#c45cff', '#2cd9ff', '#ff64c8'] },
        heart:    { name: 'HEART',          fn: shape_heart,    pal: ['#ff3da6', '#ff64a0', '#ffc864'] },
    };

    function buildDroneSwarmDOM() {
        const swarm = $('#drone-swarm');
        if (!swarm || droneSwarmInited) return;
        for (let i = 0; i < DRONE_COUNT; i++) {
            const dot = document.createElement('span');
            dot.className = 'drone-particle';
            // Initial position: scattered randomly across the container.
            dot.style.left = (40 + (Math.random() - 0.5) * 50) + '%';
            dot.style.top = (40 + (Math.random() - 0.5) * 50) + '%';
            swarm.appendChild(dot);
        }
        droneSwarmInited = true;
    }

    function applyDroneShape(key) {
        const swarm = $('#drone-swarm');
        if (!swarm) return;
        const shape = droneShapes[key];
        if (!shape) return;
        const dots = swarm.querySelectorAll('.drone-particle');
        const points = padToCount(shape.fn(), DRONE_COUNT);
        const label = $('#drone-shape-label');
        if (label) label.textContent = shape.name;

        // Place each particle along the resampled outline so the line
        // is dense and clean — no stray "spare" drones drift outside the shape.
        const pal = shape.pal;
        dots.forEach((dot, i) => {
            const [px, py] = points[i] || [0.5, 0.5];
            dot.style.left = (px * 100) + '%';
            dot.style.top = (py * 100) + '%';
            dot.style.opacity = '';
            dot.style.background = pal[i % pal.length];
            dot.style.boxShadow = `0 0 8px ${pal[i % pal.length]}, 0 0 16px ${pal[(i+1) % pal.length]}`;
            dot.style.transform = 'translate(-50%, -50%)';
        });

        droneShapeKey = key;
    }

    const droneShapeOrder = ['infinity', 'bridge', 'opera', 'sydney', 'wave', 'heart'];

    function setDroneShape(key) {
        droneAutoEnabled = false; // user took over
        applyDroneShape(key);
        if (droneSwarmTimer) {
            clearInterval(droneSwarmTimer);
            droneSwarmTimer = null;
        }
    }

    function stepDroneShape(direction) {
        const i = droneShapeOrder.indexOf(droneShapeKey);
        const n = droneShapeOrder.length;
        const next = ((i + direction) % n + n) % n;
        setDroneShape(droneShapeOrder[next]);
    }

    function initDroneShapePicker() {
        const prev = $('#drone-shape-prev');
        const next = $('#drone-shape-next');
        if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); stepDroneShape(-1); });
        if (next) next.addEventListener('click', (e) => { e.stopPropagation(); stepDroneShape(1); });
    }

    function startDroneSwarm() {
        buildDroneSwarmDOM();
        droneAutoEnabled = true;
        let idx = 0;
        applyDroneShape(droneShapeOrder[idx]);
        if (droneSwarmTimer) clearInterval(droneSwarmTimer);
        droneSwarmTimer = setInterval(() => {
            if (!droneAutoEnabled) return;
            idx = (idx + 1) % droneShapeOrder.length;
            applyDroneShape(droneShapeOrder[idx]);
        }, 4500);
    }

    function stopDroneSwarm() {
        if (droneSwarmTimer) {
            clearInterval(droneSwarmTimer);
            droneSwarmTimer = null;
        }
    }

    /* ---------- HARBOUR BRIDGE — fireworks ---------- */

    let fireworksTimer = null;
    let fireworksRunning = false;

    function spawnFirework() {
        const layer = $('#bridge-fireworks');
        if (!layer) return;

        const NS = 'http://www.w3.org/2000/svg';

        // Random launch position along the bridge (top of arch area)
        const startX = -180 + Math.random() * 360;
        const startY = 80;
        const peakX = startX + (Math.random() - 0.5) * 60;
        const peakY = -110 - Math.random() * 40;

        // Rocket
        const rocket = document.createElementNS(NS, 'circle');
        rocket.setAttribute('cx', startX);
        rocket.setAttribute('cy', startY);
        rocket.setAttribute('r', 2.5);
        rocket.classList.add('firework-rocket');
        const colorPool = ['rgba(255, 220, 130, 1)', 'rgba(255, 100, 200, 1)', 'rgba(150, 230, 255, 1)', 'rgba(196, 92, 255, 1)', 'rgba(255, 255, 255, 1)'];
        const color = colorPool[Math.floor(Math.random() * colorPool.length)];
        rocket.style.fill = color;
        rocket.style.color = color;
        layer.appendChild(rocket);

        const launchDuration = 800;
        const burstDuration = 1400;
        const start = performance.now();

        function tick(now) {
            const elapsed = now - start;
            if (elapsed < launchDuration) {
                // Rocket flies up
                const t = elapsed / launchDuration;
                const cx = startX + (peakX - startX) * t;
                const cy = startY + (peakY - startY) * t;
                rocket.setAttribute('cx', cx);
                rocket.setAttribute('cy', cy);
                rocket.setAttribute('r', 2.5 + Math.sin(t * Math.PI) * 1.5);
                requestAnimationFrame(tick);
            } else if (elapsed < launchDuration + burstDuration) {
                // Burst!
                if (rocket.parentNode) rocket.remove();
                if (!burstSpawned) {
                    burstSpawned = true;
                    const lines = 16;
                    for (let i = 0; i < lines; i++) {
                        const angle = (i / lines) * Math.PI * 2;
                        const length = 50 + Math.random() * 30;
                        const line = document.createElementNS(NS, 'line');
                        line.setAttribute('x1', peakX);
                        line.setAttribute('y1', peakY);
                        line.setAttribute('x2', peakX);
                        line.setAttribute('y2', peakY);
                        line.classList.add('firework-burst-line');
                        line.style.stroke = color;
                        line.style.color = color;
                        layer.appendChild(line);
                        burstLines.push({ el: line, angle, length, color });
                    }
                }
                const t = (elapsed - launchDuration) / burstDuration;
                burstLines.forEach(({ el, angle, length }) => {
                    const ext = length * t;
                    const tail = Math.max(0, ext - 20);
                    el.setAttribute('x1', peakX + Math.cos(angle) * tail);
                    el.setAttribute('y1', peakY + Math.sin(angle) * tail + (t * t * 30)); // gravity drop
                    el.setAttribute('x2', peakX + Math.cos(angle) * ext);
                    el.setAttribute('y2', peakY + Math.sin(angle) * ext + (t * t * 30));
                    el.style.opacity = 1 - t;
                });
                requestAnimationFrame(tick);
            } else {
                burstLines.forEach(({ el }) => el.remove());
                burstLines.length = 0;
            }
        }
        let burstSpawned = false;
        const burstLines = [];
        requestAnimationFrame(tick);
    }

    function startBridgeFireworks() {
        if (fireworksRunning) return;
        fireworksRunning = true;
        // Launch fireworks at irregular intervals
        function loop() {
            if (!fireworksRunning) return;
            // 1-3 simultaneous rockets
            const burst = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < burst; i++) {
                setTimeout(spawnFirework, i * 250);
            }
            const delay = 1400 + Math.random() * 1200;
            fireworksTimer = setTimeout(loop, delay);
        }
        loop();
    }

    function stopBridgeFireworks() {
        fireworksRunning = false;
        if (fireworksTimer) {
            clearTimeout(fireworksTimer);
            fireworksTimer = null;
        }
        const layer = $('#bridge-fireworks');
        if (layer) layer.innerHTML = '';
    }

    /* ---------- ALBUM ---------- */

    const albumThumbs = [
        { source: 'phone', c1: '#ff64c8', c2: '#ffc864' },
        { source: 'vp',    c1: '#c45cff', c2: '#2cd9ff' },
        { source: 'phone', c1: '#2cd9ff', c2: '#ff5050' },
        { source: 'vp',    c1: '#ffc864', c2: '#c45cff' },
        { source: 'phone', c1: '#ff3da6', c2: '#8a2cff' },
        { source: 'vp',    c1: '#2cd9ff', c2: '#ff64c8' },
        { source: 'phone', c1: '#c45cff', c2: '#ffc864' },
        { source: 'vp',    c1: '#ff5050', c2: '#2cd9ff' },
    ];

    function renderAlbum(filter) {
        const grid = $('#vp-album-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const list = filter === 'all' ? albumThumbs : albumThumbs.filter(t => t.source === filter);
        list.forEach(t => {
            const div = document.createElement('div');
            div.className = 'vp-album-thumb';
            div.innerHTML = `
                <div class="vp-album-thumb-bg" style="background: ${thumbBg(t.c1, t.c2)}"></div>
                <span class="vp-album-source ${t.source}">${t.source === 'phone' ? 'AR' : '3D'}</span>
            `;
            grid.appendChild(div);
        });
    }

    function initAlbum() {
        $$('.vp-album-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.vp-album-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderAlbum(tab.dataset.album);
            });
        });
        renderAlbum('all');

        const rec = $('#vp-album-record');
        if (rec) {
            rec.addEventListener('click', () => {
                if (rec.classList.contains('recording')) return;
                rec.classList.add('recording');
                const lastSpan = rec.querySelector('span:last-child');
                const orig = lastSpan.textContent;
                lastSpan.textContent = 'Recording…';
                setTimeout(() => {
                    rec.classList.remove('recording');
                    lastSpan.textContent = orig;
                    albumThumbs.unshift({
                        source: 'vp',
                        c1: ['#ff64c8','#c45cff','#2cd9ff','#ffc864'][Math.floor(Math.random()*4)],
                        c2: ['#8a2cff','#ff5050','#ffc864','#2cd9ff'][Math.floor(Math.random()*4)],
                    });
                    const active = $('.vp-album-tab.active');
                    renderAlbum(active?.dataset.album || 'all');
                }, 2000);
            });
        }
    }

    /* ---------- Init ---------- */

    function init() {
        initShell();
        initSidebar();
        initJumps();
        initMap();
        initEvents();
        initImmersive();
        initDroneShapePicker();
        initAlbum();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
