import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    calculateWeatherAdjustment,
    fetchWeather,
    getWeatherHydrationTips,
    WeatherData,
} from '@/services/weatherIntegration';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WeatherCardProps {
  baseGoal: number;
  onGoalAdjustment?: (adjustedGoal: number) => void;
}

export default function WeatherCard({ baseGoal, onGoalAdjustment }: WeatherCardProps) {
  const { colors, isDark } = useAppTheme();
  const { currentLanguage } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const t = (en: string, my: string) => currentLanguage === 'my' ? my : en;

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    setLoading(true);
    const data = await fetchWeather();
    setWeather(data);
    setLoading(false);

    if (data && onGoalAdjustment) {
      const adjustment = calculateWeatherAdjustment(data, baseGoal);
      if (adjustment.increasePercent > 0) {
        onGoalAdjustment(adjustment.adjustedGoal);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('Loading weather...', 'ရာသီဥတုဖတ်နေသည်...')}
        </Text>
      </View>
    );
  }

  if (!weather) return null;

  const adjustment = calculateWeatherAdjustment(weather, baseGoal);
  const tips = getWeatherHydrationTips(weather, currentLanguage);
  const reason = currentLanguage === 'my' ? adjustment.reasonMy : adjustment.reason;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.mainRow}>
        <View style={styles.weatherInfo}>
          <Text style={styles.weatherIcon}>{weather.icon}</Text>
          <View>
            <Text style={[styles.temperature, { color: colors.text }]}>
              {weather.temperature}°C
            </Text>
            <Text style={[styles.location, { color: colors.textSecondary }]}>
              {weather.location}
            </Text>
          </View>
        </View>

        <View style={styles.adjustmentInfo}>
          {adjustment.increasePercent > 0 ? (
            <>
              <View style={[styles.adjustmentBadge, { backgroundColor: '#FF9800' + '20' }]}>
                <Ionicons name="arrow-up" size={14} color="#FF9800" />
                <Text style={[styles.adjustmentText, { color: '#FF9800' }]}>
                  +{adjustment.increasePercent}%
                </Text>
              </View>
              <Text style={[styles.adjustmentReason, { color: colors.textSecondary }]}>
                {reason}
              </Text>
            </>
          ) : (
            <View style={[styles.adjustmentBadge, { backgroundColor: '#4CAF50' + '20' }]}>
              <Ionicons name="checkmark" size={14} color="#4CAF50" />
              <Text style={[styles.adjustmentText, { color: '#4CAF50' }]}>
                {t('Normal', 'ပုံမှန်')}
              </Text>
            </View>
          )}
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={[styles.divider, { backgroundColor: isDark ? '#3D3D3D' : '#E0E0E0' }]} />
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                {t('Humidity', 'စိုထိုင်းမှု')}
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{weather.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="sunny-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                {t('Condition', 'အခြေအနေ')}
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{weather.condition}</Text>
            </View>
          </View>

          {adjustment.increasePercent > 0 && (
            <View style={[styles.goalAdjustment, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
              <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>
                {t('Recommended Goal Today', 'ယနေ့အကြံပြုပန်းတိုင်')}
              </Text>
              <Text style={[styles.goalValue, { color: colors.primary }]}>
                {adjustment.adjustedGoal} ml
              </Text>
            </View>
          )}

          <View style={styles.tipsSection}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              💡 {t('Hydration Tips', 'ရေဓာတ်အကြံပြုချက်')}
            </Text>
            {tips.map((tip, index) => (
              <Text key={index} style={[styles.tipText, { color: colors.textSecondary }]}>
                • {tip}
              </Text>
            ))}
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={loadWeather}>
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={[styles.refreshText, { color: colors.primary }]}>
              {t('Refresh', 'ပြန်လည်ဖတ်ရန်')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginBottom: 16 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 14 },
  mainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weatherInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weatherIcon: { fontSize: 36 },
  temperature: { fontSize: 24, fontWeight: '700' },
  location: { fontSize: 12 },
  adjustmentInfo: { alignItems: 'flex-end' },
  adjustmentBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  adjustmentText: { fontSize: 12, fontWeight: '600' },
  adjustmentReason: { fontSize: 11, marginTop: 2 },
  expandedContent: { marginTop: 12 },
  divider: { height: 1, marginBottom: 12 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  detailItem: { alignItems: 'center', gap: 4 },
  detailLabel: { fontSize: 11 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  goalAdjustment: { padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  goalLabel: { fontSize: 12 },
  goalValue: { fontSize: 24, fontWeight: '700' },
  tipsSection: { marginBottom: 12 },
  tipsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  tipText: { fontSize: 13, lineHeight: 20, marginBottom: 4 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  refreshText: { fontSize: 13, fontWeight: '500' },
});
