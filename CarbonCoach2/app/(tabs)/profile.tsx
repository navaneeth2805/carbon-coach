import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { GlassCard } from '@/components/GlassCard';
import { CO2eBadge } from '@/components/CO2eBadge';
import { EmptyState } from '@/components/EmptyState';
import { useUserProfile } from '@/context/UserProfileContext';
import { useScanHistory } from '@/context/ScanHistoryContext';
import { useGamification } from '@/context/GamificationContext';
import { DUAL_MODEL_CARD } from '@/data/modelCardData';
import { DietType, SpiceLevel, BudgetLevel } from '@/data/dishIngredients';
import { colors, typography, spacing, radius } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, resetProfile } = useUserProfile();
  const { history, deleteMeal, clearHistory } = useScanHistory();
  const { state: gamification, badges } = useGamification();

  const [activeSection, setActiveSection] = useState<'preferences' | 'history' | 'model_card'>('preferences');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(profile.name);

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await updateProfile({ name: nameInput.trim() });
      setIsEditingName(false);
    }
  };

  const handleDietChange = async (d: DietType) => {
    await updateProfile({ diet: d });
  };

  const handleSpiceChange = async (s: SpiceLevel) => {
    await updateProfile({ spicePreference: s });
  };

  const handleBudgetChange = async (b: BudgetLevel) => {
    await updateProfile({ budgetLevel: b });
  };

  const handleBudgetIncrement = async (delta: number) => {
    const current = profile.dailyCarbonBudget || 3.5;
    const updated = Math.max(1.0, Math.min(10.0, Number((current + delta).toFixed(1))));
    await updateProfile({ dailyCarbonBudget: updated });
  };

  const handleConfirmClearHistory = () => {
    Alert.alert(
      'Clear Scan History',
      'Are you sure you want to remove all logged meals? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarBigText}>
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

          <View style={styles.profileTitleCol}>
            {isEditingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  style={styles.nameInput}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveName} style={styles.saveNameBtn}>
                  <Ionicons name="checkmark" size={18} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                style={styles.nameDisplayRow}
                activeOpacity={0.8}
              >
                <Text style={styles.profileNameText}>{profile.name || 'Eco Pioneer'}</Text>
                <Ionicons name="pencil" size={15} color={colors.primaryTeal} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}
            <Text style={styles.profileSubText}>
              {profile.primaryGoal.replace('_', ' ').toUpperCase()} • {gamification.streakCount}D STREAK
            </Text>
          </View>
        </View>

        {/* Section Tabs Switcher */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSection === 'preferences' && styles.segmentBtnActive]}
            onPress={() => setActiveSection('preferences')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSection === 'preferences' && styles.segmentBtnTextActive,
              ]}
            >
              Preferences
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSection === 'history' && styles.segmentBtnActive]}
            onPress={() => setActiveSection('history')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSection === 'history' && styles.segmentBtnTextActive,
              ]}
            >
              History ({history.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeSection === 'model_card' && styles.segmentBtnActive]}
            onPress={() => setActiveSection('model_card')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSection === 'model_card' && styles.segmentBtnTextActive,
              ]}
            >
              Model Card
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: PREFERENCES */}
          {activeSection === 'preferences' && (
            <View style={styles.sectionWrap}>
              {/* Daily Budget Adjuster */}
              <GlassCard style={styles.prefCard}>
                <Text style={styles.prefSectionTitle}>Daily CO₂e Budget</Text>
                <Text style={styles.prefSectionSubtitle}>
                  Target cap for your total daily food emissions
                </Text>
                <View style={styles.budgetRow}>
                  <TouchableOpacity
                    onPress={() => handleBudgetIncrement(-0.5)}
                    style={styles.budgetStepBtn}
                  >
                    <Ionicons name="remove" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <View style={styles.budgetCenterBox}>
                    <Text style={styles.budgetValueText}>{profile.dailyCarbonBudget || 3.5}</Text>
                    <Text style={styles.budgetUnitText}>kg CO₂e / day</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleBudgetIncrement(0.5)}
                    style={styles.budgetStepBtn}
                  >
                    <Ionicons name="add" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </GlassCard>

              {/* Diet Choice */}
              <GlassCard style={styles.prefCard}>
                <Text style={styles.prefSectionTitle}>Dietary Restriction</Text>
                <View style={styles.chipsRow}>
                  {(['vegetarian', 'vegan', 'non_vegetarian', 'pescatarian'] as DietType[]).map(d => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => handleDietChange(d)}
                      style={[styles.chip, profile.diet === d && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, profile.diet === d && styles.chipTextActive]}>
                        {d.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>

              {/* Spice Preference */}
              <GlassCard style={styles.prefCard}>
                <Text style={styles.prefSectionTitle}>Spice Heat Preference</Text>
                <View style={styles.chipsRow}>
                  {(['mild', 'medium', 'spicy'] as SpiceLevel[]).map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => handleSpiceChange(s)}
                      style={[styles.chip, profile.spicePreference === s && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, profile.spicePreference === s && styles.chipTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>

              {/* Budget Level */}
              <GlassCard style={styles.prefCard}>
                <Text style={styles.prefSectionTitle}>Typical Dining Budget</Text>
                <View style={styles.chipsRow}>
                  {(['budget', 'medium', 'premium'] as BudgetLevel[]).map(b => (
                    <TouchableOpacity
                      key={b}
                      onPress={() => handleBudgetChange(b)}
                      style={[styles.chip, profile.budgetLevel === b && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, profile.budgetLevel === b && styles.chipTextActive]}>
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>

              {/* Badges Earned */}
              <GlassCard style={styles.prefCard}>
                <Text style={styles.prefSectionTitle}>Unlocked Badges ({badges.filter(b => b.unlockedAt).length}/{badges.length})</Text>
                <View style={styles.badgeGrid}>
                  {badges.map(badge => {
                    const isUnlocked = Boolean(badge.unlockedAt);
                    return (
                      <View
                        key={badge.id}
                        style={[styles.badgeBox, isUnlocked && styles.badgeBoxUnlocked]}
                      >
                        <Ionicons
                          name={badge.icon as any}
                          size={24}
                          color={isUnlocked ? colors.primaryTeal : colors.textMuted}
                        />
                        <Text style={[styles.badgeTitle, isUnlocked && styles.badgeTitleUnlocked]}>
                          {badge.title}
                        </Text>
                        <Text style={styles.badgeDesc} numberOfLines={2}>
                          {badge.description}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </GlassCard>

              {/* Reset Onboarding Option */}
              <TouchableOpacity
                onPress={() => router.push('/onboarding')}
                style={styles.reopenOnboardingBtn}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.reopenOnboardingText}>Run Full Setup Wizard Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SECTION 2: MEAL HISTORY */}
          {activeSection === 'history' && (
            <View style={styles.sectionWrap}>
              {history.length > 0 ? (
                <View style={styles.historyActionsRow}>
                  <Text style={styles.historyTotalText}>
                    {history.length} {history.length === 1 ? 'Meal' : 'Meals'} Logged
                  </Text>
                  <TouchableOpacity onPress={handleConfirmClearHistory}>
                    <Text style={styles.clearHistoryText}>Clear History</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {history.length === 0 ? (
                <EmptyState
                  icon="time-outline"
                  title="No Meal History"
                  description="All meals you scan and confirm will be tracked here with comprehensive carbon footprints."
                  actionLabel="Scan a Meal Now"
                  onAction={() => router.push('/(tabs)/scan')}
                />
              ) : (
                <View style={styles.historyList}>
                  {history.map(meal => (
                    <GlassCard key={meal.id} style={styles.historyCard}>
                      <View style={styles.historyCardRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyDishName}>{meal.dishName}</Text>
                          <Text style={styles.historySub}>
                            {new Date(meal.timestamp).toLocaleDateString()} • {meal.portionGrams}g portion
                          </Text>
                          <Text style={styles.historySource}>{meal.source || 'Decomposition Model'}</Text>
                        </View>
                        <View style={styles.historyRightCol}>
                          <CO2eBadge value={meal.totalCo2e} size="sm" />
                          <TouchableOpacity
                            onPress={() => deleteMeal(meal.id)}
                            style={styles.deleteMealBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* SECTION 3: MODEL CARD */}
          {activeSection === 'model_card' && (
            <View style={styles.sectionWrap}>
              {/* Architecture Intro */}
              <GlassCard variant="active" style={styles.modelHeaderCard}>
                <View style={styles.modelHeaderTop}>
                  <Ionicons name="hardware-chip-outline" size={24} color={colors.primaryTeal} />
                  <Text style={styles.modelHeaderTitle}>Dual-Detector Architecture</Text>
                </View>
                <Text style={styles.modelHeaderDesc}>
                  CarbonIQ combines a cloud Multimodal Foundation model (Gemini 2.5 Flash) with an on-premise hosted neural classifier via parallel consensus fusion.
                </Text>
              </GlassCard>

              {/* Gemini Vision Card */}
              <GlassCard style={styles.modelDetailCard}>
                <View style={styles.modelTitleRow}>
                  <View style={styles.modelBadgePill}>
                    <Text style={styles.modelBadgeText}>PRIMARY DETECTOR</Text>
                  </View>
                  <Text style={styles.modelName}>{DUAL_MODEL_CARD.geminiVision.name}</Text>
                </View>
                <Text style={styles.modelArchText}>{DUAL_MODEL_CARD.geminiVision.architecture}</Text>

                <View style={styles.metricGrid}>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Top-1 Accuracy</Text>
                    <Text style={styles.metricValue}>
                      {Math.round(DUAL_MODEL_CARD.geminiVision.top1Accuracy * 100)}%
                    </Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>F1 Score</Text>
                    <Text style={styles.metricValue}>{DUAL_MODEL_CARD.geminiVision.f1Score}</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Classes</Text>
                    <Text style={styles.metricValue}>{DUAL_MODEL_CARD.geminiVision.classesCount}+</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Inference Latency</Text>
                    <Text style={styles.metricValue}>{DUAL_MODEL_CARD.geminiVision.inferenceLatencyMs}ms</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Custom FastAPI Model Card */}
              <GlassCard style={styles.modelDetailCard}>
                <View style={styles.modelTitleRow}>
                  <View style={[styles.modelBadgePill, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Text style={[styles.modelBadgeText, { color: colors.electricBlue }]}>SECONDARY DETECTOR</Text>
                  </View>
                  <Text style={styles.modelName}>{DUAL_MODEL_CARD.customFastAPI.name}</Text>
                </View>
                <Text style={styles.modelArchText}>{DUAL_MODEL_CARD.customFastAPI.architecture}</Text>

                <View style={styles.metricGrid}>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Top-1 Accuracy</Text>
                    <Text style={styles.metricValue}>
                      {Math.round(DUAL_MODEL_CARD.customFastAPI.top1Accuracy * 100)}%
                    </Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Dataset Size</Text>
                    <Text style={styles.metricValue}>
                      {DUAL_MODEL_CARD.customFastAPI.datasetSamples.toLocaleString()} imgs
                    </Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>Target Dishes</Text>
                    <Text style={styles.metricValue}>{DUAL_MODEL_CARD.customFastAPI.classesCount}</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>FastAPI Latency</Text>
                    <Text style={styles.metricValue}>{DUAL_MODEL_CARD.customFastAPI.inferenceLatencyMs}ms</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Confusion Matrix Table */}
              <GlassCard style={styles.modelDetailCard}>
                <Text style={styles.prefSectionTitle}>Validation Confusion Matrix (%)</Text>
                <Text style={styles.prefSectionSubtitle}>
                  Predictions across high/low carbon benchmark categories
                </Text>
                <View style={styles.matrixContainer}>
                  <View style={styles.matrixHeaderRow}>
                    <Text style={[styles.matrixHeaderCell, { width: 75 }]}>Class</Text>
                    {DUAL_MODEL_CARD.customFastAPI.confusionMatrix.classes.map((c, i) => (
                      <Text key={i} style={styles.matrixHeaderCell} numberOfLines={1}>
                        {c.substring(0, 4)}
                      </Text>
                    ))}
                  </View>
                  {DUAL_MODEL_CARD.customFastAPI.confusionMatrix.matrix.map((row, rIdx) => (
                    <View key={rIdx} style={styles.matrixRow}>
                      <Text style={[styles.matrixLabelCell, { width: 75 }]} numberOfLines={1}>
                        {DUAL_MODEL_CARD.customFastAPI.confusionMatrix.classes[rIdx]}
                      </Text>
                      {row.map((val, cIdx) => (
                        <View
                          key={cIdx}
                          style={[
                            styles.matrixCell,
                            {
                              backgroundColor:
                                rIdx === cIdx
                                  ? 'rgba(45, 212, 191, 0.25)'
                                  : val > 0
                                  ? 'rgba(239, 68, 68, 0.1)'
                                  : 'transparent',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.matrixValText,
                              rIdx === cIdx && { color: colors.primaryTeal, fontWeight: '700' },
                            ]}
                          >
                            {val}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </GlassCard>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  avatarBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 2,
    borderColor: colors.primaryTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarBigText: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.heavy,
    color: colors.primaryTeal,
  },
  profileTitleCol: {
    flex: 1,
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.h3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    flex: 1,
  },
  saveNameBtn: {
    backgroundColor: colors.primaryTeal,
    padding: 6,
    borderRadius: radius.sm,
  },
  profileNameText: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  profileSubText: {
    fontSize: typography.sizes.micro,
    color: colors.primaryTeal,
    fontWeight: typography.weights.bold,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.full,
  },
  segmentBtnActive: {
    backgroundColor: colors.primaryTeal,
  },
  segmentBtnText: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  segmentBtnTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl * 1.5,
  },
  sectionWrap: {
    gap: spacing.base,
  },
  prefCard: {},
  prefSectionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  prefSectionSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginVertical: spacing.xs,
  },
  budgetStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCenterBox: {
    alignItems: 'center',
  },
  budgetValueText: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.heavy,
    color: colors.primaryTeal,
  },
  budgetUnitText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  chipActive: {
    backgroundColor: colors.primaryTeal,
    borderColor: colors.primaryTeal,
  },
  chipText: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badgeBox: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  badgeBoxUnlocked: {
    borderColor: 'rgba(45, 212, 191, 0.35)',
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  badgeTitle: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  badgeTitleUnlocked: {
    color: colors.primaryTeal,
  },
  badgeDesc: {
    fontSize: typography.sizes.micro,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  reopenOnboardingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 6,
  },
  reopenOnboardingText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  historyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  historyTotalText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  clearHistoryText: {
    fontSize: typography.sizes.caption,
    color: colors.error,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {},
  historyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDishName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  historySub: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historySource: {
    fontSize: typography.sizes.micro,
    color: colors.textMuted,
    marginTop: 1,
  },
  historyRightCol: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  deleteMealBtn: {
    padding: 4,
  },
  modelHeaderCard: {},
  modelHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  modelHeaderTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.heavy,
    color: colors.primaryTeal,
  },
  modelHeaderDesc: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.callout,
  },
  modelDetailCard: {},
  modelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  modelBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderRadius: radius.full,
  },
  modelBadgeText: {
    fontSize: typography.sizes.micro,
    color: colors.primaryTeal,
    fontWeight: typography.weights.bold,
  },
  modelName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modelArchText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCell: {
    width: '48%',
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.sm,
  },
  metricLabel: {
    fontSize: typography.sizes.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
    marginTop: 2,
  },
  matrixContainer: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  matrixHeaderCell: {
    flex: 1,
    fontSize: typography.sizes.micro,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  matrixLabelCell: {
    fontSize: typography.sizes.micro,
    color: colors.textMuted,
  },
  matrixCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 2,
  },
  matrixValText: {
    fontSize: typography.sizes.micro,
    color: colors.textSecondary,
  },
});
