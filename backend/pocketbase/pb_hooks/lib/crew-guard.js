// Feinschutz der Crew-Collections (Port der Supabase-RLS-Policies aus 0013/0015/0018).
// Die API-Regeln der Collections verlangen nur einen Login; welche Aktion
// erlaubt ist, entscheidet check() hier ueber crewCan() aus permissions.js.
// Eingebunden von crew.guard.pb.js (Handler laufen isoliert, daher require()).

const perms = require(`${__hooks}/lib/permissions.js`);

/** Aktion -> benoetigtes Level, wenn eine Collection nichts Eigenes definiert. */
const DEFAULT_LEVEL = {
  list: 'read',
  view: 'read',
  create: 'write',
  update: 'write',
  delete: 'delete',
};

function isShiftOpen(app, shiftId) {
  try {
    const s = app.findRecordById('cashless_shifts', shiftId);
    return !s.getString('closed_at');
  } catch (e) {
    return false;
  }
}

// Eigene Eintraege (Kalender, Funk): lesen mit read, eigene anlegen/aendern mit
// write, fremde loeschen nur mit delete.
function ownRows(resource) {
  return {
    resource,
    create: (c) => c.can('write') && c.record.getString('user') === c.authId,
    update: (c) =>
      c.can('write') &&
      c.original.getString('user') === c.authId &&
      c.record.getString('user') === c.authId,
    delete: (c) => (c.can('write') && c.record.getString('user') === c.authId) || c.can('delete'),
  };
}

const POLICIES = {
  crew_availability: ownRows('crew.kalender'),
  crew_equipment_requests: ownRows('crew.fungeraete'),

  crew_briefings: { resource: 'crew.briefings' },
  crew_milestones: { resource: 'crew.meilensteine' },

  // Stammdaten der Kassen pflegt nur ein Admin.
  cashless_registers: {
    resource: 'crew.kasse',
    create: (c) => c.admin,
    update: (c) => c.admin,
    delete: (c) => c.admin,
  },
  cashless_shifts: {
    resource: 'crew.kasse',
    create: (c) =>
      c.can('write') &&
      (c.record.getString('opened_by_a') === c.authId ||
        c.record.getString('opened_by_b') === c.authId),
  },
  cashless_shift_denominations: {
    resource: 'crew.kasse',
    // End-Bestand darf noch beim Schliessen geschrieben werden.
    create: (c) =>
      c.can('write') &&
      (c.record.getString('kind') === 'end' || isShiftOpen(c.app, c.record.getString('shift'))),
    update: (c) => c.can('write') && isShiftOpen(c.app, c.record.getString('shift')),
  },
  cashless_movements: {
    resource: 'crew.kasse',
    create: (c) =>
      c.can('write') &&
      isShiftOpen(c.app, c.record.getString('shift')) &&
      (c.record.getString('performed_by_a') === c.authId ||
        c.record.getString('performed_by_b') === c.authId),
    update: (c) => c.admin,
  },

  booking_editions: { resource: 'crew.booking' },
  booking_artists: { resource: 'crew.booking' },
  booking_items: { resource: 'crew.booking' },
};

/** Ist die Collection durch den Guard geschuetzt? */
function guarded(collectionName) {
  return Object.prototype.hasOwnProperty.call(POLICIES, collectionName);
}

/**
 * Prueft eine Aktion. Wirft ForbiddenError, wenn sie nicht erlaubt ist.
 * action: list | view | create | update | delete
 */
function check(app, authId, action, collectionName, record) {
  const policy = POLICIES[collectionName];
  if (!policy) return;
  if (!authId) throw new ForbiddenError('Nicht eingeloggt.');

  const admin = perms.isAdmin(app, authId);
  const ctx = {
    app,
    authId,
    admin,
    record,
    original: record && action === 'update' ? record.original() : record,
    can: (level) => admin || perms.crewCan(app, authId, policy.resource, level),
  };

  const rule = policy[action];
  const ok = typeof rule === 'function' ? rule(ctx) : ctx.can(DEFAULT_LEVEL[action]);
  if (!ok) throw new ForbiddenError('Keine Berechtigung fuer diese Aktion.');
}

/** Lesezugriff auf eine Collection (fuer Realtime und Datei-Downloads). */
function canRead(app, authId, collectionName) {
  const policy = POLICIES[collectionName];
  if (!policy) return true;
  if (!authId) return false;
  return perms.crewCan(app, authId, policy.resource, 'read');
}

module.exports = { POLICIES, guarded, check, canRead };
