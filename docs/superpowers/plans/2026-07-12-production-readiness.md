# Bexiemart Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the Bexiemart monorepo (server / mobile / admin) to production readiness: every user-facing feature is real (no mocked success, no dead routes, no hardcoded data), the admin token is no longer XSS-readable, withdrawals go through the hardened wallet path with PIN enforcement, reels get a real video pipeline, and the server ships with reproducible deploy config.

**Architecture:** Seven sequential phases, each an independently shippable PR branched off `main`. The unifying design move: the customer wallet already has the hardened money path (`WalletService.withdraw`: PIN verify → config fee → Paystack recipient → atomic guarded decrement → PENDING transaction) — vendor and dispatcher withdrawals *delegate to it* instead of keeping their own half-fake paths. Fake settings screens get wired to endpoints that mostly already exist (`/wallet/pin/change`, `/support/tickets`, better-auth `/change-password` once the `bearer()` plugin is added); genuinely missing capabilities (2FA, notification preferences, loyalty coins, reel comments/video) get small new modules following the codebase's existing NestJS module conventions.

**Tech Stack:** NestJS 10 + Prisma (PostgreSQL) + better-auth (custom Nest controller wrapping `auth.api`, Bearer session tokens validated by `AuthGuard` against the `Session` table) · Expo / React Native (expo-router, NativeWind classNames, TanStack Query, zustand, `apiClient` axios with SecureStore token) · Next.js admin (App Router, TanStack Query, zustand) · Paystack (test mode by decision) · Cloudinary (signed uploads via `/upload/signature`).

## Global Constraints

- **Paystack stays in TEST mode.** Never swap `pk_test_…` for a live key in this plan. The live-key swap is a launch-day manual step (Task 37 checklist). Do add the loud guard (Task 3).
- **Never commit secrets.** Apple `ascAppId`/`appleTeamId` and the Play `google-api-key.json` are user-supplied; tasks reference them but never invent values.
- **No fake success.** Any UI control that cannot be made real in its task must be removed, not stubbed with a success toast. This is the prime directive of the whole plan.
- **Server error idiom:** throw Nest `BadRequestException` / `NotFoundException` / `UnauthorizedException` / `ForbiddenException` — never bare `Error` (bare `Error` becomes a 500).
- **Mobile error idiom:** report failures via `usePopupStore().showPopup({ type: "error", … })` or `Alert.alert`; never silently `catch`.
- **Mobile styling idiom:** NativeWind `className` strings + semantic tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`); flat design — borders, not shadows. Components: `Icon`, `Button`, `BackButton` from `@/components/ui/*`.
- **Money types:** Prisma `Decimal` for all currency amounts (`Float` only for lat/lng). Convert with `Number(...)` at the API boundary as existing code does.
- **All server DB writes that touch two tables run in `this.prisma.$transaction`.**
- **Windows dev environment.** Commands below are PowerShell-safe (`;` separators, no `&&`).
- **Each phase = one PR off `main`**, named as given in the phase header. Commit after every task with the message given in its final step.
- **Test runners:** server `cd apps/server; npx jest <pattern> --verbose` · mobile `cd apps/mobile; npx jest <pattern>` (component tests exist — e.g. `SocialLogins.test.tsx`) · typecheck each app with `npx tsc --noEmit`.
- **Prisma migrations:** run from `apps/server`: `npx prisma migrate dev --name <name>`. `apps/server/prisma/schema.prisma` is the ONLY real schema (the root-level `schema.prisma` is stale and deleted in Task 32).

## Phase map

| Phase | Branch | Tasks | Delivers |
|---|---|---|---|
| 0 | `chore/prod-baseline` | 1 | Verified green baseline |
| 1 | `fix/launch-gates` | 2–5 | AAB build, Paystack guard, admin token out of localStorage, bearer plugin + trustedOrigins |
| 2 | `fix/bucket-a-correctness` | 6–12 | The 8 Bucket-A fixes (dead routes, discarded input, fake tel:) |
| 3 | `feat/real-money-paths` | 13–17 | PIN-enforced real withdrawals, loyalty coins real |
| 4 | `feat/account-security-settings` | 18–25 | Notification prefs, change-password/PIN, device sessions, 2FA (server/mobile/admin), contact support |
| 5 | `feat/reels-video-pipeline` | 26–29 | Real video upload/playback, comments, following feed |
| 6 | `chore/deploy-infra` | 30–32 | Dockerfile, railway.json, health check, admin CI, Sentry |
| 7 | `fix/honesty-polish` | 33–37 | Dispatcher profile honesty, review photos, tax verification, console sweep, launch-day checklist |

---

## Phase 0 — Baseline

### Task 1: Branch and verify green baseline

**Files:** none created — verification only.

**Interfaces:**
- Consumes: current `main`.
- Produces: a recorded green baseline all later phases diff against.

- [x] **Step 1: Sync main and create the phase branch**

```powershell
git checkout main; git pull origin main
git checkout -b chore/prod-baseline
```

- [x] **Step 2: Install and typecheck all three apps**

```powershell
cd apps/server; npm ci; npx tsc --noEmit
cd ../mobile; npm ci; npx tsc --noEmit
cd ../admin; npm ci; npx tsc --noEmit
```
Expected: all three exit 0.

- [x] **Step 3: Run server and mobile test suites**

```powershell
cd apps/server; npx jest --silent
cd ../mobile; npx jest --silent
```
Expected: PASS (audit 2026-07-05 recorded both suites green; if anything fails here, STOP and fix before proceeding — later phases assume green).

- [x] **Step 4: Record the baseline**

```powershell
git commit --allow-empty -m "chore: record green prod-readiness baseline (typecheck + jest, 3 apps)"
```

---

## Phase 1 — Launch gates (`fix/launch-gates`)

Branch: `git checkout main; git checkout -b fix/launch-gates`

### Task 2: Production build config — AAB, Cloudinary env, submit placeholders documented

**Files:**
- Modify: `apps/mobile/eas.json`

**Interfaces:**
- Consumes: nothing.
- Produces: a production profile that Play Store accepts (AAB) and that has the same env completeness as preview/device.

- [x] **Step 1: Switch production Android to app-bundle and add the missing Cloudinary env**

In `apps/mobile/eas.json`, the `build.production` block currently reads `"buildType": "apk"` and its `env` lacks `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` (present in preview/device — only benign today because `CloudinaryImage.tsx` hardcodes a fallback). Replace the `production` block's `android` and add the env key:

```json
"production": {
  "autoIncrement": true,
  "channel": "production",
  "android": {
    "buildType": "app-bundle"
  },
  "env": {
    "EXPO_PUBLIC_API_URL": "https://bexiemart-production.up.railway.app/api/v1",
    "EXPO_PUBLIC_SOCKET_URL": "wss://bexiemart-production.up.railway.app",
    "EXPO_PUBLIC_SENTRY_DSN": "https://0c4866316a83164b10cafea12af5a195@o4511490466119680.ingest.de.sentry.io/4511490530148432",
    "EXPO_PUBLIC_POSTHOG_API_KEY": "phc_nQvLXaLZDchbn2RLbeBkZhtpFbDyPfU7jcSMYYnh8Dkx",
    "EXPO_PUBLIC_POSTHOG_HOST": "https://us.i.posthog.com",
    "EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY": "pk_test_8cd3b286f7b46cf8700f982bb1c8bb0f41afca0c",
    "EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME": "duirkgqop"
  }
}
```
(The Paystack key deliberately stays `pk_test_` — Global Constraints.)

- [x] **Step 2: Flag the placeholder submit identifiers**

The `submit.production.ios` block contains placeholders (`"ascAppId": "1234567890"`, `"appleTeamId": "TEAMID1234"`). These are USER-SUPPLIED and cannot be invented. Add a sibling comment key so the placeholder can't silently ship (JSON has no comments; use an ignored key):

```json
"ios": {
  "appleId": "developer@bexiemart.com",
  "ascAppId": "1234567890",
  "appleTeamId": "TEAMID1234",
  "_TODO": "ascAppId and appleTeamId are PLACEHOLDERS — replace with real App Store Connect values before `eas submit` (see Task 36 launch checklist)"
}
```

- [x] **Step 3: Validate the JSON parses**

```powershell
cd apps/mobile; node -e "JSON.parse(require('fs').readFileSync('eas.json','utf8')); console.log('eas.json OK')"
```
Expected: `eas.json OK`

- [x] **Step 4: Commit**

```powershell
git add apps/mobile/eas.json
git commit -m "fix(build): production AAB, Cloudinary env, flag placeholder submit IDs"
```

### Task 3: Paystack loud guard — no silent test-mode fallback

**Files:**
- Modify: `apps/mobile/app/_layout.tsx` (line ~161: `publicKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder"}`)
- Create: `apps/mobile/src/components/ui/PaymentTestModeBanner.tsx`

**Interfaces:**
- Consumes: `process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY`.
- Produces: `PaymentTestModeBanner` (no props) — render once near the root; renders `null` when payments are live.

- [x] **Step 1: Write the banner component**

Create `apps/mobile/src/components/ui/PaymentTestModeBanner.tsx`:

```tsx
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";

/**
 * Loud, impossible-to-miss indicator that payments run against Paystack TEST
 * keys. Renders in release builds too — by decision, test mode may ship, but
 * it must never ship silently.
 */
export function PaymentTestModeBanner() {
  if (!KEY.startsWith("pk_test_")) return null;
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="alert"
      className="bg-amber-500 items-center justify-center py-1"
      style={{ marginTop: insets.top > 0 ? 0 : 4 }}
    >
      <Text className="text-xs font-bold text-black">
        PAYMENTS IN TEST MODE — no real money moves
      </Text>
    </View>
  );
}
```

- [x] **Step 2: Remove the silent fallback and fail loudly when the key is missing**

In `apps/mobile/app/_layout.tsx`, above the component that renders `PaystackProvider`, add:

```tsx
const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY;
if (!PAYSTACK_PUBLIC_KEY) {
  // Refuse to boot with payments unconfigured rather than silently running a
  // placeholder test key. Surfaces immediately in dev and in CI builds.
  throw new Error(
    "EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY is not set. Configure it in eas.json / .env before running the app."
  );
}
```

and change the provider line:

```tsx
// BEFORE
<PaystackProvider publicKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder"}>
// AFTER
<PaystackProvider publicKey={PAYSTACK_PUBLIC_KEY}>
```

Then render the banner directly under the existing `<OfflineBanner />` (line ~158):

```tsx
<OfflineBanner />
<PaymentTestModeBanner />
```
with the import `import { PaymentTestModeBanner } from "@/components/ui/PaymentTestModeBanner";` alongside the other component imports.

- [x] **Step 3: Typecheck and verify on device/simulator**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: launch the app (`npx expo start`) — amber "PAYMENTS IN TEST MODE" banner visible at top; removing the env var from `.env` and restarting must crash at startup with the explicit error.

- [x] **Step 4: Commit**

```powershell
git add apps/mobile/app/_layout.tsx apps/mobile/src/components/ui/PaymentTestModeBanner.tsx
git commit -m "fix(payments): remove silent pk_test_placeholder fallback, add loud test-mode banner"
```

### Task 4: Admin session out of localStorage — httpOnly cookie + same-origin proxy

The admin JWT currently persists via `zustand/persist` to localStorage (`apps/admin/src/lib/stores/auth-store.ts`, store name `bexiemart-admin-auth`) and every API call attaches it client-side (`apps/admin/src/lib/api/client.ts`). Any XSS = admin session theft. Fix: the token moves into an **httpOnly cookie** set by a Next.js route handler; all REST calls go through a **same-origin proxy route** that attaches the token server-side; `middleware.ts` gates dashboard routes. The zustand store keeps only the (non-secret) user profile. The socket needs the raw token to connect directly to Railway — it fetches it on demand from a route handler (short-lived exposure in memory only, never persisted; residual XSS risk documented inline).

**Files:**
- Create: `apps/admin/src/app/api/session/route.ts`
- Create: `apps/admin/src/app/api/session/token/route.ts`
- Create: `apps/admin/src/app/api/proxy/[...path]/route.ts`
- Create: `apps/admin/src/middleware.ts`
- Modify: `apps/admin/src/lib/api/client.ts`
- Modify: `apps/admin/src/lib/api/auth.ts` (the `login` function)
- Modify: `apps/admin/src/lib/stores/auth-store.ts`
- Modify: `apps/admin/src/lib/hooks/use-auth.ts`
- Modify: `apps/admin/src/lib/socket.ts`
- Modify: call sites of `logout()` / `token` (found via grep in Step 7): `apps/admin/src/components/layout/Sidebar.tsx`, `apps/admin/src/components/layout/DashboardLayout.tsx`, `apps/admin/src/lib/hooks/use-socket.ts`, `apps/admin/src/app/(dashboard)/settings/profile/page.tsx`

**Interfaces:**
- Consumes: Nest `POST /auth/login` → `{ user, token }` (token = better-auth session token; `user.role` must be `"ADMIN"`).
- Produces:
  - `POST /api/session` `{email, password}` → `{ user }` + sets httpOnly cookie `bx_admin_session`; `401/403` on failure.
  - `DELETE /api/session` → clears cookie.
  - `GET /api/session/token` → `{ token }` (socket use only; requires the cookie).
  - `ANY /api/proxy/<path>` → forwards to `${API_URL}/<path>` with `Authorization: Bearer <cookie token>`.
  - Store: `useAuthStore` loses `token`; `setAuth(user: User)` (single arg); everything else unchanged.

- [x] **Step 1: Session route handler**

Create `apps/admin/src/app/api/session/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
export const SESSION_COOKIE = "bx_admin_session";

