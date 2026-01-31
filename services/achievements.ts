import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = 'user_achievements';

export interface Achievement {
  id: string;
  title: string;
  titleMy: string;
  description: string;
  descriptionMy: string;
  icon: string;
  category: 'streak' | 'volume' | 'consistency' | 'special';
  requirement: number;
  unlockedAt?: string;
  progress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak Achievements
  { id: 'streak_3', title: 'Getting Started', titleMy: 'စတင်ခြင်း', description: 'Maintain a 3-day streak', descriptionMy: '၃ ရက်ဆက်တိုက်ထိန်းထားပါ', icon: '🌱', category: 'streak', requirement: 3, progress: 0 },
  { id: 'streak_7', title: 'Week Warrior', titleMy: 'တစ်ပတ်တာစစ်သည်', description: 'Maintain a 7-day streak', descriptionMy: '၇ ရက်ဆက်တိုက်ထိန်းထားပါ', icon: '🔥', category: 'streak', requirement: 7, progress: 0 },
  { id: 'streak_14', title: 'Fortnight Fighter', titleMy: 'နှစ်ပတ်တာတိုက်ခိုက်သူ', description: 'Maintain a 14-day streak', descriptionMy: '၁၄ ရက်ဆက်တိုက်ထိန်းထားပါ', icon: '⚡', category: 'streak', requirement: 14, progress: 0 },
  { id: 'streak_30', title: 'Monthly Master', titleMy: 'တစ်လတာကျွမ်းကျင်သူ', description: 'Maintain a 30-day streak', descriptionMy: '၃၀ ရက်ဆက်တိုက်ထိန်းထားပါ', icon: '👑', category: 'streak', requirement: 30, progress: 0 },
  { id: 'streak_100', title: 'Hydration Legend', titleMy: 'ရေသောက်ဒဏ္ဍာရီ', description: 'Maintain a 100-day streak', descriptionMy: '၁၀၀ ရက်ဆက်တိုက်ထိန်းထားပါ', icon: '🏆', category: 'streak', requirement: 100, progress: 0 },

  // Volume Achievements
  { id: 'volume_10', title: 'First Steps', titleMy: 'ပထမခြေလှမ်း', description: 'Drink 10 liters total', descriptionMy: 'စုစုပေါင်း ၁၀ လီတာသောက်ပါ', icon: '💧', category: 'volume', requirement: 10000, progress: 0 },
  { id: 'volume_50', title: 'Hydration Enthusiast', titleMy: 'ရေသောက်ဝါသနာရှင်', description: 'Drink 50 liters total', descriptionMy: 'စုစုပေါင်း ၅၀ လီတာသောက်ပါ', icon: '🌊', category: 'volume', requirement: 50000, progress: 0 },
  { id: 'volume_100', title: 'Century Club', titleMy: 'ရာစုကလပ်', description: 'Drink 100 liters total', descriptionMy: 'စုစုပေါင်း ၁၀၀ လီတာသောက်ပါ', icon: '💎', category: 'volume', requirement: 100000, progress: 0 },
  { id: 'volume_500', title: 'Ocean Explorer', titleMy: 'သမုဒ္ဒရာစူးစမ်းသူ', description: 'Drink 500 liters total', descriptionMy: 'စုစုပေါင်း ၅၀၀ လီတာသောက်ပါ', icon: '🐋', category: 'volume', requirement: 500000, progress: 0 },

  // Consistency Achievements
  { id: 'goal_10', title: 'Goal Getter', titleMy: 'ပန်းတိုင်ရောက်သူ', description: 'Reach daily goal 10 times', descriptionMy: 'နေ့စဉ်ပန်းတိုင် ၁၀ ကြိမ်ရောက်ပါ', icon: '🎯', category: 'consistency', requirement: 10, progress: 0 },
  { id: 'goal_50', title: 'Consistent Champion', titleMy: 'တသမတ်တည်းချန်ပီယံ', description: 'Reach daily goal 50 times', descriptionMy: 'နေ့စဉ်ပန်းတိုင် ၅၀ ကြိမ်ရောက်ပါ', icon: '🏅', category: 'consistency', requirement: 50, progress: 0 },
  { id: 'goal_100', title: 'Hydration Hero', titleMy: 'ရေသောက်သူရဲကောင်း', description: 'Reach daily goal 100 times', descriptionMy: 'နေ့စဉ်ပန်းတိုင် ၁၀၀ ကြိမ်ရောက်ပါ', icon: '🦸', category: 'consistency', requirement: 100, progress: 0 },

