// Main Application Functions
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  Navigation.init();
  Animations.init();
  Form.init();
  
  // AI 모달 초기화
  if (window.AIModal) {
    console.log('✅ AI 모달 시스템 초기화 완료');
    
    // AI 버튼 이벤트 추가
    const aiButtons = document.querySelectorAll('[onclick*="AIModal.open"]');
    aiButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        window.AIModal.open();
      });
    });
  } else {
    console.warn('⚠️ AI 모달 시스템 로드 실패');
  }
  
  // Smooth scrolling for anchor links
  initSmoothScrolling();
  
  // Header scroll effect
  initHeaderScroll();
});

// Navigation Module
const Navigation = {
  init: () => {
    // Mobile menu uses onclick method, so no addEventListener needed
    
    // Close menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        const navbarMenu = document.getElementById('navbar-menu');
        const hamburgerToggle = document.querySelector('.navbar-toggle');
        
        if (navbarMenu && navbarMenu.classList.contains('active')) {
          navbarMenu.classList.remove('active');
          navbarMenu.style.cssText = 'display: none !important;';
          
          // 햄버거 아이콘도 리셋
          if (hamburgerToggle) {
            Navigation.resetHamburger(hamburgerToggle);
          }
        }
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      const navbarMenu = document.getElementById('navbar-menu');
      const hamburgerToggle = document.querySelector('.navbar-toggle');
      
      if (!event.target.closest('.navbar') && navbarMenu && navbarMenu.classList.contains('active')) {
        navbarMenu.classList.remove('active');
        navbarMenu.style.cssText = 'display: none !important;';
        
        // 햄버거 아이콘도 리셋
        if (hamburgerToggle) {
          Navigation.resetHamburger(hamburgerToggle);
        }
      }
    });
  },
  
  toggleHamburger: (toggle) => {
    toggle.classList.toggle('active');
    const lines = toggle.querySelectorAll('.hamburger-line');
    if (toggle.classList.contains('active')) {
      lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      lines[1].style.opacity = '0';
      lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
      Navigation.resetHamburger(toggle);
    }
  },
  
  resetHamburger: (toggle) => {
    toggle.classList.remove('active');
    const lines = toggle.querySelectorAll('.hamburger-line');
    lines[0].style.transform = 'none';
    lines[1].style.opacity = '1';
    lines[2].style.transform = 'none';
  }
};
// Initialize EmailJS
const initEmailJS = () => {
  // EmailJS 초기화 (나중에 실제 PUBLIC KEY로 교체)
  emailjs.init('1ZRQKFLsVCCgMiE9t'); // 실제 설정 후 교체 필요
};

// Form Module
const Form = {
  init: () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', Form.handleSubmit);
    }
  },
  
  handleSubmit: (event) => {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Validate form
    if (!Form.validateForm(data)) {
      return;
    }
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = '전송 중...';
    submitButton.disabled = true;
    
    // EmailJS를 이용한 실제 이메일 전송
    const templateParams = {
      company_name: data.company,
      contact_name: data.name,
      contact_phone: data.phone,
      contact_email: data.email,
      solution_interest: data.solution || '선택하지 않음',
      message: data.message,
      submitted_at: new Date().toLocaleString('ko-KR')
    };
    
    // EmailJS 전송 (실제 SERVICE_ID, TEMPLATE_ID 필요)
    emailjs.send('service_kinfri', 'template_trsmhbc', templateParams)
      .then(() => {
        Form.showSuccessMessage();
        event.target.reset();
      })
      .catch((error) => {
        console.error('이메일 전송 실패:', error);
        Form.showErrorMessage('전송에 실패했습니다. 다시 시도해주세요.');
      })
      .finally(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      });
  },
  
  validateForm: (data) => {
    const required = ['company', 'name', 'phone', 'email', 'message'];
    let isValid = true;
    
    required.forEach(field => {
      const input = document.getElementById(field);
      if (!data[field] || data[field].trim() === '') {
        Form.showFieldError(input, '이 필드는 필수입니다.');
        isValid = false;
      } else {
        Form.clearFieldError(input);
      }
    });
    
    // Email validation
    if (data.email && !Form.isValidEmail(data.email)) {
      Form.showFieldError(document.getElementById('email'), '올바른 이메일 주소를 입력해주세요.');
      isValid = false;
    }
    
    // Privacy checkbox validation
    if (!data.privacy) {
      Form.showFieldError(document.getElementById('privacy'), '개인정보 수집에 동의해주세요.');
      isValid = false;
    }
    
    return isValid;
  },  
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  showFieldError: (input, message) => {
    Form.clearFieldError(input);
    input.style.borderColor = 'var(--error)';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = 'var(--error)';
    errorDiv.style.fontSize = 'var(--text-sm)';
    errorDiv.style.marginTop = 'var(--space-1)';
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
  },
  
  clearFieldError: (input) => {
    input.style.borderColor = '';
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  },
  
  showSuccessMessage: () => {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideIn 0.5s ease;
    `;
    message.textContent = '문의가 성공적으로 전송되었습니다!';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  },
  
  showErrorMessage: (text) => {
    const message = document.createElement('div');
    message.className = 'error-message';
    message.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--error);
      color: white;
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideIn 0.5s ease;
    `;
    message.textContent = text;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }
};

// Smooth scrolling for anchor links
const initSmoothScrolling = () => {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        Utils.scrollToElement(targetElement);
      }
    });
  });
};
// Header scroll effect
const initHeaderScroll = () => {
  const header = document.getElementById('header');
  
  const scrollEffect = Utils.throttle(() => {
    if (window.scrollY > 100) {
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
      header.style.boxShadow = 'var(--shadow-md)';
    } else {
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      header.style.boxShadow = 'none';
    }
  }, 10);
  
  window.addEventListener('scroll', scrollEffect);
};

// CSS Animation keyframes (add to head)
const addAnimationStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .navbar-toggle.active .hamburger-line:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    .navbar-toggle.active .hamburger-line:nth-child(2) {
      opacity: 0;
    }
    
    .navbar-toggle.active .hamburger-line:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }
  `;
  
  document.head.appendChild(style);
};

// Initialize animations styles
addAnimationStyles();

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initEmailJS();
  Navigation.init();
  Animations.init();
  Form.init();
});