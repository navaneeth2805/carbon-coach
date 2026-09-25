/**
 * Community & Leaderboard Seed Data
 * (Mock / Demo dataset clearly labeled for hackathon showcase)
 */

export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatarInitials: string;
  avatarBg: string;
  co2eSavedKg: number;
  streakDays: number;
  badgeTitle: string;
  isCurrentUser?: boolean;
}

export interface CommunityActivity {
  id: string;
  userName: string;
  userAvatar: string;
  dishName: string;
  dishCo2e: number;
  swapMade: string;
  savedCo2e: number;
  timeAgo: string;
  likes: number;
}

export const DEMO_LEADERBOARD: LeaderboardUser[] = [
  {
    id: 'user_1',
    rank: 1,
    name: 'Aarav Sharma',
    avatarInitials: 'AS',
    avatarBg: '#2DD4BF',
    co2eSavedKg: 28.4,
    streakDays: 19,
    badgeTitle: 'Net Zero Champion',
  },
  {
    id: 'user_2',
    rank: 2,
    name: 'Priya Iyer',
    avatarInitials: 'PI',
    avatarBg: '#3B82F6',
    co2eSavedKg: 24.1,
    streakDays: 14,
    badgeTitle: 'Plant Vanguard',
  },
  {
    id: 'user_3',
    rank: 3,
    name: 'Rohan Mehta',
    avatarInitials: 'RM',
    avatarBg: '#8B5CF6',
    co2eSavedKg: 19.8,
    streakDays: 11,
    badgeTitle: 'Climate Scout',
  },
  {
    id: 'user_4',
    rank: 4,
    name: 'Ananya Verma',
    avatarInitials: 'AV',
    avatarBg: '#EC4899',
    co2eSavedKg: 15.6,
    streakDays: 8,
    badgeTitle: 'Eco Ally',
  },
  {
    id: 'user_5',
    rank: 5,
    name: 'Kavita Nair',
    avatarInitials: 'KN',
    avatarBg: '#10B981',
    co2eSavedKg: 12.2,
    streakDays: 6,
    badgeTitle: 'Sprout Pioneer',
  },
];

export const DEMO_COMMUNITY_FEED: CommunityActivity[] = [
  {
    id: 'feed_1',
    userName: 'Priya Iyer',
    userAvatar: 'PI',
    dishName: 'Chana Masala',
    dishCo2e: 0.48,
    swapMade: 'Swapped Butter Chicken for Chana Masala',
    savedCo2e: 1.84,
    timeAgo: '15m ago',
    likes: 8,
  },
  {
    id: 'feed_2',
    userName: 'Aarav Sharma',
    userAvatar: 'AS',
    dishName: 'Tofu Tikka Masala',
    dishCo2e: 0.62,
    swapMade: 'Swapped Paneer Butter Masala for Tofu Tikka',
    savedCo2e: 1.95,
    timeAgo: '42m ago',
    likes: 14,
  },
  {
    id: 'feed_3',
    userName: 'Rohan Mehta',
    userAvatar: 'RM',
    dishName: 'Moong Dal Khichdi',
    dishCo2e: 0.38,
    swapMade: 'Comfort meal zero-ghee swap',
    savedCo2e: 0.92,
    timeAgo: '2h ago',
    likes: 5,
  },
];
