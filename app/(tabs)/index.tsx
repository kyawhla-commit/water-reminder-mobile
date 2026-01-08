import AIInsightsCard from '@/components/AIInsightsCard';
import InsightsCard from '@/components/InsightsCard';
import WaterProgress from '@/components/WaterProgress';
import WeatherCard from '@/components/WeatherCard';
import { WATER_INTAKE_OPTIONS } from '@/config';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useWaterTracker } from '@/hooks/useWaterTracker';
import AddWaterModal from '@/modals/AddWater';
import { checkAndUnlockAchievements } from '@/services/achievements';
import { updateAndroidWidget } from '@/services/androidWidget';
import { checkAndResetDaily } from '@/services/dailyReset';
import { updateEcoImpact } from '@/services/ecoImpact';
import { feedPet, loadPet } from '@/services/virtualPet';
import { calculateStats, saveWaterEntry } from '@/services/waterHistory';
import { useUserProfileStore } from '@/store/userProfile';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const [showAddWaterModal, setShowAddWaterModal] = useState(false);

  const userName = useUserProfileStore((state) => state.profile.name);
  const { dailyIntake, dailyWaterGoal, isGoalReached, addIntake, resetIntake } = useWaterTracker();

  // Check for daily reset on mount and when app comes to foreground
  useEffect(() => {
    const checkReset = async () => {
      const wasReset = await checkAndResetDaily();
      if (wasReset) {
        resetIntake();
      }
    };
    checkReset();
  }, []);

  // Sync widget when intake changes
  useEffect(() => {
    updateAndroidWidget(dailyIntake, dailyWaterGoal);
  }, [dailyIntake, dailyWaterGoal]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  const personalGreeting = userName ? t('home.hi', { name: userName }) : getGreeting();

  const handleQuickAdd = async (amount: number) => {
    try {
      await addIntake(amount);
      await saveWaterEntry(amount, dailyWaterGoal);
      await updateEcoImpact(amount);
      await updateAndroidWidget(dailyIntake + amount, dailyWaterGoal);
      
      // Feed virtual pet
      const pet = await loadPet();
      if (pet) {
        await feedPet(amount);
      }
      
      await checkForAchievements();
    } catch (error) {
      console.error('Error adding water:', error);
    }
  };

  const handleCustomAdd = async (amount: number) => {
    try {
      await addIntake(amount);
      await saveWaterEntry(amount, dailyWaterGoal);
      await updateEcoImpact(amount);
      await updateAndroidWidget(dailyIntake + amount, dailyWaterGoal);
      
      // Feed virtual pet
      const pet = await loadPet();
      if (pet) {
        await feedPet(amount);
      }
      
      await checkForAchievements();
    } catch (error) {
      console.error('Error adding water:', error);
    }
  };

  const checkForAchievements = async () => {
    try {
      const stats = await calculateStats(dailyWaterGoal);
      const newAchievements = await checkAndUnlockAchievements(
        stats.currentStreak,
        stats.monthlyAverage * 30,
        Math.round(stats.goalCompletionRate * stats.totalDaysTracked / 100),
        dailyIntake,
        dailyWaterGoal
      );
      
      if (newAchievements.length > 0) {
        const achievement = newAchievements[0];
        Alert.alert(
          `${achievement.icon} ${t('common.done')}!`,
          `${achievement.title}\n${achievement.description}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>{personalGreeting}</Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>{t('home.stayHydrated')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Water Progress Card */}
        <View style={[styles.waterCard, { backgroundColor: colors.card }]}>
          <View style={styles.progressWrapper}>
            <WaterProgress current={dailyIntake} goal={dailyWaterGoal} size={200} />
          </View>

          {isGoalReached && (
            <View style={[styles.goalBanner, { backgroundColor: isDark ? '#1B5E20' : '#E8F5E9' }]}>
              <Text style={[styles.goalBannerText, { color: isDark ? '#A5D6A7' : '#2E7D32' }]}>
                {t('home.goalReached')}
              </Text>
            </View>
          )}

          {/* Quick Add Buttons */}
          <Text style={[styles.quickAddLabel, { color: colors.textSecondary }]}>{t('home.quickAdd')}</Text>
          <View style={styles.quickAddContainer}>
            {WATER_INTAKE_OPTIONS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.quickAddButton, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}
                onPress={() => handleQuickAdd(amount)}
                activeOpacity={0.7}
              >
                <Ionicons name="water" size={16} color={colors.primary} />
                <Text style={[styles.quickAddText, { color: colors.primary }]}>+{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddWaterModal(true)}
          >
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.customButtonText}>{t('home.customAmount')}</Text>
          </TouchableOpacity>
        </View>

        {/* Weather Card */}
        <WeatherCard baseGoal={dailyWaterGoal} />

        {/* AI Insights */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🤖 AI {t('home.insights')}</Text>
        <AIInsightsCard dailyGoal={dailyWaterGoal} currentIntake={dailyIntake} />

        {/* Personalized Insights */}
        <InsightsCard />

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.quickActions')}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/achievements' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="trophy" size={24} color="#FF9800" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'အောင်မြင်မှု' : 'Achievements'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'ဆုများရယူပါ' : 'Earn badges'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/eco-impact' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="leaf" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'သဘာဝ' : 'Eco Impact'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'ပုလင်းချွေတာ' : 'Save bottles'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/health-articles' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="book" size={24} color="#2196F3" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'ဆောင်းပါး' : 'Articles'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'ကျန်းမာရေး' : 'Health tips'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/virtual-pet' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="paw" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'အိမ်မွေး' : 'Pet'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'ကြီးထွားစေ' : 'Grow it'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/health-correlations' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="analytics" size={24} color="#9C27B0" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'ဆက်စပ်မှု' : 'Correlations'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'ကျန်းမာရေး' : 'Track health'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/history' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="stats-chart" size={24} color="#2196F3" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{t('home.history')}</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{t('home.viewStats')}</Text>
          </TouchableOpacity>
        </View>

        {/* Third Row Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/wellness-dashboard' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="heart" size={24} color="#27AE60" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'ကျန်းမာရေး' : 'Wellness'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'ရမှတ်ကြည့်' : 'View score'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/notifications-settings' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="notifications" size={24} color="#FFA000" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'သတိပေး' : 'Reminders'}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'စမတ်သတိပေး' : 'Smart alerts'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/settings' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ECEFF1' }]}>
              <Ionicons name="settings" size={24} color="#607D8B" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {t('common.settings')}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'စိတ်ကြိုက်' : 'Customize'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tip Card */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>💡 {t('tips.mealTip')}</Text>
        </View>
      </ScrollView>

      <AddWaterModal visible={showAddWaterModal} onClose={() => setShowAddWaterModal(false)} onAdd={handleCustomAdd} />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: '700' },
  subGreeting: { fontSize: 14, marginTop: 4 },
  settingsButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  waterCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  progressWrapper: { alignItems: 'center', marginBottom: 20 },
  goalBanner: { padding: 12, borderRadius: 12, marginBottom: 16 },
  goalBannerText: { textAlign: 'center', fontSize: 14, fontWeight: '600' },
  quickAddLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' },
  quickAddContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 16 },
  quickAddButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 6 },
  quickAddText: { fontSize: 14, fontWeight: '600' },
  customButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, gap: 8 },
  customButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 14, fontWeight: '600' },
  actionSubtitle: { fontSize: 11, marginTop: 2 },
  tipCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, alignItems: 'center' },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
