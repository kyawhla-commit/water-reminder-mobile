import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
    getSleepChannelId,
    getSleepSound,
    getSleepSoundOption,
} from './focusSleepNotificationSounds';

const BEDTIME_SETTINGS_KEY = '@hydromate_bedtime_settings';

export interface BedtimeSettings {
  enabled: boolean;
  bedtime: string; // HH:MM format
  windDownMinutes: number; // Minutes before bedtime to start wind-down
  reminders: BedtimeReminder[];
  weekdaysOnly: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface BedtimeReminder {
  id: string;
  minutesBefore: number;
  type: 'wind-down' | 'screen-time' | 'hydration' | 'bedtime';
  enabled: boolean;
}

export interface WindDownTip {
  id: string;
  icon: string;
  title: string;
  titleMy: string;
  description: string;
  descriptionMy: string;
  category: 'screen' | 'relaxation' | 'environment' | 'hydration' | 'activity';
}

export interface BedtimeRoutineStep {
  id: string;
  time: string; // Relative time like "60 min before"
  icon: string;
  title: string;
  titleMy: string;
  description: string;
  descriptionMy: string;
  completed: boolean;
}

// Default reminders
const DEFAULT_REMINDERS: BedtimeReminder[] = [
  { id: 'wind-down-60', minutesBefore: 60, type: 'wind-down', enabled: true },
  { id: 'screen-time-30', minutesBefore: 30, type: 'screen-time', enabled: true },
  { id: 'hydration-45', minutesBefore: 45, type: 'hydration', enabled: true },
  { id: 'bedtime-15', minutesBefore: 15, type: 'bedtime', enabled: true },
];

// Wind-down tips
export const WIND_DOWN_TIPS: WindDownTip[] = [
  {
    id: 'dim-lights',
    icon: '💡',
    title: 'Dim the Lights',
    titleMy: 'မီးများမှိန်ပါ',
    description: "Lower your room lighting to signal your body it's time to sleep.",
    descriptionMy: 'အိပ်ချိန်ရောက်ပြီဟု သင့်ခန္ဓာကိုယ်ကို အချက်ပြရန် အခန်းမီးကို လျှော့ပါ။',
    category: 'environment',
  },
  {
    id: 'no-screens',
    icon: '📱',
    title: 'Put Away Screens',
    titleMy: 'ဖန်သားပြင်များ ဖယ်ထားပါ',
    description: 'Blue light from devices can disrupt your sleep. Try reading instead.',
    descriptionMy:
      'စက်ပစ္စည်းများမှ အပြာရောင်အလင်းသည် အိပ်စက်မှုကို နှောင့်ယှက်နိုင်သည်။ စာဖတ်ကြည့်ပါ။',
    category: 'screen',
  },
  {
    id: 'cool-room',
    icon: '❄️',
    title: 'Cool Your Room',
    titleMy: 'အခန်းကို အေးအောင်လုပ်ပါ',
    description: 'Ideal sleep temperature is 65-68°F (18-20°C).',
    descriptionMy: 'အကောင်းဆုံးအိပ်စက်မှုအပူချိန်မှာ ၁၈-၂၀°C ဖြစ်သည်။',
    category: 'environment',
  },
  {
    id: 'light-stretch',
    icon: '🧘',
    title: 'Light Stretching',
    titleMy: 'ပေါ့ပေါ့ဆန့်ခြင်း',
    description: 'Gentle stretches can help release tension and prepare for sleep.',
    descriptionMy:
      'ဖြည်းဖြည်းဆန့်ခြင်းသည် တင်းမာမှုကို ဖြေလျှော့ပြီး အိပ်စက်မှုအတွက် ပြင်ဆင်ပေးသည်။',
    category: 'relaxation',
  },
  {
    id: 'deep-breathing',
    icon: '🌬️',
    title: 'Deep Breathing',
    titleMy: 'အသက်ရှူလေ့ကျင့်ခန်း',
    description: 'Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s.',
    descriptionMy: '၄-၇-၈ အသက်ရှူနည်း: ၄စက္ကန့်ရှူသွင်း၊ ၇စက္ကန့်ထိန်း၊ ၈စက္ကန့်ရှူထုတ်။',
    category: 'relaxation',
  },
  {
    id: 'no-caffeine',
    icon: '☕',
    title: 'Avoid Caffeine',
    titleMy: 'ကဖိန်းရှောင်ပါ',
    description: 'No coffee, tea, or chocolate at least 6 hours before bed.',
    descriptionMy: 'အိပ်ရာမဝင်မီ အနည်းဆုံး ၆ နာရီ ကော်ဖီ၊ လက်ဖက်ရည်၊ ချောကလက် မသောက်ပါနှင့်။',
    category: 'activity',
  },
  {
    id: 'last-water',
    icon: '💧',
    title: 'Last Glass of Water',
    titleMy: 'နောက်ဆုံးရေတစ်ခွက်',
    description: 'Drink your last water 2 hours before bed to avoid nighttime waking.',
    descriptionMy: 'ညအိပ်ရာမဝင်မီ ၂ နာရီအလို နောက်ဆုံးရေသောက်ပါ။',
    category: 'hydration',
  },
  {
    id: 'journal',
    icon: '📝',
    title: 'Write in Journal',
    titleMy: 'ဂျာနယ်ရေးပါ',
    description: "Write down thoughts or tomorrow's tasks to clear your mind.",
    descriptionMy: 'စိတ်ကို ရှင်းလင်းရန် အတွေးများ သို့မဟုတ် မနက်ဖြန်လုပ်ရန်များ ရေးပါ။',
    category: 'relaxation',
  },
  {
    id: 'warm-bath',
    icon: '🛁',
    title: 'Warm Bath/Shower',
    titleMy: 'ရေနွေးချိုးပါ',
    description: 'A warm bath 1-2 hours before bed can improve sleep quality.',
    descriptionMy:
      'အိပ်ရာမဝင်မီ ၁-၂ နာရီအလို ရေနွေးချိုးခြင်းသည် အိပ်စက်မှုအရည်အသွေးကို တိုးတက်စေသည်။',
    category: 'relaxation',
  },
  {
    id: 'night-mode',
    icon: '🌙',
    title: 'Enable Night Mode',
    titleMy: 'ညမုဒ်ဖွင့်ပါ',
    description: 'Turn on night mode or blue light filter on all devices.',
    descriptionMy: 'စက်ပစ္စည်းအားလုံးတွင် ညမုဒ် သို့မဟုတ် အပြာရောင်အလင်းစစ်ထုတ်မှု ဖွင့်ပါ။',
    category: 'screen',
  },
];

// Notification messages
export const NOTIFICATION_MESSAGES = {
  'wind-down': {
    title: '🌙 Time to Wind Down',
    titleMy: '🌙 အနားယူချိန်ရောက်ပြီ',
    body: 'Start your bedtime routine. Dim lights and relax.',
    bodyMy: 'အိပ်ရာဝင်အလေ့အထ စတင်ပါ။ မီးမှိန်ပြီး အနားယူပါ။',
  },
  'screen-time': {
    title: '📱 Screen Time Reminder',
    titleMy: '📱 ဖန်သားပြင်အချိန် သတိပေးချက်',
    body: 'Put away your devices. Blue light affects sleep quality.',
    bodyMy: 'စက်ပစ္စည်းများ ဖယ်ထားပါ။ အပြာရောင်အလင်းသည် အိပ်စက်မှုကို ထိခိုက်သည်။',
  },
  hydration: {
    title: '💧 Last Hydration Check',
    titleMy: '💧 နောက်ဆုံးရေဓာတ်စစ်ဆေးမှု',
    body: 'Drink your last glass of water before bed.',
    bodyMy: 'အိပ်ရာမဝင်မီ နောက်ဆုံးရေတစ်ခွက် သောက်ပါ။',
  },
  bedtime: {
    title: '😴 Bedtime!',
    titleMy: '😴 အိပ်ရာဝင်ချိန်!',
    body: 'Time to sleep. Sweet dreams!',
    bodyMy: 'အိပ်ချိန်ရောက်ပြီ။ အိပ်မက်ကောင်းမက်ပါ!',
  },
};

const getDefaultSettings = (): BedtimeSettings => ({
  enabled: false,
  bedtime: '22:00',
  windDownMinutes: 60,
  reminders: DEFAULT_REMINDERS,
  weekdaysOnly: false,
  soundEnabled: true,
  vibrationEnabled: true,
});

export const loadBedtimeSettings = async (): Promise<BedtimeSettings> => {
  try {
    const data = await AsyncStorage.getItem(BEDTIME_SETTINGS_KEY);
    return data ? { ...getDefaultSettings(), ...JSON.parse(data) } : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
};

export const saveBedtimeSettings = async (settings: BedtimeSettings): Promise<void> => {
  await AsyncStorage.setItem(BEDTIME_SETTINGS_KEY, JSON.stringify(settings));

  // Reschedule notifications when settings change
  if (settings.enabled) {
    await scheduleBedtimeNotifications(settings);
  } else {
    await cancelBedtimeNotifications();
  }
};

export const scheduleBedtimeNotifications = async (settings: BedtimeSettings): Promise<void> => {
  // Cancel existing notifications first
  await cancelBedtimeNotifications();

  if (!settings.enabled) return;

  const [hours, minutes] = settings.bedtime.split(':').map(Number);

  for (const reminder of settings.reminders) {
    if (!reminder.enabled) continue;

    // Calculate notification time
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);
    notificationTime.setMinutes(notificationTime.getMinutes() - reminder.minutesBefore);

    // If time has passed today, schedule for tomorrow
    if (notificationTime <= new Date()) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    const message = NOTIFICATION_MESSAGES[reminder.type];

    try {
      // Get sleep sound settings
      const sleepSound = await getSleepSound();
      const soundOption = getSleepSoundOption(sleepSound);

      const notificationContent: any = {
        title: message.title,
        body: message.body,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
        data: { type: 'bedtime', reminderId: reminder.id },
      };

      // Configure sound based on platform
      if (Platform.OS === 'android') {
        notificationContent.channelId = getSleepChannelId();
        // Sound is configured in the channel
      } else if (Platform.OS === 'ios') {
        if (sleepSound === 'silent' || !settings.soundEnabled) {
          notificationContent.sound = false;
        } else if (soundOption?.iosSound) {
          notificationContent.sound = soundOption.iosSound;
        } else {
          notificationContent.sound = settings.soundEnabled;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: notificationTime.getHours(),
          minute: notificationTime.getMinutes(),
        },
        identifier: `bedtime-${reminder.id}`,
      });

      console.log(
        `✅ Bedtime notification scheduled for ${notificationTime.getHours()}:${notificationTime.getMinutes()}`
      );
    } catch (error) {
      console.error('Error scheduling bedtime notification:', error);
    }
  }
};

