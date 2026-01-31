import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetAndroidWidget } from './androidWidget';

const LAST_RESET_KEY = 'last_daily_reset';
const DAILY_INTAKE_KEY = 'daily_water_intake';
const RESET_TIME_KEY = 'daily_reset_time';

// Default reset time: 12:00 AM (midnight)
const DEFAULT_RESET_HOUR = 0; // 0 = 12:00 AM, 4 = 4:00 AM, etc.

/**
 * Get the configured reset time (hour in 24h format)
 * Default is 0 (12:00 AM / midnight)
 */
export const getResetTime = async (): Promise<number> => {
  try {
    const saved = await AsyncStorage.getItem(RESET_TIME_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_RESET_HOUR;
  } catch {
    return DEFAULT_RESET_HOUR;
  }
};

/**
 * Set the daily reset time (hour in 24h format)
 * @param hour - 0-23 (0 = 12:00 AM, 12 = 12:00 PM)
 */
export const setResetTime = async (hour: number): Promise<void> => {
  const validHour = Math.max(0, Math.min(23, hour));
  await AsyncStorage.setItem(RESET_TIME_KEY, validHour.toString());
};

/**
 * Get the current "day" based on reset time
 * If reset time is 12:00 AM (0), the day changes at midnight
 * If reset time is 4:00 AM (4), the day changes at 4 AM
 */
const getCurrentDayKey = (resetHour: number): string => {
  const now = new Date();
  const currentHour = now.getHours();

  // If current time is before reset hour, we're still in "yesterday"
  if (currentHour < resetHour) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  return now.toISOString().split('T')[0];
};

/**
 * Check if we need to reset daily intake (new day started based on reset time)
 * Reset happens at 12:00 AM (midnight) by default
 */
export const checkAndResetDaily = async (): Promise<boolean> => {
  try {
    const resetHour = await getResetTime();
    const currentDayKey = getCurrentDayKey(resetHour);
    const lastReset = await AsyncStorage.getItem(LAST_RESET_KEY);

    if (lastReset !== currentDayKey) {
      // New day based on reset time - reset intake
      await AsyncStorage.setItem(DAILY_INTAKE_KEY, '0');
      await AsyncStorage.setItem(LAST_RESET_KEY, currentDayKey);
      await resetAndroidWidget();
      console.log(`Daily intake reset at ${resetHour}:00 for day: ${currentDayKey}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking daily reset:', error);
    return false;
  }
};

/**
 * Get the current daily intake
 */
export const getDailyIntake = async (): Promise<number> => {
  try {
    await checkAndResetDaily();
    const intake = await AsyncStorage.getItem(DAILY_INTAKE_KEY);
    return intake ? parseInt(intake, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Set the daily intake
 */
export const setDailyIntake = async (amount: number): Promise<void> => {
  await AsyncStorage.setItem(DAILY_INTAKE_KEY, amount.toString());
};

/**
 * Add to daily intake
 */
export const addToDailyIntake = async (amount: number): Promise<number> => {
  const current = await getDailyIntake();
  const newTotal = current + amount;
  await setDailyIntake(newTotal);
  return newTotal;
};


/**
 * Format reset time for display
 * @param hour - Hour in 24h format (0-23)
 * @returns Formatted time string (e.g., "12:00 AM", "4:00 AM")
 */
export const formatResetTime = (hour: number): string => {
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
};

/**
 * Available reset time options
 */
export const RESET_TIME_OPTIONS = [
  { hour: 0, label: '12:00 AM (Midnight)', labelMy: 'သန်းခေါင် ၁၂:၀၀' },
  { hour: 3, label: '3:00 AM', labelMy: 'နံနက် ၃:၀၀' },
  { hour: 4, label: '4:00 AM', labelMy: 'နံနက် ၄:၀၀' },
  { hour: 5, label: '5:00 AM', labelMy: 'နံနက် ၅:၀၀' },
  { hour: 6, label: '6:00 AM', labelMy: 'နံနက် ၆:၀၀' },
];
