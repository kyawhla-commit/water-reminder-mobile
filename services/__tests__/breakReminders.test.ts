import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
    BreakType,
    cancelAllBreakReminders,
    completeBreak,
    getAllBreakTypes,
    getBreakHistory,
    getBreakSettings,
    getBreakTypeInfo,
    getSuggestedBreak,
    getTodayBreakStats,
    initializeBreakReminders,
    saveBreakEntry,
    saveBreakSettings,
    scheduleBreakReminders,
    sendBreakReminder,
} from '../breakReminders';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

describe('Break Reminders Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getBreakSettings', () => {
    it('should return default settings when no data exists', async () => {
      const settings = await getBreakSettings();

      expect(settings.enabled).toBe(true);
      expect(settings.duringFocusOnly).toBe(true);
      expect(settings.waterInterval).toBe(30);
      expect(settings.enabledBreaks).toContain('water');
      expect(settings.enabledBreaks).toContain('stretch');
      expect(settings.enabledBreaks).toContain('eyes');
    });

    it('should merge saved settings with defaults', async () => {
      const savedSettings = { waterInterval: 45, enabled: false };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(savedSettings)
      );

      const settings = await getBreakSettings();

      expect(settings.enabled).toBe(false);
      expect(settings.waterInterval).toBe(45);
      expect(settings.stretchInterval).toBe(45); // default
    });
  });

  describe('saveBreakSettings', () => {
    it('should save settings to AsyncStorage', async () => {
      await saveBreakSettings({ waterInterval: 20, soundEnabled: false });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(savedData.waterInterval).toBe(20);
      expect(savedData.soundEnabled).toBe(false);
    });
  });

  describe('getBreakHistory', () => {
    it('should return empty array when no history exists', async () => {
      const history = await getBreakHistory();
      expect(history).toEqual([]);
    });

    it('should return saved history', async () => {
      const savedHistory = [
        {
          id: '1',
          type: 'water',
          timestamp: '2024-01-01T10:00:00Z',
          completed: true,
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(savedHistory)
      );

      const history = await getBreakHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('water');
    });
  });

  describe('saveBreakEntry', () => {
    it('should save a new break entry with generated id', async () => {
      const entry = await saveBreakEntry({
        type: 'water' as BreakType,
        timestamp: new Date().toISOString(),
        duringFocus: true,
        completed: false,
      });

      expect(entry.id).toBeTruthy();
      expect(entry.type).toBe('water');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should prepend new entry to history', async () => {
      const existingHistory = [
        { id: '1', type: 'stretch', timestamp: '2024-01-01', completed: true },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingHistory)
      );

      await saveBreakEntry({
        type: 'water' as BreakType,
        timestamp: new Date().toISOString(),
        duringFocus: false,
        completed: false,
      });

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(savedData[0].type).toBe('water'); // New entry first
      expect(savedData[1].type).toBe('stretch');
    });
  });

  describe('sendBreakReminder', () => {
    it('should send notification when enabled', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'break_reminder_settings') {
          return Promise.resolve(
            JSON.stringify({ enabled: true, soundEnabled: true })
          );
        }
        return Promise.resolve(null);
      });

      const id = await sendBreakReminder('water', 'en', true);

      expect(id).toBe('notification-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should not send notification when disabled', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ enabled: false })
      );

      const id = await sendBreakReminder('water', 'en', false);

      expect(id).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should use Myanmar content when language is my', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'break_reminder_settings') {
          return Promise.resolve(JSON.stringify({ enabled: true }));
        }
        return Promise.resolve(null);
      });

      await sendBreakReminder('water', 'my', false);

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock
        .calls[0][0];
      // Myanmar title should contain Myanmar characters
      expect(call.content.title).toContain('ရေ');
    });
  });

  describe('scheduleBreakReminders', () => {
    it('should schedule reminders for enabled break types', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({
          enabled: true,
          enabledBreaks: ['water'],
          waterInterval: 15,
        })
      );

      const ids = await scheduleBreakReminders(60, 'en'); // 60 minute session

      // Should schedule at 15, 30, 45 minutes
      expect(ids.length).toBeGreaterThan(0);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should not schedule when disabled', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ enabled: false })
      );

      const ids = await scheduleBreakReminders(60, 'en');

      expect(ids).toEqual([]);
    });
  });

  describe('cancelAllBreakReminders', () => {
    it('should cancel all break reminder notifications', async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([
        { identifier: 'break-1', content: { data: { type: 'break_reminder' } } },
        { identifier: 'break-2', content: { data: { type: 'break_reminder' } } },
        { identifier: 'other-1', content: { data: { type: 'water_reminder' } } },
      ]);

      await cancelAllBreakReminders();

      expect(
        Notifications.cancelScheduledNotificationAsync
      ).toHaveBeenCalledTimes(2);
      expect(
        Notifications.cancelScheduledNotificationAsync
      ).toHaveBeenCalledWith('break-1');
      expect(
        Notifications.cancelScheduledNotificationAsync
      ).toHaveBeenCalledWith('break-2');
    });
  });

  describe('completeBreak', () => {
    it('should mark break as completed', async () => {
      const history = [
        { id: '123', type: 'water', timestamp: '2024-01-01', completed: false },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(history)
      );

      await completeBreak('123');

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(savedData[0].completed).toBe(true);
    });

    it('should add water logged amount', async () => {
      const history = [
        { id: '123', type: 'water', timestamp: '2024-01-01', completed: false },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(history)
      );

      await completeBreak('123', 200);

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(savedData[0].waterLogged).toBe(200);
    });
  });

  describe('getTodayBreakStats', () => {
    it('should return zero stats when no history', async () => {
      const stats = await getTodayBreakStats();

      expect(stats.totalBreaks).toBe(0);
      expect(stats.completedBreaks).toBe(0);
      expect(stats.totalWaterLogged).toBe(0);
    });

    it('should calculate today stats correctly', async () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();

      const history = [
        {
          id: '1',
          type: 'water',
          timestamp: today,
          completed: true,
          waterLogged: 150,
        },
        { id: '2', type: 'stretch', timestamp: today, completed: true },
        { id: '3', type: 'eyes', timestamp: today, completed: false },
        {
          id: '4',
          type: 'water',
          timestamp: yesterday,
          completed: true,
          waterLogged: 200,
        }, // Not today
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(history)
      );

      const stats = await getTodayBreakStats();

      expect(stats.totalBreaks).toBe(3);
      expect(stats.completedBreaks).toBe(2);
      expect(stats.waterBreaks).toBe(1);
      expect(stats.stretchBreaks).toBe(1);
      expect(stats.eyeBreaks).toBe(1);
      expect(stats.totalWaterLogged).toBe(150);
    });
  });

  describe('getBreakTypeInfo', () => {
    it('should return English info by default', () => {
      const info = getBreakTypeInfo('water', 'en');

      expect(info.name).toBe('Water Break');
      expect(info.emoji).toBe('💧');
      expect(info.description).toContain('hydrated');
    });

    it('should return Myanmar info when specified', () => {
      const info = getBreakTypeInfo('water', 'my');

      expect(info.name).toContain('ရေ');
      expect(info.emoji).toBe('💧');
    });

    it('should return correct info for all break types', () => {
      const types: BreakType[] = [
        'water',
        'stretch',
        'eyes',
        'walk',
        'breathe',
        'snack',
      ];

      types.forEach((type) => {
        const info = getBreakTypeInfo(type, 'en');
        expect(info.name).toBeTruthy();
        expect(info.emoji).toBeTruthy();
        expect(info.description).toBeTruthy();
      });
    });
  });

  describe('getAllBreakTypes', () => {
    it('should return all 6 break types', () => {
      const types = getAllBreakTypes('en');

      expect(types).toHaveLength(6);
      expect(types.map((t) => t.type)).toContain('water');
      expect(types.map((t) => t.type)).toContain('stretch');
      expect(types.map((t) => t.type)).toContain('eyes');
      expect(types.map((t) => t.type)).toContain('walk');
      expect(types.map((t) => t.type)).toContain('breathe');
      expect(types.map((t) => t.type)).toContain('snack');
    });
  });

  describe('getSuggestedBreak', () => {
    it('should suggest water break after 20+ minutes', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'break_reminder_settings') {
          return Promise.resolve(
            JSON.stringify({ enabledBreaks: ['water', 'eyes', 'stretch'] })
          );
        }
        return Promise.resolve('[]'); // Empty history
      });

      const suggestion = await getSuggestedBreak(25, 'en');

      expect(suggestion).not.toBeNull();
      expect(suggestion?.type).toBe('water');
    });

    it('should suggest eye rest after 20 minutes', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'break_reminder_settings') {
          return Promise.resolve(
            JSON.stringify({ enabledBreaks: ['eyes', 'stretch'] })
          );
        }
        // Recent water break
        const recentHistory = [
          { type: 'water', timestamp: new Date().toISOString() },
        ];
        return Promise.resolve(JSON.stringify(recentHistory));
      });

      const suggestion = await getSuggestedBreak(22, 'en');

      expect(suggestion?.type).toBe('eyes');
    });
  });

  describe('initializeBreakReminders', () => {
    it('should setup notification channel on Android', async () => {
      await initializeBreakReminders();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'hydromate-breaks',
        expect.objectContaining({
          name: 'Break Reminders',
          importance: Notifications.AndroidImportance.HIGH,
        })
      );
    });
  });
});
