import {
  AnimatedBar,
  AnimatedTabs,
  EmptyState,
  InteractiveCard,
  PeriodComparison,
  SkeletonStatsScreen,
  TrendLineChart
} from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePullRefresh } from '@/hooks/usePullRefresh';
import { useTranslation } from '@/hooks/useTranslation';
import {
  calculateStats,
  DailyWaterRecord,
  getLastNDays,
  getMonthlyChartData,
  getWeeklyChartData,
  WaterStats,
} from '@/services/waterHistory';
import { useUserProfileStore } from '@/store/userProfile';
import { formatWaterAmount } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const dailyGoal = useUserProfileStore((state) => state.profile.dailyWaterGoal);
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');
  const [stats, setStats] = useState<WaterStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ day: string; intake: number; goal: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ week: string; average: number }[]>([]);
  const [recentDays, setRecentDays] = useState<DailyWaterRecord[]>([]);
  const [previousWeekData, setPreviousWeekData] = useState<{ day: string; intake: number; goal: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when tab changes
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const daysToLoad = activeTab === 'week' ? 7 : 30;
      const [statsData, weekly, monthly, recent, prevWeekRecords] = await Promise.all([
        calculateStats(dailyGoal),
        getWeeklyChartData(),
        getMonthlyChartData(),
        getLastNDays(daysToLoad),
        getLastNDays(14), // Get 14 days to calculate previous week
      ]);
      setStats(statsData);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setRecentDays(recent.reverse());
      
      // Calculate previous week data for comparison
      const prevWeek = prevWeekRecords.slice(0, 7).map((record, i) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(record.date).getDay()],
        intake: record.intake,
        goal: record.goal,
      }));
      setPreviousWeekData(prevWeek);
    } finally {
      setLoading(false);
    }
  }, [dailyGoal, activeTab]);

  const { refreshing, handleRefresh } = usePullRefresh({
    onRefresh: loadData,
  });

  // Calculate max value for chart based on active tab
  const maxIntake = activeTab === 'week' 
    ? Math.max(...weeklyData.map((d) => d.intake), dailyGoal)
    : Math.max(...monthlyData.map((d) => d.average), dailyGoal);

  // Calculate period comparison data
  const periodComparison = useMemo(() => {
    const currentAvg = weeklyData.length > 0 
      ? weeklyData.reduce((sum, d) => sum + d.intake, 0) / weeklyData.length / 1000
      : 0;
    const previousAvg = previousWeekData.length > 0
      ? previousWeekData.reduce((sum, d) => sum + d.intake, 0) / previousWeekData.length / 1000
      : 0;
    return { currentAvg, previousAvg };
  }, [weeklyData, previousWeekData]);

  // Prepare trend data
  const trendData = useMemo(() => {
    const current = weeklyData.map(d => ({ label: d.day, value: d.intake }));
    const previous = previousWeekData.map(d => ({ label: d.day, value: d.intake }));
    return { current, previous };
  }, [weeklyData, previousWeekData]);

  // Check if we have any data
  const hasData = recentDays.length > 0 && recentDays.some(d => d.intake > 0);

  const StatCard = ({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) => (
    <InteractiveCard style={styles.statCard} elevation="small">
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </InteractiveCard>
  );

  // Show skeleton while loading
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonStatsScreen />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>{t('history.title')}</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="flame" value={`${stats?.currentStreak || 0}`} label={t('history.dayStreak')} color="#FF6B6B" />
          <StatCard icon="trophy" value={`${stats?.longestStreak || 0}`} label={t('history.bestStreak')} color="#FFD93D" />
          <StatCard icon="water" value={formatWaterAmount(stats?.weeklyAverage || 0)} label={t('history.dailyAvg')} color="#4FC3F7" />
          <StatCard icon="checkmark-circle" value={`${stats?.goalCompletionRate || 0}%`} label={t('history.goalRate')} color="#6BCB77" />
        </View>

        {/* Tab Selector */}
        <AnimatedTabs
          tabs={[t('history.thisWeek'), t('history.thisMonth')]}
          activeIndex={activeTab === 'week' ? 0 : 1}
          onTabChange={(index) => setActiveTab(index === 0 ? 'week' : 'month')}
          style={styles.tabContainer}
        />

        {/* Bar Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {activeTab === 'week' ? t('history.dailyIntake') : t('history.weeklyAverage')}
          </Text>
          
          {!hasData ? (
            <EmptyState
              icon="bar-chart-outline"
              title="No data yet"
              description="Start tracking your water intake to see your progress here"
              actionLabel="Add Water"
              onAction={() => router.push('/')}
            />
          ) : (
            <>
              <View style={styles.chart}>
                {/* Goal line - only show for weekly view */}
                {activeTab === 'week' && (
                  <View style={[styles.goalLine, { top: `${100 - (dailyGoal / maxIntake) * 100}%` }]}>
                    <View style={[styles.goalLineDash, { backgroundColor: '#FF6B6B' }]} />
                    <Text style={styles.goalLineText}>{t('history.goal')}</Text>
                  </View>
                )}

                {/* Animated Bars */}
                <View style={styles.barsContainer}>
                  {activeTab === 'week' ? (
                    weeklyData.map((item, index) => {
                      const isToday = index === weeklyData.length - 1;
                      const metGoal = item.intake >= item.goal * 0.8;
                      return (
                        <AnimatedBar
                          key={item.day}
                          value={item.intake}
                          maxValue={maxIntake}
                          color={metGoal ? colors.primary : colors.surfaceVariant}
                          highlighted={isToday}
                          label={item.day}
                          delay={index * 80}
                        />
                      );
                    })
                  ) : (
                    monthlyData.map((item, index) => {
                      const isCurrentWeek = index === monthlyData.length - 1;
                      const metGoal = item.average >= dailyGoal * 0.8;
                      return (
                        <AnimatedBar
                          key={item.week}
                          value={item.average}
                          maxValue={maxIntake}
                          color={metGoal ? colors.success : colors.surfaceVariant}
                          highlighted={isCurrentWeek}
                          label={item.week.replace('Week ', 'W')}
                          delay={index * 80}
                        />
                      );
                    })
                  )}
                </View>
              </View>
              
              {/* Chart Legend */}
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: activeTab === 'week' ? colors.primary : colors.success }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {activeTab === 'week' ? 'Goal met (80%+)' : 'Above average'}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.surfaceVariant }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {activeTab === 'week' ? 'Below goal' : 'Below average'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Trend Line & Period Comparison - only show for weekly view with data */}
        {activeTab === 'week' && hasData && (
          <>
            {/* Period Comparison */}
            <PeriodComparison
              currentPeriod={{
                label: 'This Week',
                value: periodComparison.currentAvg,
                unit: 'L/day',
              }}
              previousPeriod={{
                label: 'Last Week',
                value: periodComparison.previousAvg,
                unit: 'L/day',
              }}
              style={styles.comparisonCard}
            />

            {/* Trend Line Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Trend</Text>
              <TrendLineChart
                currentData={trendData.current}
                previousData={trendData.previous}
                showComparison={trendData.previous.length > 0}
                height={140}
              />
            </View>
          </>
        )}

        {/* Recent Days List */}
        <View style={[styles.recentCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {activeTab === 'week' ? t('history.recentDays') : 'Last 30 Days'}
          </Text>
          {!hasData ? (
            <EmptyState
              icon="calendar-outline"
              title="No history yet"
              description="Your daily water intake history will appear here once you start tracking"
            />
          ) : (
            recentDays.slice(0, activeTab === 'week' ? 7 : 14).map((record) => {
              const date = new Date(record.date);
              const isToday = record.date === new Date().toISOString().split('T')[0];
              const progress = Math.min((record.intake / record.goal) * 100, 100);
              const metGoal = record.intake >= record.goal * 0.8;

              return (
                <View key={record.date} style={[styles.dayRow, { borderBottomColor: colors.divider }]}>
                  <View style={styles.dayInfo}>
                    <Text style={[styles.dayName, { color: colors.text }]}>
                      {isToday ? t('history.today') : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={[styles.dayIntake, { color: colors.textSecondary }]}>
                      {formatWaterAmount(record.intake)} / {formatWaterAmount(record.goal)}
                    </Text>
                  </View>
                  <View style={styles.dayProgress}>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progress}%`, backgroundColor: metGoal ? colors.success : colors.warning },
                        ]}
                      />
                    </View>
                    {metGoal && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Insights */}
        <View style={[styles.insightCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text }]}>{t('history.insight')}</Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              {stats?.currentStreak && stats.currentStreak >= 3
                ? t('history.streakMessage', { count: stats.currentStreak })
                : stats?.weeklyAverage && stats.weeklyAverage < dailyGoal * 0.7
                ? t('history.drinkMoreMessage')
                : t('history.doingGreatMessage')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  tabContainer: { marginBottom: 20 },
  chartCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  chart: { height: 180, position: 'relative' },
  goalLine: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  goalLineDash: { flex: 1, height: 2, opacity: 0.5 },
  goalLineText: { fontSize: 10, color: '#FF6B6B', marginLeft: 4 },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', height: '100%', alignItems: 'flex-end' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  comparisonCard: { marginBottom: 20 },
  recentCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  dayInfo: { flex: 1 },
  dayName: { fontSize: 14, fontWeight: '500' },
  dayIntake: { fontSize: 12, marginTop: 2 },
  dayProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBarBg: { width: 80, height: 6, borderRadius: 3 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  insightCard: { flexDirection: 'row', borderRadius: 16, padding: 16, gap: 12, alignItems: 'flex-start' },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  insightText: { fontSize: 13, lineHeight: 18 },
});
