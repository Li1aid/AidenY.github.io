/* ========================================
   vividXperience — Real 3D harbour map
   Slow 360° bird's-eye orbit over Sydney Harbour drawn like a
   glowing topographic map: raised land plates with bright
   shorelines, contour lines and clipped street grids, solid
   buildings standing on the terrain, water in between.
   A compass chip counter-rotates so north is always readable.

   Real geography: Circular Quay, Bennelong Point (Opera House),
   The Rocks, Harbour Bridge to Milsons Point, Farm Cove and the
   Royal Botanic Gardens.

   Vivid light effects (researched from the real festival):
   - Lighting of the Sails: colour projection on the Opera shells
   - Harbour Bridge: colour chase pulsing along the steel arch
   - Light Walk twinkling along the Quay foreshore
   - Lightscape tree lights in the Botanic Gardens
   - Drone show morphing shapes above the harbour

   Three.js is lazy-loaded from CDN on first open. Self-contained:
   if WebGL or the CDN fails, mount() rejects and the caller shows
   a fallback — the rest of the demo is unaffected.

   Public API:
     window.VividMap3D.mount(container) -> Promise<controller>
     controller.start() / .stop() / .resetCamera()
   Events (dispatched on window):
     'vivid-map3d:select'  detail: { event: 'Opera Light' | ... }

   Coordinates: map space is (x east, y north); world z = -north.
   ======================================== */

