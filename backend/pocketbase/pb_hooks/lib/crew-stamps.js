// Serverseitige Zeitstempel/Autoren fuer Crew-Collections. Der Client darf
// diese Felder nicht selbst setzen (z.B. "erledigt von").

function apply(collectionName, record, authId, action) {
  if (collectionName === 'crew_milestones') {
    if (action === 'create') {
      record.set('created_by', authId);
      record.set('completed_at', '');
      record.set('completed_by', '');
      return;
    }
    const wasDone = !!record.original().getString('completed_at');
    const isDone = !!record.getString('completed_at');
    if (isDone && !wasDone) {
      record.set('completed_at', new Date().toISOString().replace('T', ' '));
      record.set('completed_by', authId);
    } else if (!isDone) {
      record.set('completed_by', '');
    } else {
      // Erledigt bleibt erledigt: urspruengliche Werte behalten.
      record.set('completed_at', record.original().getString('completed_at'));
      record.set('completed_by', record.original().getString('completed_by'));
    }
    return;
  }
  if (collectionName === 'crew_briefings') {
    record.set('updated_by', authId);
    return;
  }
  if (collectionName === 'booking_artists' || collectionName === 'booking_items') {
    record.set('updated_by', authId);
  }
}

module.exports = { apply };
