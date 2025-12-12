import { useState, useEffect } from 'react';
import { useLanguageContext } from '../contexts/LanguageContext';
import { staticDataRegistry, StaticDataPageName } from '../static-data';

interface StaticData {
  [key: string]: any;
}

interface UseStaticDataResult {
  data: StaticData | null;
  loading: boolean;
  error: string | null;
}

export const useStaticData = (pageName: StaticDataPageName): UseStaticDataResult => {
  const [data, setData] = useState<StaticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguageContext();

  useEffect(() => {
    loadStaticData();
  }, [pageName, language]);

  const loadStaticData = () => {
    try {
      setLoading(true);
      setError(null);

      // Get static data from registry
      const pageData = staticDataRegistry[pageName];

      if (pageData && pageData[language as keyof typeof pageData]) {
        setData(pageData[language as keyof typeof pageData]);
      } else {
        // Fallback to Vietnamese if current language not available
        setData(pageData?.vi || pageData);
      }
    } catch (err) {
      console.warn(`Failed to load static data for ${pageName}:`, err);
      setError(`Không thể tải dữ liệu cho trang ${pageName}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
  };
};
