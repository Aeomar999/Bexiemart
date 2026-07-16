# Bexiemart Design System — Source of Truth

**Status:** Canonical spec (Phase 0 of the design-system consolidation).
**Anchor:** `apps/mobile` is the canonical design system. `apps/admin` conforms to it.
**Rule:** Every color, type size, space, radius, and control dimension in this doc is the *only* allowed value. Anything not on these scales is a bug.

---

## 0. The one architectural decision

`apps/mobile` is **React Native + NativeWind**; `apps/admin` is **Next.js + Tailwind v4 (DOM)**. A React Native `<TouchableOpacity>` **cannot** be imported into the web app, and a web `<button>` cannot be imported into RN.

So "reusable across all apps" means:

> **One shared token + scale source of truth, and a mirrored component *contract* (identical variant names, size names, and visual language) — NOT literally shared JSX.**

Two things are shared:
1. **Tokens & scales** (this document + the CSS/config files it governs) — identical *values* in both apps.
2. **Component contracts** — a `Button` in either app exposes the same `variant`/`size`/`state` vocabulary and looks identical, even though the implementation differs per platform.

One thing is **not** shared: the component source files. Each platform keeps its own `components/ui/`, but both conform to the contracts in §7.

---

## 1. Token architecture (3 layers)

Mobile already implements this cleanly in `apps/mobile/global.css`. It is the model both apps follow.

```
Layer 1 — PRIMITIVES   raw scales: brand-*, accent-*, surface-*, feedback, spacing, radius
Layer 2 — SEMANTIC     intent aliases: --color-primary, --color-background, --color-text-primary …
Layer 3 — COMPONENT    per-component classes/props (Button, Input, Card) consume Layer 2 only
```

**Rules**
- Screens and components consume **Layer 2 (semantic)** tokens only — never a raw hex, never a raw Layer-1 primitive.
- Layer 2 is the only place brand decisions live. Change `--color-primary` once → everything updates.
- **No raw hex anywhere outside Layer 1.** (Current violations to fix in migration: `#64748b` in mobile `SearchBar.tsx`, `#94A3B8` in mobile `Input.tsx` and shop-screen search.)

---

## 2. Color tokens

### 2.1 Primitive scales (Layer 1) — identical in both apps ✅ *(already aligned)*

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **brand** (navy) | #f0f7fb | #dbeaf5 | #b9d5ea | #88b7da | #5193c6 | #2c75a9 | #1b5b8b | **#06406b** | #04365b | #022d4d | #011d35 |
| **accent** (sky) | #f0f9ff | #e0f2fe | #bae6fd | #7dd3fc | #38bdf8 | **#0ea5e9** | #0284c7 | #0369a1 | #075985 | #0c4a6e | #082f49 |
| **surface** (gray) | #F8FAFC | #F1F5F9 | #E2E8F0 | #CBD5E1 | #94A3B8 | #64748B | #475569 | #334155 | #1E293B | #0F172A | #020617 |

Feedback: `success #00D084` / `error #EF4444` / `warning #F59E0B` (+ `-light` tints: `#E6F9F3` / `#FEF2F2` / `#FFFBEB`).

> **Admin fix:** admin's `@theme` only defines `accent-50/500/700` and omits `brand`-nothing but has no `3xl` radius. Add the **full accent scale** so both apps expose the same tokens.

### 2.2 Semantic tokens (Layer 2) — **canonical names** (mobile wins)

Admin currently uses **different names** for the same intents. This is the single biggest reason tokens can't be shared. Standardize on the mobile names:

| Intent | ✅ Canonical (mobile) | ❌ Admin alias to migrate |
|---|---|---|
| Page background | `--color-background` | `--color-bg` |
| Card / raised surface | `--color-surface` | `--color-card` |
| Primary text | `--color-text-primary` | `--color-text` |
| Secondary text | `--color-text-secondary` | `--color-text-secondary` ✅ |
| Muted text | `--color-text-muted` | `--color-text-muted` ✅ |
| Disabled text | `--color-text-disabled` | *(missing — add)* |
| Border | `--color-border` | `--color-border` ✅ |
| Primary / hover / active / subtle / text | `--color-primary` / `-hover` / `-active` / `-subtle` / `-text` | admin missing `-active`, `-text` — add |
| Secondary / hover / text | `--color-secondary` / `-hover` / `-text` | admin missing `-hover`, `-text` — add |

**Dark mode:** both apps already flip Layer 2 under `.dark`. Keep the mobile mapping as canonical (brand-400 primary, surface-950 bg, etc.) and mirror it in admin.

---

## 3. Typography scale

**Mobile has a full named type scale; admin has none** (it uses raw `text-xs / text-sm / text-base`). Adopt the mobile scale in admin.

### 3.1 Type scale (canonical) — from `apps/mobile/tailwind.config.js`

