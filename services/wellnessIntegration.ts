import AsyncStorage from '@react-native-async-storage/async-storage';

const WELLNESS_DATA_KEY = '@hydromate_wellness_data';
const DAILY_CHALLENGES_KEY = '@hydromate_daily_challenges';
const WELLNESS_HISTORY_KEY = '@hydromate_wellness_history';

// ============ WELLNESS SCORE ============

export interface WellnessMetrics {
  water: {
    current: number;
    goal: number;
    percentage: number;
    score: number; // 0-100
  };
  sleep: {
    hours: number;
    goal: number;
    quality: number;
    percentage: number;
    score: number;
  };
  focus: {
    minutes: number;
    goal: number;
    sessions: number;
    percentage: number;
    score: number;
  };
}

export interface WellnessScore {
  overall: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend: 'improving' | 'stable' | 'declining';
  metrics: WellnessMetrics;
  breakdown: {
    water: number;
    sleep: number;
    focus: number;
  };
  streaks: {
    water: number;
    sleep: number;
    focus: number;
    overall: number;
  };
}

export interface WellnessHistory {
  date: string;
  score: number;
  water: number;
  sleep: number;
  focus: number;
  challengesCompleted: number;
}

// ============ DAILY CHALLENGES ============

export interface DailyChallenge {
  id: string;
  type: 'water' | 'sleep' | 'focus' | 'combo';
  title: string;
  titleMy: string;
  description: string;
  descriptionMy: string;
  target: number;
  current: number;
  unit: string;
  unitMy: string;
  points: number;
  completed: boolean;
  icon: string;
  color: string;
}

export interface DailyChallengesData {
  date: string;
  challenges: DailyChallenge[];
  totalPoints: number;
  earnedPoints: number;
  streak: number;
  allCompleted: boolean;
}

// ============ INSIGHTS ============

export interface WellnessInsight {
  id: string;
  type: 'correlation' | 'tip' | 'achievement' | 'warning' | 'pattern';
  priority: 'high' | 'medium' | 'low';
  icon: string;
  title: string;
  titleMy: string;
  message: string;
  messageMy: string;
  actionable?: boolean;
  action?: string;
  actionMy?: string;
}

export interface CorrelationData {
  waterSleep: number; // -1 to 1
  waterFocus: number;
  sleepFocus: number;
  description: string;
  descriptionMy: string;
}

// ============ SCORE CALCULATION ============

export const calculateWellnessScore = (metrics: WellnessMetrics): WellnessScore => {
  // Calculate individual scores (0-100)
  const waterScore = Math.min(100, (metrics.water.percentage / 100) * 100);
  const sleepScore = Math.min(100, (metrics.sleep.percentage / 100) * 80 + (metrics.sleep.quality / 5) * 20);
  const focusScore = Math.min(100, (metrics.focus.percentage / 100) * 100);

  // Weighted overall score (water: 35%, sleep: 40%, focus: 25%)
  const overall = Math.round(waterScore * 0.35 + sleepScore * 0.4 + focusScore * 0.25);

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (overall >= 90) grade = 'A';
  else if (overall >= 75) grade = 'B';
  else if (overall >= 60) grade = 'C';
  else if (overall >= 40) grade = 'D';
  else grade = 'F';

  return {
    overall,
    grade,
    trend: 'stable',
    metrics: {
      ...metrics,
      water: { ...metrics.water, score: Math.round(waterScore) },
      sleep: { ...metrics.sleep, score: Math.round(sleepScore) },
      focus: { ...metrics.focus, score: Math.round(focusScore) },
    },
    breakdown: {
      water: Math.round(waterScore),
      sleep: Math.round(sleepScore),
      focus: Math.round(focusScore),
    },
    streaks: { water: 0, sleep: 0, focus: 0, overall: 0 },
  };
};

export const getScoreColor = (score: number): string => {
  if (score >= 90) return '#27AE60';
  if (score >= 75) return '#2ECC71';
  if (score >= 60) return '#F39C12';
  if (score >= 40) return '#E67E22';
  return '#E74C3C';
};

