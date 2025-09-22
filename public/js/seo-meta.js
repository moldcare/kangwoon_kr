/**
 * 강운 웹사이트 - SEO 메타 태그 다국어화 시스템
 * Dynamic SEO Meta Tags System for KANGWOON Website
 * 
 * 기능:
 * - 언어별 동적 메타 태그 생성
 * - hreflang 태그 자동 생성
 * - OG 태그 다국어화
 * - canonical URL 설정
 */

class SEOMetaManager {
    constructor() {
        // 지원 언어 및 지역 코드
        this.supportedLanguages = {
            'ko': { code: 'ko', region: 'KR', name: '한국어' },
            'en': { code: 'en', region: 'US', name: 'English' },
            'zh': { code: 'zh', region: 'CN', name: '中文' },
            'vi': { code: 'vi', region: 'VN', name: 'Tiếng Việt' },
            'ja': { code: 'ja', region: 'JP', name: '日本語' },
            'th': { code: 'th', region: 'TH', name: 'ไทย' },
            'id': { code: 'id', region: 'ID', name: 'Bahasa Indonesia' }
        };
        
        // 기본 도메인 (환경에 따라 변경 가능)
        this.baseUrl = 'https://kangwoon.kr';
        
        // 현재 페이지 정보
        this.currentPage = this.getCurrentPage();
        
        this.debug = true;
    }
    
    /**
     * 현재 페이지 경로 분석
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index';
        return page.replace('.html', '');
    }
    
    /**
     * 메인 메타 태그 업데이트 함수
     */
    async updateMetaTags(language = 'ko') {
        try {
            this.log(`🏷️ SEO 메타 태그 업데이트 시작: ${language}`);
            
            // 1. 번역 데이터 가져오기
            const translations = await this.getTranslations(language);
            if (!translations || !translations.meta) {
                this.log(`❌ ${language} 번역 데이터 없음`);
                return;
            }
            
            // 2. 기본 메타 태그 업데이트
            this.updateBasicMetaTags(translations.meta, language);
            
            // 3. OG 태그 업데이트
            this.updateOpenGraphTags(translations.meta, language);
            
            // 4. Twitter 카드 태그 업데이트
            this.updateTwitterCardTags(translations.meta, language);
            
            // 5. hreflang 태그 생성
            this.generateHreflangTags();
            
            // 6. canonical URL 설정
            this.updateCanonicalUrl(language);
            
            this.log(`✅ SEO 메타 태그 업데이트 완료: ${language}`);
            
        } catch (error) {
            this.log(`❌ 메타 태그 업데이트 오류: ${error.message}`);
        }
    }
    
    /**
     * 번역 데이터 가져오기 (window.translations 또는 fetch)
     */
    async getTranslations(language) {
        // 1. 전역 번역 객체에서 확인
        if (window.translations && window.translations[language]) {
            return window.translations[language];
        }
        
        // 2. 직접 fetch로 로드
        try {
            const response = await fetch(`/locales/${language}.json`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            this.log(`번역 파일 로드 실패: ${error.message}`);
        }
        
        return null;
    }
    
    /**
     * 기본 메타 태그 업데이트
     */
    updateBasicMetaTags(meta, language) {
        // title 태그
        if (meta.title) {
            document.title = meta.title;
            this.updateMetaTag('property', 'og:title', meta.ogTitle || meta.title);
        }
        
        // description
        if (meta.description) {
            this.updateMetaTag('name', 'description', meta.description);
        }
        
        // keywords
        if (meta.keywords) {
            this.updateMetaTag('name', 'keywords', meta.keywords);
        }
        
        // robots
        if (meta.robots) {
            this.updateMetaTag('name', 'robots', meta.robots);
        }
        
        // viewport (필요한 경우)
        if (meta.viewport) {
            this.updateMetaTag('name', 'viewport', meta.viewport);
        }
        
        // author
        if (meta.author) {
            this.updateMetaTag('name', 'author', meta.author);
        }
        
        // HTML lang 속성 업데이트
        document.documentElement.setAttribute('lang', language);
        
        this.log(`📝 기본 메타 태그 업데이트 완료: ${language}`);
    }
    
    /**
     * Open Graph 태그 업데이트
     */
    updateOpenGraphTags(meta, language) {
        const ogTags = {
            'og:title': meta.ogTitle || meta.title,
            'og:description': meta.ogDescription || meta.description,
            'og:image': meta.ogImage || '/images/og-default.jpg',
            'og:url': `${this.baseUrl}${this.getLanguageUrl(language)}`,
            'og:type': 'website',
            'og:site_name': 'KANGWOON',
            'og:locale': this.getOGLocale(language)
        };
        
        Object.entries(ogTags).forEach(([property, content]) => {
            if (content) {
                this.updateMetaTag('property', property, content);
            }
        });
        
        this.log(`📱 Open Graph 태그 업데이트 완료: ${language}`);
    }
    
    /**
     * Twitter 카드 태그 업데이트
     */
    updateTwitterCardTags(meta, language) {
        const twitterTags = {
            'twitter:card': 'summary_large_image',
            'twitter:title': meta.twitterTitle || meta.ogTitle || meta.title,
            'twitter:description': meta.twitterDescription || meta.ogDescription || meta.description,
            'twitter:image': meta.ogImage || '/images/og-default.jpg',
            'twitter:site': '@KANGWOON_official' // 트위터 계정이 있다면
        };
        
        Object.entries(twitterTags).forEach(([name, content]) => {
            if (content) {
                this.updateMetaTag('name', name, content);
            }
        });
        
        this.log(`🐦 Twitter 카드 태그 업데이트 완료: ${language}`);
    }    /**
     * hreflang 태그 자동 생성
     */
    generateHreflangTags() {
        // 기존 hreflang 태그 제거
        const existingHreflang = document.querySelectorAll('link[hreflang]');
        existingHreflang.forEach(tag => tag.remove());
        
        // 새로운 hreflang 태그 생성
        Object.entries(this.supportedLanguages).forEach(([langCode, langInfo]) => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = langCode;
            link.href = `${this.baseUrl}${this.getLanguageUrl(langCode)}`;
            document.head.appendChild(link);
        });
        
        // x-default 태그 추가 (한국어 기본)
        const defaultLink = document.createElement('link');
        defaultLink.rel = 'alternate';
        defaultLink.hreflang = 'x-default';
        defaultLink.href = `${this.baseUrl}/`;
        document.head.appendChild(defaultLink);
        
        this.log(`🌐 hreflang 태그 생성 완료: ${Object.keys(this.supportedLanguages).length + 1}개`);
    }
    
