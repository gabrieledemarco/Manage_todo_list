#!/usr/bin/env bash
# =============================================================================
# TaskFlow — Portable Bundle Builder (Linux/macOS dev machine)
# =============================================================================
# Builds a fully self-contained bundle with:
#   - Portable Node.js binary (no system Node required on target)
#   - Pre-compiled Next.js standalone server
#   - All node_modules (embedded in standalone build)
#   - Prisma engine binaries for target platform
#   - Pre-initialized SQLite database (no migrations needed on target)
#
# Usage:
#   ./scripts/build-portable.sh            # defaults to windows
#   ./scripts/build-portable.sh windows    # Windows x64 bundle
#   ./scripts/build-portable.sh linux      # Linux x64 bundle
#
# Output:  dist/taskflow-<platform>-v<version>.zip
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="${1:-windows}"
NODE_VERSION="20.18.3"
APP_VERSION="0.2.0"
BUNDLE_NAME="taskflow-${TARGET}-v${APP_VERSION}"
BUNDLE_DIR="dist/${BUNDLE_NAME}"

echo "==================================================="
echo " TaskFlow Portable Builder"
echo " Target: $TARGET | Node: $NODE_VERSION | App: $APP_VERSION"
echo "==================================================="

# ── Step 1: Install dependencies ──────────────────────────────────────────────
echo ""
echo "[1/7] Installing npm dependencies..."
npm ci --prefer-offline 2>/dev/null || npm ci

# ── Step 2: Generate Prisma client for all binary targets ─────────────────────
echo "[2/7] Generating Prisma client (all platforms)..."
npx prisma generate

# ── Step 3: Build seed database (empty schema, no data) ───────────────────────
echo "[3/7] Creating seed database..."
rm -f prisma/seed.db
DATABASE_URL="file:./prisma/seed.db" npx prisma migrate deploy

# ── Step 4: Build Next.js standalone ─────────────────────────────────────────
echo "[4/7] Building Next.js application..."
npm run build

# ── Step 5: Assemble bundle ───────────────────────────────────────────────────
echo "[5/7] Assembling portable bundle..."
rm -rf dist
mkdir -p "$BUNDLE_DIR"

# Standalone server (contains all required node_modules)
cp -r .next/standalone/. "$BUNDLE_DIR/"
# Static assets (CSS, JS chunks — NOT included in standalone automatically)
mkdir -p "$BUNDLE_DIR/.next/static"
cp -r .next/static/. "$BUNDLE_DIR/.next/static/"
# Public assets
cp -r public/. "$BUNDLE_DIR/public/" 2>/dev/null || true

# Prisma schema + migrations + seed DB
mkdir -p "$BUNDLE_DIR/prisma"
cp prisma/schema.prisma "$BUNDLE_DIR/prisma/"
cp -r prisma/migrations "$BUNDLE_DIR/prisma/"
cp prisma/seed.db "$BUNDLE_DIR/prisma/"

# Prisma runtime binaries (overwrite what standalone may have already copied)
mkdir -p "$BUNDLE_DIR/node_modules/.prisma"
cp -r node_modules/.prisma/. "$BUNDLE_DIR/node_modules/.prisma/"
mkdir -p "$BUNDLE_DIR/node_modules/@prisma"
cp -r node_modules/@prisma/. "$BUNDLE_DIR/node_modules/@prisma/"

# Create data directory placeholder
mkdir -p "$BUNDLE_DIR/data"
touch "$BUNDLE_DIR/data/.gitkeep"

# ── Step 6: Download portable Node.js ─────────────────────────────────────────
echo "[6/7] Downloading portable Node.js $NODE_VERSION for $TARGET..."
mkdir -p "$BUNDLE_DIR/node"

