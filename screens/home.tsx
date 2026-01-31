import { DailyTipCard } from '@/components/DailyTipCard';
import { WATER_INTAKE_OPTIONS } from '@/config';
import { useTranslation } from '@/hooks/useTranslation';
import { useWaterTracker } from '@/hooks/useWaterTracker';
import { useWidget } from '@/hooks/useWidget';
import AddWaterModal from '@/modals/AddWater';
import { useAppConfigStore } from '@/store';
import { darkTheme, lightTheme } from '@/styles/theme';
import { formatWaterAmount, getGreeting } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppConfigStore((state: { theme: 'light' | 'dark' }) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const [showAddWaterModal, setShowAddWaterModal] = useState(false);
  
  const { dailyIntake, dailyWaterGoal, progress, isGoalReached, addIntake } = useWaterTracker();

  // Widget integration - auto-syncs when intake changes
  const { updateWidgetData } = useWidget({
    currentIntake: dailyIntake,
    dailyGoal: dailyWaterGoal,
    streakDays: 0, // TODO: Get from water history service
    autoSync: true,
  });

  // Determine language from translation
  const language = t('common.done') === 'ပြီးပါပြီ' ? 'my' : 'en';

  const handleQuickAdd = async (amount: number) => {
    try {
      await addIntake(amount);
      // Widget updates automatically via useWidget hook
    } catch (error) {
      console.error('Error adding water:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/social')} style={styles.headerButton}>
              <Ionicons name="people-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerButton}>
              <Ionicons name="settings-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Water Progress Card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundLight }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('water.title')}</Text>
            <TouchableOpacity onPress={() => router.push('/water-history')}>
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.neutral }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%`, backgroundColor: colors.primary }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textLight }]}>
              {formatWaterAmount(dailyIntake)} / {formatWaterAmount(dailyWaterGoal)}
            </Text>
          </View>
          {isGoalReached && (
            <Text style={[styles.goalText, { color: colors.success }]}>{t('home.goalReached')}</Text>
          )}
          
          {/* Quick Add Buttons */}
          <View style={styles.quickAddContainer}>
            {WATER_INTAKE_OPTIONS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.quickAddButton, { backgroundColor: colors.primary }]}
                onPress={() => handleQuickAdd(amount)}
              >
                <Text style={styles.quickAddText}>+{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddWaterModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>{t('home.customAmount')}</Text>
          </TouchableOpacity>

          {/* Beverages Button */}
          <TouchableOpacity
            style={[styles.beveragesButton, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}
            onPress={() => router.push('/beverages')}
          >
            <Text style={styles.beveragesIcon}>🥤</Text>
            <Text style={[styles.beveragesText, { color: colors.secondary }]}>
              {t('common.done') === 'ပြီးပါပြီ' ? 'အချိုရည်များ' : 'Track Beverages'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Sleep Card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundLight }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('sleep.title')}</Text>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.secondary }]}
            onPress={() => router.push('/sleep')}
          >
            <Ionicons name="moon-outline" size={20} color={colors.secondary} />
            <Text style={[styles.actionButtonText, { color: colors.secondary }]}>{t('home.logSleep')}</Text>
          </TouchableOpacity>
        </View>

        {/* Focus Card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundLight }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('focus.title')}</Text>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.success }]}
            onPress={() => router.push('/focus')}
          >
            <Ionicons name="timer-outline" size={20} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>{t('home.startSession')}</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Tip Card */}
        <DailyTipCard 
          language={language as 'en' | 'my'} 
          onPress={() => router.push('/tips')}
          showActions={true}
        />

        {/* Quick Links */}
        <View style={styles.quickLinksContainer}>
          <TouchableOpacity
            style={[styles.quickLinkCard, { backgroundColor: colors.backgroundLight }]}
            onPress={() => router.push('/tips')}
          >
            <Text style={styles.quickLinkIcon}>💡</Text>
            <Text style={[styles.quickLinkText, { color: colors.text }]}>
              {language === 'my' ? 'အကြံပြုချက်များ' : 'Health Tips'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickLinkCard, { backgroundColor: colors.backgroundLight }]}
            onPress={() => router.push('/widget-settings')}
          >
            <Text style={styles.quickLinkIcon}>📱</Text>
            <Text style={[styles.quickLinkText, { color: colors.text }]}>
              {language === 'my' ? 'ဝစ်ဂျက်' : 'Widget'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickLinkCard, { backgroundColor: colors.backgroundLight }]}
            onPress={() => router.push('/beverage-stats')}
          >
            <Text style={styles.quickLinkIcon}>📊</Text>
            <Text style={[styles.quickLinkText, { color: colors.text }]}>
              {language === 'my' ? 'စာရင်းအင်း' : 'Stats'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddWaterModal
        visible={showAddWaterModal}
        onClose={() => setShowAddWaterModal(false)}
        onAdd={addIntake}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  quickAddContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quickAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickAddText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  beveragesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  beveragesIcon: {
    fontSize: 18,
  },
  beveragesText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  quickLinkCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickLinkIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HomeScreen;
