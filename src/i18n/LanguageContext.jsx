import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Supported languages
export const SUPPORTED_LANGUAGES = ['de', 'en'];
export const DEFAULT_LANGUAGE = 'en'; // Fallback if browser language not supported

/**
 * Detect browser language and return supported language code
 */
function detectBrowserLanguage() {
  // Get browser language (e.g., 'de-DE', 'en-US', 'en')
  const browserLang = navigator.language || navigator.userLanguage || DEFAULT_LANGUAGE;
  
  // Extract primary language code (e.g., 'de' from 'de-DE')
  const primaryLang = browserLang.split('-')[0].toLowerCase();
  
  // Check if supported, otherwise fallback to English
  if (SUPPORTED_LANGUAGES.includes(primaryLang)) {
    return primaryLang;
  }
  
  return DEFAULT_LANGUAGE;
}

// Create context
const LanguageContext = createContext(null);

/**
 * Language Provider Component
 * Wraps the app and provides language state and translation function
 */
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // First check localStorage for user preference
    const stored = localStorage.getItem('ai_readiness_language');
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }
    // Otherwise detect from browser
    return detectBrowserLanguage();
  });
  
  const [translations, setTranslations] = useState({ de: {}, en: {} });
  const [isLoading, setIsLoading] = useState(true);

  // Load translations on mount
  useEffect(() => {
    async function loadTranslations() {
      try {
        const [deModule, enModule] = await Promise.all([
          import('./translations/de.js'),
          import('./translations/en.js'),
        ]);
        setTranslations({
          de: deModule.default,
          en: enModule.default,
        });
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTranslations();
  }, []);

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ai_readiness_language', language);
  }, [language]);

  /**
   * Get nested value from object using dot notation
   * e.g., getNestedValue(obj, 'common.buttons.save')
   */
  const getNestedValue = useCallback((obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }, []);

  /**
   * Translation function
   * @param {string} key - Dot-notation key (e.g., 'common.buttons.save')
   * @param {object} params - Optional interpolation parameters
   * @returns {string} Translated string
   */
  const t = useCallback((key, params = {}) => {
    // Try current language first
    let value = getNestedValue(translations[language], key);
    
    // Fallback to English if not found
    if (value === undefined && language !== 'en') {
      value = getNestedValue(translations.en, key);
    }
    
    // If still not found, return the key itself
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    // Handle interpolation (e.g., "Hello {{name}}" with params { name: 'World' })
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }
    
    return value;
  }, [language, translations, getNestedValue]);

  /**
   * Get a whole section of translations (for arrays/objects)
   * @param {string} key - Dot-notation key
   * @returns {any} Translation value (could be object, array, or string)
   */
  const tSection = useCallback((key) => {
    let value = getNestedValue(translations[language], key);
    
    // Fallback to English if not found
    if (value === undefined && language !== 'en') {
      value = getNestedValue(translations.en, key);
    }
    
    return value;
  }, [language, translations, getNestedValue]);

  /**
   * Toggle between languages
   */
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'de' ? 'en' : 'de');
  }, []);

  /**
   * Set specific language
   */
  const changeLanguage = useCallback((newLang) => {
    if (SUPPORTED_LANGUAGES.includes(newLang)) {
      setLanguage(newLang);
    }
  }, []);

  const value = {
    language,
    setLanguage: changeLanguage,
    toggleLanguage,
    t,
    tSection,
    isLoading,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to use language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Hook for just the translation function (convenience)
 */
export function useTranslation() {
  const { t, tSection, language } = useLanguage();
  return { t, tSection, language };
}

export default LanguageContext;