    /**
     * canonical URL 업데이트
     */
    updateCanonicalUrl(language) {
        // 기존 canonical 태그 찾기 또는 생성
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        
        canonical.href = `${this.baseUrl}${this.getLanguageUrl(language)}`;
        this.log(`🔗 Canonical URL 업데이트: ${canonical.href}`);
    }
    
    /**
     * 메타 태그 생성/업데이트 헬퍼 함수
     */
    updateMetaTag(attribute, value, content) {
        if (!content) return;
        
        // 기존 태그 찾기
        let meta = document.querySelector(`meta[${attribute}="${value}"]`);
        
        // 없으면 새로 생성
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, value);
            document.head.appendChild(meta);
        }
        
        // content 업데이트
        meta.setAttribute('content', content);
    }
    
    /**
     * 언어별 URL 경로 생성
     */
    getLanguageUrl(language) {
        if (language === 'ko') {
            return '/'; // 한국어는 기본 경로
        }
        
        const currentPath = this.currentPage === 'index' ? '' : `/${this.currentPage}`;
        return `/${language}${currentPath}`;
    }
    
    /**
     * Open Graph locale 변환
     */
    getOGLocale(language) {
        const localeMap = {
            'ko': 'ko_KR',
            'en': 'en_US',
            'zh': 'zh_CN',
            'vi': 'vi_VN',
            'ja': 'ja_JP',
            'th': 'th_TH',
            'id': 'id_ID'
        };
        
        return localeMap[language] || 'ko_KR';
    }
    
    /**
     * 구조화된 데이터 (JSON-LD) 생성
     */
    generateStructuredData(meta, language) {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "KANGWOON",
            "alternateName": "강운",
            "url": this.baseUrl,
            "logo": `${this.baseUrl}/images/logo.png`,
            "description": meta.description,
            "sameAs": [
                // 소셜 미디어 링크들 (실제 계정이 있다면)
                // "https://www.linkedin.com/company/KANGWOON",
                // "https://twitter.com/KANGWOON_official"
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+82-10-4063-9062",
                "contactType": "customer service",
                "email": "kangwooncp@gmail.com",
                "availableLanguage": Object.keys(this.supportedLanguages)
            },
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "KR",
                "addressLocality": "Seoul",
                "addressRegion": "Gangnam-gu"
            },
            "founder": {
                "@type": "Person",
                "name": "KANGWOON Team"
            },
            "foundingDate": "2024",
            "industry": "Artificial Intelligence",
            "keywords": meta.keywords
        };
        
        // 기존 JSON-LD 제거
        const existingLD = document.querySelector('script[type="application/ld+json"]');
        if (existingLD) {
            existingLD.remove();
        }
        
        // 새로운 JSON-LD 추가
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData, null, 2);
        document.head.appendChild(script);
        
        this.log(`📊 구조화된 데이터 생성 완료: ${language}`);
    }
    
    /**
     * 디버그 로그
     */
    log(message) {
        if (this.debug) {
            console.log(`[SEOMeta] ${message}`);
        }
    }
}

// 전역 인스턴스 생성
window.SEOMetaManager = new SEOMetaManager();

// 언어 변경 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏷️ SEO 메타 태그 시스템이 준비되었습니다!');
    
    // 현재 언어로 메타 태그 초기화
    const currentLang = window.currentLang || document.documentElement.getAttribute('lang') || 'ko';
    window.SEOMetaManager.updateMetaTags(currentLang);
});

// 언어 변경 시 메타 태그 업데이트 (i18n.js와 연동)
window.addEventListener('languageChanged', function(event) {
    if (event.detail && event.detail.language) {
        window.SEOMetaManager.updateMetaTags(event.detail.language);
    }
});
