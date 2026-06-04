// adapter-static: alles wird zur Build-Zeit prerendered.
// SSR ausgeschaltet, weil wir auf einem Apache/Nginx ohne Node-Process ausliefern.
// Sanity-Inhalte werden im build entries() resolviert (kommt in Phase 3).
export const prerender = true;
export const ssr = false;
