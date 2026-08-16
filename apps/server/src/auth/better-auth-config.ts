export function resolveBetterAuthBaseURL(env: Record<string, string | undefined> = process.env) {
  const configuredBaseUrl = env.BETTER_AUTH_URL?.trim();
  const fallbackBaseUrl = "http://localhost:3000";
  const baseUrl = configuredBaseUrl || fallbackBaseUrl;

  return `${baseUrl.replace(/\/$/, "")}/api/v1/auth`;
}
