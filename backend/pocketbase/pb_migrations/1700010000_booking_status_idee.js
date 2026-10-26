/// <reference path="../pb_data/types.d.ts" />

// DJ-Planung: neuer Status 'idee' ("Idee, Anfrage offen") vor 'anfrage',
// fuer Artists, bei denen noch nichts passiert ist.
migrate(
  (app) => {
    const artists = app.findCollectionByNameOrId('booking_artists');
    artists.fields.getByName('status').values = [
      'idee',
      'anfrage',
      'angebot',
      'bestaetigt',
      'abgesagt',
    ];
    app.save(artists);
  },
  (app) => {
    for (const r of app.findRecordsByFilter('booking_artists', "status = 'idee'", '', 0, 0)) {
      r.set('status', 'anfrage');
      app.save(r);
    }
    const artists = app.findCollectionByNameOrId('booking_artists');
    artists.fields.getByName('status').values = ['anfrage', 'angebot', 'bestaetigt', 'abgesagt'];
    app.save(artists);
  },
);
