import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { GlassCard } from '@/components/GlassCard';
import { CO2eBadge } from '@/components/CO2eBadge';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useUserProfile } from '@/context/UserProfileContext';
import { useScanHistory } from '@/context/ScanHistoryContext';
import { useGamification } from '@/context/GamificationContext';
import {
  getAlternatives,
  recordRecommendationFeedback,
  RecommendationAlternative,
} from '@/services/recommendationEngine';
import { colors, typography, spacing, radius } from '@/theme/tokens';

export default function AlternativesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile } = useUserProfile();
  const { logMeal } = useScanHistory();
  const { recordMealLogged } = useGamification();

  const originalDishName = (params.dishName as string) || 'Analyzed Meal';
  const originalCo2e = Number(params.co2e) || 2.5;

  const [alternatives, setAlternatives] = useState<RecommendationAlternative[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptedDishId, setAcceptedDishId] = useState<string | null>(null);

  const fetchAlternatives = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await getAlternatives(originalDishName, originalCo2e, profile, 4);
      setAlternatives(results);
    } catch (err: any) {
      console.error('Failed to load alternatives:', err);
      setError('Unable to compute alternative recommendations.');
    } finally {
      setIsLoading(false);
    }
  }, [originalDishName, originalCo2e, profile]);

  useEffect(() => {
    fetchAlternatives();
  }, [fetchAlternatives]);

  const handleAccept = async (alt: RecommendationAlternative) => {
    try {
      setAcceptedDishId(alt.dish.id);
      // Nudge weights
      await recordRecommendationFeedback(alt.dish.id, 'accept');

      // Log the swapped meal
      await logMeal({
        dishId: alt.dish.id,
        dishName: alt.dish.name,
        portionGrams: alt.dish.defaultPortionGrams,
        totalCo2e: alt.footprint.totalCo2e,
        breakdown: alt.footprint.breakdown,
        confidenceType: 'manual',
        confidence: 1.0,
        rating: alt.footprint.rating,
        source: `Low-Carbon Swap from ${originalDishName}`,
      });

      await recordMealLogged(alt.footprint.totalCo2e, alt.dish.id);

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (err) {
      console.error('Failed to accept swap:', err);
    }
  };

  const handleReject = async (dishId: string) => {
    try {
      await recordRecommendationFeedback(dishId, 'reject');
      setAlternatives(prev => prev.filter(a => a.dish.id !== dishId));
    } catch (err) {
      console.error('Failed to reject swap:', err);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Low-Carbon Alternatives</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Original Context Banner */}
          <GlassCard style={styles.contextBanner}>
            <View style={styles.contextRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contextLabel}>Original Meal</Text>
                <Text style={styles.contextDishName}>{originalDishName}</Text>
              </View>
              <CO2eBadge value={originalCo2e} size="sm" />
            </View>
          </GlassCard>

          {/* Render States */}
          {isLoading ? (
            <LoadingState
              message="Finding scientifically lower-carbon swaps..."
              subMessage="Applying dietary constraints and preference weighting"
            />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchAlternatives} />
          ) : alternatives.length === 0 ? (
            <EmptyState
              icon="leaf-outline"
              title="No Lower-Carbon Swaps Needed"
              description={`"${originalDishName}" is already an ultra-low carbon choice (${originalCo2e} kg CO₂e) under your current dietary preferences.`}
              actionLabel="Return to Home"
              onAction={() => router.replace('/(tabs)')}
            />
          ) : (
            <View style={styles.cardList}>
              <Text style={styles.sectionHeading}>
                Ranked Climate Swaps ({alternatives.length})
              </Text>

              {alternatives.map((alt, index) => {
                const isAccepted = acceptedDishId === alt.dish.id;

                return (
                  <GlassCard
                    key={alt.dish.id || index}
                    variant={isAccepted ? 'active' : 'default'}
                    glow={index === 0 ? 'teal' : 'none'}
                    style={styles.altCard}
                  >
                    {/* Top row */}
                    <View style={styles.altTopRow}>
                      <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <View style={styles.badgeRow}>
                          <View style={styles.rankPill}>
                            <Text style={styles.rankText}>#{index + 1} Best Match</Text>
                          </View>
                          <View style={styles.dietPill}>
                            <Text style={styles.dietText}>{alt.dish.diet.replace('_', ' ')}</Text>
                          </View>
                        </View>
                        <Text style={styles.altDishName}>{alt.dish.name}</Text>
                      </View>
                      <CO2eBadge value={alt.footprint.totalCo2e} size="md" />
                    </View>

                    {/* Savings Banner */}
                    <View style={styles.savingsBanner}>
                      <Ionicons name="trending-down" size={16} color={colors.success} />
                      <Text style={styles.savingsText}>
                        Saves {alt.co2eSavings} kg CO₂e ({alt.percentageReduction}% reduction)
                      </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.dishDescription}>{alt.dish.description}</Text>

                    {/* Explainability Tags */}
                    <View style={styles.reasonsRow}>
                      {alt.matchReasons.map((reason, rIdx) => (
                        <View key={rIdx} style={styles.reasonTag}>
                          <Ionicons name="checkmark-sharp" size={12} color={colors.primaryTeal} />
                          <Text style={styles.reasonTagText}>{reason}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Actions */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleReject(alt.dish.id)}
                        style={styles.dismissBtn}
                      >
                        <Text style={styles.dismissBtnText}>Not for me</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleAccept(alt)}
                        disabled={isAccepted}
                        style={[styles.acceptBtn, isAccepted && styles.acceptBtnDone]}
                      >
                        <Ionicons
                          name={isAccepted ? 'checkmark-circle' : 'swap-horizontal'}
                          size={16}
                          color={colors.textInverse}
                        />
                        <Text style={styles.acceptBtnText}>
                          {isAccepted ? 'Logged as Swap!' : 'Accept & Log Swap'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                );
              })}
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 1.5,
  },
  contextBanner: {
    marginBottom: spacing.base,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextLabel: {
    fontSize: typography.sizes.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contextDishName: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  cardList: {
    gap: spacing.base,
  },
  sectionHeading: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  altCard: {
    marginBottom: spacing.sm,
  },
  altTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  rankPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderRadius: radius.full,
  },
  rankText: {
    fontSize: typography.sizes.micro,
    color: colors.primaryTeal,
    fontWeight: typography.weights.bold,
  },
  dietPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.full,
  },
  dietText: {
    fontSize: typography.sizes.micro,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  altDishName: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: radius.sm,
    gap: 6,
    marginBottom: spacing.sm,
  },
  savingsText: {
    fontSize: typography.sizes.caption,
    color: colors.success,
    fontWeight: typography.weights.bold,
  },
  dishDescription: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.callout,
    marginBottom: spacing.sm,
  },
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.base,
  },
  reasonTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 4,
  },
  reasonTagText: {
    fontSize: typography.sizes.caption - 1,
    color: colors.textPrimary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: spacing.md,
  },
  dismissBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dismissBtnText: {
    fontSize: typography.sizes.callout,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTeal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    gap: 6,
  },
  acceptBtnDone: {
    backgroundColor: colors.success,
  },
  acceptBtnText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
});