export const getGradeEmoji = (grade: string): string => {
  switch (grade) {
    case 'A': return '🏆';
    case 'B': return '⭐';
    case 'C': return '👍';
    case 'D': return '💪';
    default: return '🎯';
  }
};

// ============ DAILY CHALLENGES GENERATION ============

export const generateDailyChallenges = (
  waterGoal: number,
  sleepGoal: number,
  focusGoal: number
): DailyChallenge[] => {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();

  const challenges: DailyChallenge[] = [
    // Water challenge
    {
      id: `water_${today}`,
      type: 'water',
      title: 'Hydration Hero',
      titleMy: 'ရေဓာတ်သူရဲကောင်း',
      description: `Drink ${waterGoal}ml of water today`,
      descriptionMy: `ယနေ့ ရေ ${waterGoal}ml သောက်ပါ`,
      target: waterGoal,
      current: 0,
      unit: 'ml',
      unitMy: 'မီလီလီတာ',
      points: 30,
      completed: false,
      icon: '💧',
      color: '#3498DB',
    },
    // Sleep challenge
    {
      id: `sleep_${today}`,
      type: 'sleep',
      title: 'Rest Champion',
      titleMy: 'အိပ်စက်မှုချန်ပီယံ',
      description: `Get ${sleepGoal} hours of quality sleep`,
      descriptionMy: `အရည်အသွေးကောင်း အိပ်စက်မှု ${sleepGoal} နာရီရယူပါ`,
      target: sleepGoal,
      current: 0,
      unit: 'hours',
      unitMy: 'နာရီ',
      points: 35,
      completed: false,
      icon: '😴',
      color: '#9B59B6',
    },
    // Focus challenge
    {
      id: `focus_${today}`,
      type: 'focus',
      title: 'Focus Master',
      titleMy: 'အာရုံစူးစိုက်မှုဆရာ',
      description: `Complete ${focusGoal} minutes of focused work`,
      descriptionMy: `အာရုံစူးစိုက်အလုပ် ${focusGoal} မိနစ်ပြီးမြောက်ပါ`,
      target: focusGoal,
      current: 0,
      unit: 'min',
      unitMy: 'မိနစ်',
      points: 25,
      completed: false,
      icon: '🎯',
      color: '#E74C3C',
    },
  ];

  // Add bonus combo challenge based on day
  const comboChallenges: DailyChallenge[] = [
    {
      id: `combo_morning_${today}`,
      type: 'combo',
      title: 'Morning Ritual',
      titleMy: 'မနက်ခင်းအလေ့အထ',
      description: 'Drink 500ml water before 9 AM',
      descriptionMy: 'မနက် ၉ နာရီမတိုင်မီ ရေ 500ml သောက်ပါ',
      target: 500,
      current: 0,
      unit: 'ml',
      unitMy: 'မီလီလီတာ',
      points: 15,
      completed: false,
      icon: '🌅',
      color: '#F39C12',
    },
    {
      id: `combo_productive_${today}`,
      type: 'combo',
      title: 'Productivity Burst',
      titleMy: 'ထုတ်လုပ်နိုင်စွမ်းပေါက်ကွဲမှု',
      description: 'Complete 3 focus sessions',
      descriptionMy: 'အာရုံစူးစိုက်မှု ၃ ကြိမ်ပြီးမြောက်ပါ',
      target: 3,
      current: 0,
      unit: 'sessions',
      unitMy: 'အကြိမ်',
      points: 20,
      completed: false,
      icon: '🚀',
      color: '#1ABC9C',
    },
    {
      id: `combo_balance_${today}`,
      type: 'combo',
      title: 'Perfect Balance',
      titleMy: 'ပြည့်စုံသောဟန်ချက်',
      description: 'Achieve 70%+ in all three areas',
      descriptionMy: 'နယ်ပယ်သုံးခုလုံးတွင် ၇၀%+ ရရှိပါ',
      target: 70,
      current: 0,
      unit: '%',
      unitMy: '%',
      points: 25,
      completed: false,
      icon: '⚖️',
      color: '#8E44AD',
    },
  ];

  // Add one combo challenge based on day of week
  challenges.push(comboChallenges[dayOfWeek % comboChallenges.length]);

  return challenges;
};

