import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    CHALLENGE_TEMPLATES,
    Challenge,
    ChallengeTemplate,
    Friend,
    LeaderboardEntry,
    LeaderboardPeriod,
    LeaderboardType,
    SocialProfile,
    SocialStats,
    createChallenge,
    getActiveChallenges,
    getFriendActivity,
    getLeaderboard,
    getSocialProfile,
    getSocialStats,
    initializeSocialFeatures,
} from '@/services/social';
import { useUserProfileStore } from '@/store/userProfile';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View, StyleSheet
} from 'react-native';

type TabType = 'leaderboard' | 'friends' | 'challenges';

export default function SocialScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';
  const { profile: userProfile } = useUserProfileStore();

  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [socialProfile, setSocialProfile] = useState<SocialProfile | null>(null);
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  
  // Leaderboard filters
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('weekly');
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('intake');
  
  // Modals
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChallengeTemplate | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Initialize social profile if needed
      let profile = await getSocialProfile();
      if (!profile) {
        profile = await initializeSocialFeatures(
          userProfile.name || 'hydro_user',
          userProfile.name || 'Hydro User'
        );
      }
      setSocialProfile(profile);

      // Load all data in parallel
      const [statsData, leaderboardData, friendsData, challengesData] = await Promise.all([
        getSocialStats(),
        getLeaderboard(leaderboardPeriod, leaderboardType),
        getFriendActivity(),
        getActiveChallenges(),
      ]);

      setStats(statsData);
      setLeaderboard(leaderboardData);
      setFriends(friendsData);
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile.name, leaderboardPeriod, leaderboardType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleShare = async () => {
    try {
      const message = isBurmese
        ? `🏆 HydroMate တွင် ကျွန်တော်/မ၏ အဆင့်: #${stats?.currentRank || '-'}\n\n🔥 ${stats?.currentStreak || 0} ရက်ဆက်တိုက်\n💧 ရေဓာတ်ထိန်းထားပြီး ကျန်းမာနေပါ!\n\n#HydroMate`
        : `🏆 My rank on HydroMate: #${stats?.currentRank || '-'}\n\n🔥 ${stats?.currentStreak || 0} day streak\n💧 Staying hydrated and healthy!\n\n#HydroMate`;
      
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCreateChallenge = async (template: ChallengeTemplate) => {
    try {
      // For demo, create challenge with first 2 friends
      const friendIds = friends.slice(0, 2).map(f => f.id);
      await createChallenge(template, friendIds);
      setShowCreateChallenge(false);
      setSelectedTemplate(null);
      loadData();
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const renderStatsCard = () => (
    <View style={[styles.statsCard, { backgroundColor: colors.primary }]}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>#{stats?.currentRank || '-'}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'အဆင့်' : 'Rank'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'ဆက်တိုက်' : 'Streak'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.totalFriends || 0}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'သူငယ်ချင်း' : 'Friends'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.challengesWon || 0}</Text>
          <Text style={styles.statLabel}>{isBurmese ? 'အနိုင်ရ' : 'Wins'}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share-social" size={18} color="#fff" />
        <Text style={styles.shareButtonText}>
          {isBurmese ? 'မျှဝေမည်' : 'Share Stats'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
      {(['leaderboard', 'friends', 'challenges'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && { backgroundColor: colors.primary + '20' },
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Ionicons
            name={
              tab === 'leaderboard' ? 'trophy' :
              tab === 'friends' ? 'people' : 'flag'
            }
            size={20}
            color={activeTab === tab ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab ? colors.primary : colors.textSecondary },
            ]}
          >
            {tab === 'leaderboard' ? (isBurmese ? 'အဆင့်' : 'Leaderboard') :
             tab === 'friends' ? (isBurmese ? 'သူငယ်ချင်း' : 'Friends') :
             (isBurmese ? 'စိန်ခေါ်မှု' : 'Challenges')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );


  const renderLeaderboardFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {/* Period filters */}
        {(['daily', 'weekly', 'monthly'] as LeaderboardPeriod[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.filterChip,
              { backgroundColor: leaderboardPeriod === period ? colors.primary : colors.surfaceVariant },
            ]}
            onPress={() => setLeaderboardPeriod(period)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: leaderboardPeriod === period ? '#fff' : colors.text },
              ]}
            >
              {period === 'daily' ? (isBurmese ? 'နေ့စဉ်' : 'Daily') :
               period === 'weekly' ? (isBurmese ? 'အပတ်စဉ်' : 'Weekly') :
               (isBurmese ? 'လစဉ်' : 'Monthly')}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterSpacer} />
        {/* Type filters */}
        {(['intake', 'streak', 'consistency'] as LeaderboardType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              { backgroundColor: leaderboardType === type ? colors.secondary : colors.surfaceVariant },
            ]}
            onPress={() => setLeaderboardType(type)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: leaderboardType === type ? '#fff' : colors.text },
              ]}
            >
              {type === 'intake' ? (isBurmese ? '💧 ပမာဏ' : '💧 Volume') :
               type === 'streak' ? (isBurmese ? '🔥 ဆက်တိုက်' : '🔥 Streak') :
               (isBurmese ? '⭐ တသမတ်' : '⭐ Consistency')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderLeaderboardItem = (entry: LeaderboardEntry, index: number) => {
    const isTopThree = entry.rank <= 3;
    const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
    
    return (
      <View
        key={entry.userId}
        style={[
          styles.leaderboardItem,
          { backgroundColor: entry.isCurrentUser ? colors.primary + '15' : colors.card },
          entry.isCurrentUser && { borderColor: colors.primary, borderWidth: 2 },
        ]}
      >
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Text style={styles.rankEmoji}>{rankEmoji}</Text>
          ) : (
            <Text style={[styles.rankNumber, { color: colors.textSecondary }]}>
              {entry.rank}
            </Text>
          )}
        </View>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{entry.avatarEmoji}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {entry.displayName}
            {entry.isCurrentUser && (
              <Text style={{ color: colors.primary }}> ({isBurmese ? 'သင်' : 'You'})</Text>
            )}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{entry.username}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: colors.primary }]}>
            {leaderboardType === 'intake' 
              ? `${(entry.score / 1000).toFixed(1)}L`
              : leaderboardType === 'streak'
                ? `${entry.score}d`
                : `${entry.score}%`}
          </Text>
          {leaderboardType !== 'streak' && (
            <Text style={[styles.streak, { color: colors.textSecondary }]}>
              🔥 {entry.streak}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderLeaderboard = () => (
    <View style={styles.tabContent}>
      {renderLeaderboardFilters()}
      {leaderboard.map((entry, index) => renderLeaderboardItem(entry, index))}
    </View>
  );

  const renderFriendItem = (friend: Friend) => (
    <View key={friend.id} style={[styles.friendItem, { backgroundColor: colors.card }]}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{friend.avatarEmoji}</Text>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: friend.status === 'accepted' ? '#4CAF50' : '#FFC107' },
          ]}
        />
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.displayName, { color: colors.text }]}>{friend.displayName}</Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>@{friend.username}</Text>
      </View>
      <View style={styles.friendStats}>
        <View style={styles.friendStatRow}>
          <Text style={styles.friendStatIcon}>💧</Text>
          <Text style={[styles.friendStatValue, { color: colors.text }]}>
            {friend.todayIntake}ml
          </Text>
        </View>
        <View style={styles.friendStatRow}>
          <Text style={styles.friendStatIcon}>🔥</Text>
          <Text style={[styles.friendStatValue, { color: colors.text }]}>
            {friend.currentStreak}d
          </Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.challengeButton, { backgroundColor: colors.primary }]}>
        <Ionicons name="flash" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderFriends = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={[styles.addFriendButton, { backgroundColor: colors.primary + '15' }]}
        onPress={() => router.push('/friends')}
      >
        <Ionicons name="person-add" size={24} color={colors.primary} />
        <Text style={[styles.addFriendText, { color: colors.primary }]}>
          {isBurmese ? 'သူငယ်ချင်းထည့်ရန်' : 'Add Friends'}
        </Text>
      </TouchableOpacity>
      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isBurmese ? 'သူငယ်ချင်းများထည့်ပြီး အတူတူ ရေဓာတ်ထိန်းထားပါ!' : 'Add friends to stay hydrated together!'}
          </Text>
        </View>
      ) : (
        friends.map(renderFriendItem)
      )}
    </View>
  );


  const renderChallengeItem = (challenge: Challenge) => {
    const progress = challenge.participants.find(p => p.id === socialProfile?.id)?.progress || 0;
    const progressPercent = Math.min(100, (progress / challenge.goal) * 100);
    const daysLeft = Math.max(0, Math.ceil(
      (new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));

    return (
      <View key={challenge.id} style={[styles.challengeItem, { backgroundColor: colors.card }]}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeIcon}>
            {challenge.type === 'streak' ? '🔥' :
             challenge.type === 'volume' ? '💧' :
             challenge.type === 'consistency' ? '⭐' : '🌅'}
          </Text>
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeTitle, { color: colors.text }]}>
              {isBurmese ? challenge.titleMy : challenge.title}
            </Text>
            <Text style={[styles.challengeDesc, { color: colors.textSecondary }]}>
              {isBurmese ? challenge.descriptionMy : challenge.description}
            </Text>
          </View>
          <View style={[styles.daysLeftBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.daysLeftText, { color: colors.primary }]}>
              {daysLeft}d
            </Text>
          </View>
        </View>

        <View style={styles.challengeProgress}>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {progress}/{challenge.goal} ({Math.round(progressPercent)}%)
          </Text>
        </View>

        <View style={styles.participantsRow}>
          <View style={styles.participantAvatars}>
            {challenge.participants.slice(0, 4).map((p, i) => (
              <View
                key={p.id}
                style={[styles.participantAvatar, { marginLeft: i > 0 ? -8 : 0 }]}
              >
                <Text style={styles.participantEmoji}>{p.avatarEmoji}</Text>
              </View>
            ))}
            {challenge.participants.length > 4 && (
              <View style={[styles.participantAvatar, styles.moreParticipants, { marginLeft: -8 }]}>
                <Text style={styles.moreText}>+{challenge.participants.length - 4}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.participantCount, { color: colors.textSecondary }]}>
            {challenge.participants.length} {isBurmese ? 'ဦး' : 'participants'}
          </Text>
        </View>
      </View>
    );
  };

  const renderChallenges = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={[styles.createChallengeButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreateChallenge(true)}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.createChallengeText}>
          {isBurmese ? 'စိန်ခေါ်မှုအသစ်ဖန်တီးရန်' : 'Create New Challenge'}
        </Text>
      </TouchableOpacity>

      {challenges.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isBurmese 
              ? 'စိန်ခေါ်မှုတစ်ခုဖန်တီးပြီး သူငယ်ချင်းများကို ဖိတ်ခေါ်ပါ!'
              : 'Create a challenge and invite friends!'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '🎯 လက်ရှိစိန်ခေါ်မှုများ' : '🎯 Active Challenges'}
          </Text>
          {challenges.map(renderChallengeItem)}
        </>
      )}
    </View>
  );

  const renderCreateChallengeModal = () => (
    <Modal visible={showCreateChallenge} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isBurmese ? '🏆 စိန်ခေါ်မှုဖန်တီးရန်' : '🏆 Create Challenge'}
            </Text>
            <TouchableOpacity onPress={() => setShowCreateChallenge(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {isBurmese ? 'စိန်ခေါ်မှုပုံစံရွေးချယ်ပါ' : 'Choose a challenge template'}
            </Text>

            {CHALLENGE_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  { backgroundColor: colors.card },
                  selectedTemplate?.id === template.id && {
                    borderColor: colors.primary,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedTemplate(template)}
              >
                <Text style={styles.templateIcon}>{template.icon}</Text>
                <View style={styles.templateInfo}>
                  <Text style={[styles.templateTitle, { color: colors.text }]}>
                    {isBurmese ? template.titleMy : template.title}
                  </Text>
                  <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>
                    {isBurmese ? template.descriptionMy : template.description}
                  </Text>
                  <Text style={[styles.templateDuration, { color: colors.primary }]}>
                    {template.duration} {isBurmese ? 'ရက်' : 'days'}
                  </Text>
                </View>
                {selectedTemplate?.id === template.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: selectedTemplate ? colors.primary : colors.surfaceVariant },
            ]}
            onPress={() => selectedTemplate && handleCreateChallenge(selectedTemplate)}
            disabled={!selectedTemplate}
          >
            <Text style={[styles.createButtonText, { color: selectedTemplate ? '#fff' : colors.textSecondary }]}>
              {isBurmese ? 'စိန်ခေါ်မှုစတင်ရန်' : 'Start Challenge'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isBurmese ? '👥 လူမှုကွန်ရက်' : '👥 Social'}
        </Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {renderStatsCard()}
        {renderTabs()}
        
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'challenges' && renderChallenges()}
      </ScrollView>

      {renderCreateChallengeModal()}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Stats Card
  statsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  shareButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  tabContent: { gap: 12 },

  // Filters
  filtersContainer: { marginBottom: 12 },
  filterScroll: { flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: { fontSize: 13, fontWeight: '500' },
  filterSpacer: { width: 8 },

  // Leaderboard
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  rankContainer: { width: 32, alignItems: 'center' },
  rankEmoji: { fontSize: 24 },
  rankNumber: { fontSize: 16, fontWeight: '700' },
  avatarContainer: { position: 'relative' },
  avatar: { fontSize: 32 },
  userInfo: { flex: 1 },
  displayName: { fontSize: 15, fontWeight: '600' },
  username: { fontSize: 12 },
  scoreContainer: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: '700' },
  streak: { fontSize: 12 },

  // Friends
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  addFriendText: { fontSize: 16, fontWeight: '600' },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  friendInfo: { flex: 1 },
  friendStats: { gap: 4 },
  friendStatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  friendStatIcon: { fontSize: 12 },
  friendStatValue: { fontSize: 13, fontWeight: '600' },
  challengeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Challenges
  createChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  createChallengeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  challengeItem: { borderRadius: 16, padding: 16 },
  challengeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  challengeIcon: { fontSize: 32 },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: 16, fontWeight: '600' },
  challengeDesc: { fontSize: 13, marginTop: 2 },
  daysLeftBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  daysLeftText: { fontSize: 12, fontWeight: '700' },
  challengeProgress: { marginTop: 12 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, marginTop: 4, textAlign: 'right' },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  participantAvatars: { flexDirection: 'row' },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  participantEmoji: { fontSize: 16 },
  moreParticipants: { backgroundColor: '#9E9E9E' },
  moreText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  participantCount: { fontSize: 12 },

  // Empty State
  emptyState: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalScroll: { padding: 20 },
  modalSubtitle: { fontSize: 14, marginBottom: 16 },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  templateIcon: { fontSize: 36 },
  templateInfo: { flex: 1 },
  templateTitle: { fontSize: 15, fontWeight: '600' },
  templateDesc: { fontSize: 13, marginTop: 2 },
  templateDuration: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  createButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: { fontSize: 16, fontWeight: '600' },
});
