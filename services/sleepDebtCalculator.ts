import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSleepRecords } from './sleep';

const SLEEP_DEBT_KEY = '@hydromate_sleep_debt';
const SMART_ALARM_KEY = '@hydromate_smart_alarm';

export interface SleepDebtData {
  currentDebt: number; // in minutes (negative = surplus)
  weeklyDebt: number;
  monthlyDebt: number;
  dailyGoal: number; // in minutes
  recoveryPlan: RecoveryDay[];
  debtHistory: DebtHistoryEntry[];
  lastUpdated: string;
}

export interface DebtHistoryEntry {
  date: string;
  expected: number;
  actual: number;
  debt: number;
  cumulativeDebt: number;
}

export interface RecoveryDay {
  date: string;
  dayName: string;
  recommendedSleep: number; // in minutes
  extraSleep: number; // extra minutes needed
  isWeekend: boolean;
}

export interface SmartAlarmSettings {
  enabled: boolean;
  targetWakeTime: string; // HH:MM format
  windowMinutes: number; // Wake window (e.g., 30 min before target)
  daysEnabled: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  gradualVolume: boolean;
  snoozeMinutes: number;
  smartWakeEnabled: boolean; // Try to wake during light sleep
}

export interface SleepCycle {
  cycleNumber: number;
  startTime: Date;
  endTime: Date;
  phase: 'light' | 'deep' | 'rem';
  duration: number; // minutes
}

export interface SmartWakeTime {
  time: Date;
  phase: 'light' | 'deep' | 'rem';
  quality: 'optimal' | 'good' | 'fair';
  minutesBeforeTarget: number;
}

// Default sleep goal: 8 hours = 480 minutes
const DEFAULT_SLEEP_GOAL = 480;

// Sleep cycle duration (approximately 90 minutes)
const SLEEP_CYCLE_DURATION = 90;

const getDefaultDebtData = (): SleepDebtData => ({
  currentDebt: 0,
  weeklyDebt: 0,
  monthlyDebt: 0,
  dailyGoal: DEFAULT_SLEEP_GOAL,
  recoveryPlan: [],
  debtHistory: [],
  lastUpdated: new Date().toISOString(),
});

const getDefaultAlarmSettings = (): SmartAlarmSettings => ({
  enabled: false,
  targetWakeTime: '07:00',
  windowMinutes: 30,
  daysEnabled: [false, true, true, true, true, true, false], // Mon-Fri
  soundEnabled: true,
  vibrationEnabled: true,
  gradualVolume: true,
  snoozeMinutes: 9,
  smartWakeEnabled: true,
});

export const loadSleepDebtData = async (): Promise<SleepDebtData> => {
  try {
    const data = await AsyncStorage.getItem(SLEEP_DEBT_KEY);
    return data ? { ...getDefaultDebtData(), ...JSON.parse(data) } : getDefaultDebtData();
  } catch {
    return getDefaultDebtData();
  }
};

export const saveSleepDebtData = async (data: SleepDebtData): Promise<void> => {
  await AsyncStorage.setItem(SLEEP_DEBT_KEY, JSON.stringify(data));
};

export const loadSmartAlarmSettings = async (): Promise<SmartAlarmSettings> => {
  try {
    const data = await AsyncStorage.getItem(SMART_ALARM_KEY);
    return data ? { ...getDefaultAlarmSettings(), ...JSON.parse(data) } : getDefaultAlarmSettings();
  } catch {
    return getDefaultAlarmSettings();
  }
};

export const saveSmartAlarmSettings = async (settings: SmartAlarmSettings): Promise<void> => {
  await AsyncStorage.setItem(SMART_ALARM_KEY, JSON.stringify(settings));
};

// Calculate sleep debt from records
export const calculateSleepDebt = async (dailyGoal: number = DEFAULT_SLEEP_GOAL): Promise<SleepDebtData> => {
  const records = await getSleepRecords();
  
  // Get records from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentRecords = records.filter(
    r => new Date(r.createdAt) >= thirtyDaysAgo
  );
  
  // Group records by date
  const recordsByDate: { [date: string]: number } = {};
  recentRecords.forEach(record => {
    const date = record.createdAt.split('T')[0];
    recordsByDate[date] = (recordsByDate[date] || 0) + record.duration;
  });
  
  // Calculate debt history
  const debtHistory: DebtHistoryEntry[] = [];
  let cumulativeDebt = 0;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const actual = recordsByDate[dateStr] || 0;
    const debt = dailyGoal - actual;
    cumulativeDebt += debt;
    
    if (actual > 0 || i < 7) { // Only include days with data or last week
      debtHistory.push({
        date: dateStr,
        expected: dailyGoal,
        actual,
        debt,
        cumulativeDebt,
      });
    }
  }
  
  // Calculate weekly debt (last 7 days)
  const weeklyRecords = debtHistory.slice(-7);
  const weeklyDebt = weeklyRecords.reduce((sum, d) => sum + d.debt, 0);
  
  // Calculate monthly debt
  const monthlyDebt = debtHistory.reduce((sum, d) => sum + d.debt, 0);
  
  // Generate recovery plan
  const recoveryPlan = generateRecoveryPlan(cumulativeDebt, dailyGoal);
  
  const data: SleepDebtData = {
    currentDebt: cumulativeDebt,
    weeklyDebt,
    monthlyDebt,
    dailyGoal,
    recoveryPlan,
    debtHistory,
    lastUpdated: new Date().toISOString(),
  };
  
  await saveSleepDebtData(data);
  return data;
};

