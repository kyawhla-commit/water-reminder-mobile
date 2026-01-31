import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ComprehensiveStats,
  getComprehensiveStats,
  getMonthComparison,
  getWeekComparison,
} from '@/services/historyStats';
import { getLastNDays } from '@/services/waterHistory';
import { useUserProfileStore } from '@/store/userProfile';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type PeriodType = 'month' | 'year';

interface DayData {
  date: string;
  intake: number;
  goal: number;
  percentage: number;
}

interface WeekComparisonData {
  thisWeek: any;
  lastWeek: any;
  improvement: number;
  improvementText: string;
  improvementTextMy: string;
}

interface MonthComparisonData {
  thisMonth: any;
  lastMonth: any;
  improvement: number;
  improvementText: string;
  improvementTextMy: string;
}

export default function DetailedStatsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';
  const { profile } = useUserProfileStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState<ComprehensiveStats | null>(null);
  const [weekComparison, setWeekComparison] = useState<WeekComparisonData | null>(null);
  const [monthComparison, setMonthComparison] = useState<MonthComparisonData | null>(null);
  const [monthData, setMonthData] = useState<DayData[]>([]);
  const [weekData, setWeekData] = useState<DayData[]>([]);

  const loadData = useCallback(async () => {
    try {
      const lang = isBurmese ? 'my' : 'en';
      const [statsData, weekComp, monthComp, last7Days, last30Days] = await Promise.all([
        getComprehensiveStats(profile.dailyWaterGoal, lang),
        getWeekComparison(profile.dailyWaterGoal),
        getMonthComparison(profile.dailyWaterGoal, lang),
        getLastNDays(7),
        getLastNDays(30),
      ]);

      setStats(statsData);
      setWeekComparison(weekComp);
      setMonthComparison(monthComp);

      // Process week data
      const processedWeekData = last7Days.map((day) => ({
        date: day.date,
        intake: day.intake,
        goal: day.goal || profile.dailyWaterGoal,
        percentage: Math.min(100, Math.round((day.intake / (day.goal || profile.dailyWaterGoal)) * 100)),
      }));
      setWeekData(processedWeekData);

      // Process month data
      const processedMonthData = last30Days.map((day) => ({
        date: day.date,
        intake: day.intake,
        goal: day.goal || profile.dailyWaterGoal,
        percentage: Math.min(100, Math.round((day.intake / (day.goal || profile.dailyWaterGoal)) * 100)),
      }));
      setMonthData(processedMonthData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile.dailyWaterGoal, isBurmese]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    if (newDate <= new Date()) {
      setCurrentMonth(newDate);
    }
  };

  const formatMonthYear = (date: Date) => {
    const months = isBurmese
      ? ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getDayNames = () => {
    return isBurmese
      ? ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };

  const renderMonthNavigator = () => (
    <View style={styles.monthNavigator}>
      <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.monthText, { color: colors.text }]}>
        {formatMonthYear(currentMonth)}
      </Text>
      <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
        <Ionicons name="chevron-forward" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderBarChart = () => {
    const maxPercentage = 100;
    const chartData = period === 'month' ? monthData.slice(-30) : monthData;

    return (
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>(%)</Text>
          <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>100</Text>
          <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>80</Text>
          <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>60</Text>
          <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>40</Text>
          <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>20</Text>
          <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>0</Text>
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: '0%' }]} />
          <View style={[styles.gridLine, { top: '20%' }]} />
          <View style={[styles.gridLine, { top: '40%' }]} />
          <View style={[styles.gridLine, { top: '60%' }]} />
          <View style={[styles.gridLine, { top: '80%' }]} />
          <View style={[styles.gridLine, { top: '100%' }]} />

          {/* Bars */}
          <View style={styles.barsContainer}>
            {chartData.map((day, index) => {
              const height = (day.percentage / maxPercentage) * 100;
              return (
                <View key={day.date || index} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(height, 1)}%`,
                        backgroundColor: day.percentage >= 80 ? '#9C7CF4' : '#6B5B95',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* X-axis labels */}
          <View style={styles.xAxis}>
            <Text style={[styles.xAxisLabel, { color: colors.textSecondary }]}>
              {isBurmese ? 'ဇန်နဝါရီ' : 'January'}
            </Text>
            <Text style={[styles.xAxisLabel, { color: colors.textSecondary }]}>4</Text>
            <Text style={[styles.xAxisLabel, { color: colors.textSecondary }]}>11</Text>
            <Text style={[styles.xAxisLabel, { color: colors.textSecondary }]}>18</Text>
            <Text style={[styles.xAxisLabel, { color: colors.textSecondary }]}>25</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity
        style={[
          styles.periodButton,
          { backgroundColor: period === 'month' ? 'transparent' : 'transparent' },
          period === 'month' && styles.periodButtonInactive,
        ]}
        onPress={() => setPeriod('month')}
      >
        <Text style={[styles.periodText, { color: period === 'month' ? colors.text : colors.textSecondary }]}>
          {isBurmese ? 'လ' : 'Month'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.periodButton,
          period === 'year' && styles.periodButtonActive,
        ]}
        onPress={() => setPeriod('year')}
      >
        <Text style={[styles.periodText, { color: period === 'year' ? '#fff' : colors.textSecondary }]}>
          {isBurmese ? 'နှစ်' : 'Year'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeeklyCompletion = () => {
    const dayNames = getDayNames();

    return (
      <View style={[styles.weeklyCard, { backgroundColor: '#1E1E3F' }]}>
        <Text style={styles.weeklyTitle}>
          {isBurmese ? 'အပတ်စဉ်ပြီးမြောက်မှု' : 'Weekly completion'}
        </Text>
        <View style={styles.weekCircles}>
          {weekData.map((day, index) => {
            const date = new Date(day.date);
            const dayIndex = date.getDay();
            const isComplete = day.percentage >= 80;
            const hasData = day.intake > 0;

            return (
              <View key={day.date} style={styles.dayCircleContainer}>
                <View
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: isComplete
                        ? '#9C7CF4'
                        : hasData
                          ? `rgba(156, 124, 244, ${day.percentage / 100})`
                          : '#3D3D5C',
                      borderWidth: hasData && !isComplete ? 2 : 0,
                      borderColor: '#9C7CF4',
                    },
                  ]}
                >
                  {isComplete && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </View>
                <Text style={styles.dayName}>{dayNames[dayIndex]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDrinkWaterReport = () => {
    const weeklyAvg = weekComparison?.thisWeek?.dailyAverage || 0;
    const monthlyAvg = monthComparison?.thisMonth?.dailyAverage || 0;
    const avgCompletion = stats?.allTime?.goalCompletionRate || 0;
    const drinkFrequency = stats?.allTime?.totalEntries && stats?.allTime?.totalDays
      ? Math.round(stats.allTime.totalEntries / stats.allTime.totalDays)
      : 0;

    return (
      <View style={styles.reportContainer}>
        <Text style={[styles.reportTitle, { color: colors.text }]}>
          {isBurmese ? 'ရေသောက်မှတ်တမ်း' : 'Drink water report'}
        </Text>

        <View style={styles.reportItem}>
          <View style={styles.reportDot}>
            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
          </View>
          <Text style={[styles.reportLabel, { color: colors.text }]}>
            {isBurmese ? 'အပတ်စဉ်ပျမ်းမျှ' : 'Weekly average'}
          </Text>
          <Text style={[styles.reportValue, { color: '#9C7CF4' }]}>
            {weeklyAvg} ml / {isBurmese ? 'နေ့' : 'day'}
          </Text>
        </View>

        <View style={styles.reportItem}>
          <View style={styles.reportDot}>
            <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
          </View>
          <Text style={[styles.reportLabel, { color: colors.text }]}>
            {isBurmese ? 'လစဉ်ပျမ်းမျှ' : 'Monthly average'}
          </Text>
          <Text style={[styles.reportValue, { color: '#9C7CF4' }]}>
            {monthlyAvg} ml / {isBurmese ? 'နေ့' : 'day'}
          </Text>
        </View>

        <View style={styles.reportItem}>
          <View style={styles.reportDot}>
            <View style={[styles.dot, { backgroundColor: '#FFC107' }]} />
          </View>
          <Text style={[styles.reportLabel, { color: colors.text }]}>
            {isBurmese ? 'ပျမ်းမျှပြီးမြောက်မှု' : 'Average completion'}
          </Text>
          <Text style={[styles.reportValue, { color: '#9C7CF4' }]}>
            {avgCompletion}%
          </Text>
        </View>

        <View style={styles.reportItem}>
          <View style={styles.reportDot}>
            <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
          </View>
          <Text style={[styles.reportLabel, { color: colors.text }]}>
            {isBurmese ? 'သောက်သုံးမှုအကြိမ်ရေ' : 'Drink frequency'}
          </Text>
          <Text style={[styles.reportValue, { color: '#9C7CF4' }]}>
            {drinkFrequency} {isBurmese ? 'ကြိမ် / နေ့' : 'times / day'}
          </Text>
        </View>
      </View>
    );
  };

  // Motivational messages for the cartoon mascot
  const getMotivationalMessage = () => {
    const messages = isBurmese
      ? [
          'ကျန်းမာသောစိတ်နှင့် ခန္ဓာကိုယ်သည် ရေဓာတ်ပြည့်ဝသောတစ်ခုဖြစ်သည်။ လာပြီးစမ်းကြည့်ပါ!',
          'ရေသောက်ခြင်းသည် သင့်ကိုယ်ကို ချစ်ခြင်းဖြစ်သည်။ 💧',
          'တစ်နေ့တာလုံး စွမ်းအင်ပြည့်ဝစေရန် ရေသောက်ပါ!',
          'သင့်ခန္ဓာကိုယ်က ရေလိုအပ်နေပါသည်။ ယခုသောက်ပါ!',
          'ရေဓာတ်ထိန်းထားခြင်းသည် ကျန်းမာရေး၏သော့ချက်ဖြစ်သည်။',
        ]
      : [
          'A healthy mind and body is a hydrated one. Come and have a try!',
          'Drinking water is self-love. 💧',
          'Stay energized all day by drinking water!',
          'Your body needs water. Drink up now!',
          'Hydration is the key to wellness.',
        ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const renderCartoonMascot = () => {
    return (
      <View style={styles.mascotContainer}>
        {/* Cartoon Water Drop Character */}
        <View style={styles.mascotWrapper}>
          <View style={styles.waterDropBody}>
            {/* Main drop shape */}
            <View style={styles.dropTop} />
            <View style={styles.dropBottom}>
              {/* Face */}
              <View style={styles.faceContainer}>
                {/* Eyes */}
                <View style={styles.eyesRow}>
                  <View style={styles.eye}>
                    <View style={styles.eyeInner} />
                    <View style={styles.eyeShine} />
                  </View>
                  <View style={styles.eye}>
                    <View style={styles.eyeInner} />
                    <View style={styles.eyeShine} />
                  </View>
                </View>
                {/* Blush */}
                <View style={styles.blushRow}>
                  <View style={styles.blush} />
                  <View style={styles.blush} />
                </View>
                {/* Smile */}
                <View style={styles.smile} />
              </View>
            </View>
            {/* Shine effect */}
            <View style={styles.dropShine} />
          </View>
        </View>

        {/* Speech Bubble */}
        <View style={styles.speechBubble}>
          <View style={styles.speechBubbleArrow} />
          <Text style={styles.speechText}>
            {getMotivationalMessage()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#9C7CF4" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {isBurmese ? 'စာရင်းအင်းများတင်နေသည်...' : 'Loading stats...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isBurmese ? 'မှတ်တမ်း' : 'History'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9C7CF4']} />
        }
      >
        {renderMonthNavigator()}
        {renderBarChart()}
        {renderPeriodSelector()}

        <TouchableOpacity style={styles.addRecordButton}>
          <Text style={[styles.addRecordText, { color: colors.textSecondary }]}>
            {isBurmese ? 'မှတ်တမ်းထည့်ရန်' : 'Add record'}
          </Text>
          <Ionicons name="add" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {renderWeeklyCompletion()}
        {renderDrinkWaterReport()}
        {renderCartoonMascot()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Month Navigator
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  navButton: { padding: 8 },
  monthText: { fontSize: 16, fontWeight: '500', marginHorizontal: 16 },

  // Chart
  chartContainer: { flexDirection: 'row', height: 200, marginBottom: 16 },
  yAxis: { width: 35, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 8 },
  yAxisLabel: { fontSize: 10 },
  chartArea: { flex: 1, position: 'relative' },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 25,
  },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: 6, borderRadius: 3, minHeight: 2 },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xAxisLabel: { fontSize: 10 },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  periodButtonActive: {
    backgroundColor: '#9C7CF4',
    borderColor: '#9C7CF4',
  },
  periodButtonInactive: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  periodText: { fontSize: 14, fontWeight: '500' },

  // Add Record
  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 16,
    gap: 4,
  },
  addRecordText: { fontSize: 14 },

  // Weekly Completion
  weeklyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  weeklyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  weekCircles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircleContainer: { alignItems: 'center' },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dayName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },

  // Drink Water Report
  reportContainer: { paddingVertical: 8 },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  reportDot: { marginRight: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  reportLabel: { flex: 1, fontSize: 15 },
  reportValue: { fontSize: 15, fontWeight: '500' },

  // Cartoon Mascot
  mascotContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  mascotWrapper: {
    marginRight: 12,
  },
  waterDropBody: {
    width: 60,
    height: 70,
    position: 'relative',
  },
  dropTop: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#9C7CF4',
  },
  dropBottom: {
    position: 'absolute',
    top: 12,
    left: 5,
    width: 50,
    height: 55,
    borderRadius: 25,
    backgroundColor: '#9C7CF4',
    overflow: 'hidden',
  },
  dropShine: {
    position: 'absolute',
    top: 18,
    left: 12,
    width: 12,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '-20deg' }],
  },
  faceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  eyesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
  },
  eye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a1a2e',
    position: 'relative',
  },
  eyeInner: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
  },
  eyeShine: {
    position: 'absolute',
    top: 2,
    left: 5,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#fff',
  },
  blushRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 2,
  },
  blush: {
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(255,150,150,0.5)',
  },
  smile: {
    width: 14,
    height: 7,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#1a1a2e',
  },
  speechBubble: {
    flex: 1,
    backgroundColor: '#2D2D4A',
    borderRadius: 16,
    padding: 14,
    position: 'relative',
  },
  speechBubbleArrow: {
    position: 'absolute',
    left: -8,
    top: 20,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#2D2D4A',
  },
  speechText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
