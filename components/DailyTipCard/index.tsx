import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useDailyTip } from '../../hooks/useDailyTip';
import { getCategoryDisplayName, TipCategory } from '../../services/dailyTips';

interface DailyTipCardProps {
  language?: 'en' | 'my';
  compact?: boolean;
  onPress?: () => void;
  showActions?: boolean;
}

const CATEGORY_COLORS: Record<TipCategory, string[]> = {
  hydration: ['#E3F2FD', '#BBDEFB'],
  health: ['#FCE4EC', '#F8BBD9'],
  science: ['#E8EAF6', '#C5CAE9'],
  lifestyle: ['#FFF3E0', '#FFE0B2'],
  exercise: ['#E8F5E9', '#C8E6C9'],
  nutrition: ['#F1F8E9', '#DCEDC8'],
  sleep: ['#EDE7F6', '#D1C4E9'],
  productivity: ['#FFF8E1', '#FFECB3'],
};

export const DailyTipCard: React.FC<DailyTipCardProps> = ({
  language = 'en',
  compact = false,
  onPress,
  showActions = true,
}) => {
  const { tip, formattedTip, isFavorite, isLoading, shuffleTip, toggleFavorite } =
    useDailyTip({ language });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (formattedTip) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
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
  }, [formattedTip, fadeAnim, scaleAnim]);

  const handleShare = async () => {
    if (!formattedTip) return;

    try {
      await Share.share({
        message: `${formattedTip.icon} ${formattedTip.title}\n\n${formattedTip.content}\n\n- HydroMate Daily Tip`,
        title: formattedTip.title,
      });
    } catch (error) {
      console.error('Error sharing tip:', error);
    }
  };

  const handleShuffle = async () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      await shuffleTip();
      // Animate in (handled by useEffect)
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tip...</Text>
        </View>
      </View>
    );
  }

  if (!formattedTip || !tip) {
    return null;
  }

  const colors = CATEGORY_COLORS[tip.category] || CATEGORY_COLORS.hydration;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.containerCompact}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.compactCard, { backgroundColor: colors[0] }]}>
          <Text style={styles.compactIcon}>{formattedTip.icon}</Text>
          <View style={styles.compactContent}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {formattedTip.title}
            </Text>
            <Text style={styles.compactText} numberOfLines={2}>
              {formattedTip.content}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={onPress ? 0.9 : 1}
        onPress={onPress}
        style={styles.touchable}
      >
        <View style={[styles.card, { backgroundColor: colors[0] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{formattedTip.icon}</Text>
              <Text style={styles.categoryText}>
                {getCategoryDisplayName(tip.category, language)}
              </Text>
            </View>
            <Text style={styles.dailyLabel}>
              {language === 'my' ? 'နေ့စဉ်အကြံပြုချက်' : 'Daily Tip'}
            </Text>
          </View>

          {/* Content */}
          <Text style={styles.title}>{formattedTip.title}</Text>
          <Text style={styles.content}>{formattedTip.content}</Text>

          {/* Source */}
          {formattedTip.source && (
            <Text style={styles.source}>📚 {formattedTip.source}</Text>
          )}

          {/* Actions */}
          {showActions && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={toggleFavorite}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite ? '#E91E63' : '#666'}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShuffle}
              >
                <Ionicons name="shuffle" size={22} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  containerCompact: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dailyLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  source: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
  },
  compactIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  compactText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default DailyTipCard;
