/**
 * History & Stats Service
 * Comprehensive weekly and monthly statistics for water intake tracking
 */

import { DailyWaterRecord, getWaterHistory } from './waterHistory';

// ============ TYPES ============

export interface WeeklyStats {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalIntake: number;
  dailyAverage: number;
  daysTracked: number;
  daysGoalMet: number;
  goalCompletionRate: number;
  bestDay: { date: string; intake: number } | null;
  worstDay: { date: string; intake: number } | null;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  dailyData: DailyWaterRecord[];
}

export interface MonthlyStats {
  month: number;
  year: number;
  monthName: string;
  totalIntake: number;
  dailyAverage: number;
  daysTracked: number;
  daysGoalMet: number;
  goalCompletionRate: number;
  bestDay: { date: string; intake: number } | null;
  worstDay: { date: string; intake: number } | null;
  bestWeek: { weekNumber: number; average: number } | null;
  weeklyBreakdown: WeeklyStats[];
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}


export interface HourlyDistribution {
  hour: number;
  totalIntake: number;
  entryCount: number;
  averagePerEntry: number;
}

export interface DayOfWeekStats {
  dayIndex: number;
  dayName: string;
  dayNameMy: string;
  totalIntake: number;
  averageIntake: number;
  daysCount: number;
  goalMetCount: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  currentStreakStart: string | null;
  longestStreakStart: string | null;
  longestStreakEnd: string | null;
  isOnStreak: boolean;
}

export interface ComprehensiveStats {
  allTime: {
    totalIntake: number;
    totalDays: number;
    dailyAverage: number;
    goalCompletionRate: number;
    bestDay: { date: string; intake: number } | null;
    totalEntries: number;
  };
  thisWeek: WeeklyStats;
  lastWeek: WeeklyStats;
  thisMonth: MonthlyStats;
  lastMonth: MonthlyStats;
  streaks: StreakInfo;
  hourlyDistribution: HourlyDistribution[];
  dayOfWeekStats: DayOfWeekStats[];
}

// ============ HELPER FUNCTIONS ============

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};


const getWeekStartEnd = (date: Date): { start: Date; end: Date } => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getMonthStartEnd = (year: number, month: number): { start: Date; end: Date } => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];

const isConsecutiveDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

const calculateTrend = (
  current: number,
  previous: number
): { trend: 'up' | 'down' | 'stable'; percentage: number } => {
  if (previous === 0) return { trend: 'stable', percentage: 0 };
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 5) return { trend: 'stable', percentage: Math.round(diff) };
  return { trend: diff > 0 ? 'up' : 'down', percentage: Math.round(Math.abs(diff)) };
};


const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_NAMES_MY = [
  'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
  'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
];

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_MY = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];

// ============ WEEKLY STATS ============

export const getWeeklyStats = async (
  weekOffset: number = 0,
  goal: number = 2000
): Promise<WeeklyStats> => {
  const history = await getWaterHistory();
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() - weekOffset * 7);

  const { start, end } = getWeekStartEnd(targetDate);
  const weekNumber = getWeekNumber(start);

  const dailyData: DailyWaterRecord[] = [];
  let totalIntake = 0;
  let daysTracked = 0;
  let daysGoalMet = 0;
  let bestDay: { date: string; intake: number } | null = null;
  let worstDay: { date: string; intake: number } | null = null;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = formatDateKey(d);
    const record = history[dateKey] || { date: dateKey, intake: 0, goal, entries: [] };
    dailyData.push(record);

    if (record.intake > 0) {
      totalIntake += record.intake;
      daysTracked++;
      if (record.intake >= record.goal * 0.8) daysGoalMet++;
      if (!bestDay || record.intake > bestDay.intake) {
        bestDay = { date: dateKey, intake: record.intake };
      }
      if (!worstDay || record.intake < worstDay.intake) {
        worstDay = { date: dateKey, intake: record.intake };
      }
    }
  }


  const dailyAverage = daysTracked > 0 ? Math.round(totalIntake / daysTracked) : 0;
  const goalCompletionRate = daysTracked > 0 ? Math.round((daysGoalMet / daysTracked) * 100) : 0;

  // Calculate trend compared to previous week
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendPercentage = 0;

  if (weekOffset === 0) {
    const prevWeekStats = await getWeeklyStats(1, goal);
    const trendResult = calculateTrend(dailyAverage, prevWeekStats.dailyAverage);
    trend = trendResult.trend;
    trendPercentage = trendResult.percentage;
  }

  return {
    weekNumber,
    startDate: formatDateKey(start),
    endDate: formatDateKey(end),
    totalIntake,
    dailyAverage,
    daysTracked,
    daysGoalMet,
    goalCompletionRate,
    bestDay,
    worstDay,
    trend,
    trendPercentage,
    dailyData,
  };
};

