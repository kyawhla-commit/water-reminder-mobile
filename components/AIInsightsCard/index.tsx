import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { generateAIInsights, Insight } from '@/services/aiInsights';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AIInsightsCardProps {
  dailyGoal: number;
  currentIntake: number;
}

export default function AIInsightsCard({ dailyGoal, currentIntake }: AIInsightsCardProps) {
  const { colors, isDark } = useAppTheme();
  const { currentLanguage } = useTranslation();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadInsights();
  }, [dailyGoal, currentIntake]);

  const loadInsights = async () => {
    const data = await generateAIInsights(dailyGoal, currentIntake);
    setInsights(data);
  };

  if (insights.length === 0) return null;

  const currentInsight = insights[currentIndex];
  const title = currentLanguage === 'my' ? currentInsight.titleMy : currentInsight.title;
  const message = currentLanguage === 'my' ? currentInsight.messageMy : currentInsight.message;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'achievement': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'tip': return '#2196F3';
      case 'motivation': return '#9C27B0';
      case 'pattern': return '#00BCD4';
      default: return colors.primary;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; my: string }> = {
      achievement: { en: 'ACHIEVEMENT', my: 'အောင်မြင်မှု' },
      warning: { en: 'HEADS UP', my: 'သတိပေးချက်' },
      tip: { en: 'TIP', my: 'အကြံပြုချက်' },
      motivation: { en: 'MOTIVATION', my: 'အားပေးစကား' },
      pattern: { en: 'PATTERN', my: 'ပုံစံ' },
    };
    return currentLanguage === 'my' ? labels[type]?.my : labels[type]?.en;
  };

  const nextInsight = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
  };

  const prevInsight = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1E3A5F' : '#E8F5E9' }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiIcon, { backgroundColor: getTypeColor(currentInsight.type) + '30' }]}>
            <Text style={styles.icon}>{currentInsight.icon}</Text>
          </View>
          <View>
            <Text style={[styles.aiLabel, { color: getTypeColor(currentInsight.type) }]}>
              🤖 AI {getTypeLabel(currentInsight.type)}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>
        </View>
        {insights.length > 1 && (
          <View style={styles.navigation}>
            <TouchableOpacity onPress={prevInsight} style={styles.navButton}>
              <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.pageIndicator, { color: colors.textSecondary }]}>
              {currentIndex + 1}/{insights.length}
            </Text>
            <TouchableOpacity onPress={nextInsight} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  aiIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  aiLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  title: { fontSize: 15, fontWeight: '600' },
  navigation: { flexDirection: 'row', alignItems: 'center' },
  navButton: { padding: 4 },
  pageIndicator: { fontSize: 12, marginHorizontal: 4 },
  message: { fontSize: 14, lineHeight: 20 },
});
