import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const BREAK_SETTINGS_KEY = 'break_reminder_settings';
const BREAK_HISTORY_KEY = 'break_history';
const NOTIFICATION_CHANNEL_ID = 'hydromate-breaks';

/**
 * Break types
 */
export type BreakType = 
  | 'water'      // Drink water
  | 'stretch'    // Stretch/move
  | 'eyes'       // Eye rest (20-20-20 rule)
  | 'walk'       // Short walk
  | 'breathe'    // Deep breathing
  | 'snack';     // Healthy snack

/**
 * Break reminder settings
 */
export interface BreakReminderSettings {
  enabled: boolean;
  duringFocusOnly: boolean;
  
  // Intervals (in minutes)
  waterInterval: number;
  stretchInterval: number;
  eyeRestInterval: number;
  walkInterval: number;
  breatheInterval: number;
  
  // Enabled break types
  enabledBreaks: BreakType[];
  
  // Integration settings
  integrateWithWaterReminder: boolean;
  autoLogWater: boolean;
  waterAmountOnBreak: number;
  
  // Notification settings
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showMotivation: boolean;
}

/**
 * Break history entry
 */
export interface BreakEntry {
  id: string;
  type: BreakType;
  timestamp: string;
  duringFocus: boolean;
  waterLogged?: number;
  completed: boolean;
}


/**
 * Break reminder content - bilingual
 */
interface BreakContent {
  title: string;
  titleMy: string;
  body: string;
  bodyMy: string;
  emoji: string;
  duration: number; // suggested break duration in seconds
}

