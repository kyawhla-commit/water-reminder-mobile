import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'water_history';

export interface DailyWaterRecord {
  date: string; // YYYY-MM-DD
  intake: number;
  goal: number;
  entries: { time: string; amount: number }[];
}

export interface WaterStats {
  currentStreak: number;
  longestStreak: number;
  weeklyAverage: number;
  monthlyAverage: number;
  totalDaysTracked: number;
  goalCompletionRate: number;
}

// Get all history
export const getWaterHistory = async (): Promise<Record<string, DailyWaterRecord>> => {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting water history:', error);
    return {};
  }
};

// Get record for specific date
export const getDayRecord = async (date: string): Promise<DailyWaterRecord | null> => {
  const history = await getWaterHistory();
  return history[date] || null;
};

// Save water entry
export const saveWaterEntry = async (amount: number, goal: number, date?: Date): Promise<void> => {
  try {
    const d = date || new Date();
    const dateKey = d.toISOString().split('T')[0];
    const timeKey = d.toTimeString().split(' ')[0].slice(0, 5);

    const history = await getWaterHistory();
    const existing = history[dateKey] || { date: dateKey, intake: 0, goal, entries: [] };

    existing.intake += amount;
    existing.goal = goal;
    existing.entries.push({ time: timeKey, amount });

    history[dateKey] = existing;
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving water entry:', error);
    throw error;
  }
};

// Get last N days of data
export const getLastNDays = async (days: number): Promise<DailyWaterRecord[]> => {
  const history = await getWaterHistory();
  const result: DailyWaterRecord[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    result.push(history[dateKey] || { date: dateKey, intake: 0, goal: 2000, entries: [] });
  }

  return result.reverse();
};

// Calculate stats
export const calculateStats = async (goal: number): Promise<WaterStats> => {
  const history = await getWaterHistory();
  const records = Object.values(history).sort((a, b) => a.date.localeCompare(b.date));

  if (records.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      weeklyAverage: 0,
      monthlyAverage: 0,
      totalDaysTracked: 0,
      goalCompletionRate: 0,
    };
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date().toISOString().split('T')[0];
  const sortedDates = records.map(r => r.date).sort().reverse();

  for (let i = 0; i < sortedDates.length; i++) {
    const record = history[sortedDates[i]];
    const metGoal = record.intake >= record.goal * 0.8; // 80% counts as meeting goal

    if (metGoal) {
      tempStreak++;
      if (i === 0 || isConsecutiveDay(sortedDates[i], sortedDates[i - 1])) {
        if (sortedDates[0] === today || isConsecutiveDay(today, sortedDates[0])) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Weekly average (last 7 days)
  const last7Days = await getLastNDays(7);
  const weeklyTotal = last7Days.reduce((sum, r) => sum + r.intake, 0);
  const weeklyAverage = Math.round(weeklyTotal / 7);

  // Monthly average (last 30 days)
  const last30Days = await getLastNDays(30);
  const monthlyTotal = last30Days.reduce((sum, r) => sum + r.intake, 0);
  const monthlyAverage = Math.round(monthlyTotal / 30);

  // Goal completion rate
  const daysWithGoalMet = records.filter(r => r.intake >= r.goal * 0.8).length;
  const goalCompletionRate = Math.round((daysWithGoalMet / records.length) * 100);

  return {
    currentStreak,
    longestStreak,
    weeklyAverage,
    monthlyAverage,
    totalDaysTracked: records.length,
    goalCompletionRate,
  };
};

const isConsecutiveDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

// Get weekly data for chart
export const getWeeklyChartData = async (): Promise<{ day: string; intake: number; goal: number }[]> => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days = await getLastNDays(7);

  return last7Days.map((record) => {
    const date = new Date(record.date);
    return {
      day: days[date.getDay()],
      intake: record.intake,
      goal: record.goal,
    };
  });
};

// Get monthly data for chart
export const getMonthlyChartData = async (): Promise<{ week: string; average: number }[]> => {
  const last30Days = await getLastNDays(30);
  const weeks: { week: string; average: number }[] = [];

  for (let i = 0; i < 4; i++) {
    const weekData = last30Days.slice(i * 7, (i + 1) * 7);
    const total = weekData.reduce((sum, r) => sum + r.intake, 0);
    weeks.push({
      week: `Week ${i + 1}`,
      average: Math.round(total / 7),
    });
  }

  return weeks;
};
