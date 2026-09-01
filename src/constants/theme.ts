export const Colors = {
  // Brand Colors - Saffron & Spice
  primary: '#D32F2F', // Deep Spice Red
  primaryDark: '#B71C1C',
  primaryLight: '#FFEBEE',
  primaryMuted: '#FFCDD2',

  saffron: '#F57C00', // Saffron Gold
  saffronDark: '#E65100',
  saffronLight: '#FFF3E0',
  saffronAccent: '#FFB300',

  halalGreen: '#2E7D32', // Halal Badge Green
  halalGreenLight: '#E8F5E9',
  halalGreenDark: '#1B5E20',

  // Neutrals & Backgrounds
  background: '#FAF9F8', // Warm Cream
  card: '#FFFFFF',
  surface: '#F4F3F0',
  surfaceHighlight: '#EAE8E3',
  border: '#E8E6E1',
  borderLight: '#F0EFEA',

  // Text Colors
  text: '#1A1A1A',
  textSecondary: '#5A5A5A',
  textMuted: '#8E8E93',
  textLight: '#FFFFFF',

  // Status & Accents
  success: '#2E7D32',
  warning: '#F57C00',
  error: '#D32F2F',
  info: '#1976D2',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  glassBg: 'rgba(255, 255, 255, 0.92)',
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
    xxxl: 30,
    hero: 36,
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
};

export const Shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};
