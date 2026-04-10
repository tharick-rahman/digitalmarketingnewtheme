document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    initLoader();
    initSPA();
    initMobileMenu();
    initScrollAnimations();
    initSpecificPageLogic();
}

// Stackly-style loader
function initLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hide-loader');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 800);
        }, 800); // minimum load time feel
    }
}

// SPA Navigation
function initSPA() {
    document.body.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith(window.location.origin) && !link.hash) {
            e.preventDefault();
            const targetUrl = link.href;
            navigateTo(targetUrl);
        }
    });

    window.addEventListener('popstate', () => {
        navigateTo(window.location.href, false);
    });
}

async function navigateTo(url, pushState = true) {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = 'flex';
        // wait a tiny bit for display to register before animating
        await new Promise(r => setTimeout(r, 10));
        loader.classList.remove('hide-loader');
    }

    try {
        const response = await fetch(url);
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Replace head elements except script.js
        document.title = doc.title;
        const newCSS = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
        const oldCSS = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        
        newCSS.forEach(newLink => {
            const hrefAttr = newLink.getAttribute('href');
            if (!oldCSS.some(oldLink => oldLink.getAttribute('href') === hrefAttr)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = hrefAttr;
                document.head.appendChild(link);
            }
        });
        oldCSS.forEach(oldLink => {
            const hrefAttr = oldLink.getAttribute('href');
            if (!newCSS.some(newLink => newLink.getAttribute('href') === hrefAttr)) {
                oldLink.remove();
            }
        });

        // Replace body content cleanly while preserving the global loader and scripts
        Array.from(document.body.children).forEach(child => {
            // Keep the global loader (since it's currently showing the animation) and script tags
            if (child.id !== 'global-loader' && child.tagName !== 'SCRIPT') {
                child.remove();
            }
        });

        Array.from(doc.body.children).forEach(child => {
            if (child.id !== 'global-loader' && child.tagName !== 'SCRIPT') {
                document.body.appendChild(child.cloneNode(true));
            }
        });

        if (pushState) {
            window.history.pushState({}, '', url);
        }

        // Re-init scripts for new content
        initScrollAnimations();
        initSpecificPageLogic();
        window.scrollTo(0,0);
        
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hide-loader');
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 800);
            }, 500);
        }

    } catch (e) {
        console.error("Navigation error", e);
        window.location.assign(url); // fallback
    }
}

// Mobile Menu
function initMobileMenu() {
    document.body.addEventListener('click', e => {
        if(e.target.closest('.hamburger')) {
            const menu = document.querySelector('.nav-links');
            const hamburger = e.target.closest('.hamburger');
            menu.classList.toggle('active');
            hamburger.classList.toggle('active');
        }
    });
}

// Scroll Animations
function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll, .stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scrolled');
                // stats counter
                if(entry.target.classList.contains('stat-number') && !entry.target.dataset.counted) {
                    animateValue(entry.target, 0, parseInt(entry.target.dataset.target), 2000);
                    entry.target.dataset.counted = "true";
                }
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => {
        observer.observe(el);
    });
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start) + (obj.dataset.suffix || "");
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Page Specific Logic
function initSpecificPageLogic() {
    // Auth Forms
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            
            if(email && password) {
                localStorage.setItem('currentUserRole', role);
                navigateTo('dashboard.html');
            }
        });
    }

    // Dashboard features
    const userDash = document.getElementById('user-dashboard');
    const adminDash = document.getElementById('admin-dashboard');
    if(userDash && adminDash) {
        const role = localStorage.getItem('currentUserRole') || 'User';
        if(role === 'Admin') {
            adminDash.style.display = 'block';
            userDash.style.display = 'none';
        } else {
            adminDash.style.display = 'none';
            userDash.style.display = 'block';
        }
    }

    // Blog logic
    const searchInput = document.getElementById('blog-search');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const posts = document.querySelectorAll('.blog-card');
            posts.forEach(post => {
                const title = post.querySelector('h3').textContent.toLowerCase();
                post.style.display = title.includes(query) ? 'block' : 'none';
            });
        });
    }
}
