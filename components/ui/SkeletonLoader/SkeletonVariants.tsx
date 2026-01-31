import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, Dimensions, Easing, StyleSheet, View, ViewStyle } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Shimmer effect skeleton with gradient animation
interface ShimmerSkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerSkeleton({ width = '100%', height = 20, borderRadius = 4, style }: ShimmerSkeletonProps) {
  const { colors, isDark } = useAppTheme();
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const backgroundColor = isDark ? colors.surfaceVariant : colors.border;
  const shimmerColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)';

  return (
    <View
      style={[
        styles.shimmerContainer,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: shimmerColor,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

// Pulse skeleton with scale animation
interface PulseSkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function PulseSkeleton({ width = '100%', height = 20, borderRadius = 4, style }: PulseSkeletonProps) {
  const { colors, isDark } = useAppTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const backgroundColor = isDark ? colors.surfaceVariant : colors.border;

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          transform: [{ scale: pulseAnim }],
        },
        style,
      ]}
    />
  );
}

// Home screen skeleton
export function SkeletonHomeScreen() {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.homeContainer, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.homeHeader}>
        <View>
          <ShimmerSkeleton width={120} height={16} />
          <ShimmerSkeleton width={180} height={24} style={styles.mt8} />
        </View>
        <ShimmerSkeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Water progress */}
      <View style={styles.progressContainer}>
        <ShimmerSkeleton width={200} height={200} borderRadius={100} />
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        {[1, 2, 3, 4].map((i) => (
          <ShimmerSkeleton key={i} width={70} height={70} borderRadius={16} />
        ))}
      </View>

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <ShimmerSkeleton width="48%" height={100} borderRadius={16} />
        <ShimmerSkeleton width="48%" height={100} borderRadius={16} />
      </View>

      {/* Recent activity */}
      <ShimmerSkeleton width={140} height={20} style={styles.mt24} />
      <View style={styles.activityList}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.activityItem}>
            <ShimmerSkeleton width={40} height={40} borderRadius={20} />
            <View style={styles.activityContent}>
              <ShimmerSkeleton width="70%" height={14} />
              <ShimmerSkeleton width="40%" height={12} style={styles.mt4} />
            </View>
            <ShimmerSkeleton width={50} height={20} borderRadius={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

// Stats/History screen skeleton
export function SkeletonStatsScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.statsContainer, { backgroundColor: colors.background }]}>
      {/* Period selector */}
      <View style={styles.periodSelector}>
        {['Day', 'Week', 'Month'].map((_, i) => (
          <ShimmerSkeleton key={i} width={80} height={36} borderRadius={18} />
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <ShimmerSkeleton width="100%" height={200} borderRadius={16} />
      </View>

      {/* Summary cards */}
      <View style={styles.summaryCards}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.summaryCard}>
            <ShimmerSkeleton width={40} height={40} borderRadius={20} />
            <ShimmerSkeleton width={60} height={24} style={styles.mt8} />
            <ShimmerSkeleton width={80} height={12} style={styles.mt4} />
          </View>
        ))}
      </View>

      {/* History list */}
      <ShimmerSkeleton width={100} height={18} style={styles.mt24} />
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.historyItem}>
          <View style={styles.historyLeft}>
            <ShimmerSkeleton width={44} height={44} borderRadius={12} />
            <View style={styles.historyText}>
              <ShimmerSkeleton width={100} height={14} />
              <ShimmerSkeleton width={60} height={12} style={styles.mt4} />
            </View>
          </View>
          <ShimmerSkeleton width={70} height={20} borderRadius={10} />
        </View>
      ))}
    </View>
  );
}

// Settings screen skeleton
export function SkeletonSettingsScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.settingsContainer, { backgroundColor: colors.background }]}>
      {/* Profile section */}
      <View style={styles.profileSection}>
        <ShimmerSkeleton width={80} height={80} borderRadius={40} />
        <View style={styles.profileInfo}>
          <ShimmerSkeleton width={140} height={20} />
          <ShimmerSkeleton width={180} height={14} style={styles.mt8} />
        </View>
      </View>

      {/* Settings groups */}
      {[1, 2, 3].map((group) => (
        <View key={group} style={styles.settingsGroup}>
          <ShimmerSkeleton width={100} height={14} style={styles.groupTitle} />
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <ShimmerSkeleton width={36} height={36} borderRadius={8} />
                <ShimmerSkeleton width={120} height={16} style={styles.ml12} />
              </View>
              <ShimmerSkeleton width={24} height={24} borderRadius={4} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// Beverage/Drink selection skeleton
export function SkeletonBeverageGrid() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.beverageContainer, { backgroundColor: colors.background }]}>
      <ShimmerSkeleton width={160} height={24} style={styles.mb16} />
      <View style={styles.beverageGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <View key={i} style={styles.beverageItem}>
            <ShimmerSkeleton width={60} height={60} borderRadius={30} />
            <ShimmerSkeleton width={50} height={12} style={styles.mt8} />
          </View>
        ))}
      </View>

      {/* Amount selector */}
      <ShimmerSkeleton width={120} height={18} style={styles.mt24} />
      <View style={styles.amountSelector}>
        {[1, 2, 3, 4].map((i) => (
          <ShimmerSkeleton key={i} width={70} height={44} borderRadius={12} />
        ))}
      </View>

      {/* Add button */}
      <ShimmerSkeleton width="100%" height={56} borderRadius={28} style={styles.mt24} />
    </View>
  );
}

// Inline content skeleton (for loading states within content)
interface InlineSkeletonProps {
  lines?: number;
  lastLineWidth?: DimensionValue;
  spacing?: number;
}

export function InlineSkeleton({ lines = 3, lastLineWidth = '60%', spacing = 8 }: InlineSkeletonProps) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, index) => (
        <ShimmerSkeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={14}
          style={index > 0 ? { marginTop: spacing } : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerContainer: {
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt24: { marginTop: 24 },
  mb16: { marginBottom: 16 },
  ml12: { marginLeft: 12 },

  // Home screen
  homeContainer: {
    flex: 1,
    padding: 20,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityList: {
    marginTop: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },

  // Stats screen
  statsContainer: {
    flex: 1,
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  chartContainer: {
    marginBottom: 24,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyText: {
    marginLeft: 12,
  },

  // Settings screen
  settingsContainer: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  profileInfo: {
    marginLeft: 16,
  },
  settingsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Beverage screen
  beverageContainer: {
    flex: 1,
    padding: 20,
  },
  beverageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  beverageItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  amountSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});

export default ShimmerSkeleton;
