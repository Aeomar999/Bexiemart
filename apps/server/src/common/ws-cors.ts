/**
 * Socket.IO CORS options for all WebSocket gateways.
 *
 * `app.enableCors()` in main.ts only covers the HTTP layer — the Socket.IO
 * adapter has its own CORS handling and blocks cross-origin browser handshakes
 * by default. We mirror the REST allowlist here so the admin portal (and any
 * other browser client) on its deployed origin can complete the WS handshake.
 *
 * Kept in lockstep with the `CORS_ORIGIN` parsing in main.ts.
 */
export function wsCorsOptions() {
  return {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["bexiemart://", "exp://", "http://localhost:3001", "https://admin.bexiemart.com"],
    credentials: true,
  };
}
