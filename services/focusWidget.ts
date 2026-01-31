import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const { HydroMateWidget } = NativeModules;

const FOCUS_WIDGET_KEY = 'focus_widget_data';

/**
 * Focus session state for widget
 */
export interface FocusWidgetState {
  isActive: boolean;
  isPaused: boolean;
  sessionType: 'focus' | 'pomodoro' | 'deepWork';
  totalDuration: number; // in seconds
  remainingTime: number; // in seconds
  startedAt: string | null;
  pausedAt: string | null;
  sessionsCompleted: number;
  todayMinutes: number;
  dailyGoal: number;
  lastUpdated: string;
}

/**
 * Widget action types
 */
export type FocusWidgetAction = 
  | 'start'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'skip_break';

const DEFAULT_STATE: FocusWidgetState = {
  isActive: false,
  isPaused: false,
  sessionType: 'focus',
  totalDuration: 25 * 60,
  remainingTime: 25 * 60,
  startedAt: null,
  pausedAt: null,
  sessionsCompleted: 0,
  todayMinutes: 0,
  dailyGoal: 120,
  lastUpdated: new Date().toISOString(),
};

/**
 * Get current focus widget state
 */
export const getFocusWidgetState = async (): Promise<FocusWidgetState> => {
  try {
    const data = await AsyncStorage.getItem(FOCUS_WIDGET_KEY);
    if (data) {
      return { ...DEFAULT_STATE, ...JSON.parse(data) };
    }
    return DEFAULT_STATE;
  } catch (error) {
    console.error('Error getting focus widget state:', error);
    return DEFAULT_STATE;
  }
};


/**
 * Save focus widget state
 */
export const saveFocusWidgetState = async (state: Partial<FocusWidgetState>): Promise<void> => {
  try {
    const current = await getFocusWidgetState();
    const updated: FocusWidgetState = {
      ...current,
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(FOCUS_WIDGET_KEY, JSON.stringify(updated));
    
    // Update native widget if available
    await updateNativeFocusWidget(updated);
  } catch (error) {
    console.error('Error saving focus widget state:', error);
  }
};

/**
 * Update native widget (Android)
 */
const updateNativeFocusWidget = async (state: FocusWidgetState): Promise<void> => {
  if (Platform.OS !== 'android' || !HydroMateWidget) return;
  
  try {
    // The widget module can be extended to support focus data
    // For now, we store in shared preferences that the widget can read
    await AsyncStorage.setItem('widget_focus_state', JSON.stringify({
      isActive: state.isActive,
      isPaused: state.isPaused,
      remainingTime: state.remainingTime,
      totalDuration: state.totalDuration,
      sessionType: state.sessionType,
      progress: Math.round(((state.totalDuration - state.remainingTime) / state.totalDuration) * 100),
    }));
  } catch (error) {
    console.error('Error updating native focus widget:', error);
  }
};

/**
 * Start focus session from widget
 */
export const startFocusFromWidget = async (
  duration: number = 25 * 60,
  sessionType: FocusWidgetState['sessionType'] = 'focus'
): Promise<FocusWidgetState> => {
  const state: Partial<FocusWidgetState> = {
    isActive: true,
    isPaused: false,
    sessionType,
    totalDuration: duration,
    remainingTime: duration,
    startedAt: new Date().toISOString(),
    pausedAt: null,
  };
  
  await saveFocusWidgetState(state);
  return getFocusWidgetState();
};

/**
 * Pause focus session from widget
 */
export const pauseFocusFromWidget = async (): Promise<FocusWidgetState> => {
  const current = await getFocusWidgetState();
  if (!current.isActive) return current;
  
  await saveFocusWidgetState({
    isPaused: true,
    pausedAt: new Date().toISOString(),
  });
  
  return getFocusWidgetState();
};

/**
 * Resume focus session from widget
 */
export const resumeFocusFromWidget = async (): Promise<FocusWidgetState> => {
  const current = await getFocusWidgetState();
  if (!current.isActive || !current.isPaused) return current;
  
  await saveFocusWidgetState({
    isPaused: false,
    pausedAt: null,
  });
  
  return getFocusWidgetState();
};

/**
 * Stop focus session from widget
 */
export const stopFocusFromWidget = async (): Promise<FocusWidgetState> => {
  const current = await getFocusWidgetState();
  const elapsedMinutes = Math.floor((current.totalDuration - current.remainingTime) / 60);
  
  await saveFocusWidgetState({
    isActive: false,
    isPaused: false,
    startedAt: null,
    pausedAt: null,
    remainingTime: current.totalDuration,
    todayMinutes: current.todayMinutes + elapsedMinutes,
  });
  
  return getFocusWidgetState();
};

/**
 * Complete focus session
 */
export const completeFocusSession = async (): Promise<FocusWidgetState> => {
  const current = await getFocusWidgetState();
  const sessionMinutes = Math.floor(current.totalDuration / 60);
  
  await saveFocusWidgetState({
    isActive: false,
    isPaused: false,
    startedAt: null,
    pausedAt: null,
    remainingTime: current.totalDuration,
    sessionsCompleted: current.sessionsCompleted + 1,
    todayMinutes: current.todayMinutes + sessionMinutes,
  });
  
  return getFocusWidgetState();
};

/**
 * Update remaining time (called by timer)
 */
export const updateFocusRemainingTime = async (remainingTime: number): Promise<void> => {
  await saveFocusWidgetState({ remainingTime });
};

/**
 * Sync widget with app state
 */
export const syncFocusWidgetWithApp = async (
  isActive: boolean,
  remainingTime: number,
  totalDuration: number,
  todayMinutes: number,
  sessionsCompleted: number
): Promise<void> => {
  await saveFocusWidgetState({
    isActive,
    remainingTime,
    totalDuration,
    todayMinutes,
    sessionsCompleted,
  });
};

/**
 * Reset daily stats (call at midnight)
 */
export const resetDailyFocusStats = async (): Promise<void> => {
  await saveFocusWidgetState({
    todayMinutes: 0,
    sessionsCompleted: 0,
  });
};

/**
 * Get focus progress percentage
 */
export const getFocusProgress = (state: FocusWidgetState): number => {
  if (state.totalDuration === 0) return 0;
  return Math.round(((state.totalDuration - state.remainingTime) / state.totalDuration) * 100);
};

/**
 * Format time for display
 */
export const formatFocusTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get widget display data
 */
export const getFocusWidgetDisplayData = async (): Promise<{
  timeDisplay: string;
  progress: number;
  statusText: string;
  statusEmoji: string;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
}> => {
  const state = await getFocusWidgetState();
  
  return {
    timeDisplay: formatFocusTime(state.remainingTime),
    progress: getFocusProgress(state),
    statusText: state.isActive 
      ? (state.isPaused ? 'Paused' : 'Focusing') 
      : 'Ready',
    statusEmoji: state.isActive 
      ? (state.isPaused ? '⏸️' : '🎯') 
      : '▶️',
    canStart: !state.isActive,
    canPause: state.isActive && !state.isPaused,
    canResume: state.isActive && state.isPaused,
    canStop: state.isActive,
  };
};
