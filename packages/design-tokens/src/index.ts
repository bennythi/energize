/**
 * Das eigentliche Produkt dieses Pakets ist theme.css (Tailwind-v4-@theme-Block).
 * Er ist die einzige Quelle der Wahrheit fuer alle Design-Tokens und wird von
 * den Apps via '@platform/design-tokens/theme.css' importiert.
 *
 * Es gibt bewusst KEINE parallelen JS-Token-Konstanten mehr (die frueheren
 * colors.ts/tokens.css sind entfernt, um Drift zu vermeiden). Falls JS je einen
 * Token-Wert zur Laufzeit braucht, ist der richtige Weg getComputedStyle auf
 * die CSS-Variable, nicht eine handgepflegte Kopie.
 */
export {};
