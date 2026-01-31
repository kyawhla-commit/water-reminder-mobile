import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Gender = 'male' | 'female' | 'other';

export interface UserProfile {
  name: string;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  gender: Gender;
  activityLevel: ActivityLevel;
  wakeTime: string;
  sleepTime: string;
  dailyWaterGoal: number;
  onboardingCompleted: boolean;
}

interface UserProfileState {
  profile: UserProfile;
  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 30,
  light: 35,
  moderate: 40,
  active: 45,
  very_active: 50,
};

const defaultProfile: UserProfile = {
  name: '',
  weight: 70,
  weightUnit: 'kg',
  gender: 'male',
  activityLevel: 'moderate',
  wakeTime: '07:00',
  sleepTime: '23:00',
  dailyWaterGoal: 2000,
  onboardingCompleted: false,
};

// Helper function to sync quiet hours (imported dynamically to avoid circular deps)
const syncQuietHours = async (sleepTime: string, wakeTime: string) => {
  try {
    const { syncQuietHoursWithSleepSchedule } = await import('@/services/smartNotifications');
    await syncQuietHoursWithSleepSchedule(sleepTime, wakeTime);
  } catch (error) {
    console.error('Error syncing quiet hours:', error);
  }
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      profile: defaultProfile,

      setProfile: (updates: Partial<UserProfile>) => {
        set((state: UserProfileState) => {
          const newProfile = { ...state.profile, ...updates };

          // Recalculate water goal if relevant fields changed
          if (updates.weight !== undefined || updates.weightUnit !== undefined || updates.activityLevel !== undefined) {
            const weightInKg = newProfile.weightUnit === 'lbs'
              ? newProfile.weight * 0.453592
              : newProfile.weight;
            const baseAmount = weightInKg * ACTIVITY_MULTIPLIERS[newProfile.activityLevel];
            newProfile.dailyWaterGoal = Math.round(baseAmount / 100) * 100;
          }

          // Sync quiet hours with sleep schedule when sleep/wake time changes
          if (updates.sleepTime !== undefined || updates.wakeTime !== undefined) {
            syncQuietHours(newProfile.sleepTime, newProfile.wakeTime);
          }

          return { profile: newProfile };
        });
      },

      completeOnboarding: () => {
        set((state: UserProfileState) => {
          // Sync quiet hours when onboarding completes
          syncQuietHours(state.profile.sleepTime, state.profile.wakeTime);
          return {
            profile: { ...state.profile, onboardingCompleted: true },
          };
        });
      },

      resetProfile: () => {
        set({ profile: defaultProfile });
      },
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
