import { calculateStats, DailyWaterRecord, getLastNDays } from './waterHistory';

export interface Insight {
  id: string;
  type: 'tip' | 'achievement' | 'warning' | 'motivation' | 'pattern';
  icon: string;
  title: string;
  titleMy: string;
  message: string;
  messageMy: string;
  priority: number;
}

export const generateAIInsights = async (
  dailyGoal: number,
  currentIntake: number
): Promise<Insight[]> => {
  const insights: Insight[] = [];
  const stats = await calculateStats(dailyGoal);
  const last7Days = await getLastNDays(7);
  const last30Days = await getLastNDays(30);
  const now = new Date();
  const currentHour = now.getHours();

  // Analyze patterns
  const weekdayAvg = calculateWeekdayAverage(last30Days);
  const weekendAvg = calculateWeekendAverage(last30Days);
  const morningIntake = calculateTimeRangeIntake(last7Days, 6, 12);
  const afternoonIntake = calculateTimeRangeIntake(last7Days, 12, 18);
  const eveningIntake = calculateTimeRangeIntake(last7Days, 18, 22);
  const progress = currentIntake / dailyGoal;

  // Streak-based insights
  if (stats.currentStreak >= 7) {
    insights.push({
      id: 'streak_celebration',
      type: 'achievement',
      icon: '🔥',
      title: 'On Fire!',
      titleMy: 'မီးတောက်နေပြီ!',
      message: `Amazing ${stats.currentStreak}-day streak! You're building a powerful habit.`,
      messageMy: `အံ့သြစရာ ${stats.currentStreak} ရက်ဆက်တိုက်! ကောင်းမွန်သောအလေ့အထတည်ဆောက်နေပါပြီ။`,
      priority: 1,
    });
  } else if (stats.currentStreak >= 3) {
    insights.push({
      id: 'streak_building',
      type: 'motivation',
      icon: '💪',
      title: 'Keep Going!',
      titleMy: 'ဆက်လက်ကြိုးစားပါ!',
      message: `${stats.currentStreak} days strong! Just ${7 - stats.currentStreak} more days to a week streak.`,
      messageMy: `${stats.currentStreak} ရက်ကြံ့ခိုင်နေပြီ! တစ်ပတ်ပြည့်ဖို့ ${7 - stats.currentStreak} ရက်သာလိုတော့သည်။`,
      priority: 2,
    });
  }

  // Weekend vs Weekday pattern
  if (weekendAvg < weekdayAvg * 0.7) {
    insights.push({
      id: 'weekend_dip',
      type: 'pattern',
      icon: '📉',
      title: 'Weekend Pattern Detected',
      titleMy: 'စနေ/တနင်္ဂနွေပုံစံတွေ့ရှိ',
      message: 'Your hydration drops on weekends. Try keeping a water bottle nearby during leisure time!',
      messageMy: 'စနေ/တနင်္ဂနွေတွင် ရေသောက်မှုကျဆင်းသည်။ အနားယူချိန်တွင် ရေပုလင်းနီးနီးထားပါ!',
      priority: 3,
    });
  }


  // Time-based insights
  if (morningIntake < afternoonIntake * 0.5 && morningIntake < eveningIntake * 0.5) {
    insights.push({
      id: 'morning_hydration',
      type: 'tip',
      icon: '🌅',
      title: 'Morning Boost Needed',
      titleMy: 'မနက်ခင်းအားဖြည့်လိုအပ်',
      message: 'You drink less in the morning. Starting your day with water boosts metabolism by 30%!',
      messageMy: 'မနက်ခင်းတွင် ရေနည်းနည်းသောက်သည်။ မနက်ခင်းရေသောက်ခြင်းသည် ဇီဝကမ္မဖြစ်စဉ်ကို ၃၀% မြှင့်တင်ပေးသည်!',
      priority: 4,
    });
  }

  // Progress-based insights
  if (currentHour >= 12 && currentHour < 18 && progress < 0.4) {
    insights.push({
      id: 'midday_catchup',
      type: 'warning',
      icon: '⏰',
      title: 'Time to Catch Up',
      titleMy: 'လိုက်မီအောင်လုပ်ချိန်',
      message: `You're at ${Math.round(progress * 100)}% of your goal. Aim for 50% by mid-afternoon!`,
      messageMy: `ပန်းတိုင်၏ ${Math.round(progress * 100)}% ရောက်နေပါပြီ။ နေ့လည်ခင်းတွင် ၅၀% ရောက်အောင်ကြိုးစားပါ!`,
      priority: 2,
    });
  } else if (currentHour >= 18 && progress < 0.7) {
    insights.push({
      id: 'evening_push',
      type: 'warning',
      icon: '🌙',
      title: 'Evening Push',
      titleMy: 'ညနေပိုင်းအားထုတ်မှု',
      message: `${Math.round((1 - progress) * dailyGoal)}ml to go before bedtime. You can do it!`,
      messageMy: `အိပ်ချိန်မတိုင်မီ ${Math.round((1 - progress) * dailyGoal)} မီလီလီတာကျန်သည်။ သင်လုပ်နိုင်ပါတယ်!`,
      priority: 1,
    });
  }

  // Goal completion rate insights
  if (stats.goalCompletionRate >= 80) {
    insights.push({
      id: 'high_achiever',
      type: 'achievement',
      icon: '🏆',
      title: 'Hydration Champion',
      titleMy: 'ရေသောက်ချန်ပီယံ',
      message: `You hit your goal ${stats.goalCompletionRate}% of the time. Outstanding consistency!`,
      messageMy: `${stats.goalCompletionRate}% အချိန်တွင် ပန်းတိုင်ရောက်ခဲ့သည်။ ထူးချွန်သောတသမတ်တည်းမှု!`,
      priority: 3,
    });
  } else if (stats.goalCompletionRate < 50) {
    insights.push({
      id: 'improvement_needed',
      type: 'tip',
      icon: '💡',
      title: 'Room to Grow',
      titleMy: 'တိုးတက်ရန်အခွင့်အလမ်း',
      message: 'Try setting smaller, more frequent reminders. Small sips throughout the day add up!',
      messageMy: 'သေးငယ်သော၊ မကြာခဏသတိပေးချက်များသတ်မှတ်ကြည့်ပါ။ တစ်နေ့တာလုံး အနည်းငယ်စီသောက်ခြင်းသည် စုပေါင်းလာပါမည်!',
      priority: 4,
    });
  }

  // Trending insights
  const thisWeekAvg = last7Days.reduce((sum, d) => sum + d.intake, 0) / 7;
  const lastWeekData = last30Days.slice(7, 14);
  const lastWeekAvg = lastWeekData.length > 0 
    ? lastWeekData.reduce((sum, d) => sum + d.intake, 0) / lastWeekData.length 
    : thisWeekAvg;

  if (thisWeekAvg > lastWeekAvg * 1.1) {
    insights.push({
      id: 'trending_up',
      type: 'achievement',
      icon: '📈',
      title: 'Trending Up!',
      titleMy: 'တိုးတက်နေသည်!',
      message: 'Your hydration improved this week compared to last week. Great progress!',
      messageMy: 'ယခင်အပတ်နှင့်နှိုင်းယှဉ်လျှင် ဤအပတ်ရေသောက်မှုတိုးတက်လာပါပြီ။ ကောင်းသောတိုးတက်မှု!',
      priority: 3,
    });
  }

  // Health tips rotation
  const healthTips = getRotatingHealthTip(now.getDay());
  insights.push(healthTips);

  // Sort by priority and return top insights
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 3);
};

