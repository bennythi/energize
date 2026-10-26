# Deploy auf den ANPA-Webspace (blackout42.de, web102)

Stand 2026-10-26: Die Energize-Instanz läuft komplett auf dem ISPConfig-Webspace. Statisches Frontend und Pocketbase liegen auf demselben Host, dafür sind weder Docker noch Caddy nötig.

```
Browser ──https──> Apache (blackout42.de, ~/web)
                     ├─ /            statischer SvelteKit-Build (SPA-Fallback index.html)
                     └─ /api/*       .htaccess -> /api/index.php (PHP-curl-Proxy)
                                         └──> Pocketbase 127.0.0.1:18095 (~/private/pocketbase)
```

Warum ein PHP-Proxy: Der Webspace erlaubt kein `mod_proxy` (`[P]` liefert 503), und die Ports des Docker-Hosts sind vom Webserver aus nicht erreichbar. PHP-FPM mit curl erreicht `127.0.0.1` aber problemlos.

## Dateien

| Lokal                                                               | Server                           |
| ------------------------------------------------------------------- | -------------------------------- |
| `apps/web/build/` (Build mit `PUBLIC_PB_URL=https://blackout42.de`) | `~/web/`                         |
| `deploy/anpa-webspace/api/index.php` + `.user.ini`                  | `~/web/api/`                     |
| `backend/pocketbase/pb_hooks`, `pb_migrations`                      | `~/private/pocketbase/`          |
| `deploy/anpa-webspace/pb-ctl.sh`                                    | `~/private/pocketbase/pb-ctl.sh` |

Nur auf dem Server liegen (chmod 600, nie committen):

- `~/private/pocketbase/pb.env`: `APP_URL`, `SHOP_PUBLIC_URL`, `SHOP_API_URL`, `SHOP_QR_SECRET` (zufällig erzeugt) und `SHOP_DISABLE_STUB=1`
- `~/private/pocketbase/.superuser`: Zugangsdaten des Pocketbase-Superusers

`SHOP_DISABLE_STUB=1` schaltet die simulierte Zahlung ab. Ohne diesen Schalter gäbe es live Tickets ohne Bezahlung. Die Demo-Tickettypen sind deshalb deaktiviert, bis Mollie oder Stripe eingerichtet ist.

## Pocketbase steuern

```sh
ssh anpa
~/private/pocketbase/pb-ctl.sh status|start|stop|restart
```

**Noch offen: automatischer Neustart.** Nach einem Server-Reboot oder Absturz startet Pocketbase nicht von selbst. Einmalig auf dem Server ausführen:

```sh
(crontab -l 2>/dev/null; echo "* * * * * $HOME/private/pocketbase/pb-ctl.sh ensure >/dev/null 2>&1"; echo "@reboot $HOME/private/pocketbase/pb-ctl.sh start >/dev/null 2>&1") | crontab -
```

Admin-UI von Pocketbase per SSH-Tunnel: `ssh -L 18095:127.0.0.1:18095 anpa`, dann http://127.0.0.1:18095/_/ öffnen.

## Update ausrollen

```sh
# Frontend
PUBLIC_PB_URL=https://blackout42.de pnpm build:energize --force
# Build + api/ nach ~/private/deploy-new packen, dann auf dem Server:
rsync -a --delete --exclude=/stats --exclude=/error --exclude=/favicon.ico ~/private/deploy-new/ ~/web/

# Backend (Hooks/Migrationen)
tar -cf - -C backend/pocketbase pb_hooks pb_migrations | ssh anpa 'cd ~/private/pocketbase && rm -rf pb_hooks pb_migrations && tar -xf - && ./pb-ctl.sh restart'
```

Pocketbase führt neue Migrationen beim Start automatisch aus. Vorher `pb_data` sichern: `cp -a ~/private/pocketbase/pb_data ~/private/pb_data-$(date +%F)`.

## Rollback auf die alte Supabase-Seite

Die vorherige Live-Seite liegt vollständig unter `~/backup-web-20261026`.

```sh
rsync -a --delete --exclude=/stats ~/backup-web-20261026/ ~/web/
```

## Mail

Pocketbase verschickt über `sendmail` des Webservers (SMTP ist in den Settings aus). `127.0.0.1:25` scheitert an STARTTLS, weil das Zertifikat nicht auf die IP passt. Absender ist `noreply@blackout42.de`. Ohne SPF/DKIM für diesen Absender können Login-Codes im Spam landen.
