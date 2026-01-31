import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AppPreferences {
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
  
  // Widget
  widgetQuickAdd1: number;
  widgetQuickAdd2: number;
  
  // Usage Stats
  firstLaunchDate: string | null;
  appOpenCount: number;
  lastReviewPrompt: string | null;
}

interface PreferencesState {
  preferences: AppPreferences;
  setPreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
  setPreferences: (updates: Partial<AppPreferences>) => void;
  resetPreferences: () => void;
  incrementAppOpenCount: () => void;
  markReviewPromptShown: () => void;
}

const defaultPreferences: AppPreferences = {
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
  
  // Widget
  widgetQuickAdd1: 150,
  widgetQuickAdd2: 250,
  
  // Usage Stats
  firstLaunchDate: null,
  appOpenCount: 0,
  lastReviewPrompt: null,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,

      setPreference: (key, value) => {
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        }));
      },

      setPreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        }));
      },

      resetPreferences: () => {
        const current = get().preferences;
        set({
          preferences: {
            ...defaultPreferences,
            // Keep usage stats
            firstLaunchDate: current.firstLaunchDate,
            appOpenCount: current.appOpenCount,
          },
        });
      },

      incrementAppOpenCount: () => {
        set((state) => {
          const prefs = state.preferences;
          return {
            preferences: {
              ...prefs,
              firstLaunchDate: prefs.firstLaunchDate || new Date().toISOString(),
              appOpenCount: prefs.appOpenCount + 1,
            },
          };
        });
      },

      markReviewPromptShown: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            lastReviewPrompt: new Date().toISOString(),
          },
        }));
      },
    }),
    {
      name: 'app-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper hook for checking review prompt eligibility
export const useShouldShowReviewPrompt = (): boolean => {
  const { preferences } = usePreferencesStore();
  
  if (!preferences.firstLaunchDate) return false;
  
  const firstLaunch = new Date(preferences.firstLaunchDate);
  const now = new Date();
  const daysSinceFirstLaunch = Math.floor(
    (now.getTime() - firstLaunch.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Need at least 7 days and 10 opens
  if (daysSinceFirstLaunch < 7 || preferences.appOpenCount < 10) {
    return false;
  }
  
  // Check last review prompt
  if (preferences.lastReviewPrompt) {
    const lastPrompt = new Date(preferences.lastReviewPrompt);
    const daysSinceLastPrompt = Math.floor(
      (now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceLastPrompt >= 30;
  }
  
  return true;
};
