/* ========================================
   Modern Portfolio JavaScript
   Advanced Animations & Interactions
   ======================================== */

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
        // Increased particle count for more dynamic effect
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 8000);

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 1.5, // Increased speed
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 2.5 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                hue: Math.random() * 60 + 180, // Blue-cyan range
                wobble: Math.random() * Math.PI * 2
            });
        }
    }

    createShootingStar() {
        if (Math.random() < 0.01) { // 1% chance per frame
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

        // Create shooting stars occasionally
        this.createShootingStar();

        // Animate shooting stars
        this.shootingStars.forEach((star, index) => {
            star.x += star.vx;
            star.y += star.vy;
            star.life -= star.decay;

            if (star.life <= 0) {
                this.shootingStars.splice(index, 1);
                return;
            }

            // Draw shooting star with trail
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

        // Animate particles
        this.particles.forEach((particle, i) => {
            // Update wobble for organic movement
            particle.wobble += 0.02;

            // Update position with wobble
            particle.x += particle.vx + Math.sin(particle.wobble) * 0.3;
            particle.y += particle.vy + Math.cos(particle.wobble) * 0.3;

            // Mouse interaction - ripple effect
            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200) {
                const force = (200 - distance) / 200;
                const angle = Math.atan2(dy, dx);
                particle.x -= Math.cos(angle) * force * 3;
                particle.y -= Math.sin(angle) * force * 3;

                // Increase opacity near mouse
                particle.opacity = Math.min(1, particle.opacity + force * 0.3);
            } else {
                // Gradually return to normal opacity
                particle.opacity = Math.max(0.2, particle.opacity - 0.01);
            }

            // Boundary check with wrap around
            if (particle.x < -10) particle.x = this.canvas.width + 10;
            if (particle.x > this.canvas.width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = this.canvas.height + 10;
            if (particle.y > this.canvas.height + 10) particle.y = -10;

            // Pulsating effect
            const pulse = Math.sin(this.time + i * 0.1) * 0.3 + 0.7;

            // Draw particle with gradient color
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

            // Draw connections with dynamic opacity
            this.particles.forEach((otherParticle, j) => {
                if (i >= j) return; // Avoid duplicate connections

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
            gsap.to(this.cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.3,
                ease: 'power2.out'
            });

            gsap.to(this.cursorDot, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1
            });
        });

        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .project-card, .info-card, .tool-card, .contact-method');

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
        const sectionHeight = section.offsetHeight;

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

    // Navigation animation
    gsap.to('.main-nav', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });

    // Hero label animation
    gsap.to('.hero-label', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out'
    });

    // Hero title animation - line by line
    gsap.to('.title-line-1', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.4,
        ease: 'power3.out'
    });

    gsap.to('.title-line-2', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.8,
        ease: 'power3.out'
    });

    // Hero info grid animation - appear with title
    gsap.to('.hero-info-grid', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.9,
        ease: 'power3.out'
    });

    // Individual info columns appear together with title
    gsap.to('.info-column', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.9,
        ease: 'power3.out'
    });

    // Scroll indicator animation
    gsap.to('.scroll-indicator', {
        opacity: 0.6,
        duration: 1,
        delay: 2,
        ease: 'power2.out'
    });

    // Section animations on scroll
    animateSections();
    animateAbout();
    animateProjectCards();
    animateTimeline();
    animateSkillBars();
    initCounters();
}

// ========================================
// Section Scroll Animations
// ========================================

