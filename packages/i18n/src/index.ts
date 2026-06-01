/**
 * Re-export the Paraglide-generated runtime.
 *
 * The Paraglide compiler writes to ./paraglide/ at build time (or postinstall).
 * If you see TypeScript errors here, run `pnpm --filter @energize/i18n build` first.
 */
// @ts-expect-error — generated at build time
export * as m from './paraglide/messages.js';
// @ts-expect-error — generated at build time
export {
  availableLanguageTags,
  sourceLanguageTag,
  languageTag,
  setLanguageTag,
  onSetLanguageTag,
  isAvailableLanguageTag,
} from './paraglide/runtime.js';

export type AvailableLanguageTag = 'de' | 'en';
