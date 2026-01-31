import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const FOCUS_HISTORY_KEY = '@hydromate_focus_history';
const DEEP_WORK_SETTINGS_KEY = '@hydromate_deep_work_settings';
const APP_BLOCKER_KEY = '@hydromate_app_blocker';

// ============ FOCUS SESSION HISTORY ============

export interface FocusSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  type: 'pomodoro' | 'deepWork' | 'custom';
  completed: boolean;
  interruptions: number;
  productivity: number; // 1-5 rating
  notes?: string;
}

export interface FocusHistoryStats {
  totalSessions: number;
  totalMinutes: number;
  avgSessionLength: number;
  avgProductivity: number;
  completionRate: number;
  bestDay: string;
  bestDayMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyData: WeeklyFocusData[];
  hourlyDistribution: number[];
  dayOfWeekDistribution: number[];
}

export interface WeeklyFocusData {
  week: string;
  sessions: number;
  minutes: number;
  avgProductivity: number;
}

export interface DailyFocusData {
  date: string;
  sessions: number;
  minutes: number;
  avgProductivity: number;
}

// ============ DEEP WORK MODE ============

export interface DeepWorkSettings {
  enabled: boolean;
  defaultDuration: number; // minutes (60, 90, 120, 180)
  enableDND: boolean;
  blockNotifications: boolean;
  showCountdown: boolean;
  playAmbientSound: boolean;
  ambientSoundId?: string;
  breakReminders: boolean;
  breakInterval: number; // minutes
  autoEndSession: boolean;
  trackInterruptions: boolean;
}

export interface DeepWorkSession {
  id: string;
  startTime: string;
  endTime?: string;
  plannedDuration: number;
  actualDuration?: number;
  interruptions: number;
  completed: boolean;
  productivity?: number;
}

// ============ APP BLOCKER ============

export interface AppBlockerSettings {
  enabled: boolean;
  blockDuringFocus: boolean;
  blockDuringDeepWork: boolean;
  showSuggestions: boolean;
  blockedApps: BlockedApp[];
  schedules: BlockSchedule[];
}

export interface BlockedApp {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  category: 'social' | 'entertainment' | 'games' | 'news' | 'other';
  isBlocked: boolean;
}

export interface BlockSchedule {
  id: string;
  name: string;
  days: number[]; // 0-6 (Sun-Sat)
  startTime: string;
  endTime: string;
  enabled: boolean;
}

// Common distracting apps suggestions
export const SUGGESTED_APPS_TO_BLOCK: Omit<BlockedApp, 'id' | 'isBlocked'>[] = [
  { name: 'Facebook', packageName: 'com.facebook.katana', icon: '📘', category: 'social' },
  { name: 'Instagram', packageName: 'com.instagram.android', icon: '📷', category: 'social' },
  { name: 'TikTok', packageName: 'com.zhiliaoapp.musically', icon: '🎵', category: 'entertainment' },
  { name: 'Twitter/X', packageName: 'com.twitter.android', icon: '🐦', category: 'social' },
  { name: 'YouTube', packageName: 'com.google.android.youtube', icon: '▶️', category: 'entertainment' },
  { name: 'Netflix', packageName: 'com.netflix.mediaclient', icon: '🎬', category: 'entertainment' },
  { name: 'Reddit', packageName: 'com.reddit.frontpage', icon: '🔴', category: 'social' },
  { name: 'Snapchat', packageName: 'com.snapchat.android', icon: '👻', category: 'social' },
  { name: 'WhatsApp', packageName: 'com.whatsapp', icon: '💬', category: 'social' },
  { name: 'Telegram', packageName: 'org.telegram.messenger', icon: '✈️', category: 'social' },
  { name: 'Games', packageName: 'games.generic', icon: '🎮', category: 'games' },
  { name: 'News Apps', packageName: 'news.generic', icon: '📰', category: 'news' },
];

// Deep Work duration presets
export const DEEP_WORK_DURATIONS = [
  { id: 'short', minutes: 60, name: '1 Hour', nameMy: '၁ နာရီ', icon: '⚡' },
  { id: 'medium', minutes: 90, name: '90 Minutes', nameMy: '၉၀ မိနစ်', icon: '🎯' },
  { id: 'long', minutes: 120, name: '2 Hours', nameMy: '၂ နာရီ', icon: '🧠' },
  { id: 'extended', minutes: 180, name: '3 Hours', nameMy: '၃ နာရီ', icon: '🔥' },
];

// ============ STORAGE FUNCTIONS ============

const getDefaultDeepWorkSettings = (): DeepWorkSettings => ({
  enabled: true,
  defaultDuration: 90,
  enableDND: true,
  blockNotifications: true,
  showCountdown: true,
  playAmbientSound: false,
  breakReminders: true,
  breakInterval: 45,
  autoEndSession: true,
  trackInterruptions: true,
});

const getDefaultAppBlockerSettings = (): AppBlockerSettings => ({
  enabled: true,
  blockDuringFocus: true,
  blockDuringDeepWork: true,
  showSuggestions: true,
  blockedApps: [],
  schedules: [],
});