const cookieOptions = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // mirror server session expiresIn (7d)
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message ?? "Login failed" },
      { status: res.status }
    );
  }
  // 2FA challenge passthrough (Task 19 server work): no cookie yet.
  if (data.requiresTwoFactor) {
    return NextResponse.json({ requiresTwoFactor: true });
  }
  if (data.user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Not an admin account" }, { status: 403 });
  }
  const response = NextResponse.json({ user: data.user });
  response.cookies.set(SESSION_COOKIE, data.token, cookieOptions);
  return response;
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
```

- [x] **Step 2: Socket-token route handler**

Create `apps/admin/src/app/api/session/token/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../route";

/**
 * Socket.io must connect directly to the API host, so it needs the raw token.
 * Exposing it via this endpoint (cookie-gated, returned to page JS on demand)
 * is a deliberate, narrower exposure than the previous persistent localStorage
 * copy: nothing survives a page close, and nothing is readable without an
 * authenticated cookie.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ token });
}
```

- [x] **Step 3: Proxy route handler**

Create `apps/admin/src/app/api/proxy/[...path]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../session/route";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(`${API_URL}/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType; // preserves multipart boundary

  const init: RequestInit = { method: req.method, headers, cache: "no-store" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = Buffer.from(await req.arrayBuffer());
  }

  const res = await fetch(url, init);
  const body = Buffer.from(await res.arrayBuffer());
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
};
```
Note: if the project's Next.js major is 14 (check `apps/admin/package.json`), `ctx.params` is a plain object — drop the `await` and type it `{ params: { path: string[] } }`.

- [x] **Step 4: Route-guard middleware**

Create `apps/admin/src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "bx_admin_session";
const PUBLIC_PATHS = ["/login", "/api/session"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!req.cookies.get(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
```

- [x] **Step 5: Point the axios client at the proxy and drop the token interceptor**

Replace the whole of `apps/admin/src/lib/api/client.ts` with:

```ts
import axios from "axios";
import { useAuthStore } from "../stores/auth-store";

// All REST traffic goes through the same-origin proxy; the httpOnly session
// cookie rides along automatically and the proxy attaches the Bearer header
// server-side. Page JS never sees the token.
export const apiClient = axios.create({
  baseURL: "/api/proxy",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      await fetch("/api/session", { method: "DELETE" }).catch(() => {});
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

- [x] **Step 6: Rework login API, store, and hooks**

In `apps/admin/src/lib/api/auth.ts`, replace the `login` function (keep `getMe`, `updateProfile`, `uploadFile`; `updatePassword` is reworked in Task 20):

```ts
export const login = async (credentials: { email: string; password: string }) => {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data; // { user } or { requiresTwoFactor: true }
};
```

Replace the whole of `apps/admin/src/lib/stores/auth-store.ts` with:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  logout: () => void;
}

// Only the (non-secret) user profile persists. The session token lives in an
// httpOnly cookie owned by /api/session and is never readable from page JS.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "bexiemart-admin-auth" }
  )
);
```

Replace the whole of `apps/admin/src/lib/hooks/use-auth.ts` with:

```ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { login, getMe } from "../api/auth";
import { useAuthStore } from "../stores/auth-store";

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.user) setAuth(data.user);
      // requiresTwoFactor is handled by the login page (Task 19)
    },
  });
}

export function useUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: isAuthenticated,
  });
}
```

In `apps/admin/src/lib/socket.ts`, replace the synchronous token read (line ~10, `const token = useAuthStore.getState().token;`) with an on-demand fetch — make `getSocket` async:

```ts
export const getSocket = async () => {
  if (!socket) {
    const res = await fetch("/api/session/token");
    if (!res.ok) throw new Error("Not authenticated");
    const { token } = await res.json();

    socket = io(`${WS_URL}/admin`, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      // ...keep the remaining existing options unchanged
    });
  }
  return socket;
};
```

- [x] **Step 7: Sweep remaining `token` / `setAuth(user, token)` call sites**

```powershell
cd apps/admin; npx tsc --noEmit
```
The compiler now points at every stale call site (expected: `Sidebar.tsx`, `DashboardLayout.tsx`, `use-socket.ts`, `settings/profile/page.tsx`, the login page). Fix each mechanically:
- `setAuth(user, token)` → `setAuth(user)`.
- Reads of `useAuthStore(...).token` for "am I logged in" → use `isAuthenticated`.
- `use-socket.ts`: `await getSocket()` (it is now async).
- Any logout handler should also call `fetch("/api/session", { method: "DELETE" })`.
Re-run `npx tsc --noEmit` until exit 0.

- [x] **Step 8: Verify end-to-end locally**

```powershell
cd apps/server; npm run start:dev
```
In a second terminal: `cd apps/admin; npm run dev`. Then verify in a browser:
1. Visiting `http://localhost:3001/` unauthenticated redirects to `/login`.
2. Login succeeds; DevTools → Application → Cookies shows `bx_admin_session` with `HttpOnly ✓`; localStorage `bexiemart-admin-auth` contains **no token field**.
3. Dashboard lists load (network tab shows calls to `/api/proxy/...`).
4. Logout clears the cookie and returns to `/login`.

- [x] **Step 9: Commit**

```powershell
git add apps/admin
git commit -m "fix(admin)!: move session token to httpOnly cookie behind same-origin proxy

The admin JWT no longer persists in localStorage (XSS-exfiltrable). REST
goes through /api/proxy with the token attached server-side; middleware
gates dashboard routes; socket fetches its token on demand."
```

### Task 5: better-auth hardening — `bearer()` plugin, env-driven trustedOrigins, sliding sessions

**Files:**
- Modify: `apps/server/src/auth/better-auth.ts`
- Modify: `apps/server/.env.example` (add `ADMIN_ORIGIN`)

**Interfaces:**
- Consumes: existing `createAuth(prisma)`.
- Produces: better-auth catch-all routes (`/auth/change-password`, `/auth/list-sessions`, `/auth/revoke-session`, `/auth/revoke-other-sessions`) usable with the same `Authorization: Bearer <session token>` the rest of the API uses. Tasks 20 and 22 depend on this.

- [x] **Step 1: Add the bearer plugin and session updateAge**

In `apps/server/src/auth/better-auth.ts`:

```ts
// import line — add bearer:
import { phoneNumber, bearer } from "better-auth/plugins";
```

In the `plugins: [...]` array, add as the FIRST entry:

```ts
bearer(), // accept Authorization: Bearer <session token> on better-auth routes
```

Replace the `session` block:

```ts
session: {
  expiresIn: 7 * 24 * 60 * 60,
  updateAge: 24 * 60 * 60, // sliding renewal: active users never hit a hard 7-day logout
},
```

- [x] **Step 2: Make trustedOrigins env-extendable**

Replace the hardcoded `trustedOrigins` array:

```ts
trustedOrigins: [
  "bexiemart://",
  "com.bexiemart.app://",
  "exp://",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8081",
  // Deployed origins (e.g. the Vercel admin) come from env so prod config
  // never requires a code change: ADMIN_ORIGIN="https://admin.example.com"
  ...(process.env.ADMIN_ORIGIN ? [process.env.ADMIN_ORIGIN] : []),
  ...(process.env.EXTRA_TRUSTED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
],
```

Add to `apps/server/.env.example` (create the entries if the file exists; if it doesn't exist, that's Task 32's job — then just note it there):

```
ADMIN_ORIGIN=
EXTRA_TRUSTED_ORIGINS=
```

- [x] **Step 3: Verify bearer accepts the raw session token**

```powershell
cd apps/server; npm run start:dev
```
In another terminal, log in and probe a better-auth route with the returned token:

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/v1/auth/login -ContentType "application/json" -Body '{"email":"<a-seeded-user>","password":"<their-password>"}'
Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/list-sessions -Headers @{ Authorization = "Bearer $($login.token)" }
```
Expected: a JSON array of sessions (fields include `token`, `userAgent`, `ipAddress`, `createdAt`, `expiresAt`).

**Contingency (only if the probe 401s):** some better-auth versions require the *signed* token for bearer auth. Then: (a) in `auth.controller.ts` `login()`, extract the signed token from the `set-cookie` header exactly as `register()` already does (lines 76–78) and return that as `token`; (b) in `apps/server/src/guards/auth.guard.ts` and `optional-auth.guard.ts`, look up the session with the raw prefix: `const raw = token.split(".")[0]` before the `session.findUnique({ where: { token: raw } })`. Re-run the probe and the full server jest suite afterward.

- [x] **Step 4: Run auth-adjacent server tests**

```powershell
cd apps/server; npx jest guards auth --verbose
```
Expected: PASS.

- [x] **Step 5: Commit**

```powershell
git add apps/server/src/auth/better-auth.ts apps/server/.env.example
git commit -m "feat(auth): bearer plugin for better-auth routes, env-driven trustedOrigins, sliding sessions"
```

---

## Phase 2: Bucket A Correctness Fixes (`fix/bucket-a-correctness`) [COMPLETED]

- [x] **Task 6: Dispatcher Post-Login Redirect Fix**
  - Updated `apps/mobile/app/_layout.tsx` redirect to `/(dispatcher)/(tabs)/(home)`.
- [x] **Task 7: Google-Only Customer Social Login**
  - Removed Apple and Facebook social login flows from `SocialLogins.tsx`.
  - Removed vendor social login handling and client-side role mutation.
- [x] **Task 8: Vendor Top Customers Real Search & Count**
  - Bound search input to state in `apps/mobile/app/(vendor)/customers.tsx`.
  - Displayed live `{filtered.length} Total` badge and guarded conversation message navigation.
- [x] **Task 9: Real Dispatcher Help Screen**
  - Built `apps/mobile/app/(dispatcher)/help.tsx` with FAQ accordions and real ticket submission (`POST /support/tickets`).
  - Repointed Earnings Help icon to `/(dispatcher)/help`.
- [x] **Task 10: Service Call Provider Real Number**
  - Updated `apps/mobile/app/(customer)/services/[id].tsx` to dial `service.vendor.phone` or disable visually when null.
- [x] **Task 11: Real Edit Profile Bio & Location Persistence**
  - Added `bio` and `location` fields to `User` schema in `apps/server/prisma/schema.prisma` with migration.
  - Updated `update-profile.dto.ts` and `users.service.ts` to select and update `bio`, `location`, and `phoneNumber`.
  - Updated `apps/mobile/src/components/screens/EditProfileScreen.tsx` to persist `bio` & `location` and made Email & Phone read-only verified inputs.
- [x] **Task 12: Real Call Buttons for Delivery Jobs**
  - Included `phoneNumber` in delivery job customer/dispatcher queries in `apps/server/src/modules/delivery/delivery.service.ts`.
  - Updated customer order tracking (`track-order.tsx`) and dispatcher home (`home/index.tsx`) to dial real phone numbers.

---

## Phase 3 — Real money paths (`feat/real-money-paths`)

Branch: `git checkout main; git checkout -b feat/real-money-paths`

**The design.** The customer wallet already has the ONE hardened withdrawal path — `WalletService.withdraw(userId, amount, accountId, accountType, pin)` at `apps/server/src/modules/wallet/wallet.service.ts:573`: it verifies the PIN, reads the platform fee from `PlatformConfig`, resolves a **linked** bank/momo account by id (rejecting anything without a `paystackRecipientCode`), then atomically reserves funds with a guarded `updateMany({ where: { balance: { gte: totalDeduction } } })` and books a PENDING transaction before touching Paystack. Vendor and dispatcher are just Users with Wallets; their earnings are already credited to `wallet.balance`. So this phase makes vendor & dispatcher withdrawals **use that same endpoint** and deletes their bespoke, PIN-less, free-text-`destination` endpoints (`vendor.service.ts:490`, `dispatcher.service.ts:216`) that today both fake the balance client-side and never verify a PIN.

### Task 13: Mobile withdrawal plumbing — `walletApi.withdraw` + `useWithdraw`

`apps/mobile/src/lib/hooks/use-wallet.ts` has hooks for balance, PIN, bank and momo accounts, but **no withdraw hook** — the `/wallet/withdraw` endpoint has no client. Add it once here; Tasks 14 and 15 consume it.

**Files:**
- Modify: `apps/mobile/src/lib/api/wallet.ts`
- Modify: `apps/mobile/src/lib/hooks/use-wallet.ts`

**Interfaces:**
- Consumes: `POST /wallet/withdraw` `{ amount, accountId, accountType: "bank" | "momo", pin }` → `{ reference, ... }`; `401` on bad PIN → surfaced as error.
- Produces:
  - `walletApi.withdraw(payload: { amount: number; accountId: string; accountType: "bank" | "momo"; pin: string })`
  - `useWithdraw()` → mutation invalidating `WALLET_KEYS.wallet` + `["transactions"]`.

- [x] **Step 1: Add the api method**

In `apps/mobile/src/lib/api/wallet.ts`, alongside the other methods (mirror the `transfer` shape):

```ts
withdraw: (payload: { amount: number; accountId: string; accountType: "bank" | "momo"; pin: string }) =>
  apiClient.post("/wallet/withdraw", payload),
```

- [x] **Step 2: Add the hook**

In `apps/mobile/src/lib/hooks/use-wallet.ts`, after `useTransfer` (line ~51):

```ts
export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      amount: number;
      accountId: string;
      accountType: "bank" | "momo";
      pin: string;
    }) => walletApi.withdraw(payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WALLET_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["vendor", "earnings"] });
      queryClient.invalidateQueries({ queryKey: ["dispatcher", "earnings"] });
    },
  });
}
```

- [x] **Step 3: Typecheck**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0.

- [x] **Step 4: Commit**

```powershell
git add apps/mobile/src/lib/api/wallet.ts apps/mobile/src/lib/hooks/use-wallet.ts
git commit -m "feat(wallet): add withdraw api method + useWithdraw hook"
```

### Task 14: Vendor withdraw screen — real balance, linked methods, PIN

Replace the fakes in `apps/mobile/app/(vendor)/(earnings)/withdraw.tsx`: `availableBalance = 1250.0` (line 46), the hardcoded `WITHDRAWAL_METHODS` (lines 22–25), and the PIN that is collected but never sent (`executeWithdrawal` sends only `{ amount, destination: maskedString }`, lines 90–115). After this task the screen shows the real cleared balance, lets the vendor pick a **linked** bank/momo account (or routes them to link one), and sends the entered PIN to the hardened endpoint.

**Files:**
- Modify: `apps/mobile/app/(vendor)/(earnings)/withdraw.tsx`

**Interfaces:**
- Consumes: `useVendorEarnings()` (`{ availableBalance }`), `useBankAccounts()`, `useMomoAccounts()`, `usePinStatus()` (`{ hasPin }`), `useWithdraw()` (Task 13). Link routes: `/(customer)/wallet/link-account/bank`, `/(customer)/wallet/link-account/momo` (existing). Set-PIN route: reuse the vendor `(settings)/change-pin` flow (Task 21 makes it real) — until then a vendor with `hasPin === false` sees a "Set up your PIN" CTA.
- Produces: nothing consumed downstream.

- [x] **Step 1: Replace data sources and the withdrawal handler**

In `apps/mobile/app/(vendor)/(earnings)/withdraw.tsx`:

1. Delete the `WITHDRAWAL_METHODS` const (lines 22–25) and the `availableBalance = 1250.0` literal (line 46).
2. Add imports and hook calls at the top of the component:

```tsx
import { useVendorEarnings } from "@/lib/hooks/use-vendor";
import { useBankAccounts, useMomoAccounts, usePinStatus, useWithdraw } from "@/lib/hooks/use-wallet";
// ...
const { data: earnings } = useVendorEarnings();
const { data: bankAccounts = [] } = useBankAccounts();
const { data: momoAccounts = [] } = useMomoAccounts();
const { data: pinStatus } = usePinStatus();
const withdrawMutation = useWithdraw();

const availableBalance = Number(earnings?.availableBalance ?? 0);
const methods = [
  ...bankAccounts.map((b: any) => ({ id: b.id, accountType: "bank" as const, title: b.bankName, account: b.accountNumber })),
  ...momoAccounts.map((m: any) => ({ id: m.id, accountType: "momo" as const, title: m.provider, account: m.phoneNumber })),
];
```
Remove the old `useState(WITHDRAWAL_METHODS)` for `methods` and the `useWithdrawEarnings` import/usage. Keep `selectedMethod` state but default it to `methods[0]?.id`.

3. Replace `executeWithdrawal` (lines 90–115) so it sends the real payload:

```tsx
const executeWithdrawal = () => {
  setShowPinModal(false);
  const selected = methods.find((m) => m.id === selectedMethod);
  if (!selected) {
    showPopup({ type: "error", title: "No account", message: "Add a payout account first." });
    return;
  }
  withdrawMutation.mutate(
    { amount: numAmount, accountId: selected.id, accountType: selected.accountType, pin },
    {
      onSuccess: () => {
        setPin("");
        showPopup({
          type: "success",
          title: "Withdrawal Requested",
          message: `GHS ${numAmount.toFixed(2)} is being sent to your ${selected.title} account.`,
        });
        router.back();
      },
      onError: (error: any) => {
        setPin("");
        showPopup({
          type: "error",
          title: "Withdrawal Failed",
          message: error?.message || "Check your PIN and try again.",
        });
      },
    }
  );
};
```

- [x] **Step 2: Add empty-state and set-PIN guards**

Before the amount form renders, guard the two "can't withdraw yet" states (place near the top of the returned JSX, after the header):

```tsx
{methods.length === 0 ? (
  <View className="m-5 p-5 bg-card border border-border rounded-2xl items-center">
    <Icon name="credit-card" size={28} color="#94a3b8" />
    <Text className="text-body-lg font-bold text-foreground mt-3 mb-1">No payout account</Text>
    <Text className="text-body-sm text-muted-foreground text-center mb-4">
      Link a bank or mobile money account to receive withdrawals.
    </Text>
    <Button title="Add payout account" onPress={() => router.push("/(customer)/wallet/link-account/momo")} />
  </View>
) : !pinStatus?.hasPin ? (
  <View className="m-5 p-5 bg-card border border-border rounded-2xl items-center">
    <Icon name="lock" size={28} color="#94a3b8" />
    <Text className="text-body-lg font-bold text-foreground mt-3 mb-1">Set a withdrawal PIN</Text>
    <Text className="text-body-sm text-muted-foreground text-center mb-4">
      Your 4-digit PIN authorizes every payout.
    </Text>
    <Button title="Set up PIN" onPress={() => router.push("/(vendor)/(settings)/change-pin")} />
  </View>
) : (
  // ...existing amount + method-picker + "Request Withdrawal" UI, now driven by `methods`
)}
```
Delete the "Add method" local-state modal (`handleAddMethod`, `showAddMethod`) — payout accounts are managed through the real link-account screens, not fabricated in local state.

- [x] **Step 3: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual (device, against a seeded vendor with a linked momo account and a set PIN): balance matches the earnings screen; entering the wrong PIN shows "Withdrawal Failed"; the correct PIN books a real PENDING `WITHDRAWAL` transaction (verify in DB / transactions list); a vendor with no linked account sees the "No payout account" CTA.

- [x] **Step 4: Commit**

```powershell
git add "apps/mobile/app/(vendor)/(earnings)/withdraw.tsx"
git commit -m "fix(vendor): real withdraw — live balance, linked payout accounts, PIN-authorized via /wallet/withdraw"
```

### Task 15: Dispatcher withdraw screen — same treatment

`apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx` is the twin of the vendor screen (audit items #4): identical hardcoded fake methods and an unsent PIN; its balance is real (`earnings.pendingClearance`). Apply the same rewrite, sourcing balance from the dispatcher earnings hook.

**Files:**
- Modify: `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx`

**Interfaces:**
- Consumes: the dispatcher earnings hook (the query behind `dispatcherApi.getEarnings()` → `{ availableBalance, pendingClearance }`; if no hook exists yet, add `useDispatcherEarnings()` in `apps/mobile/src/lib/hooks/use-dispatcher.ts` mirroring `useVendorEarnings`), plus `useBankAccounts`, `useMomoAccounts`, `usePinStatus`, `useWithdraw`.
- Produces: nothing downstream.

- [x] **Step 1: Apply the Task-14 rewrite pattern**

Make the identical changes as Task 14 Steps 1–2 in the dispatcher file: remove the hardcoded methods, source `availableBalance` from `Number(earnings?.availableBalance ?? 0)`, build `methods` from linked bank+momo accounts, gate on `methods.length` and `pinStatus.hasPin`, and send `{ amount, accountId, accountType, pin }` through `useWithdraw()`. The set-PIN CTA routes to `/(vendor)/(settings)/change-pin` only if a dispatcher can reach it; if not, route to the wallet PIN setup at `/(customer)/wallet` (the PIN is a wallet-level credential shared across roles). Confirm the dispatcher's actual settings route and use it.

- [x] **Step 2: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: same checks as Task 14 against a seeded dispatcher.

- [x] **Step 3: Commit**

```powershell
git add "apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx" apps/mobile/src/lib/hooks/use-dispatcher.ts
git commit -m "fix(dispatcher): real withdraw — live balance, linked payout accounts, PIN-authorized via /wallet/withdraw"
```

### Task 16: Remove the insecure vendor/dispatcher withdraw endpoints

With the mobile clients repointed at `/wallet/withdraw`, the bespoke `POST /vendor/earnings/withdraw` and `POST /dispatcher/earnings/withdraw` endpoints are unused AND unsafe (no PIN, free-text `destination`, and the vendor variant even checks `pendingPayout` while decrementing `wallet.balance` — an inconsistency). Delete them so they can't be called by a crafted request.

**Files:**
- Modify: `apps/server/src/modules/vendor/vendor.controller.ts` (remove the withdraw route), `apps/server/src/modules/vendor/vendor.service.ts` (remove `withdrawEarnings`, ~line 490), `apps/server/src/modules/vendor/dto/*` (remove the vendor `WithdrawEarningsDto` if vendor-specific)
- Modify: `apps/server/src/modules/dispatcher/dispatcher.controller.ts` (remove withdraw route, lines 118–123), `apps/server/src/modules/dispatcher/dispatcher.service.ts` (remove `withdrawEarnings`, lines 216–250), `apps/server/src/modules/dispatcher/dto/dispatcher.dto.ts` (remove `WithdrawEarningsDto`, lines 55–63)
- Modify: `apps/mobile/src/lib/api/vendor.ts` (remove `withdraw`), `apps/mobile/src/lib/api/dispatcher.ts` (remove `withdrawEarnings`), and the now-dead `useWithdrawEarnings` in `apps/mobile/src/lib/hooks/use-vendor.ts` (lines 94–104)
- Modify/remove: any spec asserting the removed endpoints (`dispatcher.controller.spec.ts`, `dispatcher.service.spec.ts`, vendor equivalents)

**Interfaces:**
- Consumes: nothing.
- Produces: removes public routes `POST /vendor/earnings/withdraw`, `POST /dispatcher/earnings/withdraw`.

- [x] **Step 1: Delete server routes, service methods, DTOs**

Remove the `withdrawEarnings` controller handlers and service methods and the `WithdrawEarningsDto` imports/usages in both modules. Leave the `getEarnings` / `getTransactions` / `getAnalytics` handlers untouched.

- [x] **Step 2: Delete the mobile clients and dead hook**

Remove `withdraw` from `vendorApi`, `withdrawEarnings` from `dispatcherApi`, and the `useWithdrawEarnings` export. Grep to confirm no remaining references:

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0 (the compiler flags any leftover reference — the withdraw screens no longer use these after Tasks 14–15).

- [x] **Step 3: Update/trim server specs and run the suite**

Delete the test cases that exercised the removed endpoints, then:

```powershell
cd apps/server; npx jest dispatcher vendor wallet --verbose
```
Expected: PASS (no references to the removed methods remain).

- [x] **Step 4: Commit**

```powershell
git add apps/server apps/mobile
git commit -m "refactor(payments)!: remove insecure vendor/dispatcher withdraw endpoints; all payouts go through hardened /wallet/withdraw"
```

### Task 17: Real BexieCoins loyalty — honest balance, real convert, real earn state

`apps/mobile/app/(customer)/wallet/rewards.tsx` reads `walletData?.bexieCoins ?? 0` (no such column exists → always 0), shows a hardcoded "Gold Tier Member", a static `EARNING_METHODS` list with fabricated `completed: true` flags, and a "Convert Coins" button that only fires `Alert.alert("Success", ...)` with no API call. Make it real: a `bexieCoins` balance, coins granted on genuine events, an atomic convert-to-cash endpoint, and earn-state computed from real data.

**Files:**
- Modify: `apps/server/prisma/schema.prisma` (`Wallet.bexieCoins`)
- Create: `apps/server/src/modules/loyalty/loyalty.service.ts`, `loyalty.controller.ts`, `loyalty.module.ts`, `loyalty.service.spec.ts`
- Modify: `apps/server/src/app.module.ts` (register `LoyaltyModule`)
- Modify: the order-delivered path (located via grep in Step 4) to grant coins
- Modify: `apps/mobile/src/lib/api/wallet.ts`, `apps/mobile/src/lib/hooks/use-wallet.ts`, `apps/mobile/app/(customer)/wallet/rewards.tsx`

**Interfaces:**
- Consumes: `getWallet(userId)` (existing).
- Produces:
  - Server: `GET /wallet/coins` → `{ balance: number; ratePerCoin: number; earn: { completeProfile: boolean; firstTopup: boolean; orders: number; referrals: number } }`; `POST /wallet/coins/convert` `{ coins: number }` → `{ coinsBalance, walletBalance }` (atomic).
  - `LoyaltyService.grantCoins(tx, walletId, coins, reason)` — callable inside an existing `$transaction`.
  - Mobile: `walletApi.getCoins()`, `walletApi.convertCoins(coins)`, `useCoins()`, `useConvertCoins()`.

- [x] **Step 1: Schema — add the coins column**

In `apps/server/prisma/schema.prisma`, `model Wallet`, add:

```prisma
bexieCoins Int @default(0)
```
Migrate:

```powershell
cd apps/server; npx prisma migrate dev --name add_wallet_bexie_coins
```
Expected: migration applies; `WalletStatus`/other models untouched.

- [x] **Step 2: Write the failing service test**

Create `apps/server/src/modules/loyalty/loyalty.service.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { LoyaltyService } from "./loyalty.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("LoyaltyService.convert", () => {
  const walletRow = { id: "w1", userId: "u1", bexieCoins: 500, balance: 10 };
  const prisma = {
    wallet: {
      findUnique: jest.fn().mockResolvedValue(walletRow),
      update: jest.fn().mockResolvedValue({ ...walletRow, bexieCoins: 0, balance: 15 }),
    },
    $transaction: jest.fn(async (cb: any) => cb(prisma)),
    transaction: { create: jest.fn() },
  } as unknown as PrismaService;

  let service: LoyaltyService;
  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [LoyaltyService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = mod.get(LoyaltyService);
  });

  it("rejects converting more coins than the balance", async () => {
    await expect(service.convertCoinsToBalance("u1", 999)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("converts coins to cash at 100 coins = 1 GHS", async () => {
    const res = await service.convertCoinsToBalance("u1", 500);
    expect(res.walletBalance).toBe(15); // 10 + (500/100)
  });
});
```

- [x] **Step 3: Run it, watch it fail**

```powershell
cd apps/server; npx jest loyalty.service --verbose
```
Expected: FAIL ("Cannot find module './loyalty.service'").

- [x] **Step 4: Implement the service, controller, module, and the grant hook**

Create `apps/server/src/modules/loyalty/loyalty.service.ts`:

```ts
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { Prisma } from "@prisma/client";

const COINS_PER_GHS = 100;

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Grant coins inside an existing transaction (e.g. on order delivery). */
  async grantCoins(tx: Prisma.TransactionClient, walletId: string, coins: number, _reason: string) {
    if (coins <= 0) return;
    await tx.wallet.update({ where: { id: walletId }, data: { bexieCoins: { increment: coins } } });
  }

  async getSummary(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const [user, topups, orders, referred] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { onboardingCompleted: true } }),
      wallet
        ? this.prisma.transaction.count({ where: { walletId: wallet.id, type: "TOPUP", status: "COMPLETED" } })
        : Promise.resolve(0),
      this.prisma.order.count({ where: { userId, status: "DELIVERED" } }),
      this.prisma.referredUser.count({ where: { referral: { userId } } }),
    ]);
    return {
      balance: wallet?.bexieCoins ?? 0,
      ratePerCoin: 1 / COINS_PER_GHS,
      earn: {
        completeProfile: !!user?.onboardingCompleted,
        firstTopup: topups > 0,
        orders,
        referrals: referred,
      },
    };
  }

  async convertCoinsToBalance(userId: string, coins: number) {
    if (!Number.isInteger(coins) || coins <= 0) throw new BadRequestException("Invalid coin amount");
    if (coins % COINS_PER_GHS !== 0)
      throw new BadRequestException(`Convert in multiples of ${COINS_PER_GHS} coins`);

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException("Wallet not found");
      if (wallet.bexieCoins < coins) throw new BadRequestException("Not enough coins");

      const cash = coins / COINS_PER_GHS;
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { bexieCoins: { decrement: coins }, balance: { increment: cash } },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "TOPUP",
          status: "COMPLETED",
          amount: cash,
          netAmount: cash,
          reference: `coins_${wallet.id.substring(0, 8)}_${coins}_${wallet.bexieCoins}`,
          description: `Converted ${coins} BexieCoins`,
        },
      });
      return { coinsBalance: updated.bexieCoins, walletBalance: Number(updated.balance) };
    });
  }
}
```

Create `apps/server/src/modules/loyalty/loyalty.controller.ts`:

```ts
import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { LoyaltyService } from "./loyalty.service";
import { IsInt, Min } from "class-validator";

