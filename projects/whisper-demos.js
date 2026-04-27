/* ============================================================
   WHISPER FIELD — Interactive demos
   1) CUBE: phase picker (Generation / Presentation / Deconstruction),
      panoramic 4-wall (3 visible: L, C, R), particle canvases,
      grass canvas with delayed-glow follow + per-scene library
   2) CATENARY: visitor counter drives bloom level across a row of
      flower-shaped lights; light modes change palette; phone mockup
      mirrors the picker
   ============================================================ */
(function () {
    'use strict';

    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    // -----------------------------------------------------------
    // CUBE
    // -----------------------------------------------------------
    const cube = $('#whisper-cube-demo');
    if (cube) initCube();

    function initCube() {
        const phaseBtns = $$('.whisper-phase-btn', cube);
        const hudEyebrow = $('#whisper-hud-eyebrow');
        const hudFill = $('#whisper-hud-fill');
        const hudMeta = $('#whisper-hud-meta');
        const sceneGrid = $('#whisper-scene-grid');
        const panelTitle = $('#whisper-panel-title');
        const panelDesc = $('#whisper-panel-desc');
        const delayInput = $('#whisper-delay');
        const delayOut = $('#whisper-delay-out');
        const radiusInput = $('#whisper-radius');
        const radiusOut = $('#whisper-radius-out');
        const cycleBtn = $('#whisper-cycle-btn');
        const cycleState = $('#whisper-cycle-state');
        const floor = $('#whisper-cube-floor');
        const floorGlow = $('#whisper-floor-glow');
        const floorHint = $('#whisper-floor-hint');
        const grassCanvas = $('#whisper-grass');
        const wallScenes = $$('.whisper-wall-scene', cube);
        const wallParticles = $$('.whisper-wall-particles', cube);

        // Scene library — 5 presets, each defined by a CSS class on the wall scene + stub label
        const scenes = [
            {
                id: 'mountain', en: 'Mountain Dawn', zh: '山间黎明',
                cls: 'scene-mountain',
                meta_en: 'Cool blue palette, slow horizon glow.',
                meta_zh: '冷蓝色调，缓慢的地平线光晕。'
            },
            {
                id: 'forest', en: 'Forest Light', zh: '林间光线',
                cls: 'scene-forest',
                meta_en: 'Warm shafts through dense canopy.',
                meta_zh: '密林中穿透而下的暖光。'
            },
            {
                id: 'shore', en: 'Shore Sunset', zh: '海滨日落',
                cls: 'scene-shore',
                meta_en: 'Orange-magenta gradients, slow waves.',
                meta_zh: '橙紫渐变，缓慢的浪涌。'
            },
            {
                id: 'river', en: 'River Stones', zh: '溪石',
                cls: 'scene-river',
                meta_en: 'Cool greys, vertical reflections.',
                meta_zh: '冷灰调，垂直水波倒影。'
            },
            {
                id: 'night', en: 'Starfield', zh: '星空',
                cls: 'scene-night',
                meta_en: 'Deep blue with sparse pinpoint stars.',
                meta_zh: '深蓝中点缀稀疏的星点。'
            },
        ];
        let activeScene = scenes[0];

        // Phases — drive HUD, particle behaviour and wall opacity
        const phases = {
            generation: {
                num: '01',
                title_en: 'Particles converging',
                title_zh: '粒子汇聚',
                fill: 18, sceneOpacity: 0.25,
                particleSpawn: 1.0, particleDir: 'in', particleAlpha: 0.45,
            },
            presentation: {
                num: '02',
                title_en: 'Landscape stable — secondary cues',
                title_zh: '风景稳定 — 次级响应',
                fill: 62, sceneOpacity: 1.0,
                particleSpawn: 0.25, particleDir: 'drift', particleAlpha: 0.25,
            },
            deconstruction: {
                num: '03',
                title_en: 'Particles dispersing',
                title_zh: '粒子消散',
                fill: 92, sceneOpacity: 0.55,
                particleSpawn: 0.55, particleDir: 'out', particleAlpha: 0.35,
            },
        };
        let activePhase = 'generation';
        let cycleOn = false;
        let cycleTimer = null;
        const phaseOrder = ['generation', 'presentation', 'deconstruction'];

        function paintScenes() {
            sceneGrid.innerHTML = '';
            scenes.forEach(s => {
                const card = document.createElement('button');
                card.className = 'whisper-scene-card' + (s.id === activeScene.id ? ' active' : '');
                card.innerHTML = `
                    <div class="whisper-scene-thumb ${s.cls}"></div>
                    <span class="whisper-scene-name">${s.en}</span>
                `;
                card.addEventListener('click', () => {
                    activeScene = s;
                    paintScenes();
                    applyScene();
                });
                sceneGrid.appendChild(card);
            });
        }

        function applyScene() {
            wallScenes.forEach(w => {
                w.className = 'whisper-wall-scene show ' + activeScene.cls;
                w.style.opacity = phases[activePhase].sceneOpacity;
            });
            // Brief flash to imply "regeneration"
            wallScenes.forEach(w => {
                w.style.transition = 'opacity 0s';
                w.style.opacity = 0;
                requestAnimationFrame(() => {
                    w.style.transition = '';
                    w.style.opacity = phases[activePhase].sceneOpacity;
                });
            });
        }

        function applyPhase(name) {
            activePhase = name;
            phaseBtns.forEach(b => b.classList.toggle('active', b.dataset.phase === name));
            const p = phases[name];
            hudEyebrow.textContent = `PHASE ${p.num} · ${name.toUpperCase()}`;
            hudFill.style.width = p.fill + '%';
            hudMeta.textContent = p.title_en;
            wallScenes.forEach(w => { w.style.opacity = p.sceneOpacity; });
        }

        phaseBtns.forEach(b => b.addEventListener('click', () => {
            stopCycle();
            applyPhase(b.dataset.phase);
        }));

        function startCycle() {
            cycleOn = true;
            cycleBtn.classList.add('on');
            cycleState.textContent = 'ON';
            cycleState.dataset.en = 'ON';
            cycleState.dataset.zh = '开启';
            let i = phaseOrder.indexOf(activePhase);
            cycleTimer = setInterval(() => {
                i = (i + 1) % phaseOrder.length;
                applyPhase(phaseOrder[i]);
            }, 4500);
        }
        function stopCycle() {
            cycleOn = false;
            cycleBtn.classList.remove('on');
            cycleState.textContent = 'OFF';
            cycleState.dataset.en = 'OFF';
            cycleState.dataset.zh = '关闭';
            clearInterval(cycleTimer);
        }
        cycleBtn.addEventListener('click', () => {
            if (cycleOn) stopCycle(); else startCycle();
        });

        // Range controls
        let delayMs = 120;
        let glowRadius = 90; // canvas pixels (cm visualised)
        delayInput.addEventListener('input', () => {
            delayMs = +delayInput.value;
            delayOut.textContent = delayMs;
        });
        radiusInput.addEventListener('input', () => {
            const cm = +radiusInput.value;
            glowRadius = 30 + cm * 4;
            radiusOut.textContent = cm;
            floorGlow.style.width = (glowRadius * 2) + 'px';
            floorGlow.style.height = (glowRadius * 2) + 'px';
        });

        // Wall click → spawn ripple + nudge particles
        wallParticles.forEach((cv, i) => {
            const ctx = cv.getContext('2d');
            cv.particles = [];
            cv.ctx = ctx;
            cv.parent = cv.parentElement;
            const wall = cv.parent;
            wall.addEventListener('click', (e) => {
                const r = wall.getBoundingClientRect();
                const x = (e.clientX - r.left) * (cv.width / r.width);
                const y = (e.clientY - r.top) * (cv.height / r.height);
                spawnBurst(cv, x, y, 30);
            });
        });

        function resizeWallCanvases() {
            wallParticles.forEach(cv => {
                const r = cv.parentElement.getBoundingClientRect();
                cv.width = Math.max(1, Math.floor(r.width));
                cv.height = Math.max(1, Math.floor(r.height));
            });
        }
        window.addEventListener('resize', resizeWallCanvases);
        // First sizing after layout settles
        setTimeout(resizeWallCanvases, 50);

        function spawnBurst(cv, x, y, n) {
            for (let i = 0; i < n; i++) {
                const a = Math.random() * Math.PI * 2;
                const s = 0.4 + Math.random() * 1.6;
                cv.particles.push({
                    x, y,
                    vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                    life: 1, decay: 0.008 + Math.random() * 0.015,
                    r: 0.6 + Math.random() * 1.4, born: 'burst'
                });
            }
        }

        // Animate wall particles based on current phase
        function tickWalls() {
            wallParticles.forEach(cv => {
                const ctx = cv.ctx;
                const w = cv.width, h = cv.height;
                if (!w || !h) return;
                ctx.clearRect(0, 0, w, h);

                const p = phases[activePhase];

                // Ambient spawn rate
                if (Math.random() < p.particleSpawn * 0.5) {
                    cv.particles.push(makeParticle(w, h, p.particleDir));
                }
                if (Math.random() < p.particleSpawn * 0.25) {
                    cv.particles.push(makeParticle(w, h, p.particleDir));
                }

                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                for (let i = cv.particles.length - 1; i >= 0; i--) {
                    const pt = cv.particles[i];

                    if (pt.born !== 'burst') {
                        if (p.particleDir === 'in') {
                            // Drift toward centre slowly
                            const cx = w / 2, cy = h / 2;
                            pt.vx += (cx - pt.x) * 0.0006;
                            pt.vy += (cy - pt.y) * 0.0006;
                        } else if (p.particleDir === 'out') {
                            const cx = w / 2, cy = h / 2;
                            pt.vx -= (cx - pt.x) * 0.0008;
                            pt.vy -= (cy - pt.y) * 0.0008;
                        } else {
                            pt.vx += (Math.random() - 0.5) * 0.05;
                            pt.vy += (Math.random() - 0.5) * 0.05;
                        }
                    }
                    pt.x += pt.vx;
                    pt.y += pt.vy;
                    pt.vx *= 0.985;
                    pt.vy *= 0.985;
                    pt.life -= pt.decay;

                    if (pt.life <= 0 || pt.x < -10 || pt.x > w + 10 || pt.y < -10 || pt.y > h + 10) {
                        cv.particles.splice(i, 1);
                        continue;
                    }
                    const a = Math.max(0, pt.life) * p.particleAlpha;
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(150, 210, 255, ${a})`;
                    ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();

                // Cap so we don't grow unbounded
                if (cv.particles.length > 320) cv.particles.length = 320;
            });
        }
        function makeParticle(w, h, dir) {
            let x, y, vx, vy;
            if (dir === 'in') {
                // From edges
                const side = Math.floor(Math.random() * 4);
                if (side === 0) { x = Math.random() * w; y = 0; }
                else if (side === 1) { x = w; y = Math.random() * h; }
                else if (side === 2) { x = Math.random() * w; y = h; }
                else { x = 0; y = Math.random() * h; }
                vx = (w / 2 - x) * 0.001;
                vy = (h / 2 - y) * 0.001;
            } else if (dir === 'out') {
                x = w / 2 + (Math.random() - 0.5) * w * 0.4;
                y = h / 2 + (Math.random() - 0.5) * h * 0.4;
                vx = (x - w / 2) * 0.004;
                vy = (y - h / 2) * 0.004;
            } else {
                x = Math.random() * w;
                y = Math.random() * h;
                vx = (Math.random() - 0.5) * 0.4;
                vy = (Math.random() - 0.5) * 0.4;
            }
            return { x, y, vx, vy, life: 1, decay: 0.004 + Math.random() * 0.008, r: 0.5 + Math.random() * 1.4 };
        }

        // -----------------------------------------------------------
        // Floor: grass blades + delayed-glow follow
        // -----------------------------------------------------------
        const grass = grassCanvas;
        const gctx = grass.getContext('2d');
        const blades = [];
        function resizeFloor() {
            const r = grass.getBoundingClientRect();
            grass.width = Math.max(1, Math.floor(r.width));
            grass.height = Math.max(1, Math.floor(r.height));
            blades.length = 0;
            const N = Math.floor(grass.width * 0.35);
            for (let i = 0; i < N; i++) {
                blades.push({
                    x: Math.random() * grass.width,
                    y: grass.height - Math.random() * grass.height * 0.6,
                    h: 14 + Math.random() * 22,
                    sw: Math.random() * Math.PI * 2,
                    speed: 0.012 + Math.random() * 0.015,
                });
            }
        }
        window.addEventListener('resize', resizeFloor);
        setTimeout(resizeFloor, 60);

        let cursor = { x: -9999, y: -9999, t: 0 };
        let target = { x: -9999, y: -9999 };
        let glowOn = false;
        floor.addEventListener('pointermove', (e) => {
            const r = floor.getBoundingClientRect();
            target.x = e.clientX - r.left;
            target.y = e.clientY - r.top;
            glowOn = true;
            floorGlow.classList.add('active');
            if (floorHint) floorHint.style.opacity = '0';
        });
        floor.addEventListener('pointerleave', () => {
            glowOn = false;
            floorGlow.classList.remove('active');
            target.x = -9999; target.y = -9999;
            if (floorHint) floorHint.style.opacity = '';
        });
        floor.addEventListener('click', (e) => {
            const r = floor.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            // Spawn a quick burst on the centre wall too — visible echo
            const cv = wallParticles[1];
            if (cv) {
                spawnBurst(cv, cv.width / 2, cv.height / 2, 40);
            }
            cursor.x = x; cursor.y = y;
        });

        function tickFloor() {
            // Delayed glow: lerp cursor toward target by an amount that
            // shrinks as delayMs grows — gives a tactile "follows but
            // hesitates" feel without a real timer.
            const k = Math.max(0.04, 0.5 - (delayMs / 600));
            cursor.x += (target.x - cursor.x) * k;
            cursor.y += (target.y - cursor.y) * k;
            floorGlow.style.transform = `translate(${cursor.x - glowRadius}px, ${cursor.y - glowRadius}px)`;

            const ctx = gctx;
            const w = grass.width, h = grass.height;
            if (!w || !h) return;
            ctx.clearRect(0, 0, w, h);

            const phase = phases[activePhase];
            const baseAlpha = activePhase === 'presentation' ? 0.55 : 0.85;
            for (let i = 0; i < blades.length; i++) {
                const b = blades[i];
                b.sw += b.speed;
                const sway = Math.sin(b.sw) * 1.6;
                const tipX = b.x + sway;
                const tipY = b.y - b.h;
                const dx = tipX - cursor.x;
                const dy = tipY - cursor.y;
                const d2 = dx * dx + dy * dy;
                const within = glowOn && d2 < glowRadius * glowRadius;
                const energy = within ? 1 - Math.sqrt(d2) / glowRadius : 0;

                ctx.beginPath();
                ctx.moveTo(b.x, b.y);
                ctx.lineTo(tipX, tipY);
                if (within) {
                    ctx.strokeStyle = `rgba(${120 + 100 * energy}, ${200 + 55 * energy}, 255, ${baseAlpha})`;
                    ctx.lineWidth = 1.5 + energy * 1.5;
                } else {
                    // Dim ambient grass; phase-dependent tone
                    const tone = activePhase === 'generation' ? '120, 200, 255' :
                                 activePhase === 'presentation' ? '120, 220, 180' :
                                 '180, 160, 220';
                    ctx.strokeStyle = `rgba(${tone}, 0.18)`;
                    ctx.lineWidth = 1;
                }
                ctx.stroke();

                // Tip glow
                if (within) {
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(150, 220, 255, ${0.65 * energy})`;
                    ctx.arc(tipX, tipY, 1.4 + energy * 1.4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Animation loop
        function loop() {
            tickWalls();
            tickFloor();
            requestAnimationFrame(loop);
        }
        loop();

        // Feature-card jump targets
        $$('.whisper-feature[data-jump]').forEach(card => {
            card.addEventListener('click', () => {
                const j = card.dataset.jump;
                if (!j) return;
                const map = {
                    generation: 'generation',
                    presentation: 'presentation',
                    deconstruction: 'deconstruction',
                };
                if (map[j]) setTimeout(() => applyPhase(map[j]), 250);
            });
        });

        // Init
        paintScenes();
        applyScene();
        applyPhase('generation');
        // Initial radius from input
        radiusInput.dispatchEvent(new Event('input'));
    }

    // -----------------------------------------------------------
    // CATENARY
    // -----------------------------------------------------------
    const cat = $('#whisper-cat-demo');
    if (cat) initCatenary();

    function initCatenary() {
        const flowersHost = $('#whisper-cat-flowers');
        const peopleHost = $('#whisper-cat-people');
        const minus = $('#whisper-people-minus');
        const plus  = $('#whisper-people-plus');
        const countOut = $('#whisper-people-count');
        const bloomFill = $('#whisper-bloom-fill');
        const bloomPct  = $('#whisper-bloom-pct');
        const modesBar  = $('#whisper-cat-modes');
        const customRow = $('#whisper-custom-row');
        const customSwatch = $('#whisper-custom-swatch');
        const rgbR = $('#whisper-rgb-r'), rgbG = $('#whisper-rgb-g'), rgbB = $('#whisper-rgb-b');
        const rgbROut = $('#whisper-rgb-r-out'), rgbGOut = $('#whisper-rgb-g-out'), rgbBOut = $('#whisper-rgb-b-out');
        const phoneGrid = $('#whisper-cat-phone-grid');
        const phoneInfoTitle = $('#whisper-cat-phone-info-title');
        const phoneInfoDesc  = $('#whisper-cat-phone-info-desc');
        const phoneBtn = $('#whisper-cat-phone-btn');

        const MAX_PEOPLE = 8;
        let people = 0;
        let mode = 'rest';
        let custom = { r: 255, g: 142, b: 177 };

        const modes = {
            rest: {
                en: 'Rest', zh: '静默',
                desc_en: 'Lights stay calm. Flowers remain closed when no one is here.',
                desc_zh: '灯光保持静默，无人时花朵闭合。',
                colors: ['#fff5d6', '#ffe9b5', '#ffd99c'],
            },
            rainbow: {
                en: 'Rainbow Butterfly', zh: '彩虹蝶翼',
                desc_en: 'Inspired by the neurodivergent infinity butterfly — a soft rainbow gradient travels through the canopy.',
                desc_zh: '灵感来自神经多样性蝴蝶——柔和的彩虹渐变在花海中流动。',
                colors: ['#ff5277', '#ff8a3a', '#ffd84a', '#5bd96b', '#4ab9ff', '#a86bff'],
            },
            awareness: {
                en: 'Awareness Ribbon', zh: '意识丝带',
                desc_en: 'Radiant orange-red gradients drawn from the ADHD awareness ribbon.',
                desc_zh: '取自 ADHD 意识丝带的橙红色渐变。',
                colors: ['#ff7b3a', '#ffa84a', '#ffce6b', '#c93b1c'],
            },
            custom: {
                en: 'Paint Your Color', zh: '自定义颜色',
                desc_en: 'Pick a hue that feels like you — the canopy follows.',
                desc_zh: '挑一种属于你的颜色——整片花海随之改变。',
                colors: () => [`rgb(${custom.r},${custom.g},${custom.b})`],
            },
        };

        // Build flower lights along three catenary curves
        // Each curve: anchored to two x positions, with sag.
        const curves = [
            { y0: 30, y1: 60, sag: 200, count: 13 },
            { y0: 60, y1: 90, sag: 220, count: 11 },
            { y0: 90, y1: 120, sag: 240, count: 9 },
        ];

        function catY(curve, t) {
            // Quadratic bezier with control point in middle for the sag
            const y = (1 - t) * (1 - t) * curve.y0 + 2 * (1 - t) * t * curve.sag + t * t * curve.y1;
            return y;
        }

        function buildFlowers() {
            flowersHost.innerHTML = '';
            const W = flowersHost.clientWidth || 800;
            const H = 240;
            const xL = W * 0.06;
            const xR = W * 0.94;
            curves.forEach((cv, ci) => {
                for (let i = 0; i < cv.count; i++) {
                    const t = (i + 0.5) / cv.count;
                    const x = xL + (xR - xL) * t;
                    const y = (catY(cv, t) / 240) * H;
                    // Mix between bulb (small dot) and flower (decorative) to look like the renders
                    const isFlower = (i + ci) % 2 === 0 || cv.count <= 9;
                    if (isFlower) {
                        const f = document.createElement('div');
                        f.className = 'whisper-cat-flower';
                        f.style.left = x + 'px';
                        f.style.top = y + 'px';
                        f.style.setProperty('--bloom', '0');
                        f.innerHTML = `
                            <svg viewBox="0 0 38 38">
                                <g class="petal-group">
                                    <ellipse class="petal" cx="19" cy="9"  rx="5" ry="9" style="--rot:0deg"></ellipse>
                                    <ellipse class="petal" cx="19" cy="9"  rx="5" ry="9" style="--rot:72deg"></ellipse>
                                    <ellipse class="petal" cx="19" cy="9"  rx="5" ry="9" style="--rot:144deg"></ellipse>
                                    <ellipse class="petal" cx="19" cy="9"  rx="5" ry="9" style="--rot:216deg"></ellipse>
                                    <ellipse class="petal" cx="19" cy="9"  rx="5" ry="9" style="--rot:288deg"></ellipse>
                                    <circle class="core" cx="19" cy="19" r="3.5"></circle>
                                </g>
                            </svg>
                        `;
                        flowersHost.appendChild(f);
                    } else {
                        const b = document.createElement('div');
                        b.className = 'whisper-cat-bulb';
                        b.style.left = x + 'px';
                        b.style.top = y + 'px';
                        b.innerHTML = '<div class="whisper-cat-bulb-core"></div>';
                        flowersHost.appendChild(b);
                    }
                }
            });
        }
        buildFlowers();
        window.addEventListener('resize', () => buildFlowers());

        // Build phone modes
        function buildPhoneModes() {
            phoneGrid.innerHTML = '';
            ['rest', 'rainbow', 'awareness', 'custom'].forEach(key => {
                const m = modes[key];
                const item = document.createElement('button');
                item.className = 'whisper-phone-item' + (mode === key ? ' active' : '');
                const swatchClass = key === 'rest' ? 'swatch-rest' :
                                     key === 'rainbow' ? 'swatch-rainbow' :
                                     key === 'awareness' ? 'swatch-awareness' :
                                     'swatch-custom';
                item.innerHTML = `<span class="whisper-phone-swatch ${swatchClass}"></span><span>${m.en}</span>`;
                item.addEventListener('click', () => setMode(key));
                phoneGrid.appendChild(item);
            });
        }

        function setMode(key) {
            mode = key;
            $$('.whisper-cat-mode', modesBar).forEach(b => b.classList.toggle('active', b.dataset.mode === key));
            $$('.whisper-phone-item', phoneGrid).forEach((b, i) => {
                const k = ['rest', 'rainbow', 'awareness', 'custom'][i];
                b.classList.toggle('active', k === key);
            });
            customRow.hidden = key !== 'custom';
            const m = modes[key];
            phoneInfoTitle.textContent = m.en;
            phoneInfoDesc.textContent = m.desc_en;
            paintFlowers();
        }

        function paintFlowers() {
            const m = modes[mode];
            const cols = typeof m.colors === 'function' ? m.colors() : m.colors;
            const flowers = $$('.whisper-cat-flower', flowersHost);
            const bulbs = $$('.whisper-cat-bulb', flowersHost);
            const bloom = Math.min(1, people / MAX_PEOPLE);

            flowers.forEach((f, i) => {
                f.style.setProperty('--bloom', bloom.toFixed(2));
                const c = cols[i % cols.length];
                const petals = $$('.petal', f);
                petals.forEach(p => p.style.fill = c);
                const core = $('.core', f);
                if (core) {
                    core.style.fill = c;
                    core.style.color = c;
                }
            });
            bulbs.forEach((b, i) => {
                const c = cols[(i + 1) % cols.length];
                const core = $('.whisper-cat-bulb-core', b);
                if (core) {
                    if (mode === 'rest' && people === 0) {
                        core.style.background = 'rgba(255, 240, 200, 0.45)';
                        core.style.boxShadow = 'none';
                    } else {
                        core.style.background = c;
                        core.style.boxShadow = `0 0 ${4 + bloom * 10}px ${c}`;
                    }
                }
            });

            // Bloom meter
            const pct = Math.round(bloom * 100);
            bloomFill.style.width = pct + '%';
            bloomPct.textContent = pct + '%';
        }

        function setPeople(n) {
            people = Math.max(0, Math.min(MAX_PEOPLE, n));
            countOut.textContent = people;
            // Render people silhouettes
            peopleHost.innerHTML = '';
            for (let i = 0; i < people; i++) {
                const p = document.createElement('div');
                p.className = 'whisper-cat-person';
                p.style.height = (50 + Math.random() * 25) + '%';
                peopleHost.appendChild(p);
            }
            paintFlowers();
        }

        minus.addEventListener('click', () => setPeople(people - 1));
        plus.addEventListener('click', () => setPeople(people + 1));

        // Mode picker (bottom bar)
        $$('.whisper-cat-mode', modesBar).forEach(b => {
            b.addEventListener('click', () => setMode(b.dataset.mode));
        });
        // Phone Light-it-up just bumps the people count (illustrates "shared moment")
        phoneBtn.addEventListener('click', () => {
            if (people < MAX_PEOPLE) setPeople(people + 1);
            else paintFlowers();
        });

        // Custom RGB
        function refreshCustom() {
            custom.r = +rgbR.value; custom.g = +rgbG.value; custom.b = +rgbB.value;
            rgbROut.textContent = custom.r;
            rgbGOut.textContent = custom.g;
            rgbBOut.textContent = custom.b;
            const col = `rgb(${custom.r},${custom.g},${custom.b})`;
            customSwatch.style.background = col;
            $$('.whisper-cat-mode[data-mode="custom"] .whisper-cat-mode-swatch').forEach(s => s.style.background = col);
            $$('.whisper-phone-item .whisper-phone-swatch.swatch-custom').forEach(s => s.style.background = col);
            if (mode === 'custom') paintFlowers();
        }
        [rgbR, rgbG, rgbB].forEach(s => s.addEventListener('input', refreshCustom));
        refreshCustom();

        // Feature-card jump
        $$('.whisper-feature[data-jump]').forEach(card => {
            card.addEventListener('click', () => {
                const j = card.dataset.jump;
                if (j === 'bloom') {
                    setTimeout(() => setPeople(Math.max(people, 4)), 300);
                } else if (j === 'modes') {
                    setTimeout(() => setMode('rainbow'), 300);
                }
            });
        });

        // Init
        buildPhoneModes();
        setMode('rest');
        setPeople(0);
    }
})();
