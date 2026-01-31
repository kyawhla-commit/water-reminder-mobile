import AsyncStorage from '@react-native-async-storage/async-storage';

const CORRELATIONS_KEY = '@hydromate_health_correlations';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type SkinHealth = 1 | 2 | 3 | 4 | 5;

export interface DailyHealthLog {
  date: string;
  waterIntake: number;
  mood: MoodLevel;
  energy: EnergyLevel;
  skinHealth: SkinHealth;
  notes?: string;
}

export interface HealthCorrelations {
  logs: DailyHealthLog[];
  lastLogDate: string;
}

export interface CorrelationInsight {
  type: 'mood' | 'energy' | 'skin';
  correlation: 'positive' | 'negative' | 'neutral';
  strength: number; // 0-100
  message: string;
  messageMy: string;
}

export const MOOD_EMOJIS: { [key in MoodLevel]: string } = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
};

export const ENERGY_EMOJIS: { [key in EnergyLevel]: string } = {
  1: '😴',
  2: '🥱',
  3: '😌',
  4: '💪',
  5: '⚡',
};

export const SKIN_EMOJIS: { [key in SkinHealth]: string } = {
  1: '😣',
  2: '😟',
  3: '😊',
  4: '✨',
  5: '🌟',
};

export const MOOD_LABELS = {
  en: { 1: 'Very Low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' },
  my: { 1: 'အရမ်းနိမ့်', 2: 'နိမ့်', 3: 'အဆင်ပြေ', 4: 'ကောင်း', 5: 'အရမ်းကောင်း' },
};

export const ENERGY_LABELS = {
  en: { 1: 'Exhausted', 2: 'Tired', 3: 'Normal', 4: 'Energetic', 5: 'Super' },
  my: { 1: 'အရမ်းပင်ပန်း', 2: 'ပင်ပန်း', 3: 'ပုံမှန်', 4: 'တက်ကြွ', 5: 'အရမ်းတက်ကြွ' },
};

export const SKIN_LABELS = {
  en: { 1: 'Very Dry', 2: 'Dry', 3: 'Normal', 4: 'Healthy', 5: 'Glowing' },
  my: { 1: 'အရမ်းခြောက်', 2: 'ခြောက်', 3: 'ပုံမှန်', 4: 'ကျန်းမာ', 5: 'တောက်ပ' },
};

const getDefaultCorrelations = (): HealthCorrelations => ({
  logs: [],
  lastLogDate: '',
});

export const loadCorrelations = async (): Promise<HealthCorrelations> => {
  try {
    const data = await AsyncStorage.getItem(CORRELATIONS_KEY);
    return data ? JSON.parse(data) : getDefaultCorrelations();
  } catch {
    return getDefaultCorrelations();
  }
};

export const saveCorrelations = async (correlations: HealthCorrelations): Promise<void> => {
  await AsyncStorage.setItem(CORRELATIONS_KEY, JSON.stringify(correlations));
};

export const logDailyHealth = async (
  waterIntake: number,
  mood: MoodLevel,
  energy: EnergyLevel,
  skinHealth: SkinHealth,
  notes?: string
): Promise<DailyHealthLog> => {
  const correlations = await loadCorrelations();
  const today = new Date().toISOString().split('T')[0];

  const existingIndex = correlations.logs.findIndex(l => l.date === today);
  const log: DailyHealthLog = {
    date: today,
    waterIntake,
    mood,
    energy,
    skinHealth,
    notes,
  };

  if (existingIndex >= 0) {
    correlations.logs[existingIndex] = log;
  } else {
    correlations.logs.push(log);
  }

  correlations.lastLogDate = today;
  
  // Keep only last 90 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  correlations.logs = correlations.logs.filter(
    l => new Date(l.date) >= cutoffDate
  );

  await saveCorrelations(correlations);
  return log;
};

export const getTodayLog = async (): Promise<DailyHealthLog | null> => {
  const correlations = await loadCorrelations();
  const today = new Date().toISOString().split('T')[0];
  return correlations.logs.find(l => l.date === today) || null;
};