class ConvertCoinsDto {
  @IsInt() @Min(1) coins: number;
}

@ApiTags("Wallet")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("wallet/coins")
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get()
  @ApiOperation({ summary: "Get loyalty summary and balance" })
  getSummary(@Req() req: any) {
    return this.loyalty.getSummary(req.user.id);
  }

  @Post("convert")
  @ApiOperation({ summary: "Convert BexieCoins to wallet cash balance" })
  convert(@Req() req: any, @Body() dto: ConvertCoinsDto) {
    return this.loyalty.convertCoinsToBalance(req.user.id, dto.coins);
  }
}
```

Create `apps/server/src/modules/loyalty/loyalty.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { LoyaltyService } from "./loyalty.service";
import { LoyaltyController } from "./loyalty.controller";

@Module({ controllers: [LoyaltyController], providers: [LoyaltyService], exports: [LoyaltyService] })
export class LoyaltyModule {}
```
Register `LoyaltyModule` in `apps/server/src/app.module.ts` imports.

**Grant hook:** locate where an order transitions to `DELIVERED` and its payout transaction is written (grep to find it, do not guess):

```powershell
cd apps/server; rg "DELIVERED" src/modules/delivery src/modules/orders -l
```
In that `$transaction`, inject `LoyaltyService` into the owning service's constructor (add `LoyaltyModule` to that module's `imports`) and call `await this.loyalty.grantCoins(tx, customerWalletId, 50, "order_delivered")` (50 coins per order — matches the mock's "Make a Purchase" reward).

- [x] **Step 5: Run the test — green**

```powershell
cd apps/server; npx jest loyalty.service --verbose
```
Expected: PASS.

- [x] **Step 6: Mobile — api, hooks, and the real rewards screen**

In `apps/mobile/src/lib/api/wallet.ts`:

```ts
getCoins: () => apiClient.get("/wallet/coins"),
convertCoins: (coins: number) => apiClient.post("/wallet/coins/convert", { coins }),
```

In `apps/mobile/src/lib/hooks/use-wallet.ts`:

```ts
export function useCoins() {
  return useQuery({ queryKey: ["wallet", "coins"], queryFn: () => walletApi.getCoins().then((r) => r.data) });
}

