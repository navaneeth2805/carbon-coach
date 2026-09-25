import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { GlassCard } from '@/components/GlassCard';
import { CO2eBadge } from '@/components/CO2eBadge';
import { ConfidenceBadge, ConfidenceType } from '@/components/ConfidenceBadge';
import { useScanHistory } from '@/context/ScanHistoryContext';
import { useGamification } from '@/context/GamificationContext';
import { IngredientBreakdown } from '@/services/carbonEngine';
import { colors, typography, spacing, radius } from '@/theme/tokens';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { logMeal } = useScanHistory();
  const { recordMealLogged } = useGamification();

  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);

  // Parse parameters safely
  let dishName = (params.dishName as string) || 'Analyzed Meal';
  let dishId = (params.dishId as string) || 'custom_dish';
  let portionGrams = Number(params.portionGrams) || 350;
  let totalCo2e = Number(params.totalCo2e) || 1.25;
  let confidenceType = (params.confidenceType as ConfidenceType) || 'agreement';
  let confidence = Number(params.confidence) || 0.92;
  let imageUri = (params.imageUri as string) || '';
  let isFallback = params.isFallback === 'true';

  let breakdown: IngredientBreakdown[] = [];
  try {
    if (params.mealData) {
      const parsedMeal = JSON.parse(params.mealData as string);
      dishName = parsedMeal.dishName;
      dishId = parsedMeal.dishId;
      portionGrams = parsedMeal.portionGrams;
      totalCo2e = parsedMeal.totalCo2e;
      confidenceType = parsedMeal.confidenceType;
      confidence = parsedMeal.confidence;
      imageUri = parsedMeal.imageUri || '';
      breakdown = parsedMeal.breakdown || [];
    } else if (params.breakdownJson) {
      breakdown = JSON.parse(params.breakdownJson as string);
    }
  } catch (err) {
    console.warn('Failed to parse breakdown JSON in ResultScreen:', err);
  }

  const rating: 'low' | 'moderate' | 'high' =
    totalCo2e <= 1.0 ? 'low' : totalCo2e <= 2.5 ? 'moderate' : 'high';

  const ratingLabel =
    rating === 'low'
      ? 'Low Carbon Impact'
      : rating === 'moderate'
      ? 'Moderate Carbon Impact'
      : 'High Carbon Footprint';

  const ratingColor =
    rating === 'low'
      ? colors.impactLow
      : rating === 'moderate'
      ? colors.impactModerate
      : colors.impactHigh;

  const handleLogMeal = async () => {
    setIsLogging(true);
    try {
      await logMeal({
        dishId,
        dishName,
        portionGrams,
        totalCo2e,
        breakdown,
        confidenceType,
        confidence,
        imageUri,
        rating,
        source: isFallback ? 'Generic Category Model' : 'Poore & Nemecek Decomposition',
      });

      await recordMealLogged(totalCo2e, dishId);

      setLoggedSuccess(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1200);
    } catch (err) {
      console.error('Error logging meal:', err);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Impact Breakdown</Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.homeBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero CO2e Card */}
          <GlassCard variant="active" glow={rating === 'low' ? 'teal' : 'none'} style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <ConfidenceBadge type={confidenceType} confidence={confidence} />
              <View style={[styles.ratingTag, { borderColor: ratingColor, backgroundColor: `${ratingColor}15` }]}>
                <View style={[styles.ratingDot, { backgroundColor: ratingColor }]} />
                <Text style={[styles.ratingText, { color: ratingColor }]}>{ratingLabel}</Text>
              </View>
            </View>

            <Text style={styles.dishTitleText}>{dishName}</Text>
            <Text style={styles.portionSubText}>
              Estimated Portion: {portionGrams}g
            </Text>

            <View style={styles.heroBadgeBox}>
              <CO2eBadge value={totalCo2e} size="hero" />
            </View>

            {imageUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: imageUri }} style={styles.mealPhoto} />
              </View>
            ) : null}
          </GlassCard>

          {/* Ingredient Decomposition Breakdown */}
          <GlassCard style={styles.breakdownCard}>
            <View style={styles.breakdownHeaderRow}>
              <View>
                <Text style={styles.breakdownSectionTitle}>Emission Drivers</Text>
                <Text style={styles.breakdownSectionSub}>
                  Decomposition via Poore & Nemecek 2018 (OWID)
                </Text>
              </View>
              <Ionicons name="pie-chart-outline" size={22} color={colors.primaryTeal} />
            </View>

            {breakdown.length === 0 ? (
              <View style={styles.noBreakdownBox}>
                <Text style={styles.noBreakdownText}>
                  Breakdown calculated from composite category average ({totalCo2e} kg CO₂e).
                </Text>
              </View>
            ) : (
              <View style={styles.breakdownList}>
                {breakdown.map((item, idx) => {
                  const barColor =
                    item.share > 40
                      ? colors.impactHigh
                      : item.share > 20
                      ? colors.warning
                      : colors.primaryTeal;

                  return (
                    <View key={item.ingredient || idx} style={styles.ingredientRow}>
                      <View style={styles.ingredientTop}>
                        <View style={styles.ingredientNameCol}>
                          <Text style={styles.ingredientNameText}>
                            {item.displayName}
                          </Text>
                          <Text style={styles.ingredientGramsText}>
                            {item.grams}g • Factor: {item.factor} kgCO₂e/kg
                          </Text>
                        </View>
                        <View style={styles.ingredientValueCol}>
                          <Text style={styles.ingredientCo2eText}>
                            {item.co2e.toFixed(2)} kg
                          </Text>
                          <Text style={styles.ingredientShareText}>{item.share}%</Text>
                        </View>
                      </View>

                      {/* Progress Track */}
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.min(100, Math.max(4, item.share))}%`,
                              backgroundColor: barColor,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </GlassCard>

          {/* Action CTAs */}
          <View style={styles.ctaCol}>
            {/* See Alternatives CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/alternatives',
                  params: {
                    dishName,
                    co2e: String(totalCo2e),
                  },
                })
              }
              style={styles.alternativesBtn}
            >
              <View style={styles.altBtnLeft}>
                <Ionicons name="sparkles" size={18} color={colors.primaryTeal} />
                <Text style={styles.alternativesBtnText}>See Lower-Carbon Alternatives</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryTeal} />
            </TouchableOpacity>

            {/* Log This Meal CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogMeal}
              disabled={isLogging || loggedSuccess}
              style={[styles.logMealBtn, loggedSuccess && styles.logMealBtnSuccess]}
            >
              {isLogging ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : loggedSuccess ? (
                <View style={styles.loggedSuccessRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                  <Text style={styles.logMealBtnText}>Logged to Impact History!</Text>
                </View>
              ) : (
                <View style={styles.loggedSuccessRow}>
                  <Ionicons name="checkmark-outline" size={20} color={colors.textInverse} />
                  <Text style={styles.logMealBtnText}>Log This Meal & Build Streak</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
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
  homeBtn: {
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
  heroCard: {
    marginBottom: spacing.base,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 4,
  },
  ratingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ratingText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  dishTitleText: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  portionSubText: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroBadgeBox: {
    marginVertical: spacing.md,
  },
  photoContainer: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  mealPhoto: {
    width: '100%',
    height: 140,
  },
  breakdownCard: {
    marginBottom: spacing.base,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  breakdownSectionTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  breakdownSectionSub: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  noBreakdownBox: {
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.md,
  },
  noBreakdownText: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
  },
  breakdownList: {
    gap: spacing.md,
  },
  ingredientRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  ingredientTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ingredientNameCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  ingredientNameText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  ingredientGramsText: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  ingredientValueCol: {
    alignItems: 'flex-end',
  },
  ingredientCo2eText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  ingredientShareText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  ctaCol: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  alternativesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderWidth: 1.5,
    borderColor: colors.primaryTeal,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
  },
  altBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alternativesBtnText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.primaryTeal,
  },
  logMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTeal,
    paddingVertical: spacing.base,
    borderRadius: radius.card,
    shadowColor: colors.primaryTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  logMealBtnSuccess: {
    backgroundColor: colors.success,
  },
  loggedSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logMealBtnText: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.heavy,
    color: colors.textInverse,
  },
});
