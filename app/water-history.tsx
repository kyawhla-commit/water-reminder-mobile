import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    calculateStats,
    DailyWaterRecord,
    getLastNDays,
    getWaterHistory,
    WaterStats,
} from '@/services/waterHistory';
import { useUserProfileStore } from '@/store/userProfile';
import { formatWaterAmount } from '@/utils';
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

type ViewMode = 'calendar' | 'list' | 'trends';

export default function WaterHistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';
  const { profile } = useUserProfileStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [history, setHistory] = useState<Record<string, DailyWaterRecord>>({});
  const [stats, setStats] = useState<WaterStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailyWaterRecord[]>([]);
  const [selectedDayRecord, setSelectedDayRecord] = useState<DailyWaterRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [historyData, statsData, weekly] = await Promise.all([
        getWaterHistory(),
        calculateStats(profile.dailyWaterGoal),
        getLastNDays(7),
      ]);

      setHistory(historyData);
      setStats(statsData);
      setWeeklyData(weekly);

      // Load selected day record
      const dayRecord = historyData[selectedDate] || {
        date: selectedDate,
        intake: 0,
        goal: profile.dailyWaterGoal,
        entries: [],
      };
      setSelectedDayRecord(dayRecord);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile.dailyWaterGoal, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const record = history[date] || {
      date,
      intake: 0,
      goal: profile.dailyWaterGoal,
      entries: [],
    };
    setSelectedDayRecord(record);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day).toISOString().split('T')[0];
      days.push({ date, day, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i).toISOString().split('T')[0];
      days.push({ date, day: i, isCurrentMonth: true });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i).toISOString().split('T')[0];
      days.push({ date, day: i, isCurrentMonth: false });
    }

    return days;
  };

  const getDayColor = (date: string): string => {
    const record = history[date];
    if (!record || record.intake === 0) return 'transparent';

    const percentage = record.intake / record.goal;
    if (percentage >= 1) return colors.success;
    if (percentage >= 0.8) return colors.success + '80';
    if (percentage >= 0.5) return colors.warning || '#FFC107';
    return colors.error + '60';
  };

  const getProgressPercentage = (intake: number, goal: number): number => {
    return Math.min(100, Math.round((intake / goal) * 100));
  };


  const renderStatsCard = () => (
    <View style={[styles.statsCard, { backgroundColor: colors.primary }]}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'လက်ရှိ' : 'Current'}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'ဆက်တိုက်' : 'Streak'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.longestStreak || 0}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'အရှည်ဆုံး' : 'Longest'}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'ဆက်တိုက်' : 'Streak'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.goalCompletionRate || 0}%</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'ပန်းတိုင်' : 'Goal'}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'ရောက်နှုန်း' : 'Rate'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.totalDaysTracked || 0}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'စုစုပေါင်း' : 'Total'}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'ရက်' : 'Days'}</Text>
        </View>
      </View>
    </View>
  );

  const renderViewModeSelector = () => (
    <View style={[styles.viewModeContainer, { backgroundColor: colors.card }]}>
      {(['calendar', 'list', 'trends'] as ViewMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.viewModeButton,
            viewMode === mode && { backgroundColor: colors.primary },
          ]}
          onPress={() => setViewMode(mode)}
        >
          <Ionicons
            name={
              mode === 'calendar'
                ? 'calendar'
                : mode === 'list'
                ? 'list'
                : 'trending-up'
            }
            size={18}
            color={viewMode === mode ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.viewModeText,
              { color: viewMode === mode ? '#fff' : colors.text },
            ]}
          >
            {mode === 'calendar'
              ? (isBurmese ? 'ပြက္ခဒိန်' : 'Calendar')
              : mode === 'list'
              ? (isBurmese ? 'စာရင်း' : 'List')
              : (isBurmese ? 'လမ်းကြောင်း' : 'Trends')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCalendarHeader = () => {
    const monthNames = isBurmese
      ? ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCalendarView = () => {
    const days = getCalendarDays();
    const weekDays = isBurmese
      ? ['တ', 'စ', 'ဗု', 'ကြ', 'သ', 'သော', 'န']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date().toISOString().split('T')[0];

    return (
      <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
        {renderCalendarHeader()}

        {/* Week day headers */}
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayCell}>
              <Text style={[styles.weekDayText, { color: colors.textSecondary }]}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {days.map((item, index) => {
            const isSelected = item.date === selectedDate;
            const isToday = item.date === today;
            const dayColor = getDayColor(item.date);
            const record = history[item.date];
            const hasData = record && record.intake > 0;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  !item.isCurrentMonth && styles.otherMonthDay,
                  isSelected && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => item.isCurrentMonth && handleDateSelect(item.date)}
                disabled={!item.isCurrentMonth}
              >
                <View
                  style={[
                    styles.dayInner,
                    hasData && { backgroundColor: dayColor },
                    isToday && !hasData && { borderColor: colors.primary, borderWidth: 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: item.isCurrentMonth ? colors.text : colors.textSecondary },
                      hasData && { color: '#fff' },
                    ]}
                  >
                    {item.day}
                  </Text>
                </View>
                {hasData && (
                  <Text style={[styles.dayIntake, { color: colors.textSecondary }]}>
                    {Math.round(record.intake / 100) / 10}L
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              {isBurmese ? '≥100%' : '≥100%'}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success + '80' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>80-99%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning || '#FFC107' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>50-79%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error + '60' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>&lt;50%</Text>
          </View>
        </View>
      </View>
    );
  };


  const renderSelectedDayDetails = () => {
    if (!selectedDayRecord) return null;

    const percentage = getProgressPercentage(selectedDayRecord.intake, selectedDayRecord.goal);
    const date = new Date(selectedDate);
    const dateStr = date.toLocaleDateString(isBurmese ? 'my' : 'en', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <View style={[styles.dayDetailsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.dayDetailsTitle, { color: colors.text }]}>{dateStr}</Text>

        <View style={styles.dayProgressContainer}>
          <View style={[styles.dayProgressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.dayProgressFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: percentage >= 100 ? colors.success : colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.dayProgressText, { color: colors.text }]}>
            {formatWaterAmount(selectedDayRecord.intake)} / {formatWaterAmount(selectedDayRecord.goal)}
          </Text>
          <Text
            style={[
              styles.dayProgressPercent,
              { color: percentage >= 100 ? colors.success : colors.primary },
            ]}
          >
            {percentage}%
          </Text>
        </View>

        {selectedDayRecord.entries.length > 0 ? (
          <View style={styles.entriesList}>
            <Text style={[styles.entriesTitle, { color: colors.textSecondary }]}>
              {isBurmese ? 'မှတ်တမ်းများ' : 'Entries'}
            </Text>
            {selectedDayRecord.entries.map((entry, index) => (
              <View key={index} style={styles.entryItem}>
                <Text style={[styles.entryTime, { color: colors.textSecondary }]}>
                  {entry.time}
                </Text>
                <View style={styles.entryAmountContainer}>
                  <Text style={styles.entryIcon}>💧</Text>
                  <Text style={[styles.entryAmount, { color: colors.text }]}>
                    {entry.amount}ml
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noEntriesContainer}>
            <Text style={styles.noEntriesIcon}>📝</Text>
            <Text style={[styles.noEntriesText, { color: colors.textSecondary }]}>
              {isBurmese ? 'ဤနေ့တွင် မှတ်တမ်းမရှိပါ' : 'No entries for this day'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderListView = () => {
    const sortedDates = Object.keys(history).sort().reverse();

    if (sortedDates.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isBurmese ? 'မှတ်တမ်းမရှိသေးပါ' : 'No history yet'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {sortedDates.slice(0, 30).map((date) => {
          const record = history[date];
          const percentage = getProgressPercentage(record.intake, record.goal);
          const dateObj = new Date(date);
          const isToday = date === new Date().toISOString().split('T')[0];

          return (
            <TouchableOpacity
              key={date}
              style={[styles.listItem, { backgroundColor: colors.card }]}
              onPress={() => {
                setSelectedDate(date);
                setSelectedDayRecord(record);
                setViewMode('calendar');
              }}
            >
              <View style={styles.listItemDate}>
                <Text style={[styles.listItemDay, { color: colors.text }]}>
                  {dateObj.getDate()}
                </Text>
                <Text style={[styles.listItemMonth, { color: colors.textSecondary }]}>
                  {dateObj.toLocaleDateString('en', { month: 'short' })}
                </Text>
                {isToday && (
                  <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.todayBadgeText}>
                      {isBurmese ? 'ယနေ့' : 'Today'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.listItemProgress}>
                <View style={[styles.listProgressBar, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.listProgressFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: percentage >= 100 ? colors.success : percentage >= 80 ? colors.primary : colors.warning || '#FFC107',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.listItemIntake, { color: colors.text }]}>
                  {formatWaterAmount(record.intake)}
                </Text>
              </View>

              <View style={styles.listItemPercent}>
                <Text
                  style={[
                    styles.percentText,
                    {
                      color: percentage >= 100 ? colors.success : percentage >= 80 ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  {percentage}%
                </Text>
                {percentage >= 100 && <Text style={styles.checkIcon}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderTrendsView = () => {
    const maxIntake = Math.max(...weeklyData.map((d) => d.intake), 1);

    return (
      <View style={styles.trendsContainer}>
        {/* Weekly Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {isBurmese ? '📊 ၇ ရက်အတွင်း' : '📊 Last 7 Days'}
          </Text>
          <View style={styles.barChart}>
            {weeklyData.map((day, index) => {
              const height = maxIntake > 0 ? (day.intake / maxIntake) * 100 : 0;
              const percentage = getProgressPercentage(day.intake, day.goal);
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
              const isToday = day.date === new Date().toISOString().split('T')[0];

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.barContainer}
                  onPress={() => handleDateSelect(day.date)}
                >
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(height, 5)}%`,
                          backgroundColor:
                            percentage >= 100
                              ? colors.success
                              : percentage >= 80
                              ? colors.primary
                              : colors.warning || '#FFC107',
                        },
                      ]}
                    />
                    {/* Goal line */}
                    <View
                      style={[
                        styles.goalLine,
                        {
                          bottom: `${(day.goal / maxIntake) * 100}%`,
                          backgroundColor: colors.error,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      { color: isToday ? colors.primary : colors.textSecondary },
                      isToday && { fontWeight: '700' },
                    ]}
                  >
                    {dayName}
                  </Text>
                  <Text style={[styles.barValue, { color: colors.text }]}>
                    {day.intake > 0 ? `${(day.intake / 1000).toFixed(1)}` : '-'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.chartLegendItem}>
              <View style={[styles.chartLegendLine, { backgroundColor: colors.error }]} />
              <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပန်းတိုင်' : 'Goal'}
              </Text>
            </View>
          </View>
        </View>

        {/* Averages Card */}
        <View style={[styles.averagesCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {isBurmese ? '📈 ပျမ်းမျှ' : '📈 Averages'}
          </Text>
          <View style={styles.averagesRow}>
            <View style={styles.averageItem}>
              <Text style={[styles.averageValue, { color: colors.primary }]}>
                {formatWaterAmount(stats?.weeklyAverage || 0)}
              </Text>
              <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>
                {isBurmese ? '၇ ရက်ပျမ်းမျှ' : '7-Day Avg'}
              </Text>
            </View>
            <View style={[styles.averageDivider, { backgroundColor: colors.surfaceVariant }]} />
            <View style={styles.averageItem}>
              <Text style={[styles.averageValue, { color: colors.secondary }]}>
                {formatWaterAmount(stats?.monthlyAverage || 0)}
              </Text>
              <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>
                {isBurmese ? '၃၀ ရက်ပျမ်းမျှ' : '30-Day Avg'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tips Card */}
        <View style={[styles.tipsCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFC107" />
          <View style={styles.tipsContent}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              {isBurmese ? '💡 အကြံပြုချက်' : '💡 Insight'}
            </Text>
            <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
              {stats && stats.goalCompletionRate >= 80
                ? (isBurmese
                    ? 'အံ့သြဖွယ်ကောင်းပါတယ်! သင့်ပန်းတိုင်ရောက်နှုန်း ' + stats.goalCompletionRate + '% ဖြစ်ပါသည်။'
                    : `Amazing! Your goal completion rate is ${stats.goalCompletionRate}%.`)
                : stats && stats.goalCompletionRate >= 50
                ? (isBurmese
                    ? 'ကောင်းပါတယ်! ပိုမိုတသမတ်တည်းဖြစ်အောင် ကြိုးစားပါ။'
                    : 'Good progress! Try to be more consistent.')
                : (isBurmese
                    ? 'နေ့စဉ်ရေသောက်မှုကို တိုးမြှင့်ကြည့်ပါ။ သတိပေးချက်များ ဖွင့်ထားပါ။'
                    : 'Try to increase your daily intake. Enable reminders to help.')}
            </Text>
          </View>
        </View>
      </View>
    );
  };


  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isBurmese ? '📅 ရေသောက်မှတ်တမ်း' : '📅 Water History'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {renderStatsCard()}
        {renderViewModeSelector()}

        {viewMode === 'calendar' && (
          <>
            {renderCalendarView()}
            {renderSelectedDayDetails()}
          </>
        )}

        {viewMode === 'list' && renderListView()}

        {viewMode === 'trends' && renderTrendsView()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Stats Card
  statsCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  statDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.3)' },

  // View Mode Selector
  viewModeContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewModeText: { fontSize: 13, fontWeight: '600' },

  // Calendar
  calendarContainer: { borderRadius: 16, padding: 16, marginBottom: 16 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navButton: { padding: 8 },
  monthTitle: { fontSize: 18, fontWeight: '600' },
  weekDaysRow: { flexDirection: 'row', marginBottom: 8 },
  weekDayCell: { flex: 1, alignItems: 'center' },
  weekDayText: { fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, padding: 2, alignItems: 'center' },
  otherMonthDay: { opacity: 0.3 },
  dayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 14, fontWeight: '500' },
  dayIntake: { fontSize: 8, marginTop: 1 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 10 },

  // Day Details
  dayDetailsCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  dayDetailsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  dayProgressContainer: { marginBottom: 16 },
  dayProgressBar: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  dayProgressFill: { height: '100%', borderRadius: 6 },
  dayProgressText: { fontSize: 14, textAlign: 'center' },
  dayProgressPercent: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  entriesList: { marginTop: 8 },
  entriesTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  entryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  entryTime: { fontSize: 14 },
  entryAmountContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryIcon: { fontSize: 14 },
  entryAmount: { fontSize: 14, fontWeight: '600' },
  noEntriesContainer: { alignItems: 'center', padding: 20 },
  noEntriesIcon: { fontSize: 32, marginBottom: 8 },
  noEntriesText: { fontSize: 14 },


  // List View
  listContainer: { gap: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 12 },
  listItemDate: { alignItems: 'center', width: 50 },
  listItemDay: { fontSize: 20, fontWeight: '700' },
  listItemMonth: { fontSize: 11 },
  todayBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  todayBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  listItemProgress: { flex: 1 },
  listProgressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  listProgressFill: { height: '100%', borderRadius: 4 },
  listItemIntake: { fontSize: 13 },
  listItemPercent: { alignItems: 'flex-end', width: 50 },
  percentText: { fontSize: 16, fontWeight: '700' },
  checkIcon: { fontSize: 14, color: '#4CAF50' },

  // Trends View
  trendsContainer: { gap: 16 },
  chartCard: { borderRadius: 16, padding: 16 },
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', height: 150 },
  barContainer: { alignItems: 'center', flex: 1 },
  barWrapper: { flex: 1, width: 24, justifyContent: 'flex-end', position: 'relative' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  goalLine: { position: 'absolute', left: -4, right: -4, height: 2, borderRadius: 1 },
  barLabel: { fontSize: 11, marginTop: 4 },
  barValue: { fontSize: 10, fontWeight: '600' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chartLegendLine: { width: 16, height: 2, borderRadius: 1 },
  chartLegendText: { fontSize: 11 },

  // Averages Card
  averagesCard: { borderRadius: 16, padding: 16 },
  averagesRow: { flexDirection: 'row', alignItems: 'center' },
  averageItem: { flex: 1, alignItems: 'center' },
  averageValue: { fontSize: 24, fontWeight: '700' },
  averageLabel: { fontSize: 12, marginTop: 4 },
  averageDivider: { width: 1, height: 40 },

  // Tips Card
  tipsCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12 },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  tipsText: { fontSize: 13, lineHeight: 18 },

  // Empty State
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14 },
});
