/**
 * Focus & Sleep Notification Sounds Service
 * Custom notification sounds for focus sessions and sleep reminders
 * Plays even in silent mode
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const FOCUS_SOUND_KEY = '@hydromate_focus_notification_sound';
const SLEEP_SOUND_KEY = '@hydromate_sleep_notification_sound';
const FOCUS_CHANNEL_ID = 'hydromate-focus-reminders';
const SLEEP_CHANNEL_ID = 'hydromate-sleep-reminders';

// Available notification sounds for Focus Mode
export type FocusSoundId =
  | 'default'
  | 'bell-chime'
  | 'soft-gong'
  | 'zen-bowl'
  | 'gentle-bell'
  | 'silent';

// Available notification sounds for Sleep Mode
export type SleepSoundId =
  | 'default'
  | 'soft-chime'
  | 'lullaby-bell'
  | 'night-bell'
  | 'gentle-tone'
  | 'silent';

export interface NotificationSoundOption {
  id: string;
  name: string;
  nameMy: string;
  icon: string;
  description: string;
  descriptionMy: string;
  androidSound: string | null;
  iosSound: string | null;
  previewAsset: any;
  isPremium: boolean;
}

// Focus Mode notification sounds
export const FOCUS_SOUNDS: NotificationSoundOption[] = [
  {
    id: 'default',
    name: 'System Default',
    nameMy: 'စနစ်မူလ',
    icon: '🔔',
    description: 'Standard system notification sound',
    descriptionMy: 'စံစနစ်အသိပေးသံ',
    androidSound: null,
    iosSound: null,
    previewAsset: null,
    isPremium: false,
  },
  {
    id: 'bell-chime',
    name: 'Bell Chime',
    nameMy: 'ခေါင်းလောင်းသံ',
    icon: '🔔',
    description: 'Clear bell chime for focus alerts',
    descriptionMy: 'အာရုံစူးစိုက်မှုအတွက် ရှင်းလင်းသော ခေါင်းလောင်းသံ',
    androidSound: 'water_bubble', // Reuse water bubble for now
    iosSound: 'water_bubble.wav',
    previewAsset: require('../assets/sounds/water_bubble.wav'),
    isPremium: false,
  },
  {
    id: 'soft-gong',
    name: 'Soft Gong',
    nameMy: 'ပျော့ပျောင်းသော ခေါင်းလောင်း',
    icon: '🎵',
    description: 'Gentle gong sound for breaks',
    descriptionMy: 'အနားယူချိန်အတွက် ဖြည်းဖြည်းခေါင်းလောင်းသံ',
    androidSound: 'liquid_bubble', // Reuse liquid bubble for now
    iosSound: 'liquid_bubble.wav',
    previewAsset: require('../assets/sounds/liquid_bubble.wav'),
    isPremium: false,
  },
  {
    id: 'zen-bowl',
    name: 'Zen Bowl',
    nameMy: 'ဇင်ခွက်',
    icon: '🎎',
    description: 'Calming zen bowl sound',
    descriptionMy: 'စိတ်ငြိမ်စေသော ဇင်ခွက်သံ',
    androidSound: 'water_bubble',
    iosSound: 'water_bubble.wav',
    previewAsset: require('../assets/sounds/water_bubble.wav'),
    isPremium: false,
  },
  {
    id: 'silent',
    name: 'Silent',
    nameMy: 'အသံတိတ်',
    icon: '🔕',
    description: 'No sound, visual only',
    descriptionMy: 'အသံမရှိ၊ မြင်ရုံသာ',
    androidSound: null,
    iosSound: null,
    previewAsset: null,
    isPremium: false,
  },
];

// Sleep Mode notification sounds
export const SLEEP_SOUNDS: NotificationSoundOption[] = [
  {
    id: 'default',
    name: 'System Default',
    nameMy: 'စနစ်မူလ',
    icon: '🔔',
    description: 'Standard system notification sound',
    descriptionMy: 'စံစနစ်အသိပေးသံ',
    androidSound: null,
    iosSound: null,
    previewAsset: null,
    isPremium: false,
  },
  {
    id: 'soft-chime',
    name: 'Soft Chime',
    nameMy: 'ပျော့ပျောင်းသံ',
    icon: '🌙',
    description: 'Gentle chime for bedtime',
    descriptionMy: 'အိပ်ချိန်အတွက် ဖြည်းဖြည်းသံ',
    androidSound: 'liquid_bubble',
    iosSound: 'liquid_bubble.wav',
    previewAsset: require('../assets/sounds/liquid_bubble.wav'),
    isPremium: false,
  },
  {
    id: 'lullaby-bell',
    name: 'Lullaby Bell',
    nameMy: 'အိပ်ချိန်ခေါင်းလောင်း',
    icon: '🎵',
    description: 'Soothing bell for sleep reminders',
    descriptionMy: 'အိပ်စက်မှုသတိပေးချက်အတွက် သက်သာစေသောသံ',
    androidSound: 'water_bubble',
    iosSound: 'water_bubble.wav',
    previewAsset: require('../assets/sounds/water_bubble.wav'),
    isPremium: false,
  },
  {
    id: 'night-bell',
    name: 'Night Bell',
    nameMy: 'ညခေါင်းလောင်း',
    icon: '🌃',
    description: 'Peaceful night bell',
    descriptionMy: 'ငြိမ်သက်သော ညခေါင်းလောင်း',
    androidSound: 'liquid_bubble',
    iosSound: 'liquid_bubble.wav',
    previewAsset: require('../assets/sounds/liquid_bubble.wav'),
    isPremium: false,
  },
  {
    id: 'silent',
    name: 'Silent',
    nameMy: 'အသံတိတ်',
    icon: '🔕',
    description: 'No sound, visual only',
    descriptionMy: 'အသံမရှိ၊ မြင်ရုံသာ',
    androidSound: null,
    iosSound: null,
    previewAsset: null,
    isPremium: false,
  },
];

// Get saved focus sound preference
export const getFocusSound = async (): Promise<FocusSoundId> => {
  try {
    const saved = await AsyncStorage.getItem(FOCUS_SOUND_KEY);
    if (saved && FOCUS_SOUNDS.some((s) => s.id === saved)) {
      return saved as FocusSoundId;
    }
    return 'bell-chime'; // Default
  } catch {
    return 'bell-chime';
  }
};

// Get saved sleep sound preference
export const getSleepSound = async (): Promise<SleepSoundId> => {
  try {
    const saved = await AsyncStorage.getItem(SLEEP_SOUND_KEY);
    if (saved && SLEEP_SOUNDS.some((s) => s.id === saved)) {
      return saved as SleepSoundId;
    }
    return 'soft-chime'; // Default
  } catch {
    return 'soft-chime';
  }
};

// Save focus sound preference
export const setFocusSound = async (soundId: FocusSoundId): Promise<void> => {
  await AsyncStorage.setItem(FOCUS_SOUND_KEY, soundId);
  if (Platform.OS === 'android') {
    await updateFocusNotificationChannel(soundId);
  }
};

// Save sleep sound preference
export const setSleepSound = async (soundId: SleepSoundId): Promise<void> => {
  await AsyncStorage.setItem(SLEEP_SOUND_KEY, soundId);
  if (Platform.OS === 'android') {
    await updateSleepNotificationChannel(soundId);
  }
};

// Get sound option by ID
export const getFocusSoundOption = (soundId: string): NotificationSoundOption | undefined => {
  return FOCUS_SOUNDS.find((s) => s.id === soundId);
};

export const getSleepSoundOption = (soundId: string): NotificationSoundOption | undefined => {
  return SLEEP_SOUNDS.find((s) => s.id === soundId);
};

// Update Android notification channel for Focus Mode
const updateFocusNotificationChannel = async (soundId: FocusSoundId): Promise<void> => {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.deleteNotificationChannelAsync(FOCUS_CHANNEL_ID);
    console.log('Deleted existing focus notification channel');
  } catch {
    console.log('No existing focus channel to delete');
  }

  const soundOption = getFocusSoundOption(soundId);
  let soundValue: string | undefined;

  if (soundId === 'silent') {
    soundValue = undefined;
  } else if (soundOption?.androidSound) {
    soundValue = soundOption.androidSound;
  } else {
    soundValue = 'default';
  }

  const channelConfig: Notifications.NotificationChannelInput = {
    name: 'Focus Reminders',
    description: 'Focus session and break notifications (plays even in silent mode)',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF9800',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    sound: soundValue,
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
  };

  await Notifications.setNotificationChannelAsync(FOCUS_CHANNEL_ID, channelConfig);
  console.log(`✅ Focus notification channel created with sound: ${soundValue || 'silent'}`);
  console.log('📢 Focus notifications will play sound even in silent mode');
};

// Update Android notification channel for Sleep Mode
const updateSleepNotificationChannel = async (soundId: SleepSoundId): Promise<void> => {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.deleteNotificationChannelAsync(SLEEP_CHANNEL_ID);
    console.log('Deleted existing sleep notification channel');
  } catch {
    console.log('No existing sleep channel to delete');
  }

  const soundOption = getSleepSoundOption(soundId);
  let soundValue: string | undefined;

  if (soundId === 'silent') {
    soundValue = undefined;
  } else if (soundOption?.androidSound) {
    soundValue = soundOption.androidSound;
  } else {
    soundValue = 'default';
  }

  const channelConfig: Notifications.NotificationChannelInput = {
    name: 'Sleep Reminders',
    description: 'Bedtime and sleep notifications (plays even in silent mode)',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#9C27B0',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    sound: soundValue,
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
  };

  await Notifications.setNotificationChannelAsync(SLEEP_CHANNEL_ID, channelConfig);
  console.log(`✅ Sleep notification channel created with sound: ${soundValue || 'silent'}`);
  console.log('📢 Sleep notifications will play sound even in silent mode');
};

// Preview sound
let previewSound: Audio.Sound | null = null;

export const previewFocusSound = async (soundId: FocusSoundId): Promise<boolean> => {
  return previewSound_(soundId, FOCUS_SOUNDS);
};

export const previewSleepSound = async (soundId: SleepSoundId): Promise<boolean> => {
  return previewSound_(soundId, SLEEP_SOUNDS);
};

const previewSound_ = async (
  soundId: string,
  sounds: NotificationSoundOption[]
): Promise<boolean> => {
  try {
    await stopSoundPreview();

    if (soundId === 'silent') {
      console.log('Silent mode - no preview');
      return true;
    }

    if (soundId === 'default') {
      console.log('System default sound - cannot preview');
      return true;
    }

    const soundOption = sounds.find((s) => s.id === soundId);
    if (!soundOption?.previewAsset) {
      console.warn(`No preview asset for sound: ${soundId}`);
      return false;
    }

    // Configure audio mode to play even in silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: 1, // Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
      interruptionModeAndroid: 1, // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });

    previewSound = new Audio.Sound();
    await previewSound.loadAsync(soundOption.previewAsset, {
      shouldPlay: false,
      volume: 1.0,
      isLooping: false,
    });

    await previewSound.playAsync();
    console.log(`🔊 Playing preview: ${soundOption.name} (even in silent mode)`);

    previewSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        console.log('Preview finished, cleaning up');
        stopSoundPreview();
      }
    });

    return true;
  } catch (error) {
    console.error('Error previewing sound:', error);
    await stopSoundPreview();
    return false;
  }
};

export const stopSoundPreview = async (): Promise<void> => {
  if (previewSound) {
    try {
      await previewSound.stopAsync();
      await previewSound.unloadAsync();
      console.log('Preview sound stopped');
    } catch (error) {
      console.log('Error stopping preview:', error);
    }
    previewSound = null;
  }
};

// Send test notification for Focus Mode
export const sendTestFocusNotification = async (
  soundId?: FocusSoundId,
  language: 'en' | 'my' = 'en'
): Promise<boolean> => {
  try {
    const selectedSound = soundId || (await getFocusSound());
    const soundOption = getFocusSoundOption(selectedSound);

    if (Platform.OS === 'android') {
      await updateFocusNotificationChannel(selectedSound);
    }

    const soundName = language === 'my' ? soundOption?.nameMy : soundOption?.name;
    const title = language === 'my' ? '🍅 အာရုံစူးစိုက်မှုစမ်းသပ်မှု' : '🍅 Focus Mode Test';
    const body =
      language === 'my'
        ? `"${soundName || 'မူလ'}" အသိပေးသံကို စမ်းသပ်နေသည်။ ကြားရပါသလား?`
        : `Testing "${soundOption?.name || 'Default'}" focus notification sound. Can you hear it?`;

    const notificationContent: any = {
      title,
      body,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
      data: { type: 'focus-test', soundId: selectedSound },
    };

    if (Platform.OS === 'android') {
      notificationContent.channelId = FOCUS_CHANNEL_ID;
    } else if (Platform.OS === 'ios') {
      if (selectedSound === 'silent') {
        notificationContent.sound = false;
      } else if (soundOption?.iosSound) {
        notificationContent.sound = soundOption.iosSound;
      } else {
        notificationContent.sound = true;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });

    console.log(`✅ Test focus notification sent with sound: ${selectedSound}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending test focus notification:', error);
    return false;
  }
};

// Send test notification for Sleep Mode
export const sendTestSleepNotification = async (
  soundId?: SleepSoundId,
  language: 'en' | 'my' = 'en'
): Promise<boolean> => {
  try {
    const selectedSound = soundId || (await getSleepSound());
    const soundOption = getSleepSoundOption(selectedSound);

    if (Platform.OS === 'android') {
      await updateSleepNotificationChannel(selectedSound);
    }

    const soundName = language === 'my' ? soundOption?.nameMy : soundOption?.name;
    const title = language === 'my' ? '😴 အိပ်စက်မှုစမ်းသပ်မှု' : '😴 Sleep Mode Test';
    const body =
      language === 'my'
        ? `"${soundName || 'မူလ'}" အသိပေးသံကို စမ်းသပ်နေသည်။ ကြားရပါသလား?`
        : `Testing "${soundOption?.name || 'Default'}" sleep notification sound. Can you hear it?`;

    const notificationContent: any = {
      title,
      body,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
      data: { type: 'sleep-test', soundId: selectedSound },
    };

    if (Platform.OS === 'android') {
      notificationContent.channelId = SLEEP_CHANNEL_ID;
    } else if (Platform.OS === 'ios') {
      if (selectedSound === 'silent') {
        notificationContent.sound = false;
      } else if (soundOption?.iosSound) {
        notificationContent.sound = soundOption.iosSound;
      } else {
        notificationContent.sound = true;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });

    console.log(`✅ Test sleep notification sent with sound: ${selectedSound}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending test sleep notification:', error);
    return false;
  }
};

// Initialize notification sounds for Focus and Sleep modes
export const initializeFocusSleepNotificationSounds = async (): Promise<void> => {
  try {
    console.log('🔧 Initializing focus & sleep notification sounds...');

    // Configure audio mode to play in silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: 1, // Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
      interruptionModeAndroid: 1, // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });

    if (Platform.OS === 'android') {
      const [focusSound, sleepSound] = await Promise.all([getFocusSound(), getSleepSound()]);

      await Promise.all([
        updateFocusNotificationChannel(focusSound),
        updateSleepNotificationChannel(sleepSound),
      ]);

      console.log(`✅ Focus & Sleep notification sounds initialized`);
      console.log(`   Focus: ${focusSound}, Sleep: ${sleepSound}`);
      console.log('📢 Notifications will play sound even in silent mode');
    } else {
      console.log('✅ Focus & Sleep notification sounds initialized (iOS)');
      console.log('📢 Notifications will play sound even when silent switch is on');
    }
  } catch (error) {
    console.error('❌ Error initializing focus & sleep notification sounds:', error);
  }
};

// Get channel IDs
export const getFocusChannelId = (): string => FOCUS_CHANNEL_ID;
export const getSleepChannelId = (): string => SLEEP_CHANNEL_ID;