// Generate a recovery plan to pay off sleep debt
const generateRecoveryPlan = (debt: number, dailyGoal: number): RecoveryDay[] => {
  const plan: RecoveryDay[] = [];
  let remainingDebt = Math.max(0, debt);
  
  // Plan for next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // On weekends, recommend more recovery sleep
    // Max extra sleep per day: 60 minutes (to avoid oversleeping)
    let extraSleep = 0;
    if (remainingDebt > 0) {
      extraSleep = isWeekend ? Math.min(60, remainingDebt) : Math.min(30, remainingDebt);
      remainingDebt -= extraSleep;
    }
    
    plan.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      recommendedSleep: dailyGoal + extraSleep,
      extraSleep,
      isWeekend,
    });
  }
  
  return plan;
};

// Calculate optimal wake times based on sleep cycles
export const calculateSleepCycles = (bedtime: Date, targetWakeTime: Date): SleepCycle[] => {
  const cycles: SleepCycle[] = [];
  let currentTime = new Date(bedtime);
  
  // Add 15 minutes to fall asleep
  currentTime.setMinutes(currentTime.getMinutes() + 15);
  
  let cycleNumber = 1;
  while (currentTime < targetWakeTime && cycleNumber <= 6) {
    const cycleStart = new Date(currentTime);
    
    // Each cycle: ~25 min light, ~25 min deep, ~40 min REM (simplified)
    // Light sleep phase
    cycles.push({
      cycleNumber,
      startTime: new Date(currentTime),
      endTime: new Date(currentTime.setMinutes(currentTime.getMinutes() + 25)),
      phase: 'light',
      duration: 25,
    });
    
    // Deep sleep phase
    cycles.push({
      cycleNumber,
      startTime: new Date(currentTime),
      endTime: new Date(currentTime.setMinutes(currentTime.getMinutes() + 25)),
      phase: 'deep',
      duration: 25,
    });
    
    // REM phase
    cycles.push({
      cycleNumber,
      startTime: new Date(currentTime),
      endTime: new Date(currentTime.setMinutes(currentTime.getMinutes() + 40)),
      phase: 'rem',
      duration: 40,
    });
    
    cycleNumber++;
  }
  
  return cycles;
};

// Find optimal wake times within the smart alarm window
export const findSmartWakeTimes = (
  bedtime: Date,
  targetWakeTime: Date,
  windowMinutes: number
): SmartWakeTime[] => {
  const cycles = calculateSleepCycles(bedtime, targetWakeTime);
  const wakeTimes: SmartWakeTime[] = [];
  
  const windowStart = new Date(targetWakeTime);
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
  
  // Find light sleep phases within the window
  cycles.forEach(cycle => {
    if (cycle.phase === 'light' && cycle.endTime >= windowStart && cycle.endTime <= targetWakeTime) {
      const minutesBefore = Math.round((targetWakeTime.getTime() - cycle.endTime.getTime()) / 60000);
      wakeTimes.push({
        time: cycle.endTime,
        phase: 'light',
        quality: 'optimal',
        minutesBeforeTarget: minutesBefore,
      });
    }
  });
  
  // If no light sleep found, find end of REM phases
  if (wakeTimes.length === 0) {
    cycles.forEach(cycle => {
      if (cycle.phase === 'rem' && cycle.endTime >= windowStart && cycle.endTime <= targetWakeTime) {
        const minutesBefore = Math.round((targetWakeTime.getTime() - cycle.endTime.getTime()) / 60000);
        wakeTimes.push({
          time: cycle.endTime,
          phase: 'rem',
          quality: 'good',
          minutesBeforeTarget: minutesBefore,
        });
      }
    });
  }
  
  // If still nothing, use target time
  if (wakeTimes.length === 0) {
    wakeTimes.push({
      time: targetWakeTime,
      phase: 'light',
      quality: 'fair',
      minutesBeforeTarget: 0,
    });
  }
  
  return wakeTimes.sort((a, b) => a.time.getTime() - b.time.getTime());
};

