/**
 * Re-export the Paraglide-generated runtime.
 *
 * The Paraglide compiler writes to ./paraglide/ at build time (postinstall script).
 * If you see TypeScript errors here, run `pnpm --filter @energize/i18n build` first.
 */
export * as m from './paraglide/messages.js';
export {
  availableLanguageTags,
  sourceLanguageTag,
  languageTag,
  setLanguageTag,
  onSetLanguageTag,
  isAvailableLanguageTag,
} from './paraglide/runtime.js';

export type AvailableLanguageTag = 'de' | 'en';