// ============ MONTHLY STATS ============

export const getMonthlyStats = async (
  monthOffset: number = 0,
  goal: number = 2000,
  language: 'en' | 'my' = 'en'
): Promise<MonthlyStats> => {
  const history = await getWaterHistory();
  const today = new Date();
  const targetMonth = today.getMonth() - monthOffset;
  const targetYear = today.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;

  const { start, end } = getMonthStartEnd(targetYear, normalizedMonth);
  const monthName = language === 'my' ? MONTH_NAMES_MY[normalizedMonth] : MONTH_NAMES_EN[normalizedMonth];


  let totalIntake = 0;
  let daysTracked = 0;
  let daysGoalMet = 0;
  let bestDay: { date: string; intake: number } | null = null;
  let worstDay: { date: string; intake: number } | null = null;

  const weeklyTotals: Map<number, { total: number; days: number }> = new Map();

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = formatDateKey(d);
    const record = history[dateKey];
    const weekNum = getWeekNumber(d);

    if (record && record.intake > 0) {
      totalIntake += record.intake;
      daysTracked++;
      if (record.intake >= (record.goal || goal) * 0.8) daysGoalMet++;

      if (!bestDay || record.intake > bestDay.intake) {
        bestDay = { date: dateKey, intake: record.intake };
      }
      if (!worstDay || record.intake < worstDay.intake) {
        worstDay = { date: dateKey, intake: record.intake };
      }

      const weekData = weeklyTotals.get(weekNum) || { total: 0, days: 0 };
      weekData.total += record.intake;
      weekData.days++;
      weeklyTotals.set(weekNum, weekData);
    }
  }

  const dailyAverage = daysTracked > 0 ? Math.round(totalIntake / daysTracked) : 0;
  const goalCompletionRate = daysTracked > 0 ? Math.round((daysGoalMet / daysTracked) * 100) : 0;

  // Find best week
  let bestWeek: { weekNumber: number; average: number } | null = null;
  weeklyTotals.forEach((data, weekNum) => {
    const avg = data.days > 0 ? Math.round(data.total / data.days) : 0;
    if (!bestWeek || avg > bestWeek.average) {
      bestWeek = { weekNumber: weekNum, average: avg };
    }
  });


  // Get weekly breakdown
  const weeklyBreakdown: WeeklyStats[] = [];
  const weeksInMonth = Math.ceil((end.getDate() - start.getDate() + 1) / 7);
  for (let i = 0; i < weeksInMonth; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + i * 7);
    if (weekStart <= end) {
      const weekStats = await getWeeklyStatsForDateRange(
        weekStart,
        new Date(Math.min(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000, end.getTime())),
        history,
        goal
      );
      weeklyBreakdown.push(weekStats);
    }
  }

  // Calculate trend compared to previous month
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendPercentage = 0;

  if (monthOffset === 0) {
    const prevMonthStats = await getMonthlyStats(1, goal, language);
    const trendResult = calculateTrend(dailyAverage, prevMonthStats.dailyAverage);
    trend = trendResult.trend;
    trendPercentage = trendResult.percentage;
  }

  return {
    month: normalizedMonth,
    year: targetYear,
    monthName,
    totalIntake,
    dailyAverage,
    daysTracked,
    daysGoalMet,
    goalCompletionRate,
    bestDay,
    worstDay,
    bestWeek,
    weeklyBreakdown,
    trend,
    trendPercentage,
  };
};