function animateSections() {
    // Section labels
    gsap.utils.toArray('.section-label').forEach(label => {
        gsap.to(label, {
            scrollTrigger: {
                trigger: label,
                start: 'top 80%',
                once: true
            },
            opacity: 1,
            x: 0,
            duration: 1,
            ease: 'power3.out'
        });
    });

    // Section titles
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.to(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 80%',
                once: true
            },
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.2,
            ease: 'power3.out'
        });
    });

    // Section descriptions
    gsap.utils.toArray('.section-description').forEach(desc => {
        gsap.to(desc, {
            scrollTrigger: {
                trigger: desc,
                start: 'top 80%',
                once: true
            },
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.3,
            ease: 'power3.out'
        });
    });

    // About section
    gsap.to('.about-text', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 60%',
            once: true
        },
        opacity: 1,
        x: 0,
        duration: 1.2,
        ease: 'power3.out'
    });

    gsap.to('.about-visual', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 60%',
            once: true
        },
        opacity: 1,
        x: 0,
        duration: 1.2,
        delay: 0.3,
        ease: 'power3.out'
    });

    // Contact methods
    gsap.utils.toArray('.contact-method').forEach((method, i) => {
        gsap.to(method, {
            scrollTrigger: {
                trigger: method,
                start: 'top 80%',
                once: true
            },
            opacity: 1,
            y: 0,
            duration: 1,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });

    // Contact CTA
    gsap.to('.contact-cta', {
        scrollTrigger: {
            trigger: '.contact-cta',
            start: 'top 80%',
            once: true
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });
}

// ========================================
// Project Cards Animation
// ========================================

function animateProjectCards() {
    // Animate all project cards together
    gsap.to('.project-card', {
        scrollTrigger: {
            trigger: '.projects-grid',
            start: 'top 80%',
            once: true
        },
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power3.out'
    });
}

// ========================================
// About Section Animation
// ========================================

function animateAbout() {
    // About text animation
    gsap.to('.about-text', {
        scrollTrigger: {
            trigger: '.about-text',
            start: 'top 80%',
            once: true
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });

    // Timeline title animation
    gsap.to('.timeline-title', {
        scrollTrigger: {
            trigger: '.timeline-title',
            start: 'top 80%',
            once: true
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });

    // Timeline items animation
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
        gsap.to(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                once: true
            },
            opacity: 1,
            x: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power3.out'
        });
    });
}

// ========================================
// Timeline Animation (Legacy)
// ========================================

function animateTimeline() {
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
        gsap.to(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 80%',
                once: true
            },
            opacity: 1,
            x: 0,
            duration: 1,
            delay: i * 0.15,
            ease: 'power3.out'
        });
    });
}

// ========================================
// Skill Bars Animation
// ========================================

function animateSkillBars() {
    // Skill category boxes with stagger
    gsap.utils.toArray('.skill-category-box').forEach((box, i) => {
        gsap.to(box, {
            scrollTrigger: {
                trigger: box,
                start: 'top 80%',
                once: true
            },
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'back.out(1.2)'
        });

        // Animate keyword items within each box
        const keywords = box.querySelectorAll('.keyword-item');
        keywords.forEach((keyword, j) => {
            gsap.to(keyword, {
                scrollTrigger: {
                    trigger: keyword,
                    start: 'top 85%',
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

    // Skill categories
    gsap.utils.toArray('.skill-category').forEach((category, i) => {
        gsap.to(category, {
            scrollTrigger: {
                trigger: category,
                start: 'top 75%',
                once: true
            },
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out'
        });

        // Animate skill bars within each category
        const skillBars = category.querySelectorAll('.skill-bar-item');
        skillBars.forEach((bar, j) => {
            gsap.to(bar, {
                scrollTrigger: {
                    trigger: bar,
                    start: 'top 85%',
                    once: true
                },
                opacity: 1,
                x: 0,
                duration: 0.8,
                delay: j * 0.1,
                ease: 'power3.out',
                onComplete: () => {
                    const fill = bar.querySelector('.skill-bar-fill');
                    const percent = fill.getAttribute('data-percent');
                    gsap.to(fill, {
                        width: percent + '%',
                        duration: 1.5,
                        ease: 'power3.out'
                    });
                }
            });
        });
    });

    // Tools section
    gsap.to('.tools-section', {
        scrollTrigger: {
            trigger: '.tools-section',
            start: 'top 75%',
            once: true
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });
}

// ========================================
// Number Counter Animation
// ========================================

function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));

        ScrollTrigger.create({
            trigger: counter,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.to(counter, {
                    textContent: target,
                    duration: 2,
                    snap: { textContent: 1 },
                    ease: 'power2.out',
                    onUpdate: function() {
                        counter.textContent = Math.ceil(this.targets()[0].textContent);
                    }
                });
            }
        });
    });
}

// ========================================
// Circular Progress Animation
// ========================================

function animateCircularProgress() {
    const progressCircles = document.querySelectorAll('.progress-fill');

    progressCircles.forEach(circle => {
        const percent = parseInt(circle.getAttribute('data-percent'));
        const circumference = 2 * Math.PI * 45; // r = 45
        const offset = circumference - (percent / 100) * circumference;

        ScrollTrigger.create({
            trigger: circle,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.to(circle, {
                    strokeDashoffset: offset,
                    duration: 2,
                    ease: 'power3.out'
                });
            }
        });
    });
}

// ========================================
// Smooth Scroll for Navigation
// ========================================

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
                        offsetY: 100
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
    // Hero parallax
    gsap.to('.hero-main-title', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5
        },
        y: -100,
        opacity: 0.3,
        ease: 'none'
    });

    gsap.to('.hero-info-grid', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5
        },
        y: -50,
        opacity: 0.5,
        ease: 'none'
    });

    // Floating animation for sections
    gsap.utils.toArray('section:not(.hero)').forEach((section, i) => {
        // Subtle floating effect
        gsap.to(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 2
            },
            y: -30,
            ease: 'none'
        });
    });

    // Project cards parallax
    gsap.utils.toArray('.project-card').forEach((card, i) => {
        gsap.to(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            },
            y: -20,
            ease: 'none'
        });
    });
}

