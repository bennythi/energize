# Community-Features Setup — Foto-Wall, Follows, Likes

**Status:** Code ist im Repo. Damit Foto-Wall + Profile live funktionieren, müssen
im Supabase-Dashboard noch zwei Sachen gemacht werden.

## 1. Storage-Bucket "posts" anlegen

**Dashboard → Storage → New bucket:**

- Name: `posts`
- ✅ **Public bucket** aktivieren (so sind hochgeladene Bilder via CDN-URL
  ohne Auth abrufbar — die App zeigt sowieso nur `approved`-Posts)
- File size limit: **8 MB**
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/avif`

**ODER per SQL** (idempotent — kann auch nach UI-Erstellung laufen):

```sql
-- Migration 0003_storage_posts.sql ausführen
```

## 2. Storage-RLS-Policies

Wenn der Bucket per UI angelegt wurde, **Migration 0003 trotzdem ausführen** —
sie legt nur die Policies an (das `insert` ist mit `on conflict do nothing`).

Die 3 Policies sind:

- `posts_public_read` — alle dürfen lesen (Bucket ist public, das macht's
  explizit)
- `posts_user_upload` — eingeloggter User darf in den eigenen
  `<user_id>/<file>`-Pfad uploaden
- `posts_user_delete` — User darf eigene Files löschen

## 3. Profile-Erweiterung + Follows + Suche

**Migration 0004_follows_handle.sql** im SQL-Editor laufen lassen. Die fügt:

- `profiles.handle` (unique, case-insensitive)
- `pg_trgm`-Extension + Trigram-Indexe auf `display_name` und `handle` für
  schnelle ILIKE-Suche
- `follows`-Tabelle mit RLS

## 4. Test-Flow nach Migration

1. Account → Display-Name + Handle setzen → Speichern
2. `/community/users` → dich selbst finden
3. `/u/<deine-user-id>` → eigenes Profil (mit Counts)
4. `/wall/upload` → Foto wählen → Upload (Status `pending`)
5. Dashboard → `posts`-Tabelle → `status` auf `approved` setzen
6. `/wall` → dein Foto erscheint
7. Wenn ein zweiter User existiert: liken + folgen testen

## 5. Moderations-Workflow

Aktuell läuft Moderation **manuell im Supabase-Dashboard**:

- `posts.status = 'pending'` → Foto wird hochgeladen, aber nicht öffentlich
- Du gehst ins Dashboard, schaust das Bild an (Storage → posts → `<user>/<file>`),
  entscheidest:
  - **approve**: `update posts set status='approved' where id=…`
  - **reject**: `update posts set status='rejected' where id=…`

**Reports** landen in der `reports`-Tabelle. Filter im Dashboard:

- `select p.*, r.reason from posts p join reports r on r.post_id = p.id;`

Sanity-Custom-Tool für Moderation kommt in Phase 7+.

## 6. Sicherheit

- **anon-Key im Frontend ist OK** — alle Zugriffe gehen durch RLS
- **`service_role`-Key NIE ins Frontend** — der bypasst RLS und darf alle
  Posts anzeigen/ändern. Nur für Server-Tools (z. B. Sanity-Mod-Tool später).
- **Storage ist public-read** — wer den exakten Pfad `<user-id>/<uuid>.jpg`
  rät, kann ein pending-Bild sehen. Die UUID macht das praktisch unmöglich;
  ein leak ist akzeptables Risiko für Demo.

## 7. Bekannte Caveats

- **EXIF-Daten werden im Browser strippt** (`imageResize.ts`), aber nur weil
  wir das Bild durch Canvas → JPEG re-encoden. Geo-Tags etc. sind weg —
  gewünschtes Verhalten für Datenschutz.
- **Trigram-Suche** ist case-insensitive aber **nicht** akzent-tolerant
  (`Müller` ≠ `Muller`). Für die Demo reicht's.
- **Handle-Eindeutigkeit** wird per Unique-Index erzwungen — der Code
  fängt den `23505`-Conflict ab und zeigt „Handle ist schon vergeben."
