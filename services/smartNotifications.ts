import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AccessibilityInfo, Platform } from 'react-native';
import { getNotificationChannelId } from './notificationSounds';
import { getLastNDays } from './waterHistory';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const USER_PROFILE_STORAGE_KEY = 'user-profile-storage';

// Get notification channel ID from notification sounds service
const getChannelId = () => getNotificationChannelId();

// Helper to get user name from profile storage
const getUserName = async (): Promise<string | undefined> => {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed?.state?.profile?.name || undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

// Helper to get current language from storage
const getCurrentLanguage = async (): Promise<'en' | 'my'> => {
  try {
    const data = await AsyncStorage.getItem('language-storage');
    if (data) {
      const parsed = JSON.parse(data);
      return parsed?.state?.currentLanguage === 'my' ? 'my' : 'en';
    }
    return 'en';
  } catch {
    return 'en';
  }
};

export interface NotificationSettings {
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  adaptiveReminders: boolean;
  reminderInterval: number;
  dndRespect: boolean;
  motivationalMessages: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  adaptiveReminders: true,
  reminderInterval: 60,
  dndRespect: true,
  motivationalMessages: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

// Bilingual notification messages - Professional & User-friendly
interface BilingualMessage {
  title: string;
  titleMy: string;
  body: string;
  bodyMy: string;
}

const motivationalMessagesData: Record<string, BilingualMessage[]> = {
  morning: [
    {
      title: '🌅 Good Morning!',
      titleMy: '🌅 မင်္ဂလာနံနက်ခင်းပါ!',
      body: 'Start your day right with a refreshing glass of water. Your body will thank you!',
      bodyMy: 'လန်းဆန်းသောရေတစ်ခွက်ဖြင့် သင့်နေ့ကို စတင်ပါ။ သင့်ခန္ဓာကိုယ်က ကျေးဇူးတင်ပါလိမ့်မည်!',
    },
    {
      title: '☀️ Rise & Shine',
      titleMy: '☀️ နိုးထပြီ လန်းဆန်းပါစေ',
      body: 'Your body lost water while sleeping. A glass of water now boosts your metabolism!',
      bodyMy:
        'အိပ်နေစဉ် ရေဓာတ်ဆုံးရှုံးခဲ့သည်။ ယခုရေတစ်ခွက်သောက်ပြီး ဇီဝကမ္မဖြစ်စဉ်ကို မြှင့်တင်ပါ!',
    },
    {
      title: '�  Morning Energy',
      titleMy: '🌄 မနက်ခင်းစွမ်းအင်',
      body: 'Hydrate before your morning coffee for better energy and focus throughout the day.',
      bodyMy:
        'မနက်ခင်းကော်ဖီမသောက်ခင် ရေသောက်ပြီး တစ်နေ့တာ စွမ်းအင်နှင့် အာရုံစူးစိုက်မှု ပိုကောင်းစေပါ။',
    },
    {
      title: '💧 Fresh Start',
      titleMy: '💧 လန်းဆန်းစွာစတင်ပါ',
      body: "A new day, a new opportunity to stay hydrated. Let's make today count!",
      bodyMy: 'နေ့သစ်တစ်နေ့၊ ရေဓာတ်ထိန်းထားရန် အခွင့်အလမ်းသစ်။ ယနေ့ကို အကျိုးရှိစေပါစို့!',
    },
  ],
  midday: [
    {
      title: '💧 Hydration Break',
      titleMy: '💧 ရေသောက်အနားယူချိန်',
      body: 'Take a moment to refresh. A quick water break keeps you productive and focused.',
      bodyMy:
        'ခဏလန်းဆန်းပါ။ ရေအနားယူချိန်တိုက သင့်ကို ထုတ်လုပ်နိုင်စွမ်းနှင့် အာရုံစူးစိုက်မှု ထိန်းထားပေးသည်။',
    },
    {
      title: '🌊 Stay Refreshed',
      titleMy: '🌊 လန်းဆန်းနေပါစေ',
      body: 'Halfway through the day! Keep your energy up with a glass of water.',
      bodyMy: 'နေ့လည်ခင်းရောက်ပြီ! ရေတစ်ခွက်ဖြင့် သင့်စွမ်းအင်ကို ထိန်းထားပါ။',
    },
    {
      title: '⚡ Boost Your Focus',
      titleMy: '⚡ အာရုံစူးစိုက်မှုမြှင့်တင်ပါ',
      body: 'Feeling a bit tired? Even mild dehydration affects concentration. Drink up!',
      bodyMy:
        'အနည်းငယ်ပင်ပန်းနေသလား? အနည်းငယ်ရေဓာတ်ခန်းခြောက်ရုံနှင့်ပင် အာရုံစူးစိုက်မှုကို ထိခိုက်သည်။ ရေသောက်ပါ!',
    },
    {
      title: '🎯 Keep Going Strong',
      titleMy: '🎯 ခိုင်မာစွာဆက်သွားပါ',
      body: "You're doing great! A sip of water now helps you power through the rest of the day.",
      bodyMy: 'သင်ကောင်းနေပါတယ်! ယခုရေအနည်းငယ်သောက်ပြီး ကျန်တစ်နေ့တာကို အားဖြင့်ဖြတ်သန်းပါ။',
    },
  ],
  afternoon: [
    {
      title: '☕ Afternoon Refresh',
      titleMy: '☕ နေ့လည်ခင်းလန်းဆန်းမှု',
      body: "Instead of another coffee, try water! It's the natural way to beat the afternoon slump.",
      bodyMy:
        'နောက်ထပ်ကော်ဖီအစား ရေသောက်ကြည့်ပါ! နေ့လည်ခင်းပင်ပန်းမှုကို သဘာဝနည်းဖြင့် ကျော်လွှားပါ။',
    },
    {
      title: '💪 Stay Energized',
      titleMy: '💪 စွမ်းအင်ပြည့်နေပါစေ',
      body: 'Your body needs hydration to maintain energy. Take a water break now!',
      bodyMy: 'စွမ်းအင်ထိန်းထားရန် သင့်ခန္ဓာကိုယ်က ရေဓာတ်လိုအပ်သည်။ ယခုရေအနားယူပါ!',
    },
    {
      title: '🌟 Almost There',
      titleMy: '🌟 နီးပါးရောက်ပြီ',
      body: 'The day is progressing well. Keep hydrating to finish strong!',
      bodyMy: 'နေ့ရက်ကောင်းစွာတိုးတက်နေသည်။ ခိုင်မာစွာပြီးဆုံးရန် ရေဆက်သောက်ပါ!',
    },
    {
      title: '✨ Wellness Check',
      titleMy: '✨ ကျန်းမာရေးစစ်ဆေးချိန်',
      body: "How's your water intake today? A few more glasses and you'll reach your goal!",
      bodyMy: 'ယနေ့ရေသောက်မှုဘယ်လိုရှိသလဲ? နောက်ထပ်ဖန်ခွက်အနည်းငယ်ဆိုရင် ပန်းတိုင်ရောက်ပါပြီ!',
    },
  ],
  evening: [
    {
      title: '🌆 Evening Hydration',
      titleMy: '🌆 ညနေခင်းရေဓာတ်',
      body: 'Wind down your day with a glass of water. It helps with digestion and relaxation.',
      bodyMy:
        'ရေတစ်ခွက်ဖြင့် သင့်နေ့ကို အဆုံးသတ်ပါ။ အစာခြေခြင်းနှင့် အနားယူခြင်းကို အထောက်အကူပြုသည်။',
    },
    {
      title: '🌙 Final Push',
      titleMy: '🌙 နောက်ဆုံးအားထုတ်မှု',
      body: "Don't forget your evening water! A little more and you'll complete your daily goal.",
      bodyMy: 'ညနေခင်းရေကို မမေ့ပါနဲ့! အနည်းငယ်ထပ်သောက်ရင် နေ့စဉ်ပန်းတိုင်ပြည့်မီပါပြီ။',
    },
    {
      title: "✨ Day's End Reminder",
      titleMy: '✨ နေ့ကုန်သတိပေးချက်',
      body: "Before quiet hours begin, make sure you've had enough water today.",
      bodyMy: 'တိတ်ဆိတ်ချိန်မစခင် ယနေ့ရေလုံလုံလောက်လောက်သောက်ပြီးကြောင်း သေချာပါစေ။',
    },
    {
      title: '🌟 Finish Strong',
      titleMy: '🌟 ခိုင်မာစွာပြီးဆုံးပါ',
      body: "You're so close to your goal! One more glass could make all the difference.",
      bodyMy: 'ပန်းတိုင်နဲ့ အရမ်းနီးပါပြီ! နောက်ထပ်တစ်ခွက်က ကွာခြားမှုဖန်တီးနိုင်ပါသည်။',
    },
  ],
  achievement: [
    {
      title: '🎉 Goal Achieved!',
      titleMy: '🎉 ပန်းတိုင်ရောက်ပြီ!',
      body: "Congratulations! You've reached your daily water goal. Your body thanks you!",
      bodyMy: 'ဂုဏ်ယူပါသည်! နေ့စဉ်ရေပန်းတိုင်ပြည့်မီပါပြီ။ သင့်ခန္ဓာကိုယ်က ကျေးဇူးတင်ပါသည်!',
    },
    {
      title: '🏆 Hydration Champion!',
      titleMy: '🏆 ရေဓာတ်ချန်ပီယံ!',
      body: "Amazing work! You've completed your daily hydration goal. Keep up the great habit!",
      bodyMy:
        'အံ့သြဖွယ်ကောင်းပါတယ်! နေ့စဉ်ရေဓာတ်ပန်းတိုင်ပြည့်မီပါပြီ။ ကောင်းသောအလေ့အထကို ဆက်ထိန်းပါ!',
    },
    {
      title: '⭐ Perfect Day!',
      titleMy: '⭐ ပြည့်စုံသောနေ့!',
      body: 'You did it! Staying hydrated is one of the best things you can do for your health.',
      bodyMy:
        'သင်လုပ်နိုင်ခဲ့ပါပြီ! ရေဓာတ်ထိန်းထားခြင်းသည် သင့်ကျန်းမာရေးအတွက် အကောင်းဆုံးအရာတစ်ခုဖြစ်သည်။',
    },
    {
      title: '💎 Wellness Winner!',
      titleMy: '💎 ကျန်းမာရေးအနိုင်ရသူ!',
      body: "Daily goal complete! You're building a healthy habit that will benefit you for life.",
      bodyMy:
        'နေ့စဉ်ပန်းတိုင်ပြည့်မီပြီ! တစ်သက်တာအကျိုးရှိမည့် ကျန်းမာရေးအလေ့အထကို တည်ဆောက်နေပါသည်။',
    },
  ],
  streak: [
    {
      title: '🔥 Streak Milestone!',
      titleMy: '🔥 ဆက်တိုက်မှတ်တိုင်!',
      body: "You've maintained your hydration goal for {days} days! Incredible dedication!",
      bodyMy: '{days} ရက်ဆက်တိုက် ရေဓာတ်ပန်းတိုင်ထိန်းထားနိုင်ပါပြီ! အံ့သြဖွယ်ကောင်းသော ဇွဲလုံ့လ!',
    },
    {
      title: '🌟 On Fire!',
      titleMy: '🌟 မီးတောက်နေပြီ!',
      body: '{days} days in a row! Your consistency is truly inspiring. Keep it going!',
      bodyMy: '{days} ရက်ဆက်တိုက်! သင့်တသမတ်တည်းမှုက အမှန်တကယ်စိတ်အားထက်သန်စေသည်။ ဆက်သွားပါ!',
    },
  ],
  progress: [
    {
      title: '🎯 Almost There!',
      titleMy: '🎯 နီးပါးရောက်ပြီ!',
      body: "Only {remaining}ml to go! You're so close to completing your daily goal.",
      bodyMy: '{remaining}ml သာကျန်ပါတော့သည်! နေ့စဉ်ပန်းတိုင်ပြည့်မီဖို့ အရမ်းနီးပါပြီ။',
    },
    {
      title: '💪 Halfway There!',
      titleMy: '💪 တစ်ဝက်ရောက်ပြီ!',
      body: "Great progress! You've completed {percent}% of your daily goal. Keep going!",
      bodyMy: 'ကောင်းသောတိုးတက်မှု! နေ့စဉ်ပန်းတိုင်၏ {percent}% ပြီးဆုံးပါပြီ။ ဆက်သွားပါ!',
    },
    {
      title: '☀️ Good Start!',
      titleMy: '☀️ ကောင်းသောစတင်မှု!',
      body: "You're at {percent}% of your goal. Stay consistent and you'll reach it!",
      bodyMy: 'ပန်းတိုင်၏ {percent}% ရောက်နေပါပြီ။ တသမတ်တည်းထားပြီး ပန်းတိုင်ရောက်ပါမည်!',
    },
  ],
  // Personalized messages with {name} placeholder
  personalized: [
    {
      title: '💧 Hey {name}!',
      titleMy: '💧 ဟေး {name}!',
      body: 'Have you had any water yet? If you have, tap "Add Water" to log it!',
      bodyMy: 'ရေသောက်ပြီးပြီလား? သောက်ပြီးရင် "ရေထည့်ရန်" ကိုနှိပ်ပြီး မှတ်တမ်းတင်ပါ!',
    },
    {
      title: '☕ {name}, Break Time!',
      titleMy: '☕ {name}၊ အနားယူချိန်!',
      body: 'Time for a break with a cup of water! Your body will thank you.',
      bodyMy: 'ရေတစ်ခွက်နဲ့ အနားယူချိန်ရောက်ပြီ! သင့်ခန္ဓာကိုယ်က ကျေးဇူးတင်ပါလိမ့်မည်။',
    },
    {
      title: '💦 Water Time, {name}!',
      titleMy: '💦 ရေသောက်ချိန်ပါ {name}!',
      body: 'Time to drink water! Water helps you feel better and stay focused.',
      bodyMy: 'ရေသောက်ချိန်ပါ! ရေက သင့်ကို ပိုကောင်းစေပြီး အာရုံစူးစိုက်မှုထိန်းထားပေးသည်။',
    },
    {
      title: '🌟 {name}, Stay Hydrated!',
      titleMy: '🌟 {name}၊ ရေဓာတ်ထိန်းထားပါ!',
      body: "A quick sip of water keeps you energized. Don't forget to hydrate!",
      bodyMy: 'ရေအနည်းငယ်သောက်ခြင်းက စွမ်းအင်ထိန်းထားပေးသည်။ ရေသောက်ဖို့ မမေ့ပါနဲ့!',
    },
    {
      title: '💧 Hi {name}!',
      titleMy: '💧 မင်္ဂလာပါ {name}!',
      body: 'Your body needs water to function at its best. Take a moment to hydrate!',
      bodyMy: 'သင့်ခန္ဓာကိုယ် အကောင်းဆုံးအလုပ်လုပ်ဖို့ ရေလိုအပ်သည်။ ခဏရေသောက်ပါ!',
    },
    {
      title: '🎯 {name}, Quick Reminder!',
      titleMy: '🎯 {name}၊ အမြန်သတိပေးချက်!',
      body: 'Have you logged your water intake? Every glass counts towards your goal!',
      bodyMy: 'ရေသောက်မှုမှတ်တမ်းတင်ပြီးပြီလား? ဖန်ခွက်တိုင်းက ပန်းတိုင်ဆီသို့ တိုးတက်စေသည်!',
    },
    {
      title: '✨ {name}, Feeling Tired?',
      titleMy: '✨ {name}၊ ပင်ပန်းနေသလား?',
      body: 'Dehydration can cause fatigue. A glass of water might be just what you need!',
      bodyMy:
        'ရေဓာတ်ခန်းခြောက်မှုက ပင်ပန်းမှုဖြစ်စေနိုင်သည်။ ရေတစ်ခွက်က သင်လိုအပ်တာဖြစ်နိုင်ပါသည်!',
    },
    {
      title: '💪 Keep It Up, {name}!',
      titleMy: '💪 ဆက်ကြိုးစားပါ {name}!',
      body: "You're doing great with your hydration! Keep the momentum going.",
      bodyMy: 'ရေဓာတ်ထိန်းထားမှု ကောင်းနေပါတယ်! အရှိန်ဆက်ထိန်းပါ။',
    },
    {
      title: '🌊 {name}, Refresh Yourself!',
      titleMy: '🌊 {name}၊ လန်းဆန်းပါစေ!',
      body: 'Take a refreshing water break. Your mind and body will appreciate it!',
      bodyMy: 'လန်းဆန်းစေသော ရေအနားယူချိန်ယူပါ။ သင့်စိတ်နှင့် ခန္ဓာကိုယ်က တန်ဖိုးထားပါလိမ့်မည်!',
    },
    {
      title: '🏆 {name}, Be a Champion!',
      titleMy: '🏆 {name}၊ ချန်ပီယံဖြစ်ပါ!',
      body: 'Champions stay hydrated! Drink some water and conquer your day.',
      bodyMy: 'ချန်ပီယံတွေက ရေဓာတ်ထိန်းထားကြသည်! ရေသောက်ပြီး သင့်နေ့ကို အောင်မြင်စေပါ။',
    },
  ],
};

// Legacy format for backward compatibility
const motivationalMessages = {
  morning: motivationalMessagesData.morning.map((m) => ({ title: m.title, body: m.body })),
  midday: motivationalMessagesData.midday.map((m) => ({ title: m.title, body: m.body })),
  afternoon: motivationalMessagesData.afternoon.map((m) => ({ title: m.title, body: m.body })),
  evening: motivationalMessagesData.evening.map((m) => ({ title: m.title, body: m.body })),
  achievement: motivationalMessagesData.achievement.map((m) => ({ title: m.title, body: m.body })),
};

// ============ PERFORMANCE OPTIMIZATIONS ============

// 1.1 Memoization for message selection - cache at module level
const messageCache = new Map<string, { title: string; body: string }[]>();

/**
 * Get cached messages for a category and language
 * Improves performance by avoiding repeated array transformations
 */
const getCachedMessages = (
  category: keyof typeof motivationalMessagesData,
  language: 'en' | 'my'
): { title: string; body: string }[] => {
  const cacheKey = `${category}-${language}`;

  if (!messageCache.has(cacheKey)) {
    const messages = motivationalMessagesData[category];
    const transformed = messages.map((m) =>
      language === 'my' ? { title: m.titleMy, body: m.bodyMy } : { title: m.title, body: m.body }
    );
    messageCache.set(cacheKey, transformed);
  }

  return messageCache.get(cacheKey)!;
};

/**
 * Clear message cache (call when language changes)
 */
export const clearMessageCache = (): void => {
  messageCache.clear();
};

// Get message based on language preference (optimized with cache)
const getLocalizedMessage = (
  category: keyof typeof motivationalMessagesData,
  language: 'en' | 'my' = 'en'
): { title: string; body: string } => {
  const messages = getCachedMessages(category, language);
  return messages[Math.floor(Math.random() * messages.length)];
};

// Get personalized message with username
const getPersonalizedMessage = (
  userName: string,
  language: 'en' | 'my' = 'en'
): { title: string; body: string } => {
  const messages = motivationalMessagesData.personalized;
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  const name = userName || (language === 'my' ? 'သူငယ်ချင်း' : 'Friend');

  if (language === 'my') {
    return {
      title: randomMessage.titleMy.replace('{name}', name),
      body: randomMessage.bodyMy,
    };
  }
  return {
    title: randomMessage.title.replace('{name}', name),
    body: randomMessage.body,
  };
};

const getTimeBasedMessage = (
  language: 'en' | 'my' = 'en',
  userName?: string,
  scheduledHour?: number
): { title: string; body: string } => {
  // Use scheduled hour if provided, otherwise use current time
  const hour = scheduledHour !== undefined ? scheduledHour : new Date().getHours();
  let category: keyof typeof motivationalMessagesData;

  if (hour >= 6 && hour < 10) category = 'morning';
  else if (hour >= 10 && hour < 14) category = 'midday';
  else if (hour >= 14 && hour < 18) category = 'afternoon';
  else category = 'evening';

  // 40% chance to use personalized message if username is provided
  if (userName && Math.random() < 0.4) {
    return getPersonalizedMessage(userName, language);
  }

  return getLocalizedMessage(category, language);
};

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return data
      ? { ...defaultNotificationSettings, ...JSON.parse(data) }
      : defaultNotificationSettings;
  } catch {
    return defaultNotificationSettings;
  }
};

