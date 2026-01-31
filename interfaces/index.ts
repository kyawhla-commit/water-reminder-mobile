import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  home: undefined;
  addReminder: undefined;
  editReminder: { reminderId: string };
  reminderHistory: { reminderId: string };
  settings: undefined;
  settingsNotifications: undefined;
  settingsApp: undefined;
};

export interface Navigation {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    keyof RootStackParamList,
    string | undefined
  >;
}

export interface WaterReminder {
  id: string;
  name: string;
  description?: string;
  targetAmount: number; // in ml
  currentAmount: number; // in ml
  createdAt: string;
  updatedAt: string;
}

export interface SleepRecord {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  quality?: number; // 1-5 rating
  notes?: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  name: string;
  duration: number; // in minutes
  completedAt?: string;
  createdAt: string;
}

export interface UserSettings {
  pushNotificationsEnabled: boolean;
  dailyWaterGoal: number; // in ml
  sleepGoal: number; // in hours
  focusSessionDuration: number; // in minutes
}

export interface UserInfo {
  deviceLanguage: string;
  pushNotificationToken?: string;
  deviceInfo: string;
}

export type AppTheme = 'light' | 'dark';