const BREAK_CONTENT: Record<BreakType, BreakContent[]> = {
  water: [
    {
      title: '💧 Hydration Break',
      titleMy: '💧 ရေသောက်အနားယူချိန်',
      body: 'Time to drink some water! Staying hydrated improves focus and productivity.',
      bodyMy: 'ရေသောက်ချိန်ပါ! ရေဓာတ်ထိန်းထားခြင်းသည် အာရုံစူးစိုက်မှုနှင့် ထုတ်လုပ်နိုင်စွမ်းကို မြှင့်တင်ပေးသည်။',
      emoji: '💧',
      duration: 30,
    },
    {
      title: '🥤 Water Time',
      titleMy: '🥤 ရေသောက်ချိန်',
      body: 'Your brain needs water to function at its best. Take a quick water break!',
      bodyMy: 'သင့်ဦးနှောက် အကောင်းဆုံးအလုပ်လုပ်ဖို့ ရေလိုအပ်သည်။ ရေအမြန်သောက်ပါ!',
      emoji: '🥤',
      duration: 30,
    },
  ],
  stretch: [
    {
      title: '🧘 Stretch Break',
      titleMy: '🧘 ဆန့်ထုတ်အနားယူချိန်',
      body: 'Stand up and stretch! Roll your shoulders and neck to release tension.',
      bodyMy: 'ထပြီး ဆန့်ထုတ်ပါ! ပုခုံးနှင့် လည်ပင်းကို လှည့်ပြီး တင်းကျပ်မှုကို ဖြေလျှော့ပါ။',
      emoji: '🧘',
      duration: 60,
    },
    {
      title: '💪 Movement Break',
      titleMy: '💪 လှုပ်ရှားမှုအနားယူချိန်',
      body: 'Time to move! Do some quick stretches to boost your energy.',
      bodyMy: 'လှုပ်ရှားချိန်ပါ! စွမ်းအင်မြှင့်တင်ရန် အမြန်ဆန့်ထုတ်မှုအချို့ လုပ်ပါ။',
      emoji: '💪',
      duration: 60,
    },
  ],
  eyes: [
    {
      title: '👀 Eye Rest (20-20-20)',
      titleMy: '👀 မျက်လုံးအနားပေး (20-20-20)',
      body: 'Look at something 20 feet away for 20 seconds. Your eyes will thank you!',
      bodyMy: 'ပေ ၂၀ အကွာရှိအရာကို စက္ကန့် ၂၀ ကြည့်ပါ။ သင့်မျက်လုံးများက ကျေးဇူးတင်ပါလိမ့်မည်!',
      emoji: '👀',
      duration: 20,
    },
    {
      title: '😌 Rest Your Eyes',
      titleMy: '😌 မျက်လုံးအနားပေးပါ',
      body: 'Close your eyes for a moment or look away from the screen.',
      bodyMy: 'ခဏမျက်လုံးပိတ်ပါ သို့မဟုတ် စခရင်မှ အဝေးကြည့်ပါ။',
      emoji: '😌',
      duration: 20,
    },
  ],
  walk: [
    {
      title: '🚶 Walking Break',
      titleMy: '🚶 လမ်းလျှောက်အနားယူချိန်',
      body: 'Take a short walk! Even 2-3 minutes of walking boosts creativity.',
      bodyMy: 'တိုတိုလမ်းလျှောက်ပါ! ၂-၃ မိနစ်လမ်းလျှောက်ရုံနှင့်ပင် ဖန်တီးနိုင်စွမ်းကို မြှင့်တင်ပေးသည်။',
      emoji: '🚶',
      duration: 180,
    },
  ],
  breathe: [
    {
      title: '🌬️ Breathing Break',
      titleMy: '🌬️ အသက်ရှူအနားယူချိန်',
      body: 'Take 5 deep breaths. Inhale for 4 seconds, hold for 4, exhale for 4.',
      bodyMy: 'နက်နက်ရှိုင်းရှိုင်း ၅ ကြိမ်ရှူပါ။ ၄ စက္ကန့်ရှူသွင်း၊ ၄ စက္ကန့်ထိန်း၊ ၄ စက္ကန့်ရှူထုတ်ပါ။',
      emoji: '🌬️',
      duration: 60,
    },
    {
      title: '😮‍💨 Relax & Breathe',
      titleMy: '😮‍💨 အနားယူပြီး အသက်ရှူပါ',
      body: 'Pause and take a few calming breaths to reset your focus.',
      bodyMy: 'ခဏရပ်ပြီး အာရုံစူးစိုက်မှုပြန်လည်သတ်မှတ်ရန် တည်ငြိမ်စေသော အသက်ရှူမှုအချို့ယူပါ။',
      emoji: '😮‍💨',
      duration: 60,
    },
  ],
  snack: [
    {
      title: '🍎 Healthy Snack Time',
      titleMy: '🍎 ကျန်းမာရေးနှင့်ညီသော သရေစာချိန်',
      body: 'Grab a healthy snack! Nuts, fruits, or veggies are great for brain power.',
      bodyMy: 'ကျန်းမာရေးနှင့်ညီသော သရေစာယူပါ! အသီးအနှံ၊ သစ်သီးများ သို့မဟုတ် ဟင်းသီးဟင်းရွက်များသည် ဦးနှောက်စွမ်းအားအတွက် ကောင်းမွန်သည်။',
      emoji: '🍎',
      duration: 300,
    },
  ],
};

const DEFAULT_SETTINGS: BreakReminderSettings = {
  enabled: true,
  duringFocusOnly: true,
  waterInterval: 30,
  stretchInterval: 45,
  eyeRestInterval: 20,
  walkInterval: 60,
  breatheInterval: 30,
  enabledBreaks: ['water', 'stretch', 'eyes'],
  integrateWithWaterReminder: true,
  autoLogWater: false,
  waterAmountOnBreak: 150,
  soundEnabled: true,
  vibrationEnabled: true,
  showMotivation: true,
};


/**
 * Get break reminder settings
 */
