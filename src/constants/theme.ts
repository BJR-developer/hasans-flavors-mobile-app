export const Colors = {
  // Primary Brand Accent - Single refined spice red
  primary: '#B91C1C',
  primaryDark: '#991B1B',
  primaryLight: '#FEF2F2',
  primaryMuted: '#FEE2E2',

  // Status & Brand Neutral Accents
  halalGreen: '#15803D',
  halalGreenLight: '#F0FDF4',
  halalGreenDark: '#166534',

  saffron: '#B45309',
  saffronLight: '#FEF3C7',
  saffronDark: '#78350F',

  // Clean Neutrals
  background: '#FAFAFA',
  card: '#FFFFFF',
  surface: '#F4F4F5',
  surfaceHighlight: '#E4E4E7',
  border: '#E4E4E7',
  borderLight: '#F0F0F2',

  // High-legibility Typography
  text: '#18181B',
  textSecondary: '#52525B',
  textMuted: '#A1A1AA',
  textLight: '#FFFFFF',

  // Status
  success: '#15803D',
  warning: '#B45309',
  error: '#B91C1C',
  info: '#1D4ED8',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.45)',
  glassBg: 'rgba(255, 255, 255, 0.95)',
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    heavy: 'System',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
};
