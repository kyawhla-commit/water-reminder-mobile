/**
 * Social Features Service
 * 
 * Handles friend connections, challenges, leaderboards, and sharing functionality.
 * Uses AsyncStorage for local data with mock social interactions.
 * In production, this would connect to a backend API.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// ============ STORAGE KEYS ============
const FRIENDS_KEY = 'social_friends';
const CHALLENGES_KEY = 'social_challenges';
const LEADERBOARD_KEY = 'social_leaderboard';
const SOCIAL_PROFILE_KEY = 'social_profile';

// ============ TYPES ============

export interface SocialProfile {
  id: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  joinedAt: string;
  totalWaterIntake: number;
  currentStreak: number;
  longestStreak: number;
  achievementsCount: number;
  challengesWon: number;
  isPublic: boolean;
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  status: 'pending' | 'accepted' | 'blocked';
  addedAt: string;
  lastActive?: string;
  currentStreak: number;
  todayIntake: number;
  dailyGoal: number;
}

export interface Challenge {
  id: string;
  type: 'streak' | 'volume' | 'consistency' | 'speed';
  title: string;
  titleMy: string;
  description: string;
  descriptionMy: string;
  creatorId: string;
  creatorName: string;
  participants: ChallengeParticipant[];
  startDate: string;
  endDate: string;
  goal: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  winnerId?: string;
  createdAt: string;
}

export interface ChallengeParticipant {
  id: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  progress: number;
  isCreator: boolean;
  joinedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  score: number;
  streak: number;
  isCurrentUser: boolean;
}

export interface ShareableAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  shareText: string;
  shareTextMy: string;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';
export type LeaderboardType = 'intake' | 'streak' | 'consistency';

// ============ CHALLENGE TEMPLATES ============

export interface ChallengeTemplate {
  id: string;
  type: Challenge['type'];
  title: string;
  titleMy: string;
  description: string;
  descriptionMy: string;
  duration: number; // days
  goal: number;
  icon: string;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'streak_7',
    type: 'streak',
    title: '7-Day Streak Challenge',
    titleMy: '၇ ရက်ဆက်တိုက် စိန်ခေါ်မှု',
    description: 'Maintain your daily goal for 7 consecutive days',
    descriptionMy: '၇ ရက်ဆက်တိုက် နေ့စဉ်ပန်းတိုင်ထိန်းထားပါ',
    duration: 7,
    goal: 7,
    icon: '🔥',
  },
  {
    id: 'volume_week',
    type: 'volume',
    title: 'Weekly Hydration Hero',
    titleMy: 'အပတ်စဉ် ရေဓာတ်သူရဲကောင်း',
    description: 'Drink the most water this week',
    descriptionMy: 'ဤအပတ်တွင် ရေအများဆုံးသောက်ပါ',
    duration: 7,
    goal: 14000, // 14L in a week
    icon: '🏆',
  },
  {
    id: 'consistency_month',
    type: 'consistency',
    title: 'Monthly Consistency',
    titleMy: 'လစဉ် တသမတ်တည်းမှု',
    description: 'Hit your goal at least 25 days this month',
    descriptionMy: 'ဤလတွင် အနည်းဆုံး ၂၅ ရက် ပန်းတိုင်ရောက်ပါ',
    duration: 30,
    goal: 25,
    icon: '⭐',
  },
  {
    id: 'speed_morning',
    type: 'speed',
    title: 'Early Bird Challenge',
    titleMy: 'စောစောထသူ စိန်ခေါ်မှု',
    description: 'Drink 500ml before 9 AM for 5 days',
    descriptionMy: '၅ ရက်တိုင်တိုင် မနက် ၉ နာရီမတိုင်မီ 500ml သောက်ပါ',
    duration: 5,
    goal: 5,
    icon: '🌅',
  },
  {
    id: 'streak_30',
    type: 'streak',
    title: '30-Day Warrior',
    titleMy: '၃၀ ရက် စစ်သည်',
    description: 'The ultimate streak challenge - 30 days!',
    descriptionMy: 'အဆုံးစွန် ဆက်တိုက်စိန်ခေါ်မှု - ၃၀ ရက်!',
    duration: 30,
    goal: 30,
    icon: '👑',
  },
];


// ============ MOCK DATA GENERATORS ============

const AVATAR_EMOJIS = ['😊', '😎', '🤓', '🥳', '😇', '🤩', '😺', '🐱', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙'];
const MOCK_NAMES = [
  { username: 'hydro_hero', displayName: 'Alex' },
  { username: 'water_warrior', displayName: 'Sam' },
  { username: 'aqua_master', displayName: 'Jordan' },
  { username: 'h2o_champion', displayName: 'Taylor' },
  { username: 'splash_king', displayName: 'Morgan' },
  { username: 'droplet_queen', displayName: 'Casey' },
  { username: 'wave_rider', displayName: 'Riley' },
  { username: 'stream_star', displayName: 'Quinn' },
];

const generateMockFriend = (index: number): Friend => {
  const name = MOCK_NAMES[index % MOCK_NAMES.length];
  return {
    id: uuidv4(),
    username: name.username,
    displayName: name.displayName,
    avatarEmoji: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
    status: 'accepted',
    addedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    currentStreak: Math.floor(Math.random() * 30),
    todayIntake: Math.floor(Math.random() * 2500),
    dailyGoal: 2000,
  };
};

const generateMockLeaderboard = (
  currentUserProfile: SocialProfile,
  period: LeaderboardPeriod,
  type: LeaderboardType
): LeaderboardEntry[] => {
  const entries: LeaderboardEntry[] = [];
  
  // Generate mock entries
  for (let i = 0; i < 10; i++) {
    const name = MOCK_NAMES[i % MOCK_NAMES.length];
    const baseScore = type === 'intake' 
      ? (period === 'daily' ? 2500 : period === 'weekly' ? 17500 : 70000)
      : type === 'streak' ? 30 : 95;
    
    entries.push({
      rank: i + 1,
      userId: uuidv4(),
      username: name.username,
      displayName: name.displayName,
      avatarEmoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
      score: Math.floor(baseScore * (1 - i * 0.08) + Math.random() * 200),
      streak: Math.floor(Math.random() * 30) + 1,
      isCurrentUser: false,
    });
  }

  // Insert current user at a random position
  const userRank = Math.floor(Math.random() * 8) + 3;
  const userScore = type === 'intake' 
    ? currentUserProfile.totalWaterIntake 
    : type === 'streak' 
      ? currentUserProfile.currentStreak 
      : 85;

  entries.splice(userRank - 1, 0, {
    rank: userRank,
    userId: currentUserProfile.id,
    username: currentUserProfile.username,
    displayName: currentUserProfile.displayName,
    avatarEmoji: currentUserProfile.avatarEmoji,
    score: userScore,
    streak: currentUserProfile.currentStreak,
    isCurrentUser: true,
  });

  // Update ranks
  return entries.slice(0, 10).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

// ============ SOCIAL PROFILE ============

export const getSocialProfile = async (): Promise<SocialProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(SOCIAL_PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting social profile:', error);
    return null;
  }
};

export const createSocialProfile = async (
  username: string,
  displayName: string,
  avatarEmoji: string = '😊'
): Promise<SocialProfile> => {
  const profile: SocialProfile = {
    id: uuidv4(),
    username: username.toLowerCase().replace(/\s/g, '_'),
    displayName,
    avatarEmoji,
    joinedAt: new Date().toISOString(),
    totalWaterIntake: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievementsCount: 0,
    challengesWon: 0,
    isPublic: true,
  };

  await AsyncStorage.setItem(SOCIAL_PROFILE_KEY, JSON.stringify(profile));
  return profile;
};

export const updateSocialProfile = async (updates: Partial<SocialProfile>): Promise<SocialProfile | null> => {
  try {
    const current = await getSocialProfile();
    if (!current) return null;

    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(SOCIAL_PROFILE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error updating social profile:', error);
    return null;
  }
};

export const syncProfileStats = async (
  totalIntake: number,
  currentStreak: number,
  longestStreak: number,
  achievementsCount: number
): Promise<void> => {
  await updateSocialProfile({
    totalWaterIntake: totalIntake,
    currentStreak,
    longestStreak,
    achievementsCount,
  });
};


// ============ FRIENDS ============

export const getFriends = async (): Promise<Friend[]> => {
  try {
    const data = await AsyncStorage.getItem(FRIENDS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Generate mock friends for demo
    const mockFriends = Array.from({ length: 5 }, (_, i) => generateMockFriend(i));
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(mockFriends));
    return mockFriends;
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
};

export const addFriend = async (username: string): Promise<Friend | null> => {
  try {
    const friends = await getFriends();
    
    // Check if already friends
    if (friends.some(f => f.username === username)) {
      return null;
    }

    // In production, this would search the backend
    // For now, create a mock friend
    const newFriend: Friend = {
      id: uuidv4(),
      username,
      displayName: username.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      avatarEmoji: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
      status: 'pending',
      addedAt: new Date().toISOString(),
      currentStreak: Math.floor(Math.random() * 15),
      todayIntake: Math.floor(Math.random() * 2000),
      dailyGoal: 2000,
    };

    friends.push(newFriend);
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
    return newFriend;
  } catch (error) {
    console.error('Error adding friend:', error);
    return null;
  }
};

export const removeFriend = async (friendId: string): Promise<boolean> => {
  try {
    const friends = await getFriends();
    const filtered = friends.filter(f => f.id !== friendId);
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
};

export const acceptFriendRequest = async (friendId: string): Promise<boolean> => {
  try {
    const friends = await getFriends();
    const index = friends.findIndex(f => f.id === friendId);
    if (index === -1) return false;

    friends[index].status = 'accepted';
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
};

export const getFriendActivity = async (): Promise<Friend[]> => {
  const friends = await getFriends();
  // Sort by last active, most recent first
  return friends
    .filter(f => f.status === 'accepted')
    .sort((a, b) => {
      if (!a.lastActive) return 1;
      if (!b.lastActive) return -1;
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });
};

// ============ CHALLENGES ============

export const getChallenges = async (): Promise<Challenge[]> => {
  try {
    const data = await AsyncStorage.getItem(CHALLENGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting challenges:', error);
    return [];
  }
};

export const createChallenge = async (
  template: ChallengeTemplate,
  invitedFriendIds: string[]
): Promise<Challenge | null> => {
  try {
    const profile = await getSocialProfile();
    if (!profile) return null;

    const friends = await getFriends();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + template.duration);

    const participants: ChallengeParticipant[] = [
      {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        avatarEmoji: profile.avatarEmoji,
        progress: 0,
        isCreator: true,
        joinedAt: new Date().toISOString(),
      },
    ];

    // Add invited friends
    invitedFriendIds.forEach(friendId => {
      const friend = friends.find(f => f.id === friendId);
      if (friend) {
        participants.push({
          id: friend.id,
          username: friend.username,
          displayName: friend.displayName,
          avatarEmoji: friend.avatarEmoji,
          progress: 0,
          isCreator: false,
          joinedAt: new Date().toISOString(),
        });
      }
    });

    const challenge: Challenge = {
      id: uuidv4(),
      type: template.type,
      title: template.title,
      titleMy: template.titleMy,
      description: template.description,
      descriptionMy: template.descriptionMy,
      creatorId: profile.id,
      creatorName: profile.displayName,
      participants,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      goal: template.goal,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const challenges = await getChallenges();
    challenges.push(challenge);
    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    return challenge;
  } catch (error) {
    console.error('Error creating challenge:', error);
    return null;
  }
};

export const joinChallenge = async (challengeId: string): Promise<boolean> => {
  try {
    const profile = await getSocialProfile();
    if (!profile) return false;

    const challenges = await getChallenges();
    const index = challenges.findIndex(c => c.id === challengeId);
    if (index === -1) return false;

    // Check if already participating
    if (challenges[index].participants.some(p => p.id === profile.id)) {
      return false;
    }

    challenges[index].participants.push({
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatarEmoji: profile.avatarEmoji,
      progress: 0,
      isCreator: false,
      joinedAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    return true;
  } catch (error) {
    console.error('Error joining challenge:', error);
    return false;
  }
};

export const updateChallengeProgress = async (
  challengeId: string,
  progress: number
): Promise<boolean> => {
  try {
    const profile = await getSocialProfile();
    if (!profile) return false;

    const challenges = await getChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);
    if (challengeIndex === -1) return false;

    const participantIndex = challenges[challengeIndex].participants.findIndex(
      p => p.id === profile.id
    );
    if (participantIndex === -1) return false;

    challenges[challengeIndex].participants[participantIndex].progress = progress;

    // Check if challenge is completed
    const challenge = challenges[challengeIndex];
    if (new Date() > new Date(challenge.endDate) && challenge.status === 'active') {
      challenge.status = 'completed';
      // Find winner (highest progress)
      const winner = challenge.participants.reduce((prev, current) =>
        current.progress > prev.progress ? current : prev
      );
      challenge.winnerId = winner.id;

      // Update challenges won if current user won
      if (winner.id === profile.id) {
        await updateSocialProfile({ challengesWon: (profile.challengesWon || 0) + 1 });
      }
    }

    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    return true;
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return false;
  }
};

export const getActiveChallenges = async (): Promise<Challenge[]> => {
  const challenges = await getChallenges();
  const now = new Date();
  return challenges.filter(c => 
    c.status === 'active' && new Date(c.endDate) > now
  );
};

export const getCompletedChallenges = async (): Promise<Challenge[]> => {
  const challenges = await getChallenges();
  return challenges.filter(c => c.status === 'completed');
};


// ============ LEADERBOARD ============

export const getLeaderboard = async (
  period: LeaderboardPeriod = 'weekly',
  type: LeaderboardType = 'intake'
): Promise<LeaderboardEntry[]> => {
  try {
    const profile = await getSocialProfile();
    if (!profile) {
      // Return mock leaderboard without current user
      return generateMockLeaderboard(
        {
          id: 'guest',
          username: 'guest',
          displayName: 'Guest',
          avatarEmoji: '👤',
          joinedAt: new Date().toISOString(),
          totalWaterIntake: 0,
          currentStreak: 0,
          longestStreak: 0,
          achievementsCount: 0,
          challengesWon: 0,
          isPublic: false,
        },
        period,
        type
      );
    }

    // In production, this would fetch from backend
    // For now, generate mock leaderboard with current user
    return generateMockLeaderboard(profile, period, type);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};

export const getUserRank = async (
  period: LeaderboardPeriod = 'weekly',
  type: LeaderboardType = 'intake'
): Promise<number | null> => {
  const leaderboard = await getLeaderboard(period, type);
  const userEntry = leaderboard.find(e => e.isCurrentUser);
  return userEntry?.rank || null;
};

// ============ SHARING ============

export const generateShareText = (
  achievement: ShareableAchievement,
  language: 'en' | 'my' = 'en'
): string => {
  return language === 'my' ? achievement.shareTextMy : achievement.shareText;
};

export const createShareableAchievement = (
  title: string,
  titleMy: string,
  description: string,
  descriptionMy: string,
  icon: string,
  unlockedAt: string
): ShareableAchievement => {
  return {
    id: uuidv4(),
    title,
    description,
    icon,
    unlockedAt,
    shareText: `🎉 I just unlocked "${title}" in HydroMate! ${icon}\n\n${description}\n\n💧 Stay hydrated with me! #HydroMate #Hydration`,
    shareTextMy: `🎉 HydroMate တွင် "${titleMy}" ရရှိလိုက်ပါပြီ! ${icon}\n\n${descriptionMy}\n\n💧 ကျွန်တော်/မနဲ့အတူ ရေဓာတ်ထိန်းထားပါ! #HydroMate #ရေဓာတ်`,
  };
};

export const createStreakShareText = (streak: number, language: 'en' | 'my' = 'en'): string => {
  if (language === 'my') {
    return `🔥 ${streak} ရက်ဆက်တိုက် ရေဓာတ်ပန်းတိုင်ရောက်နေပါပြီ!\n\n💧 HydroMate နဲ့ ကျန်းမာရေးအလေ့အထကောင်းတွေ တည်ဆောက်နေပါတယ်။\n\n#HydroMate #ရေဓာတ် #ကျန်းမာရေး`;
  }
  return `🔥 ${streak} day hydration streak and counting!\n\n💧 Building healthy habits with HydroMate.\n\n#HydroMate #Hydration #HealthyHabits`;
};

export const createWeeklyProgressShareText = (
  weeklyIntake: number,
  goalPercentage: number,
  language: 'en' | 'my' = 'en'
): string => {
  const liters = (weeklyIntake / 1000).toFixed(1);
  if (language === 'my') {
    return `📊 ဤအပတ် ရေ ${liters}L သောက်ပြီးပါပြီ!\n\n🎯 ပန်းတိုင်၏ ${goalPercentage}% ပြည့်မီပါပြီ\n\n💧 HydroMate နဲ့ ရေဓာတ်ထိန်းထားပါ!\n\n#HydroMate #အပတ်စဉ်တိုးတက်မှု`;
  }
  return `📊 Drank ${liters}L of water this week!\n\n🎯 ${goalPercentage}% of my weekly goal achieved\n\n💧 Staying hydrated with HydroMate!\n\n#HydroMate #WeeklyProgress #Hydration`;
};

export const createChallengeShareText = (
  challengeTitle: string,
  isWinner: boolean,
  language: 'en' | 'my' = 'en'
): string => {
  if (language === 'my') {
    if (isWinner) {
      return `🏆 "${challengeTitle}" စိန်ခေါ်မှုတွင် အနိုင်ရရှိလိုက်ပါပြီ!\n\n💪 HydroMate တွင် ကျွန်တော်/မကို စိန်ခေါ်ကြည့်ပါ!\n\n#HydroMate #စိန်ခေါ်မှု #အနိုင်ရသူ`;
    }
    return `🎯 "${challengeTitle}" စိန်ခေါ်မှုတွင် ပါဝင်နေပါတယ်!\n\n💧 HydroMate တွင် ကျွန်တော်/မနဲ့အတူ ပါဝင်ပါ!\n\n#HydroMate #စိန်ခေါ်မှု`;
  }
  if (isWinner) {
    return `🏆 Just won the "${challengeTitle}" challenge!\n\n💪 Challenge me on HydroMate!\n\n#HydroMate #Challenge #Winner`;
  }
  return `🎯 I'm participating in the "${challengeTitle}" challenge!\n\n💧 Join me on HydroMate!\n\n#HydroMate #Challenge #Hydration`;
};

// ============ STATS FOR SHARING ============

export interface SocialStats {
  totalFriends: number;
  activeChallenges: number;
  challengesWon: number;
  currentRank: number | null;
  weeklyIntake: number;
  currentStreak: number;
}

export const getSocialStats = async (): Promise<SocialStats> => {
  const [friends, activeChallenges, profile, rank] = await Promise.all([
    getFriends(),
    getActiveChallenges(),
    getSocialProfile(),
    getUserRank('weekly', 'intake'),
  ]);

  return {
    totalFriends: friends.filter(f => f.status === 'accepted').length,
    activeChallenges: activeChallenges.length,
    challengesWon: profile?.challengesWon || 0,
    currentRank: rank,
    weeklyIntake: profile?.totalWaterIntake || 0,
    currentStreak: profile?.currentStreak || 0,
  };
};

// ============ INITIALIZATION ============

export const initializeSocialFeatures = async (
  userName: string,
  displayName: string
): Promise<SocialProfile> => {
  let profile = await getSocialProfile();
  
  if (!profile) {
    profile = await createSocialProfile(userName, displayName);
  }

  // Initialize mock friends if none exist
  await getFriends();

  return profile;
};