export function useConvertCoins() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (coins: number) => walletApi.convertCoins(coins).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet", "coins"] });
      qc.invalidateQueries({ queryKey: WALLET_KEYS.wallet });
    },
  });
}
```

In `apps/mobile/app/(customer)/wallet/rewards.tsx`:
- Replace `useWallet()` coin read with `useCoins()` → `const { data: coins } = useCoins(); const bexieCoins = coins?.balance ?? 0;`.
- Make `handleConvert` call the real mutation (convert the whole balance rounded down to the nearest 100):

```tsx
const convert = useConvertCoins();
const handleConvert = () => {
  const convertible = Math.floor(bexieCoins / 100) * 100;
  if (convertible < 100) {
    showPopup({ type: "error", title: "Not enough coins", message: "You need at least 100 coins to convert." });
    return;
  }
  Alert.alert("Convert Coins", `Convert ${convertible} BexieCoins to GHS ${(convertible / 100).toFixed(2)}?`, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Convert",
      onPress: () =>
        convert.mutate(convertible, {
          onSuccess: () => showPopup({ type: "success", title: "Converted", message: "Coins added to your wallet balance." }),
          onError: (e: any) => showPopup({ type: "error", title: "Failed", message: e?.message ?? "Try again." }),
        }),
    },
  ]);
};
```
- Remove the hardcoded "Gold Tier Member" line. Drive `EARNING_METHODS[].completed` from `coins.earn` (`completeProfile`, `firstTopup`; "Make a Purchase"/"Refer a Friend" are repeatable — show the real count `coins.earn.orders`/`referrals` instead of a Done badge).

- [x] **Step 7: Typecheck both apps and manual-verify**

```powershell
cd apps/server; npx tsc --noEmit
cd ../mobile; npx tsc --noEmit
```
Expected: both exit 0. Manual: complete a test order end-to-end (delivered) → coin balance increases by 50; Convert moves coins→balance and both figures update; converting <100 is refused.

- [x] **Step 8: Commit**

```powershell
git add apps/server apps/mobile
git commit -m "feat(loyalty): real BexieCoins — earn on delivered orders, atomic convert-to-cash, honest earn state"
```

---

## Phase 4 — Account security & settings (`feat/account-security-settings`)

Branch: `git checkout main; git checkout -b feat/account-security-settings`

This phase turns the entire fake vendor settings cluster real. Two capabilities the server already supports (wallet PIN change, support tickets) just need wiring; two (change-password, device sessions) work because Task 5 added better-auth's `bearer()` plugin; two (notification preferences, 2FA) need small new server modules. **No screen keeps a mock success** — the prime directive.

### Task 18: Notification preferences — server model + endpoints

**Files:**
- Modify: `apps/server/prisma/schema.prisma` (new `NotificationPreference` model + `User` relation)
- Create: `apps/server/src/modules/notification-preferences/notification-preferences.service.ts`, `.controller.ts`, `.module.ts`, `.service.spec.ts`, `dto/update-preferences.dto.ts`
- Modify: `apps/server/src/app.module.ts`

**Interfaces:**
- Consumes: `req.user.id`.
- Produces: `GET /notification-preferences` → the row (auto-created with defaults on first read); `PUT /notification-preferences` `{ newOrder?, orderCancel?, payout?, chat?, promo?, email?, sms? }` (all optional booleans) → updated row.

- [x] **Step 1: Schema**

Add to `apps/server/prisma/schema.prisma`:

```prisma
model NotificationPreference {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  newOrder    Boolean  @default(true)
  orderCancel Boolean  @default(true)
  payout      Boolean  @default(true)
  chat        Boolean  @default(true)
  promo       Boolean  @default(false)
  email       Boolean  @default(true)
  sms         Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
Add `notificationPreference NotificationPreference?` to `model User`. Migrate:

```powershell
cd apps/server; npx prisma migrate dev --name add_notification_preferences
```

- [x] **Step 2: DTO**

Create `apps/server/src/modules/notification-preferences/dto/update-preferences.dto.ts`:

```ts
import { IsBoolean, IsOptional } from "class-validator";

export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() newOrder?: boolean;
  @IsOptional() @IsBoolean() orderCancel?: boolean;
  @IsOptional() @IsBoolean() payout?: boolean;
  @IsOptional() @IsBoolean() chat?: boolean;
  @IsOptional() @IsBoolean() promo?: boolean;
  @IsOptional() @IsBoolean() email?: boolean;
  @IsOptional() @IsBoolean() sms?: boolean;
}
```

- [x] **Step 3: Failing service test**

Create `apps/server/src/modules/notification-preferences/notification-preferences.service.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { NotificationPreferencesService } from "./notification-preferences.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("NotificationPreferencesService", () => {
  const prisma = {
    notificationPreference: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ userId: "u1", promo: false }),
      upsert: jest.fn().mockResolvedValue({ userId: "u1", promo: true }),
    },
  } as unknown as PrismaService;

  let service: NotificationPreferencesService;
  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [NotificationPreferencesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = mod.get(NotificationPreferencesService);
  });

  it("creates defaults on first get", async () => {
    const res = await service.get("u1");
    expect(prisma.notificationPreference.create).toHaveBeenCalled();
    expect(res.userId).toBe("u1");
  });

  it("upserts on update", async () => {
    const res = await service.update("u1", { promo: true });
    expect(res.promo).toBe(true);
  });
});
```

- [x] **Step 4: Run — fail**

```powershell
cd apps/server; npx jest notification-preferences.service --verbose
```
Expected: FAIL (module not found).

- [x] **Step 5: Implement service, controller, module**

Create `apps/server/src/modules/notification-preferences/notification-preferences.service.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const existing = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.notificationPreference.create({ data: { userId } });
  }

  async update(userId: string, dto: UpdatePreferencesDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }
}
```

Create `apps/server/src/modules/notification-preferences/notification-preferences.controller.ts`:

```ts
import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { NotificationPreferencesService } from "./notification-preferences.service";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

@ApiTags("Notification Preferences")
@ApiBearerAuth()
@Controller("notification-preferences")
@UseGuards(AuthGuard)
export class NotificationPreferencesController {
  constructor(private readonly service: NotificationPreferencesService) {}

  @Get()
  @ApiOperation({ summary: "Get my notification preferences" })
  get(@Req() req: any) {
    return this.service.get(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: "Update my notification preferences" })
  update(@Req() req: any, @Body() body: UpdatePreferencesDto) {
    return this.service.update(req.user.id, body);
  }
}
```

Create `apps/server/src/modules/notification-preferences/notification-preferences.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { NotificationPreferencesController } from "./notification-preferences.controller";
import { NotificationPreferencesService } from "./notification-preferences.service";

@Module({
  controllers: [NotificationPreferencesController],
  providers: [NotificationPreferencesService],
  exports: [NotificationPreferencesService],
})
export class NotificationPreferencesModule {}
```
Register `NotificationPreferencesModule` in `app.module.ts`.

- [x] **Step 6: Run — green**

```powershell
cd apps/server; npx jest notification-preferences.service --verbose
```
Expected: PASS.

- [x] **Step 7: Commit**

```powershell
git add apps/server
git commit -m "feat(notifications): notification-preferences model + GET/PUT endpoints"
```

### Task 19: Notification settings screen — persist to the real endpoint

`apps/mobile/app/(vendor)/(settings)/notification-settings.tsx` holds 7 toggles (`newOrder, orderCancel, payout, chat, promo, email, sms`) in `useState` only — they never persist. Wire them to Task 18.

**Files:**
- Create: `apps/mobile/src/lib/api/notification-preferences.ts`, `apps/mobile/src/lib/hooks/use-notification-preferences.ts`
- Modify: `apps/mobile/app/(vendor)/(settings)/notification-settings.tsx`

**Interfaces:**
- Consumes: `GET/PUT /notification-preferences` (Task 18).
- Produces: `useNotificationPreferences()`, `useUpdateNotificationPreferences()`.

- [ ] **Step 1: API + hooks**

Create `apps/mobile/src/lib/api/notification-preferences.ts`:

```ts
import { apiClient } from "./client";

export const notificationPreferencesApi = {
  get: () => apiClient.get("/notification-preferences"),
  update: (data: Record<string, boolean>) => apiClient.put("/notification-preferences", data),
};
```

Create `apps/mobile/src/lib/hooks/use-notification-preferences.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationPreferencesApi } from "../api/notification-preferences";

const KEY = ["notification-preferences"] as const;

export function useNotificationPreferences() {
  return useQuery({ queryKey: KEY, queryFn: () => notificationPreferencesApi.get().then((r) => r.data) });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, boolean>) =>
      notificationPreferencesApi.update(data).then((r) => r.data),
    // Optimistic: flip immediately, roll back on error.
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData(KEY);
      qc.setQueryData(KEY, (old: any) => ({ ...old, ...data }));
      return { prev };
    },
    onError: (_e, _data, ctx) => ctx?.prev && qc.setQueryData(KEY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
```

- [ ] **Step 2: Wire the screen**

In `notification-settings.tsx`, replace the local `useState` toggles with server data and persist each flip:

```tsx
const { data: prefs } = useNotificationPreferences();
const updatePrefs = useUpdateNotificationPreferences();
const toggles = {
  newOrder: prefs?.newOrder ?? true,
  orderCancel: prefs?.orderCancel ?? true,
  payout: prefs?.payout ?? true,
  chat: prefs?.chat ?? true,
  promo: prefs?.promo ?? false,
  email: prefs?.email ?? true,
  sms: prefs?.sms ?? false,
};
const toggle = (key: keyof typeof toggles) => updatePrefs.mutate({ [key]: !toggles[key] });
```
Every `<Switch onValueChange={() => toggle("...")}/>` now persists.

- [ ] **Step 3: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: flip a toggle, kill and reopen the app — the state persists (proves it round-tripped, not local).

- [ ] **Step 4: Commit**

```powershell
git add apps/mobile
git commit -m "fix(vendor): persist notification settings to /notification-preferences (was local-only)"
```

### Task 20: Change password — admin + vendor, via better-auth

Task 5's `bearer()` plugin makes `POST /auth/change-password` usable with the Bearer token. Wire both broken clients: admin `updatePassword` (`apps/admin/src/lib/api/auth.ts:18-23`, currently a "placeholder" that 401s) and vendor `change-password.tsx` (`// Mock successful save`).

**Files:**
- Modify: `apps/admin/src/lib/api/auth.ts`
- Modify: `apps/admin/src/app/(dashboard)/settings/security/page.tsx`
- Modify: `apps/mobile/app/(vendor)/(settings)/change-password.tsx`

**Interfaces:**
- Consumes: better-auth `POST /auth/change-password` `{ currentPassword, newPassword, revokeOtherSessions? }` (Bearer). Returns 200 on success, 400 on wrong current password.
- Produces: nothing downstream.

- [ ] **Step 1: Fix the admin client**

In `apps/admin/src/lib/api/auth.ts`, replace `updatePassword`:

```ts
export const updatePassword = async (payload: { currentPassword: string; newPassword: string }) => {
  const { data } = await apiClient.post("/auth/change-password", {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
    revokeOtherSessions: true,
  });
  return data;
};
```
(`apiClient` now targets `/api/proxy`, so this reaches `/auth/change-password` with the Bearer token attached server-side — Task 4.) In `settings/security/page.tsx`, ensure the submit handler surfaces the error (toast) on rejection instead of assuming success.

- [ ] **Step 2: Wire the vendor screen**

In `apps/mobile/app/(vendor)/(settings)/change-password.tsx`, replace the mock submit (`// Mock successful save; router.back()`) with a real call. Add an auth-api method if none exists — in `apps/mobile/src/lib/api/*`, add `changePassword`:

```ts
// e.g. in apps/mobile/src/lib/api/auth.ts
export const changePassword = (currentPassword: string, newPassword: string) =>
  apiClient.post("/auth/change-password", { currentPassword, newPassword, revokeOtherSessions: true });
```
and in the screen's submit handler:

```tsx
try {
  setLoading(true);
  await changePassword(currentPassword, newPassword);
  showPopup({ type: "success", title: "Password changed", message: "Use your new password next time you sign in." });
  router.back();
} catch (e: any) {
  showPopup({ type: "error", title: "Couldn't change password", message: e?.message ?? "Check your current password." });
} finally {
  setLoading(false);
}
```
Remove the dead "Forgot Current Password?" `onPress={() => {}}` — either route it to the existing forgot-password flow (`/auth/forgot-password`) or delete the link. Do not leave a no-op.

- [ ] **Step 3: Typecheck both and manual-verify**

```powershell
cd apps/admin; npx tsc --noEmit
cd ../mobile; npx tsc --noEmit
```
Expected: both exit 0. Manual: change password with the correct current password → success and you can log in with the new one; a wrong current password shows an error (no false success).

- [ ] **Step 4: Commit**

```powershell
git add apps/admin apps/mobile
git commit -m "fix(auth): wire real change-password for admin and vendor (better-auth /change-password)"
```

### Task 21: Change PIN — vendor, via `/wallet/pin/change`

`apps/mobile/app/(vendor)/(settings)/change-pin.tsx` collects current/new/confirm PINs then `// Mock successful save; router.back()`. The server has `POST /wallet/pin/change` and the mobile has `useChangePin`/`useSetPin`/`usePinStatus` already. Wire it, handling the "no PIN set yet" case (use `setPin` instead of `changePin`).

**Files:**
- Modify: `apps/mobile/app/(vendor)/(settings)/change-pin.tsx`

**Interfaces:**
- Consumes: `usePinStatus()` (`{ hasPin }`), `useChangePin()`, `useSetPin()`.
- Produces: nothing downstream.

- [ ] **Step 1: Wire the submit**

In `change-pin.tsx`, add hooks and a real handler:

```tsx
import { usePinStatus, useChangePin, useSetPin } from "@/lib/hooks/use-wallet";
import { usePopupStore } from "@/lib/stores/popup-store";
// ...
const { data: pinStatus } = usePinStatus();
const changePin = useChangePin();
const setPin = useSetPin();
const showPopup = usePopupStore((s) => s.showPopup);

const onSubmit = async () => {
  try {
    if (pinStatus?.hasPin) {
      await changePin.mutateAsync({ currentPin, newPin });
    } else {
      await setPin.mutateAsync(newPin);
    }
    showPopup({ type: "success", title: "PIN updated", message: "Your withdrawal PIN has been changed." });
    router.back();
  } catch (e: any) {
    showPopup({ type: "error", title: "Couldn't update PIN", message: e?.message ?? "Check your current PIN." });
  }
};
```
Change the "Update PIN" button's `onPress={() => { /* Mock */ router.back(); }}` to `onPress={onSubmit}`. When `pinStatus?.hasPin === false`, hide the "Current PIN" input and the label reads "Set PIN". Remove or wire the dead "Forgot PIN?" link — since there is no forgot-PIN backend, replace it with copy directing the user to contact support (route to the contact screen from Task 25), not a no-op.

- [ ] **Step 2: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: set a PIN (fresh wallet), then change it; a wrong current PIN is rejected with the server's "Invalid PIN. N attempt(s) remaining"; the new PIN authorizes a withdrawal (Task 14).

- [ ] **Step 3: Commit**

```powershell
git add "apps/mobile/app/(vendor)/(settings)/change-pin.tsx"
git commit -m "fix(vendor): wire change-PIN to /wallet/pin/change (set-or-change), no more mock save"
```

### Task 22: Device sessions — real list + revoke

`apps/mobile/app/(vendor)/(settings)/security.tsx` shows hardcoded devices ("MacBook Pro · Accra, Ghana · 2 days ago") and "Log out of this device" is `// Mock logging out`. better-auth exposes real session management once `bearer()` is on (Task 5): `GET /auth/list-sessions`, `POST /auth/revoke-session` `{ token }`, `POST /auth/revoke-other-sessions`. The `Session` model already stores `userAgent`, `ipAddress`, `createdAt`.

**Files:**
- Create: `apps/mobile/src/lib/api/sessions.ts`, `apps/mobile/src/lib/hooks/use-sessions.ts`
- Modify: `apps/mobile/app/(vendor)/(settings)/security.tsx`

**Interfaces:**
- Consumes: better-auth session routes (Bearer).
- Produces: `useSessions()`, `useRevokeSession()`, `useRevokeOtherSessions()`.

- [ ] **Step 1: API + hooks**

Create `apps/mobile/src/lib/api/sessions.ts`:

```ts
import { apiClient } from "./client";

export const sessionsApi = {
  list: () => apiClient.get("/auth/list-sessions"),
  revoke: (token: string) => apiClient.post("/auth/revoke-session", { token }),
  revokeOthers: () => apiClient.post("/auth/revoke-other-sessions", {}),
};
```

Create `apps/mobile/src/lib/hooks/use-sessions.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "../api/sessions";

const KEY = ["auth", "sessions"] as const;

export function useSessions() {
  return useQuery({ queryKey: KEY, queryFn: () => sessionsApi.list().then((r) => r.data) });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => sessionsApi.revoke(token).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sessionsApi.revokeOthers().then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
```
Note: `list-sessions` returns raw fields; confirm the exact response shape via the Task 5 Step 3 probe and map `userAgent` → a friendly device label client-side (a tiny parser: contains "iPhone"/"Android"/"Mac"/"Windows").

- [ ] **Step 2: Wire `security.tsx`**

Replace the hardcoded device array with `useSessions()` data; render each session's parsed device label + `ipAddress` + relative `createdAt`. Mark the current session (match its token against the stored `bexiemart_token`). "Log out of this device" calls `useRevokeSession().mutate(session.token)`; add a "Log out all other devices" action calling `useRevokeOtherSessions()`. On revoking the current session, run the store `logout()`.

- [ ] **Step 3: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: sign in on two devices/emulators → both appear; revoking one invalidates that token (its next API call 401s and logs it out).

- [ ] **Step 4: Commit**

```powershell
git add apps/mobile
git commit -m "fix(vendor): real device sessions list + revoke via better-auth (was hardcoded)"
```

### Task 23: Two-factor auth — server (better-auth twoFactor plugin)

`apps/mobile/app/(vendor)/(settings)/two-factor.tsx` is entirely theater (`useState(true)`, fake SMS `+233 ** *** *492`, fake recovery codes). Stand up real TOTP 2FA using better-auth's `twoFactor` plugin, and surface a login challenge so 2FA actually gates sign-in.

**Files:**
- Modify: `apps/server/src/auth/better-auth.ts` (add `twoFactor()` plugin)
- Modify: `apps/server/prisma/schema.prisma` (add the plugin's `TwoFactor` model + `User.twoFactorEnabled`)
- Modify: `apps/server/src/auth/auth.controller.ts` (`login` surfaces a 2FA challenge)
- Create: `apps/server/src/auth/__tests__/two-factor.e2e-spec.ts` (or extend existing auth spec)

**Interfaces:**
- Consumes: existing `createAuth`.
- Produces: better-auth routes `/auth/two-factor/enable`, `/auth/two-factor/verify-totp`, `/auth/two-factor/disable`, `/auth/two-factor/generate-backup-codes` (Bearer); `login` returns `{ requiresTwoFactor: true }` (no session token) when the user has 2FA on.

- [ ] **Step 1: Add the plugin + schema**

In `better-auth.ts`, import and register:

```ts
import { phoneNumber, bearer, twoFactor } from "better-auth/plugins";
// in plugins array:
twoFactor({ issuer: "BexieMart" }),
```
Run better-auth's schema generation to get the exact model, then add it to `schema.prisma`. The `twoFactor` plugin needs (verify against your better-auth version's `generate` output — do not hand-invent columns):

```prisma
model TwoFactor {
  id          String @id @default(cuid())
  userId      String
  user        User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  secret      String
  backupCodes String
  @@unique([userId])
}
```
and `twoFactorEnabled Boolean @default(false)` on `model User`, plus `twoFactor TwoFactor?` relation. Generate the migration:

```powershell
cd apps/server; npx @better-auth/cli generate   # confirms exact columns for your version
npx prisma migrate dev --name add_two_factor
```

- [ ] **Step 2: Surface the login challenge**

In `auth.controller.ts` `login()`, after the better-auth `signInEmail` call, detect the 2FA-required response. better-auth returns a `twoFactorRedirect`/challenge signal rather than a session when 2FA is on — inspect `data` for it (the Step 1 CLI/docs confirm the exact field) and short-circuit:

```ts
if (data.twoFactorRedirect || data.twoFactor) {
  return { requiresTwoFactor: true };
}
```
The client then calls `/auth/two-factor/verify-totp` with the code to complete sign-in and obtain the session.

- [ ] **Step 3: Verify with a probe / e2e test**

```powershell
cd apps/server; npm run start:dev
```
Probe: log in as a user, enable 2FA (`/auth/two-factor/enable` with password, returns `totpURI` + backup codes), verify a TOTP with an authenticator, then confirm a fresh `login` for that user returns `{ requiresTwoFactor: true }`. Encode this as an e2e test if the existing auth e2e harness supports TOTP (generate codes with `otplib` in the test).

- [ ] **Step 4: Run auth tests**

```powershell
cd apps/server; npx jest auth two-factor --verbose
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/server
git commit -m "feat(auth): real TOTP two-factor via better-auth plugin + login challenge"
```

### Task 24: Two-factor auth — mobile screen

Make `apps/mobile/app/(vendor)/(settings)/two-factor.tsx` real: reflect the true enabled state, run the enable flow (password → TOTP secret/QR → verify code), show real backup codes, and remove the fake SMS row.

**Files:**
- Create: `apps/mobile/src/lib/api/two-factor.ts`, `apps/mobile/src/lib/hooks/use-two-factor.ts`
- Modify: `apps/mobile/app/(vendor)/(settings)/two-factor.tsx`

**Interfaces:**
- Consumes: Task 23 routes; `authClient` already wraps better-auth — prefer `authClient.twoFactor.*` if the expo client exposes it, else hit the REST routes via `apiClient`.
- Produces: `useTwoFactorStatus()`, `useEnableTwoFactor()`, `useVerifyTotp()`, `useDisableTwoFactor()`.

- [ ] **Step 1: API + hooks**

Create `apps/mobile/src/lib/api/two-factor.ts` wrapping the routes (`enable` `{ password }` → `{ totpURI, backupCodes }`; `verify-totp` `{ code }`; `disable` `{ password }`). Create `use-two-factor.ts` with the four hooks (queries/mutations, invalidating a `["auth","2fa"]` key). Read enabled state from `authClient.getSession()` `user.twoFactorEnabled`.

- [ ] **Step 2: Rewrite the screen**

Replace `useState(true)` with the real enabled flag. The Authenticator-App switch:
- OFF→ON: prompt for the account password → call enable → show the `totpURI` as a QR (use an existing QR lib if present, else display the secret) → collect the 6-digit code → `verify-totp` → on success flip to enabled and display the returned backup codes once.
- ON→OFF: prompt for password → `disable`.
Delete the fake "SMS Recovery `+233 ** *** *492`" row entirely (no SMS 2FA backend). Keep a real "Recovery Codes" row showing the actual remaining count from the enable response (persist count locally or re-fetch); regenerating calls `generate-backup-codes`.

- [ ] **Step 3: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: enable 2FA, scan the QR into Google Authenticator, verify; sign out and back in → the app now requires the TOTP code (Task 23 challenge); disable turns it off.

- [ ] **Step 4: Commit**

```powershell
git add apps/mobile
git commit -m "feat(vendor): real TOTP 2FA screen (enable/verify/disable, real backup codes); remove fake SMS row"
```

### Task 25: Contact support — real ticket (mobile) + admin 2FA login challenge

Two loose ends that make the settings/auth surfaces honest. (a) `apps/mobile/app/(vendor)/(settings)/contact.tsx` fakes submission with `setTimeout` + success alert and has a dead category dropdown. Wire it to the existing `POST /support/tickets` (server categories: `ORDER_ISSUE, PAYMENT_REFUND, DELIVERY, PRODUCT, ACCOUNT, OTHER`). (b) The admin login page must handle the `{ requiresTwoFactor: true }` response from `/api/session` (Tasks 4 + 23) so an admin with 2FA can actually complete sign-in.

**Files:**
- Modify: `apps/mobile/app/(vendor)/(settings)/contact.tsx`
- Create: `apps/mobile/src/lib/api/support.ts`, `apps/mobile/src/lib/hooks/use-support.ts` (if not already present)
- Modify: the admin login page (`apps/admin/src/app/login/page.tsx` or wherever `useLogin` is consumed) + `apps/admin/src/app/api/session/route.ts` (already returns `requiresTwoFactor` from Task 4)

**Interfaces:**
- Consumes: `POST /support/tickets` `{ category, subject, content?, orderId? }`; admin `/api/session` returning `{ requiresTwoFactor }`.
- Produces: `useCreateSupportTicket()`.

- [ ] **Step 1: Support api + hook**

Create `apps/mobile/src/lib/api/support.ts`:

```ts
import { apiClient } from "./client";

export const SUPPORT_CATEGORIES = [
  { value: "ORDER_ISSUE", label: "Order Issue" },
  { value: "PAYMENT_REFUND", label: "Payouts & Earnings" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "PRODUCT", label: "Product" },
  { value: "ACCOUNT", label: "Account" },
  { value: "OTHER", label: "Other" },
] as const;

export const supportApi = {
  createTicket: (data: { category: string; subject: string; content?: string; orderId?: string }) =>
    apiClient.post("/support/tickets", data),
};
```

Create `apps/mobile/src/lib/hooks/use-support.ts`:

```ts
import { useMutation } from "@tanstack/react-query";
import { supportApi } from "../api/support";

export function useCreateSupportTicket() {
  return useMutation({
    mutationFn: (data: { category: string; subject: string; content?: string; orderId?: string }) =>
      supportApi.createTicket(data).then((r) => r.data),
  });
}
```

- [ ] **Step 2: Wire `contact.tsx`**

Replace the `setTimeout` mock with a real submit. Make the category Pressable open a picker bound to `SUPPORT_CATEGORIES` (state-backed), require a `subject` (a short title field — add one; the server requires `subject` min length 3), send `content` from the description, and pass `orderId` when the optional field is filled:

```tsx
const createTicket = useCreateSupportTicket();
const [category, setCategory] = useState("PAYMENT_REFUND");
const [subject, setSubject] = useState("");
const [description, setDescription] = useState("");
const [orderId, setOrderId] = useState("");

const handleSubmit = async () => {
  if (subject.trim().length < 3) {
    Alert.alert("Add a subject", "Please enter a short subject (3+ characters).");
    return;
  }
  try {
    setLoading(true);
    await createTicket.mutateAsync({ category, subject: subject.trim(), content: description.trim() || undefined, orderId: orderId.trim() || undefined });
    Alert.alert("Ticket Submitted", "Our seller support team will respond via your registered email.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  } catch (e: any) {
    Alert.alert("Couldn't submit", e?.message ?? "Please try again.");
  } finally {
    setLoading(false);
  }
};
```
The "Attach Screenshot" affordance: either wire it to a real Cloudinary image upload feeding `mediaUrl` (the ticket DTO accepts `mediaUrl`), or remove it. Do not leave it decorative.

- [ ] **Step 3: Admin 2FA login handling**

In the admin login page, when `useLogin`'s result is `{ requiresTwoFactor: true }`, render a TOTP code field and complete sign-in against the better-auth verify route through the proxy (`POST /api/proxy/auth/two-factor/verify-totp`), then re-issue the session cookie. If admin 2FA is out of scope for launch, at minimum the page must show a clear "2FA required — complete on a device that supports it" state rather than silently failing. Pick one and implement it fully.

- [ ] **Step 4: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
cd ../admin; npx tsc --noEmit
```
Expected: both exit 0. Manual: submit a vendor support ticket → it appears in the admin support queue / customer's ticket list (real row); the category picker changes the submitted category.

- [ ] **Step 5: Commit**

```powershell
git add apps/mobile apps/admin
git commit -m "fix(support): real vendor support tickets; handle admin 2FA login challenge"
```

---

## Phase 5 — Reels video pipeline (`feat/reels-video-pipeline`)

Branch: `git checkout main; git checkout -b feat/reels-video-pipeline`

Today "reels" are a simulation: the customer feed renders an `<Image source={{ uri: item.videoUrl }}>` (`reels.tsx:104`, comment literally says "Background Video/Image Simulator"), vendor upload fakes 1.5s of progress then sets a **stock Unsplash image** as the "video" (`add-reel.tsx:43-53`), and comments are fake (`handlePostComment` shows a success popup and saves nothing; `reels.tsx:67-75`). This phase builds a real pipeline: signed Cloudinary **video** upload, `expo-video` playback, and a real comments model. Likes/views/share are already real — leave them.

### Task 26: Video upload backend — Cloudinary signed video uploads

`apps/server/src/modules/upload/upload.service.ts` only signs image uploads (`allowed_formats: "jpg,png,webp,jpeg"`, 5 MB, default image `resource_type`). Add a video path.

**Files:**
- Modify: `apps/server/src/modules/upload/upload.service.ts`
- Modify: `apps/server/src/modules/upload/upload.controller.ts`
- Modify/extend: `apps/server/src/modules/upload/upload.service.spec.ts`

**Interfaces:**
- Consumes: `ConfigService` Cloudinary creds (already wired).
- Produces: `GET /upload/signature/video?folder=reels` → `{ timestamp, signature, api_key, cloud_name, folder, resource_type: "video", eager }` for a direct client upload to Cloudinary's video endpoint.

- [ ] **Step 1: Add a video-signature method**

In `upload.service.ts`, add:

```ts
getVideoSignature(folder = "reels") {
  const timestamp = Math.round(Date.now() / 1000);
  // Request an eager async transform so Cloudinary generates a streamable
  // mp4 + poster; sign the exact params the client will send.
  const paramsToSign: Record<string, any> = {
    timestamp,
    folder,
    resource_type: "video",
    eager: "sp_auto/mp4",
    eager_async: true,
  };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    this.configService.get<string>("CLOUDINARY_API_SECRET")!
  );
  return {
    timestamp,
    signature,
    api_key: this.configService.get<string>("CLOUDINARY_API_KEY"),
    cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME"),
    folder,
    resource_type: "video",
    eager: "sp_auto/mp4",
    eager_async: true,
  };
}
```

- [ ] **Step 2: Expose the route**

In `upload.controller.ts`, add:

```ts
@Get("signature/video")
@ApiOperation({ summary: "Get a Cloudinary signature for direct video upload" })
@ApiQuery({ name: "folder", required: false, type: String })
getVideoSignature(@Query("folder") folder?: string) {
  return this.uploadService.getVideoSignature(folder);
}
```

- [ ] **Step 3: Test the signature is well-formed**

Add to `upload.service.spec.ts` a test asserting `getVideoSignature()` returns `resource_type: "video"` and a non-empty `signature`/`timestamp` (mock `ConfigService` as the existing spec does).

```powershell
cd apps/server; npx jest upload.service --verbose
```
Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add apps/server/src/modules/upload
git commit -m "feat(upload): signed Cloudinary video-upload signature endpoint"
```

