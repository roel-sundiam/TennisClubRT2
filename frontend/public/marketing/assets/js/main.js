// Tennis Club RT2 Marketing Site - JavaScript Functionality

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeFAQ();
    initializeSmoothScroll();
    initializeAnimations();
    initializeFormHandling();
    
    console.log('🎾 Tennis Club RT2 Marketing Site Initialized');
});

// Navigation Functions
function initializeNavigation() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const navLinks = document.querySelectorAll('.mobile-nav a');
    
    // Mobile menu toggle
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            
            // Animate hamburger menu
            const spans = mobileMenuToggle.querySelectorAll('span');
            if (mobileNav.classList.contains('active')) {
                spans[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close mobile nav when clicking on links
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                
                // Reset hamburger menu
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
        
        // Close mobile nav when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mobileNav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                
                // Reset hamburger menu
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
    
    // Navbar scroll effect
    let lastScrollTop = 0;
    const navbar = document.querySelector('.modern-nav');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        // Add background blur on scroll
        if (scrollTop > 50) {
            navbar.style.backdropFilter = 'blur(20px)';
            navbar.style.background = 'linear-gradient(135deg, rgba(30, 64, 175, 0.95) 0%, rgba(59, 130, 246, 0.95) 50%, rgba(37, 99, 235, 0.95) 100%)';
        } else {
            navbar.style.backdropFilter = 'blur(20px)';
            navbar.style.background = 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #2563eb 100%)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// FAQ Accordion Functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        if (otherAnswer) {
                            otherAnswer.style.maxHeight = '0';
                        }
                    }
                });
                
                // Toggle current item
                if (isActive) {
                    item.classList.remove('active');
                    answer.style.maxHeight = '0';
                } else {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
            
            // Make FAQ accessible with keyboard
            question.setAttribute('tabindex', '0');
            question.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    question.click();
                }
            });
        }
    });
}

// Smooth Scroll for Anchor Links
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Intersection Observer for Animations
function initializeAnimations() {
    // Create intersection observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .step-card, .comparison-card, .hero-visual');
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .feature-card, .step-card, .comparison-card, .hero-visual {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .feature-card.animate-in, 
        .step-card.animate-in, 
        .comparison-card.animate-in,
        .hero-visual.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .feature-card:nth-child(2) { transition-delay: 0.1s; }
        .feature-card:nth-child(3) { transition-delay: 0.2s; }
        .feature-card:nth-child(4) { transition-delay: 0.3s; }
        .feature-card:nth-child(5) { transition-delay: 0.4s; }
        .feature-card:nth-child(6) { transition-delay: 0.5s; }
        
        .step-card:nth-child(2) { transition-delay: 0.2s; }
        .step-card:nth-child(3) { transition-delay: 0.4s; }
    `;
    document.head.appendChild(style);
}

// Form Handling (if needed for contact forms)
function initializeFormHandling() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('error');
                    
                    // Remove error class after user starts typing
                    input.addEventListener('input', function() {
                        this.classList.remove('error');
                    }, { once: true });
                }
            });
            
            if (isValid) {
                // Form is valid - you can add form submission logic here
                showNotification('Message sent successfully!', 'success');
                form.reset();
            } else {
                showNotification('Please fill in all required fields.', 'error');
            }
        });
    });
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add notification styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const notificationStyles = document.createElement('style');
        notificationStyles.id = 'notification-styles';
        notificationStyles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                min-width: 300px;
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification.success {
                border-left: 4px solid #4CAF50;
            }
            
            .notification.error {
                border-left: 4px solid #e53e3e;
            }
            
            .notification.info {
                border-left: 4px solid #3b82f6;
            }
            
            .notification-content {
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-message {
                flex: 1;
                color: #1a202c;
                font-weight: 500;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #718096;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s ease;
            }
            
            .notification-close:hover {
                background-color: rgba(113, 128, 150, 0.1);
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 768px) {
                .notification {
                    right: 10px;
                    left: 10px;
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(notificationStyles);
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Phone mockup interaction
function initializePhoneMockup() {
    const phoneMockup = document.querySelector('.phone-frame');
    
    if (phoneMockup) {
        // Add subtle rotation on mouse move
        document.addEventListener('mousemove', function(e) {
            const rect = phoneMockup.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            const rotateX = (mouseY / window.innerHeight) * 10;
            const rotateY = (mouseX / window.innerWidth) * -10;
            
            phoneMockup.style.transform = `
                rotateY(${-15 + rotateY}deg) 
                rotateX(${5 + rotateX}deg)
                scale(${phoneMockup.matches(':hover') ? 1.05 : 1})
            `;
        });
        
        // Reset on mouse leave
        phoneMockup.addEventListener('mouseleave', function() {
            phoneMockup.style.transform = 'rotateY(-15deg) rotateX(5deg) scale(1)';
        });
    }
}

// Initialize phone mockup when DOM is ready
document.addEventListener('DOMContentLoaded', initializePhoneMockup);

// Handle resize events
window.addEventListener('resize', function() {
    // Close mobile nav on resize to larger screen
    if (window.innerWidth > 1024) {
        const mobileNav = document.getElementById('mobileNav');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        
        if (mobileNav && mobileMenuToggle) {
            mobileNav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            
            // Reset hamburger menu
            const spans = mobileMenuToggle.querySelectorAll('span');
            spans.forEach(span => {
                span.style.transform = 'none';
                span.style.opacity = '1';
            });
        }
    }
});

// Performance optimization: Lazy load images when they come into view
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', initializeLazyLoading);

// Add CSS for form error states
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    input.error, textarea.error {
        border-color: #e53e3e !important;
        box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1) !important;
    }
`;
document.head.appendChild(errorStyles);