// Helper for weekly stats within a date range
const getWeeklyStatsForDateRange = async (
  start: Date,
  end: Date,
  history: Record<string, DailyWaterRecord>,
  goal: number
): Promise<WeeklyStats> => {
  const weekNumber = getWeekNumber(start);
  const dailyData: DailyWaterRecord[] = [];
  let totalIntake = 0;
  let daysTracked = 0;
  let daysGoalMet = 0;
  let bestDay: { date: string; intake: number } | null = null;
  let worstDay: { date: string; intake: number } | null = null;


  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = formatDateKey(d);
    const record = history[dateKey] || { date: dateKey, intake: 0, goal, entries: [] };
    dailyData.push(record);

    if (record.intake > 0) {
      totalIntake += record.intake;
      daysTracked++;
      if (record.intake >= (record.goal || goal) * 0.8) daysGoalMet++;
      if (!bestDay || record.intake > bestDay.intake) {
        bestDay = { date: dateKey, intake: record.intake };
      }
      if (!worstDay || record.intake < worstDay.intake) {
        worstDay = { date: dateKey, intake: record.intake };
      }
    }
  }

  const dailyAverage = daysTracked > 0 ? Math.round(totalIntake / daysTracked) : 0;
  const goalCompletionRate = daysTracked > 0 ? Math.round((daysGoalMet / daysTracked) * 100) : 0;

  return {
    weekNumber,
    startDate: formatDateKey(start),
    endDate: formatDateKey(end),
    totalIntake,
    dailyAverage,
    daysTracked,
    daysGoalMet,
    goalCompletionRate,
    bestDay,
    worstDay,
    trend: 'stable',
    trendPercentage: 0,
    dailyData,
  };
};

// ============ STREAK CALCULATIONS ============

export const getStreakInfo = async (goal: number = 2000): Promise<StreakInfo> => {
  const history = await getWaterHistory();
  const records = Object.values(history).sort((a, b) => b.date.localeCompare(a.date));

  if (records.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      currentStreakStart: null,
      longestStreakStart: null,
      longestStreakEnd: null,
      isOnStreak: false,
    };
  }


  const today = formatDateKey(new Date());
  const yesterday = formatDateKey(new Date(Date.now() - 86400000));

  let currentStreak = 0;
  let currentStreakStart: string | null = null;
  let longestStreak = 0;
  let longestStreakStart: string | null = null;
  let longestStreakEnd: string | null = null;
  let tempStreak = 0;
  let tempStreakStart: string | null = null;
  let isOnStreak = false;

  // Sort dates in descending order
  const sortedDates = Object.keys(history).sort().reverse();

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const record = history[date];
    const metGoal = record.intake >= (record.goal || goal) * 0.8;

    if (metGoal) {
      if (tempStreak === 0) {
        tempStreakStart = date;
      }
      tempStreak++;

      // Check if this is part of current streak
      if (i === 0 && (date === today || date === yesterday)) {
        isOnStreak = true;
      }

      // Check consecutive days
      if (i < sortedDates.length - 1) {
        const nextDate = sortedDates[i + 1];
        if (!isConsecutiveDay(nextDate, date)) {
          // Streak broken
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
            longestStreakStart = date;
            longestStreakEnd = tempStreakStart;
          }
          if (isOnStreak && currentStreak === 0) {
            currentStreak = tempStreak;
            currentStreakStart = date;
          }
          tempStreak = 0;
          tempStreakStart = null;
          isOnStreak = false;
        }
      }
    } else {
      // Goal not met
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakStart = sortedDates[i - 1] || date;
        longestStreakEnd = tempStreakStart;
      }
      if (isOnStreak && currentStreak === 0) {
        currentStreak = tempStreak;
        currentStreakStart = sortedDates[i - 1] || null;
      }
      tempStreak = 0;
      tempStreakStart = null;
      isOnStreak = false;
    }
  }


  // Handle final streak
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
    longestStreakStart = sortedDates[sortedDates.length - 1];
    longestStreakEnd = tempStreakStart;
  }
  if (isOnStreak && currentStreak === 0) {
    currentStreak = tempStreak;
    currentStreakStart = sortedDates[sortedDates.length - 1];
  }

  return {
    currentStreak,
    longestStreak,
    currentStreakStart,
    longestStreakStart,
    longestStreakEnd,
    isOnStreak,
  };
};

// ============ HOURLY DISTRIBUTION ============

export const getHourlyDistribution = async (): Promise<HourlyDistribution[]> => {
  const history = await getWaterHistory();
  const hourlyData: Map<number, { total: number; count: number }> = new Map();

  // Initialize all hours
  for (let h = 0; h < 24; h++) {
    hourlyData.set(h, { total: 0, count: 0 });
  }

  Object.values(history).forEach((record) => {
    record.entries.forEach((entry) => {
      const hour = parseInt(entry.time.split(':')[0], 10);
      const data = hourlyData.get(hour)!;
      data.total += entry.amount;
      data.count++;
    });
  });

  return Array.from(hourlyData.entries()).map(([hour, data]) => ({
    hour,
    totalIntake: data.total,
    entryCount: data.count,
    averagePerEntry: data.count > 0 ? Math.round(data.total / data.count) : 0,
  }));
};