  // Special Achievements
  { id: 'early_bird', title: 'Early Bird', titleMy: 'စောစောထသူ', description: 'Drink water before 7 AM', descriptionMy: 'မနက် ၇ နာရီမတိုင်မီ ရေသောက်ပါ', icon: '🌅', category: 'special', requirement: 1, progress: 0 },
  { id: 'perfect_week', title: 'Perfect Week', titleMy: 'ပြည့်စုံသောအပတ်', description: 'Hit 100% goal for 7 consecutive days', descriptionMy: '၇ ရက်ဆက်တိုက် ပန်းတိုင် ၁၀၀% ရောက်ပါ', icon: '⭐', category: 'special', requirement: 7, progress: 0 },
  { id: 'overachiever', title: 'Overachiever', titleMy: 'ပိုမိုအောင်မြင်သူ', description: 'Exceed daily goal by 50%', descriptionMy: 'နေ့စဉ်ပန်းတိုင်ထက် ၅၀% ကျော်ပါ', icon: '🚀', category: 'special', requirement: 1, progress: 0 },
];


export interface UserAchievements {
  unlocked: string[];
  progress: Record<string, number>;
  totalVolume: number;
  totalGoalsReached: number;
  lastUpdated: string;
}

export const getAchievements = async (): Promise<UserAchievements> => {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : { unlocked: [], progress: {}, totalVolume: 0, totalGoalsReached: 0, lastUpdated: '' };
  } catch {
    return { unlocked: [], progress: {}, totalVolume: 0, totalGoalsReached: 0, lastUpdated: '' };
  }
};

export const saveAchievements = async (achievements: UserAchievements): Promise<void> => {
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
};

export const checkAndUnlockAchievements = async (
  currentStreak: number,
  totalVolume: number,
  totalGoalsReached: number,
  todayIntake: number,
  dailyGoal: number
): Promise<Achievement[]> => {
  const userAchievements = await getAchievements();
  const newlyUnlocked: Achievement[] = [];
  const now = new Date();

  // Update totals
  userAchievements.totalVolume = totalVolume;
  userAchievements.totalGoalsReached = totalGoalsReached;

  for (const achievement of ACHIEVEMENTS) {
    if (userAchievements.unlocked.includes(achievement.id)) continue;

    let shouldUnlock = false;
    let progress = 0;

    switch (achievement.category) {
      case 'streak':
        progress = currentStreak;
        shouldUnlock = currentStreak >= achievement.requirement;
        break;
      case 'volume':
        progress = totalVolume;
        shouldUnlock = totalVolume >= achievement.requirement;
        break;
      case 'consistency':
        progress = totalGoalsReached;
        shouldUnlock = totalGoalsReached >= achievement.requirement;
        break;
      case 'special':
        if (achievement.id === 'early_bird') {
          shouldUnlock = now.getHours() < 7 && todayIntake > 0;
          progress = shouldUnlock ? 1 : 0;
        } else if (achievement.id === 'overachiever') {
          shouldUnlock = todayIntake >= dailyGoal * 1.5;
          progress = shouldUnlock ? 1 : 0;
        }
        break;
    }

    userAchievements.progress[achievement.id] = progress;

    if (shouldUnlock) {
      userAchievements.unlocked.push(achievement.id);
      newlyUnlocked.push({ ...achievement, unlockedAt: now.toISOString(), progress });
    }
  }

  userAchievements.lastUpdated = now.toISOString();
  await saveAchievements(userAchievements);

  return newlyUnlocked;
};

export const getAchievementProgress = async (): Promise<(Achievement & { isUnlocked: boolean })[]> => {
  const userAchievements = await getAchievements();
  
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    progress: userAchievements.progress[achievement.id] || 0,
    isUnlocked: userAchievements.unlocked.includes(achievement.id),
    unlockedAt: userAchievements.unlocked.includes(achievement.id) 
      ? userAchievements.lastUpdated 
      : undefined,
  }));
};
