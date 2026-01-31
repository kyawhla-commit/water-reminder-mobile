import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSleepRecords } from './sleep';

const WATER_HISTORY_KEY = '@hydromate_water_history';

export interface DailyWaterData {
  date: string;
  totalIntake: number;
  goal: number;
  percentage: number;
}

export interface SleepHydrationData {
  date: string;
  waterIntake: number;
  waterGoal: number;
  waterPercentage: number;
  sleepDuration: number; // minutes
  sleepQuality: number | null; // 1-5
  sleepGoal: number; // minutes (default 480 = 8 hours)
}

export interface CorrelationAnalysis {
  correlation: number; // -1 to 1
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'neutral';
  dataPoints: number;
  avgSleepWhenHydrated: number;
  avgSleepWhenDehydrated: number;
  avgQualityWhenHydrated: number;
  avgQualityWhenDehydrated: number;
}

export interface SleepHydrationInsight {
  type: 'positive' | 'negative' | 'tip' | 'achievement';
  title: string;
  titleMy: string;
  message: string;
  messageMy: string;
  icon: string;
}

// Load water history from storage
const loadWaterHistory = async (): Promise<{ entries: any[] }> => {
  try {
    const data = await AsyncStorage.getItem(WATER_HISTORY_KEY);
    return data ? JSON.parse(data) : { entries: [] };
  } catch {
    return { entries: [] };
  }
};

