# Better Password UX Implementation Plan

This plan aims to significantly improve the password user experience across both the mobile app and the admin web dashboard. The focus is on reducing friction during sign-up and login by providing better visual feedback, increasing accessibility, and making password requirements explicit.

## Proposed Changes

### 1. Mobile App (`apps/mobile`)

#### [MODIFY] apps/mobile/src/components/ui/Input.tsx
- **Visual Toggle**: Replace the text-based "Show" / "Hide" toggle for `secureTextEntry` with standard eye icons (`ViewIcon` and `ViewOffIcon` from `@hugeicons/core-free-icons`).
- **Autofill Attributes**: Ensure `textContentType` and `autoComplete` props are correctly exposed or mapped to support iOS/Android built-in password managers.

#### [NEW] apps/mobile/src/components/auth/PasswordStrength.tsx
- **Strength Meter**: Create a visual progress bar that turns red (weak), yellow (medium), or green (strong) as the user types.
- **Requirement Checklist**: Display inline criteria (min 8 chars, uppercase, lowercase, number, special character) with checkmarks (`Tick01Icon`) that turn green when satisfied. This provides immediate, non-punitive feedback instead of relying solely on Zod validation errors on blur/submit.

#### [MODIFY] apps/mobile/app/(auth)/register.tsx
- **Integration**: Add the new `PasswordStrength` component below the password input.
- **Autofill hints**: Set `textContentType="newPassword"` and `autoComplete="password-new"`.

#### [MODIFY] apps/mobile/app/(auth)/login.tsx & apps/mobile/app/(auth)/forgot-password.tsx
- **Autofill hints**: Set `textContentType="password"` and `autoComplete="password"`.

---

### 2. Admin App (`apps/admin`)

#### [MODIFY] apps/admin/src/components/ui/Input.tsx
- **Password Toggle**: Upgrade the standard `<input>` component so that if `type="password"` is passed, it automatically renders a show/hide toggle button on the right side using `ViewIcon` and `ViewOffIcon`.
- **Caps Lock Warning**: Add a listener to detect if Caps Lock is active during `onKeyUp` and `onKeyDown`. If active on a password field, render a small warning icon or text (e.g., `Alert01Icon` with "Caps Lock is ON") inside or below the input.

#### [MODIFY] apps/admin/src/app/(auth)/login/page.tsx
- Verify that `autoComplete="current-password"` is properly set to support browser password managers.

## Verification Plan

### Automated Tests
- Mobile: `npm --prefix apps/mobile run test` (if unit tests exist for forms).
- Admin: `npm --prefix apps/admin run test` or `npm --prefix apps/admin run lint`.

### Manual Verification
1. **Mobile Register**: Open the app, navigate to registration, and type a password. Verify the checklist items turn green correctly and the strength bar fills up.
2. **Mobile Login**: Toggle the eye icon to verify the password visibility switches correctly.
3. **Admin Login**: Open the web dashboard, type in the password field, toggle the eye icon, and turn on Caps Lock to verify the warning appears. Verify that standard inputs (`type="email"`) remain unaffected.