// 1.2 Debounced settings saving with proper Promise handling
let saveSettingsTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSettingsResolve: (() => void) | null = null;

/**
 * Save notification settings with debouncing
 * Prevents rapid consecutive saves when user is adjusting settings
 */
export const saveNotificationSettingsDebounced = async (
  settings: Partial<NotificationSettings>
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (saveSettingsTimeout) {
      clearTimeout(saveSettingsTimeout);
      // Resolve previous pending promise
      if (pendingSettingsResolve) pendingSettingsResolve();
    }

    pendingSettingsResolve = resolve;

    saveSettingsTimeout = setTimeout(async () => {
      try {
        const current = await getNotificationSettings();
        const updated = { ...current, ...settings };
        await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
        await scheduleSmartReminders(updated);
        resolve();
      } catch (error) {
        console.error('Error saving notification settings:', error);
        reject(error);
      } finally {
        saveSettingsTimeout = null;
        pendingSettingsResolve = null;
      }
    }, 300);
  });
};

/**
 * Save notification settings immediately (for critical changes)
 * Use this for important settings that need immediate effect
 */
export const saveNotificationSettings = async (
  settings: Partial<NotificationSettings>
): Promise<void> => {
  // Cancel any pending debounced save
  if (saveSettingsTimeout) {
    clearTimeout(saveSettingsTimeout);
    saveSettingsTimeout = null;
    if (pendingSettingsResolve) {
      pendingSettingsResolve();
      pendingSettingsResolve = null;
    }
  }

  try {
    const current = await getNotificationSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
    await scheduleSmartReminders(updated);
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

/**
 * Sync quiet hours with user's sleep schedule
 * This should be called when user updates their sleep/wake time in profile
 */
export const syncQuietHoursWithSleepSchedule = async (
  sleepTime: string,
  wakeTime: string
): Promise<void> => {
  try {
    await saveNotificationSettings({
      quietHoursStart: sleepTime,
      quietHoursEnd: wakeTime,
    });
    console.log(`Quiet hours synced: ${sleepTime} - ${wakeTime}`);
  } catch (error) {
    console.error('Error syncing quiet hours with sleep schedule:', error);
  }
};

/**
 * Get quiet hours info for display
 */
export const getQuietHoursInfo = async (): Promise<{
  enabled: boolean;
  start: string;
  end: string;
  isCurrentlyQuiet: boolean;
}> => {
  const settings = await getNotificationSettings();
  return {
    enabled: settings.quietHoursEnabled,
    start: settings.quietHoursStart,
    end: settings.quietHoursEnd,
    isCurrentlyQuiet: isQuietHours(settings),
  };
};

export const isQuietHours = (settings: NotificationSettings): boolean => {
  if (!settings.quietHoursEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

export const analyzeUserPatterns = async (): Promise<{
  peakHours: number[];
  lowHours: number[];
}> => {
  const last7Days = await getLastNDays(7);
  const hourlyIntake: Record<number, number[]> = {};

  for (let i = 0; i < 24; i++) {
    hourlyIntake[i] = [];
  }

  last7Days.forEach((day) => {
    day.entries.forEach((entry) => {
      const hour = parseInt(entry.time.split(':')[0], 10);
      hourlyIntake[hour].push(entry.amount);
    });
  });

  const hourlyAverages = Object.entries(hourlyIntake).map(([hour, amounts]) => ({
    hour: parseInt(hour, 10),
    average: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0,
    count: amounts.length,
  }));

  const peakHours = hourlyAverages
    .filter((h) => h.count > 0)
    .sort((a, b) => b.average - a.average)
    .slice(0, 3)
    .map((h) => h.hour);

  const lowHours = hourlyAverages
    .filter((h) => h.hour >= 8 && h.hour <= 20 && h.count === 0)
    .map((h) => h.hour);

  return { peakHours, lowHours };
};

export const setupNotificationChannel = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    const CHANNEL_ID = getChannelId();

    // First, try to delete existing channel to ensure fresh setup
    try {
      await Notifications.deleteNotificationChannelAsync(CHANNEL_ID);
    } catch {
      // Channel might not exist yet, ignore
    }

    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Water Reminders',
      description: 'Hydration reminder notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });
  }
};

export const scheduleSmartReminders = async (settings: NotificationSettings): Promise<void> => {
  // Cancel all existing scheduled notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) return;

  // Get user preferences for personalized messages
  const [userName, language] = await Promise.all([getUserName(), getCurrentLanguage()]);

  const [quietStartHour, quietStartMin = 0] = settings.quietHoursStart.split(':').map(Number);
  const [quietEndHour, quietEndMin = 0] = settings.quietHoursEnd.split(':').map(Number);

  const intervalMinutes = settings.reminderInterval; // 30, 60, 90, or 120

  // Generate reminder times based on interval
  const reminderTimes: { hour: number; minute: number }[] = [];

  // Calculate active hours (outside quiet hours)
  const quietStartMinutes = quietStartHour * 60 + quietStartMin;
  const quietEndMinutes = quietEndHour * 60 + quietEndMin;

  // Start from quiet hours end, schedule throughout the day
  let currentMinutes = quietEndMinutes;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  const isOvernightQuiet = quietStartMinutes > quietEndMinutes;
  const endMinutes = isOvernightQuiet ? quietStartMinutes : 24 * 60;

  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60) % 24;
    const minute = currentMinutes % 60;

    // Check if this is during quiet hours
    const isQuietTime =
      settings.quietHoursEnabled &&
      isTimeInQuietHours(hour, minute, quietStartHour, quietStartMin, quietEndHour, quietEndMin);

    if (!isQuietTime && hour < 24) {
      reminderTimes.push({ hour, minute });
    }

    currentMinutes += intervalMinutes;
  }

  // Limit to reasonable number of notifications per day (max 12)
  const maxNotifications = 12;
  const limitedTimes =
    reminderTimes.length > maxNotifications
      ? reminderTimes
          .filter((_, index) => index % Math.ceil(reminderTimes.length / maxNotifications) === 0)
          .slice(0, maxNotifications)
      : reminderTimes;

  // Schedule notifications
  for (const { hour, minute } of limitedTimes) {
    const message = settings.motivationalMessages
      ? getTimeBasedMessage(language, userName, hour)
      : { title: '💧 Water Reminder', body: 'Time to drink some water!' };

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          // On Android, sound is controlled by the notification channel
          // On iOS, we can specify the sound here
          sound: settings.soundEnabled,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'reminder', hour, minute },
          ...(Platform.OS === 'android' && { channelId: getChannelId() }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: Platform.OS === 'android' ? getChannelId() : undefined,
        },
      });
    } catch (error) {
      console.error(`Failed to schedule notification for ${hour}:${minute}:`, error);
    }
  }

  console.log(
    `Scheduled ${limitedTimes.length} daily reminders with ${intervalMinutes}min interval`
  );
};

