import { resolveBetterAuthBaseURL } from "./better-auth-config";

describe("resolveBetterAuthBaseURL", () => {
  it("falls back to the local server URL when the env var is missing", () => {
    expect(resolveBetterAuthBaseURL({})).toBe("http://localhost:3000/api/v1/auth");
  });

  it("uses the configured BETTER_AUTH_URL and appends the auth path", () => {
    expect(resolveBetterAuthBaseURL({ BETTER_AUTH_URL: "https://api.example.com" })).toBe(
      "https://api.example.com/api/v1/auth"
    );
  });
});