export const cancelBedtimeNotifications = async (): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.identifier.startsWith('bedtime-')) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling bedtime notifications:', error);
  }
};

export const toggleReminder = async (reminderId: string): Promise<BedtimeSettings> => {
  const settings = await loadBedtimeSettings();
  const reminder = settings.reminders.find((r) => r.id === reminderId);
  if (reminder) {
    reminder.enabled = !reminder.enabled;
  }
  await saveBedtimeSettings(settings);
  return settings;
};

export const updateBedtime = async (bedtime: string): Promise<BedtimeSettings> => {
  const settings = await loadBedtimeSettings();
  settings.bedtime = bedtime;
  await saveBedtimeSettings(settings);
  return settings;
};

export const getTimeUntilBedtime = (
  bedtime: string
): { hours: number; minutes: number; isPast: boolean } => {
  const [bedHours, bedMinutes] = bedtime.split(':').map(Number);
  const now = new Date();
  const bedtimeToday = new Date();
  bedtimeToday.setHours(bedHours, bedMinutes, 0, 0);

  let diff = bedtimeToday.getTime() - now.getTime();
  const isPast = diff < 0;

  if (isPast) {
    // Calculate time until tomorrow's bedtime
    bedtimeToday.setDate(bedtimeToday.getDate() + 1);
    diff = bedtimeToday.getTime() - now.getTime();
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, isPast };
};

