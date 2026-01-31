import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    completeFocusSession,
    formatFocusTime,
    getFocusProgress,
    getFocusWidgetDisplayData,
    getFocusWidgetState,
    pauseFocusFromWidget,
    resetDailyFocusStats,
    resumeFocusFromWidget,
    saveFocusWidgetState,
    startFocusFromWidget,
    stopFocusFromWidget,
    syncFocusWidgetWithApp,
    updateFocusRemainingTime,
} from '../focusWidget';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock react-native
jest.mock('react-native', () => ({
  NativeModules: {
    HydroMateWidget: null,
  },
  Platform: { OS: 'android' },
}));

describe('Focus Widget Service', () => {
  let storedData: string | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    storedData = null;

    // Mock getItem to return stored data
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() => {
      return Promise.resolve(storedData);
    });

    // Mock setItem to store data
    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (_key: string, value: string) => {
        storedData = value;
        return Promise.resolve();
      }
    );
  });

  describe('getFocusWidgetState', () => {
    it('should return default state when no data exists', async () => {
      const state = await getFocusWidgetState();

      expect(state.isActive).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.sessionType).toBe('focus');
      expect(state.totalDuration).toBe(25 * 60);
      expect(state.remainingTime).toBe(25 * 60);
      expect(state.sessionsCompleted).toBe(0);
      expect(state.dailyGoal).toBe(120);
    });

    it('should merge saved state with defaults', async () => {
      storedData = JSON.stringify({
        isActive: true,
        remainingTime: 600,
        sessionsCompleted: 3,
      });

      const state = await getFocusWidgetState();

      expect(state.isActive).toBe(true);
      expect(state.remainingTime).toBe(600);
      expect(state.sessionsCompleted).toBe(3);
      expect(state.totalDuration).toBe(25 * 60); // default
    });
  });

  describe('saveFocusWidgetState', () => {
    it('should save state to AsyncStorage', async () => {
      await saveFocusWidgetState({ isActive: true, remainingTime: 1200 });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(storedData!);
      expect(savedData.isActive).toBe(true);
      expect(savedData.remainingTime).toBe(1200);
      expect(savedData.lastUpdated).toBeTruthy();
    });
  });

  describe('startFocusFromWidget', () => {
    it('should start a focus session with default duration', async () => {
      const state = await startFocusFromWidget();

      expect(state.isActive).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.totalDuration).toBe(25 * 60);
      expect(state.remainingTime).toBe(25 * 60);
      expect(state.startedAt).toBeTruthy();
    });

    it('should start a session with custom duration and type', async () => {
      const state = await startFocusFromWidget(50 * 60, 'deepWork');

      expect(state.totalDuration).toBe(50 * 60);
      expect(state.sessionType).toBe('deepWork');
    });
  });

  describe('pauseFocusFromWidget', () => {
    it('should pause an active session', async () => {
      storedData = JSON.stringify({ isActive: true, isPaused: false });

      const state = await pauseFocusFromWidget();

      expect(state.isPaused).toBe(true);
      expect(state.pausedAt).toBeTruthy();
    });

    it('should not pause if session is not active', async () => {
      storedData = JSON.stringify({ isActive: false });

      const state = await pauseFocusFromWidget();

      expect(state.isActive).toBe(false);
    });
  });

  describe('resumeFocusFromWidget', () => {
    it('should resume a paused session', async () => {
      storedData = JSON.stringify({
        isActive: true,
        isPaused: true,
        pausedAt: new Date().toISOString(),
      });

      const state = await resumeFocusFromWidget();

      expect(state.isPaused).toBe(false);
      expect(state.pausedAt).toBeNull();
    });

    it('should not resume if session is not paused', async () => {
      storedData = JSON.stringify({ isActive: true, isPaused: false });

      const state = await resumeFocusFromWidget();

      expect(state.isPaused).toBe(false);
    });
  });

  describe('stopFocusFromWidget', () => {
    it('should stop session and add elapsed time to today minutes', async () => {
      storedData = JSON.stringify({
        isActive: true,
        totalDuration: 25 * 60,
        remainingTime: 10 * 60, // 15 minutes elapsed
        todayMinutes: 30,
      });

      const state = await stopFocusFromWidget();

      expect(state.isActive).toBe(false);
      expect(state.todayMinutes).toBe(45); // 30 + 15
    });
  });

  describe('completeFocusSession', () => {
    it('should complete session and increment counters', async () => {
      storedData = JSON.stringify({
        isActive: true,
        totalDuration: 25 * 60,
        sessionsCompleted: 2,
        todayMinutes: 50,
      });

      const state = await completeFocusSession();

      expect(state.isActive).toBe(false);
      expect(state.sessionsCompleted).toBe(3);
      expect(state.todayMinutes).toBe(75); // 50 + 25
    });
  });

  describe('updateFocusRemainingTime', () => {
    it('should update remaining time', async () => {
      await updateFocusRemainingTime(900);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(storedData!);
      expect(savedData.remainingTime).toBe(900);
    });
  });

  describe('syncFocusWidgetWithApp', () => {
    it('should sync all provided values', async () => {
      await syncFocusWidgetWithApp(true, 600, 1500, 45, 2);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(storedData!);
      expect(savedData.isActive).toBe(true);
      expect(savedData.remainingTime).toBe(600);
      expect(savedData.totalDuration).toBe(1500);
      expect(savedData.todayMinutes).toBe(45);
      expect(savedData.sessionsCompleted).toBe(2);
    });
  });

  describe('resetDailyFocusStats', () => {
    it('should reset daily stats to zero', async () => {
      storedData = JSON.stringify({
        todayMinutes: 120,
        sessionsCompleted: 5,
      });

      await resetDailyFocusStats();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(storedData!);
      expect(savedData.todayMinutes).toBe(0);
      expect(savedData.sessionsCompleted).toBe(0);
    });
  });

  describe('getFocusProgress', () => {
    it('should calculate progress percentage correctly', () => {
      const state = {
        totalDuration: 1500,
        remainingTime: 750,
      } as any;

      const progress = getFocusProgress(state);

      expect(progress).toBe(50);
    });

    it('should return 0 when total duration is 0', () => {
      const state = {
        totalDuration: 0,
        remainingTime: 0,
      } as any;

      const progress = getFocusProgress(state);

      expect(progress).toBe(0);
    });

    it('should return 100 when remaining time is 0', () => {
      const state = {
        totalDuration: 1500,
        remainingTime: 0,
      } as any;

      const progress = getFocusProgress(state);

      expect(progress).toBe(100);
    });
  });

  describe('formatFocusTime', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatFocusTime(0)).toBe('00:00');
      expect(formatFocusTime(59)).toBe('00:59');
      expect(formatFocusTime(60)).toBe('01:00');
      expect(formatFocusTime(125)).toBe('02:05');
      expect(formatFocusTime(1500)).toBe('25:00');
      expect(formatFocusTime(3661)).toBe('61:01');
    });
  });

  describe('getFocusWidgetDisplayData', () => {
    it('should return ready state when not active', async () => {
      storedData = JSON.stringify({
        isActive: false,
        remainingTime: 1500,
        totalDuration: 1500,
      });

      const data = await getFocusWidgetDisplayData();

      expect(data.statusText).toBe('Ready');
      expect(data.statusEmoji).toBe('▶️');
      expect(data.canStart).toBe(true);
      expect(data.canPause).toBe(false);
      expect(data.canResume).toBe(false);
      expect(data.canStop).toBe(false);
    });

    it('should return focusing state when active', async () => {
      storedData = JSON.stringify({
        isActive: true,
        isPaused: false,
        remainingTime: 1200,
        totalDuration: 1500,
      });

      const data = await getFocusWidgetDisplayData();

      expect(data.statusText).toBe('Focusing');
      expect(data.statusEmoji).toBe('🎯');
      expect(data.canStart).toBe(false);
      expect(data.canPause).toBe(true);
      expect(data.canResume).toBe(false);
      expect(data.canStop).toBe(true);
      expect(data.progress).toBe(20);
    });

    it('should return paused state when paused', async () => {
      storedData = JSON.stringify({
        isActive: true,
        isPaused: true,
        remainingTime: 900,
        totalDuration: 1500,
      });

      const data = await getFocusWidgetDisplayData();

      expect(data.statusText).toBe('Paused');
      expect(data.statusEmoji).toBe('⏸️');
      expect(data.canStart).toBe(false);
      expect(data.canPause).toBe(false);
      expect(data.canResume).toBe(true);
      expect(data.canStop).toBe(true);
    });

    it('should format time display correctly', async () => {
      storedData = JSON.stringify({
        isActive: false,
        remainingTime: 1500,
        totalDuration: 1500,
      });

      const data = await getFocusWidgetDisplayData();

      expect(data.timeDisplay).toBe('25:00');
    });
  });
});
