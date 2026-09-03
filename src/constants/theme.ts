export const Colors = {
  // Brand Colors - Saffron & Spice (Stitch Design System)
  primary: '#BA1A20', // Deep Spice Red
  primaryDark: '#8B0000',
  primaryLight: '#FFF2F0',
  primaryMuted: '#FFDAD6',
  primaryContainer: '#D32F2F',

  // Saffron & Warm Accents
  saffron: '#B45309', // Warm Saffron Gold / Amber
  saffronDark: '#5E2C00',
  saffronLight: '#FFF8E1',
  saffronAccent: '#FC820C',

  // Halal & Success Green
  halalGreen: '#2E7D32',
  halalGreenLight: '#E8F5E9',
  halalGreenDark: '#1B5E20',

  // Warm Linen Neutrals (Replacing harsh pitch black with Charcoal)
  background: '#FAF9F8', // Warm linen off-white
  card: '#FFFFFF',
  surface: '#F4F3F2',
  surfaceHighlight: '#EEEEED',
  surfaceCream: '#F9F5F2',
  border: '#E9E8E7',
  borderLight: '#F1F0F0',
  outlineVariant: '#E4BEBA',

  // Typography - Warm Charcoal instead of pitch black
  text: '#2D2926', // Warm Charcoal Text
  textDark: '#1A1C1C',
  textSecondary: '#5B403D', // Warm espresso/charcoal secondary
  textMuted: '#8F6F6C', // Terracotta-tinted muted slate
  textLight: '#FFFFFF',

  // Status & Feedback
  success: '#2E7D32',
  warning: '#B45309',
  error: '#BA1A1A',
  info: '#1565C0',

  // Overlay & Glass
  overlay: 'rgba(45, 41, 38, 0.45)',
  glassBg: 'rgba(255, 255, 255, 0.95)',
};

export const Typography = {
  fontFamily: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    hero: 34,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const Shadows = {
  none: {},
  subtle: {
    shadowColor: '#2D2926',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: '#2D2926',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#2D2926',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowColor: '#2D2926',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