export const getBreakSettings = async (): Promise<BreakReminderSettings> => {
  try {
    const data = await AsyncStorage.getItem(BREAK_SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save break reminder settings
 */
export const saveBreakSettings = async (settings: Partial<BreakReminderSettings>): Promise<void> => {
  try {
    const current = await getBreakSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(BREAK_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving break settings:', error);
  }
};

/**
 * Get break history
 */
export const getBreakHistory = async (): Promise<BreakEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(BREAK_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Save break entry
 */
export const saveBreakEntry = async (entry: Omit<BreakEntry, 'id'>): Promise<BreakEntry> => {
  try {
    const history = await getBreakHistory();
    const newEntry: BreakEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    
    // Keep last 100 entries
    history.unshift(newEntry);
    const trimmed = history.slice(0, 100);
    await AsyncStorage.setItem(BREAK_HISTORY_KEY, JSON.stringify(trimmed));
    
    return newEntry;
  } catch (error) {
    console.error('Error saving break entry:', error);
    throw error;
  }
};

/**
 * Get random break content
 */
const getBreakContent = (type: BreakType, language: 'en' | 'my'): BreakContent => {
  const contents = BREAK_CONTENT[type];
  return contents[Math.floor(Math.random() * contents.length)];
};

/**
 * Setup break notification channel (Android)
 */
export const setupBreakNotificationChannel = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Break Reminders',
      description: 'Reminders to take breaks during focus sessions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#4CAF50',
      sound: 'default',
    });
  }
};

/**
 * Send break reminder notification
 */
export const sendBreakReminder = async (
  type: BreakType,
  language: 'en' | 'my' = 'en',
  duringFocus: boolean = false
): Promise<string | null> => {
  try {
    const settings = await getBreakSettings();
    if (!settings.enabled) return null;
    
    const content = getBreakContent(type, language);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: language === 'my' ? content.titleMy : content.title,
        body: language === 'my' ? content.bodyMy : content.body,
        sound: settings.soundEnabled ? 'default' : undefined,
        vibrate: settings.vibrationEnabled ? [0, 200, 100, 200] : undefined,
        data: { 
          type: 'break_reminder', 
          breakType: type,
          duringFocus,
          suggestedDuration: content.duration,
        },
        ...(Platform.OS === 'android' && { channelId: NOTIFICATION_CHANNEL_ID }),
      },
      trigger: null,
    });
    
    // Log the break reminder
    await saveBreakEntry({
      type,
      timestamp: new Date().toISOString(),
      duringFocus,
      completed: false,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error sending break reminder:', error);
    return null;
  }
};

/**
 * Schedule break reminders for a focus session
 */
export const scheduleBreakReminders = async (
  sessionDuration: number, // in minutes
  language: 'en' | 'my' = 'en'
): Promise<string[]> => {
  const settings = await getBreakSettings();
  if (!settings.enabled) return [];

  const scheduledIds: string[] = [];

  // Cancel any existing break reminders
  await cancelAllBreakReminders();
  
  for (const breakType of settings.enabledBreaks) {
    let interval: number;
    
    switch (breakType) {
      case 'water':
        interval = settings.waterInterval;
        break;
      case 'stretch':
        interval = settings.stretchInterval;
        break;
      case 'eyes':
        interval = settings.eyeRestInterval;
        break;
      case 'walk':
        interval = settings.walkInterval;
        break;
      case 'breathe':
        interval = settings.breatheInterval;
        break;
      default:
        continue;
    }
    
    // Schedule reminders at intervals throughout the session
    let nextReminder = interval;
    while (nextReminder < sessionDuration) {
      const content = getBreakContent(breakType, language);
      
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: language === 'my' ? content.titleMy : content.title,
            body: language === 'my' ? content.bodyMy : content.body,
            sound: settings.soundEnabled ? 'default' : undefined,
            vibrate: settings.vibrationEnabled ? [0, 200, 100, 200] : undefined,
            data: { 
              type: 'break_reminder', 
              breakType,
              duringFocus: true,
              suggestedDuration: content.duration,
            },
            ...(Platform.OS === 'android' && { channelId: NOTIFICATION_CHANNEL_ID }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: nextReminder * 60,
          },
        });
        
        scheduledIds.push(id);
      } catch (error) {
        console.error(`Error scheduling ${breakType} break:`, error);
      }
      
      nextReminder += interval;
    }
  }
  
  return scheduledIds;
};

