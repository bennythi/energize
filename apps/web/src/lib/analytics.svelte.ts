// Plausible Analytics, self-hosted unter plausible.blackout24.de.
// Cookie-frei, DSGVO-konform, kein PII.
//
// Laedt nur auf der Produktionsdomain. Lokal (localhost), Preview-Builds
// und alle anderen Subdomains bleiben untracked.

const PLAUSIBLE_HOST = 'https://plausible.blackout24.de';
const PROD_HOSTS = ['energize.blackout42.de', 'www.energize-festival.de'];

let injected = false;

export function initAnalytics() {
  if (injected) return;
  if (typeof window === 'undefined') return;

  const host = window.location.hostname;
  if (!PROD_HOSTS.includes(host)) return;

  injected = true;

  const s = document.createElement('script');
  s.defer = true;
  s.setAttribute('data-domain', host);
  s.src = `${PLAUSIBLE_HOST}/js/script.js`;
  document.head.appendChild(s);

  // window.plausible() fuer Custom-Events bereitstellen, bevor das
  // Script geladen ist. Plausible-Snippet uebernimmt danach.
  // Stub-Pattern aus der Plausible-Doku.
  type PlausibleQueueEntry = [string, Record<string, unknown>?];
  interface PlausibleStub {
    (event: string, opts?: Record<string, unknown>): void;
    q?: PlausibleQueueEntry[];
  }
  const w = window as Window & { plausible?: PlausibleStub };
  if (!w.plausible) {
    const stub: PlausibleStub = ((event: string, opts?: Record<string, unknown>) => {
      (stub.q = stub.q || []).push([event, opts]);
    }) as PlausibleStub;
    w.plausible = stub;
  }
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  const w = window as Window & {
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
  };
  w.plausible?.(name, props ? { props } : undefined);
}
