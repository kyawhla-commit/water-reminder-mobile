import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonLoaderProps) {
  const { colors, isDark } = useAppTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const backgroundColor = isDark ? colors.surfaceVariant : colors.border;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  style?: ViewStyle;
}

export function SkeletonCard({ lines = 3, showAvatar = false, showImage = false, style }: SkeletonCardProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.card : colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {showImage && <SkeletonLoader width="100%" height={150} borderRadius={8} style={styles.image} />}

      <View style={styles.cardContent}>
        {showAvatar && (
          <View style={styles.headerRow}>
            <SkeletonLoader width={40} height={40} borderRadius={20} />
            <View style={styles.headerText}>
              <SkeletonLoader width="60%" height={16} />
              <SkeletonLoader width="40%" height={12} style={styles.marginTop} />
            </View>
          </View>
        )}

        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLoader
            key={index}
            width={index === lines - 1 ? '70%' : '100%'}
            height={14}
            style={index > 0 || showAvatar ? styles.marginTop : undefined}
          />
        ))}
      </View>
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  showAvatar?: boolean;
  style?: ViewStyle;
}

export function SkeletonList({ count = 5, itemHeight = 60, showAvatar = true, style }: SkeletonListProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.listItem,
            {
              height: itemHeight,
              borderBottomColor: colors.divider,
            },
          ]}
        >
          {showAvatar && <SkeletonLoader width={44} height={44} borderRadius={22} />}
          <View style={styles.listItemContent}>
            <SkeletonLoader width="70%" height={16} />
            <SkeletonLoader width="50%" height={12} style={styles.marginTop} />
          </View>
          <SkeletonLoader width={60} height={24} borderRadius={12} />
        </View>
      ))}
    </View>
  );
}

interface SkeletonWaterProgressProps {
  size?: number;
}

export function SkeletonWaterProgress({ size = 200 }: SkeletonWaterProgressProps) {
  return (
    <View style={[styles.waterProgressContainer, { width: size, height: size }]}>
      <SkeletonLoader width={size} height={size} borderRadius={size / 2} />
      <View style={styles.waterProgressCenter}>
        <SkeletonLoader width={80} height={32} borderRadius={4} />
        <SkeletonLoader width={100} height={16} borderRadius={4} style={styles.marginTop} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
  },
  cardContent: {
    padding: 16,
  },
  image: {
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  marginTop: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  waterProgressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  waterProgressCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
});

// Re-export variants
export {
    InlineSkeleton, PulseSkeleton, ShimmerSkeleton, SkeletonBeverageGrid, SkeletonHomeScreen, SkeletonSettingsScreen, SkeletonStatsScreen
} from './SkeletonVariants';

export default SkeletonLoader;
