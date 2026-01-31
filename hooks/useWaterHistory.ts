import {
    calculateStats,
    DailyWaterRecord,
    getLastNDays,
    getWaterHistory,
    WaterStats,
} from '@/services/waterHistory';
import { useUserProfileStore } from '@/store/userProfile';
import { useCallback, useEffect, useState } from 'react';

export const useWaterHistory = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Record<string, DailyWaterRecord>>({});
  const [stats, setStats] = useState<WaterStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailyWaterRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<DailyWaterRecord[]>([]);

  const { profile } = useUserProfileStore();

  const loadData = useCallback(async () => {
    try {
      const [historyData, statsData, weekly, monthly] = await Promise.all([
        getWaterHistory(),
        calculateStats(profile.dailyWaterGoal),
        getLastNDays(7),
        getLastNDays(30),
      ]);

      setHistory(historyData);
      setStats(statsData);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
    } catch (error) {
      console.error('Error loading water history:', error);
    } finally {
      setLoading(false);
    }
  }, [profile.dailyWaterGoal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDayRecord = useCallback(
    (date: string): DailyWaterRecord => {
      return (
        history[date] || {
          date,
          intake: 0,
          goal: profile.dailyWaterGoal,
          entries: [],
        }
      );
    },
    [history, profile.dailyWaterGoal]
  );

  const getProgressPercentage = useCallback(
    (intake: number, goal?: number): number => {
      const targetGoal = goal || profile.dailyWaterGoal;
      return Math.min(100, Math.round((intake / targetGoal) * 100));
    },
    [profile.dailyWaterGoal]
  );

  const getDaysWithData = useCallback((): string[] => {
    return Object.keys(history).sort().reverse();
  }, [history]);

  const getStreakInfo = useCallback(() => {
    return {
      current: stats?.currentStreak || 0,
      longest: stats?.longestStreak || 0,
      goalRate: stats?.goalCompletionRate || 0,
      totalDays: stats?.totalDaysTracked || 0,
    };
  }, [stats]);

  const getAverages = useCallback(() => {
    return {
      weekly: stats?.weeklyAverage || 0,
      monthly: stats?.monthlyAverage || 0,
    };
  }, [stats]);

  return {
    loading,
    history,
    stats,
    weeklyData,
    monthlyData,
    getDayRecord,
    getProgressPercentage,
    getDaysWithData,
    getStreakInfo,
    getAverages,
    refresh: loadData,
  };
};
