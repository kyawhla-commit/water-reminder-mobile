import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { loadPomodoroSettings, loadPomodoroStats } from '@/services/pomodoroTimer';
import { getDailyIntake } from '@/services/water';
import {
    calculateWellnessScore,
    DailyChallenge,
    DailyChallengesData,
    generateDailyChallenges,
    generateWellnessInsights,
    getChallengeProgress,
    getGradeEmoji,
    getScoreColor,
    getStreakDays,
    getWeeklyAverage,
    loadDailyChallenges,
    loadWellnessHistory,
    saveDailyChallenges,
    saveWellnessHistory,
    WellnessHistory,
    WellnessInsight,
    WellnessMetrics,
    WellnessScore,
} from '@/services/wellnessIntegration';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WellnessDashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [score, setScore] = useState<WellnessScore | null>(null);
  const [challenges, setChallenges] = useState<DailyChallengesData | null>(null);
  const [history, setHistory] = useState<WellnessHistory[]>([]);
  const [insights, setInsights] = useState<WellnessInsight[]>([]);

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (score) {
      Animated.timing(scoreAnim, {
        toValue: score.overall,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [score]);

  const loadData = async () => {
    try {
      // Load all data sources
      const [waterIntake, pomodoroSettings, pomodoroStats, wellnessHistory] = await Promise.all([
        getDailyIntake(),
        loadPomodoroSettings(),
        loadPomodoroStats(),
        loadWellnessHistory(),
      ]);

      // Build metrics
      const metrics: WellnessMetrics = {
        water: {
          current: waterIntake,
          goal: 2500, // Default goal, should come from settings
          percentage: Math.min(100, (waterIntake / 2500) * 100),
          score: 0,
        },
        sleep: {
          hours: 7, // Should come from sleep tracking
          goal: 8,
          quality: 4,
          percentage: Math.min(100, (7 / 8) * 100),
          score: 0,
        },
        focus: {
          minutes: pomodoroStats.todayMinutes,
          goal: pomodoroSettings.dailyMinutesGoal,
          sessions: pomodoroStats.todaySessions,
          percentage: Math.min(100, (pomodoroStats.todayMinutes / pomodoroSettings.dailyMinutesGoal) * 100),
          score: 0,
        },
      };

      // Calculate score
      const calculatedScore = calculateWellnessScore(metrics);
      setScore(calculatedScore);
      setHistory(wellnessHistory);

      // Generate insights
      const generatedInsights = generateWellnessInsights(calculatedScore, wellnessHistory, isBurmese);
      setInsights(generatedInsights);

      // Load or generate challenges
      let challengesData = await loadDailyChallenges();
      if (!challengesData) {
        const newChallenges = generateDailyChallenges(2500, 8, pomodoroSettings.dailyMinutesGoal);
        challengesData = {
          date: new Date().toISOString().split('T')[0],
          challenges: newChallenges,
          totalPoints: newChallenges.reduce((sum, c) => sum + c.points, 0),
          earnedPoints: 0,
          streak: 0,
          allCompleted: false,
        };
        await saveDailyChallenges(challengesData);
      }

      // Update challenge progress
      challengesData.challenges = challengesData.challenges.map((c) => {
        if (c.type === 'water') {
          c.current = waterIntake;
          c.completed = waterIntake >= c.target;
        } else if (c.type === 'focus') {
          c.current = pomodoroStats.todayMinutes;
          c.completed = pomodoroStats.todayMinutes >= c.target;
        }
        return c;
      });
      challengesData.earnedPoints = challengesData.challenges
        .filter((c) => c.completed)
        .reduce((sum, c) => sum + c.points, 0);
      challengesData.allCompleted = challengesData.challenges.every((c) => c.completed);

      setChallenges(challengesData);
      await saveDailyChallenges(challengesData);

      // Save today's wellness history
      const todayEntry: WellnessHistory = {
        date: new Date().toISOString().split('T')[0],
        score: calculatedScore.overall,
        water: calculatedScore.breakdown.water,
        sleep: calculatedScore.breakdown.sleep,
        focus: calculatedScore.breakdown.focus,
        challengesCompleted: challengesData.challenges.filter((c) => c.completed).length,
      };
      await saveWellnessHistory(todayEntry);
    } catch (error) {
      console.error('Error loading wellness data:', error);
    }
  };

  const weeklyAvg = getWeeklyAverage(history);
  const streak = getStreakDays(history);

  if (!score || !challenges) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{isBurmese ? 'ခဏစောင့်ပါ...' : 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            ✨ {isBurmese ? 'ကျန်းမာရေးဒက်ရှ်ဘုတ်' : 'Wellness Dashboard'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Main Score Card */}
        <Animated.View style={[styles.scoreCard, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(score.overall) }]}>
            <Text style={styles.gradeEmoji}>{getGradeEmoji(score.grade)}</Text>
            <Animated.Text style={[styles.scoreValue, { color: getScoreColor(score.overall) }]}>
              {score.overall}
            </Animated.Text>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              {isBurmese ? 'ကျန်းမာရေးရမှတ်' : 'Wellness Score'}
            </Text>
            <View style={[styles.gradeBadge, { backgroundColor: getScoreColor(score.overall) + '20' }]}>
              <Text style={[styles.gradeText, { color: getScoreColor(score.overall) }]}>
                {isBurmese ? `အဆင့် ${score.grade}` : `Grade ${score.grade}`}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={[styles.quickStatItem, { backgroundColor: colors.card }]}>
            <Text style={styles.quickStatEmoji}>📈</Text>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>{weeklyAvg}</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {isBurmese ? 'အပတ်ပျမ်းမျှ' : 'Week Avg'}
            </Text>
          </View>
          <View style={[styles.quickStatItem, { backgroundColor: colors.card }]}>
            <Text style={styles.quickStatEmoji}>🔥</Text>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>{streak}</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {isBurmese ? 'ရက်ဆက်တိုက်' : 'Day Streak'}
            </Text>
          </View>
          <View style={[styles.quickStatItem, { backgroundColor: colors.card }]}>
            <Text style={styles.quickStatEmoji}>🎯</Text>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {getChallengeProgress(challenges.challenges)}%
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {isBurmese ? 'စိန်ခေါ်မှု' : 'Challenges'}
            </Text>
          </View>
        </View>

        {/* Score Breakdown */}
        <View style={[styles.breakdownCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📊 ရမှတ်ခွဲခြမ်းစိတ်ဖြာ' : '📊 Score Breakdown'}
          </Text>
          
          {/* Water */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownEmoji}>💧</Text>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                {isBurmese ? 'ရေဓာတ်' : 'Hydration'}
              </Text>
              <Text style={[styles.breakdownScore, { color: '#3498DB' }]}>
                {score.breakdown.water}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
              <View style={[styles.progressFill, { width: `${score.breakdown.water}%`, backgroundColor: '#3498DB' }]} />
            </View>
          </View>

          {/* Sleep */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownEmoji}>😴</Text>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                {isBurmese ? 'အိပ်စက်မှု' : 'Sleep'}
              </Text>
              <Text style={[styles.breakdownScore, { color: '#9B59B6' }]}>
                {score.breakdown.sleep}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
              <View style={[styles.progressFill, { width: `${score.breakdown.sleep}%`, backgroundColor: '#9B59B6' }]} />
            </View>
          </View>

          {/* Focus */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownEmoji}>🎯</Text>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                {isBurmese ? 'အာရုံစူးစိုက်မှု' : 'Focus'}
              </Text>
              <Text style={[styles.breakdownScore, { color: '#E74C3C' }]}>
                {score.breakdown.focus}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
              <View style={[styles.progressFill, { width: `${score.breakdown.focus}%`, backgroundColor: '#E74C3C' }]} />
            </View>
          </View>
        </View>

        {/* Daily Challenges */}
        <View style={[styles.challengesCard, { backgroundColor: colors.card }]}>
          <View style={styles.challengesHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBurmese ? '🏆 ယနေ့စိန်ခေါ်မှုများ' : "🏆 Today's Challenges"}
            </Text>
            <View style={[styles.pointsBadge, { backgroundColor: '#F39C1220' }]}>
              <Text style={styles.pointsText}>
                {challenges.earnedPoints}/{challenges.totalPoints} pts
              </Text>
            </View>
          </View>

          {challenges.challenges.map((challenge) => (
            <ChallengeItem key={challenge.id} challenge={challenge} colors={colors} isBurmese={isBurmese} />
          ))}
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={[styles.insightsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBurmese ? '💡 တွေ့ရှိချက်များ' : '💡 Insights'}
            </Text>
            {insights.map((insight) => (
              <View
                key={insight.id}
                style={[
                  styles.insightItem,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                ]}
              >
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>
                    {isBurmese ? insight.titleMy : insight.title}
                  </Text>
                  <Text style={[styles.insightMessage, { color: colors.textSecondary }]}>
                    {isBurmese ? insight.messageMy : insight.message}
                  </Text>
                  {insight.actionable && (
                    <TouchableOpacity style={styles.insightAction}>
                      <Text style={styles.insightActionText}>
                        {isBurmese ? insight.actionMy : insight.action} →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Weekly Trend */}
        <View style={[styles.trendCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📈 အပတ်စဉ်လမ်းကြောင်း' : '📈 Weekly Trend'}
          </Text>
          <View style={styles.trendChart}>
            {history.slice(0, 7).reverse().map((day, index) => (
              <View key={day.date} style={styles.trendBar}>
                <View style={styles.trendBarContainer}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        height: `${day.score}%`,
                        backgroundColor: getScoreColor(day.score),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(day.date).getDay()]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tip Card */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 ကျန်းမာရေးရမှတ် ၇၀+ ထိန်းထားခြင်းသည် စွမ်းအင်၊ စိတ်ခံစားမှုနှင့် ထုတ်လုပ်နိုင်စွမ်းကို သိသိသာသာတိုးတက်စေသည်။'
              : '💡 Maintaining a wellness score of 70+ significantly improves energy, mood, and productivity.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Challenge Item Component
const ChallengeItem = ({
  challenge,
  colors,
  isBurmese,
}: {
  challenge: DailyChallenge;
  colors: any;
  isBurmese: boolean;
}) => {
  const progress = Math.min(100, (challenge.current / challenge.target) * 100);

  return (
    <View style={[styles.challengeItem, challenge.completed && styles.challengeCompleted]}>
      <View style={[styles.challengeIcon, { backgroundColor: challenge.color + '20' }]}>
        <Text style={styles.challengeEmoji}>{challenge.icon}</Text>
      </View>
      <View style={styles.challengeContent}>
        <View style={styles.challengeHeader}>
          <Text style={[styles.challengeTitle, { color: colors.text }]}>
            {isBurmese ? challenge.titleMy : challenge.title}
          </Text>
          <Text style={[styles.challengePoints, { color: challenge.color }]}>+{challenge.points}</Text>
        </View>
        <Text style={[styles.challengeDesc, { color: colors.textSecondary }]}>
          {isBurmese ? challenge.descriptionMy : challenge.description}
        </Text>
        <View style={styles.challengeProgress}>
          <View style={[styles.challengeProgressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.challengeProgressFill,
                { width: `${progress}%`, backgroundColor: challenge.color },
              ]}
            />
          </View>
          <Text style={[styles.challengeProgressText, { color: colors.textSecondary }]}>
            {challenge.current}/{challenge.target} {isBurmese ? challenge.unitMy : challenge.unit}
          </Text>
        </View>
      </View>
      {challenge.completed && (
        <View style={[styles.completedBadge, { backgroundColor: '#27AE60' }]}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  scoreCard: { alignItems: 'center', marginBottom: 24 },
  scoreCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  gradeEmoji: { fontSize: 32, marginBottom: 4 },
  scoreValue: { fontSize: 56, fontWeight: '800' },
  scoreLabel: { fontSize: 14, marginTop: 4 },
  gradeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  gradeText: { fontSize: 14, fontWeight: '700' },
  quickStats: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickStatItem: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  quickStatEmoji: { fontSize: 24, marginBottom: 8 },
  quickStatValue: { fontSize: 24, fontWeight: '700' },
  quickStatLabel: { fontSize: 11, marginTop: 4 },
  breakdownCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  breakdownItem: { marginBottom: 16 },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  breakdownEmoji: { fontSize: 20, marginRight: 10 },
  breakdownLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  breakdownScore: { fontSize: 16, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  challengesCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  challengesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pointsBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  pointsText: { fontSize: 12, fontWeight: '600', color: '#F39C12' },
  challengeItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10, backgroundColor: 'rgba(0,0,0,0.03)' },
  challengeCompleted: { opacity: 0.7 },
  challengeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  challengeEmoji: { fontSize: 24 },
  challengeContent: { flex: 1 },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  challengeTitle: { fontSize: 14, fontWeight: '600' },
  challengePoints: { fontSize: 12, fontWeight: '700' },
  challengeDesc: { fontSize: 11, marginTop: 2 },
  challengeProgress: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  challengeProgressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  challengeProgressFill: { height: '100%', borderRadius: 3 },
  challengeProgressText: { fontSize: 10, width: 70 },
  completedBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  insightsCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  insightItem: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 10 },
  insightIcon: { fontSize: 24, marginRight: 12 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '600' },
  insightMessage: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  insightAction: { marginTop: 8 },
  insightActionText: { fontSize: 12, fontWeight: '600', color: '#3498DB' },
  trendCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  trendChart: { flexDirection: 'row', justifyContent: 'space-between', height: 100 },
  trendBar: { alignItems: 'center', flex: 1 },
  trendBarContainer: { flex: 1, width: '60%', justifyContent: 'flex-end', marginBottom: 4 },
  trendBarFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  trendLabel: { fontSize: 10 },
  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