// ========================================
// Magnetic Button Effect
// ========================================

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

// ========================================
// SVG Gradient Definition for Circular Progress
// ========================================

function createSVGGradient() {
    const progressSVGs = document.querySelectorAll('.circular-progress');

    progressSVGs.forEach(svg => {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'gradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('style', 'stop-color:#a366ff;stop-opacity:1');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('style', 'stop-color:#00d9ff;stop-opacity:1');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.insertBefore(defs, svg.firstChild);
    });
}

// ========================================
// Initialize All Features
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Start loader
    initLoader();

    // Initialize features
    new ParticleSystem();
    new CustomCursor();

    // Scroll events
    window.addEventListener('scroll', () => {
        updateScrollProgress();
        updateActiveNav();
    });

    // Smooth scrolling
    initSmoothScroll();

    // Parallax effects
    initParallax();

    // Magnetic buttons
    initMagneticButtons();

    // SVG gradients
    createSVGGradient();

    // Circular progress
    animateCircularProgress();

    // Hide scroll indicator on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            gsap.to('.scroll-indicator', {
                opacity: 0,
                duration: 0.3
            });
        }
    });
});

// ========================================
// Performance Optimization
// ========================================

// Debounce function for resize events
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

// Optimized resize handler
window.addEventListener('resize', debounce(() => {
    ScrollTrigger.refresh();
}, 250));

// Reduce motion for accessibility
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.config({
        nullTargetWarn: false,
        force3D: false
    });

    // Disable particle system
    const canvas = document.getElementById('particles-canvas');
    if (canvas) canvas.style.display = 'none';
}

// ========================================
// Language Toggle System
// ========================================

let currentLang = 'en';

function switchLanguage(lang) {
    currentLang = lang;

    // Update all elements with data-en and data-zh attributes
    document.querySelectorAll('[data-en][data-zh]').forEach(el => {
        const text = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-zh');
        el.textContent = text;
    });

    // Update lang toggle button states
    document.querySelectorAll('.lang-option').forEach(opt => {
        if (opt.getAttribute('data-lang') === lang) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    // Store preference
    localStorage.setItem('preferredLang', lang);
}

// Initialize language toggle
document.addEventListener('DOMContentLoaded', () => {
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        // Load saved preference
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        switchLanguage(savedLang);

        // Add click listeners
        langToggle.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', () => {
                const lang = option.getAttribute('data-lang');
                switchLanguage(lang);
            });
        });
    }
});

// ========================================
// AI Chatbot (Gemini API)
// ========================================

class AIChatbot {
    constructor() {
        this.apiKey = ''; // Will be set by user
        this.conversationHistory = [];
        this.knowledgeBase = {
            about: "Aiden Yang is a multidisciplinary designer and creative technologist studying Interaction Design at the University of Sydney.",
            experience: "Built a 200K-follower Weibo meme account, worked as Social Media Strategist at Camera360.",
            projects: {
                colab: "A speculative learning platform for international design students",
                vividSydney: "Vision Pro-based remote participation platform for Vivid Sydney",
                anno: "Companion-based smart health system for older adults",
                whisperfield: "ADHD-focused immersive meditation experience"
            },
            skills: "AIGC (Vibecoding, Web Creation, Video Production), UI/UX (Figma, Prototyping, User Research), Social Media (Content Strategy, Meme Culture)"
        };
        this.initUI();
    }

    initUI() {
        // Create chatbot HTML
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

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Simulate AI response (replace with Gemini API call)
        this.addMessage('Gemini API integration coming soon! For now, check out my portfolio sections above.', 'bot');
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

// Initialize chatbot
const chatbot = new AIChatbot();

// Console Easter Egg
console.log('%cAiden Yang Portfolio', 'font-size: 24px; font-weight: bold; color: #ffffff;');
console.log('%cBuilt with GSAP, vanilla JS, and lots of coffee ☕', 'font-size: 14px; color: #888;');
console.log('%cInterested in working together? Reach out!', 'font-size: 14px; color: #ffffff;');