export const isWindDownTime = (bedtime: string, windDownMinutes: number): boolean => {
  const { hours, minutes, isPast } = getTimeUntilBedtime(bedtime);
  if (isPast) return false;

  const totalMinutes = hours * 60 + minutes;
  return totalMinutes <= windDownMinutes && totalMinutes > 0;
};

export const getCurrentWindDownTips = (bedtime: string, windDownMinutes: number): WindDownTip[] => {
  const { hours, minutes } = getTimeUntilBedtime(bedtime);
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes > windDownMinutes) {
    return []; // Not wind-down time yet
  }

  // Return tips based on time remaining
  if (totalMinutes > 45) {
    return WIND_DOWN_TIPS.filter((t) => ['environment', 'activity'].includes(t.category));
  } else if (totalMinutes > 30) {
    return WIND_DOWN_TIPS.filter((t) => ['screen', 'hydration'].includes(t.category));
  } else if (totalMinutes > 15) {
    return WIND_DOWN_TIPS.filter((t) => ['relaxation'].includes(t.category));
  } else {
    return WIND_DOWN_TIPS.filter((t) => t.id === 'deep-breathing' || t.id === 'journal');
  }
};

export const generateBedtimeRoutine = (bedtime: string): BedtimeRoutineStep[] => {
  const [hours, minutes] = bedtime.split(':').map(Number);

  const formatTime = (minsBefore: number): string => {
    const time = new Date();
    time.setHours(hours, minutes - minsBefore, 0, 0);
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return [
    {
      id: 'step-60',
      time: formatTime(60),
      icon: '💡',
      title: 'Dim Lights & Start Wind-Down',
      titleMy: 'မီးမှိန်ပြီး အနားယူစတင်ပါ',
      description: 'Lower room lighting, put away work',
      descriptionMy: 'အခန်းမီးလျှော့ပါ၊ အလုပ်ဖယ်ထားပါ',
      completed: false,
    },
    {
      id: 'step-45',
      time: formatTime(45),
      icon: '💧',
      title: 'Last Glass of Water',
      titleMy: 'နောက်ဆုံးရေတစ်ခွက်',
      description: 'Hydrate before sleep',
      descriptionMy: 'အိပ်ရာမဝင်မီ ရေသောက်ပါ',
      completed: false,
    },
    {
      id: 'step-30',
      time: formatTime(30),
      icon: '📱',
      title: 'Screen-Free Time',
      titleMy: 'ဖန်သားပြင်ကင်းချိန်',
      description: 'Put away all devices',
      descriptionMy: 'စက်ပစ္စည်းအားလုံး ဖယ်ထားပါ',
      completed: false,
    },
    {
      id: 'step-20',
      time: formatTime(20),
      icon: '🧘',
      title: 'Relaxation',
      titleMy: 'အနားယူခြင်း',
      description: 'Light stretching or reading',
      descriptionMy: 'ပေါ့ပေါ့ဆန့်ခြင်း သို့မဟုတ် စာဖတ်ခြင်း',
      completed: false,
    },
    {
      id: 'step-10',
      time: formatTime(10),
      icon: '🌬️',
      title: 'Deep Breathing',
      titleMy: 'အသက်ရှူလေ့ကျင့်ခန်း',
      description: 'Calm your mind with breathing exercises',
      descriptionMy: 'အသက်ရှူလေ့ကျင့်ခန်းဖြင့် စိတ်ငြိမ်ပါ',
      completed: false,
    },
    {
      id: 'step-0',
      time: formatTime(0),
      icon: '😴',
      title: 'Bedtime',
      titleMy: 'အိပ်ရာဝင်ချိန်',
      description: 'Time to sleep!',
      descriptionMy: 'အိပ်ချိန်ရောက်ပြီ!',
      completed: false,
    },
  ];
};

export const BEDTIME_PRESETS = [
  { label: '9:00 PM', labelMy: 'ည ၉:၀၀', value: '21:00' },
  { label: '9:30 PM', labelMy: 'ည ၉:၃၀', value: '21:30' },
  { label: '10:00 PM', labelMy: 'ည ၁၀:၀၀', value: '22:00' },
  { label: '10:30 PM', labelMy: 'ည ၁၀:၃၀', value: '22:30' },
  { label: '11:00 PM', labelMy: 'ည ၁၁:၀၀', value: '23:00' },
  { label: '11:30 PM', labelMy: 'ည ၁၁:၃၀', value: '23:30' },
  { label: '12:00 AM', labelMy: 'သန်းခေါင် ၁၂:၀၀', value: '00:00' },
];

export const WIND_DOWN_DURATIONS = [
  { label: '30 min', labelMy: '၃၀ မိနစ်', value: 30 },
  { label: '45 min', labelMy: '၄၅ မိနစ်', value: 45 },
  { label: '60 min', labelMy: '၆၀ မိနစ်', value: 60 },
  { label: '90 min', labelMy: '၉၀ မိနစ်', value: 90 },
];
