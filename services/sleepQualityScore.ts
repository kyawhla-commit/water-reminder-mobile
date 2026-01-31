import { SleepRecord } from '@/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSleepRecords } from './sleep';

const SLEEP_SCORE_KEY = '@hydromate_sleep_score';

export interface SleepScoreBreakdown {
  duration: number; // 0-25 points
  consistency: number; // 0-25 points
  timing: number; // 0-25 points
  quality: number; // 0-25 points
}

export interface SleepQualityScore {
  totalScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: SleepScoreBreakdown;
  trend: 'improving' | 'declining' | 'stable';
  insights: SleepInsight[];
  recommendations: SleepRecommendation[];
  streakDays: number;
  lastUpdated: string;
}

export interface SleepInsight {
  type: 'positive' | 'negative' | 'neutral';
  category: 'duration' | 'consistency' | 'timing' | 'quality';
  title: string;
  titleMy: string;
  message: string;
  messageMy: string;
  icon: string;
}

export interface SleepRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  titleMy: string;
  description: string;
  descriptionMy: string;
  icon: string;
}

export interface DailySleepAnalysis {
  date: string;
  score: number;
  duration: number;
  bedtime: string;
  wakeTime: string;
  quality: number | null;
}

// Optimal sleep parameters
const OPTIMAL_SLEEP_DURATION = 480; // 8 hours in minutes
const MIN_GOOD_SLEEP = 420; // 7 hours
const MAX_GOOD_SLEEP = 540; // 9 hours
const OPTIMAL_BEDTIME_HOUR = 22; // 10 PM
const OPTIMAL_WAKE_HOUR = 6; // 6 AM

// Calculate duration score (0-25)
const calculateDurationScore = (avgDuration: number): number => {
  if (avgDuration >= MIN_GOOD_SLEEP && avgDuration <= MAX_GOOD_SLEEP) {
    return 25;
  }
  
  const deviation = avgDuration < MIN_GOOD_SLEEP 
    ? MIN_GOOD_SLEEP - avgDuration 
    : avgDuration - MAX_GOOD_SLEEP;
  
  const penalty = Math.min(deviation / 60, 1) * 15; // Max 15 point penalty
  return Math.max(0, 25 - penalty);
};

