# Intranet Deployment Guide

This app is a Next.js + Prisma + MySQL application. Below are two common ways to deploy on an intranet:

- Docker (recommended)
- Bare-metal/VM (Node.js service + MySQL)

## 1) Docker deployment

Prerequisites:
- Docker Engine and Docker Compose on the host

Steps:
1. Configure environment:
   - Copy `.env.local.example` to `.env` and set values (especially `DATABASE_URL` if not using compose DB, and SMTP_* if sending emails).
2. Build and run via Compose:
   - `docker compose up -d --build`
3. App will be available at http://<host>:3000
4. Initialize database:
   - Exec into the container and run Prisma migrations and seed (optional):
     - `docker compose exec app npx prisma migrate deploy`
     - `docker compose exec app npm run db:seed`

Notes:
- The `next.config.ts` uses `output: "standalone"` to produce a self-contained server for slimmer images.
- Default DB credentials in compose are for local intranet use; change them for production.

## 2) Bare-metal/VM deployment

Prerequisites:
- Node.js 20+
- MySQL 8.x

Steps:
1. Install dependencies: `npm ci`
2. Set environment variables (e.g., in a systemd unit or a `.env` file loaded by your process manager):
   - `DATABASE_URL=mysql://<user>:<pass>@<db-host>:3306/<db>`
   - (Optional) SMTP_* variables for email alerts
3. Generate Prisma client: `npm run prisma:generate`
4. Run migrations: `npx prisma migrate deploy`
5. Build the app: `npm run build`
6. Start the app: `npm run start`

To keep the app running, use a process manager (systemd, PM2, NSSM on Windows Server) and reverse-proxy via Nginx/Apache if needed.

## Reverse proxy + SSL (optional)

Place Nginx or Apache in front of the app for SSL termination and host-based routing. Example Nginx block:

```
server {
  listen 80;
  server_name inventory.local;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## SMTP for alert emails

Set these envs if you need email alerts:
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

Configure recipients in the app under Settings → "Stock alert notification emails".

## Backups

- Database backups: use `mysqldump` or your DB tooling.
- App config backup: use the built-in Backup page to export JSON, or copy the database and `.env`.

## Troubleshooting 401/Unauthorized after login

If users get 401 on an intranet (HTTP) deployment, it's usually the session cookie being dropped:

- Cookie "Secure" flag on HTTP: By default, production sets cookies as `Secure` (HTTPS only). On HTTP-only intranet, set `COOKIE_SECURE=false` in the environment for the app service.
- Different domain/port: Ensure you are accessing the app via the same host/port the browser will send cookies to. Reverse proxies should preserve `Host` and `X-Forwarded-*` headers.
- Time skew: If server time is far off, cookies may be considered expired. Sync time (NTP) on the server.
- Proxy stripping cookies: Make sure your proxy config isn't removing `Set-Cookie` headers.

Windows Service/IIS reverse proxy notes:
- If fronted by IIS or ARR, enable sticky cookies and avoid rewriting `Set-Cookie`.
- If you later enable HTTPS, remove `COOKIE_SECURE=false` so cookies use Secure again.