export const loadFocusHistory = async (): Promise<FocusSession[]> => {
  try {
    const data = await AsyncStorage.getItem(FOCUS_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveFocusSession = async (session: FocusSession): Promise<void> => {
  const history = await loadFocusHistory();
  history.unshift(session);
  // Keep last 100 sessions
  const trimmed = history.slice(0, 100);
  await AsyncStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(trimmed));
};

export const loadDeepWorkSettings = async (): Promise<DeepWorkSettings> => {
  try {
    const data = await AsyncStorage.getItem(DEEP_WORK_SETTINGS_KEY);
    return data ? { ...getDefaultDeepWorkSettings(), ...JSON.parse(data) } : getDefaultDeepWorkSettings();
  } catch {
    return getDefaultDeepWorkSettings();
  }
};

export const saveDeepWorkSettings = async (settings: DeepWorkSettings): Promise<void> => {
  await AsyncStorage.setItem(DEEP_WORK_SETTINGS_KEY, JSON.stringify(settings));
};

export const loadAppBlockerSettings = async (): Promise<AppBlockerSettings> => {
  try {
    const data = await AsyncStorage.getItem(APP_BLOCKER_KEY);
    return data ? { ...getDefaultAppBlockerSettings(), ...JSON.parse(data) } : getDefaultAppBlockerSettings();
  } catch {
    return getDefaultAppBlockerSettings();
  }
};

export const saveAppBlockerSettings = async (settings: AppBlockerSettings): Promise<void> => {
  await AsyncStorage.setItem(APP_BLOCKER_KEY, JSON.stringify(settings));
};

// ============ ANALYTICS FUNCTIONS ============

export const calculateFocusStats = (sessions: FocusSession[]): FocusHistoryStats => {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      avgSessionLength: 0,
      avgProductivity: 0,
      completionRate: 0,
      bestDay: '',
      bestDayMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyData: [],
      hourlyDistribution: new Array(24).fill(0),
      dayOfWeekDistribution: new Array(7).fill(0),
    };
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const completedSessions = sessions.filter((s) => s.completed);
  const avgProductivity =
    sessions.reduce((sum, s) => sum + (s.productivity || 0), 0) / sessions.length;

  // Calculate daily totals
  const dailyTotals: Record<string, number> = {};
  sessions.forEach((s) => {
    const date = s.date.split('T')[0];
    dailyTotals[date] = (dailyTotals[date] || 0) + s.duration;
  });

  // Find best day
  let bestDay = '';
  let bestDayMinutes = 0;
  Object.entries(dailyTotals).forEach(([date, minutes]) => {
    if (minutes > bestDayMinutes) {
      bestDay = date;
      bestDayMinutes = minutes;
    }
  });

  // Calculate streak
  const sortedDates = Object.keys(dailyTotals).sort().reverse();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const prevDate = i > 0 ? sortedDates[i - 1] : today;
    const dayDiff = Math.floor(
      (new Date(prevDate).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff <= 1) {
      tempStreak++;
      if (i === 0 || (i > 0 && dayDiff === 1)) {
        currentStreak = tempStreak;
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Hourly distribution
  const hourlyDistribution = new Array(24).fill(0);
  sessions.forEach((s) => {
    const hour = new Date(s.startTime).getHours();
    hourlyDistribution[hour] += s.duration;
  });

  // Day of week distribution
  const dayOfWeekDistribution = new Array(7).fill(0);
  sessions.forEach((s) => {
    const day = new Date(s.date).getDay();
    dayOfWeekDistribution[day] += s.duration;
  });

  return {
    totalSessions: sessions.length,
    totalMinutes,
    avgSessionLength: Math.round(totalMinutes / sessions.length),
    avgProductivity: Math.round(avgProductivity * 10) / 10,
    completionRate: Math.round((completedSessions.length / sessions.length) * 100),
    bestDay,
    bestDayMinutes,
    currentStreak,
    longestStreak,
    weeklyData: [],
    hourlyDistribution,
    dayOfWeekDistribution,
  };
};

export const getRecentSessions = (sessions: FocusSession[], days: number = 7): FocusSession[] => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sessions.filter((s) => new Date(s.date) >= cutoff);
};

export const getDailyFocusData = (sessions: FocusSession[], days: number = 7): DailyFocusData[] => {
  const result: DailyFocusData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const daySessions = sessions.filter((s) => s.date.startsWith(dateStr));
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);
    const avgProductivity =
      daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + (s.productivity || 0), 0) / daySessions.length
        : 0;

    result.push({
      date: dateStr,
      sessions: daySessions.length,
      minutes: totalMinutes,
      avgProductivity: Math.round(avgProductivity * 10) / 10,
    });
  }

  return result;
};

// ============ DEEP WORK HELPERS ============

export const startDeepWorkSession = async (duration: number): Promise<DeepWorkSession> => {
  const session: DeepWorkSession = {
    id: Date.now().toString(),
    startTime: new Date().toISOString(),
    plannedDuration: duration,
    interruptions: 0,
    completed: false,
  };
  return session;
};

