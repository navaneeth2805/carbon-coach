import AsyncStorage from '@react-native-async-storage/async-storage';
import { DISH_DATABASE, DishProfile, DietType, SpiceLevel, BudgetLevel } from '@/data/dishIngredients';
import { calculateFootprint, CarbonFootprintResult } from './carbonEngine';

export interface UserPreferences {
  diet: DietType;
  allergies: string[]; // 'dairy', 'gluten', 'nuts', 'eggs'
  spicePreference: SpiceLevel;
  budgetLevel: BudgetLevel;
  primaryGoal: 'reduce_footprint' | 'save_money' | 'health';
}

export interface RecommendationFeedbackWeights {
  categoryWeights: Record<string, number>; // e.g. 'curry': 1.2
  spiceWeights: Record<SpiceLevel, number>;
  budgetWeights: Record<BudgetLevel, number>;
  carbonSavingsWeight: number; // default 1.0
}

export interface RecommendationAlternative {
  dish: DishProfile;
  footprint: CarbonFootprintResult;
  co2eSavings: number; // in kg CO2e
  percentageReduction: number; // e.g. 65%
  score: number;
  matchReasons: string[];
}

const STORAGE_KEY_FEEDBACK_WEIGHTS = 'carboniq_rec_feedback_weights_v1';

const DEFAULT_WEIGHTS: RecommendationFeedbackWeights = {
  categoryWeights: {
    curry: 1.0,
    rice_biryani: 1.0,
    bread: 1.0,
    dal: 1.0,
    snack_breakfast: 1.0,
    dessert: 0.8,
  },
  spiceWeights: {
    mild: 1.0,
    medium: 1.0,
    spicy: 1.0,
  },
  budgetWeights: {
    budget: 1.0,
    medium: 1.0,
    premium: 0.9,
  },
  carbonSavingsWeight: 1.2,
};

/**
 * Load learned weights from AsyncStorage safely
 */
export async function loadRecommendationWeights(): Promise<RecommendationFeedbackWeights> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_FEEDBACK_WEIGHTS);
    if (raw) {
      return { ...DEFAULT_WEIGHTS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load recommendation weights from AsyncStorage:', err);
  }
  return DEFAULT_WEIGHTS;
}

/**
 * Record user feedback (Accept or Reject) to nudge future recommendation soft-scoring
 */
export async function recordRecommendationFeedback(
  dishId: string,
  action: 'accept' | 'reject'
): Promise<void> {
  try {
    const currentWeights = await loadRecommendationWeights();
    const dish = DISH_DATABASE[dishId];
    if (!dish) return;

    const delta = action === 'accept' ? 0.15 : -0.15;

    // Nudge category weight
    const currentCatWeight = currentWeights.categoryWeights[dish.category] || 1.0;
    currentWeights.categoryWeights[dish.category] = Math.max(0.2, Math.min(2.0, currentCatWeight + delta));

    // Nudge spice weight
    const currentSpiceWeight = currentWeights.spiceWeights[dish.spiceLevel] || 1.0;
    currentWeights.spiceWeights[dish.spiceLevel] = Math.max(0.2, Math.min(2.0, currentSpiceWeight + delta * 0.7));

    // Nudge budget weight
    const currentBudgetWeight = currentWeights.budgetWeights[dish.budget] || 1.0;
    currentWeights.budgetWeights[dish.budget] = Math.max(0.2, Math.min(2.0, currentBudgetWeight + delta * 0.5));

    await AsyncStorage.setItem(STORAGE_KEY_FEEDBACK_WEIGHTS, JSON.stringify(currentWeights));
  } catch (err) {
    console.error('Failed to save recommendation feedback weights:', err);
  }
}

/**
 * Checks if a candidate dish conforms to strict dietary requirements
 */
