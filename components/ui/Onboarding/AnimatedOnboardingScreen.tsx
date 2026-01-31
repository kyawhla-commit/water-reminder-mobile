import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { OnboardingWaterProgress } from './OnboardingWaterProgress';
import { ProgressIndicator } from './ProgressIndicator';
import { SkipConfirmation } from './SkipConfirmation';
import { WelcomeAnimation } from './WelcomeAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  content: React.ReactNode;
}

interface AnimatedOnboardingScreenProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  showSkipButton?: boolean;
  progressVariant?: 'dots' | 'bar' | 'numbered';
  showWelcome?: boolean;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
}

export function AnimatedOnboardingScreen({
  steps,
  onComplete,
  onSkip,
  showSkipButton = true,
  progressVariant = 'dots',
  showWelcome = true,
  welcomeTitle,
  welcomeSubtitle,
}: AnimatedOnboardingScreenProps) {
  const { colors, isDark } = useAppTheme();

  const [currentStep, setCurrentStep] = useState(showWelcome ? -1 : 0);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [welcomeComplete, setWelcomeComplete] = useState(!showWelcome);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const totalSteps = steps.length;
  const isWelcomeScreen = currentStep === -1;
  const isLastStep = currentStep === totalSteps - 1;

  const animateTransition = (direction: 'next' | 'prev', callback: () => void) => {
    const toValue = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      try {
        callback();
      } catch (error) {
        console.error('Error in transition callback:', error);
      }
      slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();

    if (isWelcomeScreen) {
      animateTransition('next', () => setCurrentStep(0));
    } else if (isLastStep) {
      // Delay onComplete to allow animation to finish
      setTimeout(() => {
        try {
          onComplete();
        } catch (error) {
          console.error('Error in onComplete:', error);
        }
      }, 100);
    } else {
      animateTransition('next', () => setCurrentStep((prev) => prev + 1));
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      animateTransition('prev', () => setCurrentStep((prev) => prev - 1));
    } else if (currentStep === 0 && showWelcome) {
      animateTransition('prev', () => setCurrentStep(-1));
    }
  };

  const handleSkip = () => {
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    setShowSkipModal(false);
    onSkip?.();
  };

  const renderStepContent = () => {
    if (isWelcomeScreen) {
      return (
        <WelcomeAnimation
          title={welcomeTitle}
          subtitle={welcomeSubtitle}
          onAnimationComplete={() => setWelcomeComplete(true)}
        />
      );
    }

    const step = steps[currentStep];
    return (
      <View style={styles.stepContent}>
        {step.emoji && <Text style={styles.emoji}>{step.emoji}</Text>}
        {step.icon && (
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name={step.icon} size={48} color={colors.primary} />
          </View>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{step.subtitle}</Text>
        <View style={styles.contentContainer}>{step.content}</View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with skip button */}
      <View style={styles.header}>
        {showSkipButton && !isWelcomeScreen && !isLastStep ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      {/* Progress indicator */}
      {!isWelcomeScreen && (
        <ProgressIndicator totalSteps={totalSteps} currentStep={currentStep} variant={progressVariant} />
      )}

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {renderStepContent()}
        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 || (currentStep === 0 && showWelcome) ? (
          <TouchableOpacity style={styles.backButton} onPress={handlePrev} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={isWelcomeScreen && !welcomeComplete}
          >
            <Text style={styles.nextButtonText}>
              {isWelcomeScreen ? 'Get Started' : isLastStep ? "Let's Go!" : 'Continue'}
            </Text>
            <Ionicons name={isLastStep ? 'checkmark' : 'arrow-forward'} size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Skip confirmation modal */}
      <SkipConfirmation visible={showSkipModal} onConfirm={confirmSkip} onCancel={() => setShowSkipModal(false)} />
    </KeyboardAvoidingView>
  );
}

// Pre-built step components for common onboarding patterns
export function WaterGoalStep({ amount, unit = 'ml' }: { amount: number; unit?: 'ml' | 'oz' }) {
  return <OnboardingWaterProgress targetAmount={amount} unit={unit} size={200} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
  },
  animatedContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AnimatedOnboardingScreen;
