import {
    BeverageLogEntry,
    BeverageType,
    DailyBeverageSummary,
    deleteBeverageEntry,
    getAllBeverages,
    getBeverageLog,
    getDailySummary,
    getFavoriteBeverages,
    logBeverage,
    toggleFavorite,
} from '@/services/beverages';
import { useCallback, useEffect, useState } from 'react';

export const useBeverages = () => {
  const [loading, setLoading] = useState(true);
  const [beverages, setBeverages] = useState<BeverageType[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [todayLog, setTodayLog] = useState<BeverageLogEntry[]>([]);
  const [summary, setSummary] = useState<DailyBeverageSummary | null>(null);

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [allBeverages, favs, log, dailySummary] = await Promise.all([
        getAllBeverages(),
        getFavoriteBeverages(),
        getBeverageLog(today),
        getDailySummary(today),
      ]);

      setBeverages(allBeverages);
      setFavorites(favs);
      setTodayLog(log);
      setSummary(dailySummary);
    } catch (error) {
      console.error('Error loading beverage data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addBeverage = useCallback(async (beverageId: string, amount: number) => {
    try {
      const entry = await logBeverage(beverageId, amount);
      if (entry) {
        await loadData(); // Refresh data
        return entry;
      }
      return null;
    } catch (error) {
      console.error('Error adding beverage:', error);
      return null;
    }
  }, [loadData]);

  const removeBeverage = useCallback(async (entryId: string) => {
    try {
      const success = await deleteBeverageEntry(entryId);
      if (success) {
        await loadData(); // Refresh data
      }
      return success;
    } catch (error) {
      console.error('Error removing beverage:', error);
      return false;
    }
  }, [loadData]);

  const toggleFav = useCallback(async (beverageId: string) => {
    try {
      const isNowFavorite = await toggleFavorite(beverageId);
      const newFavorites = await getFavoriteBeverages();
      setFavorites(newFavorites);
      return isNowFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }, []);

  const favoriteBeverages = beverages.filter(b => favorites.includes(b.id));

  return {
    loading,
    beverages,
    favorites,
    favoriteBeverages,
    todayLog,
    summary,
    effectiveHydration: summary?.effectiveHydration || 0,
    totalConsumed: summary?.totalConsumed || 0,
    hydrationEfficiency: summary?.hydrationEfficiency || 100,
    addBeverage,
    removeBeverage,
    toggleFavorite: toggleFav,
    refresh: loadData,
  };
};
