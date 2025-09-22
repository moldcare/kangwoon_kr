/**
 * 킨프리 솔라피(Solapi) 메시지 API
 * 카카오톡 알림톡 + SMS 발송 시스템
 * 채널: @popupworld (http://pf.kakao.com/_Mxmxakn)
 */

class SolapiAPI {
  constructor() {
    // 기능 비활성화 플래그 (카카오톡 상담 숨김 처리)
    this.enabled = false;

    // 솔라피 API 설정 (실제 키로 교체 필요)
    this.config = {
      API_KEY: 'YOUR_SOLAPI_API_KEY',        // 솔라피 API Key
      API_SECRET: 'YOUR_SOLAPI_API_SECRET',  // 솔라피 API Secret  
      SENDER_PHONE: 'YOUR_SENDER_PHONE',     // 발신 전화번호 (등록된 번호)
      TEMPLATE_ID: 'YOUR_TEMPLATE_ID',       // 승인된 알림톡 템플릿 ID
      BASE_URL: 'https://api.solapi.com'     // 솔라피 API 베이스 URL
    };
    
    this.channelInfo = {
      id: '@popupworld',
      url: 'http://pf.kakao.com/_Mxmxakn',
      name: '킨프리(KINFRI)'
    };
    
    this.businessHours = {
      start: 9,
      end: 17
    };
  }

  /**
   * 초기화 - 모달 및 이벤트 리스너 설정
   */
  init() {
    if (!this.enabled) {
      return;
    }

    this.createConsultationModal();
    this.attachEventListeners();
  }