// Calculate consistency score (0-25) based on standard deviation
const calculateConsistencyScore = (records: SleepRecord[]): number => {
  if (records.length < 3) return 15; // Default score if not enough data
  
  const durations = records.map(r => r.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation = higher score
  // stdDev of 0 = 25 points, stdDev of 120+ = 0 points
  const score = Math.max(0, 25 - (stdDev / 120) * 25);
  return Math.round(score);
};

// Calculate timing score (0-25) based on bedtime consistency
const calculateTimingScore = (records: SleepRecord[]): number => {
  if (records.length < 2) return 15;
  
  const bedtimes = records.map(r => {
    const start = new Date(r.startTime);
    return start.getHours() + start.getMinutes() / 60;
  });
  
  // Calculate average bedtime deviation from optimal (10 PM)
  const avgDeviation = bedtimes.reduce((sum, time) => {
    // Handle times after midnight
    const normalizedTime = time < 12 ? time + 24 : time;
    const optimalTime = OPTIMAL_BEDTIME_HOUR;
    return sum + Math.abs(normalizedTime - optimalTime);
  }, 0) / bedtimes.length;
  
  // 0 hours deviation = 25 points, 4+ hours = 0 points
  const score = Math.max(0, 25 - (avgDeviation / 4) * 25);
  return Math.round(score);
};

// Calculate quality score (0-25) based on user ratings
const calculateQualityScore = (records: SleepRecord[]): number => {
  const recordsWithQuality = records.filter(r => r.quality !== undefined && r.quality !== null);
  
  if (recordsWithQuality.length === 0) return 15; // Default if no quality data
  
  const avgQuality = recordsWithQuality.reduce((sum, r) => sum + (r.quality || 0), 0) / recordsWithQuality.length;
  
  // Quality is 1-5, convert to 0-25
  return Math.round((avgQuality / 5) * 25);
};

// Determine grade based on total score
const getGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

// Calculate trend by comparing recent week to previous week
const calculateTrend = (records: SleepRecord[]): 'improving' | 'declining' | 'stable' => {
  if (records.length < 10) return 'stable';
  
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const recentWeek = sortedRecords.slice(0, 7);
  const previousWeek = sortedRecords.slice(7, 14);
  
  if (previousWeek.length < 3) return 'stable';
  
  const recentAvg = recentWeek.reduce((sum, r) => sum + r.duration, 0) / recentWeek.length;
  const previousAvg = previousWeek.reduce((sum, r) => sum + r.duration, 0) / previousWeek.length;
  
  const diff = recentAvg - previousAvg;
  
  if (diff > 15) return 'improving';
  if (diff < -15) return 'declining';
  return 'stable';
};

// Calculate sleep streak (consecutive days meeting goal)
const calculateStreak = (records: SleepRecord[], goalMinutes: number = 420): number => {
  if (records.length === 0) return 0;
  
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedRecords.length; i++) {
    const recordDate = new Date(sortedRecords[i].createdAt);
    recordDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    // Check if this record is for the expected date
    if (recordDate.getTime() !== expectedDate.getTime()) break;
    
    // Check if duration meets goal
    if (sortedRecords[i].duration >= goalMinutes) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

// Generate insights based on analysis
const generateInsights = (
  breakdown: SleepScoreBreakdown,
  records: SleepRecord[]
): SleepInsight[] => {
  const insights: SleepInsight[] = [];
  
  // Duration insights
  if (breakdown.duration >= 23) {
    insights.push({
      type: 'positive',
      category: 'duration',
      title: 'Perfect Sleep Duration!',
      titleMy: 'ပြည့်စုံသော အိပ်စက်ချိန်!',
      message: 'You\'re getting the ideal 7-9 hours of sleep.',
      messageMy: 'သင် အကောင်းဆုံး ၇-၉ နာရီ အိပ်စက်နေပါသည်။',
      icon: '🌟',
    });
  } else if (breakdown.duration < 15) {
    insights.push({
      type: 'negative',
      category: 'duration',
      title: 'Sleep Duration Needs Work',
      titleMy: 'အိပ်စက်ချိန် တိုးတက်ရန်လိုသည်',
      message: 'Try to get closer to 7-8 hours each night.',
      messageMy: 'ညတိုင်း ၇-၈ နာရီ အိပ်စက်ရန် ကြိုးစားပါ။',
      icon: '⏰',
    });
  }
  
  // Consistency insights
  if (breakdown.consistency >= 22) {
    insights.push({
      type: 'positive',
      category: 'consistency',
      title: 'Excellent Consistency!',
      titleMy: 'အလွန်ကောင်းသော တသမတ်တည်းမှု!',
      message: 'Your sleep schedule is very regular.',
      messageMy: 'သင့် အိပ်စက်မှုအချိန်ဇယား အလွန်ပုံမှန်ပါသည်။',
      icon: '📊',
    });
  } else if (breakdown.consistency < 12) {
    insights.push({
      type: 'negative',
      category: 'consistency',
      title: 'Irregular Sleep Pattern',
      titleMy: 'မပုံမှန်သော အိပ်စက်မှုပုံစံ',
      message: 'Try to sleep and wake at similar times daily.',
      messageMy: 'နေ့တိုင်း အချိန်တူတူ အိပ်ပြီး နိုးရန် ကြိုးစားပါ။',
      icon: '🔄',
    });
  }
  
  // Timing insights
  if (breakdown.timing >= 20) {
    insights.push({
      type: 'positive',
      category: 'timing',
      title: 'Great Bedtime Habits!',
      titleMy: 'ကောင်းမွန်သော အိပ်ရာဝင်အလေ့အထ!',
      message: 'You\'re going to bed at optimal times.',
      messageMy: 'သင် အကောင်းဆုံးအချိန်တွင် အိပ်ရာဝင်နေပါသည်။',
      icon: '🌙',
    });
  } else if (breakdown.timing < 10) {
    insights.push({
      type: 'negative',
      category: 'timing',
      title: 'Late Bedtime Detected',
      titleMy: 'နောက်ကျသော အိပ်ရာဝင်ချိန် တွေ့ရှိ',
      message: 'Consider going to bed earlier, around 10-11 PM.',
      messageMy: 'ည ၁၀-၁၁ နာရီဝန်းကျင် စောစောအိပ်ရန် စဉ်းစားပါ။',
      icon: '🦉',
    });
  }
  
  // Quality insights
  if (breakdown.quality >= 22) {
    insights.push({
      type: 'positive',
      category: 'quality',
      title: 'High Quality Sleep!',
      titleMy: 'အရည်အသွေးမြင့် အိပ်စက်မှု!',
      message: 'You\'re reporting excellent sleep quality.',
      messageMy: 'သင် အလွန်ကောင်းသော အိပ်စက်မှုအရည်အသွေး မှတ်တမ်းတင်နေပါသည်။',
      icon: '✨',
    });
  } else if (breakdown.quality < 12) {
    insights.push({
      type: 'negative',
      category: 'quality',
      title: 'Sleep Quality Could Improve',
      titleMy: 'အိပ်စက်မှုအရည်အသွေး တိုးတက်နိုင်သည်',
      message: 'Consider factors like room temperature, noise, and screen time.',
      messageMy: 'အခန်းအပူချိန်၊ ဆူညံသံ၊ ဖန်သားပြင်ကြည့်ချိန် စသည်တို့ကို စဉ်းစားပါ။',
      icon: '💤',
    });
  }
  
  return insights;
};

// Generate recommendations based on scores
const generateRecommendations = (
  breakdown: SleepScoreBreakdown,
  records: SleepRecord[]
): SleepRecommendation[] => {
  const recommendations: SleepRecommendation[] = [];
  
  // Duration recommendations
  if (breakdown.duration < 20) {
    const avgDuration = records.length > 0 
      ? records.reduce((sum, r) => sum + r.duration, 0) / records.length 
      : 0;
    
    if (avgDuration < MIN_GOOD_SLEEP) {
      recommendations.push({
        priority: 'high',
        title: 'Increase Sleep Time',
        titleMy: 'အိပ်စက်ချိန် တိုးပါ',
        description: 'Try going to bed 30 minutes earlier each night.',
        descriptionMy: 'ညတိုင်း ၃၀ မိနစ် စောစောအိပ်ရန် ကြိုးစားပါ။',
        icon: '⏰',
      });
    } else {
      recommendations.push({
        priority: 'medium',
        title: 'Avoid Oversleeping',
        titleMy: 'အိပ်လွန်ခြင်း ရှောင်ပါ',
        description: 'More than 9 hours can leave you feeling groggy.',
        descriptionMy: '၉ နာရီထက်ပိုအိပ်ခြင်းသည် ပင်ပန်းနွမ်းနယ်စေနိုင်သည်။',
        icon: '😴',
      });
    }
  }
  
  // Consistency recommendations
  if (breakdown.consistency < 18) {
    recommendations.push({
      priority: 'high',
      title: 'Set a Sleep Schedule',
      titleMy: 'အိပ်စက်မှုအချိန်ဇယား သတ်မှတ်ပါ',
      description: 'Go to bed and wake up at the same time every day, even weekends.',
      descriptionMy: 'စနေ/တနင်္ဂနွေပါ အပါအဝင် နေ့တိုင်း အချိန်တူတူ အိပ်ပြီး နိုးပါ။',
      icon: '📅',
    });
  }
  
  // Timing recommendations
  if (breakdown.timing < 15) {
    recommendations.push({
      priority: 'medium',
      title: 'Earlier Bedtime',
      titleMy: 'စောစောအိပ်ရာဝင်ပါ',
      description: 'Aim for 10-11 PM bedtime for optimal circadian rhythm.',
      descriptionMy: 'အကောင်းဆုံး circadian rhythm အတွက် ည ၁၀-၁၁ နာရီ အိပ်ရာဝင်ပါ။',
      icon: '🌙',
    });
  }
  
  // Quality recommendations
  if (breakdown.quality < 18) {
    recommendations.push({
      priority: 'medium',
      title: 'Improve Sleep Environment',
      titleMy: 'အိပ်စက်မှုပတ်ဝန်းကျင် တိုးတက်စေပါ',
      description: 'Keep your room cool, dark, and quiet. Avoid screens 1 hour before bed.',
      descriptionMy: 'အခန်းကို အေး၊ မှောင်၊ တိတ်ဆိတ်အောင် ထားပါ။ အိပ်ရာမဝင်မီ ၁ နာရီ ဖန်သားပြင် ရှောင်ပါ။',
      icon: '🛏️',
    });
  }
  
  // General recommendations
  if (recommendations.length < 2) {
    recommendations.push({
      priority: 'low',
      title: 'Stay Hydrated',
      titleMy: 'ရေဓာတ်ထိန်းပါ',
      description: 'Drink water throughout the day, but reduce intake 2 hours before bed.',
      descriptionMy: 'တစ်နေ့တာလုံး ရေသောက်ပါ၊ သို့သော် အိပ်ရာမဝင်မီ ၂ နာရီ လျှော့ပါ။',
      icon: '💧',
    });
  }
  
  return recommendations.slice(0, 4); // Max 4 recommendations
};

// Main function to calculate sleep quality score
export const calculateSleepQualityScore = async (): Promise<SleepQualityScore> => {
  const records = await getSleepRecords();
  
  // Get records from last 14 days for analysis
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const recentRecords = records.filter(
    r => new Date(r.createdAt) >= twoWeeksAgo
  );
  
  // Calculate average duration
  const avgDuration = recentRecords.length > 0
    ? recentRecords.reduce((sum, r) => sum + r.duration, 0) / recentRecords.length
    : 0;
  
  // Calculate breakdown scores
  const breakdown: SleepScoreBreakdown = {
    duration: calculateDurationScore(avgDuration),
    consistency: calculateConsistencyScore(recentRecords),
    timing: calculateTimingScore(recentRecords),
    quality: calculateQualityScore(recentRecords),
  };
  
  const totalScore = breakdown.duration + breakdown.consistency + breakdown.timing + breakdown.quality;
  const grade = getGrade(totalScore);
  const trend = calculateTrend(records);
  const streakDays = calculateStreak(records);
  const insights = generateInsights(breakdown, recentRecords);
  const recommendations = generateRecommendations(breakdown, recentRecords);
  
  const score: SleepQualityScore = {
    totalScore,
    grade,
    breakdown,
    trend,
    insights,
    recommendations,
    streakDays,
    lastUpdated: new Date().toISOString(),
  };
  
  // Save score
  await AsyncStorage.setItem(SLEEP_SCORE_KEY, JSON.stringify(score));
  
  return score;
};

// Get daily analysis for chart
export const getDailySleepAnalysis = async (days: number = 7): Promise<DailySleepAnalysis[]> => {
  const records = await getSleepRecords();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentRecords = records.filter(
    r => new Date(r.createdAt) >= cutoffDate
  );
  
  return recentRecords.map(r => {
    const startTime = new Date(r.startTime);
    const endTime = new Date(r.endTime);
    
    // Calculate individual score for this day
    const durationScore = calculateDurationScore(r.duration);
    const qualityScore = r.quality ? (r.quality / 5) * 25 : 15;
    const dayScore = Math.round((durationScore + qualityScore) * 2);
    
    return {
      date: r.createdAt.split('T')[0],
      score: dayScore,
      duration: r.duration,
      bedtime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      wakeTime: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      quality: r.quality || null,
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Get score color based on grade
export const getScoreColor = (grade: string): string => {
  switch (grade) {
    case 'A': return '#4CAF50';
    case 'B': return '#8BC34A';
    case 'C': return '#FFC107';
    case 'D': return '#FF9800';
    case 'F': return '#F44336';
    default: return '#9E9E9E';
  }
};

// Get score emoji based on grade
export const getScoreEmoji = (grade: string): string => {
  switch (grade) {
    case 'A': return '🌟';
    case 'B': return '😊';
    case 'C': return '😐';
    case 'D': return '😕';
    case 'F': return '😴';
    default: return '❓';
  }
};
