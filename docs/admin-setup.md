# Admin-Bereich

Web-Admin-UI für Foto-Wall-Moderation, Reports und Feedback-Auswertung
unter `/admin` auf der Live-Site.

## Was der Admin-Bereich kann

- **`/admin`** — Dashboard mit Counts (Pending Posts, Reports offen,
  Feedback-Einsendungen, User-Profile, Approved/Rejected Posts)
- **`/admin/moderation`** — Foto-Wall-Posts moderieren:
  - Filter: Pending / Freigegeben / Abgelehnt / Alle
  - Approve / Reject / Hard-Delete (entfernt Storage-File + DB-Row)
  - Author + Caption + Pfad zur Datei sichtbar
- **`/admin/reports`** — Reports-Inbox:
  - Bild + Grund + Reporter sichtbar
  - „Post ablehnen" — setzt Post-Status auf `rejected` und löscht alle
    Reports zu diesem Post in einem Schwung
  - „Verwerfen" — Report ist OK, wird gelöscht
- **`/admin/feedback`** — Edition-Auswertung:
  - Aggregat: Einsendungen, ⌀ Bewertung, Wiederkommen-Quote
  - Liste aller Einsendungen mit Gut / Schlecht / Verbessern-Spalten

## Setup (einmalig)

### 1. Migration 0005 ausführen

Im Supabase SQL-Editor:

```sql
-- Inhalt von supabase/migrations/0005_admin_role.sql
```

Was sie macht:

- `profiles.role` Spalte (`'user' | 'admin'`, Default `'user'`)
- `public.is_admin()` Helper-Funktion (security definer, prüft
  `profiles.role` des aufrufenden Users)
- RLS-Policies für Admins auf `posts`, `reports`, `feedback`,
  `storage.objects`

### 2. Sich selbst zum Admin machen

Im Supabase SQL-Editor:

```sql
update public.profiles
   set role = 'admin'
 where id = (
   select id from auth.users where email = 'deine@email.de'
 );
```

Browser-Reload → in der Top-Nav erscheint ein roter `★ Admin`-Button.

### 3. Andere User zum Admin machen (später)

Selbe SQL, andere E-Mail. Oder direkt mit User-ID, die auf der Account-
Seite sichtbar ist (`/u/<id>`-Link).

## Wie funktioniert der Admin-Guard?

- `auth.checkAdmin()` läuft nach jedem `getSession()` und jedem
  `onAuthStateChange` automatisch
- Setzt `auth.isAdmin` + `auth.adminChecked`
- `/admin/+layout.svelte` redirected:
  - nicht eingeloggt → `/login`
  - eingeloggt aber kein Admin → `/`
- Die Postgres-RLS-Policies erzwingen das **serverseitig** — der
  Client-Guard ist nur UX, Schutz kommt aus der DB.

## Sicherheit

- Eskalation zum Admin nur über SQL (kein UI-Knopf) — verhindert
  unbeabsichtigte Promotion
- `is_admin()` läuft als `security definer` (im Postgres mit
  Owner-Rechten) — anon-Aufrufer können nur ihre EIGENE Admin-Rolle
  prüfen, nicht die fremde
- Service-Role-Key gehört nie ins Frontend — nur `anon`-Key, RLS-
  Policies trennen Admin von normal

## Bekannte Caveats

- **Storage-Delete nicht reversibel** — bei „Hard-Delete" im
  Moderation-UI ist die Datei aus dem Bucket weg. Vorher Screenshot
  ziehen wenn beweissichernd nötig.
- **Reports löschen ist auch nicht reversibel** — verwerfen heißt
  endgültig weg. Wenn du ein Audit-Log brauchst, baue eine separate
  `report_audit` Tabelle.
- **Feedback ist read-only** im Admin-UI. Wenn jemand Feedback löschen
  will (DSGVO-Anfrage), per SQL: `delete from public.feedback where
user_id = ?`.
