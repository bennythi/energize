import type { Locale, LocalizedString, LocalizedText } from './types.js';

/**
 * Holt das Sprach-Feld aus einem localized object, mit Fallback auf DE.
 * Empty strings werden als "missing" behandelt — sonst wuerde z.B. ein
 * leerer EN-String den DE-Fallback blockieren und User sehen blanks.
 * Gibt undefined zurück, wenn weder die gewünschte noch DE noch EN gesetzt sind.
 */
export function pickLocale(
  obj: LocalizedString | LocalizedText | null | undefined,
  locale: Locale,
): string | undefined {
  if (!obj) return undefined;
  const wanted = obj[locale];
  if (wanted && wanted.trim()) return wanted;
  if (obj.de && obj.de.trim()) return obj.de;
  if (obj.en && obj.en.trim()) return obj.en;
  return undefined;
}

/**
 * Variant für Required-Fallback — wirft, wenn nichts da ist.
 */
export function pickLocaleStrict(obj: LocalizedString | LocalizedText, locale: Locale): string {
  const v = pickLocale(obj, locale);
  if (v === undefined) {
    throw new Error('LocalizedField hat weder DE noch EN noch ' + locale);
  }
  return v;
}
