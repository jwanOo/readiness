import { useLanguage } from './LanguageContext';

/**
 * Language Switcher Component
 * A simple toggle button to switch between German and English
 */
export default function LanguageSwitcher({ className = '', style = {} }) {
  const { language, toggleLanguage, setLanguage, supportedLanguages } = useLanguage();

  // Flag emojis for visual representation
  const flags = {
    de: '🇩🇪',
    en: '🇬🇧',
  };

  const labels = {
    de: 'Deutsch',
    en: 'English',
  };

  return (
    <div 
      className={`language-switcher ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        ...style,
      }}
    >
      {/* Toggle Button Style */}
      <button
        onClick={toggleLanguage}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'transparent',
          border: '1px solid #ccc',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#333',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f5f5f5';
          e.currentTarget.style.borderColor = '#0066B3';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = '#ccc';
        }}
        title={language === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
      >
        <span style={{ fontSize: '16px' }}>{flags[language]}</span>
        <span>{labels[language]}</span>
        <span style={{ fontSize: '12px', opacity: 0.6 }}>↔</span>
      </button>
    </div>
  );
}

/**
 * Compact Language Switcher - Just flags
 */
export function LanguageSwitcherCompact({ className = '', style = {} }) {
  const { language, setLanguage, supportedLanguages } = useLanguage();

  const flags = {
    de: '🇩🇪',
    en: '🇬🇧',
  };

  return (
    <div 
      className={`language-switcher-compact ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        ...style,
      }}
    >
      {supportedLanguages.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          style={{
            padding: '4px 8px',
            background: language === lang ? '#e6f0ff' : 'transparent',
            border: language === lang ? '1px solid #0066B3' : '1px solid transparent',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '18px',
            opacity: language === lang ? 1 : 0.5,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (language !== lang) {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.background = '#f5f5f5';
            }
          }}
          onMouseLeave={(e) => {
            if (language !== lang) {
              e.currentTarget.style.opacity = '0.5';
              e.currentTarget.style.background = 'transparent';
            }
          }}
          title={lang === 'de' ? 'Deutsch' : 'English'}
        >
          {flags[lang]}
        </button>
      ))}
    </div>
  );
}

/**
 * Dropdown Language Switcher
 */
export function LanguageSwitcherDropdown({ className = '', style = {} }) {
  const { language, setLanguage, supportedLanguages } = useLanguage();

  const options = {
    de: { flag: '🇩🇪', label: 'Deutsch' },
    en: { flag: '🇬🇧', label: 'English' },
  };

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className={`language-switcher-dropdown ${className}`}
      style={{
        padding: '6px 10px',
        paddingRight: '28px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        background: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        ...style,
      }}
    >
      {supportedLanguages.map((lang) => (
        <option key={lang} value={lang}>
          {options[lang].flag} {options[lang].label}
        </option>
      ))}
    </select>
  );
}