// ============ INSIGHTS GENERATION ============

export const generateWellnessInsights = (
  score: WellnessScore,
  history: WellnessHistory[],
  isBurmese: boolean
): WellnessInsight[] => {
  const insights: WellnessInsight[] = [];
  const { metrics, breakdown } = score;

  // Score-based insights
  if (score.overall >= 90) {
    insights.push({
      id: 'excellent_score',
      type: 'achievement',
      priority: 'high',
      icon: '🏆',
      title: 'Excellent Wellness!',
      titleMy: 'အံ့သြဖွယ်ကျန်းမာရေး!',
      message: "You're crushing it! Your wellness score is in the top tier.",
      messageMy: 'သင်အရမ်းကောင်းနေပါတယ်! သင့်ကျန်းမာရေးရမှတ်သည် အမြင့်ဆုံးအဆင့်တွင်ရှိသည်။',
    });
  } else if (score.overall < 50) {
    insights.push({
      id: 'low_score',
      type: 'warning',
      priority: 'high',
      icon: '⚠️',
      title: 'Room for Improvement',
      titleMy: 'တိုးတက်ရန်အခွင့်အလမ်း',
      message: 'Your wellness score needs attention. Focus on one area at a time.',
      messageMy: 'သင့်ကျန်းမာရေးရမှတ်ကို ဂရုစိုက်ရန်လိုသည်။ တစ်ခုချင်းစီကို အာရုံစိုက်ပါ။',
      actionable: true,
      action: 'Start with hydration',
      actionMy: 'ရေသောက်ခြင်းဖြင့် စတင်ပါ',
    });
  }

  // Water insights
  if (breakdown.water < 50) {
    insights.push({
      id: 'low_water',
      type: 'tip',
      priority: 'high',
      icon: '💧',
      title: 'Hydration Alert',
      titleMy: 'ရေဓာတ်သတိပေးချက်',
      message: 'Your water intake is below target. Dehydration affects focus and sleep quality.',
      messageMy: 'သင့်ရေသောက်မှုသည် ပန်းတိုင်အောက်တွင်ရှိသည်။ ရေဓာတ်ခန်းခြောက်မှုသည် အာရုံစူးစိုက်မှုနှင့် အိပ်စက်မှုအရည်အသွေးကို ထိခိုက်စေသည်။',
      actionable: true,
      action: 'Drink a glass now',
      actionMy: 'ယခုရေတစ်ခွက်သောက်ပါ',
    });
  }

  // Sleep insights
  if (breakdown.sleep < 60) {
    insights.push({
      id: 'low_sleep',
      type: 'tip',
      priority: 'high',
      icon: '😴',
      title: 'Sleep Quality Matters',
      titleMy: 'အိပ်စက်မှုအရည်အသွေးအရေးကြီးသည်',
      message: 'Poor sleep affects both hydration needs and focus ability.',
      messageMy: 'အိပ်စက်မှုညံ့ဖျင်းခြင်းသည် ရေဓာတ်လိုအပ်ချက်နှင့် အာရုံစူးစိုက်နိုင်စွမ်းကို ထိခိုက်စေသည်။',
    });
  }

  // Focus insights
  if (breakdown.focus >= 80) {
    insights.push({
      id: 'great_focus',
      type: 'achievement',
      priority: 'medium',
      icon: '🎯',
      title: 'Focus Champion!',
      titleMy: 'အာရုံစူးစိုက်မှုချန်ပီယံ!',
      message: "Your focus game is strong! You're in the productivity zone.",
      messageMy: 'သင့်အာရုံစူးစိုက်မှုအားကောင်းသည်! ထုတ်လုပ်နိုင်စွမ်းဇုန်တွင်ရှိသည်။',
    });
  }

  // Correlation insights
  if (breakdown.water >= 70 && breakdown.sleep >= 70) {
    insights.push({
      id: 'water_sleep_correlation',
      type: 'correlation',
      priority: 'medium',
      icon: '🔗',
      title: 'Positive Correlation',
      titleMy: 'အပြုသဘောဆက်စပ်မှု',
      message: 'Good hydration is helping your sleep quality. Keep it up!',
      messageMy: 'ကောင်းမွန်သောရေဓာတ်သည် သင့်အိပ်စက်မှုအရည်အသွေးကို ကူညီနေသည်။ ဆက်လက်ထိန်းထားပါ!',
    });
  }

  // Pattern insights from history
  if (history.length >= 7) {
    const recentScores = history.slice(0, 7).map((h) => h.score);
    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const trend = recentScores[0] > avgScore ? 'improving' : recentScores[0] < avgScore ? 'declining' : 'stable';

    if (trend === 'improving') {
      insights.push({
        id: 'improving_trend',
        type: 'pattern',
        priority: 'medium',
        icon: '📈',
        title: 'Upward Trend!',
        titleMy: 'တိုးတက်နေသည်!',
        message: 'Your wellness score has been improving this week. Great progress!',
        messageMy: 'ဤအပတ်သင့်ကျန်းမာရေးရမှတ်တိုးတက်နေသည်။ ကောင်းမွန်သောတိုးတက်မှု!',
      });
    }
  }

  // Balance insight
  const scores = [breakdown.water, breakdown.sleep, breakdown.focus];
  const maxDiff = Math.max(...scores) - Math.min(...scores);
  if (maxDiff > 40) {
    insights.push({
      id: 'imbalance',
      type: 'tip',
      priority: 'medium',
      icon: '⚖️',
      title: 'Balance Your Wellness',
      titleMy: 'သင့်ကျန်းမာရေးကို ဟန်ချက်ညီအောင်လုပ်ပါ',
      message: 'Your wellness areas are imbalanced. Try to improve your weakest area.',
      messageMy: 'သင့်ကျန်းမာရေးနယ်ပယ်များ မညီမျှပါ။ အားအနည်းဆုံးနယ်ပယ်ကို တိုးတက်အောင်ကြိုးစားပါ။',
    });
  }

  return insights.slice(0, 5); // Return top 5 insights
};

