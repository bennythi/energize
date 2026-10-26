// Geteilte Berechtigungs-Logik (Port von Supabase crew_can / crew_my_permissions).
// Wird von den pb_hooks-Routen via require() eingebunden. Laeuft im
// Superuser-Kontext des Hooks, liest also account_flags + crew_*-Collections
// direkt (die fuer den Client gesperrt sind).

const LEVEL_RANK = { read: 1, write: 2, delete: 3 };

// Ein json-Feld liefert ueber record.get() die rohen JSON-Bytes (z.B. die
// Bytes von ["kassierer"]), nicht das geparste Array. Daher dekodieren:
// Bytes -> String -> JSON.parse. Deckt auch bereits-String-Arrays + Strings ab.
function bytesToStr(raw) {
  try {
    return toString(raw);
  } catch (e) {
    let s = '';
    try {
      for (let i = 0; i < raw.length; i++) s += String.fromCharCode(raw[i]);
    } catch (e2) {
      return '';
    }
    return s;
  }
}

function parseJsonArray(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    if (typeof raw[0] === 'string') return raw; // bereits String-Array
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch (e) {
      return [];
    }
  }
  try {
    const p = JSON.parse(bytesToStr(raw));
    return Array.isArray(p) ? p : [];
  } catch (e) {
    return [];
  }
}

/** Laedt Rolle + Crew-Flag + Crew-Rollen eines Users (Defaults, falls keine Zeile). */
function loadFlags(app, userId) {
  try {
    const rec = app.findFirstRecordByFilter('account_flags', 'user = {:u}', { u: userId });
    return {
      role: rec.getString('role') || 'user',
      is_crew: rec.getBool('is_crew'),
      crew_roles: parseJsonArray(rec.get('crew_roles')),
    };
  } catch (e) {
    return { role: 'user', is_crew: false, crew_roles: [] };
  }
}

/** Effektive Permissions: Admin = alle Ressourcen auf delete, sonst MAX(Rolle, User-Override). */
function computePermissions(app, userId) {
  const flags = loadFlags(app, userId);
  const permissions = {};

  if (flags.role === 'admin') {
    const resources = app.findAllRecords('crew_resources');
    for (const r of resources) permissions[r.getString('slug')] = 'delete';
    return { role: flags.role, is_crew: true, crew_roles: flags.crew_roles, permissions };
  }

  const merge = (resource, level) => {
    const cur = permissions[resource];
    if (!cur || LEVEL_RANK[level] > LEVEL_RANK[cur]) permissions[resource] = level;
  };

  // Rollen-Rechte: crew_role_permissions ist klein (Rollen x Ressourcen),
  // daher findAllRecords + JS-Filter (robust gegenueber Filter-Param-Binding).
  const roleSet = new Set(flags.crew_roles.map((r) => String(r)));
  if (roleSet.size > 0) {
    for (const row of app.findAllRecords('crew_role_permissions')) {
      if (roleSet.has(row.getString('role'))) {
        merge(row.getString('resource'), row.getString('level'));
      }
    }
  }

  // User-Overrides: ebenfalls per JS-Filter auf den userId.
  for (const row of app.findAllRecords('crew_user_permissions')) {
    if (row.getString('user') === userId) {
      merge(row.getString('resource'), row.getString('level'));
    }
  }

  return {
    role: flags.role,
    is_crew: flags.is_crew,
    crew_roles: flags.crew_roles,
    permissions,
  };
}

/** true, wenn der User auf der Ressource mindestens das geforderte Level hat. */
function crewCan(app, userId, resource, level) {
  const { role, permissions } = computePermissions(app, userId);
  if (role === 'admin') return true;
  const have = permissions[resource];
  return !!have && LEVEL_RANK[have] >= LEVEL_RANK[level];
}

/** true, wenn der User Admin ist. */
function isAdmin(app, userId) {
  return loadFlags(app, userId).role === 'admin';
}

/** Upsert einer account_flags-Zeile (legt an oder aktualisiert die uebergebenen Felder). */
function upsertFlags(app, userId, patch) {
  let rec;
  try {
    rec = app.findFirstRecordByFilter('account_flags', 'user = {:u}', { u: userId });
  } catch (e) {
    rec = new Record(app.findCollectionByNameOrId('account_flags'));
    rec.set('user', userId);
    rec.set('role', 'user');
  }
  if (patch.role !== undefined) rec.set('role', patch.role);
  if (patch.is_crew !== undefined) rec.set('is_crew', patch.is_crew);
  if (patch.crew_roles !== undefined) rec.set('crew_roles', patch.crew_roles);
  app.save(rec);
}

module.exports = {
  LEVEL_RANK,
  parseJsonArray,
  loadFlags,
  computePermissions,
  crewCan,
  isAdmin,
  upsertFlags,
};
