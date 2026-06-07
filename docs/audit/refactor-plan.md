# Refactor Plan — Bexiemart Consistency & Reusability

> Based on audit report in `docs/audit/inconsistencies-report.md`

---

## Phase 1: Quick Fixes (no new abstractions)

### 1.1 Fix AdminGuard — use `UserRole.ADMIN`

**File:** `apps/server/src/guards/admin.guard.ts`

Change the string literal `"admin"` to the Prisma enum `UserRole.ADMIN`.

**Before:**
```ts
if (request.user?.role !== "admin") {
```

**After:**
```ts
import { UserRole } from "@prisma/client";
if (request.user?.role !== UserRole.ADMIN) {
```

---

### 1.2 Add `isActive` check to DispatcherGuard

**File:** `apps/server/src/guards/dispatcher.guard.ts`

Add `profile.isActive` check matching `VendorGuard`'s pattern.

**Before:**
```ts
if (!profile) {
  throw new ForbiddenException('Dispatcher profile required');
}
```

**After:**
```ts
if (!profile || !profile.isActive) {
  throw new ForbiddenException('Active dispatcher profile required');
}
```

---

### 1.3 Remove "dispatcher" from register DTO

**File:** `apps/server/src/auth/dto/register.dto.ts`

Remove `"dispatcher"` from the `@IsIn` decorator since the controller doesn't handle it.

**Before:**
```ts
@IsIn(["customer", "vendor", "dispatcher"])
```

**After:**
```ts
@IsIn(["customer", "vendor"])
```

---

### 1.4 Remove `persist` middleware from popup-store

**File:** `apps/mobile/src/lib/stores/popup-store.ts`

Remove the `persist` wrapper so popup visibility doesn't survive app restarts.

**Before:**
```ts
export const usePopupStore = create<PopupState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: "popup-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**After:**
```ts
export const usePopupStore = create<PopupState>()(
  (set) => ({ /* ... */ })
);
```

Also remove unused imports: `persist`, `createJSONStorage`, `AsyncStorage`.

---

### 1.5 Wire Dispatcher profile edit button

**File:** `apps/mobile/app/(dispatcher)/(tabs)/profile.tsx`

Add `router.push("/(dispatcher)/edit-profile")` to the edit Pressable's `onPress`.

**Before:**
```tsx
<Pressable className="w-10 h-10 ...">
```

**After:**
```tsx
<Pressable
  className="w-10 h-10 ..."
  onPress={() => router.push("/(dispatcher)/edit-profile")}
>
```

---

### 1.6 Normalize role casing in auth-store

**File:** `apps/mobile/src/lib/stores/auth-store.ts`

In `setAuth()`, normalize `user.role` to uppercase before storing.

**Change:**
```ts
// In the setAuth function, after receiving user data:
set({ user: { ...user, role: user.role?.toUpperCase() }, ... });
```

---

### 1.7 Update shared types to include all 4 roles

**File:** `packages/shared/src/index.ts`

**Before:**
```ts
role: "customer" | "vendor"
```

**After:**
```ts
role: "CUSTOMER" | "VENDOR" | "DISPATCHER" | "ADMIN"
```

---

## Phase 2: Server Guard Factory

### 2.1 Create `createRoleGuard` factory

**New file:** `apps/server/src/guards/create-role-guard.ts`

Create a factory function that generates NestJS `CanActivate` guards from a role enum value and optional profile model configuration.

```ts
interface ProfileCheck {
  model: string;           // Prisma model name (e.g. "vendorProfile")
  findByField: string;     // field to find by (e.g. "userId")
  checkActive?: boolean;   // whether to check isActive
}

