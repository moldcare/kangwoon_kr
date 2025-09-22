/**
 * 강운 AI 상담 시스템
 * Gemini API 기반 사전 상담 및 솔루션 추천
 */

// AIRI 방식 번역 함수
function getTranslation(key) {
    if (!window.translations || !key) {
        console.warn('🚨 [AI Consultant] 번역 시스템 또는 키가 없습니다:', { translations: !!window.translations, key });
        return key;
    }
    
    // 현재 언어로 번역 시도
    const currentLang = window.currentLang || document.documentElement.getAttribute('lang') || 'ko';
    const langTranslations = window.translations[currentLang] || window.translations.ko || {};
    
    const result = key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), langTranslations) || key;
    
    if (result === key) {
        console.warn('🚨 [AI Consultant] 번역 키를 찾을 수 없습니다:', key);
    }
    
    return result;
}

class AIConsultant {
    constructor() {
        this.currentStep = 0;
        this.maxSteps = 6;
        this.customerData = {};
        this.consultationQuestions = [
            {
                id: 'greeting',
                questionKey: 'ai_consultant.questions.greeting.text',
                type: 'confirm',
                optionsKey: 'ai_consultant.questions.greeting.options'
            },
            {
                id: 'business_problem',
                questionKey: 'ai_consultant.questions.business_problem.text',
                type: 'multiple_choice',
                optionsKey: 'ai_consultant.questions.business_problem.options'
            },
            {
                id: 'company_size',
                questionKey: 'ai_consultant.questions.company_size.text',
                type: 'multiple_choice',
                optionsKey: 'ai_consultant.questions.company_size.options'
            },
            {
                id: 'budget_range',
                questionKey: 'ai_consultant.questions.budget_range.text',
                type: 'multiple_choice',
                optionsKey: 'ai_consultant.questions.budget_range.options'
            },
            {
                id: 'timeline',
                questionKey: 'ai_consultant.questions.timeline.text',
                type: 'multiple_choice',
                optionsKey: 'ai_consultant.questions.timeline.options'
            },
            {
                id: 'automation_interest',
                questionKey: 'ai_consultant.questions.automation_interest.text',
                type: 'multiple_choice',
                optionsKey: 'ai_consultant.questions.automation_interest.options'
            }
        ];
    }

    /**
     * AI 상담 시작
     */
    async startConsultation() {
        console.log('🤖 [AI Consultant] 상담 시작');
        console.log('🔍 [AI Consultant] 번역 시스템 상태:', {
            translations: !!window.translations,
            currentLang: window.currentLang,
            sampleTranslation: getTranslation('ai_consultant.questions.greeting.text')
        });
        
        this.currentStep = 0;
        this.customerData = {};
        const question = this.getCurrentQuestion();
        
        console.log('📝 [AI Consultant] 첫 번째 질문:', question);
        return question;
    }

    /**
     * 현재 질문 반환
     * @returns {Object} 현재 단계의 질문 정보
     */
    getCurrentQuestion() {
        if (this.currentStep >= this.consultationQuestions.length) {
            return null; // 상담 완료
        }
        
        const questionData = this.consultationQuestions[this.currentStep];
        
        // 번역된 텍스트로 변환하여 반환
        return {
            id: questionData.id,
            type: questionData.type,
            question: getTranslation(questionData.questionKey),
            options: getTranslation(questionData.optionsKey)
        };
    }

    /**
     * 사용자 응답 처리
     * @param {string} answer - 사용자 답변
     * @returns {Promise<Object>} 다음 질문 또는 결과
     */
    async processAnswer(answer) {
        const currentQuestion = this.consultationQuestions[this.currentStep];
        
        // 응답 저장 (번역된 질문 텍스트 사용)
        this.customerData[currentQuestion.id] = {
            question: getTranslation(currentQuestion.questionKey),
            answer: answer,
            timestamp: new Date().toISOString()
        };

        this.currentStep++;

        // 상담 완료 확인
        if (this.currentStep >= this.consultationQuestions.length) {
            return await this.generateRecommendation();
        }

        // 다음 질문 반환
        return {
            type: 'question',
            data: this.getCurrentQuestion(),
            progress: Math.round((this.currentStep / this.consultationQuestions.length) * 100)
        };
    }

