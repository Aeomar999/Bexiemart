repo: Aeomar999/Bexiemart
branch: main
path: apps/mobile

## Last sync

date: 2026-09-15T16:40:00Z

### Updated in this project

- Read the mobile design system (`docs/DESIGN-SYSTEM.md`, `global.css`, `tailwind.config.js`, `theme/tokens.ts`) and the shared `components/ui` primitives.
- Recreated 13 non-admin mobile screens at 390×844 from source, across customer, vendor and rider.
- Adopted the wallet screens' visual language app-wide: money gradient (brand-800 → accent-700), hue-matched depth, a 44/32/20 money type scale, and 52px saturated quick-action circles.
- Flagged three defects: rider pickup/drop-off addresses at 2.6:1 contrast, the customer home dock covering the tab bar, and off-palette blues hardcoded in `wallet/topup.tsx`.

## Screen map

| Project screen | Built from |
| --- | --- |
| Mobile Layout System | docs/DESIGN-SYSTEM.md · apps/mobile/global.css · apps/mobile/tailwind.config.js · apps/mobile/src/theme/tokens.ts · apps/mobile/app/(customer)/wallet/index.tsx · apps/mobile/src/lib/utils/wallet.ts |
| Customer · Home | apps/mobile/app/(customer)/(tabs)/(home)/index.tsx · (tabs)/_layout.tsx · ui/SearchBar.tsx · ui/PromoBanner.tsx · ui/StatusBanner.tsx · ui/Icon.tsx |
| Customer · Shop | apps/mobile/app/(customer)/(tabs)/(shop)/index.tsx · ui/ProductCard.tsx · ui/EmptyState.tsx |
| Customer · Cart | apps/mobile/app/(customer)/(tabs)/cart.tsx · ui/Button.tsx |
| Customer · Profile | apps/mobile/app/(customer)/(tabs)/profile.tsx · ui/Avatar.tsx |
| Customer · Orders | apps/mobile/app/(customer)/orders.tsx · ui/OrderCard.tsx · ui/BackButton.tsx |
| Customer · Wallet | apps/mobile/app/(customer)/wallet/index.tsx · wallet/rewards.tsx · wallet/topup.tsx · src/lib/utils/wallet.ts |
| Vendor · Dashboard | apps/mobile/app/(vendor)/(dashboard)/index.tsx · (vendor)/_layout.tsx · ui/Card.tsx · ui/OrderCard.tsx |
| Vendor · Listings | apps/mobile/app/(vendor)/(products)/index.tsx · ui/ProductCard.tsx · ui/SearchBar.tsx |
| Vendor · Orders | apps/mobile/app/(vendor)/(orders)/index.tsx |
| Vendor · Earnings | apps/mobile/app/(vendor)/(earnings)/index.tsx |
| Vendor · Settings | apps/mobile/app/(vendor)/(settings)/index.tsx · ui/Avatar.tsx |
| Rider · Map | apps/mobile/app/(dispatcher)/(tabs)/(home)/index.tsx · (tabs)/_layout.tsx · ui/SwipeButton.tsx · lib/constants/map-style.ts |
| Rider · Tasks | apps/mobile/app/(dispatcher)/(tabs)/tasks.tsx · ui/SwipeButton.tsx |
| Rider · Earnings | apps/mobile/app/(dispatcher)/(tabs)/(earnings)/index.tsx |
| Rider · Profile | apps/mobile/app/(dispatcher)/(tabs)/profile.tsx · ui/Avatar.tsx |

Admin (`apps/admin`) is intentionally out of scope.
