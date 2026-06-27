import { ExecutionContext } from "@nestjs/common";
import { OptionalAuthGuard } from "../optional-auth.guard";

describe("OptionalAuthGuard", () => {
  let guard: OptionalAuthGuard;
  let prisma: { session: { findUnique: jest.Mock } };

  const makeCtx = (headers: any) => {
    const request: any = { headers };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  beforeEach(() => {
    prisma = { session: { findUnique: jest.fn() } };
    guard = new OptionalAuthGuard(prisma as any);
  });

  it("allows anonymous requests with no Authorization header (no lookup)", async () => {
    const { context, request } = makeCtx({});
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
  });

  it("attaches the user for a valid, active, non-expired session", async () => {
    const user = { id: "u1", isActive: true };
    prisma.session.findUnique.mockResolvedValue({
      token: "t",
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
    const { context, request } = makeCtx({ authorization: "Bearer t" });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });

  it("stays anonymous (never throws) for an expired session", async () => {
    prisma.session.findUnique.mockResolvedValue({
      token: "t",
      expiresAt: new Date(Date.now() - 60_000),
      user: { id: "u1", isActive: true },
    });
    const { context, request } = makeCtx({ authorization: "Bearer t" });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it("stays anonymous for a deactivated account", async () => {
    prisma.session.findUnique.mockResolvedValue({
      token: "t",
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "u1", isActive: false },
    });
    const { context, request } = makeCtx({ authorization: "Bearer t" });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it("stays anonymous (never throws) when the session lookup fails", async () => {
    prisma.session.findUnique.mockRejectedValue(new Error("db down"));
    const { context, request } = makeCtx({ authorization: "Bearer t" });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });
});
