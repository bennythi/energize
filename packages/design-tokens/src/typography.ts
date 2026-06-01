/**
 * Typography tokens — Display-Font ist BarlowCondensed Black (analog zur 2026er-App-Spec).
 * Body bleibt Inter bis Wix-Inspect oder Designer anderes liefert.
 */
export const typography = {
  fontFamily: {
    display: '"Barlow Condensed", "Arial Narrow", sans-serif',
    body: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "Cascadia Code", monospace',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    bold: 700,
    black: 900,
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
    '4xl': '4rem',
    '5xl': '6rem',
    hero: 'clamp(3rem, 10vw, 7.5rem)',
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.05em',
    claim: '0.1em',
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;
