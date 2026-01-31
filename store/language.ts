import type { LanguageCode } from '@/i18n';
import i18n, { initializeLanguage, LANGUAGES } from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface LanguageState {
  currentLanguage: LanguageCode;
  isInitialized: boolean;
  setLanguage: (code: LanguageCode) => void;
  initializeLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      currentLanguage: 'en',
      isInitialized: false,

      setLanguage: (code: LanguageCode) => {
        i18n.locale = code;
        set({ currentLanguage: code });
      },

      initializeLanguage: async () => {
        const language = await initializeLanguage();
        set({ currentLanguage: language, isInitialized: true });
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ currentLanguage: state.currentLanguage }),
    }
  )
);

export { LANGUAGES, type LanguageCode };
