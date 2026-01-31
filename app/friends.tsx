import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    Friend,
    acceptFriendRequest,
    addFriend,
    getFriends,
    removeFriend,
} from '@/services/social';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function FriendsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const loadFriends = useCallback(async () => {
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFriends();
  };

  const handleAddFriend = async () => {
    if (!searchQuery.trim()) return;

    setAdding(true);
    try {
      const friend = await addFriend(searchQuery.trim().toLowerCase());
      if (friend) {
        setFriends(prev => [...prev, friend]);
        setSearchQuery('');
        Alert.alert(
          isBurmese ? '✅ အောင်မြင်ပါသည်' : '✅ Success',
          isBurmese 
            ? `${friend.displayName} ကို သူငယ်ချင်းတောင်းဆိုမှုပို့လိုက်ပါပြီ`
            : `Friend request sent to ${friend.displayName}`
        );
      } else {
        Alert.alert(
          isBurmese ? '❌ မအောင်မြင်ပါ' : '❌ Error',
          isBurmese ? 'ဤအသုံးပြုသူကို ရှာမတွေ့ပါ သို့မဟုတ် သူငယ်ချင်းဖြစ်ပြီးသားဖြစ်သည်' : 'User not found or already friends'
        );
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleAcceptRequest = async (friendId: string) => {
    const success = await acceptFriendRequest(friendId);
    if (success) {
      setFriends(prev =>
        prev.map(f => (f.id === friendId ? { ...f, status: 'accepted' } : f))
      );
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    Alert.alert(
      isBurmese ? 'သူငယ်ချင်းဖယ်ရှားမည်' : 'Remove Friend',
      isBurmese 
        ? `${friend.displayName} ကို သူငယ်ချင်းစာရင်းမှ ဖယ်ရှားမည်လား?`
        : `Remove ${friend.displayName} from your friends?`,
      [
        { text: isBurmese ? 'မလုပ်တော့ပါ' : 'Cancel', style: 'cancel' },
        {
          text: isBurmese ? 'ဖယ်ရှားမည်' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFriend(friend.id);
            if (success) {
              setFriends(prev => prev.filter(f => f.id !== friend.id));
            }
          },
        },
      ]
    );
  };

  const pendingRequests = friends.filter(f => f.status === 'pending');
  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  const renderFriendItem = (friend: Friend, isPending: boolean = false) => (
    <View key={friend.id} style={[styles.friendItem, { backgroundColor: colors.card }]}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{friend.avatarEmoji}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.displayName, { color: colors.text }]}>{friend.displayName}</Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>@{friend.username}</Text>
        {!isPending && (
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              💧 {friend.todayIntake}ml
            </Text>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              🔥 {friend.currentStreak}d streak
            </Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        {isPending ? (
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAcceptRequest(friend.id)}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => handleRemoveFriend(friend)}
          >
            <Ionicons name="person-remove" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
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
          {isBurmese ? '👥 သူငယ်ချင်းများ' : '👥 Friends'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Search/Add Friend */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={isBurmese ? 'အသုံးပြုသူအမည်ဖြင့် ရှာပါ...' : 'Search by username...'}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddFriend}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="person-add" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBurmese ? '📩 တောင်းဆိုမှုများ' : '📩 Pending Requests'}
            </Text>
            {pendingRequests.map(f => renderFriendItem(f, true))}
          </>
        )}

        {/* Friends List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? `👥 သူငယ်ချင်းများ (${acceptedFriends.length})` : `👥 Friends (${acceptedFriends.length})`}
        </Text>
        
        {acceptedFriends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🤝</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isBurmese 
                ? 'သူငယ်ချင်းများထည့်ပြီး အတူတူ ရေဓာတ်ထိန်းထားပါ!'
                : 'Add friends to stay hydrated together!'}
            </Text>
          </View>
        ) : (
          acceptedFriends.map(f => renderFriendItem(f))
        )}

        {/* Invite Section */}
        <View style={[styles.inviteCard, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="share-social" size={32} color={colors.primary} />
          <View style={styles.inviteContent}>
            <Text style={[styles.inviteTitle, { color: colors.text }]}>
              {isBurmese ? 'သူငယ်ချင်းများကို ဖိတ်ခေါ်ပါ' : 'Invite Friends'}
            </Text>
            <Text style={[styles.inviteDesc, { color: colors.textSecondary }]}>
              {isBurmese 
                ? 'HydroMate ကို သူငယ်ချင်းများနှင့် မျှဝေပြီး အတူတူ ကျန်းမာပါစေ'
                : 'Share HydroMate with friends and stay healthy together'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.inviteButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.inviteButtonText}>{isBurmese ? 'ဖိတ်ခေါ်ရန်' : 'Invite'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 16 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },

  // Friend Item
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  avatarContainer: {},
  avatar: { fontSize: 36 },
  friendInfo: { flex: 1 },
  displayName: { fontSize: 16, fontWeight: '600' },
  username: { fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statText: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },

  // Invite Card
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 12,
  },
  inviteContent: { flex: 1 },
  inviteTitle: { fontSize: 15, fontWeight: '600' },
  inviteDesc: { fontSize: 13, marginTop: 2 },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  inviteButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