// Helper function to check if time is in quiet hours
const isTimeInQuietHours = (
  hour: number,
  minute: number,
  quietStartHour: number,
  quietStartMin: number,
  quietEndHour: number,
  quietEndMin: number
): boolean => {
  const currentMinutes = hour * 60 + minute;
  const startMinutes = quietStartHour * 60 + quietStartMin;
  const endMinutes = quietEndHour * 60 + quietEndMin;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

export const sendImmediateNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string | null> => {
  const settings = await getNotificationSettings();
  if (!settings.enabled || isQuietHours(settings)) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: settings.soundEnabled ? 'default' : undefined,
        vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: data || {},
        ...(Platform.OS === 'android' && { channelId: getChannelId() }),
      },
      trigger: null,
    });
    return id;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return null;
  }
};

export const sendContextualReminder = async (
  currentIntake: number,
  dailyGoal: number,
  language: 'en' | 'my' = 'en',
  userName?: string
): Promise<void> => {
  const settings = await getNotificationSettings();
  if (!settings.enabled || isQuietHours(settings)) return;

  const progress = currentIntake / dailyGoal;
  const remaining = Math.round((1 - progress) * dailyGoal);
  const percent = Math.round(progress * 100);
  let message: { title: string; body: string };

  if (progress >= 1) {
    message = getLocalizedMessage('achievement', language);
  } else if (progress >= 0.75) {
    const progressMsgs = motivationalMessagesData.progress;
    const msg = progressMsgs[0]; // "Almost There" message
    if (language === 'my') {
      message = {
        title: msg.titleMy,
        body: msg.bodyMy.replace('{remaining}', remaining.toString()),
      };
    } else {
      message = {
        title: msg.title,
        body: msg.body.replace('{remaining}', remaining.toString()),
      };
    }
  } else if (progress >= 0.5) {
    const progressMsgs = motivationalMessagesData.progress;
    const msg = progressMsgs[1]; // "Halfway There" message
    if (language === 'my') {
      message = {
        title: msg.titleMy,
        body: msg.bodyMy.replace('{percent}', percent.toString()),
      };
    } else {
      message = {
        title: msg.title,
        body: msg.body.replace('{percent}', percent.toString()),
      };
    }
  } else if (progress >= 0.25) {
    const progressMsgs = motivationalMessagesData.progress;
    const msg = progressMsgs[2]; // "Good Start" message
    if (language === 'my') {
      message = {
        title: msg.titleMy,
        body: msg.bodyMy.replace('{percent}', percent.toString()),
      };
    } else {
      message = {
        title: msg.title,
        body: msg.body.replace('{percent}', percent.toString()),
      };
    }
  } else {
    // Use personalized message with username for low progress
    message = getTimeBasedMessage(language, userName);
  }

  await sendImmediateNotification(message.title, message.body, { type: 'contextual', progress });
};

