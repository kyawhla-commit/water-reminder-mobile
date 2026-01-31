import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

import en from './translations/en.json';
import my from './translations/my.json';

const i18n = new I18n({
  en,
  my,
});

// Set default locale
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Language configuration
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', flag: '🇲🇲' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const LANGUAGE_KEY = 'app_language';

// Initialize language from storage or device locale
export const initializeLanguage = async (): Promise<LanguageCode> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && LANGUAGES.some((l) => l.code === savedLanguage)) {
      i18n.locale = savedLanguage;
      return savedLanguage as LanguageCode;
    }

    // Try to match device locale
    const locales = Localization.getLocales();
    const deviceLocale = locales[0]?.languageCode ?? 'en';
    if (LANGUAGES.some((l) => l.code === deviceLocale)) {
      i18n.locale = deviceLocale;
      await AsyncStorage.setItem(LANGUAGE_KEY, deviceLocale);
      return deviceLocale as LanguageCode;
    }

    // Default to English
    i18n.locale = 'en';
    return 'en';
  } catch {
    i18n.locale = 'en';
    return 'en';
  }
};

// Change language
export const setLanguage = async (code: LanguageCode): Promise<void> => {
  i18n.locale = code;
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
};

// Get current language
export const getCurrentLanguage = (): LanguageCode => {
  return i18n.locale as LanguageCode;
};

// Get language info
export const getLanguageInfo = (code: LanguageCode) => {
  return LANGUAGES.find((l) => l.code === code);
};

export { i18n };
export default i18n;
