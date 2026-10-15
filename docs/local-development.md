# Local Development Notes

Setup steps are in the [README](../README.md#quick-start). This page covers details that only matter when running the app yourself.

## Ports

- Web: `3000` (Next.js picks the next free port, such as `3001`, if `3000` is busy; `CORS_ORIGIN` in `.env.example` already allows both)
- API: `4000`
- Health check: `http://localhost:4000/health`

The Cloudflare Tunnel compose file binds different host ports (`127.0.0.1:3100` for web, `127.0.0.1:4100` for the API) to avoid clashing with other services on the same server. See [deploy-cloudflare-tunnel.md](deploy-cloudflare-tunnel.md).

## LAN Access

You can open the dev server from another device on the same network using the host machine's IP, for example `http://192.168.1.5:3000`.

- When `NEXT_PUBLIC_API_URL` points at `localhost` or `127.0.0.1` and the page is opened from a non-local host, the frontend rewrites the API host to match the page host, for example `http://192.168.1.5:4000/api`.
- The API accepts CORS requests from the configured `CORS_ORIGIN` values, private LAN ranges (`10.x`, `172.16-31.x`, `192.168.x`), and Tailscale-style `100.64.0.0/10` addresses.

## Database

PostgreSQL must be reachable through `DATABASE_URL`. To run only the database in Docker:

```bash
docker compose up -d postgres
```

Re-run `npm run seed` to reset the demo data.
