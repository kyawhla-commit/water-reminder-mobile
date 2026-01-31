import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface ProgressIndicatorProps {
  totalSteps: number;
  currentStep: number;
  variant?: 'dots' | 'bar' | 'numbered';
}

export function ProgressIndicator({ totalSteps, currentStep, variant = 'dots' }: ProgressIndicatorProps) {
  const { colors, isDark } = useAppTheme();

  if (variant === 'bar') {
    return <ProgressBar totalSteps={totalSteps} currentStep={currentStep} />;
  }

  if (variant === 'numbered') {
    return <NumberedProgress totalSteps={totalSteps} currentStep={currentStep} />;
  }

  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <ProgressDot key={index} isActive={index <= currentStep} isCurrent={index === currentStep} />
      ))}
    </View>
  );
}

function ProgressDot({ isActive, isCurrent }: { isActive: boolean; isCurrent: boolean }) {
  const { colors, isDark } = useAppTheme();
  const widthAnim = useRef(new Animated.Value(isCurrent ? 24 : 10)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: isCurrent ? 24 : 10,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [isCurrent, widthAnim]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: widthAnim,
          backgroundColor: isActive ? colors.primary : isDark ? colors.surfaceVariant : colors.border,
        },
      ]}
    />
  );
}

function ProgressBar({ totalSteps, currentStep }: { totalSteps: number; currentStep: number }) {
  const { colors, isDark } = useAppTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const progress = (currentStep + 1) / totalSteps;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [progress]);

  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barContainer}>
      <View style={[styles.barBackground, { backgroundColor: isDark ? colors.surfaceVariant : colors.border }]}>
        <Animated.View style={[styles.barFill, { width, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.barText, { color: colors.textSecondary }]}>
        {currentStep + 1} / {totalSteps}
      </Text>
    </View>
  );
}

function NumberedProgress({ totalSteps, currentStep }: { totalSteps: number; currentStep: number }) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.numberedContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index <= currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={index}>
            <View
              style={[
                styles.numberedDot,
                {
                  backgroundColor: isActive ? colors.primary : isDark ? colors.surfaceVariant : colors.border,
                  borderWidth: isCurrent ? 2 : 0,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[styles.numberedText, { color: isActive ? '#fff' : colors.textSecondary }]}
              >
                {index + 1}
              </Text>
            </View>
            {index < totalSteps - 1 && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: index < currentStep ? colors.primary : isDark ? colors.surfaceVariant : colors.border },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  barContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  barBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  numberedContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  numberedDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connector: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
  },
});

export default ProgressIndicator;