### Task 27: Reel comments backend

**Files:**
- Modify: `apps/server/prisma/schema.prisma` (new `ReelComment` model + `Reel.comments`, `Reel.commentsCount`)
- Create: `apps/server/src/modules/customer-reels/dto/create-comment.dto.ts`
- Modify: `apps/server/src/modules/customer-reels/customer-reels.controller.ts` + `customer-reels.service.ts` + spec

**Interfaces:**
- Consumes: `req.user.id`.
- Produces: `POST /reels/:id/comments` `{ content }` (AuthGuard) → the created comment with `user`; `GET /reels/:id/comments?cursor=` (public) → `{ data, nextCursor }`.

- [ ] **Step 1: Schema**

Add to `apps/server/prisma/schema.prisma`:

```prisma
model ReelComment {
  id        String   @id @default(cuid())
  reelId    String
  reel      Reel     @relation(fields: [reelId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content   String
  createdAt DateTime @default(now())

  @@index([reelId, createdAt])
}
```
Add to `model Reel`: `comments ReelComment[]` and `commentsCount Int @default(0)`. Add `reelComments ReelComment[]` to `model User`. Migrate:

```powershell
cd apps/server; npx prisma migrate dev --name add_reel_comments
```

- [ ] **Step 2: DTO + failing service test**