// Get daily water totals for the past N days
export const getDailyWaterTotals = async (days: number = 30): Promise<DailyWaterData[]> => {
  const history = await loadWaterHistory();
  const dailyTotals: { [date: string]: { total: number; goal: number } } = {};

  // Group entries by date
  history.entries.forEach((entry: any) => {
    const date = entry.date.split('T')[0];
    if (!dailyTotals[date]) {
      dailyTotals[date] = { total: 0, goal: entry.dailyGoal || 2000 };
    }
    dailyTotals[date].total += entry.amount;
  });

  // Convert to array and filter by date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return Object.entries(dailyTotals)
    .filter(([date]) => new Date(date) >= cutoffDate)
    .map(([date, data]) => ({
      date,
      totalIntake: data.total,
      goal: data.goal,
      percentage: Math.round((data.total / data.goal) * 100),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Combine sleep and water data by date
export const getSleepHydrationData = async (days: number = 30): Promise<SleepHydrationData[]> => {
  const [waterData, sleepRecords] = await Promise.all([
    getDailyWaterTotals(days),
    getSleepRecords(),
  ]);

  const sleepByDate: { [date: string]: { duration: number; quality: number | null } } = {};

  // Group sleep records by date (use the date they woke up)
  sleepRecords.forEach((record) => {
    const date = record.createdAt.split('T')[0];
    if (!sleepByDate[date]) {
      sleepByDate[date] = { duration: 0, quality: null };
    }
    sleepByDate[date].duration += record.duration;
    if (record.quality) {
      sleepByDate[date].quality = record.quality;
    }
  });

  // Combine data - match water intake from previous day with sleep that night
  const combinedData: SleepHydrationData[] = [];

  waterData.forEach((water) => {
    const nextDay = new Date(water.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    const sleep = sleepByDate[nextDayStr] || sleepByDate[water.date];

    if (sleep) {
      combinedData.push({
        date: water.date,
        waterIntake: water.totalIntake,
        waterGoal: water.goal,
        waterPercentage: water.percentage,
        sleepDuration: sleep.duration,
        sleepQuality: sleep.quality,
        sleepGoal: 480, // 8 hours default
      });
    }
  });

  return combinedData;
};

// Calculate Pearson correlation coefficient
const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length < 3 || x.length !== y.length) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
};

// Analyze correlation between hydration and sleep
export const analyzeCorrelation = async (): Promise<CorrelationAnalysis> => {
  const data = await getSleepHydrationData(30);

  if (data.length < 5) {
    return {
      correlation: 0,
      strength: 'none',
      direction: 'neutral',
      dataPoints: data.length,
      avgSleepWhenHydrated: 0,
      avgSleepWhenDehydrated: 0,
      avgQualityWhenHydrated: 0,
      avgQualityWhenDehydrated: 0,
    };
  }

  // Calculate correlation between water percentage and sleep duration
  const waterPercentages = data.map((d) => d.waterPercentage);
  const sleepDurations = data.map((d) => d.sleepDuration);

  const correlation = calculateCorrelation(waterPercentages, sleepDurations);

  // Determine strength
  const absCorr = Math.abs(correlation);
  let strength: 'strong' | 'moderate' | 'weak' | 'none';
  if (absCorr >= 0.7) strength = 'strong';
  else if (absCorr >= 0.4) strength = 'moderate';
  else if (absCorr >= 0.2) strength = 'weak';
  else strength = 'none';

  // Determine direction
  let direction: 'positive' | 'negative' | 'neutral';
  if (correlation > 0.1) direction = 'positive';
  else if (correlation < -0.1) direction = 'negative';
  else direction = 'neutral';

  // Calculate averages for hydrated vs dehydrated days
  const hydratedDays = data.filter((d) => d.waterPercentage >= 80);
  const dehydratedDays = data.filter((d) => d.waterPercentage < 60);

  const avgSleepWhenHydrated =
    hydratedDays.length > 0
      ? hydratedDays.reduce((sum, d) => sum + d.sleepDuration, 0) / hydratedDays.length
      : 0;

  const avgSleepWhenDehydrated =
    dehydratedDays.length > 0
      ? dehydratedDays.reduce((sum, d) => sum + d.sleepDuration, 0) / dehydratedDays.length
      : 0;

  const hydratedWithQuality = hydratedDays.filter((d) => d.sleepQuality !== null);
  const dehydratedWithQuality = dehydratedDays.filter((d) => d.sleepQuality !== null);

  const avgQualityWhenHydrated =
    hydratedWithQuality.length > 0
      ? hydratedWithQuality.reduce((sum, d) => sum + (d.sleepQuality || 0), 0) /
        hydratedWithQuality.length
      : 0;

  const avgQualityWhenDehydrated =
    dehydratedWithQuality.length > 0
      ? dehydratedWithQuality.reduce((sum, d) => sum + (d.sleepQuality || 0), 0) /
        dehydratedWithQuality.length
      : 0;

  return {
    correlation,
    strength,
    direction,
    dataPoints: data.length,
    avgSleepWhenHydrated,
    avgSleepWhenDehydrated,
    avgQualityWhenHydrated,
    avgQualityWhenDehydrated,
  };
};

// Generate insights based on correlation analysis
export const generateInsights = async (): Promise<SleepHydrationInsight[]> => {
  const analysis = await analyzeCorrelation();
  const insights: SleepHydrationInsight[] = [];

  if (analysis.dataPoints < 5) {
    insights.push({
      type: 'tip',
      title: 'Keep Tracking!',
      titleMy: 'ဆက်လက်မှတ်တမ်းတင်ပါ!',
      message: `You have ${analysis.dataPoints} days of data. Track for at least 5 days to see correlations.`,
      messageMy: `သင့်မှာ ${analysis.dataPoints} ရက်စာဒေတာရှိပါသည်။ ဆက်စပ်မှုများမြင်ရန် အနည်းဆုံး ၅ ရက်မှတ်တမ်းတင်ပါ။`,
      icon: '📊',
    });
    return insights;
  }

  // Sleep duration comparison
  if (analysis.avgSleepWhenHydrated > 0 && analysis.avgSleepWhenDehydrated > 0) {
    const sleepDiff = analysis.avgSleepWhenHydrated - analysis.avgSleepWhenDehydrated;
    const sleepDiffMins = Math.abs(Math.round(sleepDiff));

    if (sleepDiff > 15) {
      insights.push({
        type: 'positive',
        title: 'Hydration Helps Sleep!',
        titleMy: 'ရေဓာတ်က အိပ်စက်မှုကို ကူညီတယ်!',
        message: `You sleep ${sleepDiffMins} minutes longer on well-hydrated days!`,
        messageMy: `ရေဓာတ်ပြည့်ဝသောနေ့များတွင် ${sleepDiffMins} မိနစ်ပိုအိပ်ပါသည်!`,
        icon: '🌟',
      });
    } else if (sleepDiff < -15) {
      insights.push({
        type: 'negative',
        title: 'Interesting Pattern',
        titleMy: 'စိတ်ဝင်စားစရာပုံစံ',
        message: `Your sleep patterns vary with hydration. Try drinking water earlier in the day.`,
        messageMy: `သင့်အိပ်စက်မှုပုံစံသည် ရေဓာတ်နှင့်ကွဲပြားသည်။ နေ့လည်ပိုင်းတွင် ရေသောက်ကြည့်ပါ။`,
        icon: '💡',
      });
    }
  }

  // Sleep quality comparison
  if (analysis.avgQualityWhenHydrated > 0 && analysis.avgQualityWhenDehydrated > 0) {
    const qualityDiff = analysis.avgQualityWhenHydrated - analysis.avgQualityWhenDehydrated;

    if (qualityDiff > 0.5) {
      insights.push({
        type: 'positive',
        title: 'Better Sleep Quality!',
        titleMy: 'အိပ်စက်မှုအရည်အသွေး ပိုကောင်းတယ်!',
        message: `Your sleep quality is ${qualityDiff.toFixed(1)} stars higher when well-hydrated!`,
        messageMy: `ရေဓာတ်ပြည့်ဝသောအခါ အိပ်စက်မှုအရည်အသွေး ${qualityDiff.toFixed(1)} ကြယ်ပိုမြင့်သည်!`,
        icon: '⭐',
      });
    }
  }

  // Correlation strength insight
  if (analysis.strength === 'strong' && analysis.direction === 'positive') {
    insights.push({
      type: 'achievement',
      title: 'Strong Connection Found!',
      titleMy: 'ခိုင်မာသောဆက်စပ်မှုတွေ့ရှိ!',
      message: 'Your data shows a strong positive link between hydration and sleep!',
      messageMy: 'သင့်ဒေတာတွင် ရေဓာတ်နှင့်အိပ်စက်မှုကြား ခိုင်မာသောအပြုသဘောဆက်စပ်မှုပြသည်!',
      icon: '🏆',
    });
  } else if (analysis.strength === 'moderate') {
    insights.push({
      type: 'tip',
      title: 'Moderate Connection',
      titleMy: 'အလယ်အလတ်ဆက်စပ်မှု',
      message: 'There appears to be a connection between your hydration and sleep patterns.',
      messageMy: 'သင့်ရေဓာတ်နှင့်အိပ်စက်မှုပုံစံကြား ဆက်စပ်မှုရှိပုံရသည်။',
      icon: '🔗',
    });
  }

  // General tips
  insights.push({
    type: 'tip',
    title: 'Pro Tip',
    titleMy: 'အကြံပြုချက်',
    message: 'Avoid drinking large amounts of water 2 hours before bed to prevent nighttime waking.',
    messageMy: 'ညအိပ်ရာဝင်ချိန် ၂ နာရီအလိုတွင် ရေအများကြီးမသောက်ပါနှင့်။',
    icon: '💡',
  });

  return insights;
};

// Get weekly summary
export const getWeeklySummary = async (): Promise<{
  avgWaterPercentage: number;
  avgSleepDuration: number;
  avgSleepQuality: number;
  bestDay: { date: string; sleep: number; water: number } | null;
  worstDay: { date: string; sleep: number; water: number } | null;
}> => {
  const data = await getSleepHydrationData(7);

  if (data.length === 0) {
    return {
      avgWaterPercentage: 0,
      avgSleepDuration: 0,
      avgSleepQuality: 0,
      bestDay: null,
      worstDay: null,
    };
  }

  const avgWaterPercentage =
    data.reduce((sum, d) => sum + d.waterPercentage, 0) / data.length;
  const avgSleepDuration =
    data.reduce((sum, d) => sum + d.sleepDuration, 0) / data.length;

  const withQuality = data.filter((d) => d.sleepQuality !== null);
  const avgSleepQuality =
    withQuality.length > 0
      ? withQuality.reduce((sum, d) => sum + (d.sleepQuality || 0), 0) / withQuality.length
      : 0;

  // Find best and worst days (by combined score)
  const scored = data.map((d) => ({
    ...d,
    score: d.waterPercentage / 100 + d.sleepDuration / 480,
  }));

  scored.sort((a, b) => b.score - a.score);

  const bestDay = scored[0]
    ? { date: scored[0].date, sleep: scored[0].sleepDuration, water: scored[0].waterPercentage }
    : null;

  const worstDay = scored[scored.length - 1]
    ? {
        date: scored[scored.length - 1].date,
        sleep: scored[scored.length - 1].sleepDuration,
        water: scored[scored.length - 1].waterPercentage,
      }
    : null;

  return {
    avgWaterPercentage,
    avgSleepDuration,
    avgSleepQuality,
    bestDay,
    worstDay,
  };
};
