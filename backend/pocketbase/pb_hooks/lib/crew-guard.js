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

/** Hat die Kasse schon eine offene Schicht? */
function hasOpenShift(app, registerId) {
  try {
    app.findFirstRecordByFilter('cashless_shifts', "register = {:r} && closed_at = ''", {
      r: registerId,
    });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Zwei verschiedene Personen, eine davon der eingeloggte User. Die zweite
 * Person braucht selbst Schreibrecht auf die Kasse (sonst koennte man
 * beliebige Accounts als "Zeugen" eintragen).
 */
function isPair(c, fieldA, fieldB) {
  const a = c.record.getString(fieldA);
  const b = c.record.getString(fieldB);
  if (!a || !b || a === b || (a !== c.authId && b !== c.authId)) return false;
  const other = a === c.authId ? b : a;
  return perms.crewCan(c.app, other, 'crew.kasse', 'write');
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
  // Vier-Augen-Prinzip: Oeffnen, Schliessen und Bewegungen immer durch zwei
  // verschiedene Personen, eine davon der eingeloggte User.
  cashless_shifts: {
    resource: 'crew.kasse',
    create: (c) =>
      c.can('write') &&
      isPair(c, 'opened_by_a', 'opened_by_b') &&
      !c.record.getString('closed_at') &&
      !hasOpenShift(c.app, c.record.getString('register')),
    // Nur offene Schichten aendern; Kasse/Eroeffner bleiben fix. Wer schliesst,
    // muss einer der beiden Schliessenden sein.
    update: (c) => {
      if (!c.can('write') || c.original.getString('closed_at')) return false;
      for (const f of ['register', 'opened_by_a', 'opened_by_b', 'opened_at']) {
        if (c.record.getString(f) !== c.original.getString(f)) return false;
      }
      if (c.record.getString('closed_at')) return isPair(c, 'closed_by_a', 'closed_by_b');
      return true;
    },
  },
  cashless_shift_denominations: {
    resource: 'crew.kasse',
    // Zaehlungen nur bei offener Schicht (End-Bestand wird vor dem Schliessen geschrieben).
    create: (c) => c.can('write') && isShiftOpen(c.app, c.record.getString('shift')),
    update: (c) =>
      c.can('write') &&
      c.record.getString('shift') === c.original.getString('shift') &&
      isShiftOpen(c.app, c.record.getString('shift')),
  },
  cashless_movements: {
    resource: 'crew.kasse',
    create: (c) =>
      c.can('write') &&
      isShiftOpen(c.app, c.record.getString('shift')) &&
      isPair(c, 'performed_by_a', 'performed_by_b'),
    update: (c) => c.admin,
  },

  // Editionen sind die gemeinsame Klammer von DJ-Planung und Kostenplanung.
  booking_editions: { resources: ['crew.booking', 'crew.kosten'] },
  booking_artists: { resource: 'crew.booking' },
  booking_items: { resource: 'crew.booking' },

  cost_items: { resource: 'crew.kosten' },
  cost_offers: { resource: 'crew.kosten' },
};

function resourcesOf(policy) {
  return policy.resources || [policy.resource];
}

// Kurzlebiger Cache fuer Leserechte: onRecordEnrich laeuft pro Datensatz,
// ohne Cache waeren das bei Listen hunderte Rechte-Abfragen. Nur fuer
// Lese-Checks; Schreib-Checks gehen immer frisch an crewCan().
const READ_CACHE = {};
const READ_TTL_MS = 3000;

function cachedPermissions(app, userId) {
  const now = Date.now();
  const hit = READ_CACHE[userId];
  if (hit && now - hit.t < READ_TTL_MS) return hit.v;
  const v = perms.computePermissions(app, userId);
  READ_CACHE[userId] = { t: now, v };
  return v;
}

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
    can: (level) =>
      admin || resourcesOf(policy).some((res) => perms.crewCan(app, authId, res, level)),
  };

  const rule = policy[action];
  const ok = typeof rule === 'function' ? rule(ctx) : ctx.can(DEFAULT_LEVEL[action]);
  if (!ok) throw new ForbiddenError('Keine Berechtigung fuer diese Aktion.');
}

/** Lesezugriff auf eine Collection (Enrich/expand, Realtime, Datei-Downloads). */
function canRead(app, authId, collectionName) {
  const policy = POLICIES[collectionName];
  if (!policy) return true;
  if (!authId) return false;
  const p = cachedPermissions(app, authId);
  if (p.role === 'admin') return true;
  return resourcesOf(policy).some((res) => !!p.permissions[res]);
}

module.exports = { POLICIES, guarded, check, canRead };
