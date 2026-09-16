# Bexiemart mobile — layout system

Design spec for the customer, vendor and rider mobile apps. Admin (`apps/admin`) is out of scope.

- **Source repo:** `Aeomar999/Bexiemart`, branch `main`, subtree `apps/mobile`
- **Platform:** React Native + NativeWind (Expo SDK 52+)
- **Status:** proposed, not yet built. 13 screens drawn as before/after pairs.
- **Supersedes:** §8 of `docs/DESIGN-SYSTEM.md` ("flat, zero shadow"). See [Depth](#5-depth-and-gradient).

Deliverables: `Mobile Layout System.dc.html`, `Customer Mobile Layouts.dc.html`, `Vendor Mobile Layouts.dc.html`, `Rider Mobile Layouts.dc.html`.

---

## 1. What this changes, and why

The brief was spacing, hierarchy and card rhythm. The named problems were: cramped with no breathing room, weak type hierarchy, inconsistent card padding, a floating bar covering content, sections reading as a random list, thin headers, too many sections on home.

Two decisions frame everything below.

**Density is high.** Room comes from removing nested surfaces, not from bigger gaps. Gaps stay tight; a card inside a card is the thing that goes.

**The wallet sets the visual direction.** `app/(customer)/wallet/index.tsx` and `wallet/rewards.tsx` already use gradient money surfaces, real depth and a number as the loudest element on the page. That language is now the system, applied to every balance in all three roles.

---

## 2. Token source of truth

Unchanged. Every value below resolves to an existing token.

| Layer | File |
| --- | --- |
| Primitives + semantic tokens | `apps/mobile/global.css` |
| Tailwind bindings, type scale, radius | `apps/mobile/tailwind.config.js` |
| Resolved hexes for JS props | `apps/mobile/src/theme/tokens.ts` |
| Card gradients | `apps/mobile/src/lib/utils/wallet.ts` |

Values used in this spec:

```
brand-700   #06406b   primary
brand-800   #04365b   money gradient, stop 1
accent-700  #0369a1   money gradient, stop 2
surface-50  #F8FAFC   page background
surface-100 #F1F5F9   filled inactive, dividers
surface-200 #E2E8F0   border
surface-400 #94A3B8   text muted
surface-600 #475569   text secondary
surface-900 #0F172A   text primary
brand-50    #f0f7fb   icon ground (primary-subtle)
success     #00D084 · error #EF4444 · warning #F59E0B
```

Fonts: **Raleway** 600/700/800 (headings, all numerals) · **Nunito** 400/600/700 (body).

---

## 3. Frame and rhythm

### 3.1 Frame

| | |
| --- | --- |
| Design frame | 390 × 844 (iPhone 14) |
| Status bar | 44 |
| Tab bar | **114** — `paddingTop 16` + 48 content + `paddingBottom insets.bottom(34) + 16` |
| Content area, tab screen | **686** |
| Content area, pushed screen | **800** |
| Gutter | **20**, both sides, every screen |

Horizontal rails break the gutter the existing way: `pl-5` on the wrapper, `paddingHorizontal: 20` on the list's content container.

### 3.2 Vertical rhythm — three gaps

| Gap | Token | Use |
| --- | --- | --- |
| **16** | `space-4` | Inside a block. Label to content, card to card, row to row. |
| **24** | `space-6` | Between blocks. The default, every section, every screen. |
| **32** | `space-8` | Between zones. Money hero to body, body to destructive actions. Twice per screen at most. |

`mt-4` / `mt-6` / `mt-8` / `mt-10` mixed arbitrarily is the current state and is what this replaces.

---

## 4. Two surfaces, and only two

Everything is either a flat bordered data card or the one gradient money hero. No third surface: no tinted half-panels, no card inside a card, no grey item box inside a white card.

### 4.1 Data card

```
background  #FFFFFF
border      1px #E2E8F0
radius      16
padding     16   (12 for dense list rows)
shadow      none
```

Stat cards, list rows, order cards, transaction rows, settings groups, listing rows.

### 4.2 Money hero

```
background  linear-gradient(135deg, #04365b, #0369a1)
radius       20
padding      20
shadow       0 14px 30px rgba(4,54,91,.26)
```

One per screen, at the top. Balance, active order, active task, promo. Controls inside it are white fills (primary action) and `rgba(255,255,255,.18)` glass with a `.12` border (secondary) — the wallet's pattern.

### 4.3 Radius scale in use

| Value | Applies to |
| --- | --- |
| 9 | Icon tile inside a dense row (32px) |
| 10–12 | Thumbnails, buttons inside a hero |
| 14 | Search field, nav tile, bottom-bar CTA |
| 16 | Data cards, groups |
| 20 | Money hero |
| 24 | Wallet pocket, sheet top corners |
| 999 | Chips, pills, avatars, quick-action circles |

`Card padding="lg"` (24) is retired.

---

## 5. Depth and gradient

The rule the wallet follows implicitly and everything else follows explicitly: **a shadow is tinted with its own surface's darkest stop.** Never neutral black on a coloured card.

### 5.1 Elevation

| Level | Value | Applies to |
| --- | --- | --- |
| **0** | border only | All data cards and rows |
| **1** | `0 -4px 16px rgba(15,23,42,.08)` | Bottom bars, bottom sheets, tab bar — upward only |
| **2** | `0 14px 30px <stop-1>/.26` | Money hero, promo banner, loyalty card |
| **3** | `0 -6px 20px rgba(45,27,115,.55)` | The wallet pocket only — existing value, unchanged |

Loyalty card at level 2 resolves to `0 12px 26px rgba(217,119,6,.28)`.

### 5.2 Gradient roles

| Role | Value | Where |
| --- | --- | --- |
| Money | `135deg #04365b → #0369a1` | Every balance, all three roles. Cart total CTA, order-tracking hero, home promo scrim. |
| Wallet pocket | `135deg #4f2ae8 → #3013a5` | Customer wallet balance only |
| Loyalty | `90deg #f59e0b → #d97706` | BexieCoins, tier |
| Saved cards | `PREMIUM_GRADIENTS`, hashed by card id | Card surfaces in the wallet stack |

**Not allowed:** data cards, list rows, settings groups, chips, segmented controls, buttons inside a gradient card, any screen background. If two gradients are visible at once on one screen, one of them is wrong.

---

## 6. Type

### 6.1 Ladder

| Level | Spec | Notes |
| --- | --- | --- |
| Page title | Raleway 24/28 · 700 · `-0.01em` | Same size in every role. Was 20 in four screens, 24 in five. |
| Section label | Nunito 12/16 · 700 · uppercase · `+0.10em` · `#94A3B8` | Replaces the 18/26 700 headline. This is the single biggest hierarchy change. |
| Card title | Nunito 15/22 · 600 · `#0F172A` | Never 700 — the number carries emphasis. |
| Meta | Nunito 12/16 · 400 · `#94A3B8` | Timestamps, counts, categories. |
| Eyebrow | Nunito 11/14 · 700 · uppercase · `+0.10em` · `#94A3B8` | Header context line, hero labels. |

### 6.2 Money ladder

All Raleway 800, `-0.02em`, `font-variant-numeric: tabular-nums`. Currency sits on the baseline beside the figure at ~40% of its size, in `rgba(255,255,255,.8)` on a hero or `#94A3B8` on white.

| Step | Size | Use |
| --- | --- | --- |
| Hero | **44** | Wallet balance, vendor / rider available balance |
| Secondary | **32** | Rider task payout, cart total (28) |
| Inline | **17–20** | Stat cards, transaction rows, list rows |

Minimum body size anywhere: 11px, and only for uppercase labels and meta. The current 10px two-line quick-action labels are below minimum.

---

## 7. Components

### 7.1 Header

```
padding      10 top · 20 sides · 14 bottom
border       1px bottom #E2E8F0, on #FFFFFF
eyebrow      11/14 700 uppercase muted        (campus · role · count · store state)
title        Raleway 24/28 700 -0.01em
actions      36px circles, #F8FAFC + 1px #E2E8F0, glyph 17px #475569
back         36px, same treatment, leading the title block
search       44 tall, radius 14, #F1F5F9 + 1px #E2E8F0, glyph 17px
```

The eyebrow is what anchors the screen: "KNUST campus", "6 need accepting", "42 products · 3 drafts", "Jean Collections · Open", "MTN ···4821 linked".

### 7.2 Actions vs navigation

Split by job — this was tested both ways and both survive.

**Action → filled circle** (from the wallet)

```
52 circle · saturated fill · 22px white glyph · 7px gap · label 11/700
```

One hue per action, held constant across screens: top up / add `#06406b` or `#10b981`, send `#7c3aed`, cards `#e11d48`, request `#059669`, reel `#7c3aed`, hours `#d97706`, settings `#475569`.

**Navigation → boxed tinted tile**

```
74 tall · radius 14 · tinted ground · 20px glyph in the tint's own 600 shade · label 11/700
```

Home Explore grid (4 × 2), category tiles. A grid of destinations reads better as a set of surfaces than as a row of buttons.

**Retired:** the near-white `#f8fafc` tile on a white card — no edge at all — and the 32px-radius container that wrapped it, which added 40px of internal padding for nothing.

### 7.3 List rows

| Row | Height | Build |
| --- | --- | --- |
| Settings / nav | **52** | 12 pad · 28 icon tile (radius 9, `#f0f7fb`, 15px brand glyph) · label 15/600 · value 12 muted · chevron 16 `#CBD5E1` |
| Transaction | **56** | 12 pad · 32 icon tile · title 15/600 · date 11 muted · amount Raleway 16–17/800 |
| Order (vendor) | **70** | 12/14 pad · 36 avatar · name 15/600 + status pill · meta 11 · total right, tabular |
| Listing | **80** | 12 pad · 56 thumbnail (radius 10) · name 15/600 + status tag · meta 11 · price right |
| Cart item | **104** | 12 pad · 18 checkbox · 64 thumbnail (radius 12) · name 15/600 · price + stepper |

Dividers inside a group are `#F1F5F9`, so the group's own `#E2E8F0` edge stays the strongest line.

### 7.4 Chips and segments

```
Chip      padding 7 × 14 · radius 999 · 12/700
          active   #06406b, white text
          inactive #F1F5F9, #475569 text        (not an outline — it read as disabled)
          counts live inside the label: "Active · 2", "New · 6"

Segment   container #F1F5F9, radius 12, padding 3
          item      34 tall, radius 9; active #FFFFFF, 13/700
```

### 7.5 Bottom bars and sheets

```
Bar       14 top · 20 sides · 16 bottom · 1px top #E2E8F0 · elevation 1
          sits directly above the tab bar, never over it
          one summary line + one 52px CTA (radius 14)
          breakdowns collapse behind a chevron

Sheet     radius 24 top · elevation 1 · 40 × 4 grabber, 10 top margin
          padding 14 top · 20 sides · 16 bottom
          no safe-area padding when a tab bar is present — it already handles it
```

### 7.6 Tab bar

Unchanged. `paddingTop 16`, `paddingBottom insets.bottom + 16`, active pill `#eff6ff` with brand-700 icon + 14/700 label. Left as is in every frame, since it is shared chrome and out of scope.

---

## 8. Per-screen decisions

Figures are measured from the recreated frames at 390 × 844.

### Customer

| Screen | Change |
| --- | --- |
| **Home** | 9 blocks → 5. Filter pills, Featured Highlights and the floating dock merge into one 8-tile Explore grid (335 → 176px). Top Products / New Items / Most Popular become one rail with segments. Flash Sale folds into a Deals tile. Banner 180 → 128 with a money-gradient scrim + elevation 2. Dock moves in-flow; bottom padding 160 → 96. |
| **Shop** | Card 316 → 244: square image, name to 14/600, vendor demoted to 11px meta, rating moves onto the image as a pill. 1 visible row → 2. Product count moves to the header eyebrow; sort control legible at 12/700. Radius 24 → 16, gap 14 → 12. |
| **Cart** | Bottom bar 310 → 130: total on one line with a chevron that expands the breakdown, coupon moves to the end of the list. 2 visible items → 4. Item row 116 → 104. Store headers become 12px uppercase labels. Total 24 → 28. CTA takes the money gradient. |
| **Profile** | Rows 72 → 52 (13 rows, −260px). "My Wallet" and "Refer & Earn" chevron rows become two stat cards showing balance and coins. Phone number folds into the identity meta line. Avatar loses its 4px white ring. |
| **Orders** | Card 232 → 131: the grey item box becomes one 12px meta line, "Total Amount" caption dropped. 2 visible orders → 4. The in-flight order is pulled out as a gradient hero. Month labels replace filter-name repetition. Cancelled orders lose their action row. |
| **Wallet** | Stack 260 → 196; layer offsets 0/14/82 → a single 0/10/60 scale. Balance stays 44px. Rewards 130 → 76 as a row with a real Redeem button. Activity rows 72 → 56. Recent Activity now clears the fold. |

### Vendor

| Screen | Change |
| --- | --- |
| **Dashboard** | "Overview" title and the greeting go — store name and open state become the header eyebrow. Hero takes the money gradient + elevation 2, figure to 36px, pending clearance added. Stat card 140 → 60 (icon beside number, not above); 2×2 grid 296 → 130. Pending is the only coloured stat. Quick actions become filled circles; the 32px-radius container goes. |
| **Listings** | Header 232 → 196: search and chips share a line, segment to 34px. Row 112 → 80 and carries the Active / Low / Out / Draft tag the filters imply. 3 visible items → 6. FAB becomes a labelled header button. Favourite hearts dropped — a customer-card leftover. |
| **Orders** | Two-storey card 159 → 70px row. Customer name leads; id, time and item count become one meta line; total right-aligned, tabular. 3 visible orders → 9. Header eyebrow states the job. |
| **Earnings** | The Overview section folds into the hero as a hairline strip (−156px). Balance 36 → 44 on the money gradient. Withdraw becomes a full-width 44px button naming its destination. Rows 72 → 56; 2 visible transactions → 5. The two decorative translucent circles go. |
| **Settings** | Eight icon hues → one brand-subtle ground. Rows 72 → 52, section gap 32 → 24; 2 visible groups → 3. Rows state their current value (08:00–21:00, MTN ···4821, 4.8 · 62). Group titles shorten to one word. |

### Rider

| Screen | Change |
| --- | --- |
| **Map** | Addresses `#94A3B8` → `#0F172A` 15/600 — see [defects](#9-defects-found-in-the-code). Payout 18 → 28 with the task type as its label; distance and duration added opposite. The card-in-a-card inside the sheet goes (−32px padding, −1 border). Status bar 64 → 52 and carries today's earnings and trip count. Slider 64 → 56 with a solid brand fill. Re-centre moves to thumb reach above the sheet. |
| **Tasks** | Card 197 → 150. Type becomes the payout's label; the avatar footer folds into the meta line. Addresses fixed the same way, with a connector line instead of loose dots. Distance and duration added. Counts move into the segment labels. |
| **Earnings** | Same treatment as vendor earnings — near-identical source file. Balance 44 on the money gradient, Overview folded into a hairline strip, rows 72 → 56, trip count added beside the money. Transaction titles become the destination, not "Delivery payout". |
| **Profile** | Trips, revenue and rating move into a hairline strip inside the identity card at 20/800 (they were 14px). Three cards → one. Rows 72 → 52 with label left, value right. The whole screen including Log out now fits without scrolling. |

---

## 9. Defects found in the code

Found while recreating. All are in `apps/mobile`.

**Accessibility**

1. **Rider addresses fail contrast.** `(dispatcher)/(tabs)/(home)/index.tsx` and `tasks.tsx` render pickup and drop-off in `text-muted-foreground` (`#94A3B8`) on white — **2.6:1**, against a 4.5:1 minimum. These are the most important words on the screen and are read outdoors in sunlight.
2. **Wallet masked card number.** `wallet/index.tsx` uses `text-white/80` over a hashed gradient. On the lighter stops — amber gold `#fbbf24`, slate `#9ca3af` — it drops under 4.5:1. Should be full white.
3. **Quick-action labels below minimum.** 10px two-line labels in the home dock and vendor dashboard.

**Layout**

4. **Home dock covers the tab bar.** `(customer)/(tabs)/(home)/index.tsx` positions a ~120px dock at `bottom: 24`; the tab bar is 114 tall. The scroll view pads 160px to compensate. The dock's five actions also duplicate four of the six Featured Highlights.
5. **Sheet double-counts the safe area.** The rider bottom sheet adds `Math.max(insets.bottom, 20) + 24` while sitting inside a tab screen, where the tab bar already handles it — 58px of dead space.
6. **Titles tight to the status bar.** `(vendor)/(orders)/index.tsx`, `(vendor)/(earnings)/index.tsx` and the rider earnings screen use `paddingTop: insets.top` without the `+ 12` every other screen uses.
7. **Ineffective padding.** `(dispatcher)/(tabs)/profile.tsx` puts `pt-6 pb-10` on the `ScrollView` rather than its content container, so the bottom padding never applies.
8. **Wallet stack offsets branch on card count.** Layer `top` values switch between 0/14/82, 0/68 and 42 depending on how many cards exist. One offset scale should cover 0, 1 and 2+ by collapsing layers.

**Tokens**

9. **Off-palette blues.** `wallet/topup.tsx` hardcodes `#1d4ed8` for the selected payment label and `#3b82f6` for its radio, next to brand-700 elsewhere.
10. **Stray shadows.** `shadow-lg` on settings groups, profile cards and order cards. Under the new depth rule a shadow means money or chrome, so these still come off.

**Behaviour**

11. **Home hamburger navigates to the profile tab** — flagged in a source comment in the home screen. Icon and destination disagree.
12. **Duplicate cart checkboxes.** Each cart item carries a checkbox identical to its store group's.

---

## 10. Open items

- **Cart per-item delete → swipe.** The 32px rose trash button is gone from the proposal. Needs a confirm-on-swipe pattern before build.
- **Accept on the vendor order row.** Would save a screen per order, but it is a behaviour change, so it isn't drawn.
- **Home section merge.** Nine blocks → five changes what is on the page, which is one step past the agreed latitude. Approved on the basis of the "too many sections on home" problem — flag if it should revert.
- **Dark mode.** Tokens exist and flip correctly; none of the money gradients or hue-matched shadows have been checked against `.dark`.
- **Two annotation bugs in the deliverables.** The home "Now" frame needs a z-index so the dock visibly covers the tab bar, and the wallet "Now" frame's note arithmetic overstates the fold cut.

---

## 11. Files

| File | Contents |
| --- | --- |
| `Mobile Layout System.dc.html` | This spec, as live specimens |
| `Customer Mobile Layouts.dc.html` | Home · Shop · Cart · Profile · Orders · Wallet |
| `Vendor Mobile Layouts.dc.html` | Dashboard · Listings · Orders · Earnings · Settings |
| `Rider Mobile Layouts.dc.html` | Map · Tasks · Earnings · Profile |
| `github.md` | Source association and screen → repo-file map |
