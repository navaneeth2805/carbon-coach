import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { GlassCard } from '@/components/GlassCard';
import { colors, typography, spacing } from '@/theme/tokens';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>About CarbonCoach</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard variant="active" style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="planet-outline" size={32} color={colors.primaryTeal} />
            </View>
            <Text style={styles.cardTitle}>Real-World Food Footprints</Text>
            <Text style={styles.cardBody}>
              Food accounts for approximately 26% of global greenhouse gas emissions. CarbonCoach bridges the gap between nutrition and climate impact by estimating the embedded CO₂e of your meal plates using computer vision and peer-reviewed agricultural life-cycle analysis.
            </Text>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardSection}>Carbon Calculation Engine</Text>
            <Text style={styles.cardBody}>
              Emission factors are derived from the landmark study by Joseph Poore & Thomas Nemecek (2018), published in Science and curated by Our World in Data. Each ingredient is calculated through farm-gate, land use change, transport, processing, and packaging phases.
            </Text>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardSection}>Dual-Model Detection</Text>
            <Text style={styles.cardBody}>
              Every scan runs Gemini 2.5 Flash Vision in parallel with a hosted FastAPI neural classifier. When both models concur, confidence is boosted; when they diverge, both options are presented transparently to empower user choice.
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.base,
    gap: spacing.base,
  },
  card: {},
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSection: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.primaryTeal,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.callout + 3,
  },
});
