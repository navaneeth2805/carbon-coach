import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DietType, SpiceLevel, BudgetLevel } from '@/data/dishIngredients';

export interface UserProfile {
  name: string;
  diet: DietType;
  allergies: string[];
  spicePreference: SpiceLevel;
  budgetLevel: BudgetLevel;
  primaryGoal: 'reduce_footprint' | 'save_money' | 'health';
  dailyCarbonBudget: number; // in kg CO2e, default 3.5
  onboardingCompleted: boolean;
  avatarSeed: string;
}

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Eco Pioneer',
  diet: 'vegetarian',
  allergies: [],
  spicePreference: 'medium',
  budgetLevel: 'medium',
  primaryGoal: 'reduce_footprint',
  dailyCarbonBudget: 3.5,
  onboardingCompleted: false,
  avatarSeed: 'EP',
};

const STORAGE_KEY_USER_PROFILE = 'carboniq_user_profile_v1';

interface UserProfileContextType {
  profile: UserProfile;
  isLoading: boolean;
  error: string | null;
  updateProfile: (updated: Partial<UserProfile>) => Promise<boolean>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<boolean>;
  resetProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile from storage on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_USER_PROFILE);
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile({ ...DEFAULT_PROFILE, ...parsed });
      } else {
        setProfile(DEFAULT_PROFILE);
      }
    } catch (err: any) {
      console.error('Failed to read user profile from storage:', err);
      setError('Unable to load saved preferences');
      setProfile(DEFAULT_PROFILE);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updated: Partial<UserProfile>): Promise<boolean> => {
    try {
      const newProfile = { ...profile, ...updated };
      setProfile(newProfile);
      await AsyncStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(newProfile));
      return true;
    } catch (err: any) {
      console.error('Failed to save updated profile:', err);
      setError('Failed to persist profile changes');
      return false;
    }
  };

  const completeOnboarding = async (data: Partial<UserProfile>): Promise<boolean> => {
    return await updateProfile({
      ...data,
      onboardingCompleted: true,
    });
  };

  const resetProfile = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_USER_PROFILE);
      setProfile(DEFAULT_PROFILE);
    } catch (err) {
      console.error('Failed to reset profile:', err);
    }
  };

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        isLoading,
        error,
        updateProfile,
        completeOnboarding,
        resetProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = (): UserProfileContextType => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
