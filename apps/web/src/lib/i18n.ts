import { browser } from '$app/environment';
import { languageTag } from '@platform/i18n';

// Zweisprachigkeit fuer den Orga-Bereich ohne Paraglide-Keys: Texte stehen
// direkt im Code als t('Deutsch', 'English'). Die Sprache wechselt nur per
// Reload (Toggle im Layout), daher reicht es, sie einmal zu bestimmen.
// Bewusst direkt aus localStorage gelesen: Modul-Konstanten (Label-Maps)
// koennen ausgewertet werden, bevor +layout.ts setLanguageTag() aufruft.

const LANG_STORAGE_KEY = 'energize.lang';

function detect(): 'de' | 'en' {
  if (browser) {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === 'en' || stored === 'de') return stored;
    } catch {
      // Private Mode: localStorage nicht verfuegbar
    }
  }
  return languageTag() === 'en' ? 'en' : 'de';
}

export const lang: 'de' | 'en' = detect();
export const isEn = lang === 'en';

/** Text in der aktiven Sprache. */
export function t(de: string, en: string): string {
  return isEn ? en : de;
}

/** Locale fuer toLocaleDateString / Intl.NumberFormat. */
export const locale = isEn ? 'en-GB' : 'de-DE';
