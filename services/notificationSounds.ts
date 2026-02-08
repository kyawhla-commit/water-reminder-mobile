/**
 * Notification Sounds Service
 * Custom notification sounds for water reminders with nature-inspired audio
 * Optimized for performance and reliability
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Constants
const NOTIFICATION_SOUND_KEY = '@hydromate_notification_sound';
const NOTIFICATION_CHANNEL_ID = 'hydromate-water-reminders';
const DEFAULT_SOUND_ID = 'popping-bubble';

// Types
export type NotificationSoundId = 'popping-bubble' | 'silent';

export interface NotificationSoundOption {
  id: NotificationSoundId;
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

// Sound options with lazy loading for assets
export const NOTIFICATION_SOUNDS: Readonly<NotificationSoundOption[]> = [
  {
    id: 'popping-bubble',
    name: 'Popping Bubble',
    nameMy: 'ပေါက်သောပူဖောင်းသံ',
    icon: '💥',
    description: 'Clear, crisp bubble pop - Professional & Attention-grabbing',
    descriptionMy: 'ရှင်းလင်းပြတ်သားသော ပူဖောင်းပေါက်သံ - ပရော်ဖက်ရှင်နယ်',
    androidSound: 'popping_bubble',
    iosSound: 'popping_bubble.wav',
    previewAsset: require('../assets/sounds/popping_bubble.wav'),
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
] as const;

// Cache for sound options
const soundOptionCache = new Map<NotificationSoundId, NotificationSoundOption>();

// Cache for loaded sound instances
const soundCache = new Map<NotificationSoundId, Audio.Sound>();

/**
 * Get sound option by ID with caching
 */
export const getSoundOption = (soundId: NotificationSoundId): NotificationSoundOption => {
  if (soundOptionCache.has(soundId)) {
    return soundOptionCache.get(soundId)!;
  }

  const option = NOTIFICATION_SOUNDS.find((s) => s.id === soundId) || NOTIFICATION_SOUNDS[0];
  soundOptionCache.set(soundId, option);
  return option;
};

/**
 * Get saved notification sound preference
 */
export const getNotificationSound = async (): Promise<NotificationSoundId> => {
  try {
    const saved = await AsyncStorage.getItem(NOTIFICATION_SOUND_KEY);
    const isValid = saved && NOTIFICATION_SOUNDS.some((s) => s.id === saved);
    return isValid ? (saved as NotificationSoundId) : DEFAULT_SOUND_ID;
  } catch (error) {
    console.warn('Failed to get notification sound:', error);
    return DEFAULT_SOUND_ID;
  }
};

/**
 * Save notification sound preference
 */
export const setNotificationSound = async (soundId: NotificationSoundId): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SOUND_KEY, soundId);

    if (Platform.OS === 'android') {
      await updateNotificationChannel(soundId);
    }

    // Clear preview cache when sound changes
    await stopSoundPreview();
    soundCache.delete(soundId);
  } catch (error) {
    console.error('Failed to set notification sound:', error);
    throw new Error('Failed to save sound preference');
  }
};

/**
 * Update Android notification channel with proper error handling
 */
const updateNotificationChannel = async (soundId: NotificationSoundId): Promise<void> => {
  if (Platform.OS !== 'android') return;

  try {
    // Try to delete existing channel
    try {
      await Notifications.deleteNotificationChannelAsync(NOTIFICATION_CHANNEL_ID);
      console.log('🗑️ Deleted existing notification channel');
    } catch (deleteError) {
      console.log('ℹ️ No existing channel to delete');
    }

    const soundOption = getSoundOption(soundId);
    let soundValue: string | undefined;

    if (soundId === 'silent') {
      soundValue = undefined;
    } else if (soundOption?.androidSound) {
      soundValue = soundOption.androidSound;
    } else {
      soundValue = 'default';
    }

    const channelConfig: Notifications.NotificationChannelInput = {
      name: 'Water Reminders',
      description: 'Hydration reminder notifications with custom sounds',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      sound: soundValue,
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    };

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, channelConfig);
    console.log(`✅ Notification channel created with sound: ${soundValue || 'silent'}`);
  } catch (error) {
    console.error('❌ Failed to update notification channel:', error);
    throw error;
  }
};

/**
 * Load sound with caching
 */
const loadSound = async (soundId: NotificationSoundId): Promise<Audio.Sound | null> => {
  if (soundId === 'silent') return null;

  if (soundCache.has(soundId)) {
    const cachedSound = soundCache.get(soundId)!;
    try {
      const status = await cachedSound.getStatusAsync();
      if (status.isLoaded) {
        return cachedSound;
      }
    } catch {
      // Sound is no longer valid, remove from cache
      soundCache.delete(soundId);
    }
  }

  const soundOption = getSoundOption(soundId);
  if (!soundOption?.previewAsset) return null;

  try {
    const sound = new Audio.Sound();

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: 1, // Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
      interruptionModeAndroid: 1, // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });

    await sound.loadAsync(soundOption.previewAsset, {
      shouldPlay: false,
      volume: 1.0,
      isLooping: false,
      progressUpdateIntervalMillis: 100,
    });

    soundCache.set(soundId, sound);
    return sound;
  } catch (error) {
    console.error(`Failed to load sound ${soundId}:`, error);
    return null;
  }
};

/**
 * Preview a notification sound with better state management
 */
