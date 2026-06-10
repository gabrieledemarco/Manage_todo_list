#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# TaskFlow — Linux Installer
# ─────────────────────────────────────────────────────────────
# Usage: sudo ./install.sh
#
# Installs to: /opt/taskflow
# Creates:     systemd service (auto-start on boot)
#              /usr/local/bin/taskflow convenience command
# ─────────────────────────────────────────────────────────────

set -euo pipefail

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/opt/taskflow"
SERVICE_NAME="taskflow"
PORT=3000

if [ "$EUID" -ne 0 ]; then
    echo "[ERRORE] Esegui come root: sudo ./install.sh"
    exit 1
fi

echo ""
echo "  +------------------------------------------+"
echo "  |  TaskFlow — Installazione Linux           |"
echo "  |  Cartella: $INSTALL_DIR               |"
echo "  +------------------------------------------+"
echo ""
read -r -p "Procedere con l'installazione? [s/N]: " CONFIRM
case "$CONFIRM" in [sS]) ;; *) echo "Annullato."; exit 0 ;; esac

# ── Stop existing service ─────────────────────────────────────
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    echo "[1/5] Arresto servizio in esecuzione..."
    systemctl stop "$SERVICE_NAME" || true
fi

# ── Copy files ────────────────────────────────────────────────
echo "[2/5] Copia dei file in $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
cp -r "$BUNDLE_DIR/." "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/node/node"
chmod +x "$INSTALL_DIR/start.sh"
mkdir -p "$INSTALL_DIR/data"

# ── Initialize database ───────────────────────────────────────
echo "[3/5] Inizializzazione database..."
if [ ! -f "$INSTALL_DIR/data/taskflow.db" ]; then
    cp "$INSTALL_DIR/prisma/seed.db" "$INSTALL_DIR/data/taskflow.db"
fi

# Ensure a dedicated user exists
if ! id "taskflow" &>/dev/null; then
    useradd --system --no-create-home --shell /usr/sbin/nologin taskflow
fi
chown -R taskflow:taskflow "$INSTALL_DIR/data"

# ── Create systemd service ────────────────────────────────────
echo "[4/5] Configurazione servizio systemd..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=TaskFlow - Gestione Progetti
Documentation=https://github.com/gabrieledemarco/Manage_todo_list
After=network.target

[Service]
Type=simple
User=taskflow
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOSTNAME=127.0.0.1
Environment=DATABASE_URL=file:$INSTALL_DIR/data/taskflow.db
Environment=NEXT_TELEMETRY_DISABLED=1
ExecStart=$INSTALL_DIR/node/node $INSTALL_DIR/server.js
Restart=on-failure
RestartSec=10
StandardOutput=append:$INSTALL_DIR/data/taskflow.log
StandardError=append:$INSTALL_DIR/data/taskflow.log

[Install]
WantedBy=multi-user.target
EOF

# ── Enable and start ──────────────────────────────────────────
echo "[5/5] Avvio del servizio..."
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

# Convenience command
cat > "/usr/local/bin/taskflow" <<'SCRIPT'
#!/usr/bin/env bash
case "$1" in
    start)   systemctl start  taskflow ;;
    stop)    systemctl stop   taskflow ;;
    restart) systemctl restart taskflow ;;
    status)  systemctl status taskflow ;;
    log)     journalctl -u taskflow -f ;;
    *)       echo "Uso: taskflow {start|stop|restart|status|log}" ;;
esac
SCRIPT
chmod +x "/usr/local/bin/taskflow"

echo ""
echo "  +------------------------------------------+"
echo "  |  Installazione completata!                |"
echo "  |                                           |"
echo "  |  Accesso: http://localhost:$PORT             |"
echo "  |                                           |"
echo "  |  Comandi:                                 |"
echo "  |    taskflow status                        |"
echo "  |    taskflow stop                          |"
echo "  |    taskflow log                           |"
echo "  +------------------------------------------+"
echo ""