/**
 * Cancel all scheduled break reminders
 */
export const cancelAllBreakReminders = async (): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const breakReminders = scheduled.filter(
      n => (n.content.data as { type?: string })?.type === 'break_reminder'
    );
    
    for (const reminder of breakReminders) {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
    }
  } catch (error) {
    console.error('Error canceling break reminders:', error);
  }
};


/**
 * Mark break as completed
 */
export const completeBreak = async (
  breakId: string,
  waterLogged?: number
): Promise<void> => {
  try {
    const history = await getBreakHistory();
    const index = history.findIndex(b => b.id === breakId);
    
    if (index !== -1) {
      history[index].completed = true;
      if (waterLogged) {
        history[index].waterLogged = waterLogged;
      }
      await AsyncStorage.setItem(BREAK_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error completing break:', error);
  }
};

/**
 * Get today's break statistics
 */
export const getTodayBreakStats = async (): Promise<{
  totalBreaks: number;
  completedBreaks: number;
  waterBreaks: number;
  stretchBreaks: number;
  eyeBreaks: number;
  totalWaterLogged: number;
}> => {
  try {
    const history = await getBreakHistory();
    const today = new Date().toDateString();
    
    const todayBreaks = history.filter(
      b => new Date(b.timestamp).toDateString() === today
    );
    
    return {
      totalBreaks: todayBreaks.length,
      completedBreaks: todayBreaks.filter(b => b.completed).length,
      waterBreaks: todayBreaks.filter(b => b.type === 'water').length,
      stretchBreaks: todayBreaks.filter(b => b.type === 'stretch').length,
      eyeBreaks: todayBreaks.filter(b => b.type === 'eyes').length,
      totalWaterLogged: todayBreaks.reduce((sum, b) => sum + (b.waterLogged || 0), 0),
    };
  } catch {
    return {
      totalBreaks: 0,
      completedBreaks: 0,
      waterBreaks: 0,
      stretchBreaks: 0,
      eyeBreaks: 0,
      totalWaterLogged: 0,
    };
  }
};

/**
 * Get break type info
 */
export const getBreakTypeInfo = (
  type: BreakType,
  language: 'en' | 'my' = 'en'
): { name: string; emoji: string; description: string } => {
  const info: Record<BreakType, { name: string; nameMy: string; emoji: string; desc: string; descMy: string }> = {
    water: {
      name: 'Water Break',
      nameMy: 'ရေသောက်အနားယူချိန်',
      emoji: '💧',
      desc: 'Stay hydrated for better focus',
      descMy: 'ပိုကောင်းသောအာရုံစူးစိုက်မှုအတွက် ရေဓာတ်ထိန်းထားပါ',
    },
    stretch: {
      name: 'Stretch Break',
      nameMy: 'ဆန့်ထုတ်အနားယူချိန်',
      emoji: '🧘',
      desc: 'Release muscle tension',
      descMy: 'ကြွက်သားတင်းကျပ်မှုကို ဖြေလျှော့ပါ',
    },
    eyes: {
      name: 'Eye Rest',
      nameMy: 'မျက်လုံးအနားပေး',
      emoji: '👀',
      desc: '20-20-20 rule for eye health',
      descMy: 'မျက်လုံးကျန်းမာရေးအတွက် 20-20-20 စည်းမျဉ်း',
    },
    walk: {
      name: 'Walking Break',
      nameMy: 'လမ်းလျှောက်အနားယူချိန်',
      emoji: '🚶',
      desc: 'Move around to boost energy',
      descMy: 'စွမ်းအင်မြှင့်တင်ရန် လှုပ်ရှားပါ',
    },
    breathe: {
      name: 'Breathing Break',
      nameMy: 'အသက်ရှူအနားယူချိန်',
      emoji: '🌬️',
      desc: 'Deep breaths to reduce stress',
      descMy: 'စိတ်ဖိစီးမှုလျှော့ချရန် နက်နက်ရှိုင်းရှိုင်းအသက်ရှူပါ',
    },
    snack: {
      name: 'Snack Break',
      nameMy: 'သရေစာအနားယူချိန်',
      emoji: '🍎',
      desc: 'Healthy fuel for your brain',
      descMy: 'သင့်ဦးနှောက်အတွက် ကျန်းမာရေးနှင့်ညီသော လောင်စာ',
    },
  };
  
  const typeInfo = info[type];
  return {
    name: language === 'my' ? typeInfo.nameMy : typeInfo.name,
    emoji: typeInfo.emoji,
    description: language === 'my' ? typeInfo.descMy : typeInfo.desc,
  };
};

/**
 * Get all break types with info
 */
export const getAllBreakTypes = (
  language: 'en' | 'my' = 'en'
): {
  type: BreakType;
  name: string;
  emoji: string;
  description: string;
}[] => {
  const types: BreakType[] = ['water', 'stretch', 'eyes', 'walk', 'breathe', 'snack'];
  return types.map((type) => ({
    type,
    ...getBreakTypeInfo(type, language),
  }));
};

/**
 * Smart break suggestion based on time and history
 */
export const getSuggestedBreak = async (
  minutesSinceLastBreak: number,
  language: 'en' | 'my' = 'en'
): Promise<{ type: BreakType; reason: string } | null> => {
  const settings = await getBreakSettings();
  const history = await getBreakHistory();
  
  // Get recent breaks (last hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentBreaks = history.filter(
    b => new Date(b.timestamp).getTime() > oneHourAgo
  );
  
  // Count break types in recent history
  const recentCounts: Record<BreakType, number> = {
    water: 0, stretch: 0, eyes: 0, walk: 0, breathe: 0, snack: 0,
  };
  recentBreaks.forEach(b => recentCounts[b.type]++);
  
  // Prioritize breaks that haven't been taken recently
  const enabledBreaks = settings.enabledBreaks;
  
  // Water is always important
  if (enabledBreaks.includes('water') && recentCounts.water === 0 && minutesSinceLastBreak >= 20) {
    return {
      type: 'water',
      reason: language === 'my' 
        ? 'ရေဓာတ်ထိန်းထားရန် အချိန်တန်ပြီ' 
        : 'Time to stay hydrated',
    };
  }
  
  // Eye rest every 20 minutes
  if (enabledBreaks.includes('eyes') && minutesSinceLastBreak >= 20) {
    return {
      type: 'eyes',
      reason: language === 'my'
        ? 'သင့်မျက်လုံးများ အနားယူသင့်ပြီ'
        : 'Your eyes need a rest',
    };
  }
  
  // Stretch every 45 minutes
  if (enabledBreaks.includes('stretch') && recentCounts.stretch === 0 && minutesSinceLastBreak >= 30) {
    return {
      type: 'stretch',
      reason: language === 'my'
        ? 'ကြွက်သားများကို ဆန့်ထုတ်ပါ'
        : 'Time to stretch your muscles',
    };
  }
  
  // Breathing for stress relief
  if (enabledBreaks.includes('breathe') && recentCounts.breathe === 0) {
    return {
      type: 'breathe',
      reason: language === 'my'
        ? 'နက်နက်ရှိုင်းရှိုင်း အသက်ရှူပါ'
        : 'Take some deep breaths',
    };
  }
  
  return null;
};

/**
 * Initialize break reminders system
 */
export const initializeBreakReminders = async (): Promise<void> => {
  await setupBreakNotificationChannel();
};