// ============ STORAGE FUNCTIONS ============

export const loadWellnessHistory = async (): Promise<WellnessHistory[]> => {
  try {
    const data = await AsyncStorage.getItem(WELLNESS_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveWellnessHistory = async (entry: WellnessHistory): Promise<void> => {
  const history = await loadWellnessHistory();
  const existingIndex = history.findIndex((h) => h.date === entry.date);
  if (existingIndex >= 0) {
    history[existingIndex] = entry;
  } else {
    history.unshift(entry);
  }
  // Keep last 90 days
  const trimmed = history.slice(0, 90);
  await AsyncStorage.setItem(WELLNESS_HISTORY_KEY, JSON.stringify(trimmed));
};

export const loadDailyChallenges = async (): Promise<DailyChallengesData | null> => {
  try {
    const data = await AsyncStorage.getItem(DAILY_CHALLENGES_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    const today = new Date().toISOString().split('T')[0];
    // Return null if challenges are from a different day
    if (parsed.date !== today) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveDailyChallenges = async (data: DailyChallengesData): Promise<void> => {
  await AsyncStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(data));
};

// ============ HELPER FUNCTIONS ============

export const formatScore = (score: number): string => {
  return score.toFixed(0);
};

export const getWeeklyAverage = (history: WellnessHistory[]): number => {
  const weekData = history.slice(0, 7);
  if (weekData.length === 0) return 0;
  return Math.round(weekData.reduce((sum, h) => sum + h.score, 0) / weekData.length);
};

export const getStreakDays = (history: WellnessHistory[], threshold: number = 70): number => {
  let streak = 0;
  for (const entry of history) {
    if (entry.score >= threshold) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export const getChallengeProgress = (challenges: DailyChallenge[]): number => {
  const completed = challenges.filter((c) => c.completed).length;
  return Math.round((completed / challenges.length) * 100);
};