  /**
   * 무료상담 모달 HTML 생성
   */
  createConsultationModal() {
    const modalHTML = `
      <div id="solapi-consultation-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>💬 카카오톡 무료 상담</h3>
            <button class="modal-close" onclick="SolapiAPI.instance.closeModal()">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="consultation-info">
              <div class="info-item">
                <span class="info-icon">⏰</span>
                <span>상담시간: 평일 09:00 - 17:00</span>
              </div>
              <div class="info-item">
                <span class="info-icon">⚡</span>
                <span>평균 응답시간: 5분 이내</span>
              </div>
              <div class="info-item">
                <span class="info-icon">💬</span>
                <span>카카오톡 알림 + 실시간 상담</span>
              </div>
              <div class="info-item">
                <span class="info-icon">🔒</span>
                <span>개인정보 보호 보장</span>
              </div>
            </div>
            
            <form id="solapi-consultation-form" class="consultation-form">
              <div class="form-group">
                <label for="solapi-name">이름 *</label>
                <input type="text" id="solapi-name" name="name" required 
                       placeholder="실명을 입력해주세요">
              </div>
              
              <div class="form-group">
                <label for="solapi-phone">연락처 *</label>
                <input type="tel" id="solapi-phone" name="phone" required 
                       placeholder="010-0000-0000" pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}">
              </div>
              
              <div class="form-group">
                <label for="solapi-company">회사명</label>
                <input type="text" id="solapi-company" name="company" 
                       placeholder="회사명을 입력해주세요 (선택)">
              </div>
              
              <div class="form-group">
                <label for="solapi-inquiry">문의 유형</label>
                <select id="solapi-inquiry" name="inquiry">
                  <option value="general">일반 문의</option>
                  <option value="ai-agent">AI Agent 솔루션</option>
                  <option value="rag">RAG 애플리케이션</option>
                  <option value="sllm">Private sLLM</option>
                  <option value="chatbot">노코드 챗봇</option>
                  <option value="voice">STT/TTS 솔루션</option>
                  <option value="consulting">종합 컨설팅</option>
                </select>
              </div>
              
              <div class="form-checkbox">
                <input type="checkbox" id="solapi-privacy" name="privacy" required>
                <label for="solapi-privacy">
                  개인정보 수집·이용에 동의합니다. 
                  <a href="#" onclick="SolapiAPI.instance.showPrivacyPolicy()">자세히 보기</a>
                </label>
              </div>
              
              <button type="submit" class="btn btn-primary btn-full">
                💬 카카오톡으로 상담 시작
              </button>
            </form>
            
            <div class="solapi-info">
              <p class="info-text">
                💡 <strong>알림톡 발송 후 카카오톡 채널로 실시간 상담이 진행됩니다.</strong><br>
                📱 발송 실패 시 SMS로 자동 전환됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * 이벤트 리스너 연결
   */
  attachEventListeners() {
    // 무료상담 버튼 클릭 이벤트 (이메일 폼 제외)
    const consultButtons = document.querySelectorAll('a[href="#contact"], .btn-primary, a[href="#kakao-consult"]');
    consultButtons.forEach(button => {
      // Contact form 내부의 submit 버튼은 제외 (이메일 기능 유지)
      const isEmailFormButton = button.closest('#contact-form') || 
                               button.closest('.contact-form-container') ||
                               button.type === 'submit' ||
                               button.id === 'email-submit-btn';
      
      // 무료상담/상담 관련 텍스트가 포함된 버튼만 솔라피 기능 적용
      const hasConsultText = button.textContent.includes('무료') || 
                             button.textContent.includes('상담') ||
                             button.textContent.includes('문의');
      
      if (!isEmailFormButton && hasConsultText) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.openModal();
        });
      }
    });

    // 폼 제출 이벤트
    document.getElementById('solapi-consultation-form').addEventListener('submit', (e) => {
      this.handleFormSubmit(e);
    });

    // 모달 외부 클릭 시 닫기
    document.getElementById('solapi-consultation-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal();
      }
    });
  }

  /**
   * 모달 열기
   */
  openModal() {
    const modal = document.getElementById('solapi-consultation-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // 현재 시간이 운영시간인지 확인
    this.checkBusinessHours();
  }

  /**
   * 모달 닫기
   */
  closeModal() {
    const modal = document.getElementById('solapi-consultation-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 폼 초기화
    document.getElementById('solapi-consultation-form').reset();
  }

  /**
   * 운영시간 확인 및 안내
   */
  checkBusinessHours() {
    const now = new Date();
    const currentHour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const isBusinessHours = isWeekday && 
                           currentHour >= this.businessHours.start && 
                           currentHour < this.businessHours.end;

    if (!isBusinessHours) {
      this.showBusinessHoursNotice();
    }
  }

  /**
   * 운영시간 외 안내 표시
   */
  showBusinessHoursNotice() {
    const notice = document.createElement('div');
    notice.className = 'business-hours-notice';
    notice.innerHTML = `
      <div class="notice-content">
        <span class="notice-icon">🕘</span>
        <div class="notice-text">
          <strong>운영시간 외입니다</strong>
          <p>평일 09:00-17:00에 빠른 상담이 가능합니다.<br>
          지금 신청하시면 다음 운영시간에 연락드리겠습니다.</p>
        </div>
      </div>
    `;
    
    const modalBody = document.querySelector('#solapi-consultation-modal .modal-body');
    modalBody.insertBefore(notice, modalBody.firstChild);
    
    // 8초 후 자동 제거
    setTimeout(() => {
      if (notice.parentNode) {
        notice.remove();
      }
    }, 8000);
  }

  /**
   * 폼 제출 처리
   */
  async handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      company: formData.get('company') || '미입력',
      inquiry: formData.get('inquiry'),
      privacy: formData.get('privacy'),
      timestamp: new Date().toLocaleString('ko-KR')
    };

    // 유효성 검사
    if (!this.validateForm(data)) {
      return;
    }

    // 로딩 상태 표시
    this.showLoading(true);

    try {
      // 솔라피 메시지 발송
      await this.sendSolapiMessage(data);
      
      // 성공 처리
      this.showSuccessMessage(data);
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        this.closeModal();
      }, 3000);

    } catch (error) {
      console.error('솔라피 메시지 발송 실패:', error);
      this.showErrorMessage('상담 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * 솔라피 메시지 발송
   */
  async sendSolapiMessage(data) {
    const messagePayload = {
      message: {
        to: data.phone.replace(/-/g, ''), // 하이픈 제거
        from: this.config.SENDER_PHONE,
        kakaoOptions: {
          pfId: this.channelInfo.id, // @popupworld
          templateId: this.config.TEMPLATE_ID,
          variables: {
            '#{이름}': data.name,
            '#{연락처}': data.phone,
            '#{회사명}': data.company,
            '#{문의유형}': this.getInquiryTypeName(data.inquiry),
            '#{접수시간}': data.timestamp
          }
        },
        // 알림톡 실패 시 SMS 자동 전환
        autoTypeDetect: true,
        fallbackConfig: {
          type: 'SMS',
          content: `[킨프리] ${data.name}님의 무료상담 신청이 접수되었습니다. 곧 연락드리겠습니다. (문의: ${this.getInquiryTypeName(data.inquiry)})`
        }
      }
    };

    // 솔라피 인증 헤더 생성
    const headers = this.createSolapiHeaders();
    
    // 실제 솔라피 API 호출 (현재는 시뮬레이션)
    // TODO: 실제 API 키 설정 후 주석 해제
    /*
    const response = await fetch(`${this.config.BASE_URL}/messages/v4/send`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      throw new Error(`솔라피 API 오류: ${response.status}`);
    }

    const result = await response.json();
    return result;
    */

    // 현재는 시뮬레이션 (3초 대기)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('솔라피 메시지 발송 (시뮬레이션):', messagePayload);
    
    return {
      success: true,
      messageId: 'MSG_' + Date.now(),
      message: '시뮬레이션 발송 완료'
    };
  }

  /**
   * 솔라피 인증 헤더 생성
   */
  createSolapiHeaders() {
    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2);
    
    // 실제 구현 시 HMAC-SHA256 서명 필요
    // const signature = this.createHMACSignature(date, salt);
    
    return {
      'Authorization': `HMAC-SHA256 ApiKey=${this.config.API_KEY}, Date=${date}, Salt=${salt}, Signature=TEMP_SIGNATURE`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 폼 유효성 검사
   */
  validateForm(data) {
    // 이름 검사
    if (!data.name || data.name.trim().length < 2) {
      this.showValidationError('solapi-name', '이름을 2글자 이상 입력해주세요.');
      return false;
    }

    // 전화번호 검사 (010으로 시작하는 11자리)
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(data.phone)) {
      this.showValidationError('solapi-phone', '010-0000-0000 형식으로 입력해주세요.');
      return false;
    }

    // 개인정보 동의 확인
    if (!data.privacy) {
      this.showValidationError('solapi-privacy', '개인정보 수집·이용에 동의해주세요.');
      return false;
    }

    return true;
  }

  // 유틸리티 메서드들...
  getInquiryTypeName(type) {
    const types = {
      'general': '일반 문의',
      'ai-agent': 'AI Agent 솔루션',
      'rag': 'RAG 애플리케이션', 
      'sllm': 'Private sLLM',
      'chatbot': '노코드 챗봇',
      'voice': 'STT/TTS 솔루션',
      'consulting': '종합 컨설팅'
    };
    return types[type] || '일반 문의';
  }

  showLoading(show) {
    const button = document.querySelector('#solapi-consultation-form button[type="submit"]');
    if (show) {
      button.innerHTML = '📤 전송 중...';
      button.disabled = true;
    } else {
      button.innerHTML = '💬 카카오톡으로 상담 시작';
      button.disabled = false;
    }
  }

  showSuccessMessage(data) {
    const success = document.createElement('div');
    success.className = 'success-notification';
    success.innerHTML = `
      <div class="success-content">
        <span class="success-icon">✅</span>
        <div class="success-text">
          <strong>상담 신청이 완료되었습니다!</strong>
          <p>${data.name}님의 카카오톡으로 알림 메시지를 발송했습니다.<br>
          곧 전문 상담원이 카카오톡 채널로 연락드리겠습니다.</p>
          <div class="channel-link">
            <a href="${this.channelInfo.url}" target="_blank" class="btn btn-outline btn-small">
              💬 카카오톡 채널 바로가기
            </a>
          </div>
        </div>
      </div>
    `;
    
    const modalBody = document.querySelector('#solapi-consultation-modal .modal-body');
    modalBody.appendChild(success);
  }

  showErrorMessage(message) {
    const error = document.createElement('div');
    error.className = 'error-notification';
    error.innerHTML = `
      <div class="error-content">
        <span class="error-icon">❌</span>
        <div class="error-text">
          <strong>오류가 발생했습니다</strong>
          <p>${message}</p>
        </div>
      </div>
    `;
    
    const modalBody = document.querySelector('#solapi-consultation-modal .modal-body');
    modalBody.appendChild(error);
    
    setTimeout(() => error.remove(), 5000);
  }

  showValidationError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.style.borderColor = 'var(--error)';
    
    // 기존 에러 메시지 제거
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
    
    // 새 에러 메시지 추가
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
    
    // 3초 후 에러 메시지 제거
    setTimeout(() => {
      field.style.borderColor = '';
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 3000);
  }

  showPrivacyPolicy() {
    alert(`킨프리 개인정보 수집·이용 동의

수집항목: 이름, 연락처, 회사명
수집목적: 상담 서비스 제공
보유기간: 상담 완료 후 1년
제3자 제공: 솔라피(메시지 발송 목적만)

동의를 거부할 권리가 있으며, 거부 시 상담 서비스 이용이 제한될 수 있습니다.`);
  }
}

// 전역 인스턴스 생성
SolapiAPI.instance = new SolapiAPI();

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  SolapiAPI.instance.init();
});

// 전역 접근을 위한 export
window.SolapiAPI = SolapiAPI;
