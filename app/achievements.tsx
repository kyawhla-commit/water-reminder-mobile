import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import ShareAchievementModal from '@/modals/ShareAchievement';
import { Achievement, getAchievementProgress } from '@/services/achievements';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t, currentLanguage } = useTranslation();
  const [achievements, setAchievements] = useState<(Achievement & { isUnlocked: boolean })[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const data = await getAchievementProgress();
    setAchievements(data);
  };

  const categories = [
    { id: 'all', label: currentLanguage === 'my' ? 'အားလုံး' : 'All', icon: 'grid' },
    { id: 'streak', label: currentLanguage === 'my' ? 'ဆက်တိုက်' : 'Streaks', icon: 'flame' },
    { id: 'volume', label: currentLanguage === 'my' ? 'ပမာဏ' : 'Volume', icon: 'water' },
    { id: 'consistency', label: currentLanguage === 'my' ? 'တသမတ်တည်း' : 'Goals', icon: 'checkmark-circle' },
    { id: 'special', label: currentLanguage === 'my' ? 'အထူး' : 'Special', icon: 'star' },
  ];

  const filteredAchievements = activeCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const handleShareAchievement = (achievement: Achievement & { isUnlocked: boolean }) => {
    if (achievement.isUnlocked) {
      setSelectedAchievement(achievement);
      setShowShareModal(true);
    }
  };

  const AchievementCard = ({ achievement }: { achievement: Achievement & { isUnlocked: boolean } }) => {
    const progressPercent = Math.min((achievement.progress / achievement.requirement) * 100, 100);
    const title = currentLanguage === 'my' ? achievement.titleMy : achievement.title;
    const description = currentLanguage === 'my' ? achievement.descriptionMy : achievement.description;

    return (
      <TouchableOpacity 
        style={[
          styles.achievementCard, 
          { backgroundColor: colors.card },
          !achievement.isUnlocked && styles.lockedCard
        ]}
        onPress={() => handleShareAchievement(achievement)}
        disabled={!achievement.isUnlocked}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: achievement.isUnlocked ? colors.primary + '20' : colors.surfaceVariant }
        ]}>
          <Text style={styles.achievementIcon}>{achievement.isUnlocked ? achievement.icon : '🔒'}</Text>
        </View>
        <View style={styles.achievementContent}>
          <Text style={[
            styles.achievementTitle, 
            { color: achievement.isUnlocked ? colors.text : colors.textSecondary }
          ]}>
            {title}
          </Text>
          <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>
            {description}
          </Text>
          {!achievement.isUnlocked && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {achievement.progress} / {achievement.requirement}
              </Text>
            </View>
          )}
        </View>
        {achievement.isUnlocked && (
          <View style={styles.unlockedActions}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Ionicons name="share-social-outline" size={20} color={colors.primary} style={{ marginLeft: 8 }} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {currentLanguage === 'my' ? '🏆 အောင်မြင်မှုများ' : '🏆 Achievements'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Summary */}
      <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
        <View style={styles.summaryContent}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            {currentLanguage === 'my' ? 'သင့်တိုးတက်မှု' : 'Your Progress'}
          </Text>
          <Text style={[styles.summaryCount, { color: colors.primary }]}>
            {unlockedCount} / {totalCount}
          </Text>
          <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
            {currentLanguage === 'my' ? 'အောင်မြင်မှုများရရှိပြီး' : 'achievements unlocked'}
          </Text>
        </View>
        <View style={styles.summaryProgress}>
          <View style={[styles.circleProgress, { borderColor: colors.primary }]}>
            <Text style={[styles.circleText, { color: colors.primary }]}>
              {Math.round((unlockedCount / totalCount) * 100)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryScrollContent}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.7}
            style={[
              styles.categoryTab,
              { backgroundColor: activeCategory === cat.id ? colors.primary : colors.surfaceVariant }
            ]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Ionicons 
              name={cat.icon as keyof typeof Ionicons.glyphMap} 
              size={16} 
              color={activeCategory === cat.id ? '#fff' : colors.textSecondary} 
            />
            <Text style={[
              styles.categoryText,
              { color: activeCategory === cat.id ? '#fff' : colors.text }
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievements List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </ScrollView>

      {/* Share Modal */}
      {selectedAchievement && (
        <ShareAchievementModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedAchievement(null);
          }}
          type="achievement"
          data={{
            title: selectedAchievement.title,
            titleMy: selectedAchievement.titleMy,
            description: selectedAchievement.description,
            descriptionMy: selectedAchievement.descriptionMy,
            icon: selectedAchievement.icon,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  summaryCard: { flexDirection: 'row', margin: 16, padding: 20, borderRadius: 16, alignItems: 'center' },
  summaryContent: { flex: 1 },
  summaryTitle: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  summaryCount: { fontSize: 32, fontWeight: '700' },
  summarySubtitle: { fontSize: 12, marginTop: 2 },
  summaryProgress: { marginLeft: 16 },
  circleProgress: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 18, fontWeight: '700' },
  categoryScroll: { maxHeight: 50, marginBottom: 8 },
  categoryScrollContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  categoryTab: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    gap: 6,
    minHeight: 40,
  },
  categoryText: { fontSize: 14, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 100 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  lockedCard: { opacity: 0.7 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  achievementIcon: { fontSize: 24 },
  achievementContent: { flex: 1, marginLeft: 12 },
  achievementTitle: { fontSize: 16, fontWeight: '600' },
  achievementDesc: { fontSize: 13, marginTop: 2 },
  progressContainer: { marginTop: 8 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, marginTop: 4 },
  unlockedActions: { flexDirection: 'row', alignItems: 'center' },
});
