/**
 * Gemini API 연동 모듈
 * 강운 AI 상담 시스템용
 */

class GeminiAPI {
    constructor() {
        // 환경변수 또는 설정에서 API 키를 가져와야 합니다
        // 실제 사용 시에는 서버사이드에서 처리하거나 환경변수 사용 필요
        this.API_KEY = ''; // 보안을 위해 API 키 제거 - 시뮬레이션 모드 사용
        this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.conversationHistory = [];
        
        console.log('🤖 [Gemini API] 시뮬레이션 모드로 초기화 (보안상 API 키 제거됨)');
    }

    /**
     * Gemini API에 요청을 보내는 메서드
     * @param {string} prompt - 사용자 입력 또는 시스템 프롬프트
     * @param {Object} customerData - 고객 데이터 (추천 생성용)
     * @returns {Promise<string>} - AI 응답
     */
    async generateResponse(prompt, customerData = null) {
        try {
            // API 키가 설정되지 않은 경우 시뮬레이션 모드
            if (!this.API_KEY || this.API_KEY === 'YOUR_GEMINI_API_KEY' || this.API_KEY === '') {
                console.log('🤖 [Gemini API] 시뮬레이션 모드: API 키가 설정되지 않음');
                return await this.simulateResponse(prompt, customerData);
            }

            // 대화 히스토리에 추가 (추천 생성이 아닌 일반 대화일 때만)
            const isRecommendation = customerData !== null;
            if (!isRecommendation) {
                this.conversationHistory.push({
                    role: 'user',
                    content: prompt
                });
            }

            // 시스템 프롬프트와 대화 히스토리 결합
            const fullPrompt = this.buildFullPrompt(prompt, isRecommendation);

            const requestBody = {
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            };

            const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates[0].content.parts[0].text;

            // AI 응답을 대화 히스토리에 추가
            if (!isSystemPrompt) {
                this.conversationHistory.push({
                    role: 'assistant',
                    content: aiResponse
                });
            }

            return aiResponse;

        } catch (error) {
            console.error('Gemini API 요청 실패:', error);
            console.log('🤖 시뮬레이션 모드로 전환');
            return await this.simulateResponse(prompt, customerData);
        }
    }

    /**
     * 강운 AI 상담 전용 시스템 프롬프트 구축
     * @param {string} userPrompt - 사용자 입력
     * @param {boolean} isRecommendation - 추천 생성인지 여부
     * @returns {string} - 완전한 프롬프트
     */
    buildFullPrompt(userPrompt, isRecommendation) {
        const systemPrompt = `당신은 강운(KANGWOON)의 AI 상담 전문가입니다.

[강운 회사 소개]
- 제조/중소기업의 AI 전환을 선도하는 전문 기업
- 생산성 향상, 비용 절감, 경쟁력 강화를 목표로 하는 AI 솔루션 제공
- 운영비 절감, 직원 업무 가치 재창출, 데이터 보안에 특화

[제공하는 솔루션]
1. AI Agent - 업무 자동화 (생산 관리, 재고 관리, 설비 모니터링)
2. RAG 애플리케이션 - 문서 검색 및 지식 관리 시스템
3. Private sLLM - 맞춤형 AI (데이터 보안 강화, 온프레미스)
4. 노코드 챗봇 빌더 - 쉬운 챗봇 구축 도구
5. STT/TTS - 음성 인식/합성 (스마트 팩토리 관제)

[상담 목표]
고객의 비즈니스 문제와 니즈를 파악하여 가장 적합한 솔루션을 추천하고, 
구체적인 도입 방안을 제시합니다.

[응답 가이드라인]
- 친근하고 전문적인 톤으로 응답
- 고객의 업종과 규모를 파악하여 맞춤형 추천
- 구체적인 ROI와 도입 효과 제시
- 기술적 설명보다는 비즈니스 가치 중심으로 설명
- 필요시 무료 상담 연결 제안

현재 대화 맥락: ${this.getConversationContext()}

사용자 질문: ${userPrompt}

위 정보를 바탕으로 전문적이고 도움이 되는 상담을 제공해주세요.`;

        return isSystemPrompt ? systemPrompt : systemPrompt + '\n\n' + userPrompt;
    }

