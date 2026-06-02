/**
 * Brand-Farben aus dem offiziellen Energize Style-Guide v0.9 (26.04.2026).
 *
 * Brand-Regeln:
 *   - Gelb auf Schwarz   → höchster Kontrast, Hero-Look (Energize-typisch)
 *   - Schwarz auf Gelb   → "NO_MAINSTREAM_SHIT"-Plakat-Style, ACHTUNG-Boxen
 *   - Gelb auf Weiß      → VERMEIDEN (schlecht lesbar)
 *   - Schwarz auf Weiß   → Standard-Lesetext und Tabellen
 *   - Hot Magenta/Cyan   → NICHT im Schema
 */
export const colors = {
  // Schwarz / Surfaces (Dark-Mode-Basis)
  bg: '#0A0A0A', // Energize Black — Haupt-Hintergrund, Logo, Haupttext
  surface: '#1F1F1F', // Surface Dark — dunkle Container, Akzentflächen
  surfaceAlt: '#0A0A0A',
  border: '#1F1F1F', // im Dark Mode = Surface Dark; im Light Mode → useBorderLight

  // Weiß / helle Variante
  bgLight: '#F5F5F2', // Surface Light — helle Hintergründe, Body
  borderLight: '#DDDDDD', // Border Gray — Trennlinien, Tabellen-Gitter

  // Vordergrund / Text
  fg: '#F5F5F2', // Surface Light als Primärtext auf Dark
  fgInverse: '#0A0A0A', // Energize Black als Text auf Gelb / Weiß
  fgMuted: '#666666', // Text Muted — Sekundärtext, Beschriftungen

  // Akzent
  accent: '#FFEC00', // Energize Yellow — Hauptakzent, Highlight-Banner, CTAs
  accentPure: '#FFFF00', // Pure Yellow — Plakat-Flächen, Logo-Hintergrund
  accentGlow: 'rgba(255, 236, 0, 0.18)',

  // Status
  success: '#22C77B', // Success Green — OK-Status, positive Werte
  warn: '#FFEC00', // Energize Yellow als Warning (kein dediziertes Token im Guide)
  danger: '#E24B4A', // Alert Red — Warnungen, Schließungen
} as const;

export type ColorToken = keyof typeof colors;
