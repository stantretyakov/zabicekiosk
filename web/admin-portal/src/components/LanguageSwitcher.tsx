import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, Language } from '../lib/i18n';
import styles from './LanguageSwitcher.module.css';

const languages = [
  { code: 'ru' as Language, name: 'Русский', flag: '🇷🇺' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={styles.languageSwitcher} ref={dropdownRef}>
      <button
        className={`${styles.currentLanguage} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <span className={styles.languageFlag}>{currentLang.flag}</span>
        <span className={styles.languageCode}>{currentLang.code}</span>
        <span className={styles.dropdownArrow}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`${styles.languageOption} ${
                lang.code === language ? styles.active : ''
              }`}
              onClick={() => handleLanguageChange(lang.code)}
              role="option"
              aria-selected={lang.code === language}
            >
              <span className={styles.optionFlag}>{lang.flag}</span>
              <span className={styles.optionText}>{lang.name}</span>
              <span className={styles.optionCode}>{lang.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}