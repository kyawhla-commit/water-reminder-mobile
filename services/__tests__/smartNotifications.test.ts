import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
    cancelAllNotifications,
    clearMessageCache,
    defaultNotificationSettings,
    getNotificationSettings,
    getQuietHoursInfo,
    getScheduledNotificationsSummary,
    isQuietHours,
    NotificationSettings,
    previewScheduledTimes,
    requestNotificationPermissions,
    saveNotificationSettings,
    sendContextualReminder,
    sendGoalAchievedNotification,
    sendImmediateNotification,
    sendPersonalizedReminder,
    sendStreakNotification,
    sendTestNotification,
    sendTestPersonalizedNotification,
    setupNotificationChannel,
    syncQuietHoursWithSleepSchedule,
} from '../smartNotifications';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  deleteNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationPriority: { HIGH: 'high' },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  SchedulableTriggerInputTypes: { DAILY: 'daily', TIME_INTERVAL: 'timeInterval' },
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
  },
}));

// Mock waterHistory
jest.mock('../waterHistory', () => ({
  getLastNDays: jest.fn().mockResolvedValue([]),
}));

describe('Smart Notifications Service', () => {
  let storedData: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    storedData = {};
    clearMessageCache();

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

  describe('getNotificationSettings', () => {
    it('should return default settings when no data exists', async () => {
      const settings = await getNotificationSettings();

      expect(settings.enabled).toBe(true);
      expect(settings.quietHoursEnabled).toBe(true);
      expect(settings.quietHoursStart).toBe('22:00');
      expect(settings.quietHoursEnd).toBe('07:00');
      expect(settings.reminderInterval).toBe(60);
      expect(settings.motivationalMessages).toBe(true);
    });

    it('should merge saved settings with defaults', async () => {
      storedData['notification_settings'] = JSON.stringify({
        enabled: false,
        reminderInterval: 30,
      });

      const settings = await getNotificationSettings();

      expect(settings.enabled).toBe(false);
      expect(settings.reminderInterval).toBe(30);
      expect(settings.quietHoursEnabled).toBe(true); // default
    });
  });

  describe('saveNotificationSettings', () => {
    it('should save settings to AsyncStorage', async () => {
      await saveNotificationSettings({ enabled: false, reminderInterval: 90 });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(storedData['notification_settings']);
      expect(savedData.enabled).toBe(false);
      expect(savedData.reminderInterval).toBe(90);
    });

    it('should reschedule reminders after saving', async () => {
      await saveNotificationSettings({ enabled: true });

      expect(
        Notifications.cancelAllScheduledNotificationsAsync
      ).toHaveBeenCalled();
    });
  });

  describe('isQuietHours', () => {
    it('should return false when quiet hours disabled', () => {
      const settings: NotificationSettings = {
        ...defaultNotificationSettings,
        quietHoursEnabled: false,
      };

      expect(isQuietHours(settings)).toBe(false);
    });

    it('should detect quiet hours correctly for overnight period', () => {
      const settings: NotificationSettings = {
        ...defaultNotificationSettings,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      // Mock current time to 23:00 (should be quiet)
      const originalDate = Date;
      const mockDate = new Date('2024-01-01T23:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      expect(isQuietHours(settings)).toBe(true);

      global.Date = originalDate;
    });

    it('should detect non-quiet hours correctly', () => {
      const settings: NotificationSettings = {
        ...defaultNotificationSettings,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };

      // Mock current time to 12:00 (should not be quiet)
      const originalDate = Date;
      const mockDate = new Date('2024-01-01T12:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      expect(isQuietHours(settings)).toBe(false);

      global.Date = originalDate;
    });
  });

  describe('syncQuietHoursWithSleepSchedule', () => {
    it('should update quiet hours based on sleep schedule', async () => {
      await syncQuietHoursWithSleepSchedule('23:00', '06:30');

      const savedData = JSON.parse(storedData['notification_settings']);
      expect(savedData.quietHoursStart).toBe('23:00');
      expect(savedData.quietHoursEnd).toBe('06:30');
    });
  });

  describe('getQuietHoursInfo', () => {
    it('should return quiet hours information', async () => {
      storedData['notification_settings'] = JSON.stringify({
        quietHoursEnabled: true,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
      });

      const info = await getQuietHoursInfo();

      expect(info.enabled).toBe(true);
      expect(info.start).toBe('21:00');
      expect(info.end).toBe('08:00');
    });
  });

  describe('setupNotificationChannel', () => {
    it('should create notification channel on Android', async () => {
      await setupNotificationChannel();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'hydromate-reminders',
        expect.objectContaining({
          name: 'Water Reminders',
          importance: Notifications.AndroidImportance.HIGH,
        })
      );
    });
  });

  describe('sendImmediateNotification', () => {
    it('should send notification when enabled and not quiet hours', async () => {
      storedData['notification_settings'] = JSON.stringify({
        enabled: true,
        quietHoursEnabled: false,
        soundEnabled: true,
        vibrationEnabled: true,
      });

      const id = await sendImmediateNotification('Test Title', 'Test Body');

      expect(id).toBe('notification-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Test Title',
            body: 'Test Body',
          }),
          trigger: null,
        })
      );
    });

    it('should not send notification when disabled', async () => {
      storedData['notification_settings'] = JSON.stringify({
        enabled: false,
      });

      const id = await sendImmediateNotification('Test', 'Test');

      expect(id).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('sendContextualReminder', () => {
    beforeEach(() => {
      storedData['notification_settings'] = JSON.stringify({
        enabled: true,
        quietHoursEnabled: false,
      });
    });

    it('should send achievement message when goal reached', async () => {
      await sendContextualReminder(2000, 2000, 'en');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.data.type).toBe('contextual');
    });

    it('should send progress message when at 75%', async () => {
      await sendContextualReminder(1500, 2000, 'en');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should send halfway message when at 50%', async () => {
      await sendContextualReminder(1000, 2000, 'en');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('sendPersonalizedReminder', () => {
    it('should send personalized notification with username', async () => {
      storedData['notification_settings'] = JSON.stringify({
        enabled: true,
        quietHoursEnabled: false,
      });

      await sendPersonalizedReminder('John', 'en');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.data.type).toBe('personalized');
      expect(call.content.data.userName).toBe('John');
    });

    it('should use Myanmar content when language is my', async () => {
      storedData['notification_settings'] = JSON.stringify({
        enabled: true,
        quietHoursEnabled: false,
      });

      await sendPersonalizedReminder('မောင်', 'my');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('sendGoalAchievedNotification', () => {
    it('should send achievement notification', async () => {
      storedData['notification_settings'] = JSON.stringify({
        enabled: true,
        quietHoursEnabled: false,
      });

      await sendGoalAchievedNotification('en');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.data.type).toBe('achievement');
    });
  });

  describe('sendStreakNotification', () => {
    it('should send streak notification with days count', async () => {
      storedData['notification_settings'] = JSON.stringify({
        enabled: true,
        quietHoursEnabled: false,
      });

      await sendStreakNotification(7, 'en');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.data.type).toBe('streak');
      expect(call.content.data.streakDays).toBe(7);
    });

    it('should include days in Myanmar message', async () => {
      storedData['notification_settings'] = JSON.stringify({
        enabled: true,
        quietHoursEnabled: false,
      });

      await sendStreakNotification(5, 'my');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('requestNotificationPermissions', () => {
    it('should return true when permission granted', async () => {
      const result = await requestNotificationPermissions();

      expect(result).toBe(true);
    });

    it('should request permission if not already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'undetermined',
      });

      await requestNotificationPermissions();

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all scheduled notifications', async () => {
      await cancelAllNotifications();

      expect(
        Notifications.cancelAllScheduledNotificationsAsync
      ).toHaveBeenCalled();
    });
  });

  describe('getScheduledNotificationsSummary', () => {
    it('should return summary of scheduled notifications', async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([
        { trigger: { hour: 8, minute: 0 } },
        { trigger: { hour: 12, minute: 30 } },
        { trigger: { hour: 18, minute: 0 } },
      ]);

      const summary = await getScheduledNotificationsSummary();

      expect(summary.count).toBe(3);
      expect(summary.times).toContain('08:00');
      expect(summary.times).toContain('12:30');
      expect(summary.times).toContain('18:00');
    });

    it('should return empty summary when no notifications', async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      const summary = await getScheduledNotificationsSummary();

      expect(summary.count).toBe(0);
      expect(summary.times).toEqual([]);
      expect(summary.nextNotification).toBeNull();
    });
  });

  describe('sendTestNotification', () => {
    it('should send test notification in English', async () => {
      const result = await sendTestNotification('en');

      expect(result).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.title).toContain('Test');
    });

    it('should send test notification in Myanmar', async () => {
      const result = await sendTestNotification('my');

      expect(result).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.title).toContain('စမ်းသပ်');
    });
  });

  describe('sendTestPersonalizedNotification', () => {
    it('should send personalized test notification', async () => {
      const result = await sendTestPersonalizedNotification('Alice', 'en');

      expect(result).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      expect(call.content.data.type).toBe('test-personalized');
      expect(call.content.data.userName).toBe('Alice');
    });
  });

  describe('previewScheduledTimes', () => {
    it('should generate correct times based on interval', () => {
      const settings: NotificationSettings = {
        ...defaultNotificationSettings,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        reminderInterval: 60,
      };

      const times = previewScheduledTimes(settings);

      expect(times).toContain('07:00');
      expect(times).toContain('08:00');
      expect(times).toContain('12:00');
      expect(times.length).toBeGreaterThan(10);
    });

    it('should generate more times with shorter interval', () => {
      const settings60: NotificationSettings = {
        ...defaultNotificationSettings,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        reminderInterval: 60,
      };

      const settings30: NotificationSettings = {
        ...defaultNotificationSettings,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        reminderInterval: 30,
      };

      const times60 = previewScheduledTimes(settings60);
      const times30 = previewScheduledTimes(settings30);

      expect(times30.length).toBeGreaterThan(times60.length);
    });
  });

  describe('clearMessageCache', () => {
    it('should clear the message cache without error', () => {
      expect(() => clearMessageCache()).not.toThrow();
    });
  });
});
