import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString, isConsecutiveDay, isSameCalendarDay, getCalendarDayDiff } from '@/services/dateUtils';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null; // ISO date string or null
}

export interface DailyGoal {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
}

export interface GamificationState {
  streakCount: number;
  lastLoggedDate: string | null; // YYYY-MM-DD
  totalMealsLogged: number;
  totalCo2eSaved: number; // in kg CO2e vs standard benchmark
  unlockedBadgeIds: string[];
}

const DEFAULT_GAMIFICATION_STATE: GamificationState = {
  streakCount: 0,
  lastLoggedDate: null,
  totalMealsLogged: 0,
  totalCo2eSaved: 0,
  unlockedBadgeIds: [],
};

const ALL_BADGES: Omit<Badge, 'unlockedAt'>[] = [
  {
    id: 'first_scan',
    title: 'First Footprint',
    description: 'Scanned and analyzed your very first meal with CarbonCoach.',
    icon: 'sparkles',
  },
  {
    id: 'streak_3',
    title: 'Habit Builder',
    description: 'Maintained a 3-day daily meal logging streak.',
    icon: 'flame',
  },
  {
    id: 'streak_7',
    title: 'Climate Champion',
    description: 'Kept a 7-day sustainable eating streak alive.',
    icon: 'trophy',
  },
  {
    id: 'low_carbon_hero',
    title: 'Plant Pioneer',
    description: 'Logged a low-footprint meal under 0.8 kg CO₂e.',
    icon: 'leaf',
  },
  {
    id: 'budget_master',
    title: 'Carbon Frugal',
    description: 'Stayed safely within your daily carbon budget.',
    icon: 'shield-checkmark',
  },
];

const STORAGE_KEY_GAMIFICATION = 'carboniq_gamification_state_v1';

interface GamificationContextType {
  state: GamificationState;
  badges: Badge[];
  activeStreak: boolean;
  isLoading: boolean;
  recordMealLogged: (mealCo2e: number, dishId: string) => Promise<void>;
  resetGamification: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GamificationState>(DEFAULT_GAMIFICATION_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    setIsLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_GAMIFICATION);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Verify day boundary on load: if lastLoggedDate was > 1 day ago and not today, streak has lapsed
        const todayStr = getLocalDateString();
        let currentStreak = parsed.streakCount || 0;

        if (parsed.lastLoggedDate) {
          const diff = getCalendarDayDiff(parsed.lastLoggedDate, todayStr);
          if (diff > 1) {
            // More than 1 day missed -> reset streak
            currentStreak = 0;
          }
        }

        const normalized: GamificationState = {
          streakCount: currentStreak,
          lastLoggedDate: parsed.lastLoggedDate || null,
          totalMealsLogged: parsed.totalMealsLogged || 0,
          totalCo2eSaved: parsed.totalCo2eSaved || 0,
          unlockedBadgeIds: Array.isArray(parsed.unlockedBadgeIds) ? parsed.unlockedBadgeIds : [],
        };
        setState(normalized);
      } else {
        setState(DEFAULT_GAMIFICATION_STATE);
      }
    } catch (err) {
      console.warn('Recovered from corrupted gamification state silently:', err);
      setState(DEFAULT_GAMIFICATION_STATE);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Action trigger when a meal is logged:
   * Updates streak with proper day-boundary logic, increments counts, unlocks badges.
   */
  const recordMealLogged = async (mealCo2e: number, dishId: string): Promise<void> => {
    try {
      const todayStr = getLocalDateString();
      const prevDate = state.lastLoggedDate;

      let newStreak = state.streakCount;

      if (!prevDate) {
        newStreak = 1;
      } else if (isSameCalendarDay(prevDate, todayStr)) {
        // Same day: streak stays unchanged
        newStreak = Math.max(1, state.streakCount);
      } else if (isConsecutiveDay(prevDate, todayStr)) {
        // Immediate next day: increment streak
        newStreak = state.streakCount + 1;
      } else {
        // Missed a day: reset to 1
        newStreak = 1;
      }

      const totalMeals = state.totalMealsLogged + 1;
      // Baseline assumption: typical restaurant meal is ~2.5 kg CO2e
      const co2eSavedDelta = Math.max(0, 2.5 - mealCo2e);
      const totalSaved = Number((state.totalCo2eSaved + co2eSavedDelta).toFixed(2));

      // Check badge triggers
      const unlockedSet = new Set(state.unlockedBadgeIds);
      if (totalMeals >= 1) unlockedSet.add('first_scan');
      if (newStreak >= 3) unlockedSet.add('streak_3');
      if (newStreak >= 7) unlockedSet.add('streak_7');
      if (mealCo2e <= 0.8) unlockedSet.add('low_carbon_hero');

      const newState: GamificationState = {
        streakCount: newStreak,
        lastLoggedDate: todayStr,
        totalMealsLogged: totalMeals,
        totalCo2eSaved: totalSaved,
        unlockedBadgeIds: Array.from(unlockedSet),
      };

      setState(newState);
      await AsyncStorage.setItem(STORAGE_KEY_GAMIFICATION, JSON.stringify(newState));
    } catch (err) {
      console.warn('Silently handled gamification update error:', err);
    }
  };

  const resetGamification = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_GAMIFICATION);
      setState(DEFAULT_GAMIFICATION_STATE);
    } catch (err) {
      console.warn('Failed to reset gamification state:', err);
    }
  };

  // Compute full badges with unlock status
  const badges: Badge[] = ALL_BADGES.map(b => ({
    ...b,
    unlockedAt: state.unlockedBadgeIds.includes(b.id) ? new Date().toISOString() : null,
  }));

  const activeStreak = Boolean(state.streakCount > 0 && state.lastLoggedDate);

  return (
    <GamificationContext.Provider
      value={{
        state,
        badges,
        activeStreak,
        isLoading,
        recordMealLogged,
        resetGamification,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
