/**
 * Shadow / Glow tokens.
 * Glow nutzt Energize Yellow (#FFEC00) als Akzent — passend zur Brand-Regel
 * „Gelb auf Schwarz = Hero-Look".
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
  md: '0 4px 12px rgba(0, 0, 0, 0.6)',
  lg: '0 12px 40px rgba(0, 0, 0, 0.7)',
  glow: '0 0 24px rgba(255, 236, 0, 0.25)',
  glowStrong: '0 0 48px rgba(255, 236, 0, 0.45)',
} as const;
