import {
    Challenge,
    Friend,
    LeaderboardEntry,
    LeaderboardPeriod,
    LeaderboardType,
    SocialProfile,
    SocialStats,
    getActiveChallenges,
    getFriendActivity,
    getLeaderboard,
    getSocialProfile,
    getSocialStats,
    initializeSocialFeatures,
    syncProfileStats,
} from '@/services/social';
import { calculateStats } from '@/services/waterHistory';
import { useUserProfileStore } from '@/store/userProfile';
import { useCallback, useEffect, useState } from 'react';

export const useSocial = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  
  const { profile: userProfile } = useUserProfileStore();

  const loadProfile = useCallback(async () => {
    try {
      let socialProfile = await getSocialProfile();
      
      if (!socialProfile) {
        socialProfile = await initializeSocialFeatures(
          userProfile.name || 'hydro_user',
          userProfile.name || 'Hydro User'
        );
      }
      
      setProfile(socialProfile);
      return socialProfile;
    } catch (error) {
      console.error('Error loading social profile:', error);
      return null;
    }
  }, [userProfile.name]);

  const loadStats = useCallback(async () => {
    try {
      const socialStats = await getSocialStats();
      setStats(socialStats);
      return socialStats;
    } catch (error) {
      console.error('Error loading social stats:', error);
      return null;
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const friendsList = await getFriendActivity();
      setFriends(friendsList);
      return friendsList;
    } catch (error) {
      console.error('Error loading friends:', error);
      return [];
    }
  }, []);

  const loadChallenges = useCallback(async () => {
    try {
      const challengesList = await getActiveChallenges();
      setChallenges(challengesList);
      return challengesList;
    } catch (error) {
      console.error('Error loading challenges:', error);
      return [];
    }
  }, []);

  const syncStats = useCallback(async () => {
    try {
      const waterStats = await calculateStats(userProfile.dailyWaterGoal);
      await syncProfileStats(
        0, // Total intake would need to be calculated from history
        waterStats.currentStreak,
        waterStats.longestStreak,
        0 // Achievements count would need to be fetched
      );
    } catch (error) {
      console.error('Error syncing stats:', error);
    }
  }, [userProfile.dailyWaterGoal]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadProfile(),
      loadStats(),
      loadFriends(),
      loadChallenges(),
    ]);
    setLoading(false);
  }, [loadProfile, loadStats, loadFriends, loadChallenges]);

  useEffect(() => {
    refresh();
  }, []);

  return {
    loading,
    profile,
    stats,
    friends,
    challenges,
    refresh,
    syncStats,
  };
};

export const useLeaderboard = (
  period: LeaderboardPeriod = 'weekly',
  type: LeaderboardType = 'intake'
) => {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(period, type);
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [period, type]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    leaderboard,
    error,
    refresh: load,
  };
};
