# nginx/Dockerfile
# Builds a minimal nginx image that proxies to the API and Admin services.
# Expects nginx.conf at ./nginx/nginx.conf (mounted at build time).

FROM nginx:alpine

# Copy our nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy TLS directory (optional — only used if certs exist)
COPY nginx/tls /etc/nginx/tls

# Render provides PORT env var; nginx.conf uses $PORT via envsubst at runtime.
# We'll use a small entrypoint script to substitute $PORT into the config.
COPY nginx/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]