Create `create-comment.dto.ts`:

```ts
import { IsString, MinLength, MaxLength } from "class-validator";

export class CreateCommentDto {
  @IsString() @MinLength(1) @MaxLength(500) content: string;
}
```
Add a `customer-reels.service.spec.ts` case: `addComment` creates a comment and increments `commentsCount` inside a transaction; `listComments` returns comments newest-first.

```powershell
cd apps/server; npx jest customer-reels.service --verbose
```
Expected: FAIL (methods missing).

- [ ] **Step 3: Implement service methods + routes**

In `customer-reels.service.ts`:

```ts
async addComment(userId: string, reelId: string, content: string) {
  const reel = await this.prisma.reel.findUnique({ where: { id: reelId } });
  if (!reel) throw new NotFoundException("Reel not found");
  const [comment] = await this.prisma.$transaction([
    this.prisma.reelComment.create({
      data: { reelId, userId, content },
      include: { user: { select: { id: true, name: true, image: true } } },
    }),
    this.prisma.reel.update({ where: { id: reelId }, data: { commentsCount: { increment: 1 } } }),
  ]);
  return comment;
}

async listComments(reelId: string, cursor?: string) {
  const take = 20;
  const comments = await this.prisma.reelComment.findMany({
    where: { reelId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const nextCursor = comments.length > take ? comments.pop()!.id : null;
  return { data: comments, nextCursor };
}
```
In `customer-reels.controller.ts` add (mirror the existing guard pattern — comments post is `AuthGuard`, list is public):