// Calculate recommended bedtime for a target wake time
export const calculateRecommendedBedtime = (
  targetWakeTime: string,
  sleepGoal: number = DEFAULT_SLEEP_GOAL
): { bedtime: Date; cycles: number }[] => {
  const [hours, minutes] = targetWakeTime.split(':').map(Number);
  const wakeTime = new Date();
  wakeTime.setHours(hours, minutes, 0, 0);
  
  // If wake time is in the past, set it for tomorrow
  if (wakeTime <= new Date()) {
    wakeTime.setDate(wakeTime.getDate() + 1);
  }
  
  const recommendations: { bedtime: Date; cycles: number }[] = [];
  
  // Calculate bedtimes for 4, 5, and 6 sleep cycles
  [4, 5, 6].forEach(cycles => {
    const sleepDuration = cycles * SLEEP_CYCLE_DURATION;
    const bedtime = new Date(wakeTime);
    bedtime.setMinutes(bedtime.getMinutes() - sleepDuration - 15); // 15 min to fall asleep
    
    recommendations.push({ bedtime, cycles });
  });
  
  return recommendations;
};

// Get sleep debt status message
export const getDebtStatusMessage = (debt: number, isBurmese: boolean): { message: string; type: 'good' | 'warning' | 'danger' } => {
  if (debt <= 0) {
    return {
      message: isBurmese ? 'အိပ်စက်မှုပြည့်ဝပါသည်! 🎉' : 'Sleep surplus! You\'re well-rested! 🎉',
      type: 'good',
    };
  } else if (debt <= 120) { // 2 hours
    return {
      message: isBurmese ? 'အနည်းငယ်အိပ်ရေးပျက်နေသည်' : 'Slight sleep debt - easily recoverable',
      type: 'good',
    };
  } else if (debt <= 300) { // 5 hours
    return {
      message: isBurmese ? 'အိပ်ရေးပျက်နေသည် - ပြန်လည်ကောင်းမွန်ရန်လိုသည်' : 'Moderate sleep debt - needs recovery',
      type: 'warning',
    };
  } else {
    return {
      message: isBurmese ? 'အိပ်ရေးအလွန်ပျက်နေသည် - ဦးစားပေးပြန်လည်ကောင်းမွန်ပါ' : 'Significant sleep debt - prioritize recovery',
      type: 'danger',
    };
  }
};

// Format duration for display
export const formatDebtDuration = (minutes: number, isBurmese: boolean): string => {
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  if (hours === 0) {
    return `${mins} ${isBurmese ? 'မိနစ်' : 'min'}`;
  } else if (mins === 0) {
    return `${hours} ${isBurmese ? 'နာရီ' : 'hr'}`;
  } else {
    return `${hours}${isBurmese ? 'နာရီ' : 'h'} ${mins}${isBurmese ? 'မိနစ်' : 'm'}`;
  }
};

// Get day name in Burmese
export const getDayNameMy = (dayName: string): string => {
  const days: { [key: string]: string } = {
    Sun: 'တနင်္ဂနွေ',
    Mon: 'တနင်္လာ',
    Tue: 'အင်္ဂါ',
    Wed: 'ဗုဒ္ဓဟူး',
    Thu: 'ကြာသပတေး',
    Fri: 'သောကြာ',
    Sat: 'စနေ',
  };
  return days[dayName] || dayName;
};

export const ALARM_SOUNDS = [
  { id: 'gentle', name: 'Gentle Wake', nameMy: 'ဖြည်းဖြည်းနိုး', icon: '🌅' },
  { id: 'birds', name: 'Bird Song', nameMy: 'ငှက်သံ', icon: '🐦' },
  { id: 'chimes', name: 'Wind Chimes', nameMy: 'လေခေါင်းလောင်း', icon: '🎐' },
  { id: 'ocean', name: 'Ocean Waves', nameMy: 'ပင်လယ်လှိုင်း', icon: '🌊' },
  { id: 'classic', name: 'Classic Alarm', nameMy: 'ရိုးရာနိုးစက်', icon: '⏰' },
];

export const SNOOZE_OPTIONS = [
  { value: 5, label: '5 min', labelMy: '၅ မိနစ်' },
  { value: 9, label: '9 min', labelMy: '၉ မိနစ်' },
  { value: 10, label: '10 min', labelMy: '၁၀ မိနစ်' },
  { value: 15, label: '15 min', labelMy: '၁၅ မိနစ်' },
];

export const WINDOW_OPTIONS = [
  { value: 15, label: '15 min', labelMy: '၁၅ မိနစ်' },
  { value: 30, label: '30 min', labelMy: '၃၀ မိနစ်' },
  { value: 45, label: '45 min', labelMy: '၄၅ မိနစ်' },
];
