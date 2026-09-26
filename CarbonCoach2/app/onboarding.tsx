import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { GlassCard } from '@/components/GlassCard';
import { useUserProfile } from '@/context/UserProfileContext';
import { colors, typography, spacing, radius } from '@/theme/tokens';
import { DietType, SpiceLevel, BudgetLevel } from '@/data/dishIngredients';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, profile } = useUserProfile();

  const [diet, setDiet] = useState<DietType>(profile.diet || 'vegetarian');
  const [allergies, setAllergies] = useState<string[]>(profile.allergies || []);
  const [spicePreference, setSpicePreference] = useState<SpiceLevel>(
    profile.spicePreference || 'medium'
  );
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>(
    profile.budgetLevel || 'medium'
  );
  const [primaryGoal, setPrimaryGoal] = useState<'reduce_footprint' | 'save_money' | 'health'>(
    profile.primaryGoal || 'reduce_footprint'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleAllergy = (item: string) => {
    if (allergies.includes(item)) {
      setAllergies(allergies.filter(a => a !== item));
    } else {
      setAllergies([...allergies, item]);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const success = await completeOnboarding({
        diet,
        allergies,
        spicePreference,
        budgetLevel,
        primaryGoal,
      });

      if (success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage('Failed to save your preferences. Please try again.');
      }
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.logoPill}>
                <Ionicons name="leaf" size={14} color={colors.primaryTeal} />
                <Text style={styles.logoPillText}>CARBON COACH SETUP</Text>
              </View>
            </View>
            <Text style={styles.title}>Personalize Your Plate</Text>
            <Text style={styles.subtitle}>
              Configure your dietary profile so our on-device engine tailors footprint estimates and low-carbon recommendations accurately.
            </Text>
          </View>

          {errorMessage ? (
            <GlassCard variant="active" style={styles.errorNotice}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorNoticeText}>{errorMessage}</Text>
            </GlassCard>
          ) : null}

          {/* Section 1: Diet Type */}
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Dietary Preference</Text>
            <Text style={styles.sectionSubtitle}>Applied as hard filters for swaps</Text>
            <View style={styles.chipsWrap}>
              {(
                [
                  { id: 'vegetarian', label: 'Vegetarian', icon: 'nutrition-outline' },
                  { id: 'vegan', label: 'Vegan (Strict Plant)', icon: 'leaf-outline' },
                  { id: 'non_vegetarian', label: 'Non-Vegetarian', icon: 'restaurant-outline' },
                  { id: 'pescatarian', label: 'Pescatarian', icon: 'fish-outline' },
                ] as const
              ).map(item => {
                const isSelected = diet === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setDiet(item.id)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={16}
                      color={isSelected ? colors.textInverse : colors.primaryTeal}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          {/* Section 2: Allergies */}
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. Allergens to Exclude</Text>
            <Text style={styles.sectionSubtitle}>Filtered strictly from alternatives</Text>
            <View style={styles.chipsWrap}>
              {[
                { id: 'dairy', label: 'Dairy (Milk/Ghee/Butter)' },
                { id: 'gluten', label: 'Gluten / Wheat' },
                { id: 'nuts', label: 'Tree Nuts & Cashews' },
                { id: 'eggs', label: 'Eggs' },
              ].map(item => {
                const isSelected = allergies.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleAllergy(item.id)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'remove-circle-outline'}
                      size={15}
                      color={isSelected ? colors.textInverse : colors.textMuted}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          {/* Section 3: Spice Preference */}
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. Preferred Spice Level</Text>
            <Text style={styles.sectionSubtitle}>Used for soft similarity scoring</Text>
            <View style={styles.chipsWrap}>
              {(
                [
                  { id: 'mild', label: 'Mild (Low Heat)', icon: 'flame-outline' },
                  { id: 'medium', label: 'Medium (Balanced)', icon: 'flame' },
                  { id: 'spicy', label: 'Spicy (Fiery)', icon: 'flash' },
                ] as const
              ).map(item => {
                const isSelected = spicePreference === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSpicePreference(item.id)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={15}
                      color={isSelected ? colors.textInverse : colors.primaryTeal}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          {/* Section 4: Budget Level */}
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>4. Typical Budget Level</Text>
            <Text style={styles.sectionSubtitle}>Weights suggestions by price range</Text>
            <View style={styles.chipsWrap}>
              {(
                [
                  { id: 'budget', label: 'Budget-Friendly ($)' },
                  { id: 'medium', label: 'Moderate ($$)' },
                  { id: 'premium', label: 'Premium / Dining ($$$)' },
                ] as const
              ).map(item => {
                const isSelected = budgetLevel === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setBudgetLevel(item.id)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          {/* Section 5: Primary Goal */}
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>5. Primary Objective</Text>
            <Text style={styles.sectionSubtitle}>Customizes coach tips and priority weighting</Text>
            <View style={styles.verticalOptions}>
              {(
                [
                  {
                    id: 'reduce_footprint',
                    title: 'Slash Carbon Footprint',
                    desc: 'Maximize kg CO₂e savings across every meal',
                    icon: 'planet-outline',
                  },
                  {
                    id: 'save_money',
                    title: 'Save Money on Groceries & Dining',
                    desc: 'Prioritize affordable plant-based staples',
                    icon: 'wallet-outline',
                  },
                  {
                    id: 'health',
                    title: 'Improve Whole-Food Health',
                    desc: 'Favor nutrient-dense legumes and clean veggies',
                    icon: 'heart-outline',
                  },
                ] as const
              ).map(item => {
                const isSelected = primaryGoal === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setPrimaryGoal(item.id)}
                    style={[styles.goalOption, isSelected && styles.goalOptionActive]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.goalIconCircle, isSelected && styles.goalIconCircleActive]}>
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={isSelected ? colors.textInverse : colors.primaryTeal}
                      />
                    </View>
                    <View style={styles.goalTextCol}>
                      <Text style={[styles.goalTitle, isSelected && styles.goalTitleActive]}>
                        {item.title}
                      </Text>
                      <Text style={styles.goalDesc}>{item.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>

          {/* Submit Action */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleFinish}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Initialize CarbonCoach</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.textInverse} style={styles.btnIcon} />
              </>
            )}
          </TouchableOpacity>
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
    paddingBottom: spacing.xxxl * 1.5,
  },
  header: {
    marginVertical: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  logoPillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.primaryTeal,
    marginLeft: 6,
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.sizes.display - 4,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: typography.lineHeights.body,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.error,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorNoticeText: {
    fontSize: typography.sizes.callout,
    color: colors.error,
    flex: 1,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.full,
    gap: 6,
  },
  chipActive: {
    backgroundColor: colors.primaryTeal,
    borderColor: colors.primaryTeal,
  },
  chipText: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
  },
  verticalOptions: {
    gap: spacing.sm,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
  },
  goalOptionActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderColor: colors.primaryTeal,
  },
  goalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalIconCircleActive: {
    backgroundColor: colors.primaryTeal,
  },
  goalTextCol: {
    flex: 1,
  },
  goalTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  goalTitleActive: {
    color: colors.primaryTeal,
  },
  goalDesc: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTeal,
    paddingVertical: spacing.base,
    borderRadius: radius.card,
    marginTop: spacing.md,
    shadowColor: colors.primaryTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  submitBtnText: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.heavy,
    color: colors.textInverse,
  },
  btnIcon: {
    marginLeft: spacing.sm,
  },
});
