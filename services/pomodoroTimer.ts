import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  getFocusChannelId,
  getFocusSound,
  getFocusSoundOption,
} from './focusSleepNotificationSounds';

const POMODORO_SETTINGS_KEY = '@hydromate_pomodoro_settings';
const POMODORO_STATS_KEY = '@hydromate_pomodoro_stats';

export type TimerPhase = 'work' | 'shortBreak' | 'longBreak' | 'idle';

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  dailyGoal: number; // target sessions per day
  dailyMinutesGoal: number; // target focus minutes per day
  // Hydration settings
  hydrationRemindersEnabled: boolean;
  hydrationAmount: number; // ml to suggest per break
}

export interface PomodoroSession {
  id: string;
  date: string;
  phase: TimerPhase;
  duration: number;
  completed: boolean;
  startTime: string;
  endTime?: string;
}

export interface PomodoroStats {
  todaySessions: number;
  todayMinutes: number;
  weekSessions: number;
  weekMinutes: number;
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  bestStreak: number;
  lastSessionDate: string;
  sessionsHistory: DailyStats[];
}

export interface DailyStats {
  date: string;
  sessions: number;
  minutes: number;
  goalMet: boolean;
}

export interface TimerState {
  phase: TimerPhase;
  timeRemaining: number; // seconds
  sessionsCompleted: number;
  isRunning: boolean;
  isPaused: boolean;
}

// Preset configurations
export const POMODORO_PRESETS = [
  {
    id: 'classic',
    name: 'Classic',
    nameMy: 'ရိုးရာ',
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    sessions: 4,
    icon: '🍅',
  },
  {
    id: 'short',
    name: 'Short Focus',
    nameMy: 'အတိုအာရုံစူးစိုက်',
    work: 15,
    shortBreak: 3,
    longBreak: 10,
    sessions: 4,
    icon: '⚡',
  },
  {
    id: 'long',
    name: 'Deep Work',
    nameMy: 'နက်ရှိုင်းအလုပ်',
    work: 50,
    shortBreak: 10,
    longBreak: 30,
    sessions: 2,
    icon: '🧠',
  },
  {
    id: 'study',
    name: 'Study Mode',
    nameMy: 'စာကျက်မုဒ်',
    work: 45,
    shortBreak: 10,
    longBreak: 20,
    sessions: 3,
    icon: '📚',
  },
];

const getDefaultSettings = (): PomodoroSettings => ({
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  dailyGoal: 8,
  dailyMinutesGoal: 120, // 2 hours default
  hydrationRemindersEnabled: true,
  hydrationAmount: 200,
});

const getDefaultStats = (): PomodoroStats => ({
  todaySessions: 0,
  todayMinutes: 0,
  weekSessions: 0,
  weekMinutes: 0,
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastSessionDate: '',
  sessionsHistory: [],
});

export const loadPomodoroSettings = async (): Promise<PomodoroSettings> => {
  try {
    const data = await AsyncStorage.getItem(POMODORO_SETTINGS_KEY);
    return data ? { ...getDefaultSettings(), ...JSON.parse(data) } : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
};

export const savePomodoroSettings = async (settings: PomodoroSettings): Promise<void> => {
  await AsyncStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(settings));
};

export const loadPomodoroStats = async (): Promise<PomodoroStats> => {
  try {
    const data = await AsyncStorage.getItem(POMODORO_STATS_KEY);
    const stats = data ? { ...getDefaultStats(), ...JSON.parse(data) } : getDefaultStats();

    // Reset today's stats if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastSessionDate !== today) {
      // Check if yesterday was tracked for streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (stats.lastSessionDate !== yesterdayStr && stats.lastSessionDate !== '') {
        stats.currentStreak = 0;
      }

      stats.todaySessions = 0;
      stats.todayMinutes = 0;
    }

    // Recalculate weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStats = stats.sessionsHistory
      .filter((s: DailyStats) => new Date(s.date) >= weekAgo)
      .reduce(
        (acc: { sessions: number; minutes: number }, s: DailyStats) => ({
          sessions: acc.sessions + s.sessions,
          minutes: acc.minutes + s.minutes,
        }),
        { sessions: 0, minutes: 0 }
      );

    stats.weekSessions = weekStats.sessions;
    stats.weekMinutes = weekStats.minutes;

    return stats;
  } catch {
    return getDefaultStats();
  }
};

