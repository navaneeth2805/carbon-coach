/**
 * CarbonIQ Carbon Emission Factors
 * Source: Poore & Nemecek (2018) via Our World in Data (OWID)
 * Unit: kg CO2-equivalent per kg of food product (kgCO2e / kg)
 */

export interface CarbonFactorEntry {
  factor: number; // kgCO2e / kg
  source: string;
  confidence: 'high' | 'medium' | 'low';
  category: 'meat' | 'dairy' | 'seafood' | 'grains' | 'legumes' | 'vegetables' | 'oils_fats' | 'fruits' | 'other';
}

export const CARBON_FACTORS: Record<string, CarbonFactorEntry> = {
  // Meats & Poultry
  beef: { factor: 60.0, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'meat' },
  mutton: { factor: 24.5, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'meat' },
  lamb: { factor: 24.0, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'meat' },
  pork: { factor: 7.2, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'meat' },
  chicken: { factor: 6.9, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'meat' },

  // Seafood
  prawns: { factor: 18.2, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'seafood' },
  farmed_fish: { factor: 5.4, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'seafood' },

  // Dairy & Eggs
  paneer: { factor: 13.5, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'dairy' },
  cheese: { factor: 21.2, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'dairy' },
  butter: { factor: 11.8, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'dairy' },
  ghee: { factor: 11.2, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'dairy' },
  milk: { factor: 3.15, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'dairy' },
  cream: { factor: 7.5, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'dairy' },
  yogurt: { factor: 2.6, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'dairy' },
  eggs: { factor: 4.5, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'dairy' },

  // Grains & Staples
  rice: { factor: 4.0, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'grains' },
  wheat: { factor: 1.4, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'grains' },
  maida: { factor: 1.5, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'grains' },
  millet: { factor: 0.8, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'grains' },

  // Plant Proteins & Legumes
  tofu: { factor: 2.0, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'legumes' },
  legumes: { factor: 0.9, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'legumes' },
  lentils: { factor: 0.9, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'legumes' },
  chickpeas: { factor: 0.85, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'legumes' },
  rajma: { factor: 0.92, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'legumes' },
  urad_dal: { factor: 0.95, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'legumes' },
  moong_dal: { factor: 0.88, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'legumes' },

  // Vegetables
  potatoes: { factor: 0.46, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'vegetables' },
  onions: { factor: 0.40, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'vegetables' },
  tomatoes: { factor: 1.4, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'vegetables' },
  spinach: { factor: 0.45, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'vegetables' },
  cauliflower: { factor: 0.55, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'vegetables' },
  eggplant: { factor: 0.48, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'vegetables' },
  peas: { factor: 0.90, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'vegetables' },
  vegetables: { factor: 0.50, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'vegetables' },
  cucumber: { factor: 0.45, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'vegetables' },

  // Oils & Fats
  vegetable_oil: { factor: 3.6, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'oils_fats' },
  mustard_oil: { factor: 3.2, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'oils_fats' },

  // Nuts & Sweeteners
  cashews: { factor: 2.3, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'other' },
  sugar: { factor: 1.8, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'other' },
  spices: { factor: 1.2, source: 'Poore & Nemecek 2018 via OWID', confidence: 'medium', category: 'other' },
};

/**
 * Fallback baseline factor per category when an unmapped ingredient is encountered
 */
export const CATEGORY_FALLBACK_FACTORS: Record<string, number> = {
  meat: 12.0,
  seafood: 8.0,
  dairy: 8.5,
  grains: 2.5,
  legumes: 0.9,
  vegetables: 0.55,
  oils_fats: 3.8,
  fruits: 0.7,
  other: 1.8,
};