    /**
     * 대화 맥락 정리
     * @returns {string} - 대화 히스토리 요약
     */
    getConversationContext() {
        if (this.conversationHistory.length === 0) {
            return '새로운 상담 시작';
        }
        
        return this.conversationHistory
            .slice(-4) // 최근 4개 대화만 유지
            .map(msg => `${msg.role === 'user' ? '고객' : 'AI'}: ${msg.content}`)
            .join('\n');
    }

    /**
     * 대화 히스토리 초기화
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * API 키 설정
     * @param {string} apiKey - Gemini API 키
     */
    setApiKey(apiKey) {
        this.API_KEY = apiKey;
    }

    /**
     * API 연결 테스트
     * @returns {Promise<boolean>} - 연결 성공 여부
     */
    async testConnection() {
        try {
            if (!this.API_KEY || this.API_KEY === 'YOUR_GEMINI_API_KEY' || this.API_KEY === '') {
                console.log('🤖 [Gemini API] 시뮬레이션 모드 활성화 (API 키 없음)');
                return false; // 시뮬레이션 모드임을 알림
            }
            const testResponse = await this.generateResponse('안녕하세요');
            return testResponse && !testResponse.includes('오류가 발생했습니다');
        } catch (error) {
            console.error('❌ [Gemini API] 연결 테스트 실패:', error);
            return false;
        }
    }

