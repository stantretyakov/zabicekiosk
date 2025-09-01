export type Language = 'ru' | 'en';

export interface Translations {
  // Pass Card
  swimmingPass: string;
  singleVisit: string;
  visits: string;
  planSize: string;
  used: string;
  expires: string;
  daysLeft: string;
  lastVisit: string;
  scanAtKiosk: string;
  scanHint: string;
  validUntil: string;
  
  // Status
  active: string;
  expired: string;
  expiringSoon: string;
  noVisitsLeft: string;
  
  // Contact
  needHelp: string;
  contactDescription: string;
  contactAdmin: string;
  
  // News & Updates
  newsUpdates: string;
  validUntilDate: string;
  
  // Content Types
  information: string;
  promotion: string;
  announcement: string;
  warning: string;
  special: string;
  
  // Loading & Errors
  loadingPass: string;
  unableToLoadPass: string;
  noPassDataAvailable: string;
  
  // Common
  language: string;
}

const translations: Record<Language, Translations> = {
  ru: {
    // Pass Card
    swimmingPass: 'Абонемент на плавание',
    singleVisit: 'Разовое посещение',
    visits: 'посещений',
    planSize: 'План',
    used: 'Использовано',
    expires: 'Истекает',
    daysLeft: 'Дней осталось',
    lastVisit: 'Последнее посещение',
    scanAtKiosk: 'Сканировать в киоске',
    scanHint: 'Покажите этот QR-код в плавательном центре для регистрации',
    validUntil: 'Действителен до',
    
    // Status
    active: 'Активный',
    expired: 'Истёк',
    expiringSoon: 'Истекает скоро',
    noVisitsLeft: 'Посещений не осталось',
    
    // Contact
    needHelp: 'Нужна помощь?',
    contactDescription: 'Есть вопросы по абонементу или нужна помощь?',
    contactAdmin: 'Связаться с администратором',
    
    // News & Updates
    newsUpdates: 'Новости и обновления',
    validUntilDate: 'Действительно до',
    
    // Content Types
    information: 'Информация',
    promotion: 'Акция',
    announcement: 'Объявление',
    warning: 'Предупреждение',
    special: 'Специальное',
    
    // Loading & Errors
    loadingPass: 'Загрузка абонемента...',
    unableToLoadPass: 'Не удалось загрузить абонемент',
    noPassDataAvailable: 'Данные об абонементе недоступны',
    
    // Common
    language: 'Язык',
  },
  en: {
    // Pass Card
    swimmingPass: 'Swimming Pass',
    singleVisit: 'Single Visit',
    visits: 'visits',
    planSize: 'Plan Size',
    used: 'Used',
    expires: 'Expires',
    daysLeft: 'Days Left',
    lastVisit: 'Last Visit',
    scanAtKiosk: 'Scan at Kiosk',
    scanHint: 'Show this QR code at the swimming facility to check in',
    validUntil: 'Valid until',
    
    // Status
    active: 'Active',
    expired: 'Expired',
    expiringSoon: 'Expiring Soon',
    noVisitsLeft: 'No Visits Left',
    
    // Contact
    needHelp: 'Need Help?',
    contactDescription: 'Have questions about your pass or need assistance?',
    contactAdmin: 'Contact Admin',
    
    // News & Updates
    newsUpdates: 'News & Updates',
    validUntilDate: 'Valid until',
    
    // Content Types
    information: 'Information',
    promotion: 'Promotion',
    announcement: 'Announcement',
    warning: 'Warning',
    special: 'Special',
    
    // Loading & Errors
    loadingPass: 'Loading your pass...',
    unableToLoadPass: 'Unable to Load Pass',
    noPassDataAvailable: 'No pass data available',
    
    // Common
    language: 'Language',
  }
};

class I18nService {
  private currentLanguage: Language = 'ru'; // Default to Russian
  private listeners: Array<(language: Language) => void> = [];

  constructor() {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('parent-language') as Language;
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'en')) {
      this.currentLanguage = savedLanguage;
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language;
    localStorage.setItem('parent-language', language);
    this.notifyListeners();
  }

  getTranslations(): Translations {
    return translations[this.currentLanguage];
  }

  t(key: keyof Translations): string {
    return translations[this.currentLanguage][key];
  }

  subscribe(listener: (language: Language) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentLanguage));
  }
}

export const i18n = new I18nService();

// React hook for using translations
export function useTranslation() {
  const [language, setLanguage] = React.useState(i18n.getCurrentLanguage());

  React.useEffect(() => {
    return i18n.subscribe(setLanguage);
  }, []);

  return {
    t: i18n.t.bind(i18n),
    language,
    setLanguage: i18n.setLanguage.bind(i18n),
    translations: i18n.getTranslations(),
  };
}

// Import React for the hook
import React from 'react';