// Send a personalized notification with username
export const sendPersonalizedReminder = async (
  userName: string,
  language: 'en' | 'my' = 'en'
): Promise<void> => {
  const settings = await getNotificationSettings();
  if (!settings.enabled || isQuietHours(settings)) return;

  const message = getPersonalizedMessage(userName, language);
  await sendImmediateNotification(message.title, message.body, { type: 'personalized', userName });
};

export const sendGoalAchievedNotification = async (language: 'en' | 'my' = 'en'): Promise<void> => {
  const message = getLocalizedMessage('achievement', language);
  await sendImmediateNotification(message.title, message.body, { type: 'achievement' });
};

export const sendStreakNotification = async (
  streakDays: number,
  language: 'en' | 'my' = 'en'
): Promise<void> => {
  const streakMsgs = motivationalMessagesData.streak;
  const msg = streakMsgs[Math.floor(Math.random() * streakMsgs.length)];

  let title: string;
  let body: string;

  if (language === 'my') {
    title = msg.titleMy;
    body = msg.bodyMy.replace('{days}', streakDays.toString());
  } else {
    title = msg.title;
    body = msg.body.replace('{days}', streakDays.toString());
  }

  await sendImmediateNotification(title, body, { type: 'streak', streakDays });
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Flag to prevent multiple initializations
let isInitialized = false;

export const initializeNotifications = async (): Promise<boolean> => {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log('Notifications already initialized, skipping...');
    return true;
  }

  try {
    // Cancel any existing notifications first to prevent duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Import and initialize notification sounds
    const { initializeNotificationSounds } = await import('./notificationSounds');
    await initializeNotificationSounds();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    await setupNotificationChannel();

    const hasPermission = await requestNotificationPermissions();

    if (hasPermission) {
      const settings = await getNotificationSettings();
      await scheduleSmartReminders(settings);
      isInitialized = true;
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    return false;
  }
};

export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription => {
  return Notifications.addNotificationReceivedListener(callback);
};

// ============ TEST & DEBUG FUNCTIONS ============

/**
 * Get a summary of all scheduled notifications
 */
export const getScheduledNotificationsSummary = async (): Promise<{
  count: number;
  times: string[];
  nextNotification: string | null;
}> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const times = scheduled
    .map((n) => {
      const trigger = n.trigger as { hour?: number; minute?: number } | null;
      if (trigger?.hour !== undefined) {
        const hour = trigger.hour.toString().padStart(2, '0');
        const minute = (trigger.minute || 0).toString().padStart(2, '0');
        return `${hour}:${minute}`;
      }
      return null;
    })
    .filter((t): t is string => t !== null)
    .sort();

  // Find next notification
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let nextNotification: string | null = null;
  for (const time of times) {
    const [h, m] = time.split(':').map(Number);
    const timeMinutes = h * 60 + m;
    if (timeMinutes > currentMinutes) {
      nextNotification = time;
      break;
    }
  }

  // If no notification found today, next is tomorrow's first
  if (!nextNotification && times.length > 0) {
    nextNotification = `${times[0]} (tomorrow)`;
  }

  return {
    count: scheduled.length,
    times,
    nextNotification,
  };
};

/**
 * Test notification - sends an immediate test notification
 */
export const sendTestNotification = async (language: 'en' | 'my' = 'en'): Promise<boolean> => {
  try {
    const title = language === 'my' ? '✅ စမ်းသပ်အသိပေးချက်' : '✅ Test Notification';
    const body =
      language === 'my'
        ? 'သင့်အသိပေးချက်များ ကောင်းစွာအလုပ်လုပ်နေပါသည်။ ရေသောက်သတိပေးချက်များ ရရှိပါလိမ့်မည်!'
        : "Your notifications are working perfectly. You'll receive hydration reminders as scheduled!";

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId: getChannelId() }),
      },
      trigger: null, // Immediate
    });
    return true;
  } catch (error) {
    console.error('Test notification failed:', error);
    return false;
  }
};

/**
 * Test personalized notification with username
 */
export const sendTestPersonalizedNotification = async (
  userName: string,
  language: 'en' | 'my' = 'en'
): Promise<boolean> => {
  try {
    const message = getPersonalizedMessage(userName, language);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: 'default',
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'test-personalized', userName },
        ...(Platform.OS === 'android' && { channelId: getChannelId() }),
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    console.error('Personalized test notification failed:', error);
    return false;
  }
};

/**
 * Preview what notifications would be scheduled with given settings
 */
export const previewScheduledTimes = (settings: NotificationSettings): string[] => {
  const [quietStartHour, quietStartMin = 0] = settings.quietHoursStart.split(':').map(Number);
  const [quietEndHour, quietEndMin = 0] = settings.quietHoursEnd.split(':').map(Number);

  const quietEndMinutes = quietEndHour * 60 + quietEndMin;
  const quietStartMinutes = quietStartHour * 60 + quietStartMin;
  const intervalMinutes = settings.reminderInterval;

  const times: string[] = [];
  let currentMinutes = quietEndMinutes;
  const endMinutes = quietStartMinutes > quietEndMinutes ? quietStartMinutes : 24 * 60;

  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60) % 24;
    const minute = currentMinutes % 60;
    times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    currentMinutes += intervalMinutes;
  }

  return times;
};

// ============ TIME-BASED MESSAGE TESTING ============

/**
 * Get a sample message for a specific time period
 */
export const getMessageForTimePeriod = (
  period: 'morning' | 'midday' | 'afternoon' | 'evening' | 'achievement'
): { title: string; body: string } => {
  const messages = motivationalMessages[period];
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Get all messages for a specific time period
 */
export const getAllMessagesForPeriod = (
  period: 'morning' | 'midday' | 'afternoon' | 'evening' | 'achievement'
): { title: string; body: string }[] => {
  return motivationalMessages[period];
};

/**
 * Get the current time period based on hour
 */
export const getCurrentTimePeriod = (): {
  period: 'morning' | 'midday' | 'afternoon' | 'evening';
  hourRange: string;
} => {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 10) {
    return { period: 'morning', hourRange: '6:00 - 10:00' };
  } else if (hour >= 10 && hour < 14) {
    return { period: 'midday', hourRange: '10:00 - 14:00' };
  } else if (hour >= 14 && hour < 18) {
    return { period: 'afternoon', hourRange: '14:00 - 18:00' };
  } else {
    return { period: 'evening', hourRange: '18:00 - 6:00' };
  }
};

/**
 * Send a test notification with time-based message
 */
export const sendTimeBasedTestNotification = async (): Promise<{
  success: boolean;
  period: string;
  message: { title: string; body: string };
}> => {
  const { period } = getCurrentTimePeriod();
  const message = getMessageForTimePeriod(period);

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: 'default',
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'test', period },
        ...(Platform.OS === 'android' && { channelId: getChannelId() }),
      },
      trigger: null,
    });
    return { success: true, period, message };
  } catch (error) {
    console.error('Time-based test notification failed:', error);
    return { success: false, period, message };
  }
};

/**
 * Send a test notification for a specific period
 */
export const sendPeriodTestNotification = async (
  period: 'morning' | 'midday' | 'afternoon' | 'evening' | 'achievement'
): Promise<boolean> => {
  const message = getMessageForTimePeriod(period);

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: 'default',
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'test', period },
        ...(Platform.OS === 'android' && { channelId: getChannelId() }),
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    console.error(`${period} test notification failed:`, error);
    return false;
  }
};

// ============ ADAPTIVE REMINDERS TESTING ============

/**
 * Get detailed user drinking patterns for display
 */
export const getDetailedUserPatterns = async (): Promise<{
  peakHours: { hour: number; average: number; count: number }[];
  lowHours: number[];
  hourlyData: { hour: number; average: number; count: number }[];
  totalDaysAnalyzed: number;
  recommendation: string;
}> => {
  const last7Days = await getLastNDays(7);
  const hourlyIntake: Record<number, number[]> = {};

  for (let i = 0; i < 24; i++) {
    hourlyIntake[i] = [];
  }

  last7Days.forEach((day) => {
    day.entries.forEach((entry) => {
      const hour = parseInt(entry.time.split(':')[0], 10);
      hourlyIntake[hour].push(entry.amount);
    });
  });

  const hourlyData = Object.entries(hourlyIntake).map(([hour, amounts]) => ({
    hour: parseInt(hour, 10),
    average:
      amounts.length > 0 ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) : 0,
    count: amounts.length,
  }));

  const peakHours = hourlyData
    .filter((h) => h.count > 0)
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  const lowHours = hourlyData
    .filter((h) => h.hour >= 8 && h.hour <= 20 && h.count === 0)
    .map((h) => h.hour);

  // Generate recommendation
  let recommendation = '';
  if (lowHours.length > 3) {
    recommendation = `You tend to skip water during ${lowHours
      .slice(0, 3)
      .map((h) => `${h}:00`)
      .join(', ')}. We'll remind you more during these times.`;
  } else if (peakHours.length > 0) {
    recommendation = `Great job! You drink most water around ${peakHours[0].hour}:00 (avg ${peakHours[0].average}ml).`;
  } else {
    recommendation = 'Start logging your water intake to get personalized insights!';
  }

  return {
    peakHours,
    lowHours,
    hourlyData,
    totalDaysAnalyzed: last7Days.length,
    recommendation,
  };
};

