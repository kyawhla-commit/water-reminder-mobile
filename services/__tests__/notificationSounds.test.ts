import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import {
    getNotificationSound,
    getSoundOption,
    initializeNotificationSounds,
    NOTIFICATION_SOUNDS,
    NotificationSoundId,
    previewNotificationSound,
    sendTestNotificationWithSound,
    setNotificationSound,
    stopSoundPreview,
} from '../notificationSounds';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          stopAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
      }),
    },
  },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  deleteNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationPriority: { HIGH: 'high' },
  AndroidNotificationVisibility: { PUBLIC: 1 },
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

describe('Notification Sounds Service', () => {
  let storedData: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    storedData = {};

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(storedData[key] || null);
    });

    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (key: string, value: string) => {
        storedData[key] = value;
        return Promise.resolve();
      }
    );
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('NOTIFICATION_SOUNDS', () => {
    it('should have all required sound options', () => {
      expect(NOTIFICATION_SOUNDS.length).toBeGreaterThanOrEqual(4);

      const soundIds = NOTIFICATION_SOUNDS.map((s) => s.id);
      expect(soundIds).toContain('default');
      expect(soundIds).toContain('water-bubble');
      expect(soundIds).toContain('liquid-bubble');
      expect(soundIds).toContain('silent');
    });

    it('should have bilingual names for all sounds', () => {
      NOTIFICATION_SOUNDS.forEach((sound) => {
        expect(sound.name).toBeTruthy();
        expect(sound.nameMy).toBeTruthy();
        expect(sound.description).toBeTruthy();
        expect(sound.descriptionMy).toBeTruthy();
        expect(sound.icon).toBeTruthy();
      });
    });
  });

  describe('getNotificationSound', () => {
    it('should return water-bubble as default when no saved preference', async () => {
      const sound = await getNotificationSound();

      expect(sound).toBe('water-bubble');
    });

    it('should return saved sound preference', async () => {
      storedData['@hydromate_notification_sound'] = 'liquid-bubble';

      const sound = await getNotificationSound();

      expect(sound).toBe('liquid-bubble');
    });

    it('should return default if saved value is invalid', async () => {
      storedData['@hydromate_notification_sound'] = 'invalid-sound';

      const sound = await getNotificationSound();

      expect(sound).toBe('water-bubble');
    });
  });

  describe('setNotificationSound', () => {
    it('should save sound preference to AsyncStorage', async () => {
      await setNotificationSound('liquid-bubble');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@hydromate_notification_sound',
        'liquid-bubble'
      );
    });

    it('should update notification channel on Android', async () => {
      await setNotificationSound('water-bubble');

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
    });
  });

  describe('getSoundOption', () => {
    it('should return sound option by ID', () => {
      const option = getSoundOption('water-bubble');

      expect(option).toBeDefined();
      expect(option?.name).toBe('Water Bubble');
      expect(option?.icon).toBe('💧');
    });

    it('should return undefined for invalid ID', () => {
      const option = getSoundOption('invalid' as NotificationSoundId);

      expect(option).toBeUndefined();
    });

    it('should return correct Myanmar name', () => {
      const option = getSoundOption('water-bubble');

      expect(option?.nameMy).toBe('ရေပူဖောင်းသံ');
    });
  });

  describe('previewNotificationSound', () => {
    it('should return true for silent sound without playing', async () => {
      const result = await previewNotificationSound('silent');

      expect(result).toBe(true);
      expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
    });

    it('should return true for default sound without playing', async () => {
      const result = await previewNotificationSound('default');

      expect(result).toBe(true);
      expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
    });

    it('should return true for custom sounds', async () => {
      const result = await previewNotificationSound('water-bubble');

      expect(result).toBe(true);
    });

    it('should return true for liquid-bubble', async () => {
      const result = await previewNotificationSound('liquid-bubble');

      expect(result).toBe(true);
    });
  });

  describe('stopSoundPreview', () => {
    it('should not throw when no sound is playing', async () => {
      await expect(stopSoundPreview()).resolves.not.toThrow();
    });
  });

  describe('sendTestNotificationWithSound', () => {
    it('should send test notification with selected sound', async () => {
      const result = await sendTestNotificationWithSound('water-bubble', 'en');

      expect(result).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.title).toContain('Water Reminder Test');
      expect(call.content.data.type).toBe('sound-test');
      expect(call.content.data.soundId).toBe('water-bubble');
    });

    it('should send test notification in Myanmar', async () => {
      const result = await sendTestNotificationWithSound('liquid-bubble', 'my');

      expect(result).toBe(true);
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.title).toContain('ရေသောက်သတိပေးစမ်းသပ်မှု');
    });

    it('should use saved sound when no soundId provided', async () => {
      storedData['@hydromate_notification_sound'] = 'liquid-bubble';

      const result = await sendTestNotificationWithSound(undefined, 'en');

      expect(result).toBe(true);
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.data.soundId).toBe('liquid-bubble');
    });

    it('should not include sound for silent option', async () => {
      const result = await sendTestNotificationWithSound('silent', 'en');

      expect(result).toBe(true);
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.sound).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Notification error')
      );

      const result = await sendTestNotificationWithSound('water-bubble', 'en');

      expect(result).toBe(false);
    });
  });

  describe('initializeNotificationSounds', () => {
    it('should update notification channel with saved sound', async () => {
      storedData['@hydromate_notification_sound'] = 'water-bubble';

      await initializeNotificationSounds();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'hydromate-reminders',
        expect.objectContaining({
          name: 'Water Reminders',
        })
      );
    });

    it('should use default sound when no saved preference', async () => {
      await initializeNotificationSounds();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
    });
  });

  describe('Sound option properties', () => {
    it('should have correct properties for water-bubble', () => {
      const option = getSoundOption('water-bubble');

      expect(option?.id).toBe('water-bubble');
      expect(option?.androidSound).toBe('water_bubble');
      expect(option?.isPremium).toBe(false);
    });

    it('should have null androidSound for default', () => {
      const option = getSoundOption('default');

      expect(option?.androidSound).toBeNull();
    });

    it('should have null androidSound for silent', () => {
      const option = getSoundOption('silent');

      expect(option?.androidSound).toBeNull();
    });

    it('should have androidSound for custom sounds', () => {
      const customSounds: NotificationSoundId[] = ['water-bubble', 'liquid-bubble'];

      customSounds.forEach((soundId) => {
        const option = getSoundOption(soundId);
        expect(option?.androidSound).toBeTruthy();
      });
    });
  });
});