// ============ DAY OF WEEK STATS ============

export const getDayOfWeekStats = async (goal: number = 2000): Promise<DayOfWeekStats[]> => {
  const history = await getWaterHistory();
  const dayStats: Map<number, { total: number; count: number; goalMet: number }> = new Map();

  // Initialize all days
  for (let d = 0; d < 7; d++) {
    dayStats.set(d, { total: 0, count: 0, goalMet: 0 });
  }

  Object.values(history).forEach((record) => {
    const date = new Date(record.date);
    const dayIndex = date.getDay();
    const data = dayStats.get(dayIndex)!;
    data.total += record.intake;
    data.count++;
    if (record.intake >= (record.goal || goal) * 0.8) {
      data.goalMet++;
    }
  });

  return Array.from(dayStats.entries()).map(([dayIndex, data]) => ({
    dayIndex,
    dayName: DAY_NAMES_EN[dayIndex],
    dayNameMy: DAY_NAMES_MY[dayIndex],
    totalIntake: data.total,
    averageIntake: data.count > 0 ? Math.round(data.total / data.count) : 0,
    daysCount: data.count,
    goalMetCount: data.goalMet,
  }));
};

// ============ COMPREHENSIVE STATS ============

export const getComprehensiveStats = async (
  goal: number = 2000,
  language: 'en' | 'my' = 'en'
): Promise<ComprehensiveStats> => {
  const history = await getWaterHistory();
  const records = Object.values(history);

  // All-time stats
  let totalIntake = 0;
  let totalEntries = 0;
  let daysGoalMet = 0;
  let bestDay: { date: string; intake: number } | null = null;

  records.forEach((record) => {
    totalIntake += record.intake;
    totalEntries += record.entries.length;
    if (record.intake >= (record.goal || goal) * 0.8) daysGoalMet++;
    if (!bestDay || record.intake > bestDay.intake) {
      bestDay = { date: record.date, intake: record.intake };
    }
  });


  const [thisWeek, lastWeek, thisMonth, lastMonth, streaks, hourlyDistribution, dayOfWeekStats] =
    await Promise.all([
      getWeeklyStats(0, goal),
      getWeeklyStats(1, goal),
      getMonthlyStats(0, goal, language),
      getMonthlyStats(1, goal, language),
      getStreakInfo(goal),
      getHourlyDistribution(),
      getDayOfWeekStats(goal),
    ]);

  return {
    allTime: {
      totalIntake,
      totalDays: records.length,
      dailyAverage: records.length > 0 ? Math.round(totalIntake / records.length) : 0,
      goalCompletionRate: records.length > 0 ? Math.round((daysGoalMet / records.length) * 100) : 0,
      bestDay,
      totalEntries,
    },
    thisWeek,
    lastWeek,
    thisMonth,
    lastMonth,
    streaks,
    hourlyDistribution,
    dayOfWeekStats,
  };
};

// ============ COMPARISON HELPERS ============

export const getWeekComparison = async (
  goal: number = 2000
): Promise<{
  thisWeek: WeeklyStats;
  lastWeek: WeeklyStats;
  improvement: number;
  improvementText: string;
  improvementTextMy: string;
}> => {
  const [thisWeek, lastWeek] = await Promise.all([
    getWeeklyStats(0, goal),
    getWeeklyStats(1, goal),
  ]);

  const improvement =
    lastWeek.dailyAverage > 0
      ? Math.round(((thisWeek.dailyAverage - lastWeek.dailyAverage) / lastWeek.dailyAverage) * 100)
      : 0;

  let improvementText = '';
  let improvementTextMy = '';

  if (improvement > 10) {
    improvementText = `Great job! You're drinking ${improvement}% more than last week!`;
    improvementTextMy = `အရမ်းကောင်းပါတယ်! ပြီးခဲ့သောအပတ်ထက် ${improvement}% ပိုသောက်နေပါသည်!`;
  } else if (improvement > 0) {
    improvementText = `Good progress! ${improvement}% improvement from last week.`;
    improvementTextMy = `ကောင်းသောတိုးတက်မှု! ပြီးခဲ့သောအပတ်ထက် ${improvement}% တိုးတက်ပါသည်။`;
  } else if (improvement < -10) {
    improvementText = `You're drinking ${Math.abs(improvement)}% less than last week. Let's improve!`;
    improvementTextMy = `ပြီးခဲ့သောအပတ်ထက် ${Math.abs(improvement)}% လျော့နေပါသည်။ တိုးတက်အောင်ကြိုးစားကြပါစို့!`;
  } else {
    improvementText = 'Consistent with last week. Keep it up!';
    improvementTextMy = 'ပြီးခဲ့သောအပတ်နှင့် တူညီပါသည်။ ဆက်ထိန်းထားပါ!';
  }

  return { thisWeek, lastWeek, improvement, improvementText, improvementTextMy };
};