/**
 * Get adaptive reminder explanation
 */
export const getAdaptiveReminderExplanation = async (): Promise<{
  isEnabled: boolean;
  extraReminders: number[];
  explanation: string;
}> => {
  const settings = await getNotificationSettings();
  const patterns = await analyzeUserPatterns();

  if (!settings.adaptiveReminders) {
    return {
      isEnabled: false,
      extraReminders: [],
      explanation:
        'Adaptive reminders are disabled. Enable them to get smart reminders based on your drinking patterns.',
    };
  }

  if (patterns.lowHours.length === 0) {
    return {
      isEnabled: true,
      extraReminders: [],
      explanation:
        'No low-activity hours detected. You have consistent hydration throughout the day!',
    };
  }

  return {
    isEnabled: true,
    extraReminders: patterns.lowHours,
    explanation: `Extra reminders will be sent at: ${patterns.lowHours.map((h) => `${h}:00`).join(', ')} because you tend to forget to drink during these hours.`,
  };
};

// ============ SOUND & VIBRATION TESTING ============

/**
 * Send test notification with specific sound/vibration settings
 */
export const sendTestNotificationWithOptions = async (options: {
  sound: boolean;
  vibration: boolean;
  title?: string;
  body?: string;
  language?: 'en' | 'my';
}): Promise<boolean> => {
  const lang = options.language || 'en';

  const defaultTitle = lang === 'my' ? '🔔 အသိပေးချက်စမ်းသပ်မှု' : '🔔 Notification Test';
  const defaultBody =
    lang === 'my'
      ? `အသံ: ${options.sound ? 'ဖွင့်' : 'ပိတ်'} | တုန်ခါမှု: ${options.vibration ? 'ဖွင့်' : 'ပိတ်'}`
      : `Sound: ${options.sound ? 'ON' : 'OFF'} | Vibration: ${options.vibration ? 'ON' : 'OFF'}`;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title || defaultTitle,
        body: options.body || defaultBody,
        sound: options.sound ? 'default' : undefined,
        vibrate: options.vibration ? [0, 250, 250, 250] : undefined,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'test', sound: options.sound, vibration: options.vibration },
        ...(Platform.OS === 'android' && { channelId: getChannelId() }),
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    console.error('Sound/vibration test notification failed:', error);
    return false;
  }
};

/**
 * Test sound only
 */
export const testSoundNotification = async (language: 'en' | 'my' = 'en'): Promise<boolean> => {
  return sendTestNotificationWithOptions({
    sound: true,
    vibration: false,
    title: language === 'my' ? '🔊 အသံစမ်းသပ်မှု' : '🔊 Sound Test',
    body:
      language === 'my'
        ? 'ဤအသိပေးချက်သည် အသံထွက်သင့်ပါသည်။ ကြားရပါသလား?'
        : 'This notification should play a sound. Can you hear it?',
    language,
  });
};

/**
 * Test vibration only
 */
export const testVibrationNotification = async (language: 'en' | 'my' = 'en'): Promise<boolean> => {
  return sendTestNotificationWithOptions({
    sound: false,
    vibration: true,
    title: language === 'my' ? '📳 တုန်ခါမှုစမ်းသပ်မှု' : '📳 Vibration Test',
    body:
      language === 'my'
        ? 'ဤအသိပေးချက်သည် သင့်စက်ကို တုန်ခါစေသင့်ပါသည်။'
        : 'This notification should vibrate your device.',
    language,
  });
};

/**
 * Test both sound and vibration
 */
export const testSoundAndVibrationNotification = async (
  language: 'en' | 'my' = 'en'
): Promise<boolean> => {
  return sendTestNotificationWithOptions({
    sound: true,
    vibration: true,
    title: language === 'my' ? '🔔 အပြည့်အဝသတိပေးစမ်းသပ်မှု' : '🔔 Full Alert Test',
    body:
      language === 'my'
        ? 'ဤအသိပေးချက်တွင် အသံနှင့် တုန်ခါမှုနှစ်ခုလုံးပါဝင်သည်။'
        : 'This notification includes both sound and vibration.',
    language,
  });
};

/**
 * Test silent notification (no sound, no vibration)
 */
export const testSilentNotification = async (language: 'en' | 'my' = 'en'): Promise<boolean> => {
  return sendTestNotificationWithOptions({
    sound: false,
    vibration: false,
    title: language === 'my' ? '🔕 တိတ်ဆိတ်စမ်းသပ်မှု' : '🔕 Silent Test',
    body:
      language === 'my'
        ? 'ဤသည်မှာ တိတ်ဆိတ်သောအသိပေးချက်ဖြစ်သည် - အသံမရှိ၊ တုန်ခါမှုမရှိ။'
        : 'This is a silent notification - no sound or vibration.',
    language,
  });
};

/**
 * Get current sound/vibration settings status
 */
export const getSoundVibrationStatus = async (): Promise<{
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  description: string;
}> => {
  const settings = await getNotificationSettings();

  let description = '';
  if (settings.soundEnabled && settings.vibrationEnabled) {
    description = 'Full alerts: Sound and vibration enabled';
  } else if (settings.soundEnabled) {
    description = 'Sound only: Vibration disabled';
  } else if (settings.vibrationEnabled) {
    description = 'Vibration only: Sound disabled';
  } else {
    description = 'Silent mode: Both sound and vibration disabled';
  }

  return {
    soundEnabled: settings.soundEnabled,
    vibrationEnabled: settings.vibrationEnabled,
    description,
  };
};

// ============ INTELLIGENT LEARNING SYSTEM ============

const USER_INTERACTION_PATTERNS_KEY = 'user_interaction_patterns';
const OPTIMAL_INTERVALS_KEY = 'optimal_reminder_intervals';

/**
 * User interaction patterns for learning
 */
export interface UserInteractionPatterns {
  dismissTimes: Record<number, number>; // hour -> count of dismissals
  snoozeTimes: Record<number, number>; // hour -> count of snoozes
  waterLogTimes: Record<number, number>; // hour -> count of water logs after notification
  actionDelays: number[]; // time in seconds between notification and action
  lastUpdated: string;
}

/**
 * Optimal intervals learned from user behavior
 */
export interface OptimalIntervals {
  hourlyIntervals: Record<number, number>; // hour -> optimal interval in minutes
  defaultInterval: number;
  lastCalculated: string;
}

/**
 * Get user interaction patterns
 */
