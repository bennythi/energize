import { browser } from '$app/environment';
import { isAvailableLanguageTag, setLanguageTag } from '@energize/i18n';
import { auth } from '$lib/auth.svelte';

// adapter-static: alles wird zur Build-Zeit prerendered.
// SSR ausgeschaltet, weil wir auf einem Apache/Nginx ohne Node-Process ausliefern.
// trailingSlash 'always' → jede Route wird als <name>/index.html abgelegt
// (statt <name>.html), das vermeidet auf Apache den Konflikt zwischen einem
// flat <name>.html und einem gleichnamigen Subordner (z. B. tickets.html
// vs tickets/buy.html).
export const prerender = true;
export const ssr = false;
export const trailingSlash = 'always';

// Beim Client-Start (Module-Init, läuft VOR dem Component-Render):
// 1) Persistierte Sprache aus localStorage → setLanguageTag().
// 2) Auth-Store initialisieren — Supabase muss VOR jedem Component
//    rendern wenn `getSession()` (für die PKCE-URL-Detection) lebt.
//    Sonst Race-Conditions: Login-Form flackert für eingeloggte User,
//    /auth/callback verfehlt die Token-Detection auf langsamen Mobiles,
//    Auth-Guards in /account|/feedback|/wall/upload zeigen die Seite
//    1 Frame bevor sie redirecten.
if (browser) {
  try {
    const stored = localStorage.getItem('energize.lang');
    if (stored && isAvailableLanguageTag(stored)) {
      setLanguageTag(stored);
    }
  } catch {
    // iOS Safari Private Mode wirft auf localStorage-Zugriffe
  }

  auth.init();
}
