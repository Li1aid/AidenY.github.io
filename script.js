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
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 8000);

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

            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 70%, ${particle.opacity * pulse})`);
            gradient.addColorStop(0.5, `hsla(${particle.hue}, 60%, 60%, ${particle.opacity * pulse * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * pulse, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.particles.forEach((otherParticle, j) => {
                if (i >= j) return;

                const dx2 = particle.x - otherParticle.x;
                const dy2 = particle.y - otherParticle.y;
                const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                if (distance2 < 150) {
                    const opacity = 0.3 * (1 - distance2 / 150);
                    const avgHue = (particle.hue + otherParticle.hue) / 2;

                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `hsla(${avgHue}, 60%, 60%, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.stroke();
                }
            });
        });

        requestAnimationFrame(() => this.animate());
    }
}

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
    const loaderProgress = document.querySelector('.loader-progress');
    const loaderPercent = document.querySelector('.loader-percent');
    const loader = document.querySelector('.loader');

    if (!loaderProgress || !loaderPercent || !loader) return;

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;

        loaderProgress.style.width = progress + '%';
        loaderPercent.textContent = Math.floor(progress) + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                gsap.to(loader, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                        loader.style.display = 'none';
                        initAnimations();
                    }
                });
            }, 500);
        }
    }, 100);
}

// ========================================
// Main Animations with GSAP
// ========================================

function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to('.main-nav', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });

    // Pixel-style digital decode animation
    const titleLine1 = document.querySelector('.title-line-1');
    const titleLine2 = document.querySelector('.title-line-2');
    const heroTitle = document.querySelector('.hero-main-title');

    if (titleLine1 && titleLine2 && heroTitle) {
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
                gsap.to(window, {
                    duration: 1.5,
                    scrollTo: {
                        y: target,
                        offsetY: 0
                    },
                    ease: 'power3.inOut'
                });
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

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    new MatrixRain();
    new ParticleSystem();
    new CustomCursor();

    window.addEventListener('scroll', () => {
        updateScrollProgress();
        updateActiveNav();
    });

    initSmoothScroll();
    initParallax();
    initMagneticButtons();

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

function switchLanguage(lang) {
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

        // Special handling for elements with children (like emphasis-text)
        if (el.classList.contains('emphasis-text')) {
            el.textContent = text;
        } else if (el.classList.contains('info-content') || el.classList.contains('title-line-2')) {
            // These may contain HTML tags like <br> or nested <span>
            // We need to update only text nodes, not replace entire innerHTML
            if (!el.querySelector('.emphasis-text')) {
                el.innerHTML = text;
            }
        } else if (el.classList.contains('about-line')) {
            // About lines contain keyword spans - handle carefully
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
// AI Chatbot
// ========================================

class AIChatbot {
    constructor() {
        this.initUI();
    }

    initUI() {
        const chatbotHTML = `
    <div class="chatbot-container" id="chatbot">
        <button class="chatbot-toggle" id="chatbot-toggle">
            <span class="chatbot-label">Chat with AI Aiden</span>
        </button>
        <div class="chatbot-window" id="chatbot-window">
            <div class="chatbot-header">
                <h3>AI Aiden</h3>
                <button class="chatbot-close" id="chatbot-close">×</button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chatbot-message bot-message">
                    <p data-en="Hi! I'm AI Aiden. Ask me about my work, skills, or experience!" data-zh="你好！我是 AI Aiden。问我关于作品、技能或经历的问题吧！">Hi! I'm AI Aiden. Ask me about my work, skills, or experience!</p>
                </div>
            </div>
            <div class="chatbot-input-area">
                <input type="text" id="chatbot-input" placeholder="Ask me anything..." data-en="Ask me anything..." data-zh="问我任何问题...">
                <button id="chatbot-send">Send</button>
            </div>
            <div class="chatbot-api-notice">
                <small data-en="Note: Gemini API integration pending" data-zh="注意：Gemini API 集成待定">Note: Gemini API integration pending</small>
            </div>
        </div>
    </div>
`;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        this.attachEvents();
    }

    attachEvents() {
        const toggle = document.getElementById('chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const window = document.getElementById('chatbot-window');
        const input = document.getElementById('chatbot-input');
        const send = document.getElementById('chatbot-send');

        toggle.addEventListener('click', () => {
            window.classList.toggle('active');
        });

        close.addEventListener('click', () => {
            window.classList.remove('active');
        });

        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';

        setTimeout(() => {
             this.addMessage('This is a demo. API integration would happen here.', 'bot');
        }, 1000);
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}-message`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
            const response = await fetch('status.json');
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
