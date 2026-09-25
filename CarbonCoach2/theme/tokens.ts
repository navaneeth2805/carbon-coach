/**
 * CarbonIQ Central Design System & Theme Tokens
 * Dark, glassmorphic, futuristic-tech aesthetic.
 */

export const colors = {
  // Backgrounds
  background: '#0B0F14',
  backgroundElevated: '#121820',
  backgroundOverlay: 'rgba(11, 15, 20, 0.85)',
  
  // Radial / Linear Gradient stops
  gradientDarkStart: '#131C26',
  gradientDarkEnd: '#070A0E',

  // Glassmorphic Surfaces
  glassBackground: 'rgba(255, 255, 255, 0.07)',
  glassBackgroundHover: 'rgba(255, 255, 255, 0.11)',
  glassBackgroundSubtle: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassBorderActive: 'rgba(45, 212, 191, 0.45)',

  // Accents (Teal & Electric Blue)
  primaryTeal: '#2DD4BF', // Tailwind teal-400
  primaryTealDark: '#14B8A6', // Tailwind teal-500
  primaryTealGlow: 'rgba(45, 212, 191, 0.25)',
  
  electricBlue: '#3B82F6', // Tailwind blue-500
  electricBlueDark: '#2563EB', // Tailwind blue-600
  electricBlueGlow: 'rgba(59, 130, 246, 0.25)',

  // Semantic Status Colors
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Red-500
  info: '#06B6D4', // Cyan

  // Text Colors
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0F14',
  textTeal: '#2DD4BF',

  // CO2e Impact Grading Colors
  impactLow: '#10B981',      // < 1.0 kg CO2e
  impactModerate: '#F59E0B', // 1.0 - 2.5 kg CO2e
  impactHigh: '#EF4444',     // > 2.5 kg CO2e

  // Card & Component Accents
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  cardBorderHighlight: 'rgba(45, 212, 191, 0.35)',
  divider: 'rgba(255, 255, 255, 0.08)',
};

export const typography = {
  // Font sizes
  sizes: {
    hero: 44,
    display: 32,
    h1: 26,
    h2: 20,
    h3: 17,
    body: 15,
    callout: 13,
    caption: 11,
    micro: 10,
  },
  // Font weights
  weights: {
    heavy: '800' as const,
    bold: '700' as const,
    semibold: '600' as const,
    medium: '500' as const,
    regular: '400' as const,
  },
  // Line heights
  lineHeights: {
    hero: 50,
    display: 38,
    h1: 32,
    h2: 26,
    h3: 22,
    body: 21,
    callout: 18,
    caption: 14,
  },
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  card: 18,
  lg: 22,
  full: 9999,
};

export const shadows = {
  glowTeal: {
    shadowColor: colors.primaryTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  glowBlue: {
    shadowColor: colors.electricBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  subtleCard: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
};
