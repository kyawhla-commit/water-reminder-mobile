import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
    checkWidgetDailyReset,
    getWidgetConfig,
    getWidgetData,
    isWidgetSupported,
    resetWidget,
    saveWidgetConfig,
    syncWidgetWithApp,
    updateWidget,
    WidgetConfig,
    WidgetData,
} from '../services/widget';

interface UseWidgetOptions {
  currentIntake: number;
  dailyGoal: number;
  streakDays?: number;
  autoSync?: boolean;
}

interface UseWidgetReturn {
  isSupported: boolean;
  widgetData: WidgetData | null;
  widgetConfig: WidgetConfig | null;
  isLoading: boolean;
  updateWidgetData: () => Promise<void>;
  resetWidgetData: () => Promise<void>;
  updateConfig: (config: Partial<WidgetConfig>) => Promise<void>;
  refreshWidget: () => Promise<void>;
}

/**
 * Hook for managing home screen widget
 */
export const useWidget = ({
  currentIntake,
  dailyGoal,
  streakDays = 0,
  autoSync = true,
}: UseWidgetOptions): UseWidgetReturn => {
  const [widgetData, setWidgetData] = useState<WidgetData | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSupported = isWidgetSupported();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [data, config] = await Promise.all([getWidgetData(), getWidgetConfig()]);
        setWidgetData(data);
        setWidgetConfig(config);

        // Check for daily reset
        await checkWidgetDailyReset(dailyGoal);
      } catch (error) {
        console.error('Error loading widget data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dailyGoal]);

  // Auto-sync when intake changes
  useEffect(() => {
    if (autoSync && !isLoading) {
      updateWidget(currentIntake, dailyGoal).then(() => {
        getWidgetData().then(setWidgetData);
      });
    }
  }, [currentIntake, dailyGoal, autoSync, isLoading]);

  // Sync when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && autoSync) {
        await syncWidgetWithApp(currentIntake, dailyGoal, streakDays);
        const data = await getWidgetData();
        setWidgetData(data);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [currentIntake, dailyGoal, streakDays, autoSync]);

  // Update widget data
  const updateWidgetData = useCallback(async () => {
    await updateWidget(currentIntake, dailyGoal);
    const data = await getWidgetData();
    setWidgetData(data);
  }, [currentIntake, dailyGoal]);

  // Reset widget data
  const resetWidgetData = useCallback(async () => {
    await resetWidget(dailyGoal);
    const data = await getWidgetData();
    setWidgetData(data);
  }, [dailyGoal]);

  // Update widget config
  const updateConfig = useCallback(async (config: Partial<WidgetConfig>) => {
    await saveWidgetConfig(config);
    const newConfig = await getWidgetConfig();
    setWidgetConfig(newConfig);
  }, []);

  // Refresh widget
  const refreshWidget = useCallback(async () => {
    await syncWidgetWithApp(currentIntake, dailyGoal, streakDays);
    const data = await getWidgetData();
    setWidgetData(data);
  }, [currentIntake, dailyGoal, streakDays]);

  return {
    isSupported,
    widgetData,
    widgetConfig,
    isLoading,
    updateWidgetData,
    resetWidgetData,
    updateConfig,
    refreshWidget,
  };
};

export default useWidget;