function passesDietaryHardFilter(candidateDiet: DietType, userDiet: DietType): boolean {
  if (userDiet === 'vegan') {
    return candidateDiet === 'vegan';
  }
  if (userDiet === 'vegetarian') {
    return candidateDiet === 'vegetarian' || candidateDiet === 'vegan';
  }
  if (userDiet === 'pescatarian') {
    return candidateDiet !== 'non_vegetarian';
  }
  return true; // non_vegetarian user eats everything
}

/**
 * Core explainable, content-based recommendation engine.
 * Ranks 2-4 lower-carbon alternatives respecting hard filters and soft similarities.
 */
export async function getAlternatives(
  originalDishName: string,
  originalCo2e: number,
  userProfile: UserPreferences,
  limit: number = 3
): Promise<RecommendationAlternative[]> {
  try {
    const weights = await loadRecommendationWeights();
    const allDishes = Object.values(DISH_DATABASE);

    const candidates: RecommendationAlternative[] = [];

    for (const candidate of allDishes) {
      // 1. Hard Filter: Do not recommend the exact same dish
      if (candidate.name.toLowerCase() === originalDishName.toLowerCase() || candidate.id === originalDishName) {
        continue;
      }

      // 2. Hard Filter: Strict diet compliance
      if (!passesDietaryHardFilter(candidate.diet, userProfile.diet)) {
        continue;
      }

      // 3. Hard Filter: Strict allergy avoidance
      const hasAllergyConflict = candidate.allergens.some(a =>
        userProfile.allergies.map(x => x.toLowerCase()).includes(a.toLowerCase())
      );
      if (hasAllergyConflict) {
        continue;
      }

      // Calculate footprint for candidate
      const candidateFootprint = calculateFootprint(candidate.id, candidate.defaultPortionGrams);
      const savings = originalCo2e - candidateFootprint.totalCo2e;

      // 4. Hard Filter: Must have strictly lower CO2e (or equal if original is already minimal < 0.6)
      if (originalCo2e > 0.6 && savings <= 0.05) {
        continue;
      }
      if (savings < 0) {
        continue;
      }

      const percentageReduction = originalCo2e > 0
        ? Math.round((savings / originalCo2e) * 100)
        : 0;

      // Soft-Scoring:
      let score = 0;
      const matchReasons: string[] = [];

      // A. Carbon savings factor
      score += (percentageReduction / 10) * weights.carbonSavingsWeight;
      if (percentageReduction >= 50) {
        matchReasons.push(`Saves ${percentageReduction}% CO₂e`);
      } else if (percentageReduction > 0) {
        matchReasons.push(`Cuts CO₂e by ${savings.toFixed(2)} kg`);
      }

      // B. Category match & affinity
      const catWeight = weights.categoryWeights[candidate.category] || 1.0;
      score += 15 * catWeight;

      // C. Spice match
      if (candidate.spiceLevel === userProfile.spicePreference) {
        score += 10 * (weights.spiceWeights[candidate.spiceLevel] || 1.0);
        matchReasons.push(`Matches your ${candidate.spiceLevel} spice preference`);
      }

      // D. Budget match
      if (candidate.budget === userProfile.budgetLevel) {
        score += 8 * (weights.budgetWeights[candidate.budget] || 1.0);
        matchReasons.push(`Fits your ${candidate.budget} budget`);
      }

      // E. Goal-specific bonus
      if (userProfile.primaryGoal === 'save_money' && candidate.budget === 'budget') {
        score += 12;
        matchReasons.push('Cost-effective eco choice');
      } else if (userProfile.primaryGoal === 'health' && (candidate.category === 'dal' || candidate.diet === 'vegan')) {
        score += 12;
        matchReasons.push('Nutrient & plant-dense');
      }

      candidates.push({
        dish: candidate,
        footprint: candidateFootprint,
        co2eSavings: Number(savings.toFixed(2)),
        percentageReduction,
        score,
        matchReasons: matchReasons.slice(0, 3),
      });
    }

    // Sort descending by calculated score
    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, limit);
  } catch (err) {
    console.error('Error generating recommendations:', err);
    return [];
  }
}
