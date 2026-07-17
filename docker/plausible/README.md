# Plausible Analytics — Self-Hosted Setup

Domain: `plausible.blackout24.de`
Host: Portainer-Docker-Server bei `portainer.anpa-networks.de`
Image: `ghcr.io/plausible/community-edition:v3.0.1`

## 1. DNS

A-Record fuer `plausible.blackout24.de` auf die IP des Portainer-Docker-Servers
setzen. Erst danach kann Caddy ein Let's-Encrypt-Zertifikat holen.

DNS-Propagation pruefen:

```sh
dig +short plausible.blackout24.de
```

## 2. Stack auf den Server kopieren

Vom lokalen Repo aus per scp oder ueber Portainer "Stacks → Add Stack → Upload":

```sh
scp -r docker/plausible <user>@portainer.anpa-networks.de:/opt/plausible
```

Oder in Portainer den Stack-Editor benutzen und die `docker-compose.yml` direkt
einfuegen, dann zusaetzlich `Caddyfile`, `clickhouse/*.xml` und `.env` ueber
"Edit file" oder per Volume bereitstellen.

## 3. Secrets anlegen

Auf dem Server:

```sh
cd /opt/plausible
cp .env.example .env

# Secrets generieren
echo "SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n')" >> .env
echo "TOTP_VAULT_KEY=$(openssl rand -base64 32 | tr -d '\n')"  >> .env
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '\n=')" >> .env

# Platzhalter aus dem Template entfernen
sed -i '/^SECRET_KEY_BASE=CHANGE_ME$/d; /^TOTP_VAULT_KEY=CHANGE_ME$/d; /^POSTGRES_PASSWORD=CHANGE_ME$/d' .env
```

## 4. Stack starten

```sh
docker compose up -d
docker compose logs -f plausible
```

Plausible braucht beim ersten Start ein paar Sekunden, bis die Postgres-Tabellen
und Clickhouse-Schemas angelegt sind. Im Log auf
`Access Plausible at http://0.0.0.0:8000` warten.

## 5. Ersten Admin registrieren

Browser oeffnen: `https://plausible.blackout24.de`.

- "Register" klicken, eigene Mail-Adresse + Passwort
- Site anlegen: `energize.blackout42.de`
- Tracking-Snippet wird gezeigt, ist aber bereits in der SvelteKit-App
  eingebaut (siehe `apps/web/src/routes/+layout.svelte`). Bestaetigen reicht.

## 6. Registration sperren

Direkt nach dem ersten Admin-Account die Selbst-Registrierung schliessen, sonst
kann sich jeder mit der URL einen Account holen.

```sh
# In .env aendern:
DISABLE_REGISTRATION=invite_only

docker compose up -d --force-recreate plausible
```

Spaeter weitere User per "Sites → Settings → People" einladen.

## 7. Backups

Persistente Volumes:

- `db-data` (Postgres, Site-Konfig + User-Accounts)
- `event-data` (Clickhouse, Pageview-Events)

Beide regelmaessig sichern. Beispiel-Cron:

```sh
docker compose exec -T plausible_db pg_dump -U postgres plausible_db | gzip > /backup/plausible-pg-$(date +%F).sql.gz
```

Clickhouse-Backup ist komplexer (siehe Plausible-Doku), fuer den Festival-Use-Case
reicht erstmal Postgres + akzeptierter Daten-Verlust auf Clickhouse-Seite, da die
Events bei Bedarf neu eingesammelt werden koennen (verzerrt nur die Historie).

## Hinweise

- Caddy macht TLS automatisch via Let's Encrypt, kein manueller Cert-Schritt
- Mail-Versand ist nicht konfiguriert. Invite-Links erscheinen im Plausible-Container-Log
- Resource-Profil: ca. 1 GB RAM idle, kann auf 2 GB peaken
- Update: `docker compose pull && docker compose up -d`. Vor jedem Upgrade Postgres-Backup
