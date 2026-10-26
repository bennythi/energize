// Datenzugriff fuer die Cashless-Kassen (Pocketbase). Feinrechte prueft
// serverseitig der Crew-Guard (pb_hooks/lib/crew-guard.js, Resource crew.kasse).
import { auth } from '$lib/auth.svelte';
import type { MovementKind } from './summary';

export interface Register {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
}

export interface Shift {
  id: string;
  register: string;
  opened_at: string;
  opened_by_a: string;
  opened_by_b: string;
  closed_at: string;
  closed_by_a: string;
  closed_by_b: string;
  starting_cents: number;
  ending_cents: number;
  has_ending: boolean;
  note: string;
  expand?: { register?: Register };
}

export interface Movement {
  id: string;
  shift: string;
  kind: MovementKind;
  amount_cents: number;
  counterpart_register: string;
  performed_at: string;
  performed_by_a: string;
  performed_by_b: string;
  note: string;
}

export interface DenominationRow {
  id: string;
  shift: string;
  kind: 'start' | 'end';
  denomination_cents: number;
  count: number;
}

function pb() {
  if (!auth.pb) throw new Error('Backend ist nicht bereit.');
  return auth.pb;
}

function me(): string {
  const id = auth.user?.id;
  if (!id) throw new Error('Nicht eingeloggt.');
  return id;
}

/** Leerer PB-Datumsstring = nicht gesetzt. */
export function isOpen(shift: Pick<Shift, 'closed_at'>): boolean {
  return !shift.closed_at;
}

export async function listRegisters(): Promise<Register[]> {
  const rows = await pb().collection('cashless_registers').getFullList({ sort: 'name' });
  return rows as unknown as Register[];
}

export async function listOpenShifts(): Promise<Shift[]> {
  const rows = await pb()
    .collection('cashless_shifts')
    .getFullList({ filter: 'closed_at = ""', sort: '-opened_at' });
  return rows as unknown as Shift[];
}

export async function listRecentClosedShifts(limit = 20): Promise<Shift[]> {
  const res = await pb()
    .collection('cashless_shifts')
    .getList(1, limit, { filter: 'closed_at != ""', sort: '-closed_at', expand: 'register' });
  return res.items as unknown as Shift[];
}

export async function getShift(id: string): Promise<Shift> {
  const row = await pb().collection('cashless_shifts').getOne(id, { expand: 'register' });
  return row as unknown as Shift;
}

export async function listMovements(shiftIds: string[]): Promise<Movement[]> {
  if (shiftIds.length === 0) return [];
  const client = pb();
  const filter = shiftIds.map((id) => client.filter('shift = {:id}', { id })).join(' || ');
  const rows = await client
    .collection('cashless_movements')
    .getFullList({ filter, sort: 'performed_at' });
  return rows as unknown as Movement[];
}

export async function listDenominations(shiftId: string): Promise<DenominationRow[]> {
  const client = pb();
  const rows = await client.collection('cashless_shift_denominations').getFullList({
    filter: client.filter('shift = {:id}', { id: shiftId }),
    sort: '-denomination_cents',
  });
  return rows as unknown as DenominationRow[];
}

function nonZero(counts: Record<number, number>): [number, number][] {
  return Object.entries(counts)
    .map(([c, n]) => [Number(c), n || 0] as [number, number])
    .filter(([, n]) => n > 0);
}

/**
 * Schicht eroeffnen: Schicht anlegen, danach Start-Stueckelung schreiben.
 * Gibt die neue Schicht-ID zurueck.
 */
export async function openShift(input: {
  register: string;
  partner: string;
  counts: Record<number, number>;
  startingCents: number;
}): Promise<string> {
  const client = pb();
  const userId = me();
  if (!input.partner || input.partner === userId) {
    throw new Error('Bitte einen zweiten Kassierer waehlen.');
  }
  // Pro Kasse nur eine offene Schicht (PB erzwingt das nicht selbst).
  const open = await client.collection('cashless_shifts').getList(1, 1, {
    filter: client.filter('register = {:r} && closed_at = ""', { r: input.register }),
  });
  if (open.totalItems > 0) {
    throw new Error('Fuer diese Kasse ist bereits eine Schicht offen.');
  }
  const shift = await client.collection('cashless_shifts').create({
    register: input.register,
    opened_at: new Date().toISOString(),
    opened_by_a: userId,
    opened_by_b: input.partner,
    starting_cents: input.startingCents,
    has_ending: false,
  });
  for (const [cents, count] of nonZero(input.counts)) {
    await client.collection('cashless_shift_denominations').create({
      shift: shift.id,
      kind: 'start',
      denomination_cents: cents,
      count,
    });
  }
  return shift.id;
}

export async function addMovement(input: {
  shift: string;
  kind: MovementKind;
  amountCents: number;
  counterpart: string;
  partner: string;
  note: string;
}): Promise<void> {
  const userId = me();
  if (!input.partner || input.partner === userId) {
    throw new Error('Bitte einen zweiten Kassierer waehlen.');
  }
  await pb()
    .collection('cashless_movements')
    .create({
      shift: input.shift,
      kind: input.kind,
      amount_cents: input.amountCents,
      counterpart_register: input.kind === 'withdrawal' ? '' : input.counterpart,
      performed_at: new Date().toISOString(),
      performed_by_a: userId,
      performed_by_b: input.partner,
      note: input.note.trim(),
    });
}

/**
 * Schicht schliessen. Reihenfolge ist wichtig: erst End-Stueckelung schreiben
 * (Updates gehen nur bei offener Schicht), dann die Schicht schliessen.
 * Bereits vorhandene End-Zeilen (abgebrochener Versuch) werden aktualisiert.
 */
export async function closeShift(input: {
  shift: Shift;
  partner: string;
  counts: Record<number, number>;
  endingCents: number;
  note: string;
}): Promise<void> {
  const client = pb();
  const userId = me();
  if (!input.partner || input.partner === userId) {
    throw new Error('Bitte einen zweiten Kassierer waehlen.');
  }
  const existing = (await listDenominations(input.shift.id)).filter((r) => r.kind === 'end');
  const byCents = new Map(existing.map((r) => [r.denomination_cents, r]));
  const wanted = new Map(nonZero(input.counts));

  for (const [cents, count] of wanted) {
    const row = byCents.get(cents);
    if (row) {
      if (row.count !== count) {
        await client.collection('cashless_shift_denominations').update(row.id, { count });
      }
    } else {
      await client.collection('cashless_shift_denominations').create({
        shift: input.shift.id,
        kind: 'end',
        denomination_cents: cents,
        count,
      });
    }
  }
  // Reste eines frueheren Versuchs auf 0 setzen (Loeschen erlaubt PB nicht).
  for (const row of existing) {
    if (!wanted.has(row.denomination_cents) && row.count !== 0) {
      await client.collection('cashless_shift_denominations').update(row.id, { count: 0 });
    }
  }

  await client.collection('cashless_shifts').update(input.shift.id, {
    closed_at: new Date().toISOString(),
    closed_by_a: userId,
    closed_by_b: input.partner,
    ending_cents: input.endingCents,
    has_ending: true,
    note: input.note.trim() || input.shift.note,
  });
}