(function () {
    'use strict';

    const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

    const PINK = 0xff64c8;
    const DIM_CYAN = 0x1a5f73;

    // Topographic palette — land must clearly separate from water
    const WATER_COL = 0x02050c;
    const LAND_TOP = 0x0e1726;
    const LAND_SIDE = 0x060b15;
    const SHORE = 0x2e9fc4;
    const GRID_COL = 0x27506b;
    const CONTOUR = 0x1f6f8a;
    const BLDG_FILL = 0x04070f;

    let mounted = null; // singleton controller

    async function mount(container) {
        if (mounted) return mounted;
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) throw new Error('WebGL unavailable');
        const THREE = await import(THREE_CDN);
        mounted = build(THREE, container);
        return mounted;
    }

    function build(THREE, container) {
        /* ── Renderer / scene / camera ── */
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020409);
        scene.fog = new THREE.Fog(0x020409, 1000, 2600);

        const camera = new THREE.PerspectiveCamera(
            46, container.clientWidth / container.clientHeight, 1, 4000);

        /* ── Camera: fixed bird's-eye that slowly orbits 360° ── */
        const TARGET = new THREE.Vector3(0, 0, 10);
        const ELEV = 0.92;        // elevation above horizon (~53°) — bird's-eye
        const DIST = 900;
        let theta = 0;            // orbit azimuth; 0 = viewed from the south
        let zoom = 1;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function applyCamera() {
            const d = DIST * zoom;
            const h = Math.cos(ELEV) * d;
            camera.position.set(
                TARGET.x + h * Math.sin(theta),
                TARGET.y + Math.sin(ELEV) * d,
                TARGET.z + h * Math.cos(theta));
            camera.lookAt(TARGET);
        }

        const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

        // Compass chip in the HTML overlay counter-rotates with the orbit
        const compassArrow = document.querySelector('.vp-map3d-compass .vp-compass-arrow');

        /* ── Helpers ── */
        // map (east, north) -> world (x, y, z)
        const W = (e, n, y = 0) => new THREE.Vector3(e, y, -n);

        function pointInPoly(poly, x, y) {
            let inn = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
                if (((yi > y) !== (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inn = !inn;
            }
            return inn;
        }

        /* Topographic land plate:
           - solid raised plate (bright top, dark sides) so land reads
             clearly against the water
           - glowing shoreline on the top rim
           - inset contour rings (topo-map style)
           - street grid clipped to the polygon                        */
        function landPlate(points, height) {
            const g = new THREE.Group();

            const sh = new THREE.Shape();
            sh.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]);
            sh.closePath();
            const geo = new THREE.ExtrudeGeometry(sh, { depth: height, bevelEnabled: false });
            geo.rotateX(-Math.PI / 2);   // shape (east, north) -> ground plane, extrude up
            const fill = new THREE.Mesh(geo, [
                new THREE.MeshBasicMaterial({ color: LAND_TOP }),   // caps (top face visible)
                new THREE.MeshBasicMaterial({ color: LAND_SIDE })   // extruded sides
            ]);
            g.add(fill);

            // glowing shoreline
            const rim = points.map(p => new THREE.Vector3(p[0], height + 0.4, -p[1]));
            rim.push(rim[0].clone());
            g.add(new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(rim),
                new THREE.LineBasicMaterial({ color: SHORE, transparent: true, opacity: 0.95 })));

            // contour rings shrinking toward the centroid
            let cx = 0, cy = 0;
            points.forEach(p => { cx += p[0]; cy += p[1]; });
            cx /= points.length; cy /= points.length;
            [[0.9, 0.4], [0.78, 0.25]].forEach(([s, op], k) => {
                const ring = points.map(p => new THREE.Vector3(
                    cx + (p[0] - cx) * s, height + 0.3 + k * 0.1, -(cy + (p[1] - cy) * s)));
                ring.push(ring[0].clone());
                g.add(new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints(ring),
                    new THREE.LineBasicMaterial({ color: CONTOUR, transparent: true, opacity: op })));
            });

            // street grid clipped to the land polygon
            {
                const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
                const minX = Math.min(...xs), maxX = Math.max(...xs);
                const minY = Math.min(...ys), maxY = Math.max(...ys);
                const STEP = 38, SAMPLE = 7;
                const segs = [];
                const emitRuns = (fixed, lo, hi, vertical) => {
                    let runStart = null, prev = null;
                    for (let v = lo; v <= hi + SAMPLE; v += SAMPLE) {
                        const x = vertical ? fixed : v;
                        const y = vertical ? v : fixed;
                        const inn = v <= hi && pointInPoly(points, x, y);
                        if (inn && runStart === null) runStart = [x, y];
                        if (!inn && runStart !== null) {
                            if (prev) segs.push(W(runStart[0], runStart[1], height + 0.25),
                                                W(prev[0], prev[1], height + 0.25));
                            runStart = null;
                        }
                        prev = [x, y];
                    }
                };
                for (let x = minX + STEP; x < maxX; x += STEP) emitRuns(x, minY, maxY, true);
                for (let y = minY + STEP; y < maxY; y += STEP) emitRuns(y, minX, maxX, false);
                g.add(new THREE.LineSegments(
                    new THREE.BufferGeometry().setFromPoints(segs),
                    new THREE.LineBasicMaterial({ color: GRID_COL, transparent: true, opacity: 0.35 })));
            }
            return g;
        }

        /* ── Water ──
           Transparent-pass layering (critical, do not reorder):
             -2 underwater reflections  -> drawn first, against the void
             -1 water plane             -> washes the reflections dark,
                                           depth-hidden over land
              0 everything ABOVE water  -> bridge, drones, ferries etc.
                                           render after water at full
                                           brightness (never washed)
              8 label leader lines, 9/10 label sprites (annotation layer) */
        const water = new THREE.Mesh(
            new THREE.PlaneGeometry(2800, 2800),
            new THREE.MeshBasicMaterial({ color: WATER_COL, transparent: true, opacity: 0.86 }));
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.1;
        water.renderOrder = -1;
        scene.add(water);

        // mirror group: anything added via addWithReflection() reflects in the water
        const mirror = new THREE.Group();
        mirror.scale.y = -1;
        scene.add(mirror);
        function addWithReflection(obj, reflOpacity = 0.1) {
            scene.add(obj);
            const clone = obj.clone(true);
            clone.traverse(n => {
                n.renderOrder = -2;
                if (n.material) {
                    n.material = (Array.isArray(n.material) ? n.material[0] : n.material).clone();
                    n.material.transparent = true;
                    n.material.opacity = reflOpacity;
                }
            });
            mirror.add(clone);
        }

        /* ── Terrain: the real shape of the harbour ── */
        const LAND_H = 10;
        // South shore: CBD waterfront — Walsh Bay, The Rocks, Circular
        // Quay (the U-shaped ferry bay), Bennelong Point, Farm Cove.
        const southShore = [
            [-620, -460], [-620, -90],
            [-300, -80], [-150, -60],            // Walsh Bay -> Dawes Point (bridge anchor)
            [-100, -90], [-60, -105],            // The Rocks
            [-55, -170], [-15, -200], [40, -195], [55, -125],   // Circular Quay bay
            [70, -90], [78, -18], [100, 10], [124, -15], [132, -90],   // Bennelong Point (sized for the Opera footprint)
            [155, -125], [200, -175], [250, -185], [290, -140], // Farm Cove
            [320, -95], [620, -85], [620, -460]
        ];
        scene.add(landPlate(southShore, LAND_H));

        // North shore: Milsons Point / Kirribilli with Lavender Bay
        const northShore = [
            [-620, 460], [-620, 170], [-380, 185], [-260, 160],
            [-230, 200], [-170, 165], [-150, 150],               // Lavender Bay -> bridge anchor
            [-120, 160], [-60, 150], [0, 145], [120, 160],
            [300, 140], [620, 150], [620, 460]
        ];
        scene.add(landPlate(northShore, LAND_H));

        /* ── Buildings: varied solid volumes standing ON the terrain ──
           Five silhouettes (box, tiered set-backs, slab, antenna tower,
           cylinder) plus Sydney Tower, so the skyline reads like a real
           city instead of a field of identical blocks. */
        {
            let seed = 11;
            const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
            const edgeCyan = new THREE.LineBasicMaterial({ color: DIM_CYAN, transparent: true, opacity: 0.7 });
            const edgeWarm = new THREE.LineBasicMaterial({ color: 0x7a6aa0, transparent: true, opacity: 0.7 });
            const gold = new THREE.LineBasicMaterial({ color: 0xffc864, transparent: true, opacity: 0.9 });
            const fillMat = new THREE.MeshBasicMaterial({ color: BLDG_FILL });
            const towers = new THREE.Group();

            // one block (mesh + glowing edges); returns its top Y
            const addBlock = (e, n, w, h, d, baseY, mat, ry) => {
                const box = new THREE.BoxGeometry(w, h, d);
                const m = new THREE.Mesh(box, fillMat);
                m.position.set(e, baseY + h / 2, -n);
                m.rotation.y = ry;
                towers.add(m);
                const t = new THREE.LineSegments(new THREE.EdgesGeometry(box), mat);
                t.position.copy(m.position);
                t.rotation.y = ry;
                towers.add(t);
                return baseY + h;
            };

            const addBuilding = (e, n, h, warm) => {
                const mat = warm ? edgeWarm : edgeCyan;
                const type = rand();
                const ry = rand() > 0.85 ? (rand() - 0.5) * 0.5 : 0;
                if (type < 0.32) {                       // plain tower
                    addBlock(e, n, 14 + rand() * 16, h, 14 + rand() * 16, LAND_H, mat, ry);
                } else if (type < 0.6) {                 // tiered set-backs
                    let w = 22 + rand() * 14, d = 22 + rand() * 14, y = LAND_H;
                    const tiers = 2 + Math.floor(rand() * 2);
                    for (let k = 0; k < tiers; k++) {
                        y = addBlock(e, n, w, (h / tiers) * (1 - k * 0.1), d, y, mat, ry);
                        w *= 0.6; d *= 0.6;
                    }
                } else if (type < 0.78) {                // wide low slab
                    addBlock(e, n, 30 + rand() * 22, Math.max(18, h * 0.5), 12 + rand() * 8, LAND_H, mat, ry);
                } else if (type < 0.92) {                // tower + antenna spire
                    const top = addBlock(e, n, 15 + rand() * 12, h, 15 + rand() * 12, LAND_H, mat, ry);
                    towers.add(new THREE.Line(
                        new THREE.BufferGeometry().setFromPoints(
                            [new THREE.Vector3(e, top, -n), new THREE.Vector3(e, top + 10 + rand() * 14, -n)]),
                        mat));
                } else {                                 // cylindrical tower
                    const r = 8 + rand() * 6;
                    const cyl = new THREE.CylinderGeometry(r, r, h, 12);
                    const m = new THREE.Mesh(cyl, fillMat);
                    m.position.set(e, LAND_H + h / 2, -n);
                    towers.add(m);
                    const t = new THREE.LineSegments(new THREE.EdgesGeometry(cyl, 30), mat);
                    t.position.copy(m.position);
                    towers.add(t);
                }
            };

            // Sydney CBD — the tall wall behind Circular Quay
            for (let i = 0; i < 34; i++) {
                const e = -260 + rand() * 380;
                const n = -420 + rand() * 175;            // n in [-420, -245]
                const h = 40 + rand() * 110 * (1 - Math.abs(e + 60) / 420);
                addBuilding(e, n, h, rand() > 0.75);
            }
            // North Sydney — shorter, sparser
            for (let i = 0; i < 16; i++) {
                const e = -380 + rand() * 700;
                const n = 245 + rand() * 155;
                addBuilding(e, n, 20 + rand() * 45, false);
            }

            // Sydney Tower — slim gold shaft + turret, tallest thing in the CBD
            {
                const E = -30, NN = -330, SHAFT = 80;
                towers.add(new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints(
                        [W(E, NN, LAND_H), W(E, NN, LAND_H + SHAFT)]), gold));
                const turret = new THREE.CylinderGeometry(9, 5.5, 13, 10);
                const tm = new THREE.Mesh(turret, fillMat);
                tm.position.set(E, LAND_H + SHAFT + 6.5, -NN);
                towers.add(tm);
                const te = new THREE.LineSegments(new THREE.EdgesGeometry(turret, 30), gold);
                te.position.copy(tm.position);
                towers.add(te);
                towers.add(new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints(
                        [W(E, NN, LAND_H + SHAFT + 13), W(E, NN, LAND_H + SHAFT + 28)]), gold));
            }
            scene.add(towers);
        }

        /* ── Harbour Bridge: double arch, Dawes Pt -> Milsons Pt ──
           The Vivid effect: a colour chase pulsing along the arches. */
        const bridge = new THREE.Group();
        let archGeo = null, archParam = null;
        {
            const SPAN = 210, H_OUT = 74, H_IN = 54, DECK = 13, HALF_W = 10;
            const arch = (h, x) => h * (1 - Math.pow((2 * x) / SPAN, 2));
            const STEPS = 36;

            const archPts = [], param = [];
            for (const z of [-HALF_W, HALF_W]) {
                for (let i = 0; i < STEPS; i++) {
                    const x1 = -SPAN / 2 + (SPAN * i) / STEPS;
                    const x2 = -SPAN / 2 + (SPAN * (i + 1)) / STEPS;
                    archPts.push(new THREE.Vector3(x1, DECK + arch(H_OUT, x1), z),
                                 new THREE.Vector3(x2, DECK + arch(H_OUT, x2), z));
                    param.push((x1 + SPAN / 2) / SPAN, (x2 + SPAN / 2) / SPAN);
                }
            }
            archGeo = new THREE.BufferGeometry().setFromPoints(archPts);
            archGeo.setAttribute('color',
                new THREE.BufferAttribute(new Float32Array(archPts.length * 3), 3));
            archParam = param;
            bridge.add(new THREE.LineSegments(archGeo,
                new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 })));

            const pts = [];
            const push = (a, b) => pts.push(a, b);
            for (const z of [-HALF_W, HALF_W]) {
                for (let i = 0; i < STEPS; i++) {
                    const x1 = -SPAN / 2 + (SPAN * i) / STEPS;
                    const x2 = -SPAN / 2 + (SPAN * (i + 1)) / STEPS;
                    push(new THREE.Vector3(x1, DECK + arch(H_IN, x1), z),
                         new THREE.Vector3(x2, DECK + arch(H_IN, x2), z));
                }
                push(new THREE.Vector3(-SPAN / 2 - 30, DECK, z), new THREE.Vector3(SPAN / 2 + 30, DECK, z));
                for (let x = -SPAN / 2 + 15; x <= SPAN / 2 - 15; x += 15) {
                    push(new THREE.Vector3(x, DECK, z), new THREE.Vector3(x, DECK + arch(H_OUT, x), z));
                }
            }
            for (let x = -SPAN / 2 + 15; x <= SPAN / 2 - 15; x += 30) {
                push(new THREE.Vector3(x, DECK + arch(H_OUT, x), -HALF_W),
                     new THREE.Vector3(x, DECK + arch(H_OUT, x), HALF_W));
            }
            bridge.add(new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({ color: DIM_CYAN, transparent: true, opacity: 0.75 })));

            const pylonMat = new THREE.LineBasicMaterial({ color: 0x4a5570, transparent: true, opacity: 0.9 });
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
                const py = new THREE.LineSegments(
                    new THREE.EdgesGeometry(new THREE.BoxGeometry(14, 46, 12)), pylonMat);
                py.position.set(sx * (SPAN / 2 + 14), 23, sz * HALF_W);
                bridge.add(py);
            }

            // local +x -> world north: bridge runs Dawes Point (n=-60) to Milsons Point (n=150)
            bridge.rotation.y = Math.PI / 2;
            bridge.position.copy(W(-150, 45));
            addWithReflection(bridge, 0.12);
        }

        /* ── Opera House on Bennelong Point ──
           The Vivid effect: Lighting of the Sails — animated colour
           projection washing over the shells. */
        const sailMats = [];
        {
            const opera = new THREE.Group();
            const sails = [
                [[-70.2, 0], [-79.3, 17.1, -86.2, 30.9], [-69.1, 33.1, -52, 21.8], [-57.8, 10.2, -60, 0]],
                [[-60, 0], [-64.7, 26.2, -63.3, 46.9], [-40.7, 45.8, -22.2, 21.8], [-37.1, 9.1, -40.7, 0]],
                [[-40.7, 0], [-45.1, 30.9, -53.1, 62.9], [-24.7, 60.7, -0.7, 21.8], [-16.7, 6.9, -22.2, 0]],
                [[-18.9, 0], [12, 37.8, 53.1, 46.9], [52.7, 24, 72.7, 0]],
                [[51, 0], [63.6, 21.8, 90.9, 25.1], [82.9, 10.2, 72.7, 0]]
            ];
            const edgeMat = new THREE.LineBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.9 });
            sails.forEach((seg, i) => {
                const sh = new THREE.Shape();
                sh.moveTo(seg[0][0], seg[0][1]);
                for (let k = 1; k < seg.length; k++) {
                    const c = seg[k];
                    sh.quadraticCurveTo(c[0], c[1], c[2], c[3]);
                }
                sh.closePath();
                const geo = new THREE.ExtrudeGeometry(sh, { depth: 7, bevelEnabled: false });
                const fillMat = new THREE.MeshBasicMaterial({
                    color: 0xff3da6, transparent: true, opacity: 0.8,
                    side: THREE.DoubleSide, depthWrite: false
                });
                sailMats.push(fillMat);
                const fill = new THREE.Mesh(geo, fillMat);
                fill.position.z = i * 1.5 - 4;
                opera.add(fill);
                const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 12), edgeMat);
                edges.position.z = fill.position.z;
                opera.add(edges);
            });
            const pod = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.BoxGeometry(200, 8, 52)),
                new THREE.LineBasicMaterial({ color: DIM_CYAN, transparent: true, opacity: 0.6 }));
            pod.position.y = 4;
            opera.add(pod);

            opera.scale.setScalar(0.45);
            opera.position.copy(W(103, -34, LAND_H));    // tip of Bennelong Point
            opera.rotation.y = Math.PI / 2 + 0.25;       // long axis along the peninsula
            addWithReflection(opera, 0.12);
        }

        /* ── Light Walk: twinkling installations along the Quay foreshore ── */
        let walkGeo = null, walkPhase = null, walkHue = null;
        {
            const path = [
                [70, -95], [60, -118], [50, -150], [42, -185], [20, -198], [-8, -200],
                [-35, -190], [-52, -172], [-58, -140], [-60, -112], [-80, -96], [-105, -90],
                [-128, -78], [-148, -64]
            ];
            const N = path.length;
            const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
            walkPhase = new Float32Array(N); walkHue = new Float32Array(N);
            path.forEach((p, i) => {
                const v = W(p[0], p[1], LAND_H + 2.5);
                pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
                walkPhase[i] = Math.random() * Math.PI * 2;
                walkHue[i] = (i / N + Math.random() * 0.1) % 1;
            });
            walkGeo = new THREE.BufferGeometry();
            walkGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            walkGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            scene.add(new THREE.Points(walkGeo, new THREE.PointsMaterial({
                vertexColors: true, size: 5, transparent: true, opacity: 0.95,
                blending: THREE.AdditiveBlending, depthWrite: false
            })));
        }

        /* ── Botanic Gardens: Lightscape — soft teal tree lights ── */
        {
            let seed = 23;
            const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
            const N = 42, pos = new Float32Array(N * 3);
            for (let i = 0; i < N; i++) {
                const v = W(160 + rand() * 150, -300 + rand() * 110, LAND_H + 1 + rand() * 4);
                pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            scene.add(new THREE.Points(g, new THREE.PointsMaterial({
                color: 0x35e0b0, size: 3, transparent: true, opacity: 0.55,
                blending: THREE.AdditiveBlending, depthWrite: false
            })));
        }

        /* ── Luna Park ferris wheel at Lavender Bay (north shore) ── */
        let wheel = null;
        {
            wheel = new THREE.Group();
            const R = 17;
            const ringPts = [];
            for (let i = 0; i <= 28; i++) {
                const a = (i / 28) * Math.PI * 2;
                ringPts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0));
            }
            const mat = new THREE.LineBasicMaterial({ color: 0xffc864, transparent: true, opacity: 0.8 });
            wheel.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), mat));
            const spokes = [];
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                spokes.push(new THREE.Vector3(0, 0, 0),
                            new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0));
            }
            wheel.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(spokes), mat));
            wheel.position.copy(W(-205, 188, LAND_H + R));
            scene.add(wheel);
        }

        /* ── Ferries: little lights gliding across the harbour ── */
        const ferries = [];
        {
            const mat = new THREE.PointsMaterial({
                color: 0xfff2cc, size: 3.4, transparent: true, opacity: 0.9,
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            const routes = [
                { from: W(15, -185, 2), to: W(55, 130, 2), dur: 26000 },   // Quay -> Kirribilli
                { from: W(140, -100, 2), to: W(230, 120, 2), dur: 34000 }  // Farm Cove -> east shore
            ];
            routes.forEach((r, i) => {
                const g = new THREE.BufferGeometry();
                g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
                const pt = new THREE.Points(g, mat);
                // single moving vertex: its lazily-computed bounding sphere
                // freezes at the first frame's position and would get the
                // whole light frustum-culled when zoomed in
                pt.frustumCulled = false;
                scene.add(pt);
                ferries.push({ ...r, obj: pt, offset: i * 0.5 });
            });
        }

        /* ── Stars ── */
        {
            const N = 900, pos = new Float32Array(N * 3);
            for (let i = 0; i < N; i++) {
                const t = Math.random() * Math.PI * 2;
                const p = Math.acos(Math.random() * 0.85);
                const r = 1600 + Math.random() * 600;
                pos[i * 3] = r * Math.sin(p) * Math.cos(t);
                pos[i * 3 + 1] = Math.abs(r * Math.cos(p)) + 60;
                pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            scene.add(new THREE.Points(g, new THREE.PointsMaterial({
                color: 0x8899bb, size: 1.5, sizeAttenuation: false,
                transparent: true, opacity: 0.65, fog: false
            })));
        }

        /* ── Drone show above the harbour, east of the bridge ── */
        const droneCenter = W(45, 40, 105);
        const N_DRONES = 400;
        const dronePos = new Float32Array(N_DRONES * 3);
        const droneTarget = new Float32Array(N_DRONES * 3);
        let droneShape = 0;
        const droneGroup = new THREE.Group();

        function shapeSphere(i) {
            const g = (1 + Math.sqrt(5)) / 2;
            const t = (2 * Math.PI * i) / g, p = Math.acos(1 - (2 * (i + 0.5)) / N_DRONES);
            const r = 30;
            return [r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)];
        }
        function shapeHeart(i) {
            const t = (i / N_DRONES) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            return [x * 2.1, y * 2.1 + 6, ((i % 3) - 1) * 5 + Math.sin(i) * 2];
        }
        function shapeHelix(i) {
            const t = (i / N_DRONES) * Math.PI * 8;
            const strand = i % 2 === 0 ? 0 : Math.PI;
            return [23 * Math.cos(t + strand), (i / N_DRONES) * 80 - 40, 23 * Math.sin(t + strand)];
        }
        const DRONE_SHAPES = [shapeSphere, shapeHeart, shapeHelix];

        function retargetDrones(next) {
            droneShape = (typeof next === 'number') ? next : (droneShape + 1) % DRONE_SHAPES.length;
            const fn = DRONE_SHAPES[droneShape];
            for (let i = 0; i < N_DRONES; i++) {
                const [x, y, z] = fn(i);
                droneTarget[i * 3] = x; droneTarget[i * 3 + 1] = y; droneTarget[i * 3 + 2] = z;
            }
        }
        {
            for (let i = 0; i < N_DRONES; i++) {
                dronePos[i * 3] = (Math.random() - 0.5) * 110;
                dronePos[i * 3 + 1] = (Math.random() - 0.5) * 110;
                dronePos[i * 3 + 2] = (Math.random() - 0.5) * 110;
            }
            retargetDrones(0);
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.BufferAttribute(dronePos, 3));
            droneGroup.add(new THREE.Points(g, new THREE.PointsMaterial({
                color: PINK, size: 2.6, transparent: true, opacity: 0.95,
                blending: THREE.AdditiveBlending, depthWrite: false
            })));
            droneGroup.position.copy(droneCenter);
            scene.add(droneGroup);
            const reflGroup = new THREE.Group();
            reflGroup.position.set(droneCenter.x, -droneCenter.y, droneCenter.z);
            reflGroup.scale.y = -1;
            const reflPts = new THREE.Points(g, new THREE.PointsMaterial({
                color: PINK, size: 2.2, transparent: true, opacity: 0.08,
                blending: THREE.AdditiveBlending, depthWrite: false
            }));
            reflPts.renderOrder = -2;   // under the water wash, like the other reflections
            reflGroup.add(reflPts);
            scene.add(reflGroup);
        }

        /* ── Landmark pins + district labels ──
           Labels float well ABOVE their landmark with a thin leader
           line down to it — never covering the thing they name, from
           any orbit angle (vertical offsets are view-invariant). */
        const PINS = [
            { event: 'Opera Light',    label: 'Opera House',    pos: W(103, -34, 68),   anchor: W(103, -34, 42),  color: '#2cd9ff' },
            { event: 'Harbour Bridge', label: 'Harbour Bridge', pos: W(-150, 45, 118),  anchor: W(-150, 45, 92),  color: '#2cd9ff' },
            { event: 'Drone Show',     label: 'Drone Show',     pos: W(45, 40, 182),    anchor: W(45, 40, 158),   color: '#ff64c8' }
        ];
        const DISTRICTS = [
            { label: 'CIRCULAR QUAY',         pos: W(-5, -242, LAND_H + 5) },
            { label: 'THE ROCKS',             pos: W(-115, -135, LAND_H + 5) },
            { label: 'ROYAL BOTANIC GARDENS', pos: W(235, -255, LAND_H + 5) },
            { label: 'MILSONS POINT',         pos: W(-150, 230, LAND_H + 5) },
            { label: 'SYDNEY CBD',            pos: W(-50, -370, LAND_H + 5) },
            { label: 'KIRRIBILLI',            pos: W(60, 230, LAND_H + 5) }
        ];
        const pickables = [];
        const pinSprites = {};

        function roundRect(x, a, b, w, h, r) {
            x.beginPath();
            x.moveTo(a + r, b);
            x.arcTo(a + w, b, a + w, b + h, r);
            x.arcTo(a + w, b + h, a, b + h, r);
            x.arcTo(a, b + h, a, b, r);
            x.arcTo(a, b, a + w, b, r);
            x.closePath();
        }

        function pinTexture(text, color) {
            const c = document.createElement('canvas');
            c.width = 512; c.height = 112;
            const x = c.getContext('2d');
            x.fillStyle = 'rgba(8, 10, 22, 0.82)';
            roundRect(x, 6, 6, 500, 100, 50); x.fill();
            x.strokeStyle = color; x.lineWidth = 4;
            roundRect(x, 6, 6, 500, 100, 50); x.stroke();
            x.fillStyle = color;
            x.beginPath(); x.arc(70, 56, 14, 0, Math.PI * 2); x.fill();
            x.fillStyle = '#eef2ff';
            x.font = '600 44px ui-monospace, Menlo, monospace';
            x.textBaseline = 'middle';
            x.fillText(text.toUpperCase(), 110, 58);
            const tex = new THREE.CanvasTexture(c);
            tex.anisotropy = 4;
            tex.colorSpace = THREE.SRGBColorSpace; // r160 colour management: canvas pixels are sRGB
            return tex;
        }

        function districtTexture(text) {
            const c = document.createElement('canvas');
            c.width = 512; c.height = 64;
            const x = c.getContext('2d');
            x.fillStyle = 'rgba(150, 168, 200, 0.85)';
            x.font = '500 30px ui-monospace, Menlo, monospace';
            x.textAlign = 'center';
            x.textBaseline = 'middle';
            x.fillText(text, 256, 32);
            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        }

        PINS.forEach(p => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: pinTexture(p.label, p.color), transparent: true, depthTest: false
            }));
            sprite.scale.set(48, 10.5, 1);
            sprite.position.copy(p.pos);
            sprite.renderOrder = 10;
            scene.add(sprite);
            pinSprites[p.event] = sprite;

            // leader line from the label down to the landmark
            const leader = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(p.pos.x, p.pos.y - 5.5, p.pos.z), p.anchor]),
                new THREE.LineBasicMaterial({
                    color: new THREE.Color(p.color), transparent: true,
                    opacity: 0.5, depthTest: false
                }));
            leader.renderOrder = 8;
            scene.add(leader);

            const hit = new THREE.Mesh(
                new THREE.SphereGeometry(30, 8, 8),
                new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
            hit.position.copy(p.pos);
            hit.userData.event = p.event;
            scene.add(hit);
            pickables.push(hit);
        });

        DISTRICTS.forEach(d => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: districtTexture(d.label), transparent: true, opacity: 0.8, depthTest: false
            }));
            sprite.scale.set(58, 7.2, 1);
            sprite.position.copy(d.pos);
            sprite.renderOrder = 9;
            scene.add(sprite);
        });

        let selectedEvent = null;
        let hoveredEvent = null;

        function refreshPins() {
            PINS.forEach(p => {
                const s = pinSprites[p.event];
                const on = p.event === selectedEvent;
                const hov = p.event === hoveredEvent;
                const k = on ? 1.22 : hov ? 1.1 : 1;
                s.scale.set(48 * k, 10.5 * k, 1);
                s.material.opacity = on || hov || !selectedEvent ? 1 : 0.55;
            });
        }

        function setSelected(eventName) {
            selectedEvent = eventName;
            refreshPins();
            if (eventName === 'Drone Show') retargetDrones();
            window.dispatchEvent(new CustomEvent('vivid-map3d:select', { detail: { event: eventName } }));
        }

        /* ── Input: click select, hover swell, wheel/pinch zoom only ── */
        const el = renderer.domElement;
        const pointers = new Map();
        let pinchDist = 0;

        el.style.touchAction = 'none';
        el.addEventListener('pointerdown', e => {
            el.setPointerCapture(e.pointerId);
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, moved: false });
            if (pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
            }
        });
        el.addEventListener('pointermove', e => {
            if (pointers.size === 0) {
                const hov = pick(e);
                if (hov !== hoveredEvent) { hoveredEvent = hov; refreshPins(); }
                return;
            }
            const p = pointers.get(e.pointerId);
            if (!p) return;
            if (Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y) > 4) p.moved = true;
            p.x = e.clientX; p.y = e.clientY;
            if (pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                zoom = clamp(zoom * (pinchDist / Math.max(d, 1)), 0.45, 1.5);
                pinchDist = d;
            }
        });
        el.addEventListener('pointerup', e => {
            const p = pointers.get(e.pointerId);
            pointers.delete(e.pointerId);
            if (p && !p.moved) {
                const hitEvent = pick(e);
                if (hitEvent) setSelected(hitEvent);
            }
        });
        el.addEventListener('pointercancel', e => pointers.delete(e.pointerId));
        el.addEventListener('wheel', e => {
            e.preventDefault();
            zoom = clamp(zoom * (1 + Math.sign(e.deltaY) * 0.07), 0.45, 1.5);
        }, { passive: false });

        const raycaster = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        function pick(e) {
            const r = el.getBoundingClientRect();
            ndc.set(((e.clientX - r.left) / r.width) * 2 - 1,
                    -((e.clientY - r.top) / r.height) * 2 + 1);
            raycaster.setFromCamera(ndc, camera);
            const hits = raycaster.intersectObjects(pickables, false);
            return hits.length ? hits[0].object.userData.event : null;
        }

        /* ── Resize ── */
        const ro = new ResizeObserver(() => {
            const w = container.clientWidth, h = container.clientHeight;
            if (!w || !h) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // window may move between displays
            renderer.setSize(w, h);
        });
        ro.observe(container);

        /* ── Render loop ── */
        const tmpColor = new THREE.Color();
        let raf = null, lastShapeSwap = 0;

        function frame(now) {
            raf = requestAnimationFrame(frame);
            const t = now * 0.001;

            // the one camera move: a slow, steady 360° orbit
            if (!reduceMotion) theta += 0.0016;
            applyCamera();
            if (compassArrow) compassArrow.style.transform = `rotate(${theta}rad)`;

            // Lighting of the Sails: colour wash cycling across the shells
            sailMats.forEach((m, i) => {
                m.color.setHSL((t * 0.05 + i * 0.13) % 1, 0.85, 0.55);
            });

            // Bridge colour chase along the outer arches
            {
                const colors = archGeo.attributes.color.array;
                for (let i = 0; i < archParam.length; i++) {
                    tmpColor.setHSL((archParam[i] * 0.7 + t * 0.1) % 1, 1, 0.6);
                    colors[i * 3] = tmpColor.r;
                    colors[i * 3 + 1] = tmpColor.g;
                    colors[i * 3 + 2] = tmpColor.b;
                }
                archGeo.attributes.color.needsUpdate = true;
            }

            // Light Walk twinkle
            {
                const colors = walkGeo.attributes.color.array;
                for (let i = 0; i < walkPhase.length; i++) {
                    const l = 0.42 + 0.28 * Math.sin(t * 2 + walkPhase[i]);
                    tmpColor.setHSL((walkHue[i] + t * 0.03) % 1, 0.95, l);
                    colors[i * 3] = tmpColor.r;
                    colors[i * 3 + 1] = tmpColor.g;
                    colors[i * 3 + 2] = tmpColor.b;
                }
                walkGeo.attributes.color.needsUpdate = true;
            }

            // Drones: ease toward targets, auto-morph every 7s
            if (now - lastShapeSwap > 7000 && !reduceMotion) {
                retargetDrones();
                lastShapeSwap = now;
            }
            for (let i = 0; i < N_DRONES * 3; i++) {
                dronePos[i] += (droneTarget[i] - dronePos[i]) * 0.035;
            }
            droneGroup.rotation.y += 0.003;
            droneGroup.position.y = droneCenter.y + Math.sin(now * 0.0009) * 3;
            droneGroup.children[0].geometry.attributes.position.needsUpdate = true;

            // Ferris wheel + ferries
            if (!reduceMotion) wheel.rotation.z = t * 0.12;
            ferries.forEach(f => {
                let k = ((now / f.dur) + f.offset) % 1;
                k = k < 0.5 ? k * 2 : (1 - k) * 2;  // ping-pong
                const arr = f.obj.geometry.attributes.position.array;
                arr[0] = f.from.x + (f.to.x - f.from.x) * k;
                arr[1] = 2;
                arr[2] = f.from.z + (f.to.z - f.from.z) * k;
                f.obj.geometry.attributes.position.needsUpdate = true;
            });

            renderer.render(scene, camera);
        }

        applyCamera();

        /* The loop runs only while the demo is BOTH started (Map screen
           active) AND on-screen — rAF does not throttle for elements
           scrolled out of view, only for hidden tabs. */
        let running = false, visible = true;
        function syncLoop() {
            if (running && visible) {
                if (!raf) { lastShapeSwap = performance.now(); raf = requestAnimationFrame(frame); }
            } else if (raf) {
                cancelAnimationFrame(raf);
                raf = null;
            }
        }
        const io = new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            syncLoop();
        }, { threshold: 0.05 });
        io.observe(container);

        const controller = {
            start() { running = true; syncLoop(); },
            stop() { running = false; syncLoop(); },
            resetCamera() {
                zoom = 1;
                theta = 0;
                setSelected(null);
                applyCamera();
            }
        };
        return controller;
    }

    window.VividMap3D = { mount };
})();