export const getMonthComparison = async (
  goal: number = 2000,
  language: 'en' | 'my' = 'en'
): Promise<{
  thisMonth: MonthlyStats;
  lastMonth: MonthlyStats;
  improvement: number;
  improvementText: string;
  improvementTextMy: string;
}> => {
  const [thisMonth, lastMonth] = await Promise.all([
    getMonthlyStats(0, goal, language),
    getMonthlyStats(1, goal, language),
  ]);

  const improvement =
    lastMonth.dailyAverage > 0
      ? Math.round(((thisMonth.dailyAverage - lastMonth.dailyAverage) / lastMonth.dailyAverage) * 100)
      : 0;

  let improvementText = '';
  let improvementTextMy = '';

  if (improvement > 10) {
    improvementText = `Excellent! ${improvement}% better than ${lastMonth.monthName}!`;
    improvementTextMy = `အကောင်းဆုံး! ${lastMonth.monthName} ထက် ${improvement}% ပိုကောင်းပါသည်!`;
  } else if (improvement > 0) {
    improvementText = `${improvement}% improvement from ${lastMonth.monthName}.`;
    improvementTextMy = `${lastMonth.monthName} ထက် ${improvement}% တိုးတက်ပါသည်။`;
  } else if (improvement < -10) {
    improvementText = `${Math.abs(improvement)}% less than ${lastMonth.monthName}. You can do better!`;
    improvementTextMy = `${lastMonth.monthName} ထက် ${Math.abs(improvement)}% လျော့နေပါသည်။ ပိုကောင်းအောင်လုပ်နိုင်ပါသည်!`;
  } else {
    improvementText = `Similar to ${lastMonth.monthName}. Stay consistent!`;
    improvementTextMy = `${lastMonth.monthName} နှင့် တူညီပါသည်။ တသမတ်တည်းထားပါ!`;
  }

  return { thisMonth, lastMonth, improvement, improvementText, improvementTextMy };
};

// ============ EXPORT HELPERS ============

export const exportStatsAsText = async (
  goal: number = 2000,
  language: 'en' | 'my' = 'en'
): Promise<string> => {
  const stats = await getComprehensiveStats(goal, language);
  const isMy = language === 'my';

  const lines = [
    isMy ? '📊 ရေသောက်မှတ်တမ်းအကျဉ်းချုပ်' : '📊 Water Intake Summary',
    '',
    isMy ? '=== ဤအပတ် ===' : '=== This Week ===',
    `${isMy ? 'စုစုပေါင်း' : 'Total'}: ${stats.thisWeek.totalIntake}ml`,
    `${isMy ? 'နေ့စဉ်ပျမ်းမျှ' : 'Daily Avg'}: ${stats.thisWeek.dailyAverage}ml`,
    `${isMy ? 'ပန်းတိုင်ရောက်နှုန်း' : 'Goal Rate'}: ${stats.thisWeek.goalCompletionRate}%`,
    '',
    isMy ? '=== ဤလ ===' : '=== This Month ===',
    `${isMy ? 'စုစုပေါင်း' : 'Total'}: ${stats.thisMonth.totalIntake}ml`,
    `${isMy ? 'နေ့စဉ်ပျမ်းမျှ' : 'Daily Avg'}: ${stats.thisMonth.dailyAverage}ml`,
    `${isMy ? 'ပန်းတိုင်ရောက်နှုန်း' : 'Goal Rate'}: ${stats.thisMonth.goalCompletionRate}%`,
    '',
    isMy ? '=== ဆက်တိုက်မှတ်တမ်း ===' : '=== Streaks ===',
    `${isMy ? 'လက်ရှိ' : 'Current'}: ${stats.streaks.currentStreak} ${isMy ? 'ရက်' : 'days'}`,
    `${isMy ? 'အရှည်ဆုံး' : 'Longest'}: ${stats.streaks.longestStreak} ${isMy ? 'ရက်' : 'days'}`,
  ];

  return lines.join('\n');
};
