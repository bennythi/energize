#!/bin/sh
# Pocketbase auf dem ISPConfig-Webspace (web102) betreiben.
# Liegt unter ~/private/pocketbase/. Cron ruft "ensure" jede Minute auf und
# startet Pocketbase neu, falls der Prozess fehlt (auch nach Server-Reboot).
#
#   pb-ctl.sh start | stop | restart | ensure | status
#
# Konfiguration (Secrets) in ~/private/pocketbase/pb.env (chmod 600), z.B.
#   APP_URL=https://blackout42.de
#   SHOP_PUBLIC_URL=https://blackout42.de
#   SHOP_QR_SECRET=...
#   SHOP_DISABLE_STUB=1

DIR="$(cd "$(dirname "$0")" && pwd)"
BIN="$DIR/pocketbase"
PIDFILE="$DIR/pb.pid"
LOG="$DIR/pb.log"
ADDR="127.0.0.1:18095"

running() {
  [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

start() {
  if running; then
    echo "laeuft bereits (pid $(cat "$PIDFILE"))"
    return 0
  fi
  if [ -f "$DIR/pb.env" ]; then
    set -a
    . "$DIR/pb.env"
    set +a
  fi
  # Log klein halten
  if [ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 5000000 ]; then
    mv "$LOG" "$LOG.1"
  fi
  nohup "$BIN" serve --http="$ADDR" \
    --dir "$DIR/pb_data" \
    --migrationsDir "$DIR/pb_migrations" \
    --hooksDir "$DIR/pb_hooks" \
    --hooksWatch=false \
    >> "$LOG" 2>&1 < /dev/null &
  echo $! > "$PIDFILE"
  echo "gestartet (pid $!)"
}

stop() {
  if running; then
    kill "$(cat "$PIDFILE")"
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      running || break
      sleep 1
    done
  fi
  rm -f "$PIDFILE"
  echo "gestoppt"
}

case "$1" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  ensure) running || start ;;
  status) if running; then echo "laeuft (pid $(cat "$PIDFILE"))"; else echo "gestoppt"; exit 1; fi ;;
  *) echo "usage: $0 start|stop|restart|ensure|status"; exit 2 ;;
esac
