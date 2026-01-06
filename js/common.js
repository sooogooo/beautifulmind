/**
 * 美丽的心灵地图 - 公共脚本
 * Common JavaScript shared across all pages
 */

(function() {
    'use strict';

    // ==================== Header Scroll Effect ====================
    const header = document.querySelector('.header');
    let lastScroll = 0;
    let ticking = false;

    function updateHeader() {
        const currentScroll = window.pageYOffset;

        // Add scrolled class when scrolling down
        if (currentScroll > 10) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }

        // Shrink header when scrolling past threshold
        if (currentScroll > 100) {
            header?.classList.add('shrink');
        } else {
            header?.classList.remove('shrink');
        }

        lastScroll = currentScroll;
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });

    // ==================== Mobile Menu ====================
    window.toggleMobileMenu = function() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('active');
        }
    };

    window.closeMobileMenu = function() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
        }
    };

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        const mobileMenu = document.getElementById('mobileMenu');
        const menuBtn = document.querySelector('.menu-btn');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            if (!mobileMenu.contains(e.target) && !menuBtn?.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });

    // ==================== About Modal ====================
    window.openAbout = function() {
        const overlay = document.getElementById('aboutOverlay');
        const modal = document.getElementById('aboutModal');
        if (overlay && modal) {
            overlay.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeAbout = function() {
        const overlay = document.getElementById('aboutOverlay');
        const modal = document.getElementById('aboutModal');
        if (overlay && modal) {
            overlay.classList.remove('active');
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // ==================== Keyboard Shortcuts ====================
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAbout();
            closeMobileMenu();
        }
    });

    // ==================== Scroll Animation (IntersectionObserver) ====================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const animateOnScroll = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with data-animate attribute
    document.querySelectorAll('[data-animate]').forEach(function(el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        animateOnScroll.observe(el);
    });

    // ==================== Smooth Scroll for Anchor Links ====================
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                const headerHeight = header?.offsetHeight || 60;
                const targetPosition = targetEl.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                closeMobileMenu();
            }
        });
    });

    // ==================== Lazy Loading Images ====================
    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading supported
        document.querySelectorAll('img[data-src]').forEach(function(img) {
            img.src = img.dataset.src;
            img.loading = 'lazy';
        });
    } else {
        // Fallback for older browsers
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(function(img) {
            imageObserver.observe(img);
        });
    }

    // ==================== Button Ripple Effect ====================
    document.querySelectorAll('.btn, .header-btn, .chapter-card').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-effect 0.6s ease-out;
                pointer-events: none;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(function() {
                ripple.remove();
            }, 600);
        });
    });

    // Add ripple animation keyframes
    if (!document.getElementById('ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple-effect {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ==================== Console Branding ====================
    console.log(
        '%c美丽的心灵地图%c\n医美消费心理学 · 理性变美指南',
        'color: #9B8AA6; font-size: 20px; font-weight: bold;',
        'color: #737373; font-size: 12px;'
    );

})();
