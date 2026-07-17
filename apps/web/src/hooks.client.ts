import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';
import type { HandleClientError } from '@sveltejs/kit';

// Sentry nur auf Produktionsdomains aktivieren. Local-Dev und Preview-Builds
// schicken keine Events.
const PROD_HOSTS = ['energize.blackout42.de', 'www.energize-festival.de'];

const dsn = env.PUBLIC_SENTRY_DSN;
const enabled =
  Boolean(dsn) && typeof window !== 'undefined' && PROD_HOSTS.includes(window.location.hostname);

if (enabled) {
  Sentry.init({
    dsn,
    environment: 'production',
    tracesSampleRate: 0,
    sendDefaultPii: false,
    integrations: [],
  });
}

export const handleError: HandleClientError = ({ error, event }) => {
  if (enabled) {
    Sentry.captureException(error, {
      contexts: { sveltekit: { route: event.route.id ?? 'unknown' } },
    });
  }
  return undefined;
};