export const endDeepWorkSession = async (
  session: DeepWorkSession,
  productivity: number
): Promise<FocusSession> => {
  const endTime = new Date().toISOString();
  const actualDuration = Math.round(
    (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 60000
  );

  const focusSession: FocusSession = {
    id: session.id,
    date: session.startTime.split('T')[0],
    startTime: session.startTime,
    endTime,
    duration: actualDuration,
    type: 'deepWork',
    completed: actualDuration >= session.plannedDuration * 0.8,
    interruptions: session.interruptions,
    productivity,
  };

  await saveFocusSession(focusSession);
  return focusSession;
};

export const sendDeepWorkNotification = async (
  type: 'start' | 'break' | 'end',
  isBurmese: boolean
): Promise<void> => {
  const messages = {
    start: {
      title: isBurmese ? '🧠 Deep Work စတင်ပြီ' : '🧠 Deep Work Started',
      body: isBurmese
        ? 'အာရုံစူးစိုက်မှုမုဒ်ဖွင့်ထားပါပြီ။ အနှောင့်အယှက်များကို ရှောင်ပါ။'
        : 'Focus mode activated. Avoid distractions.',
    },
    break: {
      title: isBurmese ? '☕ အနားယူချိန်' : '☕ Break Time',
      body: isBurmese
        ? 'ခဏအနားယူပြီး ရေသောက်ပါ။ မျက်လုံးကိုလည်း အနားပေးပါ။'
        : 'Take a short break. Drink water and rest your eyes.',
    },
    end: {
      title: isBurmese ? '✅ Deep Work ပြီးဆုံးပြီ' : '✅ Deep Work Complete',
      body: isBurmese
        ? 'ကောင်းမွန်သောအလုပ်! သင့်ထုတ်လုပ်နိုင်စွမ်းကို အဆင့်သတ်မှတ်ပါ။'
        : 'Great work! Rate your productivity.',
    },
  };

  const message = messages[type];

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// ============ PRODUCTIVITY INSIGHTS ============

export const getProductivityInsights = (
  stats: FocusHistoryStats,
  isBurmese: boolean
): { emoji: string; title: string; message: string }[] => {
  const insights: { emoji: string; title: string; message: string }[] = [];

  // Best time insight
  const maxHour = stats.hourlyDistribution.indexOf(Math.max(...stats.hourlyDistribution));
  if (maxHour >= 0) {
    const timeStr = `${maxHour}:00 - ${maxHour + 1}:00`;
    insights.push({
      emoji: '⏰',
      title: isBurmese ? 'အကောင်းဆုံးအချိန်' : 'Peak Hours',
      message: isBurmese
        ? `${timeStr} တွင် သင်အထိရောက်ဆုံးဖြစ်သည်`
        : `You're most productive around ${timeStr}`,
    });
  }

  // Streak insight
  if (stats.currentStreak >= 3) {
    insights.push({
      emoji: '🔥',
      title: isBurmese ? 'ဆက်တိုက်အောင်မြင်မှု' : 'On a Roll',
      message: isBurmese
        ? `${stats.currentStreak} ရက်ဆက်တိုက် အာရုံစူးစိုက်နေပါပြီ!`
        : `${stats.currentStreak} day focus streak! Keep it up!`,
    });
  }

  // Completion rate insight
  if (stats.completionRate >= 80) {
    insights.push({
      emoji: '🎯',
      title: isBurmese ? 'ပြီးမြောက်မှုမြင့်' : 'High Completion',
      message: isBurmese
        ? `${stats.completionRate}% ပြီးမြောက်မှုနှုန်း - အံ့သြစရာ!`
        : `${stats.completionRate}% completion rate - Amazing!`,
    });
  } else if (stats.completionRate < 50 && stats.totalSessions > 5) {
    insights.push({
      emoji: '💡',
      title: isBurmese ? 'အကြံပြုချက်' : 'Suggestion',
      message: isBurmese
        ? 'ပိုတိုသော session များဖြင့် စမ်းကြည့်ပါ'
        : 'Try shorter sessions to improve completion',
    });
  }

  // Best day insight
  if (stats.bestDay) {
    const dayNames = isBurmese
      ? ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDayOfWeek = stats.dayOfWeekDistribution.indexOf(
      Math.max(...stats.dayOfWeekDistribution)
    );
    insights.push({
      emoji: '📅',
      title: isBurmese ? 'အကောင်းဆုံးနေ့' : 'Best Day',
      message: isBurmese
        ? `${dayNames[bestDayOfWeek]} တွင် အထိရောက်ဆုံးဖြစ်သည်`
        : `${dayNames[bestDayOfWeek]} is your most productive day`,
    });
  }

  return insights;
};

export const formatDuration = (minutes: number, isBurmese: boolean): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return isBurmese ? `${hours}နာရီ ${mins}မိနစ်` : `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return isBurmese ? `${hours}နာရီ` : `${hours}h`;
  }
  return isBurmese ? `${mins}မိနစ်` : `${mins}m`;
};
