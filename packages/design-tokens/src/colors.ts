/**
 * Brand colors — PLATZHALTER bis Wix-Inspect-Werte vorliegen (siehe docs/wix-inspect.md).
 * Default: monochrom Schwarz/Weiß-Hochkontrast wie die aktuelle Wix-Seite.
 */
export const colors = {
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceAlt: '#141414',
  border: '#1F1F1F',
  fg: '#FFFFFF',
  fgMuted: '#A1A1A1',
  /** Akzent — bewusst Weiß bis Brand-Hex geliefert wird */
  accent: '#FFFFFF',
  accentGlow: 'rgba(255, 255, 255, 0.15)',
  success: '#00E08A',
  warn: '#FFC53D',
  danger: '#FF2D2D',
} as const;

export type ColorToken = keyof typeof colors;
