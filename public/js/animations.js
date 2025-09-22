// Animation Functions
const Animations = {
  // Initialize all animations
  init: () => {
    Animations.observeElements();
    Animations.initCountUp();
    Animations.initFloatingCards();
  },

  // Intersection Observer for fade-in animations
  observeElements: () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const delay = element.getAttribute('data-aos-delay') || 0;
          
          setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
          }, delay);
        }
      });
    }, observerOptions);

    // Observe elements with data-aos attribute
    const elementsToAnimate = document.querySelectorAll('[data-aos]');
    elementsToAnimate.forEach(element => {
      // Set initial state
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      
      observer.observe(element);
    });
  },

  // Count up animation for numbers
  initCountUp: () => {
    const counters = document.querySelectorAll('.stat-number, .result-number');
    
    const countUpObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          
          // Skip animation if data-no-animation="true"
          if (counter.getAttribute('data-no-animation') === 'true') {
            countUpObserver.unobserve(counter);
            return;
          }
          
          const target = counter.textContent.replace(/[^\d]/g, '');
          
          if (target) {
            Animations.animateCounter(counter, parseInt(target));
          }
          
          countUpObserver.unobserve(counter);
        }
      });
    });    
    counters.forEach(counter => {
      countUpObserver.observe(counter);
    });
  },

  // Animate counter from 0 to target
  animateCounter: (element, target) => {
    const originalText = element.textContent;
    const suffix = originalText.replace(/[\d]/g, '');
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target + suffix;
        clearInterval(timer);
      } else {
        element.textContent = Math.ceil(current) + suffix;
      }
    }, 20);
  },

  // Initialize floating cards animation
  initFloatingCards: () => {
    const floatingCards = document.querySelectorAll('.floating-card');
    
    floatingCards.forEach((card, index) => {
      const delay = card.getAttribute('data-delay') || index * 200;
      
      // Set initial state
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px) scale(0.9)';
      card.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Animate in
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
      }, delay);
    });
  },

  // Parallax effect for hero section
  initParallax: () => {
    const heroImage = document.querySelector('.hero-image');
    if (!heroImage) return;

    const parallaxEffect = Utils.throttle(() => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      heroImage.style.transform = `translateY(${rate}px)`;
    }, 10);

    window.addEventListener('scroll', parallaxEffect);
  }
};

// Export for use in other files
window.Animations = Animations;