if [ "$TARGET" = "windows" ]; then
    NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
    TMP_ZIP="/tmp/node-taskflow-win.zip"
    wget -q --show-progress "$NODE_URL" -O "$TMP_ZIP" \
        || curl -L --progress-bar "$NODE_URL" -o "$TMP_ZIP"
    unzip -q "$TMP_ZIP" "node-v${NODE_VERSION}-win-x64/node.exe" -d /tmp/node-tf-win/
    cp "/tmp/node-tf-win/node-v${NODE_VERSION}-win-x64/node.exe" "$BUNDLE_DIR/node/"
    rm -rf /tmp/node-tf-win "$TMP_ZIP"

    # Copy Windows-specific Prisma binary only
    find "$BUNDLE_DIR/node_modules/.prisma" -name "*linux*" -delete 2>/dev/null || true
    find "$BUNDLE_DIR/node_modules/.prisma" -name "*darwin*" -delete 2>/dev/null || true

    # Copy launcher scripts
    cp installer/start.bat "$BUNDLE_DIR/"
    cp installer/install.bat "$BUNDLE_DIR/"
    cp installer/uninstall.bat "$BUNDLE_DIR/"
    cp installer/taskflow.vbs "$BUNDLE_DIR/"

elif [ "$TARGET" = "linux" ]; then
    NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz"
    TMP_TGZ="/tmp/node-taskflow-linux.tar.gz"
    wget -q --show-progress "$NODE_URL" -O "$TMP_TGZ" \
        || curl -L --progress-bar "$NODE_URL" -o "$TMP_TGZ"
    tar xzf "$TMP_TGZ" -C /tmp/ "node-v${NODE_VERSION}-linux-x64/bin/node"
    cp "/tmp/node-v${NODE_VERSION}-linux-x64/bin/node" "$BUNDLE_DIR/node/"
    chmod +x "$BUNDLE_DIR/node/node"
    rm -rf "/tmp/node-v${NODE_VERSION}-linux-x64" "$TMP_TGZ"

    # Remove non-Linux Prisma binaries
    find "$BUNDLE_DIR/node_modules/.prisma" -name "*windows*" -delete 2>/dev/null || true
    find "$BUNDLE_DIR/node_modules/.prisma" -name "*darwin*" -delete 2>/dev/null || true

    # Copy launcher scripts
    cp installer/start.sh "$BUNDLE_DIR/"
    cp installer/install.sh "$BUNDLE_DIR/"
    cp installer/uninstall.sh "$BUNDLE_DIR/"
    chmod +x "$BUNDLE_DIR/start.sh" "$BUNDLE_DIR/install.sh" "$BUNDLE_DIR/uninstall.sh"

else
    echo "Unknown target: $TARGET. Use 'windows' or 'linux'."
    exit 1
fi

# ── Step 7: Create archive ────────────────────────────────────────────────────
echo "[7/7] Creating archive..."
cd dist
if [ "$TARGET" = "windows" ]; then
    zip -r "${BUNDLE_NAME}.zip" "${BUNDLE_NAME}/" -x "*.gitkeep"
    ARCHIVE="${BUNDLE_NAME}.zip"
else
    tar czf "${BUNDLE_NAME}.tar.gz" "${BUNDLE_NAME}/" --exclude="*.gitkeep"
    ARCHIVE="${BUNDLE_NAME}.tar.gz"
fi
cd ..

echo ""
echo "==================================================="
echo " Bundle ready: dist/${ARCHIVE}"
echo "==================================================="
echo ""
echo " Next steps:"
if [ "$TARGET" = "windows" ]; then
echo "  1. Transfer dist/${ARCHIVE} to the target Windows PC"
echo "  2. Extract the ZIP"
echo "  3. Right-click install.bat → Run as administrator"
echo "     OR double-click start.bat to run without installing"
echo "  4. Open http://localhost:3000 in the browser"
else
echo "  1. Transfer dist/${ARCHIVE} to the target Linux machine"
echo "  2. tar xzf ${ARCHIVE}"
echo "  3. cd ${BUNDLE_NAME} && sudo ./install.sh"
echo "     OR ./start.sh to run without installing"
echo "  4. Open http://localhost:3000 in the browser"
fi
echo ""
