(function () {
  const STORAGE_KEY = 'kangwoon:lang';
  const DEFAULT_LANG = document.documentElement.getAttribute('lang') || 'ko';
  const LOCALE_BASE = '/locales';
  const selects = new Set();
  const dropdownControllers = new Set();
  const cache = new Map();
  const LANG_META = {
    ko: { flagClass: 'fi fi-kr', fallback: 'KR' },
    en: { flagClass: 'fi fi-us', fallback: 'EN' },
    zh: { flagClass: 'fi fi-cn', fallback: 'ZH' },
    vi: { flagClass: 'fi fi-vn', fallback: 'VI' },
    ja: { flagClass: 'fi fi-jp', fallback: 'JA' },
    th: { flagClass: 'fi fi-th', fallback: 'TH' },
    id: { flagClass: 'fi fi-id', fallback: 'ID' }
  };
  let currentLang = DEFAULT_LANG;

  function getLangMeta(lang) {
    return LANG_META[lang] || null;
  }

  function applyFlag(element, lang) {
    if (!element) {
      return;
    }

    const meta = getLangMeta(lang);
    const classes = ['language-flag'];

    if (meta && meta.flagClass) {
      classes.push(meta.flagClass);
      element.textContent = '';
      element.removeAttribute('data-flag-fallback');
    } else {
      classes.push('language-flag--fallback');
      const fallback = (meta && meta.fallback) || lang.toUpperCase();
      element.textContent = fallback;
      element.setAttribute('data-flag-fallback', fallback);
    }

    element.className = classes.join(' ');
  }

  function resolvePath(data, path) {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), data);
  }

  function toAttrName(datasetKey) {
    return datasetKey
      .replace(/^i18n/, '')
      .replace(/^[A-Z]/, match => match.toLowerCase())
      .replace(/[A-Z]/g, match => '-' + match.toLowerCase());
  }

  function applyTranslations(translations) {
    console.log('[i18n] Applying translations, current lang:', currentLang);
    document.documentElement.setAttribute('lang', currentLang);

    const elements = document.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-placeholder], [data-i18n-title], [data-i18n-ariaLabel]');
    console.log('[i18n] Found', elements.length, 'elements to translate');
    elements.forEach(el => {
      const dataset = el.dataset;

      if (dataset.i18n) {
        const value = resolvePath(translations, dataset.i18n);
        if (value !== null) {
          el.textContent = value;
        }
      }

      if (dataset.i18nHtml) {
        const value = resolvePath(translations, dataset.i18nHtml);
        if (value !== null) {
          el.innerHTML = value;
        }
      }

      Object.keys(dataset).forEach(key => {
        if (key === 'i18n' || key === 'i18nHtml') return;
        if (!key.startsWith('i18n')) return;
        const attrName = toAttrName(key);
        const translationKey = dataset[key];
        const value = resolvePath(translations, translationKey);
        if (value !== null) {
          el.setAttribute(attrName, value);
        }
      });
    });
  }

  async function loadTranslations(lang) {
    if (cache.has(lang)) {
      return cache.get(lang);
    }

    const response = await fetch(`${LOCALE_BASE}/${lang}.json`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load locale: ${lang}`);
    }
    const data = await response.json();
    cache.set(lang, data);
    return data;
  }

  // 모든 번역 데이터를 저장할 전역 객체
  window.translations = window.translations || {};

  async function updateLanguage(lang) {
    console.log('[i18n] Switching to language:', lang);
    try {
      const translations = await loadTranslations(lang);
      console.log('[i18n] Loaded translations for', lang, ':', translations);
      currentLang = lang;
      localStorage.setItem(STORAGE_KEY, lang);
      
      // 현재 언어의 번역 데이터를 전역 객체에 저장
      window.translations[lang] = translations;
      window.currentLang = lang;
      
      // 전역 i18n 객체 생성 (시뮬레이션 호환성)
      window.i18n = {
        t: function(key) {
          return resolvePath(translations, key) || key;
        },
        currentLang: lang,
        updateContent: function(element) {
          if (element) {
            const elements = element.querySelectorAll('[data-i18n]');
            elements.forEach(el => {
              const key = el.dataset.i18n;
              const value = resolvePath(translations, key);
              if (value !== null) {
                el.textContent = value;
              }
            });
          }
        }
      };
      
      selects.forEach(select => {
        if (select.value !== lang) {
          select.value = lang;
        }
      });

      dropdownControllers.forEach(controller => {
        controller.update(lang);
        if (typeof controller.close === 'function') {
          controller.close();
        }
      });

      applyTranslations(translations);
      
      // SEO 메타 태그 업데이트 (새로 추가)
      if (window.SEOMetaManager && typeof window.SEOMetaManager.updateMetaTags === 'function') {
        window.SEOMetaManager.updateMetaTags(lang);
      }
      
      // 법적 문서 링크 업데이트 (새로 추가)
      if (typeof window.updateLegalLinks === 'function') {
        window.updateLegalLinks(lang);
      }
      
      // 언어 변경 이벤트 발생 (다른 시스템에서 감지 가능)
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: lang, translations: translations }
      }));
    } catch (error) {
      console.error('[i18n] failed to switch language', error);
    }
  }

  function initSelect(select) {
    selects.add(select);
    select.addEventListener('change', event => {
      const value = event.target.value;
      if (value && value !== currentLang) {
        updateLanguage(value);
      }
    });
  }

  function initLanguageDropdown(dropdown) {
    if (!dropdown || dropdown.dataset.langDropdownInit === 'true') {
      return;
    }

    const selectId = dropdown.dataset.linkedSelect;
    if (!selectId) {
      return;
    }

    const select = document.getElementById(selectId);
    if (!select) {
      console.warn('[i18n] dropdown linked select not found:', selectId);
      return;
    }
    // Use native select for in-app browsers with dropdown issues
    const userAgent = navigator.userAgent || '';
    const shouldUseNativeSelect = /KAKAOTALK|FBAV|FBAN|FBIOS|Line|Instagram|Telegram/i.test(userAgent);

    if (shouldUseNativeSelect) {
      dropdown.dataset.langDropdownInit = 'true';
      dropdown.style.display = 'none';
      select.removeAttribute('data-lang-select-hidden');
      return;
    }

    const toggle = dropdown.querySelector('.language-dropdown-toggle');
    const list = dropdown.querySelector('.language-dropdown-menu');
    const flagEl = dropdown.querySelector('[data-lang-dropdown-flag]');
    const labelEl = dropdown.querySelector('[data-lang-dropdown-label]');

    if (!toggle || !list || !flagEl || !labelEl) {
      console.warn('[i18n] dropdown missing required elements');
      return;
    }

    dropdown.dataset.langDropdownInit = 'true';
    dropdown.dataset.langDropdownReady = 'true';
    select.dataset.langSelectHidden = 'true';

    const items = [];
    let activeIndex = -1;

    function buildMenu() {
      list.innerHTML = '';
      items.length = 0;

      Array.from(select.options).forEach(option => {
        const value = option.value;
        if (!value) {
          return;
        }

        const item = document.createElement('li');
        item.className = 'language-option';
        item.setAttribute('role', 'option');
        item.setAttribute('data-value', value);
        item.setAttribute('aria-selected', 'false');
        item.setAttribute('tabindex', '-1');

        const flagSpan = document.createElement('span');
        flagSpan.className = 'language-flag';
        flagSpan.setAttribute('aria-hidden', 'true');
        applyFlag(flagSpan, value);

        const labelSpan = document.createElement('span');
        labelSpan.className = 'language-name';
        labelSpan.textContent = option.textContent;

        item.append(flagSpan, labelSpan);
        list.appendChild(item);
        items.push(item);

        item.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          handleSelect(value);
        });

        item.addEventListener('keydown', event => {
          handleItemKeydown(event, value);
        });
      });
    }

    function updateItemTabIndex() {
      items.forEach((item, index) => {
        item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
      });
    }

    function focusItem(index) {
      if (!items.length) {
        return;
      }

      if (index < 0) {
        index = items.length - 1;
      } else if (index >= items.length) {
        index = 0;
      }

      activeIndex = index;
      updateItemTabIndex();
      const target = items[index];
      if (target) {
        target.focus();
      }
    }

    function openDropdown() {
      if (dropdown.classList.contains('open')) {
        return;
      }

      dropdown.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onDocumentClick);
      document.addEventListener('keydown', onDocumentKeydown);

      const currentIndex = items.findIndex(item => item.dataset.value === select.value);
      const targetIndex = currentIndex !== -1 ? currentIndex : 0;

      setTimeout(() => focusItem(targetIndex), 0);
    }

    function closeDropdown(shouldFocusToggle = false) {
      if (!dropdown.classList.contains('open')) {
        return;
      }

      dropdown.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onDocumentKeydown);
      activeIndex = -1;
      updateItemTabIndex();

      if (shouldFocusToggle) {
        toggle.focus();
      }
    }

    function onDocumentClick(event) {
      if (!dropdown.contains(event.target)) {
        closeDropdown();
      }
    }

    function onDocumentKeydown(event) {
      if (event.key === 'Escape') {
        closeDropdown(true);
      }
    }

    function handleSelect(value) {
      closeDropdown();
      if (select.value !== value) {
        select.value = value;
        updateDropdownUI(value);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        updateDropdownUI(value);
      }
    }

    function handleToggleKeydown(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (dropdown.classList.contains('open')) {
          closeDropdown();
        } else {
          openDropdown();
        }
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!dropdown.classList.contains('open')) {
          openDropdown();
        }
      }
    }

    function handleItemKeydown(event, value) {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleSelect(value);
          break;
        case 'ArrowDown':
          event.preventDefault();
          focusItem(activeIndex + 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusItem(activeIndex - 1);
          break;
        case 'Home':
          event.preventDefault();
          focusItem(0);
          break;
        case 'End':
          event.preventDefault();
          focusItem(items.length - 1);
          break;
        case 'Escape':
          event.preventDefault();
          closeDropdown(true);
          break;
        default:
          break;
      }
    }

    function updateDropdownUI(lang) {
      const option = Array.from(select.options).find(opt => opt.value === lang);
      const label = option ? option.textContent : lang;

      labelEl.textContent = label;
      applyFlag(flagEl, lang);

      items.forEach(item => {
        const isSelected = item.dataset.value === lang;
        item.classList.toggle('selected', isSelected);
        item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
    }

    function toggleDropdown(event) {
      event.preventDefault();
      event.stopPropagation();
      if (dropdown.classList.contains('open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }

    dropdown.addEventListener('focusout', event => {
      if (!dropdown.contains(event.relatedTarget)) {
        closeDropdown();
      }
    });

    buildMenu();
    updateDropdownUI(select.value || (select.options[0] && select.options[0].value) || currentLang);
    updateItemTabIndex();

    toggle.addEventListener('click', toggleDropdown);
    toggle.addEventListener('keydown', handleToggleKeydown);

    dropdownControllers.add({
      element: dropdown,
      update: updateDropdownUI,
      close: closeDropdown
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('[data-lang-select]').forEach(initSelect);
    document.querySelectorAll('[data-lang-dropdown]').forEach(initLanguageDropdown);

    const saved = localStorage.getItem(STORAGE_KEY);
    const initialLang = saved || DEFAULT_LANG;

    selects.forEach(select => {
      if (select.value !== initialLang) {
        select.value = initialLang;
      }
    });

    // 한국어 번역을 미리 로드 (시뮬레이션에서 필요)
    if (initialLang !== 'ko') {
      try {
        const koTranslations = await loadTranslations('ko');
        window.translations['ko'] = koTranslations;
      } catch (error) {
        console.warn('[i18n] failed to preload Korean translations', error);
      }
    }

    updateLanguage(initialLang);
  });
})();