```ts
@Get(":id/comments")
@ApiOperation({ summary: "List comments for a reel" })
listComments(@Param("id") id: string, @Query("cursor") cursor?: string) {
  return this.service.listComments(id, cursor);
}

@Post(":id/comments")
@UseGuards(AuthGuard)
@ApiOperation({ summary: "Add a comment to a reel" })
addComment(@Req() req: any, @Param("id") id: string, @Body() body: CreateCommentDto) {
  return this.service.addComment(req.user.id, id, body.content);
}
```

- [ ] **Step 4: Green**

```powershell
cd apps/server; npx jest customer-reels --verbose
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/server
git commit -m "feat(reels): real comments — ReelComment model, POST/GET endpoints, commentsCount"
```

### Task 28: Vendor add-reel — real video upload

Replace the Unsplash simulation in `apps/mobile/app/(vendor)/add-reel.tsx` (`handleUploadOption`, lines 43–53) with a real pick + signed Cloudinary video upload.

**Files:**
- Modify: `apps/mobile/app/(vendor)/add-reel.tsx`
- Create: `apps/mobile/src/lib/upload/upload-video.ts` (helper)
- Verify dependency: `expo-image-picker` (present in the mobile app; if not, `npx expo install expo-image-picker`)

**Interfaces:**
- Consumes: `GET /upload/signature/video` (Task 26); `useCreateReel()` (existing).
- Produces: `uploadVideoToCloudinary(localUri): Promise<{ videoUrl: string; thumbnailUrl: string }>`.

- [ ] **Step 1: Upload helper**

Create `apps/mobile/src/lib/upload/upload-video.ts`:

```ts
import { apiClient } from "../api/client";

export async function uploadVideoToCloudinary(localUri: string) {
  const { data: sig } = await apiClient.get("/upload/signature/video", { params: { folder: "reels" } });

  const form = new FormData();
  form.append("file", { uri: localUri, type: "video/mp4", name: "reel.mp4" } as any);
  form.append("api_key", String(sig.api_key));
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("eager", sig.eager);
  form.append("eager_async", String(sig.eager_async));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json?.error?.message ?? "Video upload failed");

  // Cloudinary auto-poster: swap the video extension for .jpg on the same public_id.
  const videoUrl: string = json.secure_url;
  const thumbnailUrl = videoUrl.replace(/\.(mp4|mov|webm)$/i, ".jpg");
  return { videoUrl, thumbnailUrl };
}
```

- [ ] **Step 2: Replace the fake upload**

In `add-reel.tsx`, replace `handleUploadOption` (lines 43–53) with a real gallery/camera pick + upload:

```tsx
import * as ImagePicker from "expo-image-picker";
import { uploadVideoToCloudinary } from "@/lib/upload/upload-video";
// ...
const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

const handleUploadOption = async (source: "camera" | "library") => {
  try {
    const picker =
      source === "camera"
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
    const result = await picker({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
      quality: 1,
    });
    if (result.canceled) return;
    setIsUploading(true);
    const { videoUrl: url, thumbnailUrl: thumb } = await uploadVideoToCloudinary(result.assets[0].uri);
    setVideoUrl(url);
    setThumbnailUrl(thumb);
    setUploadModalVisible(false);
  } catch (e: any) {
    showPopup({ type: "error", title: "Upload failed", message: e?.message ?? "Try a shorter clip." });
  } finally {
    setIsUploading(false);
  }
};
```
Wire the two source Pressables to `handleUploadOption("camera")` / `handleUploadOption("library")`. Include `thumbnailUrl` in the `createReel.mutate` payload. Delete the "simulate video" comment and the Unsplash URL.

- [ ] **Step 3: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: pick a real short video → it uploads (network shows the Cloudinary POST) and publishes with a real `videoUrl` (mp4) + poster; the reel appears in the DB with a real video URL, not an image.

- [ ] **Step 4: Commit**

```powershell
git add apps/mobile
git commit -m "feat(reels): real vendor video upload (expo-image-picker + signed Cloudinary), no more Unsplash sim"
```

### Task 29: Customer reels — real playback + real comments

Replace the `<Image>` simulator with `expo-video` playback and wire the comment modal to Task 27.

**Files:**
- Modify: `apps/mobile/app/(customer)/(tabs)/reels.tsx`
- Modify: `apps/mobile/src/lib/hooks/use-reels.ts` (add comment hooks) + its api module
- Verify dependency: `expo-video` (install via `npx expo install expo-video` if absent)

**Interfaces:**
- Consumes: `GET /reels/:id/comments`, `POST /reels/:id/comments` (Task 27).
- Produces: `useReelComments(reelId)`, `useAddReelComment()`.

- [ ] **Step 1: Comment hooks**

Add to the reels api module (`apps/mobile/src/lib/api/reels.ts` or equivalent used by `use-reels.ts`):

```ts
listComments: (reelId: string, cursor?: string) =>
  apiClient.get(`/reels/${reelId}/comments`, { params: { cursor } }),
addComment: (reelId: string, content: string) =>
  apiClient.post(`/reels/${reelId}/comments`, { content }),
```
Add to `use-reels.ts`:

```ts
export function useReelComments(reelId: string | null) {
  return useQuery({
    queryKey: ["reels", reelId, "comments"],
    queryFn: () => reelsApi.listComments(reelId!).then((r) => r.data),
    enabled: !!reelId,
  });
}

export function useAddReelComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reelId, content }: { reelId: string; content: string }) =>
      reelsApi.addComment(reelId, content).then((r) => r.data),
    onSuccess: (_d, { reelId }) => {
      qc.invalidateQueries({ queryKey: ["reels", reelId, "comments"] });
      qc.invalidateQueries({ queryKey: ["reels"] });
    },
  });
}
```

- [ ] **Step 2: Real playback**

In `reels.tsx`, replace the `<Image source={{ uri: item.videoUrl }}>` block (lines 103–108) with an `expo-video` player that plays only the active reel:

```tsx
import { useVideoPlayer, VideoView } from "expo-video";
// inside renderReel, before return:
const player = useVideoPlayer(item.videoUrl, (p) => {
  p.loop = true;
  p.muted = false;
});
// play/pause with visibility:
useEffect(() => {
  if (isActive) player.play();
  else player.pause();
}, [isActive, player]);
// replace the Image with:
<VideoView
  style={{ width: "100%", height: "100%" }}
  player={player}
  contentFit="cover"
  nativeControls={false}
/>
```
Show `item.thumbnailUrl` as a poster `<Image>` underneath while the video buffers. (Because `renderReel` is a function component invoked by FlashList, hooks inside it are valid only if it's rendered as a component — if the linter flags the hook, extract `renderReel`'s body into a `ReelItem` component and render `<ReelItem item={item} isActive={...} />`.)

- [ ] **Step 3: Real comments**

Replace `handlePostComment` (lines 67–75). In the comment modal, load real comments with `useReelComments(activeReelForComments?.id)` and render them; the send button calls:

```tsx
const addComment = useAddReelComment();
const handlePostComment = () => {
  const content = newComment.trim();
  if (!content || !activeReelForComments) return;
  addComment.mutate(
    { reelId: activeReelForComments.id, content },
    {
      onSuccess: () => setNewComment(""),
      onError: (e: any) => showPopup({ type: "error", title: "Couldn't post", message: e?.message ?? "Try again." }),
    }
  );
};
```
Replace the hardcoded "0 comments" / "No comments yet" with the real list + `item.commentsCount`.

- [ ] **Step 4: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: the feed plays real video (only the visible reel plays audio); posting a comment persists (reopen the modal / another device shows it); the comment count increments.

- [ ] **Step 5: Commit**

```powershell
git add apps/mobile
git commit -m "feat(reels): real expo-video playback + real comments (was image sim + fake comments)"
```

---

## Phase 6 — Deploy infrastructure (`chore/deploy-infra`)

Branch: `git checkout main; git checkout -b chore/deploy-infra`

The server deploys to Railway via auto-detect with no committed IaC (not reproducible), the admin has no CI job (`.github/workflows/ci.yml` covers only `server` + `mobile`), and a stale root `schema.prisma` drifts from the real one. Close all three.

### Task 30: Server Dockerfile + railway.json + health check

**Files:**
- Create: `apps/server/Dockerfile`
- Create: `apps/server/.dockerignore`
- Create: `railway.json` (repo root)
- Modify: `apps/server/src/app.controller.ts` (or create a `HealthController`) for `GET /health`

**Interfaces:**
- Consumes: `apps/server` build (`npm run build` → `dist/`, Prisma generate).
- Produces: a reproducible container image; `GET /api/v1/health` → `{ status: "ok" }` for Railway's health check.

- [ ] **Step 1: Health endpoint (failing test first)**

Add a test in `apps/server/src/app.controller.spec.ts` (or a new `health.controller.spec.ts`) asserting `GET /health` returns `{ status: "ok" }`. Run it — FAIL. Then add the handler:

```ts
// health.controller.ts
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Liveness probe" })
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
```
Register `HealthController` in `app.module.ts`. Confirm it is NOT behind `AuthGuard` (Railway probes anonymously). Re-run — PASS.

- [ ] **Step 2: Dockerfile**

Create `apps/server/Dockerfile` (multi-stage; the app uses Prisma with `@prisma/adapter-pg`, so `prisma generate` must run in the build):

```dockerfile
# ---- build ----
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
```
Confirm the built entry path (`dist/main.js`) against `apps/server/package.json`'s `start:prod`/`main`; adjust if the nest build nests under `dist/src/main.js`.

Create `apps/server/.dockerignore`:

```
node_modules
dist
.env
*.log
```

- [ ] **Step 3: railway.json**

Create `railway.json` at the repo root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/server/Dockerfile"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node dist/main.js",
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```
(`migrate deploy` on boot applies pending migrations against the production DB — the standard Railway/Prisma pattern. Confirm the build context: if Railway builds from repo root, the Dockerfile's relative `COPY` paths need the context set to `apps/server`; set `"build.watchPatterns"`/root directory in the Railway service to `apps/server`, or adjust `COPY` paths accordingly.)

- [ ] **Step 4: Verify the image builds locally**

```powershell
cd apps/server; docker build -t bexiemart-server:test .
```
Expected: image builds; `docker run --rm -e DATABASE_URL=... -p 3000:3000 bexiemart-server:test` boots and `GET http://localhost:3000/api/v1/health` returns `{ "status": "ok" }`.

- [ ] **Step 5: Commit**

```powershell
git add apps/server/Dockerfile apps/server/.dockerignore railway.json apps/server/src
git commit -m "chore(deploy): reproducible server Dockerfile + railway.json + /health probe"
```

### Task 31: Admin CI job + admin Sentry

**Files:**
- Modify: `.github/workflows/ci.yml` (add an `admin` job)
- Create: `apps/admin/sentry.client.config.ts`, `apps/admin/sentry.server.config.ts` (or `instrumentation.ts`) + wire `withSentryConfig`
- Modify: `apps/admin/next.config.*`, `apps/admin/package.json` (add `@sentry/nextjs`)

**Interfaces:**
- Consumes: existing CI patterns for `server`/`mobile`.
- Produces: an `admin` CI job (lint + typecheck + build); admin runtime error reporting to Sentry.

- [ ] **Step 1: Add the admin CI job**

In `.github/workflows/ci.yml`, add a job mirroring the `mobile` job's shape (the file already defines jobs with `working-directory: apps/<app>` and `cache-dependency-path`):

```yaml
  admin:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/admin
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: apps/admin/package-lock.json
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint --if-present
      - run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://bexiemart-production.up.railway.app/api/v1
```

- [ ] **Step 2: Wire admin Sentry**

```powershell
cd apps/admin; npm install @sentry/nextjs
```
Add the standard `@sentry/nextjs` client/server config files initializing with `dsn: process.env.NEXT_PUBLIC_SENTRY_DSN` and `tracesSampleRate: 0.1`, and wrap `next.config` with `withSentryConfig`. Add `NEXT_PUBLIC_SENTRY_DSN` to `apps/admin/.env.example`.

- [ ] **Step 3: Verify CI locally**

```powershell
cd apps/admin; npx tsc --noEmit; npm run build
```
Expected: both succeed (this is what CI will run). Push the branch and confirm the new `admin` job appears and passes in GitHub Actions.

