import type { Locale, LocalizedString, LocalizedText } from './types.js';

/**
 * Holt das Sprach-Feld aus einem localized object, mit Fallback auf DE.
 * Gibt undefined zurück, wenn weder die gewünschte noch DE noch EN gesetzt sind.
 */
export function pickLocale(
  obj: LocalizedString | LocalizedText | null | undefined,
  locale: Locale,
): string | undefined {
  if (!obj) return undefined;
  return obj[locale] ?? obj.de ?? obj.en;
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
