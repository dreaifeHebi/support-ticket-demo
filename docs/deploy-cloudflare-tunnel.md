# Cloudflare Tunnel Deployment

This project is intended to run on the home server with Docker Compose and be exposed through the existing Cloudflare Tunnel for `dreaifehebi.com`.

## Public URLs

- Web: `https://support-ticket.dreaifehebi.com`
- API: `https://support-ticket-api.dreaifehebi.com/api`
- API health check: `https://support-ticket-api.dreaifehebi.com/health`

## Runtime Ports And Network

The app still exposes host-local ports for same-server checks, avoiding conflicts with services already using `3000` and `4000`.

- Web container: `127.0.0.1:3100 -> 3000`
- API container: `127.0.0.1:4100 -> 4000`

Cloudflare Tunnel traffic does not use those host ports. The `api` and `web` services join the existing external Docker network configured by `TUNNEL_NETWORK`, and `cloudflared` routes to these container aliases:

- `support-ticket-web:3000`
- `support-ticket-api:4000`

## Environment

The compose file reads secrets from the local ignored `.env` file. At minimum, set:

```txt
JWT_SECRET=replace-with-a-long-random-secret
POSTGRES_PASSWORD=replace-with-a-long-random-postgres-password
TUNNEL_NETWORK=cloudflared_default
```

Optional chatbot values:

```txt
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=replace-with-your-openai-compatible-key
DEFAULT_MODEL=gpt-4.1-mini
```

## Deploy

Build and start the database, API, and web app:

```bash
docker compose -f docker-compose.cf.yml up -d --build
```

Initialize or reset the demo database:

```bash
docker compose -f docker-compose.cf.yml --profile setup run --rm db-setup
```

The setup command reseeds demo data and deletes existing tickets/users. Run it intentionally, not on every restart.

## Cloudflare Tunnel Ingress

The existing tunnel config should include these entries before the final `http_status:404` catch-all:

```yaml
  - hostname: support-ticket.dreaifehebi.com
    service: http://support-ticket-web:3000
  - hostname: support-ticket-api.dreaifehebi.com
    service: http://support-ticket-api:4000
```

## DNS Records

If `cloudflared tunnel route dns` is unavailable, create these proxied CNAME records in Cloudflare DNS:

```txt
support-ticket      CNAME <tunnel-id>.cfargotunnel.com
support-ticket-api  CNAME <tunnel-id>.cfargotunnel.com
```

Use the real tunnel target from your Cloudflare Tunnel.
