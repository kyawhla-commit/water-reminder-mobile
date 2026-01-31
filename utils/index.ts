import { appStoreUrl, googlePlayStoreUrl } from '@/config';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export const formatWaterAmount = (ml: number): string => {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`;
  }
  return `${ml}ml`;
};

export const getProgressPercentage = (current: number, goal: number): number => {
  if (goal <= 0) return 0;
  return Math.min((current / goal) * 100, 100);
};

export const redirectToStore = () => {
  switch (Platform.OS) {
    case 'ios':
      return Linking.openURL(appStoreUrl);
    default:
      return Linking.openURL(googlePlayStoreUrl);
  }
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const calculateSleepQuality = (duration: number, goal: number): number => {
  const ratio = duration / (goal * 60);
  if (ratio >= 0.9 && ratio <= 1.1) return 5;
  if (ratio >= 0.8 && ratio <= 1.2) return 4;
  if (ratio >= 0.7 && ratio <= 1.3) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
};
