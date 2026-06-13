import { browser } from '$app/environment';
import { isAvailableLanguageTag, setLanguageTag } from '@energize/i18n';

// adapter-static: alles wird zur Build-Zeit prerendered.
// SSR ausgeschaltet, weil wir auf einem Apache/Nginx ohne Node-Process ausliefern.
// trailingSlash 'always' → jede Route wird als <name>/index.html abgelegt
// (statt <name>.html), das vermeidet auf Apache den Konflikt zwischen einem
// flat <name>.html und einem gleichnamigen Subordner (z. B. tickets.html
// vs tickets/buy.html).
export const prerender = true;
export const ssr = false;
export const trailingSlash = 'always';

// Beim Client-Start (Module-Init, läuft VOR dem Component-Render)
// die in localStorage gespeicherte Sprache anwenden. Damit ist
// languageTag() schon korrekt, bevor irgend ein m.xxx()-Aufruf
// passiert — kein zweiter Reload nötig.
if (browser) {
  const stored = localStorage.getItem('energize.lang');
  if (stored && isAvailableLanguageTag(stored)) {
    setLanguageTag(stored);
  }
}
