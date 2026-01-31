import { SleepRecord } from '@/interfaces';
import AddSleepModal from '@/modals/AddSleep';
import { getSleepRecords, getWeeklySleepStats } from '@/services/sleep';
import { useAppConfigStore } from '@/store';
import { darkTheme, lightTheme } from '@/styles/theme';
import { formatDate } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SleepScreen = () => {
  const router = useRouter();
  const theme = useAppConfigStore((state: { theme: 'light' | 'dark' }) => state.theme);
  const sleepGoal = useAppConfigStore((state: { sleepGoal: number }) => state.sleepGoal);
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ average: 0, total: 0 });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const sleepRecords = await getSleepRecords();
    setRecords(sleepRecords.slice(-10).reverse());
    const stats = await getWeeklySleepStats();
    setWeeklyStats(stats);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const renderSleepRecord = ({ item }: { item: SleepRecord }) => (
    <View style={[styles.recordItem, { backgroundColor: colors.backgroundLight }]}>
      <View style={styles.recordLeft}>
        <Text style={[styles.recordDate, { color: colors.text }]}>
          {formatDate(item.createdAt)}
        </Text>
        <Text style={[styles.recordDuration, { color: colors.textLight }]}>
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
                color={star <= item.quality! ? '#FFD700' : colors.neutral}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sleep Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.backgroundLight }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              {formatDuration(weeklyStats.average)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Weekly Average</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.neutral }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              {sleepGoal}h
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Goal</Text>
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
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            No sleep records yet. Start tracking your sleep!
          </Text>
        )}
      </ScrollView>

      <AddSleepModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={loadData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 20,
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
});

export default SleepScreen;