function createRoleGuard(role: UserRole, profileCheck?: ProfileCheck) {
  @Injectable()
  class RoleGuard implements CanActivate {
    constructor(private prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      if (!user) throw new UnauthorizedException("Authentication required");
      if (user.role !== role) throw new ForbiddenException("Access required");

      if (profileCheck) {
        const profile = await this.prisma[profileCheck.model].findUnique({
          where: { [profileCheck.findByField]: user.id },
        });
        if (!profile) throw new ForbiddenException("Profile required");
        if (profileCheck.checkActive && !profile.isActive) {
          throw new ForbiddenException("Active profile required");
        }
      }
      return true;
    }
  }
  return RoleGuard;
}
```

### 2.2-2.4 Refactor existing guards

| File | Change |
|------|--------|
| `admin.guard.ts` | Replace class with `createRoleGuard(UserRole.ADMIN)` |
| `vendor.guard.ts` | Replace class with `createRoleGuard(UserRole.VENDOR, { model: "vendorProfile", findByField: "userId", checkActive: true })` |
| `dispatcher.guard.ts` | Replace class with `createRoleGuard(UserRole.DISPATCHER, { model: "dispatcherProfile", findByField: "userId", checkActive: true })` |

Old guard files remain with their export names re-pointed to the factory output.

---

## Phase 3: Shared Avatar Component

### 3.1 Create `<Avatar>` component

**New file:** `apps/mobile/src/components/ui/Avatar.tsx`

```tsx
interface AvatarProps {
  uri?: string | null;
  name?: string;           // For initials fallback
  size?: number;           // Default 48
  fallback?: "initials" | "icon" | "dicebear";
  iconName?: string;       // Icon name for icon fallback
  onPress?: () => void;
  editable?: boolean;      // Shows edit overlay
}
```

Supports 3 fallback strategies:
- `initials`: Shows first letter of `name` on branded background (matches vendor/dispatcher)
- `dicebear`: Generates DiceBear micah URL (matches customer current behavior)
- `icon`: Shows an icon (matches dispatcher ride cards)

### 3.2-3.6 Update all avatar usages

| File | Current Pattern | Replace With |
|------|----------------|--------------|
| `app/(customer)/(tabs)/profile.tsx:142-152` | DiceBear URL | `<Avatar>` with fallback="dicebear" |
| `app/(vendor)/(settings)/index.tsx:78-87` | Letter initial | `<Avatar>` with fallback="initials" |
| `app/(dispatcher)/(tabs)/profile.tsx:36-44` | Letter initial "D" | `<Avatar>` with fallback="initials" |
| `app/(dispatcher)/(tabs)/tasks.tsx:105-109` | Icon "user" | `<Avatar>` with fallback="icon" |
| `app/(customer)/chats/index.tsx` | ui-avatars URL | `<Avatar>` with fallback="initials" |
| `app/(customer)/chats/[id].tsx` | ui-avatars URL | `<Avatar>` with fallback="initials" |
| `app/(vendor)/chats/index.tsx` | ui-avatars URL | `<Avatar>` with fallback="initials" |
| `app/(vendor)/chats/[id].tsx` | ui-avatars URL | `<Avatar>` with fallback="initials" |
| `app/(dispatcher)/chats/index.tsx` | ui-avatars URL | `<Avatar>` with fallback="initials" |
| `app/(dispatcher)/chats/[id].tsx` | ui-avatars URL | `<Avatar>` with fallback="initials" |
| `EditProfileScreen.tsx:119-142` | DiceBear URL with image | `<Avatar>` with fallback="dicebear", editable |

---

## Phase 4: Shared Photo Picker Component

### 4.1 Create `<PhotoPicker>` component

**New file:** `apps/mobile/src/components/ui/PhotoPicker.tsx`

A reusable action sheet modal for choosing camera / library / remove photo options.

```tsx
interface PhotoPickerProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  onRemove?: () => void;     // Only shown when a photo already exists
  allowRemove?: boolean;
}
```

### 4.2 Update `EditProfileScreen` to use `PhotoPicker`

Replace the direct `pickImage()` call with an action sheet flow. Customer/Dispatcher get camera + library options (matching vendor's UX).

### 4.3 Update Vendor profile settings to use `PhotoPicker`

Replace the inline modal in `(vendor)/(settings)/profile.tsx` with the shared `PhotoPicker` component.

---

## Phase 5: Loading State Consolidation

### 5.1 Merge LoadingState + LoadingSpinner

**File:** `apps/mobile/src/components/ui/LoadingState.tsx`

Enhanced `LoadingState` gains:
- `variant: "spinner" | "skeleton"` — defaults to "spinner"
- `size?: "small" | "large"` — configurable spinner size
- `color?: string` — configurable color (defaults to brand)
- `fullScreen?: boolean` — defaults to true
- `message?: string` — defaults to "Loading..."
- Existing branded circle container is kept for `variant="spinner"`

### 5.2 Delete `LoadingSpinner.tsx`

### 5.3 Update imports across the codebase

Replace `LoadingSpinner` imports with `LoadingState`.

### 5.4 Address skeleton components

Either:
- Wire `ProductCardSkeleton` and `CartItemSkeleton` into the `LoadingState` skeleton variant, OR
- Delete them if unused

---

## Phase 6: Unify Notification/Feedback

### 6.1 Create `useToast()` hook

**New file:** `apps/mobile/src/lib/hooks/use-toast.ts`

```ts
interface ToastOptions {
  type: "success" | "error" | "info";
  title: string;
  message?: string;
  duration?: number;  // ms, default 3000
}

