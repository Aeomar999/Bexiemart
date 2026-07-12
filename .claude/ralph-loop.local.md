---
active: true
iteration: 1
session_id: cfd19840-ede1-4ea7-884f-75b498e9eec5
max_iterations: 15
completion_promise: "PHASE 1 FOUNDATION COMPLETE"
started_at: "2026-07-06T00:32:03Z"
---

Implement Phase 1 Foundation of dark mode. Read the spec at docs/superpowers/specs/2026-07-05-dark-mode-design.md sections 3 and 4 and the Phase 1 bullet of section 7 before each iteration. Check which files already exist so you continue rather than restart. Build only the flag gated OFF foundation described in the spec. Deliverable one is a persisted theme-store zustand store mirroring the auth-store persist pattern. Deliverable two is tokens split into lightTokens and darkTokens using the exact dark hex from spec section 4 with a getThemeColors helper and a tokens alias kept for compatibility. Deliverable three is a useThemeColors hook on nativewind useColorScheme. Deliverable four is a headless ThemeController in the root layout that applies colorScheme from the saved preference and listens to Appearance. Deliverable five is StatusBar set to auto. Deliverable six is the Profile Dark Mode row replaced by a real Light Dark System control gated behind a new darkModeEnabled flag defaulting OFF following the feature-flags pattern. Deliverable seven is nativewind and Appearance mocks in jest.setup.js. Deliverable eight is unit tests plus a WCAG contrast test. Do NOT edit app.json userInterfaceStyle. Do NOT git add or git commit. Keep the flag OFF. Verify each iteration from apps/mobile with npx tsc --noEmit and npx jest. Emit the completion promise only when every deliverable exists and tsc and jest both pass.
