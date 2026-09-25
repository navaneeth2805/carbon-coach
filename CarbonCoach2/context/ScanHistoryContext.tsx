import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IngredientBreakdown } from '@/services/carbonEngine';
import { ConfidenceType } from '@/components/ConfidenceBadge';
import { isSameCalendarDay } from '@/services/dateUtils';

export const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';

export interface LoggedMeal {
  id: string;
  dishId: string;
  dishName: string;
  portionGrams: number;
  totalCo2e: number;
  breakdown: IngredientBreakdown[];
  confidenceType: ConfidenceType;
  confidence: number;
  timestamp: string; // ISO
  imageUri?: string;
  rating: 'low' | 'moderate' | 'high';
  source?: string;
}

const STORAGE_KEY_MEAL_HISTORY = 'carboniq_meal_history_v1';

// Seed mock meals used ONLY if USE_MOCK_DATA is explicitly enabled
const MOCK_MEALS: LoggedMeal[] = [
  {
    id: 'mock_1',
    dishId: 'dal_makhani',
    dishName: 'Dal Makhani',
    portionGrams: 350,
    totalCo2e: 1.15,
    breakdown: [
      {
        ingredient: 'butter',
        displayName: 'Dairy Butter',
        grams: 40,
        co2e: 0.47,
        share: 41,
        factor: 11.8,
        source: 'Poore & Nemecek 2018 via OWID',
        category: 'dairy',
      },
      {
        ingredient: 'cream',
        displayName: 'Dairy Cream',
        grams: 35,
        co2e: 0.26,
        share: 23,
        factor: 7.5,
        source: 'Poore & Nemecek 2018 via OWID',
        category: 'dairy',
      },
      {
        ingredient: 'urad_dal',
        displayName: 'Black Gram (Urad Dal)',
        grams: 140,
        co2e: 0.13,
        share: 11,
        factor: 0.95,
        source: 'Poore & Nemecek 2018 via OWID',
        category: 'legumes',
      },
    ],
    confidenceType: 'agreement',
    confidence: 0.96,
    timestamp: new Date().toISOString(),
    rating: 'moderate',
  },
];

interface ScanHistoryContextType {
  history: LoggedMeal[];
  todayMeals: LoggedMeal[];
  todayTotalCo2e: number;
  recentMeal: LoggedMeal | null;
  isLoading: boolean;
  error: string | null;
  logMeal: (meal: Omit<LoggedMeal, 'id' | 'timestamp'>) => Promise<LoggedMeal | null>;
  deleteMeal: (id: string) => Promise<boolean>;
  clearHistory: () => Promise<void>;
  reloadHistory: () => Promise<void>;
}

const ScanHistoryContext = createContext<ScanHistoryContextType | undefined>(undefined);

export const ScanHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<LoggedMeal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_MEAL_HISTORY);
      if (raw) {
        const parsed: LoggedMeal[] = JSON.parse(raw);
        setHistory(parsed);
      } else if (USE_MOCK_DATA) {
        setHistory(MOCK_MEALS);
        await AsyncStorage.setItem(STORAGE_KEY_MEAL_HISTORY, JSON.stringify(MOCK_MEALS));
      } else {
        setHistory([]);
      }
    } catch (err: any) {
      console.error('Failed to load meal history from AsyncStorage:', err);
      setError('Could not retrieve meal scan history');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const logMeal = async (
    mealInput: Omit<LoggedMeal, 'id' | 'timestamp'>
  ): Promise<LoggedMeal | null> => {
    try {
      const newMeal: LoggedMeal = {
        ...mealInput,
        id: `meal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [newMeal, ...history];
      setHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEY_MEAL_HISTORY, JSON.stringify(updatedHistory));
      return newMeal;
    } catch (err: any) {
      console.error('Failed to save meal to history:', err);
      setError('Failed to record meal entry');
      return null;
    }
  };

  const deleteMeal = async (id: string): Promise<boolean> => {
    try {
      const updated = history.filter(m => m.id !== id);
      setHistory(updated);
      await AsyncStorage.setItem(STORAGE_KEY_MEAL_HISTORY, JSON.stringify(updated));
      return true;
    } catch (err: any) {
      console.error('Failed to delete meal entry:', err);
      return false;
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_MEAL_HISTORY);
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear meal history:', err);
    }
  };

  const todayMeals = useMemo(() => {
    const now = new Date();
    return history.filter(m => isSameCalendarDay(m.timestamp, now));
  }, [history]);

  const todayTotalCo2e = useMemo(() => {
    const sum = todayMeals.reduce((acc, curr) => acc + (curr.totalCo2e || 0), 0);
    return Number(sum.toFixed(2));
  }, [todayMeals]);

  const recentMeal = useMemo(() => {
    return history.length > 0 ? history[0] : null;
  }, [history]);

  return (
    <ScanHistoryContext.Provider
      value={{
        history,
        todayMeals,
        todayTotalCo2e,
        recentMeal,
        isLoading,
        error,
        logMeal,
        deleteMeal,
        clearHistory,
        reloadHistory: loadHistory,
      }}
    >
      {children}
    </ScanHistoryContext.Provider>
  );
};

export const useScanHistory = (): ScanHistoryContextType => {
  const context = useContext(ScanHistoryContext);
  if (!context) {
    throw new Error('useScanHistory must be used within a ScanHistoryProvider');
  }
  return context;
};