let previewSound: Audio.Sound | null = null;
let isPreviewPlaying = false;

export const previewNotificationSound = async (soundId: NotificationSoundId): Promise<boolean> => {
  if (isPreviewPlaying) {
    await stopSoundPreview();
  }

  if (soundId === 'silent') {
    console.log('🔇 Silent mode - no preview');
    return true;
  }

  try {
    isPreviewPlaying = true;
    const sound = await loadSound(soundId);

    if (!sound) return false;

    previewSound = sound;

    // Reset position and play
    await sound.setPositionAsync(0);
    await sound.playAsync();

    console.log(`🔊 Playing preview: ${getSoundOption(soundId).name}`);

    // Setup completion handler
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        isPreviewPlaying = false;
        console.log('Preview finished');
      }
    });

    return true;
  } catch (error) {
    console.error('Error previewing sound:', error);
    isPreviewPlaying = false;
    return false;
  }
};

/**
 * Stop sound preview with proper cleanup
 */
export const stopSoundPreview = async (): Promise<void> => {
  if (previewSound && isPreviewPlaying) {
    try {
      const status = await previewSound.getStatusAsync();
      if (status.isLoaded) {
        await previewSound.stopAsync();
        await previewSound.unloadAsync();
      }
    } catch (error) {
      console.warn('Error stopping preview:', error);
    } finally {
      previewSound = null;
      isPreviewPlaying = false;
    }
  }
};

/**
 * Send test notification with improved error handling
 */
export const sendTestNotificationWithSound = async (
  soundId?: NotificationSoundId,
  language: 'en' | 'my' = 'en'
): Promise<boolean> => {
  try {
    const selectedSound = soundId || (await getNotificationSound());
    const soundOption = getSoundOption(selectedSound);

    // Update Android channel if needed
    if (Platform.OS === 'android') {
      await updateNotificationChannel(selectedSound);
    }

    // Localized content
    const localizedContent = {
      en: {
        title: '💧 Water Reminder Test',
        body: `Testing "${soundOption.name}" notification sound. Can you hear it?`,
      },
      my: {
        title: '💧 ရေသောက်သတိပေးစမ်းသပ်မှု',
        body: `"${soundOption.nameMy}" အသိပေးသံကို စမ်းသပ်နေသည်။ ကြားရပါသလား?`,
      },
    };

    const { title, body } = localizedContent[language];

    // Build notification content
    const notificationContent: any = {
      title,
      body,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
      data: { type: 'sound-test', soundId: selectedSound, timestamp: Date.now() },
    };

    // Platform-specific sound configuration
    if (Platform.OS === 'android') {
      notificationContent.channelId = NOTIFICATION_CHANNEL_ID;
    } else if (Platform.OS === 'ios') {
      if (selectedSound === 'silent') {
        notificationContent.sound = false;
      } else if (soundOption.iosSound) {
        notificationContent.sound = soundOption.iosSound;
      } else {
        notificationContent.sound = true;
      }
    }

    // Schedule notification
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });

    console.log(`✅ Test notification sent with sound: ${selectedSound}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    return false;
  }
};

/**
 * Initialize notification sounds system
 */
let isInitialized = false;

export const initializeNotificationSounds = async (): Promise<void> => {
  if (isInitialized) {
    console.log('ℹ️ Notification sounds already initialized');
    return;
  }

  try {
    console.log('🔧 Initializing notification sounds...');

    // Configure audio mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: 1, // Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
      interruptionModeAndroid: 1, // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });

    // Initialize on Android
    if (Platform.OS === 'android') {
      const savedSound = await getNotificationSound();
      await updateNotificationChannel(savedSound);
      console.log(`✅ Android initialized with sound: ${savedSound}`);
    } else {
      console.log('✅ iOS notification sounds initialized');
    }

    isInitialized = true;
  } catch (error) {
    console.error('❌ Failed to initialize notification sounds:', error);
    throw error;
  }
};

/**
 * Cleanup resources
 */
export const cleanupNotificationSounds = async (): Promise<void> => {
  try {
    await stopSoundPreview();

    // Unload all cached sounds
    for (const [soundId, sound] of soundCache) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn(`Failed to unload sound ${soundId}:`, error);
      }
    }

    soundCache.clear();
    soundOptionCache.clear();
    isInitialized = false;

    console.log('🧹 Notification sounds cleaned up');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

/**
 * Validate sound files with better reporting
 */
export const validateSoundFiles = async (): Promise<{
  valid: NotificationSoundId[];
  missing: NotificationSoundId[];
}> => {
  const valid: NotificationSoundId[] = [];
  const missing: NotificationSoundId[] = [];

  for (const sound of NOTIFICATION_SOUNDS) {
    if (sound.id === 'silent') {
      valid.push(sound.id);
      continue;
    }

    try {
      const audio = new Audio.Sound();
      await audio.loadAsync(sound.previewAsset, { shouldPlay: false });
      await audio.unloadAsync();
      valid.push(sound.id);
      console.log(`✅ Sound file valid: ${sound.id}`);
    } catch (error) {
      missing.push(sound.id);
      console.error(`❌ Sound file invalid/missing: ${sound.id}`, error);
    }
  }

  return { valid, missing };
};

// Utility exports
export const getNotificationChannelId = (): string => NOTIFICATION_CHANNEL_ID;
export const getDefaultSoundId = (): NotificationSoundId => DEFAULT_SOUND_ID;
