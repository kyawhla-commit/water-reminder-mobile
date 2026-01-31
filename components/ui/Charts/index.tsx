import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Animated Bar Chart
 */
interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
    highlighted?: boolean;
  }>;
  maxValue?: number;
  height?: number;
  showValues?: boolean;
  showGoalLine?: boolean;
  goalValue?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedBarChart({
  data,
  maxValue,
  height = 180,
  showValues = true,
  showGoalLine = false,
  goalValue,
  animated = true,
  style,
}: BarChartProps) {
  const { colors, isDark } = useAppTheme();
  const animValues = useRef(data.map(() => new Animated.Value(0))).current;

  const max = maxValue || Math.max(...data.map((d) => d.value), goalValue || 0);
  const barWidth = Math.min(32, (300 - data.length * 8) / data.length);

  useEffect(() => {
    if (animated) {
      const animations = animValues.map((anim, index) =>
        Animated.timing(anim, {
          toValue: data[index].value,
          duration: 800,
          delay: index * 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      );
      Animated.parallel(animations).start();
    } else {
      animValues.forEach((anim, index) => anim.setValue(data[index].value));
    }
  }, [data, animated]);

  return (
    <View style={[styles.chartContainer, { height }, style]}>
      {/* Goal line */}
      {showGoalLine && goalValue && (
        <View
          style={[
            styles.goalLine,
            {
              bottom: `${(goalValue / max) * 100}%`,
              borderColor: colors.error,
            },
          ]}
        >
          <Text style={[styles.goalLineLabel, { color: colors.error }]}>Goal</Text>
        </View>
      )}

      {/* Bars */}
      <View style={styles.barsRow}>
        {data.map((item, index) => {
          const barHeight = animValues[index].interpolate({
            inputRange: [0, max],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp',
          });

          const barColor = item.color || (item.value >= (goalValue || max * 0.8) ? colors.primary : colors.surfaceVariant);

          return (
            <View key={item.label} style={styles.barColumn}>
              <View style={[styles.barTrack, { height: height - 50 }]}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                      width: barWidth,
                      borderWidth: item.highlighted ? 2 : 0,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  {/* Gradient overlay */}
                  <View style={[styles.barGradient, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                </Animated.View>
              </View>
              <Text
                style={[
                  styles.barLabel,
                  { color: item.highlighted ? colors.primary : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
              {showValues && (
                <Text style={[styles.barValue, { color: colors.textTertiary }]}>
                  {item.value > 0 ? `${(item.value / 1000).toFixed(1)}L` : '-'}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Circular Progress Chart
 */
interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  backgroundColor,
  showPercentage = true,
  label,
  animated = true,
  children,
}: CircularProgressProps) {
  const { colors } = useAppTheme();
  const animValue = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  useEffect(() => {
    if (animated) {
      Animated.timing(animValue, {
        toValue: clampedProgress,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      animValue.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const progressColor = color || colors.primary;
  const bgColor = backgroundColor || colors.surfaceVariant;

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={progressColor} />
            <Stop offset="100%" stopColor={progressColor} stopOpacity="0.7" />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.circularContent}>
        {children || (
          <>
            {showPercentage && (
              <AnimatedPercentage value={animValue} style={[styles.percentageText, { color: colors.text }]} />
            )}
            {label && <Text style={[styles.circularLabel, { color: colors.textSecondary }]}>{label}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

function AnimatedPercentage({ value, style }: { value: Animated.Value; style: any }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const listener = value.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });
    return () => value.removeListener(listener);
  }, [value]);

  return <Text style={style}>{displayValue}%</Text>;
}

/**
 * Line Chart with gradient fill
 */
interface LineChartProps {
  data: Array<{ x: string; y: number }>;
  height?: number;
  showDots?: boolean;
  showArea?: boolean;
  color?: string;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LineChart({
  data,
  height = 150,
  showDots = true,
  showArea = true,
  color,
  animated = true,
  style,
}: LineChartProps) {
  const { colors, isDark } = useAppTheme();
  const animValue = useRef(new Animated.Value(0)).current;

  const chartColor = color || colors.primary;
  const width = 300;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxY = Math.max(...data.map((d) => d.y));
  const minY = Math.min(...data.map((d) => d.y));
  const range = maxY - minY || 1;

  useEffect(() => {
    if (animated) {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      animValue.setValue(1);
    }
  }, [data, animated]);

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - ((d.y - minY) / range) * chartHeight,
  }));

  const linePath = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpX = (prev.x + point.x) / 2;
    return `${path} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <View style={[{ height, width }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={chartColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <Line
            key={ratio}
            x1={padding}
            y1={padding + chartHeight * ratio}
            x2={width - padding}
            y2={padding + chartHeight * ratio}
            stroke={colors.divider}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Area fill */}
        {showArea && <Path d={areaPath} fill="url(#areaGradient)" />}

        {/* Line */}
        <Path d={linePath} stroke={chartColor} strokeWidth={3} fill="none" strokeLinecap="round" />

        {/* Dots */}
        {showDots &&
          points.map((point, i) => (
            <G key={i}>
              <Circle cx={point.x} cy={point.y} r={6} fill={colors.card} />
              <Circle cx={point.x} cy={point.y} r={4} fill={chartColor} />
            </G>
          ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <SvgText
            key={i}
            x={points[i].x}
            y={height - 5}
            fontSize={10}
            fill={colors.textSecondary}
            textAnchor="middle"
          >
            {d.x}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

/**
 * Progress Ring (multiple rings)
 */
interface ProgressRingProps {
  rings: Array<{
    progress: number;
    color: string;
    label: string;
  }>;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

export function ProgressRings({ rings, size = 150, strokeWidth = 8, animated = true }: ProgressRingProps) {
  const { colors } = useAppTheme();
  const animValues = useRef(rings.map(() => new Animated.Value(0))).current;

  const gap = strokeWidth + 4;
  const baseRadius = (size - strokeWidth) / 2;

  useEffect(() => {
    if (animated) {
      const animations = animValues.map((anim, index) =>
        Animated.timing(anim, {
          toValue: rings[index].progress,
          duration: 1000,
          delay: index * 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      );
      Animated.parallel(animations).start();
    } else {
      animValues.forEach((anim, index) => anim.setValue(rings[index].progress));
    }
  }, [rings, animated]);

  return (
    <View style={[styles.ringsContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {rings.map((ring, index) => {
          const radius = baseRadius - index * gap;
          const circumference = 2 * Math.PI * radius;

          const strokeDashoffset = animValues[index].interpolate({
            inputRange: [0, 100],
            outputRange: [circumference, 0],
          });

          return (
            <G key={index}>
              {/* Background */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.surfaceVariant}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress */}
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={ring.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.ringsLegend}>
        {rings.map((ring, index) => (
          <View key={index} style={styles.ringLegendItem}>
            <View style={[styles.ringLegendDot, { backgroundColor: ring.color }]} />
            <Text style={[styles.ringLegendText, { color: colors.textSecondary }]}>{ring.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Trend Line Chart - Shows weekly/monthly trends with comparison
 */
interface TrendLineChartProps {
  currentData: Array<{ label: string; value: number }>;
  previousData?: Array<{ label: string; value: number }>;
  height?: number;
  showComparison?: boolean;
  currentColor?: string;
  previousColor?: string;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TrendLineChart({
  currentData,
  previousData,
  height = 120,
  showComparison = true,
  currentColor,
  previousColor,
  animated = true,
  style,
}: TrendLineChartProps) {
  const { colors } = useAppTheme();
  const animValue = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const chartColor = currentColor || colors.primary;
  const comparisonColor = previousColor || colors.textTertiary;
  const chartWidth = 280;
  const padding = 16;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = height - 40;

  const allValues = [...currentData.map(d => d.value), ...(previousData?.map(d => d.value) || [])];
  const maxY = Math.max(...allValues, 1);
  const minY = 0;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      animValue.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [currentData, animated]);

  const getPoints = (data: Array<{ label: string; value: number }>) => {
    return data.map((d, i) => ({
      x: padding + (i / Math.max(data.length - 1, 1)) * innerWidth,
      y: padding + innerHeight - ((d.value - minY) / (maxY - minY)) * innerHeight,
    }));
  };

  const createSmoothPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 2) return '';
    return points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = points[i - 1];
      const cpX = (prev.x + point.x) / 2;
      return `${path} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
    }, '');
  };

  const currentPoints = getPoints(currentData);
  const previousPoints = previousData ? getPoints(previousData) : [];
  const currentPath = createSmoothPath(currentPoints);
  const previousPath = createSmoothPath(previousPoints);

  // Calculate trend
  const currentAvg = currentData.reduce((sum, d) => sum + d.value, 0) / currentData.length;
  const previousAvg = previousData 
    ? previousData.reduce((sum, d) => sum + d.value, 0) / previousData.length 
    : 0;
  const trendPercent = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
  const trendUp = trendPercent >= 0;

  return (
    <View style={[styles.trendContainer, style]}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="currentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={chartColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio) => (
          <Line
            key={ratio}
            x1={padding}
            y1={padding + innerHeight * ratio}
            x2={chartWidth - padding}
            y2={padding + innerHeight * ratio}
            stroke={colors.divider}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        ))}

        {/* Previous period line (comparison) */}
        {showComparison && previousData && previousPath && (
          <Path
            d={previousPath}
            stroke={comparisonColor}
            strokeWidth={2}
            fill="none"
            strokeDasharray="6,4"
            opacity={0.6}
          />
        )}

        {/* Current period area */}
        {currentPath && (
          <Path
            d={`${currentPath} L ${currentPoints[currentPoints.length - 1]?.x || padding} ${height - 24} L ${padding} ${height - 24} Z`}
            fill="url(#currentGradient)"
          />
        )}

        {/* Current period line */}
        {currentPath && (
          <Path
            d={currentPath}
            stroke={chartColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Current period dots */}
        {currentPoints.map((point, i) => (
          <G key={i}>
            <Circle cx={point.x} cy={point.y} r={5} fill={colors.card} />
            <Circle cx={point.x} cy={point.y} r={3} fill={chartColor} />
          </G>
        ))}

        {/* X-axis labels */}
        {currentData.map((d, i) => (
          <SvgText
            key={i}
            x={currentPoints[i]?.x || 0}
            y={height - 6}
            fontSize={9}
            fill={colors.textSecondary}
            textAnchor="middle"
          >
            {d.label}
          </SvgText>
        ))}
      </Svg>

      {/* Trend indicator */}
      {showComparison && previousData && (
        <View style={styles.trendIndicator}>
          <Ionicons
            name={trendUp ? 'trending-up' : 'trending-down'}
            size={16}
            color={trendUp ? colors.success : colors.error}
          />
          <Text style={[styles.trendText, { color: trendUp ? colors.success : colors.error }]}>
            {trendUp ? '+' : ''}{trendPercent.toFixed(1)}%
          </Text>
          <Text style={[styles.trendLabel, { color: colors.textTertiary }]}>vs last period</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Period Comparison Card
 */
interface PeriodComparisonProps {
  currentPeriod: {
    label: string;
    value: number;
    unit: string;
  };
  previousPeriod: {
    label: string;
    value: number;
    unit: string;
  };
  style?: StyleProp<ViewStyle>;
}

export function PeriodComparison({ currentPeriod, previousPeriod, style }: PeriodComparisonProps) {
  const { colors } = useAppTheme();
  const animValue = useRef(new Animated.Value(0)).current;

  const diff = currentPeriod.value - previousPeriod.value;
  const percentChange = previousPeriod.value > 0 
    ? ((diff / previousPeriod.value) * 100) 
    : 0;
  const isImproved = diff >= 0;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [currentPeriod, previousPeriod]);

  return (
    <Animated.View 
      style={[
        styles.comparisonContainer, 
        { backgroundColor: colors.card, opacity: animValue, transform: [{ scale: animValue }] },
        style
      ]}
    >
      <View style={styles.comparisonRow}>
        {/* Current Period */}
        <View style={styles.comparisonPeriod}>
          <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>
            {currentPeriod.label}
          </Text>
          <Text style={[styles.comparisonValue, { color: colors.text }]}>
            {currentPeriod.value.toFixed(1)}
            <Text style={styles.comparisonUnit}>{currentPeriod.unit}</Text>
          </Text>
        </View>

        {/* Comparison indicator */}
        <View style={[styles.comparisonIndicator, { backgroundColor: isImproved ? colors.success + '20' : colors.error + '20' }]}>
          <Ionicons
            name={isImproved ? 'arrow-up' : 'arrow-down'}
            size={20}
            color={isImproved ? colors.success : colors.error}
          />
          <Text style={[styles.comparisonPercent, { color: isImproved ? colors.success : colors.error }]}>
            {Math.abs(percentChange).toFixed(0)}%
          </Text>
        </View>

        {/* Previous Period */}
        <View style={[styles.comparisonPeriod, styles.comparisonPeriodRight]}>
          <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>
            {previousPeriod.label}
          </Text>
          <Text style={[styles.comparisonValueSmall, { color: colors.textTertiary }]}>
            {previousPeriod.value.toFixed(1)}
            <Text style={styles.comparisonUnit}>{previousPeriod.unit}</Text>
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * Empty State Component
 */
interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = 'water-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors } = useAppTheme();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }, style]}>
      <Animated.View 
        style={[
          styles.emptyIconContainer, 
          { backgroundColor: colors.primary + '15', transform: [{ translateY: bounceAnim }] }
        ]}
      >
        <Ionicons name={icon} size={48} color={colors.primary} />
      </Animated.View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>{description}</Text>
      {actionLabel && onAction && (
        <Animated.View style={{ transform: [{ scale: fadeAnim }] }}>
          <View style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.emptyButtonText} onPress={onAction}>{actionLabel}</Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

/**
 * Animated Bar with entrance animation
 */
interface AnimatedBarProps {
  value: number;
  maxValue: number;
  color: string;
  highlighted?: boolean;
  label: string;
  showValue?: boolean;
  delay?: number;
  height?: number;
}

export function AnimatedBar({
  value,
  maxValue,
  color,
  highlighted = false,
  label,
  showValue = true,
  delay = 0,
  height = 130,
}: AnimatedBarProps) {
  const { colors } = useAppTheme();
  const heightAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: percentage,
        duration: 800,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
    ]).start();
  }, [value, maxValue, delay]);

  const animatedHeight = heightAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.animatedBarWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.animatedBarTrack, { height }]}>
        <Animated.View
          style={[
            styles.animatedBar,
            {
              height: animatedHeight,
              backgroundColor: color,
              borderWidth: highlighted ? 2 : 0,
              borderColor: colors.primary,
            },
          ]}
        >
          <View style={styles.animatedBarShine} />
        </Animated.View>
      </View>
      <Text style={[styles.animatedBarLabel, { color: highlighted ? colors.primary : colors.textSecondary }]}>
        {label}
      </Text>
      {showValue && (
        <Text style={[styles.animatedBarValue, { color: colors.textTertiary }]}>
          {value > 0 ? `${(value / 1000).toFixed(1)}L` : '-'}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Bar chart
  chartContainer: {
    position: 'relative',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  goalLineLabel: {
    position: 'absolute',
    right: 0,
    top: -16,
    fontSize: 10,
    fontWeight: '600',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  barGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
  },
  barValue: {
    fontSize: 9,
    marginTop: 2,
  },

  // Circular progress
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '700',
  },
  circularLabel: {
    fontSize: 12,
    marginTop: 4,
  },

  // Progress rings
  ringsContainer: {
    alignItems: 'center',
  },
  ringsLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  ringLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ringLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ringLegendText: {
    fontSize: 11,
  },

  // Trend line chart
  trendContainer: {
    alignItems: 'center',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendLabel: {
    fontSize: 11,
    marginLeft: 4,
  },

  // Period comparison
  comparisonContainer: {
    borderRadius: 16,
    padding: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonPeriod: {
    flex: 1,
  },
  comparisonPeriodRight: {
    alignItems: 'flex-end',
  },
  comparisonLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  comparisonValueSmall: {
    fontSize: 18,
    fontWeight: '600',
  },
  comparisonUnit: {
    fontSize: 12,
    fontWeight: '400',
  },
  comparisonIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 12,
  },
  comparisonPercent: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Animated bar
  animatedBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  animatedBarTrack: {
    width: 28,
    justifyContent: 'flex-end',
    borderRadius: 8,
    overflow: 'hidden',
  },
  animatedBar: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 4,
  },
  animatedBarShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  animatedBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
  },
  animatedBarValue: {
    fontSize: 9,
    marginTop: 2,
  },
});

export default AnimatedBarChart;
