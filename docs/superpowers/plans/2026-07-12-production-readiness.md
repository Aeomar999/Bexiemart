# Bexiemart Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the Bexiemart monorepo (server / mobile / admin) to production readiness: every user-facing feature is real (no mocked success, no dead routes, no hardcoded data), the admin token is no longer XSS-readable, withdrawals go through the hardened wallet path with PIN enforcement, reels get a real video pipeline, and the server ships with reproducible deploy config.

**Architecture:** Seven sequential phases, each an independently shippable PR branched off `main`. The unifying design move: the customer wallet already has the hardened money path (`WalletService.withdraw`: PIN verify → config fee → Paystack recipient → atomic guarded decrement → PENDING transaction) — vendor and dispatcher withdrawals *delegate to it* instead of keeping their own half-fake paths. Fake settings screens get wired to endpoints that mostly already exist (`/wallet/pin/change`, `/support/tickets`, better-auth `/change-password` once the `bearer()` plugin is added); genuinely missing capabilities (2FA, notification preferences, loyalty coins, reel comments/video) get small new modules following the codebase's existing NestJS module conventions.

**Tech Stack:** NestJS 10 + Prisma (PostgreSQL) + better-auth (custom Nest controller wrapping `auth.api`, Bearer session tokens validated by `AuthGuard` against the `Session` table) · Expo / React Native (expo-router, NativeWind classNames, TanStack Query, zustand, `apiClient` axios with SecureStore token) · Next.js admin (App Router, TanStack Query, zustand) · Paystack (test mode by decision) · Cloudinary (signed uploads via `/upload/signature`).

## Global Constraints

- **Paystack stays in TEST mode.** Never swap `pk_test_…` for a live key in this plan. The live-key swap is a launch-day manual step (Task 36 checklist). Do add the loud guard (Task 3).
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
| 4 | `feat/account-security-settings` | 18–25 | 2FA, change-password/PIN, device sessions, notification prefs, contact, taxes |
| 5 | `feat/reels-video-pipeline` | 26–29 | Real video upload/playback, comments, following feed |
| 6 | `chore/deploy-infra` | 30–32 | Dockerfile, railway.json, health check, admin CI, Sentry |
| 7 | `fix/honesty-polish` | 33–36 | Dispatcher profile honesty, review photos, console sweep, launch-day checklist |

---

## Phase 0 — Baseline

### Task 1: Branch and verify green baseline

**Files:** none created — verification only.

**Interfaces:**
- Consumes: current `main`.
- Produces: a recorded green baseline all later phases diff against.

- [ ] **Step 1: Sync main and create the phase branch**

```powershell
git checkout main; git pull origin main
git checkout -b chore/prod-baseline
```

- [ ] **Step 2: Install and typecheck all three apps**

```powershell
cd apps/server; npm ci; npx tsc --noEmit
cd ../mobile; npm ci; npx tsc --noEmit
cd ../admin; npm ci; npx tsc --noEmit
```
Expected: all three exit 0.

- [ ] **Step 3: Run server and mobile test suites**

```powershell
cd apps/server; npx jest --silent
cd ../mobile; npx jest --silent
```
Expected: PASS (audit 2026-07-05 recorded both suites green; if anything fails here, STOP and fix before proceeding — later phases assume green).

- [ ] **Step 4: Record the baseline**

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

- [ ] **Step 1: Switch production Android to app-bundle and add the missing Cloudinary env**

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

- [ ] **Step 2: Flag the placeholder submit identifiers**

The `submit.production.ios` block contains placeholders (`"ascAppId": "1234567890"`, `"appleTeamId": "TEAMID1234"`). These are USER-SUPPLIED and cannot be invented. Add a sibling comment key so the placeholder can't silently ship (JSON has no comments; use an ignored key):

```json
"ios": {
  "appleId": "developer@bexiemart.com",
  "ascAppId": "1234567890",
  "appleTeamId": "TEAMID1234",
  "_TODO": "ascAppId and appleTeamId are PLACEHOLDERS — replace with real App Store Connect values before `eas submit` (see Task 36 launch checklist)"
}
```

- [ ] **Step 3: Validate the JSON parses**

```powershell
cd apps/mobile; node -e "JSON.parse(require('fs').readFileSync('eas.json','utf8')); console.log('eas.json OK')"
```
Expected: `eas.json OK`

- [ ] **Step 4: Commit**

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

- [ ] **Step 1: Write the banner component**

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

- [ ] **Step 2: Remove the silent fallback and fail loudly when the key is missing**

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

- [ ] **Step 3: Typecheck and verify on device/simulator**

```powershell
cd apps/mobile; npx tsc --noEmit
```
Expected: exit 0. Manual: launch the app (`npx expo start`) — amber "PAYMENTS IN TEST MODE" banner visible at top; removing the env var from `.env` and restarting must crash at startup with the explicit error.

- [ ] **Step 4: Commit**

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

- [ ] **Step 1: Session route handler**

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

- [ ] **Step 2: Socket-token route handler**

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

- [ ] **Step 3: Proxy route handler**

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

- [ ] **Step 4: Route-guard middleware**

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

- [ ] **Step 5: Point the axios client at the proxy and drop the token interceptor**

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

- [ ] **Step 6: Rework login API, store, and hooks**

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

- [ ] **Step 7: Sweep remaining `token` / `setAuth(user, token)` call sites**

```powershell
cd apps/admin; npx tsc --noEmit
```
The compiler now points at every stale call site (expected: `Sidebar.tsx`, `DashboardLayout.tsx`, `use-socket.ts`, `settings/profile/page.tsx`, the login page). Fix each mechanically:
- `setAuth(user, token)` → `setAuth(user)`.
- Reads of `useAuthStore(...).token` for "am I logged in" → use `isAuthenticated`.
- `use-socket.ts`: `await getSocket()` (it is now async).
- Any logout handler should also call `fetch("/api/session", { method: "DELETE" })`.
Re-run `npx tsc --noEmit` until exit 0.

- [ ] **Step 8: Verify end-to-end locally**

```powershell
cd apps/server; npm run start:dev
```
In a second terminal: `cd apps/admin; npm run dev`. Then verify in a browser:
1. Visiting `http://localhost:3001/` unauthenticated redirects to `/login`.
2. Login succeeds; DevTools → Application → Cookies shows `bx_admin_session` with `HttpOnly ✓`; localStorage `bexiemart-admin-auth` contains **no token field**.
3. Dashboard lists load (network tab shows calls to `/api/proxy/...`).
4. Logout clears the cookie and returns to `/login`.

- [ ] **Step 9: Commit**

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

- [ ] **Step 1: Add the bearer plugin and session updateAge**

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

- [ ] **Step 2: Make trustedOrigins env-extendable**

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

- [ ] **Step 3: Verify bearer accepts the raw session token**

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

- [ ] **Step 4: Run auth-adjacent server tests**

```powershell
cd apps/server; npx jest guards auth --verbose
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/server/src/auth/better-auth.ts apps/server/.env.example
git commit -m "feat(auth): bearer plugin for better-auth routes, env-driven trustedOrigins, sliding sessions"
```
