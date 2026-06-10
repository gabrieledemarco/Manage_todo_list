#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# TaskFlow — Linux Uninstaller
# Usage: sudo ./uninstall.sh
# ─────────────────────────────────────────────────────────────

if [ "$EUID" -ne 0 ]; then
    echo "Esegui come root: sudo ./uninstall.sh"
    exit 1
fi

echo "Disinstallazione TaskFlow..."
echo "ATTENZIONE: il database con i tuoi dati verra' rimosso."
read -r -p "Continuare? [s/N]: " CONFIRM
case "$CONFIRM" in [sS]) ;; *) echo "Annullato."; exit 0 ;; esac

systemctl stop  taskflow 2>/dev/null || true
systemctl disable taskflow 2>/dev/null || true
rm -f /etc/systemd/system/taskflow.service
systemctl daemon-reload

rm -rf /opt/taskflow
rm -f  /usr/local/bin/taskflow

echo "TaskFlow disinstallato."
