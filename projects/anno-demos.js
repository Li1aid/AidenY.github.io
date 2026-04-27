/* ===========================================================
   ANNO — Interactive demo controller
   Five scenes (Medication / Health Anomaly / Dispenser /
   Emotion / Privacy) sharing one robot-dog stage. Each scene
   swaps the right-hand panel + bottom voice prompts + mode flag
   driving the dog's CSS animations.
   =========================================================== */
(function () {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    const stage   = $('#anno-demo')?.closest('.anno-stage');
    const dogStage = $('.anno-stage');
    const bubble  = $('#anno-bubble');
    const bubbleText = $('#anno-bubble-text');
    const panelEyebrow = $('#anno-panel-eyebrow');
    const panelTitle = $('#anno-panel-title');
    const panelBody = $('#anno-panel-body');
    const promptsBar = $('#anno-voice-prompts');
    const mic = $('#anno-voice-mic');
    const screenBpm = $('#anno-screen-bpm');
    const screenBp  = $('#anno-screen-bp');
    if (!stage) return;

    let bubbleTimer = null;
    function say(text, ms = 3500) {
        if (!bubble) return;
        bubbleText.textContent = text;
        bubble.classList.remove('show');
        // Force reflow so the show class re-triggers the transition.
        void bubble.offsetWidth;
        bubble.classList.add('show');
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => {
            bubble.classList.remove('show');
        }, ms);
    }

    const mouth = $('#anno-mouth');
    // Mouth-line coordinates for the new snout (x ≈ 68-92, y ≈ 122).
    const mouthPaths = {
        idle:    'M 68 100 Q 80 103 92 100',
        happy:   'M 66 98  Q 80 108 94 98',
        curious: 'M 70 100 L 92 100',
        alert:   'M 68 104 Q 80 97  92 104',
        sleep:   'M 70 101 Q 80 103 92 101',
    };
    function setMode(mode) {
        dogStage.setAttribute('data-anno-mode', mode);
        if (mouth && mouthPaths[mode]) mouth.setAttribute('d', mouthPaths[mode]);
    }

    function setBpm(n) {
        if (screenBpm) screenBpm.textContent = String(n);
    }
    function setBp(s) {
        if (screenBp) screenBp.textContent = s;
    }

    /* =========================================================
       SCENE: MEDICATION
       Three pill rows; clicking a pill marks it taken and Anno
       acknowledges. Voice prompts pre-canned for elderly speech.
       ========================================================= */
    const meds = [
        { id: 'morning', icon: '☀', name: 'Morning meds', name_zh: '早晨用药', time: '8:00 AM', taken: false },
        { id: 'noon',    icon: '◐', name: 'Lunch meds',   name_zh: '午餐用药', time: '12:30 PM', taken: false },
        { id: 'evening', icon: '☾', name: 'Evening meds', name_zh: '晚间用药', time: '7:00 PM', taken: false },
    ];

    function renderMeds() {
        panelEyebrow.dataset.en = 'MEDICATION';
        panelEyebrow.dataset.zh = '用药';
        panelEyebrow.textContent = 'MEDICATION';
        panelTitle.textContent = '8:00 AM — Morning routine';
        panelBody.innerHTML = '';
        meds.forEach((m, i) => {
            const row = document.createElement('div');
            row.className = 'anno-pill-row' + (m.taken ? ' taken' : '');
            row.innerHTML = `
                <div class="anno-pill-icon ${m.id}">${m.icon}</div>
                <div class="anno-pill-info">
                    <div class="anno-pill-name">${m.name}</div>
                    <div class="anno-pill-time">${m.time}</div>
                </div>
                <div class="anno-pill-status">${m.taken ? 'TAKEN' : 'PENDING'}</div>
            `;
            row.addEventListener('click', () => {
                if (m.taken) return;
                m.taken = true;
                renderMeds();
                say('Great job! Have a wonderful day.');
                setMode('happy');
                setTimeout(() => setMode('idle'), 2500);
            });
            panelBody.appendChild(row);
        });
        promptsBar.innerHTML = '';
        ['Did I take my pills?', 'Remind me at 7 PM', 'Skip noon meds'].forEach(txt => {
            const b = document.createElement('button');
            b.className = 'anno-voice-prompt';
            b.textContent = '"' + txt + '"';
            b.addEventListener('click', () => handleVoice(txt));
            promptsBar.appendChild(b);
        });
    }

    /* =========================================================
       SCENE: HEALTH ANOMALY + SOS
       BPM jumps. Anno asks if the user is OK. If no response in
       countdown, SOS is triggered. Cancel button stops it.
       ========================================================= */
    let sosTimer = null;
    let sosCount = 10;

    function renderHealth() {
        clearInterval(sosTimer);
        sosCount = 10;
        panelEyebrow.dataset.en = 'ANOMALY DETECTED';
        panelEyebrow.dataset.zh = '检测到异常';
        panelEyebrow.textContent = 'ANOMALY DETECTED';
        panelTitle.textContent = 'Heart rate spike — checking in';
        setBpm(132);
        setBp('158/96');
        setMode('alert');
        say('Are you feeling alright? Tap any button if yes.');

        panelBody.innerHTML = `
            <div class="anno-vital">
                <div class="anno-vital-cell alert">
                    <div class="anno-vital-label">Heart</div>
                    <div class="anno-vital-value">132<span class="anno-vital-unit">bpm</span></div>
                </div>
                <div class="anno-vital-cell">
                    <div class="anno-vital-label">Temp</div>
                    <div class="anno-vital-value">37.8<span class="anno-vital-unit">°C</span></div>
                </div>
                <div class="anno-vital-cell">
                    <div class="anno-vital-label">Activity</div>
                    <div class="anno-vital-value">low</div>
                </div>
            </div>
            <div class="anno-sos" id="anno-sos">
                <div class="anno-sos-num" id="anno-sos-num">${sosCount}</div>
                <div class="anno-sos-text">No response detected. SOS will call your emergency contacts.</div>
                <button class="anno-sos-cancel" id="anno-sos-cancel">I'M OK</button>
            </div>
        `;
        const sosNum = $('#anno-sos-num');
        const cancel = $('#anno-sos-cancel');
        sosTimer = setInterval(() => {
            sosCount--;
            if (sosNum) sosNum.textContent = sosCount;
            if (sosCount <= 0) {
                clearInterval(sosTimer);
                say('Calling family and clinic now.');
                if (sosNum) sosNum.textContent = '!';
                cancel.textContent = 'CALLED';
                cancel.disabled = true;
            }
        }, 1000);
        cancel.addEventListener('click', () => {
            clearInterval(sosTimer);
            setMode('happy');
            setBpm(86);
            setBp('124/82');
            say('Glad you are okay. Resting now.');
            $('#anno-sos').remove();
        });

        promptsBar.innerHTML = '';
        ['I am okay', 'Call my daughter', 'Show me my heart rate'].forEach(txt => {
            const b = document.createElement('button');
            b.className = 'anno-voice-prompt';
            b.textContent = '"' + txt + '"';
            b.addEventListener('click', () => {
                if (txt === 'I am okay') cancel.click();
                else handleVoice(txt);
            });
            promptsBar.appendChild(b);
        });
    }

    /* =========================================================
       SCENE: DISPENSER
       Animated pill-pop sequence: Anno bows, screen shows
       loading dots, dispenser "opens" (on the side panel).
       ========================================================= */
    function renderDispenser() {
        panelEyebrow.dataset.en = 'DISPENSER';
        panelEyebrow.dataset.zh = '智能药盒';
        panelEyebrow.textContent = 'DISPENSER';
        panelTitle.textContent = 'Preparing your morning dose';
        setMode('idle');
        setBpm(72);
        setBp('118/78');
        panelBody.innerHTML = `
            <p>Anno's belly compartment dispenses pre-sorted doses on schedule. Prescriptions sync from the GP, so the right pills are loaded automatically.</p>
            <div class="anno-vital">
                <div class="anno-vital-cell">
                    <div class="anno-vital-label">Today</div>
                    <div class="anno-vital-value">3<span class="anno-vital-unit">doses</span></div>
                </div>
                <div class="anno-vital-cell">
                    <div class="anno-vital-label">Refill in</div>
                    <div class="anno-vital-value">14<span class="anno-vital-unit">days</span></div>
                </div>
                <div class="anno-vital-cell">
                    <div class="anno-vital-label">GP Sync</div>
                    <div class="anno-vital-value" style="color:#5dffa3">OK</div>
                </div>
            </div>
            <button class="anno-sos-cancel" id="anno-dispense" style="margin-top: 0.4rem; align-self: flex-start; background: linear-gradient(135deg, var(--anno-violet), var(--anno-mint)); color: #0e1320; border: none;">DISPENSE NOW</button>
        `;
        $('#anno-dispense').addEventListener('click', () => {
            setMode('curious');
            say('Dispensing now. Please open my belly compartment.');
            setTimeout(() => {
                setMode('happy');
                say('Done. Take with water.');
            }, 2200);
        });
        promptsBar.innerHTML = '';
        ['Dispense morning meds', 'When is my next dose?', 'Refill status'].forEach(txt => {
            const b = document.createElement('button');
            b.className = 'anno-voice-prompt';
            b.textContent = '"' + txt + '"';
            b.addEventListener('click', () => handleVoice(txt));
            promptsBar.appendChild(b);
        });
    }

    /* =========================================================
       SCENE: EMOTION
       4 emotion buttons toggle the dog's animation mode and
       speech bubble — proves "tool to companion".
       ========================================================= */
    const emotions = [
        { key: 'idle',    emoji: '🙂', label: 'Calm',    msg: 'Just here with you.' },
        { key: 'happy',   emoji: '😊', label: 'Happy',   msg: 'Yay! Tail wagging mode.' },
        { key: 'curious', emoji: '🤨', label: 'Curious', msg: 'Hmm, what is that?' },
        { key: 'alert',   emoji: '😟', label: 'Worried', msg: 'Something feels off — check on me.' },
    ];

    function renderEmotion() {
        panelEyebrow.dataset.en = 'EMOTIONAL FEEDBACK';
        panelEyebrow.dataset.zh = '情感反馈';
        panelEyebrow.textContent = 'EMOTIONAL FEEDBACK';
        panelTitle.textContent = 'How is Anno feeling today?';
        setBpm(72);
        setBp('118/78');
        setMode('idle');
        panelBody.innerHTML = `
            <p>Anno's body language mirrors your health state. Tap a mood to see how it shifts — tail speed, head angle, eye colour and screen pulse all change.</p>
            <div class="anno-emo-grid" id="anno-emo-grid"></div>
        `;
        const grid = $('#anno-emo-grid');
        emotions.forEach((e, i) => {
            const b = document.createElement('button');
            b.className = 'anno-emo-btn' + (i === 0 ? ' active' : '');
            b.innerHTML = `<span class="anno-emo-emoji">${e.emoji}</span><span class="anno-emo-label">${e.label}</span>`;
            b.addEventListener('click', () => {
                $$('.anno-emo-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                setMode(e.key);
                say(e.msg);
                if (e.key === 'alert') { setBpm(132); setBp('158/96'); }
                else if (e.key === 'happy') { setBpm(82); setBp('120/80'); }
                else { setBpm(72); setBp('118/78'); }
            });
            grid.appendChild(b);
        });
        promptsBar.innerHTML = '';
        ['Good morning Anno', 'Are you OK?', 'Come here'].forEach(txt => {
            const b = document.createElement('button');
            b.className = 'anno-voice-prompt';
            b.textContent = '"' + txt + '"';
            b.addEventListener('click', () => handleVoice(txt));
            promptsBar.appendChild(b);
        });
    }

    /* =========================================================
       SCENE: PRIVACY
       Three-tab view: User / Family / Doctor — same data,
       different visibility levels.
       ========================================================= */
    const privacyData = {
        user: [
            { k: 'Heart rate (24h avg)', v: '74 bpm' },
            { k: 'Sleep (last night)',   v: '6h 42m' },
            { k: 'Steps today',          v: '2,140' },
            { k: 'Mood log',             v: 'Calm' },
            { k: 'Medication adherence', v: '94%' },
            { k: 'Blood pressure',       v: '118/78' },
        ],
        family: [
            { k: 'Critical alerts',     v: 'None today' },
            { k: 'Missed medication',   v: 'None' },
            { k: 'Last activity',       v: '12 min ago' },
            { k: 'Heart rate (24h avg)', redacted: true },
            { k: 'Sleep details',       redacted: true },
            { k: 'Mood log',            redacted: true },
        ],
        doctor: [
            { k: 'Critical alerts',      v: 'None today' },
            { k: 'Heart rate (24h avg)', v: '74 bpm' },
            { k: 'Blood pressure',       v: '118/78' },
            { k: 'Medication adherence', v: '94%' },
            { k: 'Mood log',             redacted: true },
            { k: 'Last activity',        redacted: true },
        ],
    };

    function renderPrivacy(view = 'user') {
        panelEyebrow.dataset.en = 'PRIVACY VIEWS';
        panelEyebrow.dataset.zh = '隐私视图';
        panelEyebrow.textContent = 'PRIVACY VIEWS';
        panelTitle.textContent = 'Same data, different lenses';
        setMode('idle');

        panelBody.innerHTML = `
            <div class="anno-privacy-tabs" id="anno-privacy-tabs">
                <button class="anno-privacy-tab" data-view="user">You</button>
                <button class="anno-privacy-tab" data-view="family">Family</button>
                <button class="anno-privacy-tab" data-view="doctor">Doctor</button>
            </div>
            <div id="anno-privacy-list"></div>
        `;
        const list = $('#anno-privacy-list');
        const tabs = $$('.anno-privacy-tab');
        function paint(v) {
            tabs.forEach(t => t.classList.toggle('active', t.dataset.view === v));
            list.innerHTML = '';
            privacyData[v].forEach(row => {
                const div = document.createElement('div');
                div.className = 'anno-privacy-row';
                if (row.redacted) {
                    div.innerHTML = `<span class="anno-privacy-key">${row.k}</span><span class="anno-privacy-redacted">private</span>`;
                } else {
                    div.innerHTML = `<span class="anno-privacy-key">${row.k}</span><span class="anno-privacy-val">${row.v}</span>`;
                }
                list.appendChild(div);
            });
        }
        tabs.forEach(t => t.addEventListener('click', () => paint(t.dataset.view)));
        paint(view);

        promptsBar.innerHTML = '';
        ['Show my data', 'What does my family see?', 'Send report to doctor'].forEach(txt => {
            const b = document.createElement('button');
            b.className = 'anno-voice-prompt';
            b.textContent = '"' + txt + '"';
            b.addEventListener('click', () => handleVoice(txt));
            promptsBar.appendChild(b);
        });
    }

    /* =========================================================
       Voice handler — fakes natural-language reply for any
       prompt. Used by all scenes.
       ========================================================= */
    const voiceReplies = [
        ['pill', 'You took your morning pills at 8:04 AM.'],
        ['skip', 'OK, I will skip the noon meds today.'],
        ['remind', 'Reminder set for 7 PM.'],
        ['heart', 'Your heart rate is 74 — perfectly fine.'],
        ['daughter', 'Calling Sarah now.'],
        ['ok', 'Glad you are okay.'],
        ['dispense', 'Dispensing now.'],
        ['next dose', 'Next dose is at 12:30 PM.'],
        ['refill', '14 days of medication left.'],
        ['morning', 'Good morning! How did you sleep?'],
        ['data', 'Showing your daily summary.'],
        ['family', 'They only see critical alerts.'],
        ['doctor', 'Sending your weekly report to Dr. Lee.'],
        ['come', 'On my way.'],
    ];
    function handleVoice(text) {
        const t = text.toLowerCase();
        let reply = 'I heard you. Let me check.';
        for (const [k, v] of voiceReplies) { if (t.includes(k)) { reply = v; break; } }
        say(reply);
        setMode('curious');
        setTimeout(() => setMode('idle'), 2200);
    }

    if (mic) {
        mic.addEventListener('click', () => {
            mic.classList.add('listening');
            say('Listening...');
            setTimeout(() => mic.classList.remove('listening'), 1600);
        });
    }

    /* =========================================================
       Scene router
       ========================================================= */
    const scenes = {
        meds:      renderMeds,
        health:    renderHealth,
        dispenser: renderDispenser,
        emotion:   renderEmotion,
        privacy:   renderPrivacy,
    };
    let currentScene = 'meds';

    function switchScene(name) {
        if (!scenes[name]) return;
        currentScene = name;
        $$('.anno-scene-btn').forEach(b => b.classList.toggle('active', b.dataset.scene === name));
        clearInterval(sosTimer);
        // Reset vitals before each scene paints its own
        setBpm(72);
        setBp('118/78');
        scenes[name]();
    }

    $$('.anno-scene-btn').forEach(b => {
        b.addEventListener('click', () => switchScene(b.dataset.scene));
    });

    // Feature cards that link to demo
    $$('.anno-feature[data-jump]').forEach(card => {
        card.addEventListener('click', (e) => {
            const target = card.dataset.jump;
            if (!target) return;
            // Let the anchor #anno-demo do the scroll, then switch scene
            setTimeout(() => switchScene(target), 250);
        });
    });

    // Initial paint
    switchScene('meds');
})();
