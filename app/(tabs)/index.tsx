import AIInsightsCard from '@/components/AIInsightsCard';
import InsightsCard from '@/components/InsightsCard';
import WeatherCard from '@/components/WeatherCard';
import {
    EnhancedWaterFill,
    SkeletonHomeScreen,
    useWaterFeedback,
    WaterGoalCelebration,
    WaterRippleEffect,
} from '@/components/ui';
import { WATER_INTAKE_OPTIONS } from '@/config';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePullRefresh } from '@/hooks/usePullRefresh';
import { useTranslation } from '@/hooks/useTranslation';
import { useWaterActions } from '@/hooks/useWaterActions';
import { useWaterTracker } from '@/hooks/useWaterTracker';
import AddWaterModal from '@/modals/AddWater';
import { checkAndResetDaily } from '@/services/dailyReset';
import { usePreferencesStore } from '@/store/preferences';
import { useUserProfileStore } from '@/store/userProfile';
import { formatWaterAmount } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    AppState,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const [showAddWaterModal, setShowAddWaterModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rippleTrigger, setRippleTrigger] = useState(0);
  const { preferences } = usePreferencesStore();
  const { showWaterAdded, showGoalReached } = useWaterFeedback();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const buttonScales = useRef(WATER_INTAKE_OPTIONS.map(() => new Animated.Value(1))).current;

  const userName = useUserProfileStore((state) => state.profile.name);
  const { dailyIntake, dailyWaterGoal, isGoalReached, loading, addIntake, removeIntake, resetIntake, refresh } = useWaterTracker();
  
  const { handleAddWater, syncFromWidget, updateWidget } = useWaterActions({
    dailyIntake,
    dailyWaterGoal,
    addIntake,
  });

  // Handle undo from water feedback
  const handleUndoWater = useCallback(async (amount: number) => {
    try {
      await removeIntake(amount);
    } catch (error) {
      console.error('Error undoing water:', error);
    }
  }, [removeIntake]);

  const { refreshing, handleRefresh } = usePullRefresh({
    onRefresh: async () => {
      await syncFromWidget();
      await refresh();
    },
  });

  const remaining = Math.max(0, dailyWaterGoal - dailyIntake);

  // Entry animation
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  // Celebration animation when goal reached
  useEffect(() => {
    if (isGoalReached && preferences.celebrateGoals) {
      Animated.sequence([
        Animated.timing(celebrateAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(celebrateAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
      
      if (preferences.hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [isGoalReached]);

  useEffect(() => {
    const checkReset = async () => {
      const wasReset = await checkAndResetDaily();
      if (wasReset) resetIntake();
    };
    checkReset();
  }, [resetIntake]);

  useFocusEffect(useCallback(() => { syncFromWidget(); }, [syncFromWidget]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') syncFromWidget();
    });
    return () => subscription.remove();
  }, [syncFromWidget]);

  useEffect(() => { updateWidget(); }, [dailyIntake, dailyWaterGoal, updateWidget]);

  // Show skeleton while loading
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonHomeScreen />
      </View>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  const handleQuickAdd = async (amount: number, index: number) => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScales[index], { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.spring(buttonScales[index], { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
    ]).start();

    if (preferences.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const prevIntake = dailyIntake;
    await handleAddWater(amount);
    
    // Trigger ripple animation
    setRippleTrigger(prev => prev + 1);
    
    // Show water added feedback with undo callback
    showWaterAdded(amount, 'Water', () => handleUndoWater(amount));
    
    // Check if goal was just reached
    const newTotal = prevIntake + amount;
    if (newTotal >= dailyWaterGoal && prevIntake < dailyWaterGoal) {
      setTimeout(() => {
        setShowConfetti(true);
        showGoalReached(dailyWaterGoal);
      }, 500);
    }
  };

  const personalGreeting = userName ? t('home.hi', { name: userName }) : getGreeting();

  // Quick action items
  const quickActions = [
    { icon: 'trophy', title: t('common.achievements'), subtitle: t('common.earnBadges'), color: '#FF9800', bg: '#FFF3E0', route: '/achievements' },
    { icon: 'leaf', title: t('home.ecoImpact'), subtitle: t('home.saveBottles'), color: '#4CAF50', bg: '#E8F5E9', route: '/eco-impact' },
    { icon: 'stats-chart', title: t('home.history'), subtitle: t('home.viewStats'), color: '#2196F3', bg: '#E3F2FD', route: '/history' },
  ];

  const moreActions = [
    { icon: 'paw', title: t('home.pet'), subtitle: t('home.growIt'), color: '#4CAF50', bg: '#E8F5E9', route: '/virtual-pet' },
    { icon: 'heart', title: t('home.wellness'), subtitle: t('home.viewScore'), color: '#E91E63', bg: '#FCE4EC', route: '/wellness-dashboard' },
    { icon: 'notifications', title: t('home.reminders'), subtitle: t('home.smartAlerts'), color: '#FFA000', bg: '#FFF8E1', route: '/notifications-settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.card}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.text }]}>{personalGreeting}</Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
              {isGoalReached ? '🎉 ' + t('home.goalReached') : t('home.stayHydrated')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Main Progress Card */}
        <Animated.View 
          style={[
            styles.mainCard, 
            { 
              backgroundColor: colors.card,
              transform: [{ scale: Animated.add(1, Animated.multiply(celebrateAnim, 0.02)) }],
            }
          ]}
        >
          {/* Progress Circle with Enhanced Animation */}
          <View style={styles.progressSection}>
            <EnhancedWaterFill 
              current={dailyIntake} 
              goal={dailyWaterGoal} 
              size={180}
              onGoalReached={() => {
                if (preferences.celebrateGoals) {
                  setShowConfetti(true);
                }
              }}
            />
            {/* Ripple effect when adding water */}
            <WaterRippleEffect trigger={rippleTrigger} size={200} style={styles.rippleOverlay} />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {formatWaterAmount(dailyIntake)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('home.consumed') || 'Consumed'}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatWaterAmount(dailyWaterGoal)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('home.goal') || 'Goal'}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: isGoalReached ? colors.success : colors.warning }]}>
                {isGoalReached ? '✓' : formatWaterAmount(remaining)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isGoalReached ? t('home.complete') || 'Complete' : t('home.remaining') || 'Remaining'}
              </Text>
            </View>
          </View>

          {/* Quick Add Buttons */}
          <View style={styles.quickAddSection}>
            <Text style={[styles.quickAddLabel, { color: colors.textSecondary }]}>
              {t('home.quickAdd')}
            </Text>
            <View style={styles.quickAddGrid}>
              {WATER_INTAKE_OPTIONS.map((amount, index) => (
                <Animated.View 
                  key={amount} 
                  style={{ transform: [{ scale: buttonScales[index] }] }}
                >
                  <TouchableOpacity
                    style={[
                      styles.quickAddButton,
                      { backgroundColor: isDark ? colors.surfaceVariant : '#E3F2FD' },
                    ]}
                    onPress={() => handleQuickAdd(amount, index)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="water" size={18} color={colors.primary} />
                    <Text style={[styles.quickAddText, { color: colors.primary }]}>
                      +{amount}ml
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Custom Amount Button */}
          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (preferences.hapticFeedback) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setShowAddWaterModal(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.customButtonText}>{t('home.customAmount')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Weather Card */}
        <WeatherCard baseGoal={dailyWaterGoal} />

        {/* AI Insights */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🤖 AI {t('home.insights')}</Text>
        </View>
        <AIInsightsCard dailyGoal={dailyWaterGoal} currentIntake={dailyIntake} />

        {/* Personalized Insights */}
        <InsightsCard />

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.quickActions')}</Text>
        </View>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.route}
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]} numberOfLines={1}>
                {action.title}
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* More Actions */}
        <View style={styles.actionsGrid}>
          {moreActions.map((action) => (
            <TouchableOpacity
              key={action.route}
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]} numberOfLines={1}>
                {action.title}
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tip Card */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1A237E' : '#E8EAF6' }]}>
          <View style={styles.tipIcon}>
            <Text style={styles.tipEmoji}>💡</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>
              {t('home.dailyTip') || 'Daily Tip'}
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {t('tips.mealTip')}
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </Animated.ScrollView>

      <AddWaterModal
        visible={showAddWaterModal}
        onClose={() => setShowAddWaterModal(false)}
        onAdd={async (amount) => {
          const prevIntake = dailyIntake;
          await handleAddWater(amount);
          
          // Trigger ripple animation
          setRippleTrigger(prev => prev + 1);
          
          // Show water added feedback with undo callback
          showWaterAdded(amount, 'Water', () => handleUndoWater(amount));
          
          // Check if goal was just reached
          const newTotal = prevIntake + amount;
          if (newTotal >= dailyWaterGoal && prevIntake < dailyWaterGoal) {
            setTimeout(() => {
              setShowConfetti(true);
              showGoalReached(dailyWaterGoal);
            }, 500);
          }
        }}
      />

      {/* Confetti celebration for goal reached */}
      <WaterGoalCelebration 
        trigger={showConfetti} 
        goalAmount={dailyWaterGoal}
        onComplete={() => setShowConfetti(false)}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 15,
    marginTop: 4,
  },
  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  rippleOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -100,
    marginTop: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    opacity: 0.3,
  },
  quickAddSection: {
    marginBottom: 16,
  },
  quickAddLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  quickAddText: {
    fontSize: 15,
    fontWeight: '600',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  customButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipEmoji: {
    fontSize: 22,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
