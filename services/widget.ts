import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const { HydroMateWidget } = NativeModules;

// Storage keys for widget data sync
const WIDGET_DATA_KEY = 'widget_data';
const WIDGET_SYNC_KEY = 'widget_last_sync';

/**
 * Widget data interface
 */
export interface WidgetData {
  currentIntake: number;
  dailyGoal: number;
  percentage: number;
  lastUpdated: string;
  streakDays: number;
}

/**
 * Check if widget native module is available
 */
export const isWidgetSupported = (): boolean => {
  return Platform.OS === 'android' && HydroMateWidget !== null;
};

/**
 * Update the home screen widget with current data
 */
export const updateWidget = async (
  currentIntake: number,
  dailyGoal: number
): Promise<boolean> => {
  try {
    // Save to AsyncStorage for persistence
    const widgetData: WidgetData = {
      currentIntake,
      dailyGoal,
      percentage: dailyGoal > 0 ? Math.min(Math.round((currentIntake / dailyGoal) * 100), 100) : 0,
      lastUpdated: new Date().toISOString(),
      streakDays: 0, // Will be updated separately
    };

    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));
    await AsyncStorage.setItem(WIDGET_SYNC_KEY, new Date().toISOString());

    // Update native widget on Android
    if (Platform.OS === 'android' && HydroMateWidget) {
      await HydroMateWidget.updateWidget(currentIntake, dailyGoal);
    }

    // iOS uses App Groups and WidgetKit - handled separately
    if (Platform.OS === 'ios') {
      await updateIOSWidget(widgetData);
    }

    return true;
  } catch (error) {
    console.error('Error updating widget:', error);
    return false;
  }
};

/**
 * Reset widget data (typically at midnight)
 */
export const resetWidget = async (dailyGoal: number): Promise<boolean> => {
  try {
    const widgetData: WidgetData = {
      currentIntake: 0,
      dailyGoal,
      percentage: 0,
      lastUpdated: new Date().toISOString(),
      streakDays: 0,
    };

    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));

    if (Platform.OS === 'android' && HydroMateWidget) {
      await HydroMateWidget.resetWidget();
    }

    if (Platform.OS === 'ios') {
      await updateIOSWidget(widgetData);
    }

    return true;
  } catch (error) {
    console.error('Error resetting widget:', error);
    return false;
  }
};

/**
 * Get current widget data
 */
export const getWidgetData = async (): Promise<WidgetData | null> => {
  try {
    const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting widget data:', error);
    return null;
  }
};

/**
 * Sync widget with app data
 * Call this when app comes to foreground
 */
export const syncWidgetWithApp = async (
  currentIntake: number,
  dailyGoal: number,
  streakDays: number
): Promise<void> => {
  try {
    const widgetData: WidgetData = {
      currentIntake,
      dailyGoal,
      percentage: dailyGoal > 0 ? Math.min(Math.round((currentIntake / dailyGoal) * 100), 100) : 0,
      lastUpdated: new Date().toISOString(),
      streakDays,
    };

    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));

    if (Platform.OS === 'android' && HydroMateWidget) {
      await HydroMateWidget.updateWidget(currentIntake, dailyGoal);
    }

    if (Platform.OS === 'ios') {
      await updateIOSWidget(widgetData);
    }
  } catch (error) {
    console.error('Error syncing widget:', error);
  }
};

/**
 * Update iOS widget using UserDefaults (App Groups)
 * iOS widgets use WidgetKit and read from shared UserDefaults
 */
const updateIOSWidget = async (data: WidgetData): Promise<void> => {
  // iOS widget data is stored in shared UserDefaults via App Groups
  // The native iOS widget reads from this shared container
  // For now, we store in AsyncStorage which can be accessed via a native module

  // Note: Full iOS widget implementation requires:
  // 1. Widget Extension target in Xcode
  // 2. App Groups capability
  // 3. Shared UserDefaults container
  // 4. WidgetKit SwiftUI views

  // This is a placeholder - actual iOS implementation needs native code
  console.log('iOS widget update:', data);
};

/**
 * Quick add water from widget
 * This is called when user taps widget buttons
 */
export const handleWidgetQuickAdd = async (
  amount: number,
  getCurrentIntake: () => Promise<number>,
  addWaterEntry: (amount: number) => Promise<void>,
  dailyGoal: number
): Promise<void> => {
  try {
    // Add water entry
    await addWaterEntry(amount);

    // Get updated intake
    const newIntake = await getCurrentIntake();

    // Update widget
    await updateWidget(newIntake, dailyGoal);
  } catch (error) {
    console.error('Error handling widget quick add:', error);
  }
};

/**
 * Get widget configuration options
 */
export interface WidgetConfig {
  quickAddAmounts: number[];
  showStreak: boolean;
  showPercentage: boolean;
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  quickAddAmounts: [150, 250],
  showStreak: true,
  showPercentage: true,
  theme: 'system',
};

const WIDGET_CONFIG_KEY = 'widget_config';

/**
 * Get widget configuration
 */
export const getWidgetConfig = async (): Promise<WidgetConfig> => {
  try {
    const data = await AsyncStorage.getItem(WIDGET_CONFIG_KEY);
    return data ? { ...DEFAULT_WIDGET_CONFIG, ...JSON.parse(data) } : DEFAULT_WIDGET_CONFIG;
  } catch (error) {
    console.error('Error getting widget config:', error);
    return DEFAULT_WIDGET_CONFIG;
  }
};

/**
 * Save widget configuration
 */
export const saveWidgetConfig = async (config: Partial<WidgetConfig>): Promise<void> => {
  try {
    const current = await getWidgetConfig();
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving widget config:', error);
  }
};

/**
 * Check if widget needs daily reset
 */
export const checkWidgetDailyReset = async (dailyGoal: number): Promise<boolean> => {
  try {
    const lastSync = await AsyncStorage.getItem(WIDGET_SYNC_KEY);
    if (!lastSync) return false;

    const lastSyncDate = new Date(lastSync);
    const today = new Date();

    // Check if last sync was on a different day
    if (
      lastSyncDate.getDate() !== today.getDate() ||
      lastSyncDate.getMonth() !== today.getMonth() ||
      lastSyncDate.getFullYear() !== today.getFullYear()
    ) {
      await resetWidget(dailyGoal);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking widget daily reset:', error);
    return false;
  }
};

/**
 * Get widget status for debugging
 */
export const getWidgetStatus = async (): Promise<{
  isSupported: boolean;
  hasData: boolean;
  lastSync: string | null;
  data: WidgetData | null;
}> => {
  const data = await getWidgetData();
  const lastSync = await AsyncStorage.getItem(WIDGET_SYNC_KEY);

  return {
    isSupported: isWidgetSupported(),
    hasData: data !== null,
    lastSync,
    data,
  };
};