function useToast() {
  const show = (opts: ToastOptions) => { /* non-blocking overlay */ };
  return { show };
}
```

The hook dispatches to the popup store but renders as a floating non-blocking toast (not a modal overlay).

### 6.2 Update `toast-polyfill.ts`

Refactor `Toast.show()` to use non-blocking floating toast via the updated `useToast` hook (or the popup store refactored to not block).

### 6.3 Update `GlobalPopup.tsx`

Convert from modal-blocking overlay to a floating bottom/slide-in toast.

---

## Phase 7: Card Base Component Usage

### 7.1-7.3 Update domain cards

| File | Change |
|------|--------|
| `OrderCard.tsx` | Wrap content in `<Card variant="outlined" padding="md">` |
| `ProductCard.tsx` | Wrap content in `<Card>` (respect existing variant styles) |
| `CategoryCard.tsx` | Wrap content in `<Card>` |

---

## Phase 8: Input Standardization

### 8.1-8.4 Replace inline TextInput with `<Input>`

| File | Fields to Convert |
|------|------------------|
| `EditProfileScreen.tsx` | Name, Email fields |
| `addresses.tsx` | All address form fields |
| `wallet/transfer.tsx` | Amount, Recipient, Pin fields |
| Vendor settings screens | Scan for raw TextInput usage |

---

## Phase 9: Form Validation Hook

### 9.1 Create `useFormValidation` hook

**New file:** `apps/mobile/src/lib/hooks/use-form-validation.ts`

```ts
function useFormValidation<T extends z.ZodType>(schema: T) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validate = (data: z.input<T>): data is z.output<T> => { ... };
  const clearErrors = () => setErrors({});
  return { errors, validate, clearErrors, setFieldError: (field: string, msg: string) => ... };
}
```

### 9.2 Create shared validation schemas

**New file:** `apps/mobile/src/lib/validation/schemas.ts`

```ts
export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

export const addressSchema = z.object({
  type: z.string().min(1, "Label is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(1, "Phone is required"),
});
```

### 9.3-9.9 Apply to form screens

| File | Schema | Current Pattern |
|------|--------|----------------|
| `register.tsx` | `registerSchema` | Inline `useState` + `validate()` |
| `login.tsx` | `loginSchema` | Inline `useState` + `validate()` |
| `checkout.tsx` | checkout schema | Inline field checks in `handlePlaceOrder` |
| `addresses.tsx` | `addressSchema` | Inline `if (!formData.name...)` |
| `wallet/transfer.tsx` | transfer schema | Inline checks |
| `(vendor)/(products)/add-product.tsx` | product schema | Inline `if (!name || !price)` |
| `(vendor)/(settings)/profile.tsx` | shop schema | Inline `useState` |

---

## Summary of Changes

| Phase | Type | Edits | New Files | Deletions |
|-------|------|-------|-----------|-----------|
| 1 | Quick fixes | 7 | 0 | 0 |
| 2 | Guard factory | 4 | 1 | 0 |
| 3 | Avatar component | 12 | 1 | 0 |
| 4 | Photo picker | 3 | 1 | 0 |
| 5 | Loading consolidation | ~10 | 0 | 1 |
| 6 | Toast unification | 3 | 1 | 0 |
| 7 | Card usage | 3 | 0 | 0 |
| 8 | Input standardization | 4+ | 0 | 0 |
| 9 | Form validation | 9 | 2 | 0 |
| **Total** | | **~55** | **6** | **1** |

---

## Implementation Order

1. **Phase 1** first — fixes actual bugs (L1, L5, L6, U6) and removes obvious issues (L3, L7)
2. **Phase 3** — Avatar component eliminates the most visible UI inconsistency
3. **Phase 4** — Photo picker unifies image upload UX across all roles
4. **Phase 2** — Guard factory reduces server boilerplate
5. **Phase 5** — Loading state consolidation
6. **Phase 6** — Toast/notification unification
7. **Phase 7-8** — Card + Input standardization (purely cosmetic)
8. **Phase 9** — Form validation (largest surface area, saved for last)
