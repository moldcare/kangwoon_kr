/**
 * 킨프리 법적 문서 다국어 링크 시스템
 * 언어별 개인정보처리방침 및 이용약관 동적 연결
 */

// 언어별 법적 문서 링크 매핑
const legalLinks = {
    'ko': {
        privacy: '/privacy-policy.html',
        terms: '/terms-of-service.html'
    },
    'en': {
        privacy: '/privacy-policy-en.html', 
        terms: '/terms-of-service-en.html'
    },
    'zh': {
        privacy: '/privacy-policy-zh.html',
        terms: '/terms-of-service-zh.html'
    },
    'vi': {
        privacy: '/privacy-policy-vi.html',
        terms: '/terms-of-service-vi.html'
    },
    'ja': {
        privacy: '/privacy-policy-ja.html',
        terms: '/terms-of-service-ja.html'
    },
    'th': {
        privacy: '/privacy-policy-th.html',
        terms: '/terms-of-service-th.html'
    },
    'id': {
        privacy: '/privacy-policy-id.html',
        terms: '/terms-of-service-id.html'
    }
};

/**
 * 현재 언어에 맞는 법적 문서 링크 업데이트
 * @param {string} language - 현재 언어 코드 (ko, en, zh, vi, ja, th, id)
 */
function updateLegalLinks(language) {
    try {
        const currentLang = language || 'ko';
        const links = legalLinks[currentLang] || legalLinks['ko'];
        
        console.log(`🔗 [LegalLinks] 법적 문서 링크 업데이트: ${currentLang}`);
        
        // 개인정보처리방침 링크 업데이트
        const privacyLink = document.getElementById('privacyLink');
        if (privacyLink) {
            privacyLink.href = links.privacy;
            console.log(`✅ [LegalLinks] 개인정보처리방침: ${links.privacy}`);
        } else {
            console.warn('⚠️ [LegalLinks] privacyLink 요소를 찾을 수 없습니다');
        }
        
        // 이용약관 링크 업데이트
        const termsLink = document.getElementById('termsLink');
        if (termsLink) {
            termsLink.href = links.terms;
            console.log(`✅ [LegalLinks] 이용약관: ${links.terms}`);
        } else {
            console.warn('⚠️ [LegalLinks] termsLink 요소를 찾을 수 없습니다');
        }
        
        console.log('🎯 [LegalLinks] 법적 문서 링크 업데이트 완료');
        
    } catch (error) {
        console.error('❌ [LegalLinks] 법적 문서 링크 업데이트 중 오류:', error);
    }
}

/**
 * 페이지 로드 시 초기 링크 설정
 */
function initializeLegalLinks() {
    try {
        // 현재 언어 감지 (window.currentLang 또는 document.lang 또는 기본값)
        const currentLang = window.currentLang || 
                           document.documentElement.getAttribute('lang') || 
                           'ko';
        
        console.log('🚀 [LegalLinks] 법적 문서 링크 시스템 초기화');
        
        // 초기 링크 설정
        updateLegalLinks(currentLang);
        
    } catch (error) {
        console.error('❌ [LegalLinks] 초기화 중 오류:', error);
    }
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 [LegalLinks] DOM 로드 완료, 법적 문서 링크 시스템 준비');
    
    // 약간의 지연 후 초기화 (다른 시스템 로드 대기)
    setTimeout(() => {
        initializeLegalLinks();
    }, 100);
});

// 전역 함수로 노출 (i18n.js에서 호출 가능)
window.updateLegalLinks = updateLegalLinks;