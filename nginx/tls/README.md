# TLS Termination for the self-hosted stack

The main `nginx.conf` ends with:

```nginx
include /etc/nginx/tls/*.conf;
```

Nginx tolerates a zero-match glob, so the stack boots HTTP-only until you drop
a real `.conf` file here. This gives you TLS without breaking first-run
deployments that have no certificates yet.

## Option A — Let's Encrypt (certbot on the host)

```bash
# From the repo root, while DNS for your domain points at this machine:
docker compose up -d nginx

certbot certonly --webroot -w /var/www/certbot -d bexiemart.example.com
# or standalone (stop nginx first to free port 80):
certbot certonly --standalone -d bexiemart.example.com
```

Then mount certs in `docker-compose.override.yml`:

```yaml
services:
  nginx:
    volumes:
      - /etc/letsencrypt:/etc/nginx/certs:ro
```

Copy `bexiemart.conf.example` to `bexiemart.conf`, set `server_name` and the
certificate paths, then `docker compose restart nginx`.

Renewal: run `certbot renew` via cron/systemd timer, then
`docker compose exec nginx nginx -s reload`.

## Option B — Cloudflare origin certificate

1. Cloudflare dashboard → SSL/TLS → Origin Server → Create Certificate.
2. Save as `nginx/certs/fullchain.pem` and `nginx/certs/privkey.pem`.
3. Add to `docker-compose.override.yml`:

```yaml
services:
  nginx:
    volumes:
      - ./nginx/certs:/etc/nginx/certs:ro
```

4. Copy `bexiemart.conf.example` → `bexiemart.conf`, fill in your domain,
   restart nginx. Set the Cloudflare SSL mode to **Full (strict)**.

> Never commit private keys. `nginx/certs/` must stay gitignored.

## Verify

```bash
docker compose exec nginx nginx -t
curl -I https://bexiemart.example.com/api/v1/health
```
