#!/bin/sh
# nginx/entrypoint.sh
# Substitutes $PORT into nginx.conf and starts nginx.
# Render sets $PORT (e.g., 10000). We must listen on that port.

set -e

# Render injects PORT — use it for the HTTP listener.
HTTP_PORT="${PORT:-80}"

# Replace the listen directives in nginx.conf with the actual port.
sed -i "s/listen 80;/listen ${HTTP_PORT};/g" /etc/nginx/nginx.conf
sed -i "s/listen \[::\]:80;/listen \[::\]:${HTTP_PORT};/g" /etc/nginx/nginx.conf

# If TLS certs exist, enable the TLS server block; otherwise, it's a no-op.
if [ -f /etc/nginx/tls/bexiemart.crt ] && [ -f /etc/nginx/tls/bexiemart.key ]; then
  echo "TLS certificates found — enabling HTTPS listener on 443"
else
  echo "No TLS certificates found — HTTP only on port ${HTTP_PORT}"
fi

exec nginx -g "daemon off;"