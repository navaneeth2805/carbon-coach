import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { GlassCard } from '@/components/GlassCard';
import { ProgressRing } from '@/components/ProgressRing';
import { CO2eBadge } from '@/components/CO2eBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { useUserProfile } from '@/context/UserProfileContext';
import { useScanHistory } from '@/context/ScanHistoryContext';
import { useGamification } from '@/context/GamificationContext';
import { getAlternatives, RecommendationAlternative } from '@/services/recommendationEngine';
import { colors, typography, spacing, radius } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, isLoading: isProfileLoading, error: profileError } = useUserProfile();
  const {
    recentMeal,
    todayTotalCo2e,
    todayMeals,
    isLoading: isHistoryLoading,
    error: historyError,
    reloadHistory,
  } = useScanHistory();
  const { state: gamification, activeStreak, isLoading: isGamificationLoading } = useGamification();

  const [teaserRecommendations, setTeaserRecommendations] = useState<RecommendationAlternative[]>([]);
  const [isTeasersLoading, setIsTeasersLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // First launch onboarding check
  useEffect(() => {
    if (!isProfileLoading && !profile.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isProfileLoading, profile.onboardingCompleted]);

  const fetchTeasers = useCallback(async () => {
    if (!recentMeal) {
      setTeaserRecommendations([]);
      return;
    }
    setIsTeasersLoading(true);
    try {
      const results = await getAlternatives(
        recentMeal.dishName,
        recentMeal.totalCo2e,
        profile,
        2
      );
      setTeaserRecommendations(results);
    } catch (err) {
      console.warn('Failed to fetch teaser recommendations:', err);
      setTeaserRecommendations([]);
    } finally {
      setIsTeasersLoading(false);
    }
  }, [recentMeal, profile]);

  // Load teaser recommendations whenever recent meal changes
  useEffect(() => {
    fetchTeasers();
  }, [fetchTeasers]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadHistory();
      if (recentMeal) {
        await fetchTeasers();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const dailyBudget = profile.dailyCarbonBudget || 3.5;
  const progressRatio = dailyBudget > 0 ? todayTotalCo2e / dailyBudget : 0;
  const remainingBudget = Math.max(0, Number((dailyBudget - todayTotalCo2e).toFixed(2)));

  // Global loading state on initial cold start
  if (isProfileLoading && !profile.onboardingCompleted) {
    return (
      <GradientBackground>
        <LoadingState fullscreen message="Initializing CarbonIQ..." />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryTeal}
            />
          }
        >
          {/* Header Profile Greeting */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.profileBadge}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {profile.name
                    ? profile.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'CP'}
                </Text>
              </View>
              <View style={styles.greetingTextCol}>
                <Text style={styles.greetingSub}>{greeting},</Text>
                <Text style={styles.greetingName}>{profile.name || 'Eco Pioneer'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/scan')}
              style={styles.headerScanBtn}
            >
              <Ionicons name="camera" size={18} color={colors.textInverse} />
            </TouchableOpacity>
          </View>

          {/* Quick Scan Hero Card */}
          <GlassCard variant="active" glow="teal" style={styles.quickScanCard}>
            <View style={styles.quickScanContent}>
              <View style={styles.quickScanTextCol}>
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTagText}>AI DUAL-DETECTOR READY</Text>
                </View>
                <Text style={styles.quickScanTitle}>Photograph Your Meal</Text>
                <Text style={styles.quickScanDesc}>
                  Instant food identification & Poore-Nemecek carbon footprint decomposition.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/scan')}
                style={styles.scanCtaButton}
              >
                <Ionicons name="scan-outline" size={20} color={colors.textInverse} />
                <Text style={styles.scanCtaText}>Scan Now</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Streak Card */}
          <GlassCard
            glow={activeStreak ? 'teal' : 'none'}
            style={[styles.streakCard, activeStreak && styles.streakCardActive]}
          >
            <View style={styles.streakRow}>
              <View
                style={[
                  styles.streakIconCircle,
                  activeStreak && styles.streakIconCircleActive,
                ]}
              >
                <Ionicons
                  name={activeStreak ? 'flame' : 'flame-outline'}
                  size={24}
                  color={activeStreak ? colors.primaryTeal : colors.textMuted}
                />
              </View>
              <View style={styles.streakTextCol}>
                <View style={styles.streakCountRow}>
                  <Text style={styles.streakCountNumber}>
                    {gamification.streakCount}
                  </Text>
                  <Text style={styles.streakCountUnit}>
                    {gamification.streakCount === 1 ? 'Day Streak' : 'Days Streak'}
                  </Text>
                </View>
                <Text style={styles.streakSub}>
                  {activeStreak
                    ? 'Streak active! Log today to keep your streak burning.'
                    : 'Log a meal today to ignite your daily habit streak.'}
                </Text>
              </View>
              <View style={styles.badgePill}>
                <Ionicons name="leaf-outline" size={13} color={colors.primaryTeal} />
                <Text style={styles.badgePillText}>{gamification.totalCo2eSaved} kg saved</Text>
              </View>
            </View>
          </GlassCard>

          {/* Today's Impact Card (Progress Ring) */}
          <GlassCard style={styles.impactCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>Today's Carbon Budget</Text>
              <View style={styles.budgetPill}>
                <Text style={styles.budgetPillText}>Limit: {dailyBudget} kg</Text>
              </View>
            </View>

            <View style={styles.impactBody}>
              <ProgressRing
                progress={progressRatio}
                size={140}
                strokeWidth={11}
                label={`${todayTotalCo2e}`}
                subLabel="kg CO₂e"
              />

              <View style={styles.impactStatsCol}>
                <View style={styles.impactStatItem}>
                  <Text style={styles.statLabel}>Remaining Today</Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: remainingBudget > 0 ? colors.primaryTeal : colors.error },
                    ]}
                  >
                    {remainingBudget} kg
                  </Text>
                </View>

                <View style={styles.impactStatItem}>
                  <Text style={styles.statLabel}>Meals Logged</Text>
                  <Text style={styles.statValue}>{todayMeals.length} meals</Text>
                </View>

                <View style={styles.impactStatItem}>
                  <Text style={styles.statLabel}>Budget Status</Text>
                  <Text
                    style={[
                      styles.statValueStatus,
                      { color: progressRatio <= 1 ? colors.success : colors.error },
                    ]}
                  >
                    {progressRatio <= 0.7
                      ? 'Optimal'
                      : progressRatio <= 1.0
                      ? 'On Track'
                      : 'Exceeded'}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>

          {/* Recent Scan Card */}
          <GlassCard style={styles.recentScanCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>Latest Meal Scan</Text>
              {recentMeal ? (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/result',
                      params: { mealData: JSON.stringify(recentMeal) },
                    })
                  }
                >
                  <Text style={styles.viewDetailsLink}>View Breakdown ›</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {isHistoryLoading ? (
              <LoadingState message="Retrieving recent meal..." />
            ) : historyError ? (
              <ErrorState message={historyError} onRetry={reloadHistory} />
            ) : recentMeal ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/result',
                    params: { mealData: JSON.stringify(recentMeal) },
                  })
                }
                style={styles.recentMealRow}
              >
                {recentMeal.imageUri ? (
                  <Image
                    source={{ uri: recentMeal.imageUri }}
                    style={styles.mealThumb}
                  />
                ) : (
                  <View style={styles.mealThumbPlaceholder}>
                    <Ionicons name="restaurant" size={26} color={colors.primaryTeal} />
                  </View>
                )}

                <View style={styles.recentMealDetails}>
                  <Text style={styles.recentMealName} numberOfLines={1}>
                    {recentMeal.dishName}
                  </Text>
                  <Text style={styles.recentMealPortion}>
                    Portion: {recentMeal.portionGrams}g • {recentMeal.breakdown?.length || 0} ingredients
                  </Text>
                  <CO2eBadge
                    value={recentMeal.totalCo2e}
                    size="sm"
                    style={styles.recentMealBadge}
                  />
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                  style={styles.recentChevron}
                />
              </TouchableOpacity>
            ) : (
              <EmptyState
                compact
                icon="camera-outline"
                title="No Meals Logged Yet"
                description="Snap a picture of your breakfast, lunch, or dinner to calculate its real carbon footprint."
                actionLabel="Scan Your First Meal"
                onAction={() => router.push('/(tabs)/scan')}
              />
            )}
          </GlassCard>

          {/* Recommendations Teaser Card */}
          {recentMeal ? (
            <GlassCard style={styles.recommendationsCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Lower-Carbon Swaps</Text>
                {teaserRecommendations.length > 0 ? (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/alternatives',
                        params: {
                          dishName: recentMeal.dishName,
                          co2e: String(recentMeal.totalCo2e),
                        },
                      })
                    }
                  >
                    <Text style={styles.viewDetailsLink}>See All ›</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {isTeasersLoading ? (
                <LoadingState message="Generating personalized swaps..." />
              ) : teaserRecommendations.length > 0 ? (
                <View style={styles.teaserList}>
                  {teaserRecommendations.map((alt, index) => (
                    <TouchableOpacity
                      key={alt.dish.id || index}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/alternatives',
                          params: {
                            dishName: recentMeal.dishName,
                            co2e: String(recentMeal.totalCo2e),
                          },
                        })
                      }
                      style={styles.teaserItem}
                    >
                      <View style={styles.teaserLeft}>
                        <View style={styles.swapArrowCircle}>
                          <Ionicons name="repeat" size={16} color={colors.primaryTeal} />
                        </View>
                        <View style={styles.teaserTextCol}>
                          <Text style={styles.teaserDishName}>{alt.dish.name}</Text>
                          <Text style={styles.teaserReason}>
                            {alt.matchReasons[0] || `Saves ${alt.percentageReduction}% emissions`}
                          </Text>
                        </View>
                      </View>
                      <CO2eBadge value={alt.footprint.totalCo2e} size="sm" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.teaserEmptyBox}>
                  <Text style={styles.teaserEmptyText}>
                    Your recent meal is already an ultra-low carbon choice!
                  </Text>
                </View>
              )}
            </GlassCard>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 1.8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  avatarText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.heavy,
    color: colors.primaryTeal,
  },
  greetingTextCol: {},
  greetingSub: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  greetingName: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerScanBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  quickScanCard: {
    marginBottom: spacing.base,
  },
  quickScanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickScanTextCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryTeal,
    marginRight: 6,
  },
  liveTagText: {
    fontSize: typography.sizes.micro,
    color: colors.primaryTeal,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  quickScanTitle: {
    fontSize: typography.sizes.h2 - 2,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickScanDesc: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.caption + 2,
  },
  scanCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTeal,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: 6,
  },
  scanCtaText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  streakCard: {
    marginBottom: spacing.base,
  },
  streakCardActive: {
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  streakIconCircleActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  streakTextCol: {
    flex: 1,
  },
  streakCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  streakCountNumber: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.heavy,
    color: colors.primaryTeal,
  },
  streakCountUnit: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  streakSub: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
    gap: 4,
  },
  badgePillText: {
    fontSize: typography.sizes.micro,
    color: colors.primaryTeal,
    fontWeight: typography.weights.semibold,
  },
  impactCard: {
    marginBottom: spacing.base,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  budgetPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  budgetPillText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  impactBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
  },
  impactStatsCol: {
    gap: spacing.sm + 2,
  },
  impactStatItem: {},
  statLabel: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginBottom: 1,
  },
  statValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statValueStatus: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.heavy,
  },
  recentScanCard: {
    marginBottom: spacing.base,
  },
  viewDetailsLink: {
    fontSize: typography.sizes.callout,
    color: colors.primaryTeal,
    fontWeight: typography.weights.semibold,
  },
  recentMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mealThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    marginRight: spacing.md,
  },
  mealThumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.2)',
  },
  recentMealDetails: {
    flex: 1,
  },
  recentMealName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  recentMealPortion: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginVertical: 3,
  },
  recentMealBadge: {
    alignSelf: 'flex-start',
  },
  recentChevron: {
    marginLeft: spacing.sm,
  },
  recommendationsCard: {
    marginBottom: spacing.base,
  },
  teaserList: {
    gap: spacing.sm,
  },
  teaserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  teaserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  swapArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  teaserTextCol: {
    flex: 1,
  },
  teaserDishName: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  teaserReason: {
    fontSize: typography.sizes.caption,
    color: colors.primaryTeal,
    marginTop: 2,
  },
  teaserEmptyBox: {
    padding: spacing.md,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  teaserEmptyText: {
    fontSize: typography.sizes.callout,
    color: colors.success,
    textAlign: 'center',
  },
});
