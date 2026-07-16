import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/session/verify-totp", () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(global, "fetch" as any);
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it("returns error status if verify-totp API fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Invalid verification code" }),
    });

    const req = new NextRequest("http://localhost/api/session/verify-totp", {
      method: "POST",
      body: JSON.stringify({ code: "000000" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe("Invalid verification code");
  });

  it("returns 403 if user role is not ADMIN", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: "fake-token",
        user: { id: "user-1", role: "CUSTOMER" },
      }),
    });

    const req = new NextRequest("http://localhost/api/session/verify-totp", {
      method: "POST",
      body: JSON.stringify({ code: "123456" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.message).toBe("Not an admin account");
  });

  it("sets SESSION_COOKIE and returns user if code and role are valid", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: "admin-session-token",
        user: { id: "admin-1", role: "ADMIN" },
      }),
    });

    const req = new NextRequest("http://localhost/api/session/verify-totp", {
      method: "POST",
      body: JSON.stringify({ code: "123456" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user).toEqual({ id: "admin-1", role: "ADMIN" });
    const cookies = res.headers.get("set-cookie");
    expect(cookies).toContain("bx_admin_session=admin-session-token");
  });
});