export const savePomodoroStats = async (stats: PomodoroStats): Promise<void> => {
  await AsyncStorage.setItem(POMODORO_STATS_KEY, JSON.stringify(stats));
};

export const recordCompletedSession = async (
  duration: number,
  dailyGoal: number
): Promise<PomodoroStats> => {
  const stats = await loadPomodoroStats();
  const today = new Date().toISOString().split('T')[0];

  // Update today's stats
  stats.todaySessions += 1;
  stats.todayMinutes += duration;
  stats.totalSessions += 1;
  stats.totalMinutes += duration;

  // Update streak
  if (stats.lastSessionDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (stats.lastSessionDate === yesterdayStr || stats.lastSessionDate === '') {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }

    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }
  }

  stats.lastSessionDate = today;

  // Update history
  const todayHistory = stats.sessionsHistory.find((s) => s.date === today);
  if (todayHistory) {
    todayHistory.sessions += 1;
    todayHistory.minutes += duration;
    todayHistory.goalMet = todayHistory.sessions >= dailyGoal;
  } else {
    stats.sessionsHistory.push({
      date: today,
      sessions: 1,
      minutes: duration,
      goalMet: 1 >= dailyGoal,
    });
  }

  // Keep only last 30 days of history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  stats.sessionsHistory = stats.sessionsHistory.filter((s) => new Date(s.date) >= thirtyDaysAgo);

  // Recalculate weekly stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStats = stats.sessionsHistory
    .filter((s: DailyStats) => new Date(s.date) >= weekAgo)
    .reduce(
      (acc: { sessions: number; minutes: number }, s: DailyStats) => ({
        sessions: acc.sessions + s.sessions,
        minutes: acc.minutes + s.minutes,
      }),
      { sessions: 0, minutes: 0 }
    );

  stats.weekSessions = weekStats.sessions;
  stats.weekMinutes = weekStats.minutes;

  await savePomodoroStats(stats);
  return stats;
};

