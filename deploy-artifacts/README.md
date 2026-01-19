# Deploy artifacts

Tarballs built on 2026-01-19 for backend, storefront, and admin.

## Files
- `backend.tar.gz` — Nest API (`dist/`, `package*.json`, `prisma/schema.prisma`, `prisma/seed.js`)
- `frontend.tar.gz` — Next storefront standalone (`standalone/`, `static/`, `public/`, `package*.json`)
- `admin-panel.tar.gz` — Next admin standalone (`standalone/`, `static/`, `public/`, `package*.json`)

## Server usage (AWS Ubuntu)
Backend:
1. `sudo mkdir -p /var/www/flower-backend && cd /var/www/flower-backend`
2. `sudo tar -xzf /path/to/backend.tar.gz -C .`
3. Add `.env` (PORT=3001, database URL, etc.).
4. `npm ci --omit=dev`
5. Start: `node dist/main.js` (or pm2/systemd).

Frontend:
1. `sudo mkdir -p /var/www/flower-frontend && cd /var/www/flower-frontend`
2. `sudo tar -xzf /path/to/frontend.tar.gz -C .`
3. Add `.env` if needed.
4. Start: `PORT=3000 HOST=0.0.0.0 node standalone/server.js`

Admin panel:
1. `sudo mkdir -p /var/www/flower-admin && cd /var/www/flower-admin`
2. `sudo tar -xzf /path/to/admin-panel.tar.gz -C .`
3. Start: `PORT=3002 HOST=0.0.0.0 node standalone/server.js`

## Cleanup commands on server
- `sudo apt-get clean && sudo apt-get autoremove --purge -y`
- `sudo journalctl --vacuum-size=100M`
- `sudo find /var/www -maxdepth 3 \( -name "node_modules" -o -name ".next" -o -name "dist" -o -name ".turbo" -o -name ".cache" \) -prune -print -exec rm -rf {} +`
- `npm cache clean --force`
- If Docker present: `docker system prune -a -f && docker volume prune -f`
