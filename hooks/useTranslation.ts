import i18n from '@/i18n';
import { useLanguageStore } from '@/store/language';
import { useCallback } from 'react';

export const useTranslation = () => {
  // Subscribe to language changes to trigger re-renders
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const t = useCallback(
    (key: string, options?: Record<string, string | number>) => {
      return i18n.t(key, options);
    },
    [currentLanguage]
  );

  return { t, currentLanguage };
};

export default useTranslation;
