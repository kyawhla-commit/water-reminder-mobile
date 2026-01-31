import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = 'user_preferences';

export interface UserPreferences {
  // App Settings
  hapticFeedback: boolean;
  soundEffects: boolean;
  
  // Display Settings
  showPercentage: boolean;
  showRemaining: boolean;
  compactMode: boolean;
  
  // Water Tracking
  defaultWaterAmount: number;
  quickAddAmounts: number[];
  trackBeverageTypes: boolean;
  
  // Notifications
  celebrateGoals: boolean;
  streakReminders: boolean;
  weeklyReport: boolean;
  
  // Privacy
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
  
  // Widget
  widgetQuickAdd1: number;
  widgetQuickAdd2: number;
  
  // First Launch
  firstLaunchDate: string | null;
  appOpenCount: number;
  lastReviewPrompt: string | null;
}

export const defaultPreferences: UserPreferences = {
  // App Settings
  hapticFeedback: true,
  soundEffects: true,
  
  // Display Settings
  showPercentage: true,
  showRemaining: true,
  compactMode: false,
  
  // Water Tracking
  defaultWaterAmount: 250,
  quickAddAmounts: [150, 250, 350, 500],
  trackBeverageTypes: false,
  
  // Notifications
  celebrateGoals: true,
  streakReminders: true,
  weeklyReport: true,
  
  // Privacy
  analyticsEnabled: true,
  crashReportsEnabled: true,
  
  // Widget
  widgetQuickAdd1: 150,
  widgetQuickAdd2: 250,
  
  // First Launch
  firstLaunchDate: null,
  appOpenCount: 0,
  lastReviewPrompt: null,
};

/**
 * Get all user preferences
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const data = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (data) {
      return { ...defaultPreferences, ...JSON.parse(data) };
    }
    
    // First time - set first launch date
    const prefs = {
      ...defaultPreferences,
      firstLaunchDate: new Date().toISOString(),
    };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    return prefs;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return defaultPreferences;
  }
};

/**
 * Save user preferences
 */
export const saveUserPreferences = async (
  preferences: Partial<UserPreferences>
): Promise<void> => {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

/**
 * Update a single preference
 */
export const updatePreference = async <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): Promise<void> => {
  await saveUserPreferences({ [key]: value });
};

/**
 * Reset preferences to defaults
 */
export const resetPreferences = async (): Promise<void> => {
  try {
    const current = await getUserPreferences();
    // Keep first launch date and app open count
    const reset = {
      ...defaultPreferences,
      firstLaunchDate: current.firstLaunchDate,
      appOpenCount: current.appOpenCount,
    };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(reset));
  } catch (error) {
    console.error('Error resetting preferences:', error);
  }
};

/**
 * Increment app open count
 */
export const incrementAppOpenCount = async (): Promise<number> => {
  try {
    const prefs = await getUserPreferences();
    const newCount = prefs.appOpenCount + 1;
    await saveUserPreferences({ appOpenCount: newCount });
    return newCount;
  } catch (error) {
    console.error('Error incrementing app open count:', error);
    return 0;
  }
};

/**
 * Check if should show review prompt
 * Shows after 7 days and 10 opens, then every 30 days
 */
export const shouldShowReviewPrompt = async (): Promise<boolean> => {
  try {
    const prefs = await getUserPreferences();
    
    if (!prefs.firstLaunchDate) return false;
    
    const firstLaunch = new Date(prefs.firstLaunchDate);
    const now = new Date();
    const daysSinceFirstLaunch = Math.floor(
      (now.getTime() - firstLaunch.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Need at least 7 days and 10 opens
    if (daysSinceFirstLaunch < 7 || prefs.appOpenCount < 10) {
      return false;
    }
    
    // Check last review prompt
    if (prefs.lastReviewPrompt) {
      const lastPrompt = new Date(prefs.lastReviewPrompt);
      const daysSinceLastPrompt = Math.floor(
        (now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLastPrompt >= 30;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking review prompt:', error);
    return false;
  }
};

/**
 * Mark review prompt as shown
 */
export const markReviewPromptShown = async (): Promise<void> => {
  await saveUserPreferences({ lastReviewPrompt: new Date().toISOString() });
};

/**
 * Export all user data for backup
 */
export const exportUserData = async (): Promise<string> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);
    
    const data: Record<string, unknown> = {};
    result.forEach(([key, value]) => {
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
};

/**
 * Import user data from backup
 */
export const importUserData = async (jsonData: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonData);
    
    const entries = Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]) as [string, string][];
    
    await AsyncStorage.multiSet(entries);
    return true;
  } catch (error) {
    console.error('Error importing user data:', error);
    return false;
  }
};
