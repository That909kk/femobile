import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, APP_CONFIG } from '../constants';

type SupportedLanguage = 'vi' | 'en';

interface LanguageHook {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  loading: boolean;
}

export const useLanguage = (): LanguageHook => {
  const [language, setCurrentLanguage] = useState<SupportedLanguage>(APP_CONFIG.DEFAULT_LANGUAGE as SupportedLanguage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await SecureStore.getItemAsync(STORAGE_KEYS.LANGUAGE);
      if (savedLanguage && APP_CONFIG.SUPPORTED_LANGUAGES.includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage as SupportedLanguage);
      }
    } catch (error) {
      console.warn('Failed to load saved language:', error);
    } finally {
      setLoading(false);
    }
  };

  const setLanguage = async (lang: SupportedLanguage) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.LANGUAGE, lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.warn('Failed to save language:', error);
    }
  };

  return {
    language,
    setLanguage,
    loading,
  };
};