    /**
     * AI 기반 솔루션 추천 생성
     * @returns {Promise<Object>} 추천 결과
     */
    async generateRecommendation() {
        console.log('🎯 [AI Consultant] 추천 생성 시작');
        console.log('📊 [AI Consultant] 고객 데이터:', this.customerData);
        
        const customerSummary = this.buildCustomerSummary();
        console.log('📝 [AI Consultant] 고객 요약:', customerSummary);
        
        const recommendationPrompt = `
고객 정보를 바탕으로 최적의 AI 솔루션을 추천해주세요.

${getTranslation('ai_consultant.prompts.recommendation_header')}

${customerSummary}

${getTranslation('ai_consultant.prompts.response_format')}

${getTranslation('ai_consultant.prompts.format_solution')}
[1-2개의 핵심 솔루션명]

${getTranslation('ai_consultant.prompts.format_reason')}
[고객 니즈와 솔루션의 연관성]

${getTranslation('ai_consultant.prompts.format_effect')}
[구체적인 개선 효과 2-3가지]

${getTranslation('ai_consultant.prompts.format_roi')}
[ROI 관점의 설명]

${getTranslation('ai_consultant.prompts.format_implementation')}
[단계별 도입 계획]

${getTranslation('ai_consultant.prompts.format_next_step')}
${getTranslation('ai_consultant.prompts.next_step_text')}
        `;

        console.log('🤖 [AI Consultant] Gemini API 상태:', !!window.geminiAPI);
        console.log('📤 [AI Consultant] 프롬프트 키워드 확인:', {
            includesKeyword1: recommendationPrompt.includes('고객 정보를 바탕으로'),
            includesKeyword2: recommendationPrompt.includes('추천해주세요')
        });
        console.log('📤 [AI Consultant] 프롬프트:', recommendationPrompt);

        try {
            if (!window.geminiAPI) {
                throw new Error('Gemini API가 로드되지 않았습니다.');
            }

            console.log('⏳ [AI Consultant] Gemini API 호출 중...');
            const aiRecommendation = await window.geminiAPI.generateResponse(recommendationPrompt, this.customerData);
            console.log('✅ [AI Consultant] Gemini API 응답:', aiRecommendation);
            
            return {
                type: 'recommendation',
                data: {
                    recommendation: aiRecommendation,
                    customerData: this.customerData,
                    summary: customerSummary,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('❌ [AI Consultant] 추천 생성 실패:', error);
            
            // 임시 fallback 응답
            const fallbackRecommendation = `
**🎯 ${getTranslation('ai_consultant.prompts.format_solution')}**
AI Agent 및 RAG 애플리케이션

**💡 ${getTranslation('ai_consultant.prompts.format_reason')}**
귀하의 비즈니스 요구사항에 따라 업무 자동화와 정보 검색 효율성이 가장 효과적일 것으로 판단됩니다.

**📈 ${getTranslation('ai_consultant.prompts.format_effect')}**
• 업무 처리 시간 30% 단축
• 정보 검색 정확도 95% 향상
• 운영 비용 20% 절감

**💰 ${getTranslation('ai_consultant.prompts.format_roi')}**
6개월 내 투자 대비 150% 이상의 효과를 기대할 수 있습니다.

**🚀 ${getTranslation('ai_consultant.prompts.format_implementation')}**
1단계: 요구사항 분석 (1주)
2단계: AI 모델 구축 (4주)
3단계: 테스트 및 배포 (2주)

**📞 ${getTranslation('ai_consultant.prompts.format_next_step')}**
${getTranslation('ai_consultant.prompts.next_step_text')}
            `;
            
            return {
                type: 'recommendation',
                data: {
                    recommendation: fallbackRecommendation,
                    customerData: this.customerData,
                    summary: customerSummary,
                    timestamp: new Date().toISOString(),
                    isFallback: true
                }
            };
        }
    }

    /**
     * 고객 정보 요약 생성
     * @returns {string} 고객 정보 요약
     */
    buildCustomerSummary() {
        const data = this.customerData;
        return `
${getTranslation('ai_consultant.prompts.customer_summary')}
- ${getTranslation('ai_consultant.labels.main_problem')} ${data.business_problem?.answer || getTranslation('ai_consultant.labels.unspecified')}
- ${getTranslation('ai_consultant.labels.company_size')} ${data.company_size?.answer || getTranslation('ai_consultant.labels.unspecified')}
- ${getTranslation('ai_consultant.labels.budget_range')} ${data.budget_range?.answer || getTranslation('ai_consultant.labels.unspecified')}
- ${getTranslation('ai_consultant.labels.timeline')} ${data.timeline?.answer || getTranslation('ai_consultant.labels.unspecified')}
- ${getTranslation('ai_consultant.labels.interest_area')} ${data.automation_interest?.answer || getTranslation('ai_consultant.labels.unspecified')}

${getTranslation('ai_consultant.prompts.solution_options')}
1. ${getTranslation('ai_consultant.solutions.ai_agent')}
2. ${getTranslation('ai_consultant.solutions.rag_application')}
3. ${getTranslation('ai_consultant.solutions.private_sllm')}
4. ${getTranslation('ai_consultant.solutions.nocode_chatbot')}
5. ${getTranslation('ai_consultant.solutions.stt_tts')}
        `;
    }

    /**
     * 상담 데이터를 솔라피 연결용으로 포맷
     * @returns {string} 솔라피 전송용 메시지
     */
    formatForSolapi() {
        const summary = Object.entries(this.customerData)
            .map(([key, value]) => `${value.question}\n${getTranslation('ai_consultant.messages.answer_prefix')} ${value.answer}`)
            .join('\n\n');
        
        return `${getTranslation('ai_consultant.messages.consultation_complete')}

${summary}

${getTranslation('ai_consultant.messages.timestamp')} ${new Date().toLocaleString('ko-KR')}

${getTranslation('ai_consultant.messages.expert_followup')}`;
    }

    /**
     * 상담 진행률 계산
     * @returns {number} 진행률 (0-100)
     */
    getProgress() {
        return Math.round((this.currentStep / this.consultationQuestions.length) * 100);
    }

    /**
     * 상담 재시작
     */
    restart() {
        this.currentStep = 0;
        this.customerData = {};
        window.geminiAPI.clearHistory();
    }
}

// 전역 인스턴스 생성
window.aiConsultant = new AIConsultant();