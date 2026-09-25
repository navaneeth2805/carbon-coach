import { CARBON_FACTORS, CATEGORY_FALLBACK_FACTORS, CarbonFactorEntry } from '@/data/carbonFactors';
import { DISH_DATABASE, DishProfile, DietType } from '@/data/dishIngredients';

export interface IngredientBreakdown {
  ingredient: string;
  displayName: string;
  grams: number;
  co2e: number; // in kg CO2e
  share: number; // 0 to 100%
  factor: number;
  source: string;
  category: string;
}

export interface CarbonFootprintResult {
  dishId: string;
  dishName: string;
  portionGrams: number;
  totalCo2e: number; // in kg CO2e
  breakdown: IngredientBreakdown[];
  isFallbackEstimate: boolean;
  diet: DietType;
  allergens: string[];
  rating: 'low' | 'moderate' | 'high';
}

/**
 * Format raw ingredient keys to friendly readable names
 */
export function formatIngredientName(key: string): string {
  const map: Record<string, string> = {
    mutton: 'Mutton / Lamb',
    chicken: 'Chicken Breast / Meat',
    beef: 'Beef',
    pork: 'Pork',
    prawns: 'Tiger Prawns',
    farmed_fish: 'Farmed White Fish',
    paneer: 'Fresh Dairy Paneer',
    cheese: 'Cheese',
    butter: 'Dairy Butter',
    ghee: 'Desi Cow Ghee',
    milk: 'Whole Milk',
    cream: 'Dairy Cream',
    yogurt: 'Curd / Yogurt',
    eggs: 'Farm Eggs',
    rice: 'Basmati Rice',
    wheat: 'Whole Wheat Atta',
    maida: 'Refined Flour (Maida)',
    tofu: 'Soy Tofu',
    legumes: 'Mixed Legumes',
    lentils: 'Split Lentils',
    chickpeas: 'White Chickpeas (Chole)',
    rajma: 'Red Kidney Beans',
    urad_dal: 'Black Gram (Urad Dal)',
    moong_dal: 'Yellow Moong Dal',
    potatoes: 'Potatoes',
    onions: 'Red Onions',
    tomatoes: 'Tomatoes',
    spinach: 'Fresh Spinach (Palak)',
    cauliflower: 'Cauliflower',
    eggplant: 'Roasted Eggplant',
    peas: 'Green Peas',
    vegetables: 'Mixed Seasonal Veggies',
    cucumber: 'English Cucumber',
    vegetable_oil: 'Refined Vegetable Oil',
    mustard_oil: 'Cold-pressed Mustard Oil',
    cashews: 'Cashew Nuts',
    sugar: 'Cane Sugar',
    spices: 'Aromatic Whole Spices',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Resolve a raw dish name string to an existing DishProfile in the database
 */
export function findDishProfile(query: string): DishProfile | null {
  if (!query) return null;
  const cleanQuery = query.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // 1. Direct match by id
  if (DISH_DATABASE[query]) {
    return DISH_DATABASE[query];
  }

  // 2. Direct match by stripped key
  for (const [id, dish] of Object.entries(DISH_DATABASE)) {
    const strippedId = id.replace(/[^a-z0-9]/g, '');
    const strippedName = dish.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (strippedId === cleanQuery || strippedName === cleanQuery) {
      return dish;
    }
  }

  // 3. Substring match
  for (const [id, dish] of Object.entries(DISH_DATABASE)) {
    const strippedId = id.replace(/[^a-z0-9]/g, '');
    const strippedName = dish.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (
      cleanQuery.includes(strippedId) ||
      strippedId.includes(cleanQuery) ||
      cleanQuery.includes(strippedName) ||
      strippedName.includes(cleanQuery)
    ) {
      return dish;
    }
  }

  // 4. Keyword tokens match
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  for (const [, dish] of Object.entries(DISH_DATABASE)) {
    const nameLower = dish.name.toLowerCase();
    const matchesAll = tokens.every(token => nameLower.includes(token));
    if (matchesAll && tokens.length > 0) {
      return dish;
    }
  }

  return null;
}

/**
 * Core carbon footprint calculator.
 * Scales ingredient grams to target portion, applies OWID factors, computes shares.
 * If dish is not in the database, generates a scientifically grounded generic estimate.
 */
export function calculateFootprint(
  dishQuery: string,
  portionGrams?: number,
  fallbackCategory?: string
): CarbonFootprintResult {
  try {
    const matchedProfile = findDishProfile(dishQuery);

    if (matchedProfile) {
      const targetPortion = portionGrams && portionGrams > 0 ? portionGrams : matchedProfile.defaultPortionGrams;
      const scale = targetPortion / matchedProfile.defaultPortionGrams;

      let totalCo2e = 0;
      const breakdownItems: Array<{
        ingredient: string;
        displayName: string;
        grams: number;
        co2e: number;
        factor: number;
        source: string;
        category: string;
      }> = [];

      for (const item of matchedProfile.ingredients) {
        const factorEntry: CarbonFactorEntry = CARBON_FACTORS[item.ingredient] || {
          factor: CATEGORY_FALLBACK_FACTORS.vegetables,
          source: 'OWID Generic Baseline',
          confidence: 'low',
          category: 'vegetables',
        };

        const itemGrams = item.grams * scale;
        const itemCo2e = factorEntry.factor * (itemGrams / 1000);
        totalCo2e += itemCo2e;

        breakdownItems.push({
          ingredient: item.ingredient,
          displayName: formatIngredientName(item.ingredient),
          grams: Math.round(itemGrams),
          co2e: itemCo2e,
          factor: factorEntry.factor,
          source: factorEntry.source,
          category: factorEntry.category,
        });
      }

      // Compute percentage shares and sort descending
      const finalBreakdown: IngredientBreakdown[] = breakdownItems
        .map(item => ({
          ...item,
          co2e: Number(item.co2e.toFixed(3)),
          share: totalCo2e > 0 ? Math.round((item.co2e / totalCo2e) * 100) : 0,
        }))
        .sort((a, b) => b.co2e - a.co2e);

      const rating: 'low' | 'moderate' | 'high' =
        totalCo2e <= 1.0 ? 'low' : totalCo2e <= 2.5 ? 'moderate' : 'high';

      return {
        dishId: matchedProfile.id,
        dishName: matchedProfile.name,
        portionGrams: Math.round(targetPortion),
        totalCo2e: Number(totalCo2e.toFixed(3)),
        breakdown: finalBreakdown,
        isFallbackEstimate: false,
        diet: matchedProfile.diet,
        allergens: matchedProfile.allergens,
        rating,
      };
    }

    // Generic Fallback when dish is not present in our curated 28-dish database
    const targetPortion = portionGrams && portionGrams > 0 ? portionGrams : 350;
    const cat = (fallbackCategory || 'mixed').toLowerCase();

    // Determine baseline composition based on query terms or category
    const isMeat = /mutton|lamb|beef|pork|chicken|meat|prawn|fish|seafood/i.test(dishQuery) || cat.includes('meat');
    const isDairy = /paneer|cheese|butter|cream|milk/i.test(dishQuery) || cat.includes('dairy');

    let mainFactor = CATEGORY_FALLBACK_FACTORS.vegetables;
    let mainCategory = 'vegetables';
    let diet: DietType = 'vegan';

    if (isMeat) {
      mainFactor = CATEGORY_FALLBACK_FACTORS.meat;
      mainCategory = 'meat';
      diet = 'non_vegetarian';
    } else if (isDairy) {
      mainFactor = CATEGORY_FALLBACK_FACTORS.dairy;
      mainCategory = 'dairy';
      diet = 'vegetarian';
    }

    // Standard portion partition: 40% main, 40% staple/carbs, 15% veggies, 5% oil
    const mainGrams = targetPortion * 0.4;
    const stapleGrams = targetPortion * 0.4;
    const vegGrams = targetPortion * 0.15;
    const oilGrams = targetPortion * 0.05;

    const mainCo2e = mainFactor * (mainGrams / 1000);
    const stapleCo2e = CARBON_FACTORS.rice.factor * (stapleGrams / 1000);
    const vegCo2e = CARBON_FACTORS.vegetables.factor * (vegGrams / 1000);
    const oilCo2e = CARBON_FACTORS.vegetable_oil.factor * (oilGrams / 1000);

    const totalCo2e = mainCo2e + stapleCo2e + vegCo2e + oilCo2e;

    const breakdown: IngredientBreakdown[] = [
      {
        ingredient: isMeat ? 'meat_main' : isDairy ? 'dairy_main' : 'plant_protein',
        displayName: isMeat ? 'Meat Core' : isDairy ? 'Dairy Core' : 'Plant Protein',
        grams: Math.round(mainGrams),
        co2e: Number(mainCo2e.toFixed(3)),
        share: Math.round((mainCo2e / totalCo2e) * 100),
        factor: mainFactor,
        source: 'OWID Generic Category Estimate',
        category: mainCategory,
      },
      {
        ingredient: 'grain_staple',
        displayName: 'Grain / Staple Base',
        grams: Math.round(stapleGrams),
        co2e: Number(stapleCo2e.toFixed(3)),
        share: Math.round((stapleCo2e / totalCo2e) * 100),
        factor: CARBON_FACTORS.rice.factor,
        source: 'OWID Generic Baseline',
        category: 'grains',
      },
      {
        ingredient: 'mixed_vegetables',
        displayName: 'Mixed Vegetables & Seasoning',
        grams: Math.round(vegGrams),
        co2e: Number(vegCo2e.toFixed(3)),
        share: Math.round((vegCo2e / totalCo2e) * 100),
        factor: CARBON_FACTORS.vegetables.factor,
        source: 'OWID Generic Baseline',
        category: 'vegetables',
      },
      {
        ingredient: 'cooking_oil',
        displayName: 'Cooking Oil & Spices',
        grams: Math.round(oilGrams),
        co2e: Number(oilCo2e.toFixed(3)),
        share: Math.round((oilCo2e / totalCo2e) * 100),
        factor: CARBON_FACTORS.vegetable_oil.factor,
        source: 'OWID Generic Baseline',
        category: 'oils_fats',
      },
    ].sort((a, b) => b.co2e - a.co2e);

    const rating: 'low' | 'moderate' | 'high' =
      totalCo2e <= 1.0 ? 'low' : totalCo2e <= 2.5 ? 'moderate' : 'high';

    return {
      dishId: 'generic_estimate',
      dishName: dishQuery,
      portionGrams: Math.round(targetPortion),
      totalCo2e: Number(totalCo2e.toFixed(3)),
      breakdown,
      isFallbackEstimate: true,
      diet,
      allergens: isDairy ? ['dairy'] : [],
      rating,
    };
  } catch (err) {
    console.error('Error in calculateFootprint:', err);
    // Never crash or return empty; return a defensive baseline
    return {
      dishId: 'baseline_fallback',
      dishName: dishQuery || 'Assorted Meal',
      portionGrams: portionGrams || 350,
      totalCo2e: 1.25,
      breakdown: [
        {
          ingredient: 'composite_meal',
          displayName: 'Composite Meal Items',
          grams: portionGrams || 350,
          co2e: 1.25,
          share: 100,
          factor: 3.5,
          source: 'Generic Baseline Fallback',
          category: 'other',
        },
      ],
      isFallbackEstimate: true,
      diet: 'vegetarian',
      allergens: [],
      rating: 'moderate',
    };
  }
}