- [ ] **Step 4: Commit**

```powershell
git add .github/workflows/ci.yml apps/admin
git commit -m "chore(ci): add admin lint/typecheck/build job; wire admin Sentry"
```

### Task 32: Delete stale root schema + add env examples

**Files:**
- Delete: root `schema.prisma` (the stale 691-line copy that drifts from `apps/server/prisma/schema.prisma`)
- Create/verify: `apps/server/.env.example`, `apps/admin/.env.example`, `apps/mobile/.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: a single source-of-truth schema; documented env for all three apps.

- [ ] **Step 1: Confirm the root schema is unreferenced, then delete**

```powershell
rg -n "schema.prisma" --glob "!apps/server/**" --glob "!**/node_modules/**"
```
Confirm nothing references the root copy (Prisma config points at `apps/server/prisma/schema.prisma`). Then:

```powershell
git rm schema.prisma
```

- [ ] **Step 2: Env examples**

Ensure each app has a committed `.env.example` enumerating every var it reads (no secrets — placeholder values). Server must include at least: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PAYSTACK_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_ORIGIN`, `EXTRA_TRUSTED_ORIGINS`, email/SMTP vars. Admin: `NEXT_PUBLIC_API_URL`, `API_URL`, `NEXT_PUBLIC_SENTRY_DSN`. Mobile: the `EXPO_PUBLIC_*` set from `eas.json`.

- [ ] **Step 3: Verify server still boots from the real schema**

```powershell
cd apps/server; npx prisma validate; npx tsc --noEmit
```
Expected: schema valid, typecheck clean.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "chore(repo): delete stale root schema.prisma; add .env.example for all three apps"
```

---

## Phase 7 — Honesty polish (`fix/honesty-polish`)

Branch: `git checkout main; git checkout -b fix/honesty-polish`

The last honesty gaps: hardcoded dispatcher metrics, simulated review photos, the fake tax-verification submit, and repo hygiene. Then the launch-day checklist that captures every manual gate this plan deliberately left out.

### Task 33: Dispatcher profile — real metrics or none

`apps/mobile/app/(dispatcher)/(tabs)/profile.tsx` hardcodes rating 4.9 / 98% acceptance / 142 trips and vehicle "Motorbike", and `autoAccept` is a local-only toggle. Replace with real data where the server provides it; remove any stat that has no backing.

**Files:**
- Modify: `apps/mobile/app/(dispatcher)/(tabs)/profile.tsx`
- Possibly modify: `apps/server/src/modules/dispatcher/dispatcher.service.ts` `getProfile`/`getAnalytics` to return the needed fields

**Interfaces:**
- Consumes: dispatcher profile (`vehicleType`, `plateNumber` are real columns) + `getAnalytics()` (`trips30Days` is real).
- Produces: nothing downstream.

- [ ] **Step 1: Drive real fields; drop the fakes**

Bind vehicle to the real `profile.vehicleType`/`plateNumber`. Bind trips to `getAnalytics().trips30Days` (real). For rating/acceptance: if the server computes them, surface them; if it does not (verify — no rating aggregate exists for dispatchers today), **remove those stat tiles** rather than show 4.9/98%. If `autoAccept` has no backend, either add a real `dispatcherProfile.autoAccept` column + a PATCH endpoint and wire it, or remove the toggle. No local-only illusion of a saved setting.

- [ ] **Step 2: Typecheck and manual-verify**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: profile shows the dispatcher's real vehicle + real trip count; no stat is fabricated.

- [ ] **Step 3: Commit**

```powershell
git add apps/mobile apps/server
git commit -m "fix(dispatcher): real profile metrics (vehicle, trips); remove unbacked rating/acceptance"
```

### Task 34: Review photos — real upload

`apps/mobile/app/(customer)/review-modal.tsx:39-42` "Add photo" toasts "Simulated photo upload from camera roll" (rating/comment submission is real). Wire a real image upload.

**Files:**
- Modify: `apps/mobile/app/(customer)/review-modal.tsx`
- Verify: the review submission path + `Review` model can carry an image URL (the `Review` model today has no image column — add `imageUrl String?` if photos ship, or remove the affordance)

**Interfaces:**
- Consumes: existing image upload (`POST /upload` or the signed image-signature flow already used elsewhere) → `{ url }`.
- Produces: nothing downstream.

- [ ] **Step 1: Decide and implement (real or removed)**

Preferred: add `imageUrl String?` to `model Review` (migration `add_review_image`), thread it through the review DTO + service, and make "Add photo" pick + upload a real image, attaching the returned URL to the submission. If review photos are out of scope, delete the "Add photo" control entirely — do not keep the "Simulated photo upload" toast.

- [ ] **Step 2: Typecheck and manual-verify**

```powershell
cd apps/server; npx tsc --noEmit
cd ../mobile; npx tsc --noEmit
```
Expected: both exit 0. Manual: attach a photo to a review → it uploads and the review persists with the image (or the control is gone).

- [ ] **Step 3: Commit**

```powershell
git add apps/mobile apps/server
git commit -m "fix(reviews): real review photo upload (or remove the simulated control)"
```

### Task 35: Vendor tax verification — real submit

`apps/mobile/app/(vendor)/(settings)/taxes.tsx:59-78`: document upload/delete are real, but the final "submit for verification" is a `setTimeout` + "Verification Pending" alert — the TIN is never sent. Add a real submission.

**Files:**
- Modify: `apps/server/prisma/schema.prisma` (`VendorProfile.taxId`, `taxStatus`)
- Create: DTO + endpoint on the vendor module (`POST /vendor/tax-info`)
- Modify: `apps/mobile/app/(vendor)/(settings)/taxes.tsx`

**Interfaces:**
- Consumes: `req.user.id` → vendor profile.
- Produces: `POST /vendor/tax-info` `{ taxId, documentUrl? }` → sets `taxStatus = "PENDING"`; `GET /vendor/tax-info` returns current status.

- [ ] **Step 1: Schema + endpoint**

Add to `model VendorProfile`: `taxId String?` and `taxStatus String @default("NONE")` (values `NONE | PENDING | VERIFIED | REJECTED`; admin verification flips it — reuse the existing admin vendor moderation surface if present, else leave admin verification as a follow-up but persist the submission honestly). Migrate `add_vendor_tax_info`. Add a controller handler + service method on the vendor module that upserts the tax fields and sets `taxStatus = "PENDING"`.

- [ ] **Step 2: Wire the screen**

Replace the `setTimeout` submit with a real call sending the entered TIN (+ the already-uploaded document URL). On success, reflect the real `taxStatus` returned by the server ("Verification Pending" only when the server actually recorded PENDING).

- [ ] **Step 3: Typecheck and manual-verify**

```powershell
cd apps/server; npx tsc --noEmit
cd ../mobile; npx tsc --noEmit
```
Expected: both exit 0. Manual: submit a TIN → it persists on the vendor profile and status is PENDING on reload.

- [ ] **Step 4: Commit**

```powershell
git add apps/server apps/mobile
git commit -m "fix(vendor): real tax-verification submission (persist TIN + status), no more setTimeout"
```

### Task 36: Repo hygiene — console sweep + type tightening (bounded)

**Files:**
- Modify: assorted (server `console.*`, mobile `console.*`) — bounded, mechanical.

**Interfaces:**
- Consumes: nothing.
- Produces: cleaner logs; no behavior change.

- [ ] **Step 1: Replace stray console.* in the server with the Nest logger**

```powershell
cd apps/server; rg -n "console\.(log|error|warn)" src
```
Replace each with the module's `Logger` (the codebase already uses `private readonly logger = new Logger(X.name)`), or delete debug noise. Do NOT touch intentional startup logs.

- [ ] **Step 2: Remove stray console.* in mobile screens**

```powershell
cd apps/mobile; rg -n "console\.(log)" app src
```
Delete debug `console.log`s (keep deliberate error reporting that routes to Sentry).

- [ ] **Step 3: Typecheck + full suites**

```powershell
cd apps/server; npx tsc --noEmit; npx jest --silent
cd ../mobile; npx tsc --noEmit; npx jest --silent
```
Expected: all green (this is a no-behavior-change cleanup).

- [ ] **Step 4: Commit**

```powershell
git add apps/server apps/mobile
git commit -m "chore: replace stray console.* with Nest logger / remove debug logs"
```

### Task 37: Launch-day checklist (the manual gates this plan intentionally deferred)

**Files:**
- Create: `docs/LAUNCH-CHECKLIST.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the human runbook for the actual go-live — the steps that require real secrets/accounts and must not be automated by an agent.

- [ ] **Step 1: Write the checklist**

Create `docs/LAUNCH-CHECKLIST.md` capturing every manual gate:

```markdown
# Bexiemart Launch-Day Checklist

## Payments (the money gate)
- [ ] Swap Paystack **test → live** public key in `apps/mobile/eas.json` (all profiles) and the live secret in the server env (`PAYSTACK_SECRET_KEY`). The loud test-mode banner (Task 3) disappears automatically once the key is not `pk_test_`.
- [ ] Register the **live** Paystack webhook URL → `https://<api-host>/api/v1/payments/webhook`; confirm HMAC secret matches `PAYSTACK_SECRET_KEY`.
- [ ] Run one real end-to-end payment + payout in production; confirm webhook + escrow.

## Mobile store submission
- [ ] Replace `submit.production.ios` placeholders `ascAppId` + `appleTeamId` (Task 2 `_TODO`) with real App Store Connect values.
- [ ] Provide `apps/mobile/google-api-key.json` (Play service account) — never commit it.
- [ ] Build production AAB (`eas build -p android --profile production`) and iOS; submit.

## Server / infra
- [ ] Set production env on Railway: `DATABASE_URL`, `BETTER_AUTH_*`, `GOOGLE_CLIENT_*`, `PAYSTACK_SECRET_KEY`, `CLOUDINARY_*`, `ADMIN_ORIGIN=https://<vercel-admin-domain>`, SMTP.
- [ ] Confirm `railway.json` health check passes post-deploy; `migrate deploy` ran.
- [ ] Seed the super-admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD` out-of-band, run `seed-admin`), the SYSTEM user, and banners.

## Admin
- [ ] Deploy admin (Vercel) with `API_URL` + `NEXT_PUBLIC_API_URL`; confirm login sets the httpOnly cookie and the `admin` CI job is green.
- [ ] Verify `ADMIN_ORIGIN` is in the server `trustedOrigins` (env) so CSRF-checked routes work from prod admin.

## Smoke tests (production)
- [ ] Customer: browse → add to cart → checkout (live) → track order.
- [ ] Vendor: create product → receive order → withdraw (PIN).
- [ ] Dispatcher: accept job → deliver → withdraw.
- [ ] Reels: upload a real video → plays → comment.
```

- [ ] **Step 2: Commit**

```powershell
git add docs/LAUNCH-CHECKLIST.md
git commit -m "docs: launch-day checklist (Paystack live swap, store submit IDs, prod env, smoke tests)"
```

---

## Self-review (spec coverage)

Cross-checked against `NONFUNCTIONAL-FEATURES-AUDIT.md` (audit items #1–#37) and the six readiness tiers:

| Audit / tier item | Task |
|---|---|
| #1–#4 vendor/dispatcher withdraw (fake balance, fake methods, unsent PIN) | 13–16 |
| #5 rewards "Convert Coins" fake | 17 |
| #6/#35/#37 Paystack test key / silent fallback | 2, 3, Task 37 |
| #7–#9 dispatcher redirect, vendor social, dead Apple/FB | 6, 7 (Phase 2, done) |
| #10 admin change-password 401 | 5, 20 |
| #11 admin token in localStorage | 4 |
| #12 trustedOrigins missing prod admin | 5 |
| #13/#14 vendor change-password / change-PIN mock | 20, 21 |
| #15 2FA theater | 23, 24, 25 |
| #16 device sessions hardcoded | 22 |
| #17/#33 notification toggles local-only | 18, 19 |
| #18 contact-support fake | 25 |
| #19 tax verification fake | 35 |
| #20–#22 reels image sim / fake comments / Unsplash upload | 26–29 |
| #23–#25/#32 hardcoded tel: / discarded profile fields | Phase 2 (done) |
| #27/#28 Top Customers dead search | 8 (done) |
| #29 dispatcher Help dead route | 9 (done) |
| #30 dispatcher profile hardcoded | 33 |
| #31 review "add photo" simulated | 34 |
| #34 admin change-password broken | 5, 20 |
| #36 Cloudinary env missing in prod | 2 |
| Tier 5: no server IaC / admin CI / stale schema | 30, 31, 32 |
| Tier 6: console.* / hygiene | 36 |

**Deferred by decision (documented, not gaps):** Redis socket.io adapter + distributed cache/throttler (single-replica ceiling — fast-follow per the scaling decision); full Apple/Facebook OAuth (needs external developer accounts); mobile e2e harness (no convention exists today — mobile tasks verify manually).

## Execution options

**Plan complete and saved to `docs/superpowers/plans/2026-07-12-production-readiness.md`.** Phases 0–2 (Tasks 1–12) are already done; Tasks 13–37 remain. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session with checkpoints for review.

Which approach?
