import { auth } from '$lib/auth.svelte';

export interface CheckoutResponse {
  order: string;
  checkout_url: string;
}

export interface ScanResponse {
  // 'error' ist client-synthetisch (Netz-/Serverfehler) und NICHT mit einem
  // echten Fake-Ticket ('invalid') zu verwechseln.
  result: 'valid' | 'already_used' | 'invalid' | 'error';
  ticket_type?: string;
  holder_name?: string;
  used_at?: string;
  gate?: string;
  reason?: string;
}

/** Startet den Checkout: Order + Reservierung + Payment-Intent (serverseitig). */
export async function checkout(
  items: { ticket_type: string; qty: number }[],
  provider?: string,
): Promise<CheckoutResponse> {
  if (!auth.pb) throw new Error('Shop ist nicht bereit.');
  return auth.pb.send<CheckoutResponse>('/api/shop/checkout', {
    method: 'POST',
    body: { items, provider },
  });
}

/** Nur Stub-Modus: simuliert die Zahlung (lokales Testen ohne Mollie/Stripe). */
export async function devComplete(order: string): Promise<{ ok: boolean }> {
  if (!auth.pb) throw new Error('Shop ist nicht bereit.');
  return auth.pb.send('/api/shop/dev/complete', { method: 'POST', body: { order } });
}

/** Einlass-Scan (Crew): validiert + entwertet ein Ticket-Token. */
export async function scanTicket(token: string, gate?: string): Promise<ScanResponse> {
  if (!auth.pb) throw new Error('Shop ist nicht bereit.');
  return auth.pb.send<ScanResponse>('/api/shop/scan', { method: 'POST', body: { token, gate } });
}

/** Formatiert Cents als Euro-String. */
export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(cents / 100);
}
