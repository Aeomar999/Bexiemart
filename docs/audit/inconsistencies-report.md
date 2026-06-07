# Codebase Consistency & Reusability Audit — Bexiemart

> **Date:** 2026-06-06  
> **Scope:** Full-stack (NestJS server + Expo React Native mobile)  
> **Roles:** CUSTOMER, VENDOR, DISPATCHER, ADMIN

---

## User Roles

| Role | Prisma Enum | Mobile Route Group | Screens |
|------|------------|-------------------|---------|
| **CUSTOMER** | `CUSTOMER` | `(customer)/` | ~30 screens |
| **VENDOR** | `VENDOR` | `(vendor)/` | ~25 screens (5 tab groups) |
| **DISPATCHER** | `DISPATCHER` | `(dispatcher)/` | ~6 screens |
| **ADMIN** | `ADMIN` | (server-only) | REST API only |

---

## Category 1: Logic Inconsistencies

### L1. AdminGuard uses lowercase string instead of `UserRole.ADMIN`

**Files:** `apps/server/src/guards/admin.guard.ts:7`

**Problem:** AdminGuard checks `request.user?.role !== "admin"` (lowercase string), while `VendorGuard` and `DispatcherGuard` correctly use `UserRole.VENDOR` / `UserRole.DISPATCHER` from `@prisma/client`. If the Prisma enum value is `"ADMIN"` (uppercase), the guard silently passes no one.

**Current:**
```ts
if (request.user?.role !== "admin") {
```

**Should be:**
```ts
import { UserRole } from "@prisma/client";
if (request.user?.role !== UserRole.ADMIN) {
```

**Affected roles:** ADMIN

---

### L2. DispatcherGuard missing `isActive` check

**Files:**
- `apps/server/src/guards/vendor.guard.ts:26` (has check)
- `apps/server/src/guards/dispatcher.guard.ts:26` (missing check)

**Problem:** `VendorGuard` verifies `profile.isActive` before granting access. `DispatcherGuard` only checks that a profile record exists. If a dispatcher is suspended (profile exists but is inactive), they retain access.

| Guard | Profile Exists | `isActive` Check |
|-------|---------------|------------------|
| `VendorGuard` | ✅ | ✅ |
| `DispatcherGuard` | ✅ | ❌ |

**Affected roles:** DISPATCHER

---

### L3. Registration DTO allows "dispatcher" but controller ignores it

**Files:**
- `apps/server/src/auth/dto/register.dto.ts:20` — allows `"dispatcher"`
- `apps/server/src/auth/auth.controller.ts` — only handles `"vendor"` branch

**Problem:** The DTO accepts `role: "dispatcher"` but the controller only has special handling for `"vendor"`. Registering as dispatcher silently creates a CUSTOMER account. The intended flow is customer → dispatcher upgrade via `POST /dispatcher/profile`.

**Affected roles:** DISPATCHER (registration only)

---

### L4. No unified role-check guard factory

**Files:**
- `apps/server/src/guards/admin.guard.ts`
- `apps/server/src/guards/vendor.guard.ts`
- `apps/server/src/guards/dispatcher.guard.ts`

**Problem:** Three guard classes share the same boilerplate: inject `PrismaService`, check `!user`, check `role`, optionally look up a profile. The only differences are:
1. The `UserRole` enum value
2. The profile model name (or none for admin)
3. Whether `isActive` is checked

This is 76 lines of duplicated logic that should be a factory function.

---

### L5. Role casing inconsistency on mobile

**Files:**
- `apps/mobile/src/lib/stores/auth-store.ts` — stores `user.role` as opaque `string`
- `apps/mobile/app/_layout.tsx:89-96` — checks `user?.role === "VENDOR"` (uppercase)
- `apps/mobile/app/(customer)/become-dispatcher.tsx` — sets `user.role = "dispatcher"` (lowercase)
- `packages/shared/src/index.ts` — types `role: "customer" | "vendor"` (missing dispatcher/admin)

**Problem:** The `become-dispatcher.tsx` sets the role to lowercase `"dispatcher"`, but `_layout.tsx` checks for uppercase `"DISPATCHER"`. This is a **runtime bug** — after becoming a dispatcher, the user may get routed to the customer layout instead.

**Affected roles:** DISPATCHER, all (shared type)

---

### L6. No shared form validation — 6 different error display patterns

**Files:** All form screens (~12+ files)

**Problem:** Despite `react-hook-form`, `@hookform/resolvers`, and `zod` being declared in `package.json`, the mobile app uses ad-hoc `useState` + imperative validation functions. Every form duplicates the same pattern:

