const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export const ENV = {
  API_URL: BASE,
  SOCKET_URL: BASE.replace("/api/v1", "/chat"),
  DELIVERY_SOCKET_URL: BASE.replace("/api/v1", "/delivery"),
};
