
import { addWaterIntake, getDailyIntake, removeWaterIntake, resetDailyIntake } from '@/services/water';
import { saveWaterEntry } from '@/services/waterHistory';
import { initializeWidget, isWidgetAvailable, syncWidgetEntries, updateWidget } from '@/services/widgetSync';
import { useUserProfileStore } from '@/store/userProfile';
import { getProgressPercentage } from '@/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useWaterTracker = () => {
  const [dailyIntake, setDailyIntake] = useState(0);
  const [loading, setLoading] = useState(true);
  const dailyWaterGoal = useUserProfileStore((state) => state.profile.dailyWaterGoal);
  const appState = useRef(AppState.currentState);

  const loadDailyIntake = useCallback(async () => {
    try {
      setLoading(true);
      const intake = await getDailyIntake();
      setDailyIntake(intake);
      return intake;
    } catch (error) {
      console.error('Error loading daily intake:', error);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync widget entries and update state
  const syncFromWidget = useCallback(async () => {
    if (!isWidgetAvailable()) return;

    try {
      const syncResult = await syncWidgetEntries(dailyWaterGoal);

      if (syncResult.synced > 0) {
        // Add synced amount to app storage
        for (const entry of syncResult.entries) {
          const [year, month, day] = entry.date.split('-').map(Number);
          const [hours, minutes] = entry.time.split(':').map(Number);
          const entryDate = new Date(year, month - 1, day, hours, minutes);

          // Add to daily intake storage
          await addWaterIntake(entry.amount, entryDate);

          // Also save to water history for stats
          await saveWaterEntry(entry.amount, dailyWaterGoal, entryDate);
        }

        // Reload daily intake to reflect synced entries
        const newIntake = await getDailyIntake();
        setDailyIntake(newIntake);

        // Update widget with new total
        await updateWidget(newIntake, dailyWaterGoal);

        console.log(`Synced ${syncResult.synced} entries from widget (+${syncResult.totalAmount}ml)`);
      }
    } catch (error) {
      console.error('Error syncing from widget:', error);
    }
  }, [dailyWaterGoal]);

  // Handle app state changes (sync when app comes to foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - sync widget entries
        await syncFromWidget();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [syncFromWidget]);

  // Initial load and widget sync
  useEffect(() => {
    const initialize = async () => {
      const intake = await loadDailyIntake();
      // Initialize widget with current state and sync any pending entries
      await initializeWidget(intake, dailyWaterGoal);
      // Sync again after initialization to catch any entries
      await syncFromWidget();
    };

    initialize();
  }, [loadDailyIntake, dailyWaterGoal, syncFromWidget]);

  // Update widget when goal changes
  useEffect(() => {
    if (!loading) {
      updateWidget(dailyIntake, dailyWaterGoal);
    }
  }, [dailyWaterGoal, dailyIntake, loading]);

  const addIntake = useCallback(async (amount: number) => {
    try {
      const newTotal = await addWaterIntake(amount);
      setDailyIntake(newTotal);

      // Also save to water history for stats
      await saveWaterEntry(amount, dailyWaterGoal);

      // Update widget
      await updateWidget(newTotal, dailyWaterGoal);

      return newTotal;
    } catch (error) {
      console.error('Error adding intake:', error);
      throw error;
    }
  }, [dailyWaterGoal]);

  const removeIntake = useCallback(async (amount: number) => {
    try {
      const newTotal = await removeWaterIntake(amount);
      setDailyIntake(newTotal);

      // Update widget
      await updateWidget(newTotal, dailyWaterGoal);

      return newTotal;
    } catch (error) {
      console.error('Error removing intake:', error);
      throw error;
    }
  }, [dailyWaterGoal]);

  const resetIntake = useCallback(async () => {
    try {
      await resetDailyIntake();
      setDailyIntake(0);

      // Reset widget
      await updateWidget(0, dailyWaterGoal);
    } catch (error) {
      console.error('Error resetting intake:', error);
    }
  }, [dailyWaterGoal]);

  const progress = getProgressPercentage(dailyIntake, dailyWaterGoal);
  const isGoalReached = dailyIntake >= dailyWaterGoal;
  const remaining = Math.max(0, dailyWaterGoal - dailyIntake);

  return {
    dailyIntake,
    dailyWaterGoal,
    progress,
    isGoalReached,
    remaining,
    loading,
    addIntake,
    removeIntake,
    resetIntake,
    refresh: loadDailyIntake,
    syncFromWidget,
  };
};