const calculateWeekdayAverage = (records: DailyWaterRecord[]): number => {
  const weekdays = records.filter((r) => {
    const day = new Date(r.date).getDay();
    return day !== 0 && day !== 6;
  });
  return weekdays.length > 0 ? weekdays.reduce((sum, r) => sum + r.intake, 0) / weekdays.length : 0;
};

const calculateWeekendAverage = (records: DailyWaterRecord[]): number => {
  const weekends = records.filter((r) => {
    const day = new Date(r.date).getDay();
    return day === 0 || day === 6;
  });
  return weekends.length > 0 ? weekends.reduce((sum, r) => sum + r.intake, 0) / weekends.length : 0;
};

const calculateTimeRangeIntake = (records: DailyWaterRecord[], startHour: number, endHour: number): number => {
  let total = 0;
  let count = 0;
  records.forEach((record) => {
    record.entries.forEach((entry) => {
      const hour = parseInt(entry.time.split(':')[0], 10);
      if (hour >= startHour && hour < endHour) {
        total += entry.amount;
        count++;
      }
    });
  });
  return count > 0 ? total / records.length : 0;
};

const getRotatingHealthTip = (dayOfWeek: number): Insight => {
  const tips: Insight[] = [
    { id: 'tip_meal', type: 'tip', icon: '🍽️', title: 'Meal Tip', titleMy: 'အစားအသောက်အကြံပြုချက်', message: 'Drink water 30 minutes before meals to aid digestion and feel fuller.', messageMy: 'အစာမစားခင် ၃၀ မိနစ်အလိုတွင် ရေသောက်ပါ။ အစာခြေရန်အထောက်အကူဖြစ်သည်။', priority: 5 },
    { id: 'tip_exercise', type: 'tip', icon: '🏃', title: 'Exercise Tip', titleMy: 'လေ့ကျင့်ခန်းအကြံပြုချက်', message: 'Increase intake by 500ml on workout days to stay properly hydrated.', messageMy: 'လေ့ကျင့်ခန်းလုပ်သောနေ့တွင် ရေ ၅၀၀ မီလီလီတာပိုသောက်ပါ။', priority: 5 },
    { id: 'tip_skin', type: 'tip', icon: '✨', title: 'Beauty Tip', titleMy: 'အလှအပအကြံပြုချက်', message: 'Proper hydration helps maintain healthy, glowing skin!', messageMy: 'ရေလုံလုံလောက်လောက်သောက်ခြင်းသည် အသားအရေကျန်းမာတောက်ပစေသည်!', priority: 5 },
    { id: 'tip_energy', type: 'tip', icon: '⚡', title: 'Energy Tip', titleMy: 'စွမ်းအင်အကြံပြုချက်', message: 'Feeling tired? Dehydration is often the cause. Drink up for natural energy!', messageMy: 'ပင်ပန်းနေသလား? ရေဓာတ်ခန်းခြောက်မှုကြောင့်ဖြစ်တတ်သည်။ သဘာဝစွမ်းအင်အတွက် ရေသောက်ပါ!', priority: 5 },
    { id: 'tip_focus', type: 'tip', icon: '🧠', title: 'Focus Tip', titleMy: 'အာရုံစူးစိုက်မှုအကြံပြုချက်', message: 'Even mild dehydration affects concentration. Stay sharp, stay hydrated!', messageMy: 'အနည်းငယ်ရေဓာတ်ခန်းခြောက်ရုံနှင့်ပင် အာရုံစူးစိုက်မှုကိုထိခိုက်နိုင်သည်။', priority: 5 },
    { id: 'tip_sleep', type: 'tip', icon: '😴', title: 'Sleep Tip', titleMy: 'အိပ်စက်မှုအကြံပြုချက်', message: 'Avoid drinking too much water 2 hours before bed for better sleep quality.', messageMy: 'အိပ်ချိန်မတိုင်မီ ၂ နာရီအတွင်း ရေများများမသောက်ပါနှင့်။ အိပ်စက်မှုအရည်အသွေးကောင်းစေသည်။', priority: 5 },
    { id: 'tip_morning', type: 'tip', icon: '🌅', title: 'Morning Tip', titleMy: 'မနက်ခင်းအကြံပြုချက်', message: 'Start your day with a glass of water to kickstart your metabolism!', messageMy: 'မနက်ခင်းရေတစ်ခွက်နှင့် သင့်ဇီဝကမ္မဖြစ်စဉ်ကိုစတင်ပါ!', priority: 5 },
  ];
  return tips[dayOfWeek];
};
