/// <reference path="../pb_data/types.d.ts" />

// Profil: Vorname, Nachname, Handynummer (Account-Seite, Crew-Begruessung).
// Dazu ein Rate-Limit fuer "Passwort zuruecksetzen", damit niemand darueber
// Mails an fremde Adressen spammen kann.
const RESET_LABEL = '*:requestPasswordReset';

migrate(
  (app) => {
    const c = app.findCollectionByNameOrId('profiles');
    c.fields.add(new TextField({ name: 'first_name', max: 80 }));
    c.fields.add(new TextField({ name: 'last_name', max: 80 }));
    c.fields.add(new TextField({ name: 'phone', max: 40 }));
    app.save(c);

    const settings = app.settings();
    const rules = JSON.parse(JSON.stringify(settings.rateLimits.rules || []));
    if (!rules.some((r) => r.label === RESET_LABEL)) {
      rules.push({ label: RESET_LABEL, audience: '', duration: 60, maxRequests: 3 });
      settings.rateLimits.rules = rules;
      app.save(settings);
    }
  },
  (app) => {
    const c = app.findCollectionByNameOrId('profiles');
    c.fields.removeByName('first_name');
    c.fields.removeByName('last_name');
    c.fields.removeByName('phone');
    app.save(c);
  },
);
