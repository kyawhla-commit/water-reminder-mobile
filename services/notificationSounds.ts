/**
 * Notification Sounds Service
 * Custom notification sounds for water reminders with nature-inspired audio
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICATION_SOUND_KEY = '@hydromate_notification_sound';
const NOTIFICATION_CHANNEL_ID = 'hydromate-water-reminders';

// Available notification sounds
export type NotificationSoundId = 'default' | 'water-bubble' | 'liquid-bubble' | 'silent';

export interface NotificationSoundOption {
  id: NotificationSoundId;
  name: string;
  nameMy: string;
  icon: string;
  description: string;
  descriptionMy: string;
  // For Android: filename in res/raw (without extension)
  androidSound: string | null;
  // For iOS: filename in app bundle
  iosSound: string | null;
  // For preview: require() asset or null
  previewAsset: any;
  isPremium: boolean;
}

// Notification sound options
export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  {
    id: 'default',
    name: 'System Default',
    nameMy: 'စနစ်မူလ',
    icon: '🔔',
    description: 'Standard system notification sound',
    descriptionMy: 'စံစနစ်အသိပေးသံ',
    androidSound: null, // Uses system default
    iosSound: null,
    previewAsset: null,
    isPremium: false,
  },
  {
    id: 'water-bubble',
    name: 'Water Bubble',
    nameMy: 'ရေပူဖောင်းသံ',
    icon: '💧',
    description: 'Gentle water bubble sound',
    descriptionMy: 'ဖြည်းဖြည်းချင်း ရေပူဖောင်းသံ',
    androidSound: 'water_bubble', // Must match filename in res/raw (without extension)
    iosSound: 'water_bubble.wav',
    previewAsset: require('../assets/sounds/water_bubble.wav'),
    isPremium: false,
  },
  {
    id: 'liquid-bubble',
    name: 'Liquid Bubble',
    nameMy: 'အရည်ပူဖောင်းသံ',
    icon: '🫧',
    description: 'Soft liquid bubble pop sound',
    descriptionMy: 'ပျော့ပျောင်းသော အရည်ပူဖောင်းပေါက်သံ',
    androidSound: 'liquid_bubble', // Must match filename in res/raw (without extension)
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

// Get saved notification sound preference
export const getNotificationSound = async (): Promise<NotificationSoundId> => {
  try {
    const saved = await AsyncStorage.getItem(NOTIFICATION_SOUND_KEY);
    if (saved && NOTIFICATION_SOUNDS.some((s) => s.id === saved)) {
      return saved as NotificationSoundId;
    }
    return 'water-bubble'; // Default to water bubble
  } catch {
    return 'water-bubble';
  }
};

// Save notification sound preference
export const setNotificationSound = async (soundId: NotificationSoundId): Promise<void> => {
  await AsyncStorage.setItem(NOTIFICATION_SOUND_KEY, soundId);
  // Update notification channel on Android
  if (Platform.OS === 'android') {
    await updateNotificationChannel(soundId);
  }
};

// Get sound option by ID
export const getSoundOption = (
  soundId: NotificationSoundId
): NotificationSoundOption | undefined => {
  return NOTIFICATION_SOUNDS.find((s) => s.id === soundId);
};

// Update Android notification channel with custom sound
const updateNotificationChannel = async (soundId: NotificationSoundId): Promise<void> => {
  if (Platform.OS !== 'android') return;

  // Delete existing channel and recreate with new sound
  // Note: Android doesn't allow modifying channel sound after creation
  try {
    await Notifications.deleteNotificationChannelAsync(NOTIFICATION_CHANNEL_ID);
    console.log('Deleted existing notification channel');
  } catch {
    console.log('No existing channel to delete');
  }

  const soundOption = getSoundOption(soundId);

  // For custom sounds on Android, reference the file in res/raw without extension
  // The sound file must be in android/app/src/main/res/raw/
  let soundValue: string | undefined;
  if (soundId === 'silent') {
    soundValue = undefined;
  } else if (soundOption?.androidSound) {
    // Reference custom sound from res/raw (e.g., 'water_bubble' for water_bubble.wav)
    soundValue = soundOption.androidSound;
  } else {
    soundValue = 'default';
  }

  const channelConfig: Notifications.NotificationChannelInput = {
    name: 'Water Reminders',
    description: 'Hydration reminder notifications with custom sounds (plays even in silent mode)',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2196F3',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false, // Don't bypass Do Not Disturb
    sound: soundValue,
    enableVibrate: true,
    enableLights: true,
    // Android 8.0+ channel settings
    showBadge: true,
  };

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, channelConfig);
  console.log(`✅ Notification channel created with sound: ${soundValue || 'silent'}`);
  console.log('📢 Channel configured to play sound even in silent mode');
};

// Validate that sound files exist and can be loaded
export const validateSoundFiles = async (): Promise<{ valid: string[]; missing: string[] }> => {
  const valid: string[] = [];
  const missing: string[] = [];

  const soundsWithAssets = NOTIFICATION_SOUNDS.filter((s) => s.previewAsset !== null);

  for (const sound of soundsWithAssets) {
    try {
      const testSound = new Audio.Sound();
      await testSound.loadAsync(sound.previewAsset, { shouldPlay: false });
      await testSound.unloadAsync();
      valid.push(sound.id);
      console.log(`✓ Sound file exists: ${sound.id}`);
    } catch (error) {
      missing.push(sound.id);
      console.error(`✗ Sound file missing or invalid: ${sound.id}`, error);
    }
  }

  return { valid, missing };
};

// Preview a notification sound using expo-av
let previewSound: Audio.Sound | null = null;

export const previewNotificationSound = async (soundId: NotificationSoundId): Promise<boolean> => {
  try {
    // Stop any currently playing preview
    await stopSoundPreview();

    if (soundId === 'silent') {
      console.log('Silent mode - no preview');
      return true;
    }

    if (soundId === 'default') {
      // For default, we can't easily preview system sound
      console.log('System default sound - cannot preview');
      return true;
    }

    const soundOption = getSoundOption(soundId);
    if (!soundOption?.previewAsset) {
      console.warn(`No preview asset for sound: ${soundId}`);
      return false;
    }

    // Configure audio mode for playback - plays even in silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: 1, // Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
      interruptionModeAndroid: 1, // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });

    // Play the preview sound using expo-av
    previewSound = new Audio.Sound();
    await previewSound.loadAsync(soundOption.previewAsset, {
      shouldPlay: false,
      volume: 1.0,
      isLooping: false,
    });

    await previewSound.playAsync();
    console.log(`🔊 Playing preview: ${soundOption.name} (even in silent mode)`);

    // Auto-cleanup after playback
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

// Send a test notification with the selected sound
export const sendTestNotificationWithSound = async (
  soundId?: NotificationSoundId,
  language: 'en' | 'my' = 'en'
): Promise<boolean> => {
  try {
    const selectedSound = soundId || (await getNotificationSound());
    const soundOption = getSoundOption(selectedSound);

    // On Android, ensure the channel is set up with the correct sound
    if (Platform.OS === 'android') {
      await updateNotificationChannel(selectedSound);
    }

    const soundName = language === 'my' ? soundOption?.nameMy : soundOption?.name;
    const title = language === 'my' ? '💧 ရေသောက်သတိပေးစမ်းသပ်မှု' : '💧 Water Reminder Test';
    const body =
      language === 'my'
        ? `"${soundName || 'မူလ'}" အသိပေးသံကို စမ်းသပ်နေသည်။ ကြားရပါသလား?`
        : `Testing "${soundOption?.name || 'Default'}" notification sound. Can you hear it?`;

    // Build notification content
    const notificationContent: any = {
      title,
      body,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
      data: { type: 'sound-test', soundId: selectedSound },
    };

    // Add sound configuration based on platform
    if (Platform.OS === 'android') {
      // Android uses the channel's sound configuration
      notificationContent.channelId = NOTIFICATION_CHANNEL_ID;
      // Sound is already configured in the channel
    } else if (Platform.OS === 'ios') {
      // iOS can specify sound per notification
      if (selectedSound === 'silent') {
        notificationContent.sound = false;
      } else if (soundOption?.iosSound) {
        notificationContent.sound = soundOption.iosSound;
      } else {
        notificationContent.sound = true; // Use default
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });

    console.log(`✅ Test notification sent with sound: ${selectedSound}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    return false;
  }
};

// Initialize notification sound system
export const initializeNotificationSounds = async (): Promise<void> => {
  try {
    console.log('🔧 Initializing notification sounds...');

    // Configure audio mode to play in silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, // iOS: Play even when silent switch is on
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: 1, // Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
      interruptionModeAndroid: 1, // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });

    if (Platform.OS === 'android') {
      const savedSound = await getNotificationSound();
      await updateNotificationChannel(savedSound);
      console.log(`✅ Notification sounds initialized with: ${savedSound}`);
      console.log('📢 Android: Notifications will play sound even in silent mode');
    } else {
      console.log('✅ Notification sounds initialized (iOS)');
      console.log('📢 iOS: Notifications will play sound even when silent switch is on');
    }
  } catch (error) {
    console.error('❌ Error initializing notification sounds:', error);
  }
};

// Get the notification channel ID (useful for other services)
export const getNotificationChannelId = (): string => {
  return NOTIFICATION_CHANNEL_ID;
};