export const getUserInteractionPatterns = async (): Promise<UserInteractionPatterns> => {
  try {
    const data = await AsyncStorage.getItem(USER_INTERACTION_PATTERNS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting interaction patterns:', error);
  }

  return {
    dismissTimes: {},
    snoozeTimes: {},
    waterLogTimes: {},
    actionDelays: [],
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Save user interaction patterns
 */
const saveUserInteractionPatterns = async (patterns: UserInteractionPatterns): Promise<void> => {
  try {
    patterns.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(USER_INTERACTION_PATTERNS_KEY, JSON.stringify(patterns));
  } catch (error) {
    console.error('Error saving interaction patterns:', error);
  }
};

/**
 * Record when user dismisses a notification
 */
export const recordNotificationDismiss = async (): Promise<void> => {
  try {
    const patterns = await getUserInteractionPatterns();
    const hour = new Date().getHours();
    patterns.dismissTimes[hour] = (patterns.dismissTimes[hour] || 0) + 1;
    await saveUserInteractionPatterns(patterns);
  } catch (error) {
    console.error('Error recording dismiss:', error);
  }
};

/**
 * Record when user snoozes a notification
 */
export const recordNotificationSnooze = async (): Promise<void> => {
  try {
    const patterns = await getUserInteractionPatterns();
    const hour = new Date().getHours();
    patterns.snoozeTimes[hour] = (patterns.snoozeTimes[hour] || 0) + 1;
    await saveUserInteractionPatterns(patterns);
  } catch (error) {
    console.error('Error recording snooze:', error);
  }
};

/**
 * Record when user logs water after receiving a notification
 */
export const recordWaterLogAfterNotification = async (delaySeconds?: number): Promise<void> => {
  try {
    const patterns = await getUserInteractionPatterns();
    const hour = new Date().getHours();
    patterns.waterLogTimes[hour] = (patterns.waterLogTimes[hour] || 0) + 1;

    // Track response delay if provided
    if (delaySeconds !== undefined && delaySeconds > 0 && delaySeconds < 3600) {
      patterns.actionDelays.push(delaySeconds);
      // Keep only last 100 delays
      if (patterns.actionDelays.length > 100) {
        patterns.actionDelays = patterns.actionDelays.slice(-100);
      }
    }

    await saveUserInteractionPatterns(patterns);
  } catch (error) {
    console.error('Error recording water log:', error);
  }
};

/**
 * Learn from user interactions and adjust reminder strategy
 */
export const learnFromUserInteractions = async (): Promise<{
  effectiveHours: number[];
  ineffectiveHours: number[];
  avgResponseTime: number;
  recommendations: string[];
}> => {
  try {
    const patterns = await getUserInteractionPatterns();

    const effectiveHours: number[] = [];
    const ineffectiveHours: number[] = [];
    const recommendations: string[] = [];

    // Analyze each hour
    for (let hour = 0; hour < 24; hour++) {
      const dismisses = patterns.dismissTimes[hour] || 0;
      const snoozes = patterns.snoozeTimes[hour] || 0;
      const waterLogs = patterns.waterLogTimes[hour] || 0;

      const totalInteractions = dismisses + snoozes + waterLogs;
      if (totalInteractions === 0) continue;

      const effectivenessRate = waterLogs / totalInteractions;

      if (effectivenessRate >= 0.5) {
        effectiveHours.push(hour);
      } else if (effectivenessRate < 0.3 && dismisses > snoozes) {
        ineffectiveHours.push(hour);
      }
    }

    // Calculate average response time
    const avgResponseTime =
      patterns.actionDelays.length > 0
        ? Math.round(
            patterns.actionDelays.reduce((a, b) => a + b, 0) / patterns.actionDelays.length
          )
        : 0;

    // Generate recommendations
    if (ineffectiveHours.length > 0) {
      recommendations.push(
        `Consider reducing reminders at ${ineffectiveHours
          .slice(0, 3)
          .map((h) => `${h}:00`)
          .join(', ')} - you often dismiss them.`
      );
    }

    if (effectiveHours.length > 0) {
      recommendations.push(
        `Reminders work best for you around ${effectiveHours
          .slice(0, 3)
          .map((h) => `${h}:00`)
          .join(', ')}.`
      );
    }

    if (avgResponseTime > 300) {
      // More than 5 minutes
      recommendations.push(
        'You tend to respond to reminders after a delay. Consider setting reminders a bit earlier.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep logging your water intake to get personalized insights!');
    }

    return {
      effectiveHours,
      ineffectiveHours,
      avgResponseTime,
      recommendations,
    };
  } catch (error) {
    console.error('Error learning from interactions:', error);
    return {
      effectiveHours: [],
      ineffectiveHours: [],
      avgResponseTime: 0,
      recommendations: ['Start using the app to get personalized insights!'],
    };
  }
};

/**
 * Calculate optimal reminder interval based on current context
 */
export const calculateOptimalReminderInterval = async (
  dailyGoal: number,
  currentIntake: number
): Promise<{
  interval: number;
  reason: string;
}> => {
  try {
    const patterns = await analyzeUserPatterns();
    const interactions = await getUserInteractionPatterns();
    const hour = new Date().getHours();
    const progress = currentIntake / dailyGoal;

    // Check if this is a low activity hour for the user
    const isLowActivityHour = patterns.lowHours.includes(hour);

    // Check if user typically dismisses at this hour
    const dismissRate = interactions.dismissTimes[hour] || 0;
    const waterLogRate = interactions.waterLogTimes[hour] || 0;
    const isHighDismissHour = dismissRate > waterLogRate * 2;

    // Calculate hours remaining in the day (assuming 22:00 as end)
    const hoursRemaining = Math.max(0, 22 - hour);
    const intakeRemaining = dailyGoal - currentIntake;

    // Dynamic interval calculation
    let interval: number;
    let reason: string;

    if (progress >= 1.0) {
      // Goal achieved - minimal reminders
      interval = 180;
      reason = 'Goal achieved! Reduced reminder frequency.';
    } else if (progress >= 0.8) {
      // Almost there - less frequent
      interval = 120;
      reason = 'Almost at your goal! Gentle reminders.';
    } else if (isHighDismissHour) {
      // User often dismisses at this hour - less frequent to avoid annoyance
      interval = 90;
      reason = 'Adjusted based on your preferences at this time.';
    } else if (isLowActivityHour && progress < 0.5) {
      // Low activity hour and behind schedule - more frequent
      interval = 30;
      reason = 'You often forget to drink at this time. Extra reminders!';
    } else if (hoursRemaining > 0 && intakeRemaining > 0) {
      // Calculate based on remaining intake needed
      const mlPerHour = intakeRemaining / hoursRemaining;
      if (mlPerHour > 400) {
        // Need to catch up - more frequent
        interval = 45;
        reason = 'Behind schedule. More frequent reminders to help you catch up.';
      } else if (mlPerHour < 150) {
        // Ahead of schedule - less frequent
        interval = 90;
        reason = 'On track! Regular reminders.';
      } else {
        interval = 60;
        reason = 'Standard reminder interval.';
      }
    } else {
      interval = 60;
      reason = 'Standard reminder interval.';
    }

    return { interval, reason };
  } catch (error) {
    console.error('Error calculating optimal interval:', error);
    return { interval: 60, reason: 'Default interval.' };
  }
};

/**
 * Get smart scheduling recommendations
 */
export const getSmartSchedulingRecommendations = async (
  dailyGoal: number,
  currentIntake: number
): Promise<{
  suggestedInterval: number;
  suggestedTimes: string[];
  insights: string[];
}> => {
  const { interval, reason } = await calculateOptimalReminderInterval(dailyGoal, currentIntake);
  const learning = await learnFromUserInteractions();
  const patterns = await analyzeUserPatterns();

  // Generate suggested times based on effective hours and low activity hours
  const suggestedTimes: string[] = [];
  const settings = await getNotificationSettings();

  // Add times during effective hours
  learning.effectiveHours.forEach((hour) => {
    if (hour >= 7 && hour <= 21) {
      suggestedTimes.push(`${hour.toString().padStart(2, '0')}:00`);
    }
  });

  // Add times during low activity hours (need extra reminders)
  patterns.lowHours.forEach((hour) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:30`;
    if (!suggestedTimes.includes(timeStr)) {
      suggestedTimes.push(timeStr);
    }
  });

  // Sort times
  suggestedTimes.sort();

  // Compile insights
  const insights: string[] = [reason, ...learning.recommendations];

  return {
    suggestedInterval: interval,
    suggestedTimes: suggestedTimes.slice(0, 8), // Max 8 suggested times
    insights,
  };
};

/**
 * Apply smart scheduling based on learned patterns
 */
export const applySmartScheduling = async (
  dailyGoal: number,
  currentIntake: number
): Promise<boolean> => {
  try {
    const settings = await getNotificationSettings();

    // Only apply if adaptive reminders are enabled
    if (!settings.adaptiveReminders) {
      return false;
    }

    const { interval } = await calculateOptimalReminderInterval(dailyGoal, currentIntake);

    // Update settings with optimal interval, preserving user's adaptive setting
    const updatedSettings: NotificationSettings = {
      ...settings,
      reminderInterval: interval,
    };

    await saveNotificationSettings(updatedSettings);
    return true;
  } catch (error) {
    console.error('Error applying smart scheduling:', error);
    return false;
  }
};

/**
 * Reset learning data
 */
export const resetLearningData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_INTERACTION_PATTERNS_KEY);
    await AsyncStorage.removeItem(OPTIMAL_INTERVALS_KEY);
  } catch (error) {
    console.error('Error resetting learning data:', error);
  }
};

/**
 * Get learning statistics for display
 */
export const getLearningStatistics = async (): Promise<{
  totalInteractions: number;
  effectivenessRate: number;
  daysOfData: number;
  topEffectiveHours: { hour: number; rate: number }[];
  summary: string;
}> => {
  const patterns = await getUserInteractionPatterns();

  let totalDismisses = 0;
  let totalSnoozes = 0;
  let totalWaterLogs = 0;
  const hourlyEffectiveness: { hour: number; rate: number }[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const dismisses = patterns.dismissTimes[hour] || 0;
    const snoozes = patterns.snoozeTimes[hour] || 0;
    const waterLogs = patterns.waterLogTimes[hour] || 0;

    totalDismisses += dismisses;
    totalSnoozes += snoozes;
    totalWaterLogs += waterLogs;

    const total = dismisses + snoozes + waterLogs;
    if (total > 0) {
      hourlyEffectiveness.push({
        hour,
        rate: Math.round((waterLogs / total) * 100),
      });
    }
  }

  const totalInteractions = totalDismisses + totalSnoozes + totalWaterLogs;
  const effectivenessRate =
    totalInteractions > 0 ? Math.round((totalWaterLogs / totalInteractions) * 100) : 0;

  // Estimate days of data based on last updated
  const lastUpdated = new Date(patterns.lastUpdated);
  const now = new Date();
  const daysOfData = Math.max(
    1,
    Math.ceil((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Top effective hours
  const topEffectiveHours = hourlyEffectiveness.sort((a, b) => b.rate - a.rate).slice(0, 5);

  // Generate summary
  let summary: string;
  if (totalInteractions < 10) {
    summary = 'Keep using the app to build your personalized reminder profile!';
  } else if (effectivenessRate >= 70) {
    summary = 'Great! Your reminders are very effective. Keep it up!';
  } else if (effectivenessRate >= 50) {
    summary = "Good progress! We're learning your patterns to improve reminders.";
  } else {
    summary = "We're adjusting your reminders based on your feedback.";
  }

  return {
    totalInteractions,
    effectivenessRate,
    daysOfData,
    topEffectiveHours,
    summary,
  };
};

// ============ PERFORMANCE & BATTERY OPTIMIZATION ============

const BATTERY_SETTINGS_KEY = 'battery_optimized_settings';
const ORIGINAL_SETTINGS_KEY = 'original_notification_settings';

/**
 * Batch notification operation type
 */
export interface BatchNotificationOperation {
  type: 'schedule' | 'cancel';
  id?: string; // For cancel operations
  content?: Notifications.NotificationContentInput; // For schedule operations
  trigger?: Notifications.NotificationTriggerInput; // For schedule operations
}

/**
 * Batch update notifications for better performance
 * Executes multiple notification operations in parallel
 */
export const batchUpdateNotifications = async (
  operations: BatchNotificationOperation[]
): Promise<{
  successful: number;
  failed: number;
  errors: string[];
}> => {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  const promises = operations.map(async (op, index) => {
    try {
      if (op.type === 'schedule' && op.content) {
        await Notifications.scheduleNotificationAsync({
          content: {
            ...op.content,
            ...(Platform.OS === 'android' && { channelId: getChannelId() }),
          },
          trigger: op.trigger || null,
        });
        results.successful++;
      } else if (op.type === 'cancel' && op.id) {
        await Notifications.cancelScheduledNotificationAsync(op.id);
        results.successful++;
      } else {
        results.failed++;
        results.errors.push(`Operation ${index}: Invalid operation data`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Operation ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  await Promise.all(promises);
  return results;
};

/**
 * Schedule multiple reminders efficiently
 */
export const batchScheduleReminders = async (
  reminders: Array<{
    hour: number;
    minute: number;
    title: string;
    body: string;
  }>
): Promise<number> => {
  const settings = await getNotificationSettings();

  const operations: BatchNotificationOperation[] = reminders.map((reminder) => ({
    type: 'schedule' as const,
    content: {
      title: reminder.title,
      body: reminder.body,
      sound: settings.soundEnabled ? 'default' : undefined,
      vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { type: 'reminder', hour: reminder.hour, minute: reminder.minute },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminder.hour,
      minute: reminder.minute,
      channelId: Platform.OS === 'android' ? getChannelId() : undefined,
    } as Notifications.DailyTriggerInput,
  }));

  const result = await batchUpdateNotifications(operations);
  return result.successful;
};

/**
 * Cancel multiple notifications efficiently
 */
export const batchCancelNotifications = async (notificationIds: string[]): Promise<number> => {
  const operations: BatchNotificationOperation[] = notificationIds.map((id) => ({
    type: 'cancel' as const,
    id,
  }));

  const result = await batchUpdateNotifications(operations);
  return result.successful;
};

/**
 * Battery optimization settings
 */
export interface BatteryOptimizationState {
  isOptimized: boolean;
  batteryLevel: number | null;
  originalInterval: number;
  optimizedInterval: number;
  vibrationDisabled: boolean;
  lastOptimized: string | null;
}

/**
 * Get current battery optimization state
 */
export const getBatteryOptimizationState = async (): Promise<BatteryOptimizationState> => {
  try {
    const data = await AsyncStorage.getItem(BATTERY_SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting battery optimization state:', error);
  }

  return {
    isOptimized: false,
    batteryLevel: null,
    originalInterval: 60,
    optimizedInterval: 60,
    vibrationDisabled: false,
    lastOptimized: null,
  };
};

/**
 * Save battery optimization state
 */
const saveBatteryOptimizationState = async (state: BatteryOptimizationState): Promise<void> => {
  try {
    await AsyncStorage.setItem(BATTERY_SETTINGS_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving battery optimization state:', error);
  }
};

/**
 * Optimize notifications for battery life
 * Reduces frequency and disables vibration when battery is low
 */
export const optimizeForBattery = async (
  batteryLevel: number
): Promise<{
  optimized: boolean;
  changes: string[];
}> => {
  const changes: string[] = [];
  const settings = await getNotificationSettings();
  const currentState = await getBatteryOptimizationState();

  // Store original settings if not already optimized
  if (!currentState.isOptimized) {
    currentState.originalInterval = settings.reminderInterval;
  }

  // Critical battery (< 10%)
  if (batteryLevel < 0.1) {
    const newInterval = Math.min(settings.reminderInterval * 3, 240); // Triple interval, max 4 hours

    await saveNotificationSettings({
      ...settings,
      reminderInterval: newInterval,
      vibrationEnabled: false,
      soundEnabled: false, // Also disable sound for critical battery
    });

    changes.push(`Reminder interval increased to ${newInterval} minutes`);
    changes.push('Vibration disabled');
    changes.push('Sound disabled');

    await saveBatteryOptimizationState({
      isOptimized: true,
      batteryLevel,
      originalInterval: currentState.originalInterval,
      optimizedInterval: newInterval,
      vibrationDisabled: true,
      lastOptimized: new Date().toISOString(),
    });

    return { optimized: true, changes };
  }

  // Low battery (< 20%)
  if (batteryLevel < 0.2) {
    const newInterval = Math.min(settings.reminderInterval * 2, 180); // Double interval, max 3 hours

    await saveNotificationSettings({
      ...settings,
      reminderInterval: newInterval,
      vibrationEnabled: false,
    });

    changes.push(`Reminder interval increased to ${newInterval} minutes`);
    changes.push('Vibration disabled');

    await saveBatteryOptimizationState({
      isOptimized: true,
      batteryLevel,
      originalInterval: currentState.originalInterval,
      optimizedInterval: newInterval,
      vibrationDisabled: true,
      lastOptimized: new Date().toISOString(),
    });

    return { optimized: true, changes };
  }

  // Medium battery (< 35%)
  if (batteryLevel < 0.35) {
    const newInterval = Math.min(Math.round(settings.reminderInterval * 1.5), 120);

    await saveNotificationSettings({
      ...settings,
      reminderInterval: newInterval,
    });

    changes.push(`Reminder interval increased to ${newInterval} minutes`);

    await saveBatteryOptimizationState({
      isOptimized: true,
      batteryLevel,
      originalInterval: currentState.originalInterval,
      optimizedInterval: newInterval,
      vibrationDisabled: false,
      lastOptimized: new Date().toISOString(),
    });

    return { optimized: true, changes };
  }

  // Battery is good - restore original settings if previously optimized
  if (currentState.isOptimized && batteryLevel >= 0.35) {
    await restoreFromBatteryOptimization();
    changes.push('Restored original notification settings');
    return { optimized: false, changes };
  }

  return { optimized: false, changes: ['Battery level is good, no optimization needed'] };
};

/**
 * Restore original settings after battery optimization
 */
export const restoreFromBatteryOptimization = async (): Promise<boolean> => {
  try {
    const state = await getBatteryOptimizationState();

    if (!state.isOptimized) {
      return false; // Nothing to restore
    }

    const settings = await getNotificationSettings();

    await saveNotificationSettings({
      ...settings,
      reminderInterval: state.originalInterval,
      vibrationEnabled: true,
      soundEnabled: true,
    });

    await saveBatteryOptimizationState({
      isOptimized: false,
      batteryLevel: null,
      originalInterval: state.originalInterval,
      optimizedInterval: state.originalInterval,
      vibrationDisabled: false,
      lastOptimized: null,
    });

    return true;
  } catch (error) {
    console.error('Error restoring from battery optimization:', error);
    return false;
  }
};

/**
 * Check if battery optimization is currently active
 */
export const isBatteryOptimizationActive = async (): Promise<boolean> => {
  const state = await getBatteryOptimizationState();
  return state.isOptimized;
};

/**
 * Get battery optimization summary for display
 */
export const getBatteryOptimizationSummary = async (): Promise<{
  isActive: boolean;
  status: string;
  details: string[];
}> => {
  const state = await getBatteryOptimizationState();

  if (!state.isOptimized) {
    return {
      isActive: false,
      status: 'Normal mode',
      details: ['Notifications running at full capacity'],
    };
  }

  const details: string[] = [];

  if (state.optimizedInterval > state.originalInterval) {
    details.push(`Interval: ${state.originalInterval}min → ${state.optimizedInterval}min`);
  }

  if (state.vibrationDisabled) {
    details.push('Vibration: Disabled');
  }

  const batteryPercent = state.batteryLevel ? Math.round(state.batteryLevel * 100) : 0;

  return {
    isActive: true,
    status: `Battery saver active (${batteryPercent}%)`,
    details,
  };
};

// ============ NOTIFICATION CLEANUP & MAINTENANCE ============

/**
 * Clean up old/expired notifications
 */
export const cleanupNotifications = async (): Promise<{
  cancelled: number;
  remaining: number;
}> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const now = new Date();
    const expiredIds: string[] = [];

    // Find notifications that might be stale (older than 7 days based on data)
    scheduled.forEach((notification) => {
      const data = notification.content.data as { createdAt?: string } | undefined;
      if (data?.createdAt) {
        const createdAt = new Date(data.createdAt);
        const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 7) {
          expiredIds.push(notification.identifier);
        }
      }
    });

    if (expiredIds.length > 0) {
      await batchCancelNotifications(expiredIds);
    }

    const remaining = await Notifications.getAllScheduledNotificationsAsync();

    return {
      cancelled: expiredIds.length,
      remaining: remaining.length,
    };
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    return { cancelled: 0, remaining: 0 };
  }
};

/**
 * Get notification health status
 */
export const getNotificationHealthStatus = async (): Promise<{
  isHealthy: boolean;
  scheduledCount: number;
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const settings = await getNotificationSettings();
    const batteryState = await getBatteryOptimizationState();

    // Check if notifications are enabled
    if (!settings.enabled) {
      issues.push('Notifications are disabled');
      recommendations.push('Enable notifications to receive hydration reminders');
    }

    // Check scheduled count
    if (scheduled.length === 0 && settings.enabled) {
      issues.push('No notifications scheduled');
      recommendations.push('Reschedule notifications in settings');
    }

    if (scheduled.length > 50) {
      issues.push('Too many notifications scheduled');
      recommendations.push('Consider cleaning up old notifications');
    }

    // Check battery optimization
    if (batteryState.isOptimized) {
      issues.push('Battery optimization is active');
      recommendations.push('Charge your device to restore full notification frequency');
    }

    // Check quiet hours configuration
    if (settings.quietHoursEnabled) {
      const quietStart = parseInt(settings.quietHoursStart.split(':')[0]);
      const quietEnd = parseInt(settings.quietHoursEnd.split(':')[0]);
      const quietDuration =
        quietStart > quietEnd ? 24 - quietStart + quietEnd : quietEnd - quietStart;

      if (quietDuration > 12) {
        issues.push('Quiet hours span more than 12 hours');
        recommendations.push('Consider reducing quiet hours for better hydration tracking');
      }
    }

    return {
      isHealthy: issues.length === 0,
      scheduledCount: scheduled.length,
      issues,
      recommendations,
    };
  } catch (error) {
    console.error('Error checking notification health:', error);
    return {
      isHealthy: false,
      scheduledCount: 0,
      issues: ['Unable to check notification status'],
      recommendations: ['Try restarting the app'],
    };
  }
};

/**
 * Reschedule all notifications (useful after app update or settings change)
 */
export const rescheduleAllNotifications = async (): Promise<{
  success: boolean;
  scheduled: number;
}> => {
  try {
    // Cancel all existing
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Get current settings and reschedule
    const settings = await getNotificationSettings();
    await scheduleSmartReminders(settings);

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    return {
      success: true,
      scheduled: scheduled.length,
    };
  } catch (error) {
    console.error('Error rescheduling notifications:', error);
    return {
      success: false,
      scheduled: 0,
    };
  }
};

// ============ ACCESSIBILITY & IMPORTANCE LEVELS ============

/**
 * Accessibility notification settings
 */
export interface AccessibilityNotificationSettings {
  useLargeText: boolean;
  useHighContrast: boolean;
  useScreenReader: boolean;
}

/**
 * Get device accessibility settings for notifications
 * Reads actual device accessibility preferences
 */
export const getAccessibilityNotificationSettings =
  async (): Promise<AccessibilityNotificationSettings> => {
    try {
      const [screenReaderEnabled, boldTextEnabled, reduceMotionEnabled] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isBoldTextEnabled().catch(() => false),
        AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
      ]);

      return {
        useLargeText: boldTextEnabled,
        useHighContrast: reduceMotionEnabled, // Often correlates with high contrast needs
        useScreenReader: screenReaderEnabled,
      };
    } catch (error) {
      console.error('Error getting accessibility settings:', error);
      return {
        useLargeText: false,
        useHighContrast: false,
        useScreenReader: false,
      };
    }
  };

/**
 * Notification importance levels
 */
export enum NotificationImportance {
  HIGH = 'high', // Must show immediately with sound/vibration
  MEDIUM = 'medium', // Show but can be delayed
  LOW = 'low', // Silent/background
}

/**
 * Priority mapping for Android notifications
 */
const PRIORITY_MAP = {
  [NotificationImportance.HIGH]: Notifications.AndroidNotificationPriority.HIGH,
  [NotificationImportance.MEDIUM]: Notifications.AndroidNotificationPriority.DEFAULT,
  [NotificationImportance.LOW]: Notifications.AndroidNotificationPriority.LOW,
};

/**
 * Schedule notification with importance level and accessibility support
 * Handles screen reader announcements and proper priority mapping
 */
export const scheduleNotificationWithImportance = async (
  content: {
    content?: {
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
    };
    trigger?: Notifications.NotificationTriggerInput;
  },
  importance: NotificationImportance
): Promise<string | null> => {
  try {
    const [settings, accessibilitySettings] = await Promise.all([
      getNotificationSettings(),
      getAccessibilityNotificationSettings(),
    ]);

    // Check if notifications are enabled and not in quiet hours
    if (!settings.enabled || isQuietHours(settings)) {
      return null;
    }

    const title = content.content?.title ?? '';
    const body = content.content?.body ?? '';

    // Enhance content for screen readers - combine title and body
    const accessibleBody = accessibilitySettings.useScreenReader ? `${title}. ${body}` : body;

    // Determine sound and vibration based on importance
    const shouldPlaySound = importance !== NotificationImportance.LOW && settings.soundEnabled;
    const shouldVibrate = importance === NotificationImportance.HIGH && settings.vibrationEnabled;

    const adjustedContent: Notifications.NotificationContentInput = {
      title,
      body: accessibleBody,
      sound: shouldPlaySound ? 'default' : undefined,
      vibrate: shouldVibrate ? [0, 250, 250, 250] : undefined,
      priority: PRIORITY_MAP[importance],
      data: {
        ...content.content?.data,
        importance,
        accessibilityEnhanced: accessibilitySettings.useScreenReader,
      },
      ...(Platform.OS === 'android' && { channelId: getChannelId() }),
    };

    // Announce to screen reader for high importance notifications
    if (accessibilitySettings.useScreenReader && importance === NotificationImportance.HIGH) {
      AccessibilityInfo.announceForAccessibility(accessibleBody);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: adjustedContent,
      trigger: content.trigger || null,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification with importance:', error);
    return null;
  }
};

/**
 * Send immediate notification with importance level
 */
export const sendImmediateNotificationWithImportance = async (
  title: string,
  body: string,
  importance: NotificationImportance,
  data?: Record<string, unknown>
): Promise<string | null> => {
  return scheduleNotificationWithImportance(
    {
      content: { title, body, data },
      trigger: null,
    },
    importance
  );
};

/**
 * Send high priority notification (with sound and vibration)
 */
export const sendHighPriorityNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string | null> => {
  return sendImmediateNotificationWithImportance(title, body, NotificationImportance.HIGH, data);
};

/**
 * Send medium priority notification (default priority)
 */
export const sendMediumPriorityNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string | null> => {
  return sendImmediateNotificationWithImportance(title, body, NotificationImportance.MEDIUM, data);
};

/**
 * Send low priority notification (silent)
 */
export const sendLowPriorityNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string | null> => {
  return sendImmediateNotificationWithImportance(title, body, NotificationImportance.LOW, data);
};

/**
 * Test accessibility notification
 */
export const testAccessibilityNotification = async (
  language: 'en' | 'my' = 'en'
): Promise<{
  success: boolean;
  accessibilitySettings: AccessibilityNotificationSettings;
}> => {
  const accessibilitySettings = await getAccessibilityNotificationSettings();

  const title = language === 'my' ? '♿ သုံးစွဲနိုင်မှုစမ်းသပ်ချက်' : '♿ Accessibility Test';

  const body =
    language === 'my'
      ? `Screen Reader: ${accessibilitySettings.useScreenReader ? 'ဖွင့်' : 'ပိတ်'} | Bold Text: ${accessibilitySettings.useLargeText ? 'ဖွင့်' : 'ပိတ်'}`
      : `Screen Reader: ${accessibilitySettings.useScreenReader ? 'ON' : 'OFF'} | Bold Text: ${accessibilitySettings.useLargeText ? 'ON' : 'OFF'}`;

  const notificationId = await sendHighPriorityNotification(title, body, {
    type: 'accessibility-test',
  });

  return {
    success: notificationId !== null,
    accessibilitySettings,
  };
};

/**
 * Test notification with specific importance level
 */
export const testNotificationImportance = async (
  importance: NotificationImportance,
  language: 'en' | 'my' = 'en'
): Promise<boolean> => {
  const importanceLabels = {
    [NotificationImportance.HIGH]: language === 'my' ? 'မြင့်' : 'HIGH',
    [NotificationImportance.MEDIUM]: language === 'my' ? 'အလယ်အလတ်' : 'MEDIUM',
    [NotificationImportance.LOW]: language === 'my' ? 'နိမ့်' : 'LOW',
  };

  const title =
    language === 'my'
      ? `🔔 ${importanceLabels[importance]} အရေးပါမှုစမ်းသပ်ချက်`
      : `🔔 ${importanceLabels[importance]} Importance Test`;

  const descriptions = {
    [NotificationImportance.HIGH]:
      language === 'my'
        ? 'ဤအသိပေးချက်တွင် အသံနှင့် တုန်ခါမှုပါဝင်သင့်သည်။'
        : 'This notification should have sound and vibration.',
    [NotificationImportance.MEDIUM]:
      language === 'my'
        ? 'ဤအသိပေးချက်တွင် အသံပါဝင်သင့်သော်လည်း တုန်ခါမှုမပါဝင်ပါ။'
        : 'This notification should have sound but no vibration.',
    [NotificationImportance.LOW]:
      language === 'my'
        ? 'ဤသည်မှာ တိတ်ဆိတ်သောအသိပေးချက်ဖြစ်သည်။'
        : 'This is a silent notification.',
  };

  const notificationId = await sendImmediateNotificationWithImportance(
    title,
    descriptions[importance],
    importance,
    { type: 'importance-test', importance }
  );

  return notificationId !== null;
};

/**
 * Get accessibility status summary
 */
export const getAccessibilityStatusSummary = async (): Promise<{
  settings: AccessibilityNotificationSettings;
  summary: string;
  recommendations: string[];
}> => {
  const settings = await getAccessibilityNotificationSettings();
  const recommendations: string[] = [];

  let summary = 'Standard notification mode';

  if (settings.useScreenReader) {
    summary = 'Screen reader mode active';
    recommendations.push('Notifications will be announced audibly');
    recommendations.push('High priority notifications get immediate announcements');
  }

  if (settings.useLargeText) {
    recommendations.push('Consider using shorter notification messages');
  }

  if (settings.useHighContrast) {
    recommendations.push('Reduced motion preferences detected');
  }

  if (recommendations.length === 0) {
    recommendations.push('All accessibility features working normally');
  }

  return {
    settings,
    summary,
    recommendations,
  };
};
