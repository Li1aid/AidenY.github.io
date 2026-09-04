/* ========================================
   Modern Portfolio JavaScript
   Advanced Animations & Interactions
   ======================================== */

// ========================================
// Matrix Rain Effect
// ========================================

class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrix-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.columns = [];
        this.fontSize = 14;
        this.chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

        this.resize();
        this.init();
        this.animate();

        window.addEventListener('resize', () => {
            this.resize();
            this.init();
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        const columnCount = Math.floor(this.canvas.width / this.fontSize);
        this.columns = [];

        for (let i = 0; i < columnCount; i++) {
            this.columns.push({
                y: Math.random() * this.canvas.height,
                speed: Math.random() * 2 + 1
            });
        }
    }

    animate() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = `${this.fontSize}px monospace`;

        this.columns.forEach((column, i) => {
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            const x = i * this.fontSize;

            // Grayscale color for matrix effect
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fillText(char, x, column.y);

            // Reset column when it reaches bottom
            if (column.y > this.canvas.height && Math.random() > 0.99) {
                column.y = 0;
            }

            column.y += column.speed;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// Particle Background System
// ========================================

class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.shootingStars = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.time = 0;

        this.resize();
        this.init();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        // Lower density on small screens — the O(n²) connection pass is heavy on mobile
        const density = window.innerWidth < 768 ? 22000 : 13000;
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / density);

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 2.5 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                hue: Math.random() * 60 + 180,
                wobble: Math.random() * Math.PI * 2
            });
        }
        this.buildSprites();
    }

    // One cached glow sprite per hue bucket — replaces createRadialGradient() on every particle every frame
    buildSprites() {
        this.sprites = [];
        const R = 16;
        for (let b = 0; b < 6; b++) {
            const hue = 180 + b * 10 + 5;
            const c = document.createElement('canvas');
            c.width = c.height = R * 2;
            const g = c.getContext('2d');
            const grad = g.createRadialGradient(R, R, 0, R, R, R);
            grad.addColorStop(0, `hsla(${hue}, 70%, 70%, 1)`);
            grad.addColorStop(0.5, `hsla(${hue}, 60%, 60%, 0.5)`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            g.fillStyle = grad;
            g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.fill();
            this.sprites.push(c);
        }
    }

    createShootingStar() {
        if (Math.random() < 0.01) {
            this.shootingStars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height / 2,
                vx: Math.random() * 5 + 3,
                vy: Math.random() * 3 + 1,
                size: Math.random() * 2 + 1,
                life: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
    }

    animate() {
        this.time += 0.01;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.createShootingStar();

        this.shootingStars.forEach((star, index) => {
            star.x += star.vx;
            star.y += star.vy;
            star.life -= star.decay;

            if (star.life <= 0) {
                this.shootingStars.splice(index, 1);
                return;
            }

            const gradient = this.ctx.createLinearGradient(
                star.x, star.y,
                star.x - star.vx * 10, star.y - star.vy * 10
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${star.life * 0.8})`);
            gradient.addColorStop(0.5, `rgba(100, 200, 255, ${star.life * 0.4})`);
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

            this.ctx.beginPath();
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = star.size;
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(star.x - star.vx * 10, star.y - star.vy * 10);
            this.ctx.stroke();
        });

        this.particles.forEach((particle, i) => {
            particle.wobble += 0.02;
            particle.x += particle.vx + Math.sin(particle.wobble) * 0.3;
            particle.y += particle.vy + Math.cos(particle.wobble) * 0.3;

            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200) {
                const force = (200 - distance) / 200;
                const angle = Math.atan2(dy, dx);
                particle.x -= Math.cos(angle) * force * 3;
                particle.y -= Math.sin(angle) * force * 3;
                particle.opacity = Math.min(1, particle.opacity + force * 0.3);
            } else {
                particle.opacity = Math.max(0.2, particle.opacity - 0.01);
            }

            if (particle.x < -10) particle.x = this.canvas.width + 10;
            if (particle.x > this.canvas.width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = this.canvas.height + 10;
            if (particle.y > this.canvas.height + 10) particle.y = -10;

            const pulse = Math.sin(this.time + i * 0.1) * 0.3 + 0.7;
            const r = particle.size * 2 * pulse;
            const sprite = this.sprites[Math.min(5, Math.floor((particle.hue - 180) / 10))];
            this.ctx.globalAlpha = particle.opacity * pulse;
            this.ctx.drawImage(sprite, particle.x - r, particle.y - r, r * 2, r * 2);
        });
        this.ctx.globalAlpha = 1;

        // Connections: cheap bounding-box reject, squared distance, and one stroke per alpha bucket
        const LINK = 150, LINK2 = LINK * LINK, BUCKETS = 4;
        const paths = [];
        for (let b = 0; b < BUCKETS; b++) paths.push(new Path2D());
        const ps = this.particles, n = ps.length;
        for (let i = 0; i < n; i++) {
            const a = ps[i];
            for (let j = i + 1; j < n; j++) {
                const c = ps[j];
                const dx = a.x - c.x; if (dx > LINK || dx < -LINK) continue;
                const dy = a.y - c.y; if (dy > LINK || dy < -LINK) continue;
                const d2 = dx * dx + dy * dy;
                if (d2 >= LINK2) continue;
                const t = 1 - Math.sqrt(d2) / LINK;           // 0..1, stronger when closer
                const bucket = Math.min(BUCKETS - 1, Math.floor(t * BUCKETS));
                paths[bucket].moveTo(a.x, a.y);
                paths[bucket].lineTo(c.x, c.y);
            }
        }
        this.ctx.lineWidth = 1;
        for (let b = 0; b < BUCKETS; b++) {
            const alpha = 0.3 * ((b + 0.5) / BUCKETS);
            this.ctx.strokeStyle = `hsla(210, 60%, 60%, ${alpha})`;
            this.ctx.stroke(paths[b]);
        }

        if (!document.hidden) requestAnimationFrame(() => this.animate());
        else this.paused = true;
    }
}

document.addEventListener('visibilitychange', () => {
    const ps = window.__particleSystem;
    if (ps && ps.paused && !document.hidden) { ps.paused = false; ps.animate(); }
});

// ========================================
// Custom Cursor
// ========================================

class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.cursorDot = document.querySelector('.cursor-dot');

        if (!this.cursor || !this.cursorDot) return;

        this.init();
    }

    init() {
        // Place cursor at viewport center on init so it's visible
        // even before the user moves the mouse (otherwise the default
        // translate(-50%, -50%) parks it in the top-left corner).
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        gsap.set(this.cursor, { x: cx, y: cy });
        gsap.set(this.cursorDot, { x: cx, y: cy });

        document.addEventListener('mousemove', (e) => {
            // Ultra fast cursor for smooth tracking
            gsap.to(this.cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.15,
                ease: 'power1.out'
            });

            gsap.to(this.cursorDot, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.03
            });
        });

        const hoverElements = document.querySelectorAll('a, button, .project-card, .contact-method');

        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('hover');
            });

            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('hover');
            });
        });
    }
}

// ========================================
// Scroll Progress Bar
// ========================================

function updateScrollProgress() {
    const scrollProgress = document.querySelector('.scroll-progress-bar');
    if (!scrollProgress) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;

    scrollProgress.style.width = scrollPercent + '%';
}

// ========================================
// Page Navigation Dots
// ========================================

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navDots = document.querySelectorAll('.page-nav-dot');

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 300) {
            currentSection = section.getAttribute('id');
        }
    });

    navDots.forEach(dot => {
        dot.classList.remove('active');
        if (dot.getAttribute('href') === '#' + currentSection) {
            dot.classList.add('active');
        }
    });
}

// ========================================
// Loading Animation
// ========================================

function initLoader() {
    // Loader markup was removed. Kick off animations directly.
    initAnimations({ skipIntro: false });
}

// ========================================
// Main Animations with GSAP
// ========================================

function initAnimations(options = {}) {
    const { skipIntro = false } = options;
    gsap.registerPlugin(ScrollTrigger);

    if (skipIntro) {
        gsap.set('.main-nav', { opacity: 1, y: 0 });
    } else {
        gsap.to('.main-nav', {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out'
        });
    }

    // Pixel-style digital decode animation
    const titleLine1 = document.querySelector('.title-line-1');
    const titleLine2 = document.querySelector('.title-line-2');
    const heroTitle = document.querySelector('.hero-main-title');

    if (skipIntro && titleLine1 && titleLine2 && heroTitle) {
        titleLine1.style.opacity = '1';
        titleLine2.style.opacity = '1';
        heroTitle.classList.add('loaded');
    } else if (titleLine1 && titleLine2 && heroTitle) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

        function decodeText(element, finalText, delay) {
            const length = finalText.length;
            let iterations = 0;

            element.style.opacity = '1';

            const interval = setInterval(() => {
                const decoded = finalText.split('').map((char, index) => {
                    if (index < iterations) {
                        return finalText[index];
                    }
                    return char === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
                }).join('');

                // Preserve HTML structure for emphasis-text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = element.innerHTML;

                // Update text nodes only
                const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
                let textNodes = [];
                while (walker.nextNode()) {
                    textNodes.push(walker.currentNode);
                }

                let charIndex = 0;
                textNodes.forEach(node => {
                    const nodeLength = node.textContent.length;
                    node.textContent = decoded.slice(charIndex, charIndex + nodeLength);
                    charIndex += nodeLength;
                });

                element.innerHTML = tempDiv.innerHTML;

                iterations += 1 / 3;

                if (iterations >= length) {
                    clearInterval(interval);
                    element.innerHTML = tempDiv.innerHTML;

                    // Flash keywords after decode
                    const emphasisElements = element.querySelectorAll('.emphasis-text');
                    emphasisElements.forEach((el, i) => {
                        setTimeout(() => {
                            el.classList.add('active');
                        }, i * 100);
                    });
                }
            }, 30);
        }

        setTimeout(() => {
            decodeText(titleLine1, titleLine1.textContent, 0);
        }, 200);

        setTimeout(() => {
            decodeText(titleLine2, titleLine2.textContent, 0);
        }, 800);

        setTimeout(() => {
            heroTitle.classList.add('loaded');
        }, 2500);
    }

    if (skipIntro) {
        gsap.set('.hero-info-grid', { opacity: 1, y: 0 });
        gsap.set('.info-column', { opacity: 1, y: 0 });
        gsap.set('.scroll-indicator', { opacity: 0.6 });
    } else {
        gsap.to('.hero-info-grid', {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.5,
            ease: 'power3.out'
        });

        gsap.to('.info-column', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            delay: 0.5,
            ease: 'power3.out'
        });

        gsap.to('.scroll-indicator', {
            opacity: 0.6,
            duration: 1,
            delay: 2,
            ease: 'power2.out'
        });
    }

    animateSections();
    animateAbout();
    animateProjectCards();
    animateSkillBars();
    animateFooter();
}

// ========================================
// Section Scroll Animations (Smoother)
// ========================================

function animateSections() {
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.to(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                once: true
            },
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out'
        });
    });

    gsap.to('.about-text', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 65%',
            once: true
        },
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out'
    });

    // Contact section - static display (no animations)
    gsap.utils.toArray('.contact-method').forEach((method) => {
        gsap.set(method, { opacity: 1, y: 0 });
    });

    gsap.set('.contact-cta', { opacity: 1, y: 0 });
}

function animateProjectCards() {
    gsap.to('.project-card', {
        scrollTrigger: {
            trigger: '.projects-grid',
            start: 'top 85%',
            once: true
        },
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 1,
        ease: 'power2.out'
    });
}

function animateAbout() {
    // Animate avatar - fade in only on scroll, trigger earlier and faster
    gsap.to('.about-avatar', {
        scrollTrigger: {
            trigger: '.about-avatar',
            start: 'top 85%',
            once: true
        },
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
    });

    // Animate text container - fade in only on scroll, trigger earlier and faster
    gsap.to('.about-text', {
        scrollTrigger: {
            trigger: '.about-text',
            start: 'top 85%',
            once: true
        },
        opacity: 1,
        duration: 0.6,
        delay: 0.1,
        ease: 'power2.out'
    });

    // Animate title specifically - trigger earlier and faster
    gsap.to('.about-title', {
        scrollTrigger: {
            trigger: '.about-text',
            start: 'top 85%',
            once: true
        },
        opacity: 1,
        duration: 0.6,
        delay: 0.15,
        ease: 'power2.out'
    });

    // Animate descriptions - trigger earlier and faster
    gsap.to('.about-description', {
        scrollTrigger: {
            trigger: '.about-text',
            start: 'top 85%',
            once: true
        },
        opacity: 1,
        duration: 0.6,
        delay: 0.2,
        stagger: 0.08,
        ease: 'power2.out'
    });

    // Animate philosophy section
    gsap.to('.philosophy-section', {
        scrollTrigger: {
            trigger: '.philosophy-section',
            start: 'top 80%',
            once: true
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });

    // Animate philosophy items
    gsap.utils.toArray('.philosophy-item').forEach((item, i) => {
        gsap.to(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                once: true
            },
            opacity: 1,
            x: 0,
            duration: 0.8,
            delay: i * 0.2,
            ease: 'power3.out'
        });
    });

    // Animate timeline title
    gsap.to('.timeline-title', {
        scrollTrigger: {
            trigger: '.timeline-title',
            start: 'top 85%',
            once: true
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });

    // Animate timeline items
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
        gsap.to(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                once: true
            },
            opacity: 1,
            x: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power3.out',
            onStart: () => {
                item.classList.add('animate');
            }
        });
    });
}

function animateSkillBars() {
    gsap.utils.toArray('.skill-category-box').forEach((box, i) => {
        gsap.to(box, {
            scrollTrigger: {
                trigger: box,
                start: 'top 85%',
                once: true
            },
            opacity: 1,
            y: 0,
            duration: 1,
            delay: i * 0.15,
            ease: 'power2.out'
        });

        const keywords = box.querySelectorAll('.keyword-item');
        keywords.forEach((keyword, j) => {
            gsap.to(keyword, {
                scrollTrigger: {
                    trigger: keyword,
                    start: 'top 90%',
                    once: true
                },
                opacity: 1,
                x: 0,
                duration: 0.6,
                delay: i * 0.15 + j * 0.08,
                ease: 'power3.out'
            });
        });
    });
}

function animateFooter() {
    ScrollTrigger.create({
        trigger: '.footer',
        start: 'top 80%',
        onEnter: () => document.querySelector('.footer').classList.add('visible')
    });

    // Footer animations removed - display immediately
}

function initSmoothScroll() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');

            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                if (typeof gsap !== 'undefined' && gsap.core.globals().ScrollToPlugin) {
                    gsap.to(window, {
                        duration: 1.5,
                        scrollTo: {
                            y: target,
                            offsetY: 0
                        },
                        ease: 'power3.inOut'
                    });
                } else {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// ========================================
// Parallax Effects
// ========================================

function initParallax() {
    // Updated to be subtle and not conflict with fades
    gsap.to('.hero-main-title', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        },
        y: -100,
        ease: 'none'
    });

    gsap.to('.hero-info-grid', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        },
        y: -50,
        ease: 'none'
    });
}

function initMagneticButtons() {
    const magneticElements = document.querySelectorAll('.btn');

    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(el, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
}

// Touch / no-hover devices: skip mouse-only effects entirely
const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

function initMobileMenu() {
    const burger = document.getElementById('navBurger');
    const navLinks = document.querySelector('.nav-links');
    if (!burger || !navLinks) return;

    const close = () => {
        navLinks.classList.remove('open');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
    };

    burger.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        burger.classList.toggle('active', open);
        burger.setAttribute('aria-expanded', String(open));
    });

    // Close after choosing a destination
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', close);
    });

    // Close when tapping outside the nav
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('open') && !e.target.closest('.main-nav')) {
            close();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    new MatrixRain();
    window.__particleSystem = new ParticleSystem();
    if (!isTouchDevice) {
        new CustomCursor();
    }
    initMobileMenu();

    window.addEventListener('scroll', () => {
        updateScrollProgress();
        updateActiveNav();
    });

    initSmoothScroll();
    initParallax();
    if (!isTouchDevice) {
        initMagneticButtons();
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            gsap.to('.scroll-indicator', {
                opacity: 0,
                duration: 0.3
            });
        }
    });
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

window.addEventListener('resize', debounce(() => {
    ScrollTrigger.refresh();
}, 250));

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.config({
        nullTargetWarn: false,
        force3D: false
    });

    const canvas = document.getElementById('particles-canvas');
    if (canvas) canvas.style.display = 'none';
}

// ========================================
// Language Toggle System
// ========================================

let currentLang = 'en';

function ensureZpixFont() {
    if (document.getElementById('zpix-font')) return;
    const l = document.createElement('link');
    l.id = 'zpix-font'; l.rel = 'stylesheet';
    l.href = 'https://cdn.jsdelivr.net/npm/zpix-pixel-font@3.1.9/dist/zpix.css';
    document.head.appendChild(l);
}

function switchLanguage(lang) {
    if (lang === 'zh') ensureZpixFont();
    currentLang = lang;

    // Toggle body class for language-specific styling (e.g., Chinese pixel font)
    if (lang === 'zh') {
        document.body.classList.add('lang-zh');
        document.body.classList.remove('lang-en');
    } else {
        document.body.classList.add('lang-en');
        document.body.classList.remove('lang-zh');
    }

    document.querySelectorAll('[data-en][data-zh]').forEach(el => {
        const text = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-zh');

        // Title lines (hero) and info-content carry HTML markup (emphasis spans, <br>) inside data-* attrs.
        if (el.classList.contains('title-line-1') || el.classList.contains('title-line-2') || el.classList.contains('info-content')) {
            el.innerHTML = text;
            el.style.opacity = '1';
            // Re-activate emphasis highlights (decode animation adds these on completion)
            el.querySelectorAll('.emphasis-text').forEach((em, i) => {
                setTimeout(() => em.classList.add('active'), i * 80);
            });
            const heroTitle = document.querySelector('.hero-main-title');
            if (heroTitle) heroTitle.classList.add('loaded');
        } else if (el.classList.contains('about-line')) {
            // About lines contain keyword spans — leave them, the parent <p>'s data-* drives the visible text.
            const keyword = el.querySelector('.keyword');
            if (!keyword) {
                el.textContent = text;
            }
        } else {
            el.textContent = text;
        }
    });

    document.querySelectorAll('.lang-option').forEach(opt => {
        if (opt.getAttribute('data-lang') === lang) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
    localStorage.setItem('preferredLang', lang);
}

// ========================================
// Keyword Scramble/Decode Effect
// ========================================

class TextScramble {
    constructor(element) {
        this.element = element;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.element.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];

        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;

        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];

            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span style="opacity:0.5">${char}</span>`;
            } else {
                output += from;
            }
        }

        this.element.innerHTML = output;

        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }

    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        switchLanguage(savedLang);
        langToggle.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', () => {
                const lang = option.getAttribute('data-lang');
                switchLanguage(lang);
            });
        });
    }

});

