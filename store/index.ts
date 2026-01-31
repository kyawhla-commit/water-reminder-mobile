import { AppTheme, FocusSession, SleepRecord, UserInfo, WaterReminder } from '@/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

// Water Reminders Store
interface WaterRemindersState {
  reminders: WaterReminder[];
  dailyIntake: number;
  setReminders: (reminders: WaterReminder[]) => void;
  addIntake: (amount: number) => void;
  resetDailyIntake: () => void;
}

type WaterPersist = (
  config: StateCreator<WaterRemindersState>,
  options: PersistOptions<WaterRemindersState>
) => StateCreator<WaterRemindersState>;

export const useWaterStore = create<WaterRemindersState>(
  (persist as unknown as WaterPersist)(
    (set) => ({
      reminders: [],
      dailyIntake: 0,
      setReminders: (reminders) => set({ reminders }),
      addIntake: (amount) => set((state) => ({ dailyIntake: state.dailyIntake + amount })),
      resetDailyIntake: () => set({ dailyIntake: 0 }),
    }),
    {
      name: 'water-reminders-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

// Sleep Records Store
interface SleepState {
  records: SleepRecord[];
  setRecords: (records: SleepRecord[]) => void;
  addRecord: (record: SleepRecord) => void;
}

type SleepPersist = (
  config: StateCreator<SleepState>,
  options: PersistOptions<SleepState>
) => StateCreator<SleepState>;

export const useSleepStore = create<SleepState>(
  (persist as unknown as SleepPersist)(
    (set) => ({
      records: [],
      setRecords: (records) => set({ records }),
      addRecord: (record) => set((state) => ({ records: [...state.records, record] })),
    }),
    {
      name: 'sleep-records-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

// Focus Sessions Store
interface FocusState {
  sessions: FocusSession[];
  currentSession: FocusSession | null;
  setSessions: (sessions: FocusSession[]) => void;
  startSession: (session: FocusSession) => void;
  endSession: () => void;
}

type FocusPersist = (
  config: StateCreator<FocusState>,
  options: PersistOptions<FocusState>
) => StateCreator<FocusState>;

export const useFocusStore = create<FocusState>(
  (persist as unknown as FocusPersist)(
    (set) => ({
      sessions: [],
      currentSession: null,
      setSessions: (sessions) => set({ sessions }),
      startSession: (session) => set({ currentSession: session }),
      endSession: () => set((state) => ({
        currentSession: null,
        sessions: state.currentSession 
          ? [...state.sessions, { ...state.currentSession, completedAt: new Date().toISOString() }]
          : state.sessions,
      })),
    }),
    {
      name: 'focus-sessions-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

// User Info Store
interface UserInfoState {
  data: UserInfo;
  setUserInfo: (info: UserInfo) => void;
}

type UserInfoPersist = (
  config: StateCreator<UserInfoState>,
  options: PersistOptions<UserInfoState>
) => StateCreator<UserInfoState>;

export const useUserInfoStore = create<UserInfoState>(
  (persist as unknown as UserInfoPersist)(
    (set) => ({
      data: {
        deviceInfo: '',
        deviceLanguage: '',
        pushNotificationToken: '',
      },
      setUserInfo: (data) => set({ data }),
    }),
    {
      name: 'user-info-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

// App Config Store
interface AppConfigPersistentState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  dailyWaterGoal: number;
  setDailyWaterGoal: (goal: number) => void;
  sleepGoal: number;
  setSleepGoal: (goal: number) => void;
}

type AppConfigPersist = (
  config: StateCreator<AppConfigPersistentState>,
  options: PersistOptions<AppConfigPersistentState>
) => StateCreator<AppConfigPersistentState>;

export const useAppConfigStore = create<AppConfigPersistentState>(
  (persist as unknown as AppConfigPersist)(
    (set) => ({
      theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
      setTheme: (theme) => set({ theme }),
      dailyWaterGoal: 2000, // 2L default
      setDailyWaterGoal: (goal) => set({ dailyWaterGoal: goal }),
      sleepGoal: 8, // 8 hours default
      setSleepGoal: (goal) => set({ sleepGoal: goal }),
    }),
    {
      name: 'app-config-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

// Modals Store
interface ModalsState {
  isHelpModalOpen: boolean;
  setHelpModalState: (state: boolean) => void;
}

export const useModalsStore = create<ModalsState>((set) => ({
  isHelpModalOpen: false,
  setHelpModalState: (state) => set({ isHelpModalOpen: state }),
}));