| Token | Size | Line-height | Weight | Use |
|---|---|---|---|---|
| `display-lg` | 32px | 40px | 700 | Screen hero / big numbers |
| `display-md` | 24px | 32px | 700 | Screen title |
| `display-sm` | 20px | 28px | 700 | Section title |
| `heading-md` | 18px | 26px | 600 | Card title |
| `heading-sm` | 16px | 24px | 600 | Sub-heading / list header |
| `body-lg` | 16px | 24px | 400 | Primary body, inputs |
| `body-md` | 14px | 20px | 400 | Secondary body |
| `body-sm` | 12px | 16px | 400 | Meta / helper |
| `caption` | 11px | 14px | 500 | Labels, timestamps |

**Admin migration map:** `text-base → body-lg`, `text-sm → body-md`, `text-xs → body-sm` (or `caption` for 11px labels). Heading/title text → `display-*` / `heading-*`.

### 3.2 Fonts

| Role | Family | Weights |
|---|---|---|
| Heading (`font-heading`) | **Raleway** | 700 / 600 / 400 |
| Body (`font-body`) | **Nunito** | 400 / 500 / 600 / 700 |

> **Admin fix:** admin binds `--font-heading` / `--font-body` to `next/font` slots. Load **Raleway + Nunito** so the web app matches the app typeface (not the Next default).

---

## 4. Spacing scale (8px base) — identical in both ✅

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64` px → tokens `space-1…space-16`.
Named large steps (mobile only, keep): `18=72`, `22=88`, `30=120`, `34=136`, `42=168`.

**Rule:** all margin/padding/gap use these steps. No `13px`, no `p-[15px]`. If a layout "needs" an off-step value, it's a design error — round to the nearest step.

---

## 5. Radius scale — identical values, one gap ⚠️

| Token | Value |
|---|---|
| `sm` | 4px |
| `md` | 8px |
| `lg` | 12px |
| `xl` | 16px |
| `2xl` | 24px |
| `3xl` | 32px *(**admin missing — add**)* |
| `full` | 9999px |

**Component radius conventions:**
- Buttons → `full` (pill) — *see §7.1*
- Inputs / search → `xl` (16px)
- Cards → `2xl` (24px)
- Badges / chips → `full`
- Modals / sheets → `2xl`

---

## 6. Sizing — control heights (the missing systematic layer)

Neither app formalizes control heights as tokens; they're scattered inline. Canonicalize:

| Control | sm | md (default) | lg |
|---|---|---|---|
| **Button** | 40px (`h-10`) | 48px (`h-12`) | 56px (`h-14`) |
| **Input** | — | 48px (`h-12`) | — |
| **Search** | — | 48px (`h-12`) | — |
| **Icon button / tap target** | min 44×44 (a11y) | | |

- Mobile Button already = 40/48/56 ✅. **Admin Button = 32/40/48 → migrate to 40/48/56.**
- Mobile Input/Search = 48 ✅. **Admin Input = 40 → migrate to 48.**
- Minimum touch target **44×44** everywhere (keep existing `hitSlop`).

---

## 7. Component contracts (the mirrored API)

Both platforms expose these exact vocabularies. **Content props may differ by platform idiom** (`title` on RN, `children` on web — RN must style its own `<Text>`), but **`variant`, `size`, and state names are identical**, and the **visual result is identical**.

### 7.1 Button

| | Value |
|---|---|
| `variant` | `primary` \| `secondary` \| `outline` \| `ghost` \| `danger` |
| `size` | `sm` \| `md` \| `lg` (heights per §6) |
| state | `loading` (⚠️ standardize — admin currently `isLoading`), `disabled` |
| radius | **`full` (pill)** — canonical from mobile |
| elevation | **none** (flat) |
| content | RN: `title` + optional `leftIcon`; Web: `children` |

> **Decision — pill vs rounded:** canonical is **pill (`rounded-full`)** to match mobile. Admin's current `rounded-md` + `shadow-sm/md` is non-conforming and must change to pill + flat.

### 7.2 Input

| | Value |
|---|---|
| height | 48px (`h-12`) · radius `xl` (16px) · 1px border |
| focus | border → `--color-primary` (no ring; admin's `ring-2` → replace with border color change) |
| error | border → `--color-error`, message in `caption`/`error` |
| props | `label?`, `error?`, `hint?`, `leftIcon?`, `rightIcon?` (admin Input only has `error` today → expand to match) |
| placeholder color | `--color-text-muted` token (⚠️ not hardcoded `#94A3B8`) |

### 7.3 Search — **NEW canonical primitive** (this is the big gap)

There is no shared *typing* search input today; ~12 hand-rolled variants exist. Define **two** clear parts of one contract:

| Part | Purpose | Spec |
|---|---|---|
| `SearchTrigger` | Tap-to-navigate (current mobile `SearchBar`) | 48px, radius `xl`, leading search icon, muted placeholder text, optional camera affordance |
| `SearchInput` | Real typing field (list filters) | 48px, radius `xl`, leading search icon, **clear (×) button when non-empty**, `value`/`onChangeText`(RN)/`onChange`(web), `placeholder` |

