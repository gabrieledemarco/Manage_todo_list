#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# TaskFlow — Start Server (Linux)
# ─────────────────────────────────────────────────────────────
# Run directly without installing:  ./start.sh
# Or as a background service:       ./start.sh --daemon
# ─────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE="$ROOT/node/node"
DB_FILE="$ROOT/data/taskflow.db"
SEED_DB="$ROOT/prisma/seed.db"
PID_FILE="$ROOT/data/taskflow.pid"
PORT="${PORT:-3000}"

if [ ! -x "$NODE" ]; then
    echo "[ERRORE] Node.js non trovato in: $NODE"
    exit 1
fi

mkdir -p "$ROOT/data"

# Initialize database on first run
if [ ! -f "$DB_FILE" ]; then
    echo "Inizializzazione database (primo avvio)..."
    cp "$SEED_DB" "$DB_FILE"
fi

export DATABASE_URL="file:$DB_FILE"
export NODE_ENV=production
export PORT="$PORT"
export HOSTNAME=127.0.0.1
export NEXT_TELEMETRY_DISABLED=1

if [ "${1:-}" = "--daemon" ]; then
    echo "Avvio TaskFlow in background sulla porta $PORT..."
    nohup "$NODE" "$ROOT/server.js" >"$ROOT/data/taskflow.log" 2>&1 &
    echo $! > "$PID_FILE"
    echo "PID: $(cat "$PID_FILE")"
    echo "Log: $ROOT/data/taskflow.log"
    echo "Per fermare: kill \$(cat $PID_FILE)"
    echo "Apri: http://localhost:$PORT"
else
    echo ""
    echo "  +------------------------------------------+"
    echo "  |  TaskFlow - Gestione Progetti             |"
    echo "  |  http://localhost:$PORT                     |"
    echo "  |  Premi Ctrl+C per fermare il server       |"
    echo "  +------------------------------------------+"
    echo ""
    cd "$ROOT"
    exec "$NODE" server.js
fi
