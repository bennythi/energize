# Hetzner VPS Setup — Web + Plausible

**Ziel:** Eigener Linux-Server, der `www.energize-festival.de` (SvelteKit Web) und `/api/event` (Plausible-Tracker-Proxy) ausliefert.

**Aufwand:** 2–4 Stunden (einmalig).

**Wann:** Relevant ab Phase 3 (Web geht live). Phase 1 + 2 brauchen den Server noch nicht — du kannst das in Ruhe machen.

## Server-Empfehlung

- **Hetzner Cloud CX22** (3 vCPU, 4 GB RAM, 40 GB SSD)
- Standort: **Falkenstein** oder **Nürnberg** (DSGVO, niedriger Ping aus DE)
- Image: **Ubuntu 24.04 LTS**
- Preis: **5,83 €/Monat** (Stand 2026)
- Skalierung: Falls vor Festival Traffic-Spitzen kommen → temporär auf CX32 hochstufen (Klick, kein Migrations-Aufwand).

## 1. Account + Server-Bestellung

1. **https://www.hetzner.com/cloud** → „Jetzt bestellen".
2. Account mit Brainchildz-E-Mail anlegen, Bankdaten oder Kreditkarte hinterlegen.
3. Im Console: **„+ Server hinzufügen"**
   - Standort: Falkenstein
   - Image: Ubuntu 24.04
   - Type: CX22 (Shared vCPU x86)
   - SSH Key hinzufügen (siehe Schritt 2 unten — vorher generieren!)
   - Name: `energize-prod`
4. Erstellen. Server bekommt eine IPv4 + IPv6.

## 2. SSH-Key bereithalten

```powershell
Test-Path "$HOME\.ssh\id_ed25519.pub"
```

Falls `False`: siehe [github-setup.md](./github-setup.md), Schritt 3.

Public-Key kopieren und bei Hetzner-Server-Erstellung einfügen.

## 3. Erstes SSH-Login + Basic Hardening

```powershell
ssh root@<server-ip>
```

Auf dem Server:

```bash
# System updaten
apt update && apt upgrade -y

# Nicht-Root-User anlegen
adduser deploy
usermod -aG sudo deploy

# SSH-Key kopieren
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# SSH absichern
nano /etc/ssh/sshd_config
# Setze:
#   PermitRootLogin no
#   PasswordAuthentication no
systemctl restart ssh

# Firewall
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Fail2Ban
apt install -y fail2ban
systemctl enable fail2ban

# Automatische Sicherheitsupdates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

exit
```

## 4. DNS auf Server zeigen lassen

1. Wix-DNS-Provider öffnen (oder wo immer `energize-festival.de` gehostet wird).
2. **TTL für A-Record auf 300 Sekunden senken** (24 h vor Cutover) — schnellerer Switch.
3. Wenn bereit: A-Record auf Hetzner-IPv4 ändern, AAAA-Record auf IPv6.

## 5. Docker + Caddy + Plausible installieren

Neuer Login mit deploy-User:

```powershell
ssh deploy@<server-ip>
```

Auf dem Server:

```bash
# Docker installieren
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
exit  # neu einloggen damit Docker-Gruppe greift
```

Wieder einloggen:

```powershell
ssh deploy@<server-ip>
```

```bash
# Verzeichnis für Stack
mkdir -p ~/energize
cd ~/energize
```

`docker-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - energize

  web:
    image: ghcr.io/<dein-username>/energize-web:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
    expose:
      - '3000'
    networks:
      - energize

  plausible_db:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - plausible_db_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=CHANGE_ME_RANDOM_LONG
    networks:
      - energize

  plausible_events_db:
    image: clickhouse/clickhouse-server:24-alpine
    restart: unless-stopped
    volumes:
      - plausible_events_db_data:/var/lib/clickhouse
    networks:
      - energize

  plausible:
    image: ghcr.io/plausible/community-edition:v2
    restart: unless-stopped
    depends_on:
      - plausible_db
      - plausible_events_db
    environment:
      - BASE_URL=https://www.energize-festival.de
      - SECRET_KEY_BASE=CHANGE_ME_RANDOM_64_CHARS
      - DATABASE_URL=postgres://postgres:CHANGE_ME_RANDOM_LONG@plausible_db:5432/plausible_db
      - CLICKHOUSE_DATABASE_URL=http://plausible_events_db:8123/plausible_events_db
    expose:
      - '8000'
    networks:
      - energize

volumes:
  caddy_data:
  caddy_config:
  plausible_db_data:
  plausible_events_db_data:

networks:
  energize:
```

`Caddyfile`:

```
www.energize-festival.de, energize-festival.de {
    # SvelteKit-App
    @plausible path /api/event /js/script.js /js/plausible.js
    handle @plausible {
        reverse_proxy plausible:8000
    }

    handle {
        reverse_proxy web:3000
    }

    encode gzip zstd
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
}
```

```bash
# Secrets generieren
openssl rand -base64 48  # für SECRET_KEY_BASE
openssl rand -base64 32  # für POSTGRES_PASSWORD
# Im docker-compose.yml ersetzen!

# Stack starten
docker compose up -d

# Caddy holt sich automatisch ein Let's-Encrypt-Zertifikat sobald DNS zeigt
docker compose logs -f caddy
```

## 6. Plausible einrichten

1. Im Browser `https://www.energize-festival.de/plausible-admin/` (eigentlich: über Browser direkt auf Server-Port 8000 oder eine eigene Subdomain — wir nutzen Plausible's eigenen Login-Flow).
   Eigentlich: Plausible braucht eine eigene Login-Route. Konfig anpassen oder über separate Subdomain ausliefern. Wir klären das in Phase 3 konkret.
2. Admin-User anlegen, Site `energize-festival.de` registrieren.
3. Tracking-Snippet bekommt Site-ID `energize-festival.de`.

## 7. SvelteKit-Image bauen + deployen (Phase 3)

In Phase 3 ergänzen wir den GitHub-Actions-Workflow um:

- Docker-Image bauen + nach `ghcr.io` pushen.
- Per SSH auf Server: `docker compose pull web && docker compose up -d web`.

## 8. Backups

```bash
# Plausible-DB tägliches Dump nach Hetzner Storage Box
sudo apt install -y restic
# Storage-Box anlegen (Hetzner Console) → SSH-Key dort autorisieren
# Cron-Job für täglichen restic-backup
```

Details liefere ich als separates Skript in Phase 3.

## 9. Monitoring (optional, Phase 3)

- **Uptime Kuma** (Container) — pingt `www.energize-festival.de` alle 60 s und schickt Discord/E-Mail bei Ausfall.
- **netdata** — System-Monitoring (CPU/RAM/Disk) im Browser.