```ts
const [errors, setErrors] = useState<FormErrors>({});
const validate = (): boolean => {
  const newErrors: FormErrors = {};
  if (condition) newErrors.field = "Error message";
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

Six different error display patterns are used across the app:
1. Inline field errors via `<Input error={...}>` (shared component)
2. `Toast.show()` (global popup, blocks UI)
3. `Announcement` banner (inline, `Announcement.tsx`)
4. `Alert.alert()` (native dialog)
5. Inline conditional `<Text>` (e.g. "Insufficient balance")
6. `<ErrorState>` (full-page, `ErrorState.tsx`)

**Affected roles:** ALL

---

### L7. popup-store persists visibility to AsyncStorage

**File:** `apps/mobile/src/lib/stores/popup-store.ts:17-37`

**Problem:** The popup/toast store wraps itself in `zustand/middleware/persist` with AsyncStorage. Popup visibility state (`isVisible`) is persisted across app restarts — a toast shown before the app was killed will reappear on next launch.

```ts
export const usePopupStore = create<PopupState>()(
  persist(
    // ... store with isVisible state
    {
      name: "popup-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**Affected roles:** ALL

---

### L8. No shared toast/notification system — three competing mechanisms

**Files:**
- `apps/mobile/src/components/ui/GlobalPopup.tsx`
- `apps/mobile/src/components/ui/Announcement.tsx`
- `apps/mobile/src/lib/toast-polyfill.ts` — adapter that delegates to `GlobalPopup`

**Problem:** Three different feedback mechanisms exist for the same purpose. `GlobalPopup` blocks the entire UI (acts like a modal, not a toast). `Announcement` is inline/non-blocking. `Alert.alert()` is a native dialog. Same feedback scenarios (success/error after mutation) use different channels depending on who wrote the screen.

**Affected roles:** ALL

---

## Category 2: UI/UX Inconsistencies

### U1. Avatar/profile image — 4 different fallback patterns

**Files:**
- `apps/mobile/app/(customer)/(tabs)/profile.tsx:146-147`
- `apps/mobile/src/components/screens/EditProfileScreen.tsx:53-56`
- `apps/mobile/app/(vendor)/(settings)/index.tsx:85`
- `apps/mobile/app/(vendor)/(settings)/profile.tsx:133-149`
- `apps/mobile/app/(dispatcher)/(tabs)/profile.tsx:40-42`
- `apps/mobile/app/*/chats/*.tsx` (6 files)
- `apps/mobile/app/(dispatcher)/(tabs)/tasks.tsx:105-109`

| Screen/Component | Fallback When No Image | Service |
|-----------------|----------------------|---------|
| Customer profile display | DiceBear micah avatar URL | `api.dicebear.com` |
| Customer edit profile | DiceBear micah avatar URL | `api.dicebear.com` |
| Vendor settings display | Letter initial (e.g. "V") | Inline `charAt(0)` |
| Vendor profile edit | Letter initial ("S") | Inline `charAt(0)` |
| Dispatcher profile display | Letter initial ("D") | Inline `charAt(0)` |
| Chat avatars (all roles) | Initials avatar URL | `ui-avatars.com` |
| Dispatcher ride cards | `Icon name="user"` | Inline Icon component |

**Problem:** No shared `Avatar` component — 4 different fallback strategies across the app. Vendor and Dispatcher use lightweight letter initials (no network request), while Customer loads a DiceBear URL (network request, slower). Chats use a third-party service entirely.

**Affected roles:** ALL

---

### U2. Profile image upload — Customer/Dispatcher vs Vendor

**Files:**
- `apps/mobile/src/components/screens/EditProfileScreen.tsx` (shared by customer + dispatcher)
- `apps/mobile/app/(vendor)/(settings)/profile.tsx` (vendor-specific)

| Aspect | Customer & Dispatcher | Vendor |
|--------|----------------------|--------|
| Image fields | 1 (avatar) | 2 (logo + banner) |
| Camera support | ❌ Library only | ✅ Camera + Library |
| Action sheet | ❌ Direct pick | ✅ Modal with 3 options |
| Upload fallback | DiceBear | Letter initial |
| Camera icon overlay | Always visible | Overlaid on logo circle |

**Problem:** Customer/Dispatcher use a simpler flow (library-only, direct pick). Vendor has a richer flow (camera + library, action sheet modal, remove option). The photo picking UX should be unified into a shared component with configurable options.

**Affected roles:** CUSTOMER, VENDOR, DISPATCHER

---

### U3. LoadingState vs LoadingSpinner — overlapping components

**Files:**
- `apps/mobile/src/components/ui/LoadingState.tsx`
- `apps/mobile/src/components/ui/LoadingSpinner.tsx`
- `apps/mobile/src/components/ui/Skeleton.tsx`

| Component | FullScreen | Message | Branded Container | Configurable |
|-----------|-----------|---------|------------------|-------------|
| `LoadingState` | ✅ default | ✅ "Loading..." | ✅ Circle + brand color | ❌ |
| `LoadingSpinner` | ✅ optional | ✅ optional | ❌ | ✅ size, color |

**Problem:** Two components serve the same purpose. No convention on which to use — different screens use different ones. Skeleton components (`ProductCardSkeleton`, `CartItemSkeleton`) are defined in `Skeleton.tsx` but **never imported or used** anywhere.

**Affected roles:** ALL

---

### U4. Card base component not used by domain cards

**Files:**
- `apps/mobile/src/components/ui/Card.tsx` (base component)
- `apps/mobile/src/components/ui/ProductCard.tsx`
- `apps/mobile/src/components/ui/OrderCard.tsx`
- `apps/mobile/src/components/ui/CategoryCard.tsx`

**Problem:** `ProductCard`, `OrderCard`, and `CategoryCard` each reimplement container styling (`bg-card rounded-[24px] border border-border shadow-[...]`) instead of wrapping the shared `<Card>` component. If card styling is ever updated, all three must be updated individually.

**Affected roles:** ALL

---

### U5. Input component not used consistently

**File:** `apps/mobile/src/components/ui/Input.tsx` (shared)

**Problem:** Several screens re-implement inline `TextInput` wrappers with identical styling instead of using the shared `<Input>` component:
- `EditProfileScreen.tsx` — uses raw `TextInput` with its own wrapper View
- `apps/mobile/app/(customer)/addresses.tsx` — inline TextInput per field
- `apps/mobile/app/(customer)/wallet/transfer.tsx` — inline TextInput
- Various vendor settings screens

The shared `<Input>` already supports `label`, `error`, `hint`, `leftIcon`, and `rightIcon` props.

**Affected roles:** ALL

---

### U6. Dispatcher profile edit button has no `onPress` handler

**File:** `apps/mobile/app/(dispatcher)/(tabs)/profile.tsx:49`

**Problem:** The pencil/edit icon in the dispatcher profile card is a `<Pressable>` with no `onPress` prop — it renders but does nothing when tapped. Customer and Vendor both have working edit navigation.

```tsx
<Pressable className="w-10 h-10 rounded-full bg-background items-center justify-center">
  <Icon name="edit-2" size={16} color="#64748b" />
</Pressable>
```

**Affected roles:** DISPATCHER

---

### U7. Profile screens have different logout button styles

**Files:**
- `apps/mobile/app/(customer)/(tabs)/profile.tsx:258-265`
- `apps/mobile/app/(dispatcher)/(tabs)/profile.tsx:150-158`
- `apps/mobile/app/(vendor)/(settings)/index.tsx` (uses `<Button variant="danger">`)

**Problem:** Customer uses a `<Pressable>` with `bg-rose-50 rounded-[16px]`. Dispatcher uses the same pattern. Vendor uses the shared `<Button variant="danger">` component. Inconsistent button usage across the three role profile screens.

**Affected roles:** ALL

---

## Summary

| ID | Category | Severity | Type | Effort |
|----|----------|----------|------|--------|
| L1 | Logic | **High** | bug | 1 file, 1 line |
| L2 | Logic | **Medium** | bug | 1 file, 2 lines |
| L3 | Logic | **Medium** | inconsistency | 1 file, 1 line |
| L4 | Logic | **Low** | duplication | 4 files, 1 new file |
| L5 | Logic | **High** | bug | 3 files |
| L6 | Logic | **Low** | quality | ~12 files, 2 new |
| L7 | Logic | **Low** | bug | 1 file |
| L8 | Logic | **Low** | quality | 3 files, 1 new |
| U1 | UI | **Medium** | inconsistency | ~12 files, 1 new |
| U2 | UI | **Low** | duplication | 2 files, 1 new |
| U3 | UI | **Low** | duplication | ~10 files, 1 delete |
| U4 | UI | **Low** | quality | 3 files |
| U5 | UI | **Low** | quality | 4+ files |
| U6 | UI | **Medium** | bug | 1 file |
| U7 | UI | **Low** | quality | 3 files |