Every existing hand-rolled search bar migrates to one of these. Admin gets a `SearchInput` (it currently has none).

### 7.4 Card

`variant`: `outlined` (default) \| `flat`. Radius `2xl`. **`elevated` is deprecated → renders as `outlined`** (flat design, no shadow). `padding`: `none` \| `sm` (16) \| `md` (20) \| `lg` (24).

### 7.5 Badge / Skeleton / EmptyState

Align contracts across apps: `Badge` (`variant`: neutral/success/warning/error/info; radius `full`), `Skeleton` (shape + shimmer, token colors), `EmptyState` (icon + title + description + optional action `Button`). Purge one-off copies.

---

## 8. Elevation policy — FLAT, zero shadow

Bexiemart is a **flat** system. Separation comes from **borders (`--color-border`)** and **surface color**, never shadows.

**Active violations to remove during migration:**
- `apps/admin/.../ui/Button.tsx` → `shadow-sm`, `hover:shadow-md`
- `apps/mobile/global.css` → `.glass` utility `box-shadow` (and its `.dark` variant)
- Any residual `shadow-*` / native `elevation` / `shadowColor` props.

---

## 9. Component inventory & divergence map

**Canonical library:** `apps/mobile/src/components/ui/` (26 components).
**Admin library:** `apps/admin/src/components/ui/` (10 components).

| Primitive | Mobile (canonical) | Admin | Status → target |
|---|---|---|---|
| Button | pill, `title/loading`, flat ✅ | `rounded-md`, `children/isLoading`, **shadowed** | **Divergent** → pill + flat + `loading`, expand contract |
| Input | h48, xl radius, label/error/hint/icons ✅ | h40, md radius, `error` only, focus ring | **Divergent** → h48, xl, border-focus, full props |
| Search | `SearchBar` (trigger only) | **none** | **Missing** → add `SearchTrigger` + `SearchInput` both apps |
| Card | `outlined/flat`, 2xl ✅ | exists | Align contract |
| Badge | exists ✅ | exists | Align variants |
| Skeleton | exists ✅ | exists | Align token colors |
| EmptyState | exists ✅ | exists | Align contract |
| Table / Pagination / Stat | — | admin-only ✅ | Admin-only, conform tokens |
| ProductCard / CategoryCard / OrderCard / PromoBanner / CoverHeader / StatusBanner / Avatar / Icon / etc. | mobile-only ✅ | — | Mobile-only, keep |

**Non-conforming inline usage to migrate (from audit):**
- **Search:** 7+ mobile screens (`home`, `shop`, `food`, `search`, vendor `help`, `add-reel`, `customers`) + 5 admin pages (`dispatchers`, `disputes`, `orders`, `users`, `vendors`).
- **Buttons:** 12 mobile screens use raw `TouchableOpacity`; 7 admin raw `<button>`.
- **Inputs:** 38 mobile screens use raw `TextInput`; 4 admin pages use raw `<input>`.

---

## 10. Adoption guardrails (make it self-enforcing)

Add lint rules (Phase 0.5) so consistency doesn't erode again:
1. **No raw hex** in `app/**` or `components/**` (except Layer 1 token files). Regex: `#[0-9a-fA-F]{3,6}`.
2. **No raw control elements outside `components/ui/`:** ban `TextInput` / `<input>` / `<button>` / bare `TouchableOpacity`-as-button in screens — must import the shared component.
3. **No off-scale utilities:** ban arbitrary values `p-[…]`, `text-[…px]`, `rounded-[…]`, `h-[…]`.
4. **No `shadow-*` / `elevation` / `shadowColor`** (flat rule).

---

## 11. Migration phases (execution order)

- **Phase 0** — *this doc.* Tokens + scales reconciled, contracts defined. ✅
- **Phase 0.5** — ✅ **Done.** Admin `@theme` reconciled (canonical semantic names added + legacy aliased, full accent scale, `3xl` radius, named type scale, Raleway/Nunito fonts). Guardrail scanner added: `scripts/check-design-system.mjs` (`npm run lint:ds`). **Baseline: 977 violations** (742 raw-hex, 21 shadow, 141 off-scale, 73 raw-control) — Phases 1–4 drive this to 0, then wire `lint:ds:strict` into CI. Control-height migration happens with the components in Phases 2–3.
- **Phase 1** — Search: build `SearchTrigger` + `SearchInput` (both apps); migrate all ~12 hand-rolled search bars.
- **Phase 2** — Button: unify to pill + flat + shared contract; migrate 12 mobile + 7 admin one-offs.
- **Phase 3** — Input: migrate 38 mobile + 4 admin raw fields.
- **Phase 4** — Card / Badge / Skeleton / EmptyState: align contracts, purge off-token colors, remove `.glass` shadow.

**Every phase:** no behavior change, tests stay green, off-scale values flagged not hardcoded.