export const sendPhaseNotification = async (
  phase: TimerPhase,
  settings: PomodoroSettings
): Promise<void> => {
  if (!settings.notificationsEnabled) return;

  const messages = {
    work: {
      title: '🍅 Focus Time!',
      titleMy: '🍅 အာရုံစူးစိုက်ချိန်!',
      body: 'Time to start your work session. Stay focused!',
      bodyMy: 'အလုပ်စတင်ချိန်ရောက်ပြီ။ အာရုံစူးစိုက်ပါ!',
    },
    shortBreak: {
      title: '☕ Short Break!',
      titleMy: '☕ အနားယူချိန်တို!',
      body: settings.hydrationRemindersEnabled
        ? `Great work! Take a break and drink ${settings.hydrationAmount}ml of water 💧`
        : 'Great work! Take a quick break.',
      bodyMy: settings.hydrationRemindersEnabled
        ? `ကောင်းပါတယ်! အနားယူပြီး ${settings.hydrationAmount}ml ရေသောက်ပါ 💧`
        : 'ကောင်းပါတယ်! ခဏအနားယူပါ။',
    },
    longBreak: {
      title: '🎉 Long Break!',
      titleMy: '🎉 အနားယူချိန်ရှည်!',
      body: settings.hydrationRemindersEnabled
        ? `Excellent! You've earned a longer break. Don't forget to hydrate - drink ${settings.hydrationAmount}ml 💧`
        : "Excellent! You've earned a longer break.",
      bodyMy: settings.hydrationRemindersEnabled
        ? `အံ့သြစရာ! ရှည်သောအနားယူချိန်ရပါပြီ။ ${settings.hydrationAmount}ml ရေသောက်ဖို့ မမေ့ပါနဲ့ 💧`
        : 'အံ့သြစရာ! ရှည်သောအနားယူချိန်ရပါပြီ။',
    },
    idle: {
      title: '✅ Session Complete!',
      titleMy: '✅ ပြီးဆုံးပါပြီ!',
      body: 'Well done! Ready for another round?',
      bodyMy: 'ကောင်းပါတယ်! နောက်တစ်ကြိမ် အသင့်ပြီလား?',
    },
  };

  const message = messages[phase];

  try {
    // Get current language (simplified - you may want to get from user settings)
    const language: 'en' | 'my' = 'en'; // TODO: Get from user settings
    const title = language === 'my' ? message.titleMy : message.title;
    const body = language === 'my' ? message.bodyMy : message.body;

    // Get focus sound settings
    const focusSound = await getFocusSound();
    const soundOption = getFocusSoundOption(focusSound);

    const notificationContent: any = {
      title,
      body,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      data: { type: 'pomodoro', phase },
    };

    // Configure sound based on platform
    if (Platform.OS === 'android') {
      notificationContent.channelId = getFocusChannelId();
      // Sound is configured in the channel
    } else if (Platform.OS === 'ios') {
      if (focusSound === 'silent' || !settings.soundEnabled) {
        notificationContent.sound = false;
      } else if (soundOption?.iosSound) {
        notificationContent.sound = soundOption.iosSound;
      } else {
        notificationContent.sound = settings.soundEnabled;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Immediate
    });

    console.log(`✅ Focus notification sent for phase: ${phase}`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Hydration tips for breaks
export const HYDRATION_TIPS = [
  {
    emoji: '💧',
    tip: 'Water helps maintain focus and cognitive function',
    tipMy: 'ရေသည် အာရုံစူးစိုက်မှုနှင့် ဉာဏ်ရည်ဉာဏ်သွေးကို ထိန်းသိမ်းပေးသည်',
  },
  {
    emoji: '🧠',
    tip: 'Even mild dehydration can affect concentration',
    tipMy: 'အနည်းငယ်ရေဓာတ်ခန်းခြောက်ရုံနှင့်ပင် အာရုံစူးစိုက်မှုကို ထိခိုက်နိုင်သည်',
  },
  {
    emoji: '⚡',
    tip: 'Staying hydrated boosts energy levels naturally',
    tipMy: 'ရေဓာတ်ပြည့်ဝခြင်းသည် သဘာဝစွမ်းအင်ကို မြှင့်တင်ပေးသည်',
  },
  {
    emoji: '🎯',
    tip: 'Drink water during breaks to stay productive',
    tipMy: 'အနားယူချိန်တွင် ရေသောက်ပြီး ထုတ်လုပ်နိုင်စွမ်းကို ထိန်းထားပါ',
  },
  {
    emoji: '💪',
    tip: 'Regular hydration prevents fatigue and headaches',
    tipMy: 'ပုံမှန်ရေသောက်ခြင်းသည် ပင်ပန်းမှုနှင့် ခေါင်းကိုက်ခြင်းကို ကာကွယ်ပေးသည်',
  },
  {
    emoji: '🌟',
    tip: 'A glass of water can refresh your mind for the next session',
    tipMy: 'ရေတစ်ခွက်သည် နောက်အကြိမ်အတွက် သင့်စိတ်ကို လန်းဆန်းစေနိုင်သည်',
  },
];

export const getRandomHydrationTip = (isBurmese: boolean): { emoji: string; tip: string } => {
  const randomTip = HYDRATION_TIPS[Math.floor(Math.random() * HYDRATION_TIPS.length)];
  return {
    emoji: randomTip.emoji,
    tip: isBurmese ? randomTip.tipMy : randomTip.tip,
  };
};

export const HYDRATION_AMOUNTS = [100, 150, 200, 250, 300];

export const getNextPhase = (
  currentPhase: TimerPhase,
  sessionsCompleted: number,
  sessionsUntilLongBreak: number
): TimerPhase => {
  if (currentPhase === 'work') {
    if ((sessionsCompleted + 1) % sessionsUntilLongBreak === 0) {
      return 'longBreak';
    }
    return 'shortBreak';
  }
  return 'work';
};

export const getPhaseDuration = (phase: TimerPhase, settings: PomodoroSettings): number => {
  switch (phase) {
    case 'work':
      return settings.workDuration * 60;
    case 'shortBreak':
      return settings.shortBreakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
    default:
      return settings.workDuration * 60;
  }
};

export const getPhaseColor = (phase: TimerPhase): string => {
  switch (phase) {
    case 'work':
      return '#E74C3C';
    case 'shortBreak':
      return '#27AE60';
    case 'longBreak':
      return '#3498DB';
    default:
      return '#95A5A6';
  }
};

export const getPhaseEmoji = (phase: TimerPhase): string => {
  switch (phase) {
    case 'work':
      return '🍅';
    case 'shortBreak':
      return '☕';
    case 'longBreak':
      return '🎉';
    default:
      return '⏸️';
  }
};

export const getPhaseLabel = (phase: TimerPhase, isBurmese: boolean): string => {
  const labels = {
    work: isBurmese ? 'အလုပ်လုပ်ချိန်' : 'Focus Time',
    shortBreak: isBurmese ? 'အနားယူချိန်တို' : 'Short Break',
    longBreak: isBurmese ? 'အနားယူချိန်ရှည်' : 'Long Break',
    idle: isBurmese ? 'အသင့်' : 'Ready',
  };
  return labels[phase];
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const DURATION_OPTIONS = {
  work: [15, 20, 25, 30, 45, 50, 60],
  shortBreak: [3, 5, 10, 15],
  longBreak: [10, 15, 20, 30],
};

export const DAILY_GOAL_OPTIONS = [4, 6, 8, 10, 12];

// Daily minutes goal options (in minutes)
export const DAILY_MINUTES_GOAL_OPTIONS = [60, 90, 120, 150, 180, 240, 300];

// Focus goal presets
export const FOCUS_GOAL_PRESETS = [
  {
    id: 'light',
    name: 'Light',
    nameMy: 'ပေါ့ပေါ့',
    minutes: 60,
    sessions: 4,
    description: 'Perfect for beginners',
    descriptionMy: 'အစပြုသူများအတွက် သင့်တော်',
    icon: '🌱',
  },
  {
    id: 'moderate',
    name: 'Moderate',
    nameMy: 'အလယ်အလတ်',
    minutes: 120,
    sessions: 6,
    description: 'Balanced productivity',
    descriptionMy: 'ဟန်ချက်ညီထုတ်လုပ်နိုင်စွမ်း',
    icon: '🌿',
  },
  {
    id: 'productive',
    name: 'Productive',
    nameMy: 'ထုတ်လုပ်နိုင်စွမ်းမြင့်',
    minutes: 180,
    sessions: 8,
    description: 'For serious work days',
    descriptionMy: 'အလုပ်များသောနေ့များအတွက်',
    icon: '🌳',
  },
  {
    id: 'intense',
    name: 'Intense',
    nameMy: 'ပြင်းထန်',
    minutes: 240,
    sessions: 10,
    description: 'Maximum focus mode',
    descriptionMy: 'အမြင့်ဆုံးအာရုံစူးစိုက်မှု',
    icon: '🔥',
  },
];

// Get focus goal progress percentage
export const getFocusGoalProgress = (currentMinutes: number, goalMinutes: number): number => {
  if (goalMinutes <= 0) return 0;
  return Math.min(100, Math.round((currentMinutes / goalMinutes) * 100));
};

// Get motivational message based on progress
export const getFocusMotivation = (
  progress: number,
  isBurmese: boolean
): { emoji: string; message: string } => {
  if (progress >= 100) {
    return {
      emoji: '🎉',
      message: isBurmese
        ? 'အံ့သြစရာ! ယနေ့ပန်းတိုင်ပြည့်မီပါပြီ!'
        : 'Amazing! You reached your daily goal!',
    };
  } else if (progress >= 75) {
    return {
      emoji: '🔥',
      message: isBurmese ? 'နီးပါပြီ! နောက်ထပ်အနည်းငယ်သာ!' : 'Almost there! Just a bit more!',
    };
  } else if (progress >= 50) {
    return {
      emoji: '💪',
      message: isBurmese ? 'ကောင်းနေပါတယ်! တစ်ဝက်ကျော်ပြီ!' : 'Great progress! Over halfway there!',
    };
  } else if (progress >= 25) {
    return {
      emoji: '🚀',
      message: isBurmese ? 'ကောင်းသောစတင်မှု! ဆက်သွားပါ!' : 'Good start! Keep going!',
    };
  } else if (progress > 0) {
    return {
      emoji: '🌟',
      message: isBurmese ? 'စတင်ပြီ! အရှိန်ယူပါ!' : 'Started! Build momentum!',
    };
  }
  return {
    emoji: '🎯',
    message: isBurmese ? 'ယနေ့ပန်းတိုင်ကို စတင်ကြပါစို့!' : "Let's start today's focus goal!",
  };
};

// Format minutes to hours and minutes display
export const formatMinutesToDisplay = (minutes: number, isBurmese: boolean): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return isBurmese ? `${hours}နာရီ ${mins}မိနစ်` : `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return isBurmese ? `${hours}နာရီ` : `${hours}h`;
  }
  return isBurmese ? `${mins}မိနစ်` : `${mins}m`;
};