export const getRecentLogs = async (days: number = 7): Promise<DailyHealthLog[]> => {
  const correlations = await loadCorrelations();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return correlations.logs
    .filter(l => new Date(l.date) >= cutoffDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length < 3) return 0;
  
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

export const analyzeCorrelations = async (dailyGoal: number): Promise<CorrelationInsight[]> => {
  const logs = await getRecentLogs(30);
  if (logs.length < 5) return [];

  const waterIntakes = logs.map(l => l.waterIntake / dailyGoal * 100);
  const moods = logs.map(l => l.mood);
  const energies = logs.map(l => l.energy);
  const skins = logs.map(l => l.skinHealth);

  const insights: CorrelationInsight[] = [];

  // Mood correlation
  const moodCorr = calculateCorrelation(waterIntakes, moods);
  if (Math.abs(moodCorr) > 0.3) {
    insights.push({
      type: 'mood',
      correlation: moodCorr > 0 ? 'positive' : 'negative',
      strength: Math.abs(moodCorr) * 100,
      message: moodCorr > 0 
        ? 'Your mood tends to be better on days you drink more water!'
        : 'Interesting! Your mood patterns vary with hydration.',
      messageMy: moodCorr > 0
        ? 'ရေပိုသောက်တဲ့နေ့တွေမှာ သင့်စိတ်ခံစားမှု ပိုကောင်းတယ်!'
        : 'စိတ်ဝင်စားစရာ! သင့်စိတ်ခံစားမှုပုံစံက ရေဓာတ်နဲ့ ကွဲပြားတယ်။',
    });
  }

  // Energy correlation
  const energyCorr = calculateCorrelation(waterIntakes, energies);
  if (Math.abs(energyCorr) > 0.3) {
    insights.push({
      type: 'energy',
      correlation: energyCorr > 0 ? 'positive' : 'negative',
      strength: Math.abs(energyCorr) * 100,
      message: energyCorr > 0
        ? 'Higher water intake correlates with more energy for you!'
        : 'Your energy levels show interesting patterns with hydration.',
      messageMy: energyCorr > 0
        ? 'ရေပိုသောက်ခြင်းက သင့်စွမ်းအင်ပိုများစေတယ်!'
        : 'သင့်စွမ်းအင်အဆင့်က ရေဓာတ်နဲ့ စိတ်ဝင်စားစရာပုံစံတွေပြတယ်။',
    });
  }

  // Skin correlation
  const skinCorr = calculateCorrelation(waterIntakes, skins);
  if (Math.abs(skinCorr) > 0.3) {
    insights.push({
      type: 'skin',
      correlation: skinCorr > 0 ? 'positive' : 'negative',
      strength: Math.abs(skinCorr) * 100,
      message: skinCorr > 0
        ? 'Your skin health improves with better hydration!'
        : 'Your skin shows varied responses to hydration levels.',
      messageMy: skinCorr > 0
        ? 'ရေဓာတ်ကောင်းရင် သင့်အသားအရေ ပိုကောင်းတယ်!'
        : 'သင့်အသားအရေက ရေဓာတ်အဆင့်တွေနဲ့ ကွဲပြားစွာတုံ့ပြန်တယ်။',
    });
  }

  return insights;
};

export const getWeeklyAverages = async (): Promise<{
  avgMood: number;
  avgEnergy: number;
  avgSkin: number;
  avgWater: number;
}> => {
  const logs = await getRecentLogs(7);
  if (logs.length === 0) {
    return { avgMood: 0, avgEnergy: 0, avgSkin: 0, avgWater: 0 };
  }

  return {
    avgMood: logs.reduce((sum, l) => sum + l.mood, 0) / logs.length,
    avgEnergy: logs.reduce((sum, l) => sum + l.energy, 0) / logs.length,
    avgSkin: logs.reduce((sum, l) => sum + l.skinHealth, 0) / logs.length,
    avgWater: logs.reduce((sum, l) => sum + l.waterIntake, 0) / logs.length,
  };
};

export const getHealthTrend = async (
  metric: 'mood' | 'energy' | 'skinHealth'
): Promise<'improving' | 'declining' | 'stable'> => {
  const logs = await getRecentLogs(14);
  if (logs.length < 7) return 'stable';

  const recentWeek = logs.slice(0, 7);
  const previousWeek = logs.slice(7, 14);

  if (previousWeek.length === 0) return 'stable';

  const recentAvg = recentWeek.reduce((sum, l) => sum + l[metric], 0) / recentWeek.length;
  const previousAvg = previousWeek.reduce((sum, l) => sum + l[metric], 0) / previousWeek.length;

  const diff = recentAvg - previousAvg;
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
};
