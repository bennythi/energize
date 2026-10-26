// User + Profil + Flags zusammengefuehrt (fuer Admin-Listen und Crew-Mitglieder).
// Laeuft im Hook-Kontext, liest account_flags direkt.

const perms = require(`${__hooks}/lib/permissions.js`);

function listUsers(app) {
  const profiles = {};
  for (const p of app.findAllRecords('profiles')) {
    profiles[p.getString('user')] = p;
  }
  const flags = {};
  for (const f of app.findAllRecords('account_flags')) {
    flags[f.getString('user')] = f;
  }

  return app
    .findAllRecords('users')
    .map((u) => {
      const p = profiles[u.id];
      const f = flags[u.id];
      return {
        id: u.id,
        email: u.getString('email'),
        created: u.getString('created'),
        display_name: p ? p.getString('display_name') : '',
        handle: p ? p.getString('handle') : '',
        role: f ? f.getString('role') || 'user' : 'user',
        is_crew: f ? f.getBool('is_crew') : false,
        crew_roles: f ? perms.parseJsonArray(f.get('crew_roles')) : [],
      };
    })
    .sort((a, b) => (a.created < b.created ? 1 : -1));
}

module.exports = { listUsers };
