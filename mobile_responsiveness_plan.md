# Mobile App Responsiveness Plan

This plan outlines the strategy to drastically improve the responsiveness of the BexieMart mobile application (`apps/mobile`), ensuring it looks and feels native on larger screens like tablets and the web, rather than simply stretching a mobile UI.

## 1. Navigation: Sidebar vs. Bottom Tabs

Currently, the app relies on a bottom `CustomTabBar` (e.g., in `(customer)/(tabs)/_layout.tsx`). On tablet and web displays, bottom tabs are unergonomic and visually look stretched.

**Implementation Strategy:**
- We will leverage React Native's `useWindowDimensions()` hook to determine the screen width (breakpoint at `768px` for `md` / tablet).
- **Small Screens:** Continue using the existing `CustomTabBar`.
- **Large Screens (md+):** Wrap the `<Tabs />` component in a container that renders a custom `Sidebar` on the left. The `tabBar` prop in `<Tabs />` will return a `<View style={{ display: 'none' }} />` to hide the bottom tabs.

*Example:*
```tsx
const { width } = useWindowDimensions();
const isLargeScreen = width >= 768;

return (
  <View style={{ flex: 1, flexDirection: isLargeScreen ? "row" : "column" }}>
    {isLargeScreen && <Sidebar navigationState={state} />}
    <View style={{ flex: 1 }}>
      <Tabs tabBar={(props) => (isLargeScreen ? null : <CustomTabBar {...props} />)}>
        {/* Screens... */}
      </Tabs>
    </View>
  </View>
);
```

## 2. Grid and List Layouts

On larger screens, lists that take up the full width (like product lists or category rows) look disjointed due to excessive negative space.

**Implementation Strategy:**
- **FlashList & FlatList:** We will dynamically adjust the `numColumns` prop based on screen size.
  - Mobile (`< 768px`): `numColumns={1}` or `2` (depending on the list type).
  - Tablet (`>= 768px`): `numColumns={3}`.
  - Web/Desktop (`>= 1024px`): `numColumns={4}` or `5`.
- **Flex Wrap:** For non-virtualized lists (e.g., tags or smaller categories), we will use NativeWind classes like `flex-row flex-wrap gap-4` to allow items to naturally wrap.
- **Max Width:** For single-column lists (like settings), apply a `max-w-3xl mx-auto` container to prevent the list from stretching to the edges.

## 3. Forms and Inputs

Forms (Login, Registration, Checkout, Profile Editing) stretch completely across the screen on web/tablets, making reading and interaction very difficult.

**Implementation Strategy:**
- Wrap form containers in a central layout with constrained width.
- Use NativeWind's responsive classes: `className="w-full max-w-md mx-auto"`.
- This ensures that on mobile, inputs take up `100%` width (minus padding), but on tablet/web, they max out at `448px` (the `md` size) and stay centered.

## 4. Modals and Dialogs

A full-screen modal or a bottom sheet makes sense on mobile but is inappropriate for a desktop/tablet interface.

**Implementation Strategy:**
- Create a responsive `<ResponsiveModal />` component.
- **Mobile:** Renders as a standard bottom sheet (if using `@gorhom/bottom-sheet` or similar) or full-screen modal.
- **Large Screens:** Renders as a centered dialog box with a backdrop (`max-w-lg rounded-2xl`). This can be achieved by utilizing a generic `<Modal transparent />` with a dimmed background wrapper, centering the inner view, and applying `max-w-lg`.

## 5. Typography and Spacing

Spacing that feels generous on a phone feels cramped on a 27" monitor.

**Implementation Strategy:**
- **Typography:** Utilize NativeWind's responsive prefixing to bump font sizes on larger displays, e.g., `text-heading-sm md:text-heading-md lg:text-display-sm`.
- **Padding/Margins:** Increase container padding on larger screens. Instead of a hardcoded `paddingHorizontal: 20`, we will use NativeWind classes: `px-5 md:px-8 lg:px-12`.
- **Hero/Header Sections:** Allow hero sections to adopt a two-column layout on large screens (`flex-col md:flex-row`).

---

## Action Plan

1. **Refactor Navigation:** Modify `(customer)/(tabs)/_layout.tsx` (and vendor/dispatcher if applicable) to conditionally render a `Sidebar` or the `CustomTabBar`.
2. **Container Constraints:** Add `max-w-md mx-auto` to all primary `(auth)` screens and form views in `profile.tsx`.
3. **Adaptive Lists:** Update `(shop)` and `(home)` feeds to use dynamic `numColumns`.
4. **Responsive Modal:** Implement a reusable modal wrapper and replace at least one primary flow to demonstrate the pattern.
5. **Global Padding & Typography:** Audit major views to swap static styles for NativeWind responsive utility classes.
