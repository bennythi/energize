/// <reference path="../pb_data/types.d.ts" />

// Fixes aus dem Security-Audit 2026-10-26:
// - profiles: nur fuer Eingeloggte lesbar (kein oeffentliches Crew-Verzeichnis),
//   `user` beim Update nicht umhaengbar, Avatar nur Bilder.
// - support_tickets/support_messages: Status beim Anlegen nicht setzbar,
//   Nachrichten nur in eigene Tickets und ohne Staff-Flag.
migrate(
  (app) => {
    const profiles = app.findCollectionByNameOrId('profiles');
    profiles.listRule = '@request.auth.id != ""';
    profiles.viewRule = '@request.auth.id != ""';
    profiles.updateRule =
      'user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)';
    const avatar = profiles.fields.getByName('avatar');
    if (avatar) avatar.mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    app.save(profiles);

    const tickets = app.findCollectionByNameOrId('support_tickets');
    tickets.createRule =
      '@request.auth.id != "" && @request.body.user = @request.auth.id && (@request.body.status:isset = false || @request.body.status = "open")';
    app.save(tickets);

    const messages = app.findCollectionByNameOrId('support_messages');
    messages.createRule =
      '@request.auth.id != "" && @request.body.author = @request.auth.id && @request.body.ticket.user = @request.auth.id && (@request.body.is_staff:isset = false || @request.body.is_staff = false)';
    app.save(messages);
  },
  (app) => {
    const profiles = app.findCollectionByNameOrId('profiles');
    profiles.listRule = '';
    profiles.viewRule = '';
    profiles.updateRule = 'user = @request.auth.id';
    app.save(profiles);

    const tickets = app.findCollectionByNameOrId('support_tickets');
    tickets.createRule = '@request.auth.id != "" && @request.body.user = @request.auth.id';
    app.save(tickets);

    const messages = app.findCollectionByNameOrId('support_messages');
    messages.createRule = '@request.auth.id != "" && @request.body.author = @request.auth.id';
    app.save(messages);
  },
);
