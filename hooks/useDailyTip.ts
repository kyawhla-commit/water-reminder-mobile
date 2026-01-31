import { useCallback, useEffect, useState } from 'react';
import {
    DailyTip,
    formatTipForDisplay,
    getRandomTip,
    getTipsPreferences,
    getTodaysTip,
    isTipFavorite,
    saveTipsPreferences,
    TipsPreferences,
    toggleFavoriteTip,
} from '../services/dailyTips';

interface UseDailyTipOptions {
  language?: 'en' | 'my';
  autoLoad?: boolean;
}

interface UseDailyTipReturn {
  tip: DailyTip | null;
  formattedTip: ReturnType<typeof formatTipForDisplay> | null;
  isFavorite: boolean;
  isLoading: boolean;
  preferences: TipsPreferences | null;
  refreshTip: () => Promise<void>;
  shuffleTip: () => Promise<void>;
  toggleFavorite: () => Promise<void>;
  updatePreferences: (prefs: Partial<TipsPreferences>) => Promise<void>;
}

export const useDailyTip = ({
  language = 'en',
  autoLoad = true,
}: UseDailyTipOptions = {}): UseDailyTipReturn => {
  const [tip, setTip] = useState<DailyTip | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<TipsPreferences | null>(null);

  // Load today's tip
  const loadTip = useCallback(async () => {
    setIsLoading(true);
    try {
      const [todaysTip, prefs] = await Promise.all([
        getTodaysTip(language),
        getTipsPreferences(),
      ]);
      
      setTip(todaysTip);
      setPreferences(prefs);
      
      if (todaysTip) {
        const favorite = await isTipFavorite(todaysTip.id);
        setIsFavorite(favorite);
      }
    } catch (error) {
      console.error('Error loading daily tip:', error);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadTip();
    }
  }, [autoLoad, loadTip]);

  // Refresh tip (reload today's tip)
  const refreshTip = useCallback(async () => {
    await loadTip();
  }, [loadTip]);

  // Shuffle to a random tip
  const shuffleTip = useCallback(async () => {
    setIsLoading(true);
    try {
      const randomTip = await getRandomTip(tip?.id, language);
      if (randomTip) {
        setTip(randomTip);
        const favorite = await isTipFavorite(randomTip.id);
        setIsFavorite(favorite);
      }
    } catch (error) {
      console.error('Error shuffling tip:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tip?.id, language]);

  // Toggle favorite
  const toggleFavorite = useCallback(async () => {
    if (!tip) return;
    const newFavoriteStatus = await toggleFavoriteTip(tip.id);
    setIsFavorite(newFavoriteStatus);
  }, [tip]);

  // Update preferences
  const updatePreferences = useCallback(async (prefs: Partial<TipsPreferences>) => {
    await saveTipsPreferences(prefs);
    const updated = await getTipsPreferences();
    setPreferences(updated);
  }, []);

  // Format tip for display
  const formattedTip = tip ? formatTipForDisplay(tip, language) : null;

  return {
    tip,
    formattedTip,
    isFavorite,
    isLoading,
    preferences,
    refreshTip,
    shuffleTip,
    toggleFavorite,
    updatePreferences,
  };
};

export default useDailyTip;
