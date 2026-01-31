import { calculateStats, getLastNDays } from './waterHistory';

export interface Insight {
  id: string;
  type: 'tip' | 'achievement' | 'warning' | 'motivation';
  icon: string;
  title: string;
  message: string;
  priority: number;
}

export const generateInsights = async (dailyGoal: number): Promise<Insight[]> => {
  const insights: Insight[] = [];
  const stats = await calculateStats(dailyGoal);
  const last7Days = await getLastNDays(7);
  const last3Days = await getLastNDays(3);
  const today = last7Days[last7Days.length - 1];
  const currentHour = new Date().getHours();

  // Streak achievements
  if (stats.currentStreak >= 7) {
    insights.push({
      id: 'streak_week',
      type: 'achievement',
      icon: '🏆',
      title: 'Week Warrior!',
      message: `Incredible! You've maintained a ${stats.currentStreak}-day streak. You're building a healthy habit!`,
      priority: 1,
    });
  } else if (stats.currentStreak >= 3) {
    insights.push({
      id: 'streak_3day',
      type: 'achievement',
      icon: '🔥',
      title: 'On Fire!',
      message: `${stats.currentStreak} days in a row! Keep the momentum going!`,
      priority: 2,
    });
  }

  // Goal completion rate insights
  if (stats.goalCompletionRate >= 80) {
    insights.push({
      id: 'high_completion',
      type: 'achievement',
      icon: '⭐',
      title: 'Hydration Champion',
      message: `You've hit your goal ${stats.goalCompletionRate}% of the time. Outstanding consistency!`,
      priority: 2,
    });
  } else if (stats.goalCompletionRate < 50 && stats.totalDaysTracked > 3) {
    insights.push({
      id: 'low_completion',
      type: 'motivation',
      icon: '💪',
      title: 'Room to Grow',
      message: 'Try setting reminders throughout the day. Small sips add up!',
      priority: 3,
    });
  }

  // Time-based insights
  if (currentHour >= 6 && currentHour < 10 && today.intake < dailyGoal * 0.2) {
    insights.push({
      id: 'morning_hydration',
      type: 'tip',
      icon: '🌅',
      title: 'Morning Boost',
      message: 'Start your day with a glass of water to kickstart your metabolism!',
      priority: 1,
    });
  }

  if (currentHour >= 14 && currentHour < 17 && today.intake < dailyGoal * 0.5) {
    insights.push({
      id: 'afternoon_reminder',
      type: 'warning',
      icon: '⚠️',
      title: 'Catch Up Time',
      message: `You're at ${Math.round((today.intake / dailyGoal) * 100)}% of your goal. Time to hydrate!`,
      priority: 1,
    });
  }

  if (currentHour >= 20 && today.intake < dailyGoal * 0.8) {
    insights.push({
      id: 'evening_push',
      type: 'motivation',
      icon: '🌙',
      title: 'Final Push',
      message: `Just ${Math.round(dailyGoal - today.intake)}ml to go! You can do it!`,
      priority: 1,
    });
  }

  // Pattern analysis
  const avgIntake = last7Days.reduce((sum, d) => sum + d.intake, 0) / 7;
  const weekendDays = last7Days.filter((d) => {
    const day = new Date(d.date).getDay();
    return day === 0 || day === 6;
  });
  const weekdayDays = last7Days.filter((d) => {
    const day = new Date(d.date).getDay();
    return day !== 0 && day !== 6;
  });

  const weekendAvg = weekendDays.length > 0 
    ? weekendDays.reduce((sum, d) => sum + d.intake, 0) / weekendDays.length 
    : 0;
  const weekdayAvg = weekdayDays.length > 0 
    ? weekdayDays.reduce((sum, d) => sum + d.intake, 0) / weekdayDays.length 
    : 0;

  if (weekendAvg < weekdayAvg * 0.7 && weekendDays.length >= 2) {
    insights.push({
      id: 'weekend_pattern',
      type: 'tip',
      icon: '📅',
      title: 'Weekend Dip',
      message: 'Your weekend hydration drops. Try keeping a water bottle nearby during leisure time!',
      priority: 3,
    });
  }

  // Improvement tracking
  const firstHalf = last7Days.slice(0, 3);
  const secondHalf = last7Days.slice(4);
  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.intake, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.intake, 0) / secondHalf.length;

  if (secondHalfAvg > firstHalfAvg * 1.2) {
    insights.push({
      id: 'improving',
      type: 'achievement',
      icon: '📈',
      title: 'Trending Up!',
      message: 'Your hydration has improved this week. Great progress!',
      priority: 2,
    });
  }

  // Health tips rotation
  const healthTips: Insight[] = [
    {
      id: 'tip_meals',
      type: 'tip',
      icon: '🍽️',
      title: 'Meal Tip',
      message: 'Drink a glass of water 30 minutes before meals to aid digestion.',
      priority: 4,
    },
    {
      id: 'tip_exercise',
      type: 'tip',
      icon: '🏃',
      title: 'Exercise Tip',
      message: 'Increase water intake by 500ml on workout days to stay properly hydrated.',
      priority: 4,
    },
    {
      id: 'tip_skin',
      type: 'tip',
      icon: '✨',
      title: 'Beauty Tip',
      message: 'Proper hydration helps maintain healthy, glowing skin!',
      priority: 4,
    },
    {
      id: 'tip_energy',
      type: 'tip',
      icon: '⚡',
      title: 'Energy Tip',
      message: 'Feeling tired? Dehydration is often the cause. Drink up for natural energy!',
      priority: 4,
    },
    {
      id: 'tip_focus',
      type: 'tip',
      icon: '🧠',
      title: 'Focus Tip',
      message: 'Even mild dehydration can affect concentration. Stay sharp, stay hydrated!',
      priority: 4,
    },
  ];

  // Add one random health tip
  const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];
  insights.push(randomTip);

  // Sort by priority and return top insights
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
};

// Get personalized greeting based on patterns
export const getPersonalizedGreeting = async (name: string, dailyGoal: number): Promise<string> => {
  const stats = await calculateStats(dailyGoal);
  const hour = new Date().getHours();
  
  let timeGreeting = '';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 18) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  if (stats.currentStreak >= 7) {
    return `${timeGreeting}, ${name}! 🏆 Week ${Math.floor(stats.currentStreak / 7)} champion!`;
  } else if (stats.currentStreak >= 3) {
    return `${timeGreeting}, ${name}! 🔥 ${stats.currentStreak}-day streak!`;
  } else if (stats.goalCompletionRate >= 80) {
    return `${timeGreeting}, ${name}! ⭐ Hydration pro!`;
  }
  
  return `${timeGreeting}, ${name}! 💧`;
};