// ========================================
// AI Chatbot — talks to Cloudflare Worker (Anthropic proxy)
// ========================================

// 👇 After deploying the worker, paste its URL here
//    (e.g. https://aiden-portfolio-ai.your-name.workers.dev)
const CHATBOT_WORKER_URL = 'https://ai.aidenyang.me';

class AIChatbot {
    constructor() {
        this.history = [];
        this.busy = false;
        this.sessionId = this.getOrCreateSessionId();
        this.initUI();
    }

    getOrCreateSessionId() {
        try {
            let id = sessionStorage.getItem('aiden-chat-session');
            if (!id) {
                id = (crypto.randomUUID && crypto.randomUUID()) ||
                     `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
                sessionStorage.setItem('aiden-chat-session', id);
            }
            return id;
        } catch (e) {
            return `s_${Date.now().toString(36)}`;
        }
    }

    getLang() {
        const active = document.querySelector('.lang-option.active');
        return active && active.dataset.lang === 'zh' ? 'zh' : 'en';
    }

    t(key) {
        const strings = {
            en: {
                label: 'Chat with AI Aiden',
                title: 'AI Aiden',
                greet: "Hey, I'm Aiden 👋 Ask me anything about my work, my skills, or what I'm into.",
                placeholder: 'Ask me anything…',
                send: 'Send',
                error: 'Sorry, something went wrong. Please try again.',
                misconfigured: 'Chat is not configured yet. Set CHATBOT_WORKER_URL in script.js.',
            },
            zh: {
                label: '和 AI Aiden 聊聊',
                title: 'AI Aiden',
                greet: '嗨，我是 Aiden 👋 想了解我的项目、技能，或者随便聊聊都可以。',
                placeholder: '随便问问吧…',
                send: '发送',
                error: '抱歉，出错了。请重试。',
                misconfigured: '聊天功能还没配置。请在 script.js 里设置 worker URL。',
            },
        };
        return strings[this.getLang()][key];
    }

    initUI() {
        const chatbotHTML = `
    <div class="chatbot-container" id="chatbot">
        <button class="chatbot-toggle" id="chatbot-toggle">
            <span class="chatbot-label" data-en="Chat with AI Aiden" data-zh="和 AI Aiden 聊聊">Chat with AI Aiden</span>
        </button>
        <div class="chatbot-window" id="chatbot-window">
            <div class="chatbot-header">
                <h3>AI Aiden</h3>
                <button class="chatbot-close" id="chatbot-close">×</button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages"></div>
            <div class="chatbot-input-area">
                <input type="text" id="chatbot-input" placeholder="Ask me anything..." data-en="Ask anything about Aiden's work…" data-zh="随便问问 Aiden 的作品集…">
                <button id="chatbot-send" data-en="Send" data-zh="发送">Send</button>
            </div>
        </div>
    </div>
`;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        this.attachEvents();
        this.renderGreeting();
    }

    renderGreeting() {
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.innerHTML = '';
        this.addMessage(this.t('greet'), 'bot', { skipHistory: true });
    }

    attachEvents() {
        const toggle = document.getElementById('chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const win = document.getElementById('chatbot-window');
        const input = document.getElementById('chatbot-input');
        const send = document.getElementById('chatbot-send');

        toggle.addEventListener('click', () => {
            win.classList.toggle('active');
            if (win.classList.contains('active')) {
                setTimeout(() => input.focus(), 200);
            }
        });

        close.addEventListener('click', () => {
            win.classList.remove('active');
        });

        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                setTimeout(() => {
                    if (this.history.length === 0) this.renderGreeting();
                }, 50);
            });
        }
    }

    async sendMessage() {
        if (this.busy) return;
        const input = document.getElementById('chatbot-input');
        const send = document.getElementById('chatbot-send');
        const message = input.value.trim();
        if (!message) return;

        this.busy = true;
        input.disabled = true;
        send.disabled = true;
        this.addMessage(message, 'user');
        input.value = '';

        const thinking = this.addThinking();

        try {
            if (!CHATBOT_WORKER_URL || CHATBOT_WORKER_URL.includes('REPLACE_WITH')) {
                thinking.remove();
                this.addMessage(this.t('misconfigured'), 'bot', { skipHistory: true });
                return;
            }
            const res = await fetch(CHATBOT_WORKER_URL, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ messages: this.history, session_id: this.sessionId }),
            });
            thinking.remove();
            if (!res.ok) {
                this.addMessage(this.t('error'), 'bot', { skipHistory: true });
                return;
            }
            const data = await res.json();
            const reply = (data.reply || '').trim();
            this.addMessage(reply || this.t('error'), 'bot');
        } catch (e) {
            thinking.remove();
            this.addMessage(this.t('error'), 'bot', { skipHistory: true });
        } finally {
            this.busy = false;
            input.disabled = false;
            send.disabled = false;
            input.focus();
        }
    }

    stripMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/__(.+?)__/g, '$1')
            .replace(/_(.+?)_/g, '$1')
            .replace(/`(.+?)`/g, '$1')
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    addMessage(text, sender, opts = {}) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}-message`;
        const p = document.createElement('p');
        const clean = sender === 'bot' ? this.stripMarkdown(text) : text;
        p.textContent = clean;
        p.style.whiteSpace = 'pre-wrap';
        messageDiv.appendChild(p);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        if (!opts.skipHistory) {
            this.history.push({ role: sender === 'user' ? 'user' : 'assistant', content: clean });
        }
        return messageDiv;
    }

    addThinking() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const div = document.createElement('div');
        div.className = 'chatbot-message bot-message chatbot-thinking';
        div.innerHTML = '<p><span></span><span></span><span></span></p>';
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return div;
    }
}

const chatbot = new AIChatbot();

// ========================================
// Status Loader - Load availability status
// ========================================
async function loadAvailabilityStatus() {
    try {
        // 首先尝试从 localStorage 读取（后台管理设置的）
        const localStatus = localStorage.getItem('portfolioStatus');
        let statusData;

        if (localStatus) {
            statusData = JSON.parse(localStatus);
        } else {
            // 如果没有 localStorage，则从 status.json 读取
            const response = await fetch('/status.json');
            statusData = await response.json();
        }

        // 更新状态点的样式
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');

        if (statusDot && statusText && statusData) {
            // 移除所有状态类
            statusDot.classList.remove('available', 'busy', 'vacation');
            // 添加当前状态类
            statusDot.classList.add(statusData.status);

            // 更新文本内容
            const currentLang = document.documentElement.lang || 'en';
            const textContent = currentLang === 'zh' ? statusData.statusText.zh : statusData.statusText.en;
            statusText.textContent = textContent;

            // 更新 data 属性以支持语言切换
            statusText.setAttribute('data-en', statusData.statusText.en);
            statusText.setAttribute('data-zh', statusData.statusText.zh);
        }
    } catch (error) {
        console.log('Status loading info:', error);
        // 如果加载失败，保持默认状态
    }
}

// 页面加载时读取状态
loadAvailabilityStatus();

// 监听 storage 事件，当其他页面（如后台）修改状态时自动更新
window.addEventListener('storage', function(e) {
    if (e.key === 'portfolioStatus') {
        loadAvailabilityStatus();
    }
});
