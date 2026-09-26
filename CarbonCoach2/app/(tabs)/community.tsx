import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { GlassCard } from '@/components/GlassCard';
import { useUserProfile } from '@/context/UserProfileContext';
import { useGamification } from '@/context/GamificationContext';
import { DEMO_LEADERBOARD, DEMO_COMMUNITY_FEED, LeaderboardUser } from '@/data/communityData';
import { colors, typography, spacing, radius } from '@/theme/tokens';

export default function CommunityScreen() {
  const { profile } = useUserProfile();
  const { state: gamification } = useGamification();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'feed'>('leaderboard');
  const [feedItems, setFeedItems] = useState(DEMO_COMMUNITY_FEED);

  const handleLike = (id: string) => {
    setFeedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, likes: item.likes + 1 } : item))
    );
  };

  // Merge current user with demo leaderboard
  const currentUserEntry: LeaderboardUser = {
    id: 'current_user',
    rank: 4,
    name: `${profile.name || 'You'} (You)`,
    avatarInitials: profile.name
      ? profile.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'YOU',
    avatarBg: colors.primaryTeal,
    co2eSavedKg: gamification.totalCo2eSaved || 1.8,
    streakDays: gamification.streakCount || 1,
    badgeTitle: gamification.streakCount >= 7 ? 'Climate Warrior' : 'Eco Habit Builder',
    isCurrentUser: true,
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community & Ranks</Text>
          <Text style={styles.headerSub}>Together cutting metric tons of dietary carbon</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'leaderboard' && styles.switchTabActive]}
            onPress={() => setActiveTab('leaderboard')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trophy-outline"
              size={16}
              color={activeTab === 'leaderboard' ? colors.textInverse : colors.textSecondary}
            />
            <Text
              style={[
                styles.switchTabText,
                activeTab === 'leaderboard' && styles.switchTabTextActive,
              ]}
            >
              Leaderboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'feed' && styles.switchTabActive]}
            onPress={() => setActiveTab('feed')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="swap-horizontal"
              size={16}
              color={activeTab === 'feed' ? colors.textInverse : colors.textSecondary}
            />
            <Text
              style={[
                styles.switchTabText,
                activeTab === 'feed' && styles.switchTabTextActive,
              ]}
            >
              Peer Swaps Feed
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'leaderboard' ? (
            <View style={styles.leaderboardContainer}>
              {/* Top 3 Podium Highlights */}
              <View style={styles.podiumRow}>
                {/* #2 */}
                <View style={[styles.podiumCol, { marginTop: 20 }]}>
                  <View style={[styles.podiumAvatar, { borderColor: '#94A3B8' }]}>
                    <Text style={styles.podiumAvatarText}>{DEMO_LEADERBOARD[1].avatarInitials}</Text>
                  </View>
                  <Text style={styles.podiumRank}>#2</Text>
                  <Text style={styles.podiumName} numberOfLines={1}>{DEMO_LEADERBOARD[1].name}</Text>
                  <Text style={styles.podiumKg}>{DEMO_LEADERBOARD[1].co2eSavedKg} kg</Text>
                </View>

                {/* #1 Champion */}
                <View style={styles.podiumCol}>
                  <View style={[styles.podiumAvatar, styles.championAvatar]}>
                    <Ionicons name="ribbon" size={16} color="#FBBF24" style={styles.crownIcon} />
                    <Text style={styles.podiumAvatarText}>{DEMO_LEADERBOARD[0].avatarInitials}</Text>
                  </View>
                  <Text style={[styles.podiumRank, { color: '#FBBF24' }]}>#1</Text>
                  <Text style={styles.podiumName} numberOfLines={1}>{DEMO_LEADERBOARD[0].name}</Text>
                  <Text style={[styles.podiumKg, { color: colors.primaryTeal }]}>
                    {DEMO_LEADERBOARD[0].co2eSavedKg} kg
                  </Text>
                </View>

                {/* #3 */}
                <View style={[styles.podiumCol, { marginTop: 30 }]}>
                  <View style={[styles.podiumAvatar, { borderColor: '#B45309' }]}>
                    <Text style={styles.podiumAvatarText}>{DEMO_LEADERBOARD[2].avatarInitials}</Text>
                  </View>
                  <Text style={styles.podiumRank}>#3</Text>
                  <Text style={styles.podiumName} numberOfLines={1}>{DEMO_LEADERBOARD[2].name}</Text>
                  <Text style={styles.podiumKg}>{DEMO_LEADERBOARD[2].co2eSavedKg} kg</Text>
                </View>
              </View>

              {/* Current User Fixed Card */}
              <GlassCard variant="active" glow="teal" style={styles.userHighlightCard}>
                <View style={styles.userHighlightRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>YOU</Text>
                  </View>
                  <View style={styles.userInfoCol}>
                    <Text style={styles.userName}>{currentUserEntry.name}</Text>
                    <Text style={styles.userBadgeTitle}>
                      {currentUserEntry.badgeTitle} • {currentUserEntry.streakDays} day streak
                    </Text>
                  </View>
                  <View style={styles.userKgCol}>
                    <Text style={styles.userKgValue}>{currentUserEntry.co2eSavedKg} kg</Text>
                    <Text style={styles.userKgLabel}>CO₂e saved</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Full Leaderboard List */}
              <Text style={styles.listHeaderTitle}>Community Rankings</Text>
              <View style={styles.leaderboardList}>
                {DEMO_LEADERBOARD.map(user => (
                  <GlassCard key={user.id} style={styles.leaderboardItem}>
                    <View style={styles.itemRow}>
                      <Text style={styles.itemRank}>#{user.rank}</Text>
                      <View style={[styles.itemAvatar, { backgroundColor: user.avatarBg }]}>
                        <Text style={styles.itemAvatarText}>{user.avatarInitials}</Text>
                      </View>
                      <View style={styles.itemTextCol}>
                        <Text style={styles.itemName}>{user.name}</Text>
                        <Text style={styles.itemBadgeTitle}>
                          {user.badgeTitle} • {user.streakDays}d streak
                        </Text>
                      </View>
                      <View style={styles.itemKgCol}>
                        <Text style={styles.itemKgValue}>{user.co2eSavedKg} kg</Text>
                        <Text style={styles.itemKgLabel}>saved</Text>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </View>
            </View>
          ) : (
            /* Peer Swaps Feed */
            <View style={styles.feedContainer}>
              {feedItems.map(item => (
                <GlassCard key={item.id} style={styles.feedCard}>
                  <View style={styles.feedHeaderRow}>
                    <View style={styles.feedUserRow}>
                      <View style={styles.feedAvatar}>
                        <Text style={styles.feedAvatarText}>{item.userAvatar}</Text>
                      </View>
                      <View>
                        <Text style={styles.feedUserName}>{item.userName}</Text>
                        <Text style={styles.feedTimeAgo}>{item.timeAgo}</Text>
                      </View>
                    </View>
                    <View style={styles.feedSavedPill}>
                      <Ionicons name="leaf" size={13} color={colors.success} />
                      <Text style={styles.feedSavedText}>-{item.savedCo2e} kg</Text>
                    </View>
                  </View>

                  <View style={styles.feedBodyBox}>
                    <Text style={styles.feedSwapText}>{item.swapMade}</Text>
                    <Text style={styles.feedMealText}>
                      Enjoyed {item.dishName} at just {item.dishCo2e} kg CO₂e!
                    </Text>
                  </View>

                  <View style={styles.feedFooterRow}>
                    <TouchableOpacity
                      onPress={() => handleLike(item.id)}
                      style={styles.likeBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="heart" size={16} color={colors.primaryTeal} />
                      <Text style={styles.likeCountText}>{item.likes} cheers</Text>
                    </TouchableOpacity>
                    <View style={styles.communityVerifiedRow}>
                      <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.verifiedText}>Verified by CarbonCoach</Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: 6,
  },
  switchTabActive: {
    backgroundColor: colors.primaryTeal,
  },
  switchTabText: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  switchTabTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 1.5,
  },
  leaderboardContainer: {},
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  podiumCol: {
    alignItems: 'center',
    width: 90,
  },
  podiumAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  championAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderColor: '#FBBF24',
    borderWidth: 2.5,
  },
  crownIcon: {
    position: 'absolute',
    top: -12,
  },
  podiumAvatarText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  podiumRank: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.heavy,
    color: colors.textSecondary,
    marginTop: 6,
  },
  podiumName: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 2,
    textAlign: 'center',
  },
  podiumKg: {
    fontSize: typography.sizes.micro,
    color: colors.textSecondary,
  },
  userHighlightCard: {
    marginBottom: spacing.lg,
  },
  userHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: colors.primaryTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginRight: spacing.md,
  },
  rankBadgeText: {
    fontSize: typography.sizes.micro,
    fontWeight: typography.weights.heavy,
    color: colors.textInverse,
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  userBadgeTitle: {
    fontSize: typography.sizes.caption,
    color: colors.primaryTeal,
    marginTop: 1,
  },
  userKgCol: {
    alignItems: 'flex-end',
  },
  userKgValue: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.heavy,
    color: colors.primaryTeal,
  },
  userKgLabel: {
    fontSize: typography.sizes.micro,
    color: colors.textMuted,
  },
  listHeaderTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  leaderboardList: {
    gap: spacing.sm,
  },
  leaderboardItem: {
    paddingVertical: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRank: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    width: 28,
  },
  itemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemAvatarText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  itemTextCol: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  itemBadgeTitle: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemKgCol: {
    alignItems: 'flex-end',
  },
  itemKgValue: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.primaryTeal,
  },
  itemKgLabel: {
    fontSize: typography.sizes.micro,
    color: colors.textMuted,
  },
  feedContainer: {
    gap: spacing.base,
  },
  feedCard: {
    padding: spacing.base,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  feedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  feedAvatarText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.primaryTeal,
  },
  feedUserName: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  feedTimeAgo: {
    fontSize: typography.sizes.micro,
    color: colors.textMuted,
  },
  feedSavedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: radius.full,
    gap: 4,
  },
  feedSavedText: {
    fontSize: typography.sizes.caption,
    color: colors.success,
    fontWeight: typography.weights.bold,
  },
  feedBodyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  feedSwapText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.primaryTeal,
    marginBottom: 2,
  },
  feedMealText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  feedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: spacing.xs + 2,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCountText: {
    fontSize: typography.sizes.caption,
    color: colors.primaryTeal,
    fontWeight: typography.weights.semibold,
  },
  communityVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: typography.sizes.micro,
    color: colors.textMuted,
  },
});
