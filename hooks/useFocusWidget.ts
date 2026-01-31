import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
    cancelAllBreakReminders,
    getBreakSettings,
    getSuggestedBreak,
    scheduleBreakReminders,
    sendBreakReminder,
} from '../services/breakReminders';
import {
    completeFocusSession,
    FocusWidgetState,
    formatFocusTime,
    getFocusProgress,
    getFocusWidgetState,
    pauseFocusFromWidget,
    resumeFocusFromWidget,
    startFocusFromWidget,
    stopFocusFromWidget,
    updateFocusRemainingTime
} from '../services/focusWidget';

interface UseFocusWidgetOptions {
  language?: 'en' | 'my';
  onSessionComplete?: () => void;
  onBreakSuggested?: (type: string, reason: string) => void;
}

interface UseFocusWidgetReturn {
  // State
  state: FocusWidgetState | null;
  isLoading: boolean;
  timeDisplay: string;
  progress: number;
  
  // Actions
  startSession: (duration?: number, type?: FocusWidgetState['sessionType']) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  
  // Break reminders
  suggestedBreak: { type: string; reason: string } | null;
  triggerBreakReminder: (type: string) => Promise<void>;
  dismissBreakSuggestion: () => void;
}

export const useFocusWidget = ({
  language = 'en',
  onSessionComplete,
  onBreakSuggested,
}: UseFocusWidgetOptions = {}): UseFocusWidgetReturn => {
  const [state, setState] = useState<FocusWidgetState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedBreak, setSuggestedBreak] = useState<{ type: string; reason: string } | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTime = useRef<number | null>(null);

  // Load initial state
  useEffect(() => {
    loadState();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breakCheckRef.current) clearInterval(breakCheckRef.current);
    };
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        await loadState();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Timer effect
  useEffect(() => {
    if (state?.isActive && !state?.isPaused) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => stopTimer();
  }, [state?.isActive, state?.isPaused]);

  const loadState = async () => {
    setIsLoading(true);
    try {
      const widgetState = await getFocusWidgetState();
      setState(widgetState);
    } catch (error) {
      console.error('Error loading focus widget state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(async () => {
      setState(prev => {
        if (!prev || prev.remainingTime <= 0) {
          handleSessionComplete();
          return prev;
        }
        
        const newRemaining = prev.remainingTime - 1;
        updateFocusRemainingTime(newRemaining);
        
        return { ...prev, remainingTime: newRemaining };
      });
    }, 1000);

    // Start break check interval
    startBreakCheck();
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (breakCheckRef.current) {
      clearInterval(breakCheckRef.current);
      breakCheckRef.current = null;
    }
  };

  const startBreakCheck = () => {
    if (breakCheckRef.current) clearInterval(breakCheckRef.current);
    
    // Check for break suggestions every 5 minutes
    breakCheckRef.current = setInterval(async () => {
      if (!sessionStartTime.current) return;
      
      const minutesSinceStart = Math.floor((Date.now() - sessionStartTime.current) / 60000);
      const suggestion = await getSuggestedBreak(minutesSinceStart, language);
      
      if (suggestion) {
        setSuggestedBreak(suggestion);
        onBreakSuggested?.(suggestion.type, suggestion.reason);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  };

  const handleSessionComplete = async () => {
    stopTimer();
    await completeFocusSession();
    await cancelAllBreakReminders();
    await loadState();
    onSessionComplete?.();
  };

  const startSession = useCallback(async (
    duration: number = 25 * 60,
    type: FocusWidgetState['sessionType'] = 'focus'
  ) => {
    sessionStartTime.current = Date.now();
    const newState = await startFocusFromWidget(duration, type);
    setState(newState);
    
    // Schedule break reminders
    const settings = await getBreakSettings();
    if (settings.enabled && settings.duringFocusOnly) {
      await scheduleBreakReminders(Math.floor(duration / 60), language);
    }
  }, [language]);

  const pauseSession = useCallback(async () => {
    const newState = await pauseFocusFromWidget();
    setState(newState);
  }, []);

  const resumeSession = useCallback(async () => {
    const newState = await resumeFocusFromWidget();
    setState(newState);
  }, []);

  const stopSession = useCallback(async () => {
    stopTimer();
    const newState = await stopFocusFromWidget();
    setState(newState);
    await cancelAllBreakReminders();
  }, []);

  const triggerBreakReminder = useCallback(async (type: string) => {
    await sendBreakReminder(type as any, language, state?.isActive || false);
    setSuggestedBreak(null);
  }, [language, state?.isActive]);

  const dismissBreakSuggestion = useCallback(() => {
    setSuggestedBreak(null);
  }, []);

  return {
    state,
    isLoading,
    timeDisplay: state ? formatFocusTime(state.remainingTime) : '00:00',
    progress: state ? getFocusProgress(state) : 0,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    suggestedBreak,
    triggerBreakReminder,
    dismissBreakSuggestion,
  };
};

export default useFocusWidget;
