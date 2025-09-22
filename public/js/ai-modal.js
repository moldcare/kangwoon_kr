/**
 * AI 상담 모달 UI 컨트롤러
 * Gemini API 기반 상담 시스템 UI 관리
 */

const AIModal = {
    isOpen: false,
    isConsultationActive: false,

    /**
     * AI 모달 열기
     */
    async open() {
        const modal = document.getElementById('ai-modal');
        if (!modal) return;

        this.isOpen = true;
        modal.classList.add('active');
        
        // 스크롤 방지
        document.body.style.overflow = 'hidden';
        
        // 상담 시작
        if (!this.isConsultationActive) {
            await this.startConsultation();
        }
    },

    /**
     * AI 모달 닫기
     */
    close() {
        const modal = document.getElementById('ai-modal');
        if (!modal) return;

        this.isOpen = false;
        modal.classList.remove('active');
        
        // 스크롤 복원
        document.body.style.overflow = 'auto';
    },

    /**
     * 상담 시작
     */
    async startConsultation() {
        this.isConsultationActive = true;
        
        try {
            // Gemini API 연결 테스트 (실제 API 키가 설정된 경우)
            const isConnected = await window.geminiAPI.testConnection();
            if (!isConnected) {
                console.warn('Gemini API 연결 실패 - 시뮬레이션 모드로 진행');
            }
            
            // AI 상담 시작
            const firstQuestion = await window.aiConsultant.startConsultation();
            this.showQuestion(firstQuestion);
            
        } catch (error) {
            console.error('상담 시작 실패:', error);
            this.showError('상담을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
    },

    /**
     * 질문 화면 표시
     * @param {Object} questionData - 질문 데이터
     */
    showQuestion(questionData) {
        if (!questionData) {
            this.showError('질문을 불러올 수 없습니다.');
            return;
        }

        // 진행률 업데이트
        this.updateProgress();
        
        // AI 메시지 추가
        this.addBotMessage(questionData.question);
        
        // 옵션 버튼 표시 (multiple_choice 타입인 경우)
        if (questionData.type === 'multiple_choice' && questionData.options) {
            this.showOptions(questionData.options);
        } else if (questionData.type === 'confirm') {
            this.showOptions(questionData.options);
        } else {
            // 텍스트 입력 표시
            this.showTextInput();
        }
    },

    /**
     * 봇 메시지 추가
     * @param {string} message - 메시지 내용
     */
    addBotMessage(message) {
        const chatContainer = document.getElementById('ai-chat-container');
        if (!chatContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message bot';
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    },

    /**
     * 사용자 메시지 추가
     * @param {string} message - 메시지 내용
     */
    addUserMessage(message) {
        const chatContainer = document.getElementById('ai-chat-container');
        if (!chatContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message user';
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    },

    /**
     * 옵션 버튼들 표시
     * @param {Array} options - 옵션 배열
     */
    showOptions(options) {
        const optionsGrid = document.getElementById('ai-options-grid');
        const inputArea = document.getElementById('ai-input-area');
        
        if (!optionsGrid) return;
        
        // 이전 옵션들 제거
        optionsGrid.innerHTML = '';
        
        // 옵션 버튼 생성
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'ai-option-button';
            button.textContent = option;
            button.onclick = () => this.selectOption(option);
            optionsGrid.appendChild(button);
        });
        
        // 옵션 표시, 텍스트 입력 숨김
        optionsGrid.style.display = 'grid';
        if (inputArea) inputArea.style.display = 'none';
    },

    /**
     * 텍스트 입력 영역 표시
     */
    showTextInput() {
        const optionsGrid = document.getElementById('ai-options-grid');
        const inputArea = document.getElementById('ai-input-area');
        
        if (optionsGrid) optionsGrid.style.display = 'none';
        if (inputArea) inputArea.style.display = 'block';
    },

    /**
     * 옵션 선택 처리
     * @param {string} selectedOption - 선택된 옵션
     */
    async selectOption(selectedOption) {
        // 사용자 메시지 추가
        this.addUserMessage(selectedOption);
        
        // 옵션 버튼들 숨기기
        const optionsGrid = document.getElementById('ai-options-grid');
        if (optionsGrid) optionsGrid.style.display = 'none';
        
        // 로딩 표시
        this.showLoading();
        
        try {
            // AI 상담 진행
            const result = await window.aiConsultant.processAnswer(selectedOption);
            
            // 로딩 숨기기
            this.hideLoading();
            
            if (result.type === 'question') {
                // 다음 질문 표시
                this.showQuestion(result.data);
            } else if (result.type === 'recommendation') {
                // 추천 결과 표시
                this.showRecommendation(result.data);
            } else if (result.type === 'error') {
                this.showError(result.message);
            }
            
        } catch (error) {
            this.hideLoading();
            console.error('답변 처리 실패:', error);
            this.showError('답변 처리 중 오류가 발생했습니다.');
        }
    },

    /**
     * 텍스트 입력 전송
     */
    async sendTextInput() {
        const textInput = document.getElementById('ai-text-input');
        if (!textInput) return;
        
        const message = textInput.value.trim();
        if (!message) return;
        
        // 입력 필드 초기화
        textInput.value = '';
        
        // 선택된 옵션으로 처리
        await this.selectOption(message);
    },

    /**
     * 추천 결과 표시
     * @param {Object} recommendationData - 추천 데이터
     */
    showRecommendation(recommendationData) {
        const recommendationDiv = document.getElementById('ai-recommendation');
        const contentDiv = document.getElementById('ai-recommendation-content');
        
        if (!recommendationDiv || !contentDiv) return;
        
        // 추천 내용 표시
        contentDiv.innerHTML = recommendationData.recommendation.replace(/\n/g, '<br>');
        recommendationDiv.style.display = 'block';
        
        // 진행률 100%로 업데이트
        this.updateProgress(100);
        
        // 스크롤
        recommendationDiv.scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * 솔라피 상담 연결
     */
    proceedToSolapi() {
        // 고객 데이터를 솔라피 형식으로 변환
        const consultationData = window.aiConsultant.formatForSolapi();
        
        // AI 모달 닫기
        this.close();
        
        // 솔라피 모달 열기 (기존 솔라피 시스템과 연동)
        if (window.openKakaoConsultation) {
            // 솔라피 모달에 AI 상담 데이터 전달
            window.openKakaoConsultation({
                preFilledMessage: consultationData,
                source: 'ai_consultation'
            });
        } else {
            // 대안: 직접 카카오톡 채널 연결
            window.open('http://pf.kakao.com/_Mxmxakn', '_blank');
        }
    },

    /**
     * 상담 재시작
     */
    async restart() {
        // 상담 데이터 초기화
        window.aiConsultant.restart();
        
        // UI 초기화
        this.clearChat();
        this.hideRecommendation();
        this.updateProgress(0);
        
        // 상담 재시작
        await this.startConsultation();
    },

    /**
     * 진행률 업데이트
     * @param {number} percent - 진행률 (0-100)
     */
    updateProgress(percent = null) {
        const progressContainer = document.querySelector('.ai-progress-container');
        const progressPercent = document.getElementById('ai-progress-percent');
        const progressFill = document.getElementById('ai-progress-fill');
        
        if (!progressContainer) return;
        
        // 진행률 계산
        const currentPercent = percent !== null ? percent : window.aiConsultant.getProgress();
        
        // 진행률 표시
        progressContainer.style.display = 'block';
        if (progressPercent) progressPercent.textContent = currentPercent;
        if (progressFill) progressFill.style.width = currentPercent + '%';
    },

    /**
     * 로딩 표시
     */
    showLoading() {
        const loadingDiv = document.getElementById('ai-typing-indicator');
        if (loadingDiv) loadingDiv.style.display = 'flex';
    },

    /**
     * 로딩 숨기기
     */
    hideLoading() {
        const loadingDiv = document.getElementById('ai-typing-indicator');
        if (loadingDiv) loadingDiv.style.display = 'none';
    },

    /**
     * 채팅 내용 초기화
     */
    clearChat() {
        const chatContainer = document.getElementById('ai-chat-container');
        if (chatContainer) chatContainer.innerHTML = '';
    },

    /**
     * 추천 결과 숨기기
     */
    hideRecommendation() {
        const recommendationDiv = document.getElementById('ai-recommendation');
        if (recommendationDiv) recommendationDiv.style.display = 'none';
    },

    /**
     * 에러 메시지 표시
     * @param {string} message - 에러 메시지
     */
    showError(message) {
        this.addBotMessage(`❌ ${message}`);
        
        // 재시작 버튼 표시
        this.showOptions(['다시 시도하기', '전문 상담사 연결']);
    }
};

// 전역 함수로 노출
window.AIModal = AIModal;

// ESC 키로 모달 닫기
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && AIModal.isOpen) {
        AIModal.close();
    }
});

// 모달 외부 클릭으로 닫기
document.addEventListener('click', (event) => {
    const modal = document.getElementById('ai-modal');
    if (modal && event.target === modal) {
        AIModal.close();
    }
});