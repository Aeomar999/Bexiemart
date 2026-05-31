export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
  SOCKET_URL: (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1").replace('/api/v1', '/chat'),
};
