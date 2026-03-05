/**
 * i18n Module - Internationalization for AI Readiness Check
 * 
 * Usage:
 * 1. Wrap your app with LanguageProvider in App.jsx
 * 2. Use useLanguage() or useTranslation() hooks in components
 * 
 * Example:
 * ```jsx
 * import { useTranslation } from '../i18n';
 * 
 * function MyComponent() {
 *   const { t, language } = useTranslation();
 *   return <h1>{t('common.appName')}</h1>;
 * }
 * ```
 */

export { 
  LanguageProvider, 
  useLanguage, 
  useTranslation,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from './LanguageContext';

export { default as LanguageSwitcher } from './LanguageSwitcher';