    /**
     * 시뮬레이션 응답 생성 (API 키가 없을 때)
     * @param {string} prompt - 사용자 입력
     * @param {Object} customerData - 고객 데이터
     * @returns {Promise<string>} - 시뮬레이션 응답
     */
    async simulateResponse(prompt, customerData = null) {
        console.log('🔄 [Gemini API] simulateResponse 호출됨');
        console.log('📥 [Gemini API] 프롬프트:', prompt);
        console.log('📊 [Gemini API] 고객 데이터:', customerData);
        
        // 실제 API 호출을 시뮬레이션하기 위한 지연
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // 추천 생성 요청인지 확인
        const hasRecommendationKeyword = prompt.includes('고객 정보를 바탕으로') || prompt.includes('추천해주세요');
        console.log('🔍 [Gemini API] 추천 키워드 확인:', hasRecommendationKeyword);
        
        if (hasRecommendationKeyword && customerData) {
            console.log('✅ [Gemini API] 추천 생성 조건 충족 - generateSimulatedRecommendation 호출');
            const result = this.generateSimulatedRecommendation(customerData);
            console.log('🎯 [Gemini API] 생성된 추천 결과:', result);
            return result;
        }

        // 고객 데이터가 없으면 글로벌에서 가져오기
        if (!customerData) {
            customerData = window.aiConsultant?.customerData || {};
            console.log('📋 [Gemini API] 글로벌 고객 데이터 사용:', customerData);
        }

        console.log('ℹ️ [Gemini API] 일반 응답 생성');
        // 일반 응답
        const responses = [
            "네, 잘 이해했습니다. 다음 질문으로 넘어가겠습니다.",
            "좋은 답변 감사합니다. 추가 정보가 필요합니다.",
            "해당 정보를 바탕으로 더 나은 상담을 진행하겠습니다.",
            "입력해주신 내용을 참고하여 맞춤 상담을 제공하겠습니다."
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * 시뮬레이션 추천 생성 (다국어 지원)
     * @param {Object} customerData - 고객 데이터
     * @returns {string} - 추천 내용
     */
    generateSimulatedRecommendation(customerData) {
        // AIRI 방식 번역 함수 사용
        const getTranslation = (key) => {
            if (!window.translations || !key) return key;
            const currentLang = window.currentLang || document.documentElement.getAttribute('lang') || 'ko';
            const langTranslations = window.translations[currentLang] || window.translations.ko || {};
            return key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), langTranslations) || key;
        };

        const businessProblem = customerData.business_problem?.answer || '';
        const companySize = customerData.company_size?.answer || '';
        const budget = customerData.budget_range?.answer || '';
        const interest = customerData.automation_interest?.answer || '';

        let recommendation = `**${getTranslation('ai_consultant.prompts.format_solution')}**\n`;
        let solutions = [];
        
        // 비즈니스 문제와 관심 영역에 따른 솔루션 추천
        if (businessProblem.includes('인력') || businessProblem.includes('Staff') || interest.includes('자동화') || interest.includes('automation')) {
            solutions.push(getTranslation('ai_consultant.solutions.ai_agent'));
        }
        
        if (businessProblem.includes('품질') || businessProblem.includes('quality') || businessProblem.includes('데이터') || businessProblem.includes('data') || interest.includes('지식') || interest.includes('knowledge')) {
            solutions.push(getTranslation('ai_consultant.solutions.rag_application'));
        }
        
        if (businessProblem.includes('고객') || businessProblem.includes('customer') || interest.includes('상담') || interest.includes('consultation')) {
            solutions.push(getTranslation('ai_consultant.solutions.nocode_chatbot'));
        }
        
        if (interest.includes('음성') || interest.includes('voice') || interest.includes('제어') || interest.includes('control')) {
            solutions.push(getTranslation('ai_consultant.solutions.stt_tts'));
        }
        
        if (solutions.length === 0) {
            solutions.push(getTranslation('ai_consultant.solutions.rag_application'), getTranslation('ai_consultant.solutions.ai_agent'));
        }
        
        recommendation += solutions.slice(0, 2).join(", ") + "\n\n";
        
        recommendation += `**${getTranslation('ai_consultant.prompts.format_reason')}**\n`;
        recommendation += `${getTranslation('ai_consultant.prompts.reason_template')
            .replace('{businessProblem}', businessProblem)
            .replace('{interest}', interest)}\n\n`;
        
        recommendation += `**${getTranslation('ai_consultant.prompts.format_effect')}**\n`;
        recommendation += `• ${getTranslation('ai_consultant.prompts.effect_time')}\n`;
        recommendation += `• ${getTranslation('ai_consultant.prompts.effect_cost')}\n`;
        recommendation += `• ${getTranslation('ai_consultant.prompts.effect_accuracy')}\n\n`;
        
        recommendation += `**${getTranslation('ai_consultant.prompts.format_roi')}**\n`;
        if (budget.includes('500만원') || budget.includes('500')) {
            recommendation += `${getTranslation('ai_consultant.prompts.roi_short')}\n\n`;
        } else if (budget.includes('2,000만원') || budget.includes('2,000')) {
            recommendation += `${getTranslation('ai_consultant.prompts.roi_medium')}\n\n`;
        } else {
            recommendation += `${getTranslation('ai_consultant.prompts.roi_long')}\n\n`;
        }
        
        recommendation += `**${getTranslation('ai_consultant.prompts.format_implementation')}**\n`;
        recommendation += `${getTranslation('ai_consultant.prompts.step1')}\n`;
        recommendation += `${getTranslation('ai_consultant.prompts.step2')}\n`;
        recommendation += `${getTranslation('ai_consultant.prompts.step3')}\n`;
        recommendation += `${getTranslation('ai_consultant.prompts.step4')}\n\n`;
        
        recommendation += `**${getTranslation('ai_consultant.prompts.format_next_step')}**\n`;
        recommendation += `${getTranslation('ai_consultant.prompts.next_step_text')}\n`;
        recommendation += getTranslation('ai_consultant.prompts.detailed_proposal');
        
        return recommendation;
    }
}


// 전역 인스턴스 생성
window.geminiAPI = new GeminiAPI();