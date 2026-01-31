import {
    AnimatedOnboardingScreen,
    OnboardingWaterProgress,
    type OnboardingStep,
} from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ActivityLevel, useUserProfileStore } from '@/store/userProfile';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const { profile, setProfile, completeOnboarding } = useUserProfileStore();

  const activityOptions: { value: ActivityLevel; label: string; desc: string; icon: string }[] = [
    { value: 'sedentary', label: t('onboarding.sedentary'), desc: t('onboarding.sedentaryDesc'), icon: 'desktop-outline' },
    { value: 'light', label: t('onboarding.light'), desc: t('onboarding.lightDesc'), icon: 'walk-outline' },
    { value: 'moderate', label: t('onboarding.moderate'), desc: t('onboarding.moderateDesc'), icon: 'bicycle-outline' },
    { value: 'active', label: t('onboarding.active'), desc: t('onboarding.activeDesc'), icon: 'fitness-outline' },
    { value: 'very_active', label: t('onboarding.veryActive'), desc: t('onboarding.veryActiveDesc'), icon: 'barbell-outline' },
  ];

  // Memoize step content to prevent re-renders that dismiss keyboard
  const nameStepContent = useMemo(() => (
    <View style={styles.stepInner}>
      <TextInput
        style={[styles.input, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: colors.text }]}
        placeholder={t('onboarding.whatsYourName')}
        placeholderTextColor={colors.textSecondary}
        defaultValue={profile.name}
        onChangeText={(text) => setProfile({ name: text })}
        autoCorrect={false}
        autoCapitalize="words"
      />
    </View>
  ), [isDark, colors.text, colors.textSecondary, t]);

  const weightStepContent = useMemo(() => (
    <View style={styles.stepInner}>
      <TextInput
        style={[styles.weightInput, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: colors.text }]}
        keyboardType="numeric"
        defaultValue={profile.weight.toString()}
        onChangeText={(text) => setProfile({ weight: parseInt(text) || 0 })}
      />
      <View style={[styles.unitToggle, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5' }]}>
        {(['kg', 'lbs'] as const).map((unit) => (
          <TouchableOpacity
            key={unit}
            style={[
              styles.unitButton,
              profile.weightUnit === unit && { backgroundColor: colors.primary },
            ]}
            onPress={() => setProfile({ weightUnit: unit })}
          >
            <Text style={[styles.unitText, { color: profile.weightUnit === unit ? '#fff' : colors.text }]}>
              {unit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [isDark, colors.text, colors.primary, profile.weightUnit]);

  const activityStepContent = useMemo(() => (
    <ScrollView style={styles.activityScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.activityList}>
        {activityOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.activityOption,
              { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5' },
              profile.activityLevel === option.value && { backgroundColor: colors.primary },
            ]}
            onPress={() => setProfile({ activityLevel: option.value })}
          >
            <Ionicons
              name={option.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={profile.activityLevel === option.value ? '#fff' : colors.primary}
            />
            <View style={styles.activityText}>
              <Text style={[styles.activityLabel, { color: profile.activityLevel === option.value ? '#fff' : colors.text }]}>
                {option.label}
              </Text>
              <Text style={[styles.activityDesc, { color: profile.activityLevel === option.value ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
                {option.desc}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  ), [isDark, colors.text, colors.textSecondary, colors.primary, profile.activityLevel, activityOptions]);

  const scheduleStepContent = useMemo(() => (
    <View style={styles.scheduleContainer}>
      <View style={styles.timeRow}>
        <Ionicons name="sunny-outline" size={28} color="#FFB300" />
        <Text style={[styles.timeLabel, { color: colors.text }]}>{t('onboarding.wakeUp')}</Text>
        <TextInput
          style={[styles.timeInput, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: colors.text }]}
          defaultValue={profile.wakeTime}
          onChangeText={(text) => setProfile({ wakeTime: text })}
          placeholder="07:00"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      <View style={styles.timeRow}>
        <Ionicons name="moon-outline" size={28} color="#7C4DFF" />
        <Text style={[styles.timeLabel, { color: colors.text }]}>{t('onboarding.sleepTime')}</Text>
        <TextInput
          style={[styles.timeInput, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5', color: colors.text }]}
          defaultValue={profile.sleepTime}
          onChangeText={(text) => setProfile({ sleepTime: text })}
          placeholder="23:00"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  ), [isDark, colors.text, colors.textSecondary, t]);

  const goalStepContent = useMemo(() => (
    <View style={styles.goalContainer}>
      <OnboardingWaterProgress targetAmount={profile.dailyWaterGoal} unit="ml" size={200} />
      <Text style={[styles.goalSubtext, { color: colors.textSecondary }]}>
        ({(profile.dailyWaterGoal / 1000).toFixed(1)} {t('onboarding.litersPerDay')})
      </Text>
      <Text style={[styles.goalNote, { color: colors.textSecondary }]}>
        {t('onboarding.adjustAnytime')}
      </Text>
    </View>
  ), [colors.textSecondary, profile.dailyWaterGoal, t]);

  // Define onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: 'name',
      title: t('onboarding.welcome'),
      subtitle: t('onboarding.personalizeJourney'),
      emoji: '💧',
      content: nameStepContent,
    },
    {
      id: 'weight',
      title: t('onboarding.yourWeight'),
      subtitle: t('onboarding.weightHelp'),
      emoji: '⚖️',
      content: weightStepContent,
    },
    {
      id: 'activity',
      title: t('onboarding.activityLevel'),
      subtitle: t('onboarding.activityHelp'),
      emoji: '🏃',
      content: activityStepContent,
    },
    {
      id: 'schedule',
      title: t('onboarding.yourSchedule'),
      subtitle: t('onboarding.scheduleHelp'),
      emoji: '⏰',
      content: scheduleStepContent,
    },
    {
      id: 'goal',
      title: t('onboarding.yourDailyGoal'),
      subtitle: t('onboarding.basedOnProfile'),
      emoji: '🎯',
      content: goalStepContent,
    },
  ];

  const handleComplete = async () => {
    try {
      completeOnboarding();
      // Small delay to ensure state is persisted before navigation
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    try {
      completeOnboarding();
      // Small delay to ensure state is persisted before navigation
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      router.replace('/(tabs)');
    }
  };

  return (
    <AnimatedOnboardingScreen
      steps={steps}
      onComplete={handleComplete}
      onSkip={handleSkip}
      showSkipButton={true}
      progressVariant="dots"
      showWelcome={true}
      welcomeTitle={t('onboarding.welcomeTitle') || 'Stay Hydrated'}
      welcomeSubtitle={t('onboarding.welcomeSubtitle') || 'Your personal water reminder'}
    />
  );
}

const styles = StyleSheet.create({
  stepInner: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
  },
  weightInput: {
    width: 160,
    height: 90,
    borderRadius: 24,
    fontSize: 42,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 4,
  },
  unitButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityScroll: {
    width: '100%',
    maxHeight: 320,
  },
  activityList: {
    width: '100%',
    gap: 10,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  activityText: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  scheduleContainer: {
    width: '100%',
    gap: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timeLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
  },
  timeInput: {
    width: 100,
    height: 50,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  goalContainer: {
    alignItems: 'center',
    width: '100%',
  },
  goalSubtext: {
    fontSize: 16,
    marginTop: 16,
  },
  goalNote: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
