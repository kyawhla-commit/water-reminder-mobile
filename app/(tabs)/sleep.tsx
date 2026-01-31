import { useAppTheme } from '@/hooks/useAppTheme';
import { usePullRefresh } from '@/hooks/usePullRefresh';
import { SleepRecord } from '@/interfaces';
import AddSleepModal from '@/modals/AddSleep';
import { getSleepRecords, getWeeklySleepStats } from '@/services/sleep';
import { formatDate } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SleepScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const sleepGoal = 8; // Default 8 hours

  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ average: 0, total: 0 });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    const sleepRecords = await getSleepRecords();
    setRecords(sleepRecords.slice(-10).reverse());
    const stats = await getWeeklySleepStats();
    setWeeklyStats(stats);
  }, []);

  const { refreshing, handleRefresh } = usePullRefresh({
    onRefresh: loadData,
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const renderSleepRecord = ({ item }: { item: SleepRecord }) => (
    <View style={[styles.recordItem, { backgroundColor: colors.card }]}>
      <View style={styles.recordLeft}>
        <Text style={[styles.recordDate, { color: colors.text }]}>
          {formatDate(item.createdAt)}
        </Text>
        <Text style={[styles.recordDuration, { color: colors.textSecondary }]}>
          {formatDuration(item.duration)}
        </Text>
      </View>
      <View style={styles.recordRight}>
        {item.quality && (
          <View style={styles.qualityContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= item.quality! ? 'star' : 'star-outline'}
                size={16}
                color={star <= item.quality! ? '#FFD700' : colors.textSecondary}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>😴 Sleep Tracker</Text>

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              {formatDuration(weeklyStats.average)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Weekly Average</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>{sleepGoal}h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goal</Text>
          </View>
        </View>

        {/* Add Sleep Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.secondary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Log Sleep</Text>
        </TouchableOpacity>

        {/* Sleep Sounds Card */}
        <TouchableOpacity
          style={[styles.soundsCard, { backgroundColor: isDark ? '#1E3A5F' : '#E8F0FE' }]}
          onPress={() => router.push('/sleep-sounds' as any)}
        >
          <View style={styles.soundsCardContent}>
            <View style={[styles.soundsIcon, { backgroundColor: isDark ? '#2D4A6F' : '#C5D9F7' }]}>
              <Text style={styles.soundsEmoji}>🌙</Text>
            </View>
            <View style={styles.soundsInfo}>
              <Text style={[styles.soundsTitle, { color: colors.text }]}>Sleep Sounds</Text>
              <Text style={[styles.soundsSubtitle, { color: colors.textSecondary }]}>
                Rain, ocean, forest & more
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Sleep-Hydration Correlation Card */}
        <TouchableOpacity
          style={[styles.soundsCard, { backgroundColor: isDark ? '#2D1B4E' : '#F3E5F5' }]}
          onPress={() => router.push('/sleep-hydration' as any)}
        >
          <View style={styles.soundsCardContent}>
            <View style={[styles.soundsIcon, { backgroundColor: isDark ? '#4A2D6F' : '#E1BEE7' }]}>
              <Text style={styles.soundsEmoji}>💧😴</Text>
            </View>
            <View style={styles.soundsInfo}>
              <Text style={[styles.soundsTitle, { color: colors.text }]}>Sleep & Hydration</Text>
              <Text style={[styles.soundsSubtitle, { color: colors.textSecondary }]}>
                See how water affects your sleep
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* AI Sleep Score Card */}
        <TouchableOpacity
          style={[styles.soundsCard, { backgroundColor: isDark ? '#1B3D2F' : '#E8F5E9' }]}
          onPress={() => router.push('/sleep-score' as any)}
        >
          <View style={styles.soundsCardContent}>
            <View style={[styles.soundsIcon, { backgroundColor: isDark ? '#2D4A3F' : '#C8E6C9' }]}>
              <Text style={styles.soundsEmoji}>🧠</Text>
            </View>
            <View style={styles.soundsInfo}>
              <Text style={[styles.soundsTitle, { color: colors.text }]}>AI Sleep Score</Text>
              <Text style={[styles.soundsSubtitle, { color: colors.textSecondary }]}>
                Analyze your sleep quality
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Bedtime Reminders Card */}
        <TouchableOpacity
          style={[styles.soundsCard, { backgroundColor: isDark ? '#3D2B1F' : '#FFF3E0' }]}
          onPress={() => router.push('/bedtime-reminders' as any)}
        >
          <View style={styles.soundsCardContent}>
            <View style={[styles.soundsIcon, { backgroundColor: isDark ? '#5D4037' : '#FFE0B2' }]}>
              <Text style={styles.soundsEmoji}>⏰</Text>
            </View>
            <View style={styles.soundsInfo}>
              <Text style={[styles.soundsTitle, { color: colors.text }]}>Bedtime Reminders</Text>
              <Text style={[styles.soundsSubtitle, { color: colors.textSecondary }]}>
                Wind-down notifications
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Sleep Debt & Smart Alarm Card */}
        <TouchableOpacity
          style={[styles.soundsCard, { backgroundColor: isDark ? '#1F3D3D' : '#E0F2F1' }]}
          onPress={() => router.push('/sleep-debt' as any)}
        >
          <View style={styles.soundsCardContent}>
            <View style={[styles.soundsIcon, { backgroundColor: isDark ? '#2D4A4A' : '#B2DFDB' }]}>
              <Text style={styles.soundsEmoji}>📊</Text>
            </View>
            <View style={styles.soundsInfo}>
              <Text style={[styles.soundsTitle, { color: colors.text }]}>Sleep Debt & Alarm</Text>
              <Text style={[styles.soundsSubtitle, { color: colors.textSecondary }]}>
                Track debt & smart wake
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Recent Records */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Sleep</Text>
        {records.length > 0 ? (
          <FlatList
            data={records}
            renderItem={renderSleepRecord}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No sleep records yet. Start tracking your sleep!
          </Text>
        )}
      </ScrollView>

      <AddSleepModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdd={loadData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  recordLeft: {},
  recordDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  recordDuration: {
    fontSize: 14,
    marginTop: 4,
  },
  recordRight: {},
  qualityContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  soundsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  soundsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundsEmoji: {
    fontSize: 24,
  },
  soundsInfo: {},
  soundsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  soundsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
