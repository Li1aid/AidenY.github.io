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

        /* ----------------------------------------------------------
           SCENE LIBRARY
           Each scene is rendered as a layered SVG panorama with a
           viewBox of 0 0 600 360. The renderer slices a different
           horizontal window for each of the three walls (L/C/R) so
           the wall arrangement reads as one continuous landscape.
           ---------------------------------------------------------- */
        const scenes = [
            {
                id: 'mountain', en: 'Mountain Dawn', zh: '山间黎明',
                meta_en: 'Cool blue ridges, dawn glow on the snow line.',
                meta_zh: '冷蓝色的山脊，雪线上泛着晨光。',
                render: renderMountain,
            },
            {
                id: 'forest', en: 'Forest Light', zh: '林间光',
                meta_en: 'Warm shafts piercing a dense pine canopy.',
                meta_zh: '暖光穿过密密的松林洒下来。',
                render: renderForest,
            },
            {
                id: 'shore', en: 'Shore Sunset', zh: '海滨日落',
                meta_en: 'Orange-magenta gradients above a still sea.',
                meta_zh: '平静海面上，橙色渐变成紫红。',
                render: renderShore,
            },
            {
                id: 'river', en: 'River Stones', zh: '溪石',
                meta_en: 'Cool greys, scattered boulders in a stream.',
                meta_zh: '冷灰色调，溪水里散着几块石头。',
                render: renderRiver,
            },
            {
                id: 'night', en: 'Starfield', zh: '星空',
                meta_en: 'Deep indigo, scattered stars and a low horizon.',
                meta_zh: '深靛蓝的夜空，零星的星点，低低的地平线。',
                render: renderNight,
            },
        ];
        let activeScene = scenes[0];

        // ------ Scene renderers ------
        // Each returns a full SVG string that fills its container.
        // `xShift` is a horizontal offset in viewBox units used to
        // give each wall a different slice of the same panorama.
        function svgWrap(inner, xShift = 0) {
            // Wider viewBox + preserveAspectRatio slice so the SVG
            // crops naturally to the wall aspect ratio.
            return `
                <svg viewBox="${xShift} 0 600 360" preserveAspectRatio="xMidYMid slice"
                     xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
                    ${inner}
                </svg>
            `;
        }

        function renderMountain(xShift) {
            const inner = `
                <defs>
                    <linearGradient id="skyM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0"   stop-color="#1a2746"/>
                        <stop offset="0.5" stop-color="#3d4f7a"/>
                        <stop offset="0.85" stop-color="#c98c6a"/>
                        <stop offset="1"   stop-color="#f3b585"/>
                    </linearGradient>
                    <radialGradient id="sunM" cx="0.7" cy="0.78" r="0.18">
                        <stop offset="0"   stop-color="#fff5d6" stop-opacity="0.9"/>
                        <stop offset="1"   stop-color="#fff5d6" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <rect x="-200" y="0" width="1200" height="360" fill="url(#skyM)"/>
                <!-- Sun glow above horizon -->
                <rect x="-200" y="0" width="1200" height="360" fill="url(#sunM)"/>
                <!-- Distant snow ridge (lightest, furthest) -->
                <path d="M -200 230
                         L 40 175 L 110 200 L 180 150 L 260 195 L 330 140
                         L 410 200 L 500 165 L 580 195 L 650 160 L 760 200
                         L 1000 230 L 1000 360 L -200 360 Z"
                      fill="#7a8baa" opacity="0.55"/>
                <!-- Mid ridge -->
                <path d="M -200 260
                         L 60 220 L 140 250 L 220 200 L 300 240 L 380 195
                         L 460 235 L 540 215 L 620 245 L 720 220 L 820 250
                         L 1000 260 L 1000 360 L -200 360 Z"
                      fill="#3a4866" opacity="0.85"/>
                <!-- Front ridge (darkest, closest) -->
                <path d="M -200 300
                         L 50 270 L 120 290 L 200 250 L 290 285 L 370 260
                         L 460 295 L 560 270 L 660 290 L 760 270 L 880 295
                         L 1000 285 L 1000 360 L -200 360 Z"
                      fill="#1a2236"/>
                <!-- Snow caps on the back ridges -->
                <g fill="#e6ecf5" opacity="0.85">
                    <path d="M 170 158 L 180 150 L 192 168 L 184 168 L 180 162 L 176 168 Z"/>
                    <path d="M 322 148 L 330 140 L 342 158 L 334 158 L 330 152 L 326 158 Z"/>
                    <path d="M 645 168 L 650 160 L 660 175 L 654 175 L 650 169 L 646 175 Z"/>
                </g>
                <!-- Power line poles + wire (echoes the cover image) -->
                <g stroke="#0a1019" stroke-width="1.5" fill="none" opacity="0.7">
                    <line x1="160" y1="280" x2="160" y2="244"/>
                    <line x1="380" y1="270" x2="380" y2="232"/>
                    <line x1="610" y1="278" x2="610" y2="240"/>
                    <path d="M 160 248 Q 270 260 380 236 Q 495 250 610 244"/>
                    <path d="M 160 252 Q 270 268 380 242 Q 495 256 610 248"/>
                </g>
            `;
            return svgWrap(inner, xShift);
        }

        function renderForest(xShift) {
            // Pine forest with naturalistic *clustered* distribution:
            //  – sparse, small trees on the back ridge
            //  – dense mid clumps (thicker, taller) — the visual heart
            //  – a few big hero trees in the foreground, intentionally
            //    placed off-grid (not evenly spaced) for visual rhythm
            const rng = mulberry32(7);

            // Back layer: small sparse trees, only on a few sub-ranges
            let backTrees = '';
            const backClusters = [[20, 120], [180, 280], [380, 470], [520, 600]];
            backClusters.forEach(([x0, x1]) => {
                const n = 3 + Math.floor(rng() * 3);
                for (let i = 0; i < n; i++) {
                    const x = x0 + rng() * (x1 - x0);
                    const h = 70 + rng() * 50;
                    const w = 20 + rng() * 10;
                    const baseY = 248 + rng() * 14;
                    backTrees += pineTree(x, baseY, w, h, '#1a2a1c', 0.6);
                }
            });

            // Mid layer: dense clumps (the bulk of the forest mass)
            let midTrees = '';
            const midClusters = [
                { cx: 80,  spread: 60, n: 7 },
                { cx: 230, spread: 90, n: 10 },
                { cx: 410, spread: 70, n: 8 },
                { cx: 540, spread: 50, n: 6 },
            ];
            midClusters.forEach(c => {
                for (let i = 0; i < c.n; i++) {
                    // Gaussian-ish offset toward cluster centre
                    const r1 = (rng() + rng() + rng()) / 3 - 0.5;
                    const x = c.cx + r1 * c.spread * 2;
                    const h = 130 + rng() * 60;
                    const w = 28 + rng() * 14;
                    const baseY = 285 + rng() * 18;
                    midTrees += pineTree(x, baseY, w, h, '#0f1c12', 0.95);
                }
            });

            // Foreground: a handful of tall hero trees, clearly grouped
            let frontTrees = '';
            const heroPositions = [
                { x: 50,  h: 230, w: 56 },
                { x: 130, h: 180, w: 44 },
                { x: 300, h: 250, w: 60 },
                { x: 360, h: 200, w: 48 },
                { x: 470, h: 220, w: 52 },
                { x: 560, h: 200, w: 46 },
            ];
            heroPositions.forEach(p => {
                const baseY = 360;
                frontTrees += pineTree(p.x + (rng() - 0.5) * 8, baseY, p.w, p.h, '#06100a', 1);
            });
            const inner = `
                <defs>
                    <linearGradient id="skyF" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0"   stop-color="#1c2a18"/>
                        <stop offset="0.5" stop-color="#46623d"/>
                        <stop offset="1"   stop-color="#86a466"/>
                    </linearGradient>
                    <linearGradient id="shaftF" x1="0.5" y1="0" x2="0.5" y2="1">
                        <stop offset="0"   stop-color="#fff1c2" stop-opacity="0.45"/>
                        <stop offset="1"   stop-color="#fff1c2" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                <rect x="-200" y="0" width="1200" height="360" fill="url(#skyF)"/>
                <!-- God-ray light shafts (3 angled beams) -->
                <g opacity="0.7">
                    <polygon points="220,0 280,0 360,360 240,360" fill="url(#shaftF)"/>
                    <polygon points="380,0 430,0 460,360 360,360" fill="url(#shaftF)"/>
                    <polygon points="500,0 540,0 600,360 480,360" fill="url(#shaftF)"/>
                </g>
                <!-- Far tree band -->
                <g>${backTrees}</g>
                <!-- Mid clumps (forest mass) -->
                <g>${midTrees}</g>
                <!-- Ground -->
                <rect x="-200" y="320" width="1200" height="40" fill="#0a1109"/>
                <!-- Foreground hero trees -->
                <g>${frontTrees}</g>
                <!-- Floor grass tufts -->
                <g stroke="#3a5a2c" stroke-width="1.2" opacity="0.8">
                    ${dashedGrass()}
                </g>
            `;
            return svgWrap(inner, xShift);

            function pineTree(x, baseY, w, h, fill, op) {
                // Stack 4 triangles + trunk
                const tiers = 4;
                const tierH = h / tiers;
                let g = `<g opacity="${op}" fill="${fill}">`;
                g += `<rect x="${x + w/2 - 2}" y="${baseY - 6}" width="4" height="10" fill="#1a0f08"/>`;
                for (let t = 0; t < tiers; t++) {
                    const top = baseY - h + t * tierH * 0.7;
                    const bottom = top + tierH;
                    const halfW = w * (0.55 + t * 0.18);
                    g += `<polygon points="${x},${bottom} ${x + halfW * 2},${bottom} ${x + halfW},${top}"/>`;
                }
                g += `</g>`;
                return g;
            }
            function dashedGrass() {
                let s = '';
                for (let i = 0; i < 60; i++) {
                    const x = -50 + rng() * 740;
                    const y = 320 + rng() * 38;
                    s += `<line x1="${x}" y1="${y}" x2="${x + (rng() - 0.5) * 4}" y2="${y - 5 - rng() * 4}"/>`;
                }
                return s;
            }
        }

        function renderShore(xShift) {
            const inner = `
                <defs>
                    <linearGradient id="skyS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0"   stop-color="#1d1538"/>
                        <stop offset="0.45" stop-color="#7a3a72"/>
                        <stop offset="0.7"  stop-color="#e07550"/>
                        <stop offset="1"    stop-color="#ffd494"/>
                    </linearGradient>
                    <linearGradient id="seaS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0"   stop-color="#3a2a4a"/>
                        <stop offset="0.4" stop-color="#21263a"/>
                        <stop offset="1"   stop-color="#0c1424"/>
                    </linearGradient>
                    <radialGradient id="sunS" cx="0.5" cy="0.66" r="0.07">
                        <stop offset="0"   stop-color="#fff7d8" stop-opacity="1"/>
                        <stop offset="0.5" stop-color="#ffc88a" stop-opacity="0.85"/>
                        <stop offset="1"   stop-color="#ffc88a" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <rect x="-200" y="0" width="1200" height="240" fill="url(#skyS)"/>
                <!-- Sun + halo -->
                <rect x="-200" y="0" width="1200" height="240" fill="url(#sunS)"/>
                <circle cx="300" cy="238" r="22" fill="#fff5d6"/>
                <!-- Sea -->
                <rect x="-200" y="240" width="1200" height="120" fill="url(#seaS)"/>
                <!-- Sun reflection on water -->
                <g fill="#fff5d6" opacity="0.55">
                    <ellipse cx="300" cy="252" rx="40" ry="2.5"/>
                    <ellipse cx="300" cy="262" rx="32" ry="1.8"/>
                    <ellipse cx="300" cy="272" rx="22" ry="1.4"/>
                    <ellipse cx="300" cy="282" rx="14" ry="1"/>
                </g>
                <!-- Distant headland silhouettes -->
                <path d="M -200 240 L 80 218 L 150 230 L 200 222 L 260 234 L 300 230 L 330 234 L 400 220 L 480 232 L 560 226 L 1000 240 L 1000 250 L -200 250 Z"
                      fill="#1a1228" opacity="0.85"/>
                <!-- Right rocky outcrop -->
                <path d="M 460 240 L 490 226 L 520 232 L 545 220 L 575 234 L 600 224 L 640 240 Z"
                      fill="#0d0a18"/>
                <!-- Subtle wave lines -->
                <g stroke="#fff" stroke-width="0.6" opacity="0.18" fill="none">
                    <path d="M -200 296 Q 0 292 200 296 T 600 296 T 1000 296"/>
                    <path d="M -200 312 Q 0 308 200 312 T 600 312 T 1000 312"/>
                    <path d="M -200 330 Q 0 326 200 330 T 600 330 T 1000 330"/>
                </g>
                <!-- Foreground beach grass -->
                <g stroke="#1a1018" stroke-width="1" opacity="0.9">
                    <line x1="40" y1="360" x2="46" y2="332"/>
                    <line x1="56" y1="360" x2="60" y2="338"/>
                    <line x1="72" y1="360" x2="68" y2="334"/>
                    <line x1="520" y1="360" x2="524" y2="336"/>
                    <line x1="540" y1="360" x2="538" y2="338"/>
                    <line x1="560" y1="360" x2="566" y2="334"/>
                </g>
                <!-- Lone figure on the shore, silhouetted against the sun -->
                <g fill="#0a0610">
                    <!-- head -->
                    <circle cx="298" cy="280" r="5"/>
                    <!-- body / coat -->
                    <path d="M 290 286 L 306 286 L 312 322 L 302 322 L 300 308 L 298 322 L 284 322 Z"/>
                </g>
            `;
            return svgWrap(inner, xShift);
        }

        function renderRiver(xShift) {
            const rng = mulberry32(11);
            let stones = '';
            for (let i = 0; i < 14; i++) {
                const x = -30 + rng() * 660;
                const y = 235 + rng() * 90;
                const rx = 10 + rng() * 22;
                const ry = 4 + rng() * 7;
                const shade = ['#1a1f28', '#23303c', '#2a3744', '#141a22'][i % 4];
                stones += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${shade}"/>`;
                // Highlight on top
                stones += `<ellipse cx="${x - rx*0.2}" cy="${y - ry*0.4}" rx="${rx*0.55}" ry="${ry*0.3}" fill="#fff" opacity="0.08"/>`;
            }
            const inner = `
                <defs>
                    <linearGradient id="skyR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0"   stop-color="#2c3a48"/>
                        <stop offset="1"   stop-color="#5a6c7c"/>
                    </linearGradient>
                    <linearGradient id="waterR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0"   stop-color="#4a5d6f"/>
                        <stop offset="0.5" stop-color="#2a3a48"/>
                        <stop offset="1"   stop-color="#10171d"/>
                    </linearGradient>
                </defs>
                <rect x="-200" y="0" width="1200" height="200" fill="url(#skyR)"/>
                <!-- Far hills -->
                <path d="M -200 200 L 60 165 L 160 180 L 240 158 L 360 178 L 460 162 L 580 182 L 1000 200 L 1000 215 L -200 215 Z"
                      fill="#26323e" opacity="0.85"/>
                <!-- Mid bank with trees -->
                <rect x="-200" y="200" width="1200" height="30" fill="#161e26"/>
                <g fill="#0d141a">
                    <polygon points="40,200 48,168 56,200"/>
                    <polygon points="120,202 130,170 140,202"/>
                    <polygon points="220,200 232,164 244,200"/>
                    <polygon points="350,202 362,168 374,202"/>
                    <polygon points="480,200 490,170 500,200"/>
                    <polygon points="580,202 592,166 604,202"/>
                </g>
                <!-- Water -->
                <rect x="-200" y="225" width="1200" height="135" fill="url(#waterR)"/>
                <!-- Vertical reflections (subtle) -->
                <g stroke="#fff" stroke-width="0.5" opacity="0.07">
                    ${verticalReflections()}
                </g>
                <!-- Stones in the water -->
                <g>${stones}</g>
                <!-- White-water highlights around stones -->
                <g stroke="#fff" stroke-width="0.6" opacity="0.35" fill="none">
                    <path d="M 80 250 Q 100 246 120 252"/>
                    <path d="M 220 270 Q 240 266 260 272"/>
                    <path d="M 380 286 Q 400 282 422 288"/>
                </g>
            `;
            return svgWrap(inner, xShift);

            function verticalReflections() {
                let s = '';
                for (let i = 0; i < 80; i++) {
                    const x = -50 + rng() * 750;
                    s += `<line x1="${x}" y1="226" x2="${x}" y2="${230 + rng() * 120}"/>`;
                }
                return s;
            }
        }

        function renderNight(xShift) {
            const rng = mulberry32(23);
            let stars = '';
            for (let i = 0; i < 90; i++) {
                const x = -50 + rng() * 740;
                const y = 10 + rng() * 230;
                const r = 0.5 + rng() * 1.4;
                const op = 0.4 + rng() * 0.6;
                stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${op}"/>`;
            }
            // 4 brighter "highlight" stars with glow
            let bigStars = '';
            const bigPositions = [[120, 80], [340, 50], [490, 110], [580, 70]];
            bigPositions.forEach(([x, y]) => {
                bigStars += `
                    <circle cx="${x}" cy="${y}" r="3" fill="#fff"/>
                    <circle cx="${x}" cy="${y}" r="6" fill="#fff" opacity="0.25"/>
                `;
            });
            const inner = `
                <defs>
                    <linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0"   stop-color="#02030d"/>
                        <stop offset="0.6" stop-color="#0a1336"/>
                        <stop offset="1"   stop-color="#1a2a52"/>
                    </linearGradient>
                    <radialGradient id="moonN" cx="0.78" cy="0.18" r="0.06">
                        <stop offset="0"   stop-color="#fff8e0" stop-opacity="1"/>
                        <stop offset="1"   stop-color="#fff8e0" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <rect x="-200" y="0" width="1200" height="360" fill="url(#skyN)"/>
                <!-- Soft moon halo -->
                <rect x="-200" y="0" width="1200" height="360" fill="url(#moonN)"/>
                <circle cx="468" cy="64" r="14" fill="#fff8e0"/>
                <circle cx="465" cy="60" r="3" fill="#dcd8c0" opacity="0.6"/>
                <circle cx="473" cy="68" r="2" fill="#dcd8c0" opacity="0.5"/>
                <!-- Stars -->
                <g>${stars}</g>
                <g>${bigStars}</g>
                <!-- Distant low ridge -->
                <path d="M -200 290 L 60 270 L 140 282 L 240 264 L 340 280 L 440 268 L 540 282 L 1000 290 L 1000 360 L -200 360 Z"
                      fill="#040714"/>
                <!-- Foreground horizon line -->
                <path d="M -200 320 L 1000 320 L 1000 360 L -200 360 Z"
                      fill="#020410"/>
                <!-- Tiny grass silhouettes -->
                <g stroke="#02050e" stroke-width="1">
                    <line x1="80" y1="320" x2="78" y2="306"/>
                    <line x1="100" y1="320" x2="104" y2="304"/>
                    <line x1="240" y1="320" x2="236" y2="308"/>
                    <line x1="420" y1="320" x2="424" y2="306"/>
                    <line x1="560" y1="320" x2="556" y2="304"/>
                </g>
            `;
            return svgWrap(inner, xShift);
        }

        // Tiny seeded PRNG for stable scene layouts
        function mulberry32(seed) {
            let s = seed >>> 0;
            return function () {
                s = (s + 0x6D2B79F5) >>> 0;
                let t = s;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }

        /* ----------------------------------------------------------
           SCENE SILHOUETTE TARGETS
           For each scene we pre-compute a list of [x, y] points in
           viewBox (0..600, 0..360) that trace the scene's key shapes:
           mountains / forest trunks + canopies / waves + sun + person /
           river banks + stones / star pattern + horizon.

           Particles converge to these points during Generation (so the
           silhouette literally appears from particles), then disperse
           from them during Deconstruction. Each wall slices a window
           of the same panorama via xShift, so each wall's particles
           assemble that wall's portion of the landscape.
           ---------------------------------------------------------- */

        function buildTargetsMountain() {
            // Three ridge lines (back→front), sampled densely
            const back = [
                [-200, 230], [40, 175], [110, 200], [180, 150], [260, 195],
                [330, 140], [410, 200], [500, 165], [580, 195], [650, 160],
                [760, 200], [1000, 230]
            ];
            const mid = [
                [-200, 260], [60, 220], [140, 250], [220, 200], [300, 240],
                [380, 195], [460, 235], [540, 215], [620, 245], [720, 220],
                [820, 250], [1000, 260]
            ];
            const front = [
                [-200, 300], [50, 270], [120, 290], [200, 250], [290, 285],
                [370, 260], [460, 295], [560, 270], [660, 290], [760, 270],
                [880, 295], [1000, 285]
            ];
            return [
                ...samplePolyline(back, 1, 0.5),
                ...samplePolyline(mid, 1.5, 0.7),
                ...samplePolyline(front, 2, 1),
                // Power-line wire echo
                ...sampleArc(160, 248, 380, 236, 60, 1),
                ...sampleArc(380, 236, 610, 244, 60, 1),
            ];
        }

        function buildTargetsForest() {
            // Sample the trunk + canopy outlines of the heroPositions
            // and mid clumps so particles "build" the trees.
            const pts = [];
            const heroPositions = [
                { x: 50,  h: 230, w: 56 },
                { x: 130, h: 180, w: 44 },
                { x: 300, h: 250, w: 60 },
                { x: 360, h: 200, w: 48 },
                { x: 470, h: 220, w: 52 },
                { x: 560, h: 200, w: 46 },
            ];
            heroPositions.forEach(p => pushTreeOutline(pts, p.x, 360, p.w, p.h, 0.9));
            // Mid clusters — fewer points each
            const midClusters = [
                { cx: 80, spread: 60, n: 7 },
                { cx: 230, spread: 90, n: 10 },
                { cx: 410, spread: 70, n: 8 },
                { cx: 540, spread: 50, n: 6 },
            ];
            const rng = mulberry32(7);
            midClusters.forEach(c => {
                for (let i = 0; i < c.n; i++) {
                    const r1 = (rng() + rng() + rng()) / 3 - 0.5;
                    const x = c.cx + r1 * c.spread * 2;
                    const baseY = 285 + rng() * 18;
                    pushTreeOutline(pts, x, baseY, 28, 130, 0.4);
                }
            });
            // Ground line
            for (let x = -100; x <= 700; x += 16) pts.push([x, 320]);
            return pts;
        }
        function pushTreeOutline(pts, x, baseY, w, h, density) {
            // Trunk
            const trunkSteps = Math.max(2, Math.floor(8 * density));
            for (let s = 0; s < trunkSteps; s++) {
                pts.push([x + w / 2, baseY - (s / trunkSteps) * 8]);
            }
            // Canopy: spaced points down each side of the triangle stack
            const tiers = 4;
            const tierH = h / tiers;
            for (let t = 0; t < tiers; t++) {
                const top = baseY - h + t * tierH * 0.7;
                const bottom = top + tierH;
                const halfW = w * (0.55 + t * 0.18);
                const sideSteps = Math.max(3, Math.floor(7 * density));
                for (let i = 0; i <= sideSteps; i++) {
                    const k = i / sideSteps;
                    pts.push([x + halfW * (1 - k),     top + k * (bottom - top)]);
                    pts.push([x + halfW + halfW * k,   top + (1 - k) * 0 + k * (bottom - top)]);
                }
            }
        }

        function buildTargetsShore() {
            const pts = [];
            // Sun ring
            const cx = 300, cy = 238, r = 22;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 28) {
                pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
            }
            // Horizon line + ripples
            for (let x = -100; x <= 700; x += 8) pts.push([x, 240]);
            for (let x = -100; x <= 700; x += 18) pts.push([x, 296 + Math.sin(x * 0.04) * 4]);
            for (let x = -100; x <= 700; x += 18) pts.push([x, 312 + Math.sin(x * 0.04 + 1) * 4]);
            // Headland silhouette
            const headland = [
                [-200, 240], [80, 218], [150, 230], [200, 222], [260, 234],
                [300, 230], [330, 234], [400, 220], [480, 232], [560, 226],
                [1000, 240]
            ];
            pts.push(...samplePolyline(headland, 1.5, 1));
            // Right rocky outcrop
            const rocks = [
                [460, 240], [490, 226], [520, 232], [545, 220],
                [575, 234], [600, 224], [640, 240]
            ];
            pts.push(...samplePolyline(rocks, 2, 1));
            // Person silhouette outline
            const px = 298, py = 280;
            // Head circle
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
                pts.push([px + Math.cos(a) * 5, py + Math.sin(a) * 5]);
            }
            // Body outline
            const body = [
                [px - 8, py + 6], [px + 8, py + 6], [px + 14, py + 42],
                [px + 4, py + 42], [px + 2, py + 28], [px, py + 42],
                [px - 14, py + 42], [px - 8, py + 6]
            ];
            pts.push(...samplePolyline(body, 1.4, 1));
            return pts;
        }

        function buildTargetsRiver() {
            const pts = [];
            // Far ridge
            const ridge = [
                [-200, 200], [60, 165], [160, 180], [240, 158],
                [360, 178], [460, 162], [580, 182], [1000, 200]
            ];
            pts.push(...samplePolyline(ridge, 1.5, 0.6));
            // Bank line
            for (let x = -100; x <= 700; x += 12) pts.push([x, 200]);
            for (let x = -100; x <= 700; x += 12) pts.push([x, 225]);
            // Mid-ground tree triangles (just their outlines, simplified)
            const treeBases = [40, 120, 220, 350, 480, 580];
            treeBases.forEach(tx => {
                pts.push([tx - 8, 200], [tx, 168], [tx + 8, 200]);
            });
            // Stone clusters in the river — produced from the same RNG
            // seed used in renderRiver so the targets line up with the
            // rendered SVG stones.
            const rng = mulberry32(11);
            for (let i = 0; i < 14; i++) {
                const x = -30 + rng() * 660;
                const y = 235 + rng() * 90;
                const rx = 10 + rng() * 22;
                const ry = 4 + rng() * 7;
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
                    pts.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]);
                }
            }
            return pts;
        }

        function buildTargetsNight() {
            const pts = [];
            // Stars (re-derived from the same seed used to render them)
            const rng = mulberry32(23);
            for (let i = 0; i < 90; i++) {
                const x = -50 + rng() * 740;
                const y = 10 + rng() * 230;
                pts.push([x, y]);
            }
            // Big stars
            const big = [[120, 80], [340, 50], [490, 110], [580, 70]];
            big.forEach(([x, y]) => {
                pts.push([x, y]);
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
                    pts.push([x + Math.cos(a) * 6, y + Math.sin(a) * 6]);
                }
            });
            // Moon ring
            const mx = 468, my = 64;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) {
                pts.push([mx + Math.cos(a) * 14, my + Math.sin(a) * 14]);
            }
            // Low ridge
            const ridge = [
                [-200, 290], [60, 270], [140, 282], [240, 264],
                [340, 280], [440, 268], [540, 282], [1000, 290]
            ];
            pts.push(...samplePolyline(ridge, 2, 0.6));
            for (let x = -100; x <= 700; x += 18) pts.push([x, 320]);
            return pts;
        }

        // Linearly sample a polyline at ~step viewBox-unit intervals.
        // density (0..1) thins/thickens.
        function samplePolyline(pts, step = 1.5, density = 1) {
            const out = [];
            for (let i = 0; i < pts.length - 1; i++) {
                const [x0, y0] = pts[i];
                const [x1, y1] = pts[i + 1];
                const len = Math.hypot(x1 - x0, y1 - y0);
                const n = Math.max(1, Math.floor((len / 12) * density * (step)));
                for (let k = 0; k <= n; k++) {
                    const t = k / n;
                    out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
                }
            }
            return out;
        }
        function sampleArc(x0, y0, x1, y1, midDrop, density) {
            const out = [];
            const n = Math.floor(20 * density);
            for (let k = 0; k <= n; k++) {
                const t = k / n;
                const x = x0 + (x1 - x0) * t;
                // Quadratic sag
                const baseY = y0 + (y1 - y0) * t;
                const sag = midDrop * 4 * t * (1 - t);
                out.push([x, baseY + sag]);
            }
            return out;
        }

        // Map each scene id to its target builder
        const sceneTargetBuilders = {
            mountain: buildTargetsMountain,
            forest:   buildTargetsForest,
            shore:    buildTargetsShore,
            river:    buildTargetsRiver,
            night:    buildTargetsNight,
        };

        // Phases drive HUD, particle behaviour AND scene opacity.
        //   generation   – particles fly in from edges and lock onto the
        //                  scene's silhouette points; the scene SVG fades
        //                  in beneath them as they settle.
        //   presentation – particles dim out completely; only the SVG
        //                  shows. The landscape "is".
        //   deconstruction – particles re-spawn AT the silhouette points
        //                    and drift outward as the SVG fades back to
        //                    near-black.
        const phases = {
            generation: {
                num: '01',
                title_en: 'Particles assembling the landscape',
                title_zh: '粒子正在聚成风景',
                fill: 22, sceneOpacity: 0.18,
                mode: 'assemble',
            },
            presentation: {
                num: '02',
                title_en: 'Landscape stable — particles rest',
                title_zh: '风景定格，粒子歇下',
                fill: 62, sceneOpacity: 1.0,
                mode: 'rest',
            },
            deconstruction: {
                num: '03',
                title_en: 'Landscape dispersing into particles',
                title_zh: '风景散成粒子',
                fill: 92, sceneOpacity: 0.35,
                mode: 'disperse',
            },
        };
        let activePhase = 'generation';
        let cycleOn = false;
        let cycleTimer = null;
        const phaseOrder = ['generation', 'presentation', 'deconstruction'];

        // Each wall gets a different horizontal slice of the same
        // 600-wide panorama so the L/C/R arrangement reads as one
        // continuous landscape (like the four screens of the Cube).
        const wallShifts = [0, 200, 400];

        function paintScenes() {
            sceneGrid.innerHTML = '';
            scenes.forEach(s => {
                const card = document.createElement('button');
                card.className = 'whisper-scene-card' + (s.id === activeScene.id ? ' active' : '');
                // Thumbnail is the centre slice of the same panorama
                card.innerHTML = `
                    <div class="whisper-scene-thumb">${s.render(150)}</div>
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
            wallScenes.forEach((w, i) => {
                w.className = 'whisper-wall-scene show';
                w.innerHTML = activeScene.render(wallShifts[i] || 0);
                w.style.opacity = phases[activePhase].sceneOpacity;
            });
            // Re-pick silhouette targets and re-seed particles from edges
            // so changing scenes always re-runs the assemble animation.
            rebuildWallTargets();
            wallParticles.forEach(seedFromEdges);
            wallState.forEach(st => st.phaseT = 0);
            // Re-render the underlying SVG with phase-appropriate opacity
            wallScenes.forEach(w => { w.style.opacity = phases[activePhase].sceneOpacity; });
        }

        function applyPhase(name) {
            const prev = activePhase;
            activePhase = name;
            phaseBtns.forEach(b => b.classList.toggle('active', b.dataset.phase === name));
            const p = phases[name];
            hudEyebrow.textContent = `PHASE ${p.num} · ${name.toUpperCase()}`;
            hudFill.style.width = p.fill + '%';
            hudMeta.textContent = p.title_en;
            wallScenes.forEach(w => { w.style.opacity = p.sceneOpacity; });
            // Reset per-wall timers so the new phase animates from t=0
            wallState.forEach(st => st.phaseT = 0);
            // When entering Generation from any other phase, push particles
            // off-screen so they fly back in. When entering Deconstruction,
            // snap them to the silhouette so they "fall apart" from there.
            if (name === 'generation' && prev !== 'generation') {
                wallParticles.forEach(seedFromEdges);
            } else if (name === 'disperse' || name === 'deconstruction') {
                wallParticles.forEach(snapToTargets);
            }
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

        /* -----------------------------------------------------------
           PARTICLE SYSTEM (silhouette-driven)

           Each wall canvas keeps a fixed array of particles that map
           1:1 to a sub-set of the active scene's silhouette target
           points (sliced by the wall's xShift). Behaviour per phase:

             assemble  → particle.x/y eases toward target; alpha rises
                         as it lands. SVG underneath is faintly visible.
             rest      → particles fade out (alpha → 0). SVG fully shows.
             disperse  → particles snap back to target, then drift
                         outward; alpha rises briefly then fades.

           The canvas viewBox is logical (600×360); we compute a
           letterbox transform to the actual canvas pixel size so
           targets stay aligned with the SVG underneath at any size.
           ----------------------------------------------------------- */

        const VB_W = 600, VB_H = 360, WALL_VIEW_W = 200;
        const PARTICLES_PER_WALL = 220;
        // Local timing per wall, used to drive the assemble/disperse curve.
        // Reset on every phase switch.
        const wallState = wallParticles.map(() => ({ phaseT: 0 }));

        wallParticles.forEach((cv, i) => {
            cv.ctx = cv.getContext('2d');
            cv.particles = [];
            cv.targets = [];
            cv.bursts = [];
            cv.shift = wallShifts[i] || 0;
            // Click anywhere on the wall → small ripple burst (still
            // useful as a "co-creation" gesture)
            cv.parent = cv.parentElement;
            cv.parent.addEventListener('click', (e) => {
                const r = cv.parent.getBoundingClientRect();
                const x = (e.clientX - r.left) * (cv.width / r.width);
                const y = (e.clientY - r.top) * (cv.height / r.height);
                spawnBurst(cv, x, y, 18);
            });
        });

        function resizeWallCanvases() {
            wallParticles.forEach(cv => {
                const r = cv.parentElement.getBoundingClientRect();
                const dpr = Math.min(2, window.devicePixelRatio || 1);
                cv.width = Math.max(1, Math.floor(r.width * dpr));
                cv.height = Math.max(1, Math.floor(r.height * dpr));
                cv.style.width = r.width + 'px';
                cv.style.height = r.height + 'px';
                cv._dpr = dpr;
            });
            // After a resize, particles are off — re-seed them from the
            // edges so the next assemble animation reads correctly.
            if (typeof seedFromEdges === 'function') {
                wallParticles.forEach(cv => { if (cv.particles && cv.particles.length) seedFromEdges(cv); });
            }
        }
        window.addEventListener('resize', resizeWallCanvases);
        setTimeout(resizeWallCanvases, 50);
        // After init runs, the canvases just got sized — give targets +
        // particles a chance to reset once everything is laid out.
        setTimeout(() => {
            resizeWallCanvases();
            if (typeof rebuildWallTargets === 'function') rebuildWallTargets();
            wallParticles.forEach(seedFromEdges);
            wallState.forEach(st => st.phaseT = 0);
        }, 120);

        // Convert (vbX, vbY) in the panorama space to canvas pixel
        // coordinates for a given wall (which shows VB_W=200 wide
        // window starting at xShift, scaled to fill the canvas).
        function vbToCanvas(cv, vbX, vbY) {
            const winX = vbX - cv.shift;          // 0..200 visible
            const sx = cv.width / WALL_VIEW_W;
            const sy = cv.height / VB_H;
            // Use the larger scale so it fills the wall (slice mode)
            const s = Math.max(sx, sy);
            const offX = (cv.width  - WALL_VIEW_W * s) / 2;
            const offY = (cv.height - VB_H * s) / 2;
            return [offX + winX * s, offY + vbY * s];
        }

        function spawnBurst(cv, x, y, n) {
            for (let k = 0; k < n; k++) {
                const a = Math.random() * Math.PI * 2;
                const s = 0.6 + Math.random() * 2.0;
                cv.bursts.push({
                    x, y,
                    vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                    life: 1, decay: 0.018 + Math.random() * 0.02,
                    r: 0.8 + Math.random() * 1.6
                });
            }
        }

        // Re-pick targets for every wall when the scene changes.
        function rebuildWallTargets() {
            const builder = sceneTargetBuilders[activeScene.id];
            if (!builder) return;
            const allPts = builder();
            wallParticles.forEach((cv, wi) => {
                // Keep only points inside this wall's window
                const xMin = cv.shift - 20;
                const xMax = cv.shift + WALL_VIEW_W + 20;
                const local = allPts.filter(([x]) => x >= xMin && x <= xMax);
                // Ensure we have something to lock onto even if the
                // scene is sparse (e.g. starfield)
                const targets = local.length > 30 ? local : allPts.slice();
                // Pick a stable subset of size PARTICLES_PER_WALL
                cv.targets = pickN(targets, PARTICLES_PER_WALL, wi * 17 + 3);
                // Initialise particles, each bound to one target
                cv.particles = cv.targets.map((t, idx) => ({
                    tx: t[0], ty: t[1],
                    // Random off-screen origin (top/left/right/bottom)
                    x: 0, y: 0,
                    vx: 0, vy: 0,
                    a: 0,
                    r: 0.7 + (idx % 7) * 0.12,
                    seed: Math.random(),
                }));
                seedFromEdges(cv);
            });
        }

        function seedFromEdges(cv) {
            cv.particles.forEach(p => {
                const side = Math.floor(Math.random() * 4);
                if (side === 0) { p.x = Math.random() * cv.width;  p.y = -10; }
                else if (side === 1) { p.x = cv.width + 10;        p.y = Math.random() * cv.height; }
                else if (side === 2) { p.x = Math.random() * cv.width; p.y = cv.height + 10; }
                else { p.x = -10; p.y = Math.random() * cv.height; }
                p.vx = 0; p.vy = 0; p.a = 0;
            });
        }

        function snapToTargets(cv) {
            cv.particles.forEach(p => {
                const [cx, cy] = vbToCanvas(cv, p.tx, p.ty);
                p.x = cx; p.y = cy;
                const a = Math.random() * Math.PI * 2;
                const s = 0.4 + Math.random() * 0.8;
                p.vx = Math.cos(a) * s;
                p.vy = Math.sin(a) * s;
                p.a = 1;
            });
        }

        function pickN(arr, n, salt) {
            // Deterministic-ish pick so wall i's target subset is
            // stable across re-renders while differing per wall.
            const out = [];
            const len = arr.length;
            const stride = Math.max(1, Math.floor(len / n));
            for (let k = 0; k < n; k++) {
                const idx = (k * stride + salt * 7) % len;
                out.push(arr[idx]);
            }
            return out;
        }

        function tickWalls(dt) {
            wallParticles.forEach((cv, wi) => {
                const ctx = cv.ctx;
                const w = cv.width, h = cv.height;
                if (!w || !h) return;
                ctx.clearRect(0, 0, w, h);

                const phase = phases[activePhase];
                const st = wallState[wi];
                st.phaseT = Math.min(1, st.phaseT + dt / 2.5); // ~2.5s phase ramp

                ctx.save();
                ctx.globalCompositeOperation = 'lighter';

                cv.particles.forEach(p => {
                    if (phase.mode === 'assemble') {
                        // Ease toward target; alpha rises
                        const [tx, ty] = vbToCanvas(cv, p.tx, p.ty);
                        const k = 0.04 + 0.05 * st.phaseT;
                        p.vx += (tx - p.x) * k * 0.18;
                        p.vy += (ty - p.y) * k * 0.18;
                        p.vx *= 0.84;
                        p.vy *= 0.84;
                        p.x += p.vx;
                        p.y += p.vy;
                        // Alpha = how close we are to the target
                        const d = Math.hypot(tx - p.x, ty - p.y);
                        const closeness = Math.max(0, 1 - d / 80);
                        p.a += (closeness - p.a) * 0.08;
                    } else if (phase.mode === 'rest') {
                        // Snap to target, fade out — the SVG carries the image
                        const [tx, ty] = vbToCanvas(cv, p.tx, p.ty);
                        p.x += (tx - p.x) * 0.2;
                        p.y += (ty - p.y) * 0.2;
                        p.a += (0 - p.a) * 0.05;
                    } else if (phase.mode === 'disperse') {
                        // Push outward from target
                        const [tx, ty] = vbToCanvas(cv, p.tx, p.ty);
                        const dx = p.x - tx;
                        const dy = p.y - ty;
                        const len = Math.hypot(dx, dy) || 1;
                        // Decaying outward acceleration
                        const push = 0.18 * (1 - st.phaseT * 0.6);
                        p.vx += (dx / len) * push;
                        p.vy += (dy / len) * push - 0.02; // slight upward lift
                        p.vx *= 0.96;
                        p.vy *= 0.96;
                        p.x += p.vx;
                        p.y += p.vy;
                        // Alpha: bright at first, then fade
                        const target = Math.max(0, 0.9 - st.phaseT * 0.9);
                        p.a += (target - p.a) * 0.06;
                    }
                    if (p.a > 0.02) {
                        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                        grd.addColorStop(0, `rgba(180, 220, 255, ${p.a * 0.9})`);
                        grd.addColorStop(1, `rgba(180, 220, 255, 0)`);
                        ctx.fillStyle = grd;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });

                // Click bursts: short-lived radial puffs, decoupled from the
                // silhouette particles so co-creation gestures never destroy
                // the assembled landscape.
                for (let i = cv.bursts.length - 1; i >= 0; i--) {
                    const b = cv.bursts[i];
                    b.x += b.vx;
                    b.y += b.vy;
                    b.vx *= 0.94;
                    b.vy *= 0.94;
                    b.life -= b.decay;
                    if (b.life <= 0) { cv.bursts.splice(i, 1); continue; }
                    ctx.fillStyle = `rgba(220, 240, 255, ${b.life * 0.55})`;
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            });
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
        let lastT = performance.now();
        function loop(now) {
            const dt = Math.min(0.05, (now - lastT) / 1000);
            lastT = now;
            tickWalls(dt);
            tickFloor();
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);

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
                desc_zh: '灯光安静下来，没人的时候花是合上的。',
                colors: ['#fff5d6', '#ffe9b5', '#ffd99c'],
            },
            rainbow: {
                en: 'Rainbow Butterfly', zh: '彩虹蝶翼',
                desc_en: 'Inspired by the neurodivergent infinity butterfly — a soft rainbow gradient travels through the canopy.',
                desc_zh: '灵感来自神经多样性的无限蝴蝶标志，一道柔和的彩虹渐变在花丛间流过。',
                colors: ['#ff5277', '#ff8a3a', '#ffd84a', '#5bd96b', '#4ab9ff', '#a86bff'],
            },
            awareness: {
                en: 'Awareness Ribbon', zh: '关注丝带',
                desc_en: 'Radiant orange-red gradients drawn from the ADHD awareness ribbon.',
                desc_zh: '取自 ADHD 关注丝带的橙红渐变，明亮又温暖。',
                colors: ['#ff7b3a', '#ffa84a', '#ffce6b', '#c93b1c'],
            },
            custom: {
                en: 'Paint Your Color', zh: '涂上你的颜色',
                desc_en: 'Pick a hue that feels like you — the canopy follows.',
                desc_zh: '选一种像你的颜色，整片花丛都会跟着变。',
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

        // Init
        buildPhoneModes();
        setMode('rest');
        setPeople(0);
    }
})();
