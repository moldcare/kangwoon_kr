/**
 * 킨프리 웹사이트 - 지역별 자동 언어 감지 시스템 (연동 버전)
 * i18n.js와 완벽 연동되는 버전
 */

class GeoLanguageDetector {
    constructor() {
        // 지원 언어 목록 (i18n.js와 동일)
        this.supportedLanguages = ['ko', 'en', 'zh', 'vi', 'ja', 'th', 'id'];
        
        // 기본 언어 (i18n.js와 동일)
        this.defaultLanguage = 'ko';
        
        // i18n.js localStorage 키와 동일
        this.storageKey = 'kinfri:lang';
        
        // 지역 감지 캐시 키
        this.geoStorageKey = 'kinfri:geo_cache';
        this.geoCacheExpiry = 24 * 60 * 60 * 1000; // 24시간
        
        // 지역별 언어 매핑
        this.regionLanguageMap = {
            'KR': 'ko',  // 한국
            'CN': 'zh',  // 중국
            'VN': 'vi',  // 베트남
            'JP': 'ja',  // 일본
            'TH': 'th',  // 태국
            'ID': 'id',  // 인도네시아
            // 영어권 국가들
            'US': 'en', 'GB': 'en', 'AU': 'en', 'CA': 'en',
            'SG': 'en', 'MY': 'en', 'PH': 'en', 'IN': 'en'
        };
        
        // 브라우저 언어 매핑
        this.browserLanguageMap = {
            'ko': 'ko', 'ko-KR': 'ko',
            'en': 'en', 'en-US': 'en', 'en-GB': 'en', 'en-AU': 'en', 'en-CA': 'en',
            'zh': 'zh', 'zh-CN': 'zh', 'zh-TW': 'zh', 'zh-HK': 'zh',
            'vi': 'vi', 'vi-VN': 'vi',
            'ja': 'ja', 'ja-JP': 'ja',
            'th': 'th', 'th-TH': 'th',
            'id': 'id', 'id-ID': 'id'
        };
        
        this.debug = true;
    }
    
    /**
     * 메인 언어 감지 및 i18n.js 연동
     */
    async detectAndApplyLanguage() {
        this.log('🌍 지역별 언어 감지 및 i18n 연동 시작...');
        
        try {
            const detectedLanguage = await this.detectLanguage();
            
            // i18n.js의 updateLanguage 함수 호출하여 적용
            if (typeof window.updateLanguage === 'function') {
                await window.updateLanguage(detectedLanguage);
                this.log(`✅ i18n.js 연동 완료: ${detectedLanguage}`);
            } else {
                // i18n.js가 아직 로드되지 않은 경우, 이벤트로 대기
                this.waitForI18nAndApply(detectedLanguage);
            }
            
            return detectedLanguage;
        } catch (error) {
            this.log(`❌ 언어 감지/적용 오류: ${error.message}`);
            return this.defaultLanguage;
        }
    }
    
    /**
     * i18n.js 로드 대기 후 언어 적용
     */
    waitForI18nAndApply(language) {
        const checkI18n = () => {
            if (typeof window.updateLanguage === 'function') {
                window.updateLanguage(language);
                this.log(`✅ i18n.js 지연 연동 완료: ${language}`);
            } else {
                setTimeout(checkI18n, 100);
            }
        };
        checkI18n();
    }
    
    /**
     * 언어 감지 로직 (우선순위 적용)
     */
    async detectLanguage() {
        // 1. URL 파라미터 확인 (최우선)
        const urlLang = this.getLanguageFromURL();
        if (urlLang) {
            this.log(`✅ URL 파라미터: ${urlLang}`);
            return urlLang;
        }
        
        // 2. localStorage 확인 (i18n.js와 동일한 키 사용)
        const storedLang = this.getStoredLanguage();
        if (storedLang) {
            this.log(`✅ 저장된 선호도: ${storedLang}`);
            return storedLang;
        }
        
        // 3. 지역 기반 감지 (IP API - 다음 단계에서 구현)
        const geoLang = await this.getLanguageFromGeolocation();
        if (geoLang) {
            this.log(`✅ 지역 기반: ${geoLang}`);
            return geoLang;
        }
        
        // 4. 브라우저 언어
        const browserLang = this.getLanguageFromBrowser();
        if (browserLang) {
            this.log(`✅ 브라우저 언어: ${browserLang}`);
            return browserLang;
        }
        
        // 5. 기본값
        this.log(`✅ 기본 언어: ${this.defaultLanguage}`);
        return this.defaultLanguage;
    }
    
    getLanguageFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const lang = urlParams.get('lang');
        return (lang && this.supportedLanguages.includes(lang)) ? lang : null;
    }
    
    getStoredLanguage() {
        try {
            // i18n.js와 동일한 localStorage 키 사용
            const stored = localStorage.getItem(this.storageKey);
            return (stored && this.supportedLanguages.includes(stored)) ? stored : null;
        } catch (error) {
            return null;
        }
    }
    
    async getLanguageFromGeolocation() {
        try {
            // 1. 캐시된 지역 정보 확인
            const cachedGeo = this.getCachedGeolocation();
            if (cachedGeo) {
                this.log(`✅ 캐시된 지역 정보 사용: ${cachedGeo.country} → ${cachedGeo.language}`);
                return cachedGeo.language;
            }
            
            this.log('🌐 IP 기반 지역 감지 시작...');
            
            // 2. API 호출로 실시간 지역 감지
            const countryCode = await this.fetchUserCountry();
            if (!countryCode) {
                return null;
            }
            
            // 3. 지역별 언어 매핑
            const mappedLanguage = this.regionLanguageMap[countryCode.toUpperCase()];
            const resultLanguage = mappedLanguage || 'en'; // 지원하지 않는 지역은 영어
            
            // 4. 결과 캐싱
            this.cacheGeolocation(countryCode, resultLanguage);
            
            this.log(`✅ 지역 감지 완료: ${countryCode} → ${resultLanguage}`);
            return resultLanguage;
            
        } catch (error) {
            this.log(`❌ 지역 감지 전체 오류: ${error.message}`);
            return null;
        }
    }
    
    /**
     * 캐시된 지역 정보 가져오기
     */
    getCachedGeolocation() {
        try {
            const cached = localStorage.getItem(this.geoStorageKey);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            const now = Date.now();
            
            // 캐시 만료 확인
            if (now - data.timestamp > this.geoCacheExpiry) {
                localStorage.removeItem(this.geoStorageKey);
                return null;
            }
            
            return data;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * 지역 정보 캐싱
     */
    cacheGeolocation(country, language) {
        try {
            const data = {
                country,
                language,
                timestamp: Date.now()
            };
            localStorage.setItem(this.geoStorageKey, JSON.stringify(data));
            this.log(`💾 지역 정보 캐시 저장: ${country} → ${language}`);
        } catch (error) {
            this.log(`❌ 캐시 저장 오류: ${error.message}`);
        }
    }
    
    /**
     * 실제 지역 감지 API 호출
     */
    async fetchUserCountry() {
        const apis = [
            {
                name: 'ipapi.co',
                url: 'https://ipapi.co/json/',
                parser: (data) => data.country_code,
                timeout: 5000
            },
            {
                name: 'ip-api.com',
                url: 'https://ip-api.com/json/',
                parser: (data) => data.countryCode,
                timeout: 5000
            },
            {
                name: 'ipwhois.app',
                url: 'https://ipwhois.app/json/',
                parser: (data) => data.country_code,
                timeout: 5000
            }
        ];
        
        for (const api of apis) {
            try {
                this.log(`🔄 ${api.name} API 호출 중...`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), api.timeout);
                
                const response = await fetch(api.url, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    this.log(`❌ ${api.name} 응답 오류: ${response.status}`);
                    continue;
                }
                
                const data = await response.json();
                const countryCode = api.parser(data);
                
                if (countryCode && typeof countryCode === 'string') {
                    this.log(`✅ ${api.name} 성공: ${countryCode}`);
                    return countryCode.toUpperCase();
                }
                
            } catch (apiError) {
                this.log(`❌ ${api.name} 오류: ${apiError.message}`);
                continue;
            }
        }
        
        this.log('❌ 모든 지역 감지 API 실패');
        return null;
    }
    
    getLanguageFromBrowser() {
        try {
            const languages = navigator.languages || [navigator.language];
            
            for (const lang of languages) {
                // 정확한 매핑 먼저 확인
                const mappedLang = this.browserLanguageMap[lang.toLowerCase()];
                if (mappedLang && this.supportedLanguages.includes(mappedLang)) {
                    return mappedLang;
                }
                
                // 주 언어 코드 추출
                const primaryLang = lang.split('-')[0].toLowerCase();
                if (this.supportedLanguages.includes(primaryLang)) {
                    return primaryLang;
                }
            }
        } catch (error) {
            this.log(`브라우저 언어 감지 오류: ${error.message}`);
        }
        return null;
    }
    
    log(message) {
        if (this.debug) {
            console.log(`[GeoLanguage] ${message}`);
        }
    }
}

// 전역 인스턴스 생성
window.GeoLanguageDetector = new GeoLanguageDetector();

// i18n.js보다 먼저 실행되도록 DOMContentLoaded 이벤트에서 즉시 실행
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 지역별 언어 감지 시스템 시작!');
    
    // 지역 기반 언어 감지 및 i18n.js 연동
    await window.GeoLanguageDetector.detectAndApplyLanguage();
});
