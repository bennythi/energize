/// <reference path="../pb_data/types.d.ts" />

// Modul 'artist-booking': interne DJ-/Artist-Planung pro Edition.
// Gage, Vertrag, Rider (geschuetzte Dateien), Anreise/Hotel/Transfer/
// Zusatzkosten als booking_items. Zugriff ueber crew.booking (crew.guard.pb.js).
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    const AUTH = '@request.auth.id != ""';
    const DAY = '^(\\d{4}-\\d{2}-\\d{2})?$';
    const updatedBy = {
      type: 'relation',
      name: 'updated_by',
      maxSelect: 1,
      collectionId: users.id,
      cascadeDelete: false,
    };

    const editions = new Collection({
      type: 'base',
      name: 'booking_editions',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        { type: 'text', name: 'name', required: true, max: 120 },
        { type: 'number', name: 'year', required: true, min: 2000, max: 2100, onlyInt: true },
        { type: 'text', name: 'start_date', pattern: DAY },
        { type: 'text', name: 'end_date', pattern: DAY },
        { type: 'number', name: 'budget', min: 0 },
        { type: 'text', name: 'currency', max: 3 },
        { type: 'bool', name: 'archived' },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_booking_editions_year ON booking_editions (year)'],
    });
    app.save(editions);

    const artists = new Collection({
      type: 'base',
      name: 'booking_artists',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        {
          type: 'relation',
          name: 'edition',
          required: true,
          maxSelect: 1,
          collectionId: editions.id,
          cascadeDelete: true,
        },
        { type: 'text', name: 'name', required: true, max: 160 },
        { type: 'text', name: 'sanity_slug', max: 160 },
        {
          type: 'select',
          name: 'status',
          required: true,
          maxSelect: 1,
          values: ['anfrage', 'angebot', 'bestaetigt', 'abgesagt'],
        },
        { type: 'text', name: 'day', pattern: DAY },
        { type: 'text', name: 'slot_start', pattern: '^(\\d{2}:\\d{2})?$' },
        { type: 'text', name: 'slot_end', pattern: '^(\\d{2}:\\d{2})?$' },
        { type: 'text', name: 'stage', max: 80 },
        { type: 'text', name: 'agency', max: 160 },
        { type: 'text', name: 'contact_name', max: 160 },
        { type: 'text', name: 'contact_email', max: 200 },
        { type: 'text', name: 'contact_phone', max: 60 },
        { type: 'number', name: 'fee', min: 0 },
        { type: 'text', name: 'fee_note', max: 500 },
        { type: 'bool', name: 'contract_signed' },
        { type: 'bool', name: 'invoice_received' },
        { type: 'bool', name: 'fee_paid' },
        { type: 'text', name: 'rider_tech', max: 20000 },
        { type: 'text', name: 'rider_hospitality', max: 20000 },
        {
          type: 'file',
          name: 'rider_files',
          maxSelect: 10,
          maxSize: 20 * 1024 * 1024,
          protected: true,
          mimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
          ],
        },
        // Arten, die fuer diesen Artist nicht noetig sind (z.B. ["hotel"]).
        { type: 'json', name: 'not_needed', maxSize: 2000 },
        { type: 'text', name: 'notes', max: 20000 },
        updatedBy,
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_booking_artists_edition ON booking_artists (edition, day)'],
    });
    app.save(artists);

    const items = new Collection({
      type: 'base',
      name: 'booking_items',
      listRule: AUTH,
      viewRule: AUTH,
      createRule: AUTH,
      updateRule: AUTH,
      deleteRule: AUTH,
      fields: [
        {
          type: 'relation',
          name: 'artist',
          required: true,
          maxSelect: 1,
          collectionId: artists.id,
          cascadeDelete: true,
        },
        {
          type: 'select',
          name: 'kind',
          required: true,
          maxSelect: 1,
          values: ['anreise', 'hotel', 'transfer', 'zusatzkosten'],
        },
        { type: 'text', name: 'title', required: true, max: 200 },
        { type: 'text', name: 'provider', max: 200 },
        // Lokale Zeit als "YYYY-MM-DDTHH:MM" (datetime-local), bewusst ohne Zeitzone.
        { type: 'text', name: 'start_at', max: 16 },
        { type: 'text', name: 'end_at', max: 16 },
        { type: 'text', name: 'location', max: 300 },
        { type: 'text', name: 'reference', max: 120 },
        { type: 'number', name: 'persons', min: 0, onlyInt: true },
        { type: 'number', name: 'cost', min: 0 },
        { type: 'bool', name: 'booked' },
        { type: 'bool', name: 'paid' },
        { type: 'text', name: 'notes', max: 4000 },
        { ...updatedBy },
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_booking_items_artist ON booking_items (artist, kind)'],
    });
    app.save(items);
  },
  (app) => {
    for (const n of ['booking_items', 'booking_artists', 'booking_editions']) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (e) {
        // weg
      }
    }
  },
);
