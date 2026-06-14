#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/formbridge"
DOMAIN="https://formbridge.shora.site"
BACKEND_PORT="4001"
PM2_APP="formbridge-backend"
NGINX_SITE="formbridge"

BACK_ENV="$APP_DIR/backend/.env.production"
FRONT_ENV="$APP_DIR/frontend/.env.production"
FRONT_ENV_DEV="$APP_DIR/frontend/.env"
SECRET_BACK_ENV="/opt/formbridge-secrets/backend.env.production"
SECRET_FRONT_ENV="/opt/formbridge-secrets/frontend.env.production"

echo "[1/9] Update code"
cd "$APP_DIR"
git fetch origin
git reset --hard origin/main

echo "[2/9] Verify project structure"
test -d "$APP_DIR/backend" || { echo "Missing backend directory" >&2; exit 1; }
test -d "$APP_DIR/frontend" || { echo "Missing frontend directory after git reset" >&2; exit 1; }
test -f "$APP_DIR/backend/package.json" || { echo "Missing backend/package.json" >&2; exit 1; }
test -f "$APP_DIR/frontend/package.json" || { echo "Missing frontend/package.json" >&2; exit 1; }

echo "[3/9] Restore protected env files"
test -f "$SECRET_BACK_ENV" || { echo "Missing backend env: $SECRET_BACK_ENV" >&2; exit 1; }
test -f "$SECRET_FRONT_ENV" || { echo "Missing frontend env: $SECRET_FRONT_ENV" >&2; exit 1; }
grep -q "^PORT=" "$SECRET_BACK_ENV" || { echo "Backend env is invalid: missing PORT= in $SECRET_BACK_ENV" >&2; exit 1; }
grep -q "^PORT=$BACKEND_PORT$" "$SECRET_BACK_ENV" || { echo "Backend env is invalid: expected PORT=$BACKEND_PORT in $SECRET_BACK_ENV" >&2; exit 1; }
grep -q "^DB_HOST=" "$SECRET_BACK_ENV" || { echo "Backend env is invalid: missing DB_HOST= in $SECRET_BACK_ENV" >&2; exit 1; }
grep -q "^OPENAI_API_KEY=" "$SECRET_BACK_ENV" || { echo "Backend env is invalid: missing OPENAI_API_KEY= in $SECRET_BACK_ENV" >&2; exit 1; }
grep -q "^VITE_API_URL=" "$SECRET_FRONT_ENV" || { echo "Frontend env is invalid: missing VITE_API_URL= in $SECRET_FRONT_ENV" >&2; exit 1; }
if [ -d "$APP_DIR/secrets" ]; then
  echo "Warning: $APP_DIR/secrets exists but is ignored. Using /opt/formbridge-secrets only."
fi
cp "$SECRET_BACK_ENV" "$BACK_ENV"
cp "$SECRET_FRONT_ENV" "$FRONT_ENV"
cp "$SECRET_FRONT_ENV" "$FRONT_ENV_DEV"
chmod 600 "$BACK_ENV" "$FRONT_ENV" "$FRONT_ENV_DEV"
echo "Backend env source:  $SECRET_BACK_ENV"
echo "Frontend env source: $SECRET_FRONT_ENV"

echo "[4/9] Backend install"
cd "$APP_DIR/backend"
npm install

echo "[5/9] Frontend install + build"
cd "$APP_DIR/frontend"
npm install
npm run build

echo "[6/9] Restart backend with PM2"
cd "$APP_DIR/backend"
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  NODE_ENV=production ENV_FILE=.env.production pm2 restart "$PM2_APP" --update-env
else
  NODE_ENV=production ENV_FILE=.env.production pm2 start src/server.js --name "$PM2_APP" --update-env
fi
pm2 save

echo "[7/9] Reload nginx"
if [ -f "/etc/nginx/sites-available/$NGINX_SITE" ]; then
  sudo nginx -t
  sudo systemctl reload nginx
else
  echo "Nginx site /etc/nginx/sites-available/$NGINX_SITE not found; skipping nginx reload"
fi

echo "[8/9] Health checks with retry"
curl -fsS -I "$DOMAIN" | head -n 5
for i in {1..30}; do
  if curl -fsS "$DOMAIN/health" >/dev/null; then
    echo "Backend health is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Backend health did not become ready in time" >&2
    echo "Last PM2 logs:"
    pm2 logs "$PM2_APP" --lines 80 --nostream || true
    exit 1
  fi
  sleep 2
done

echo "[9/9] Done"
echo "Deploy completed successfully."
echo "App:     $DOMAIN"
echo "Backend: $DOMAIN/health"
