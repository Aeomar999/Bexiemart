# Animation Prompt Templates

Ready-to-customise templates for the 12 most common animation requests.
Replace all `[BRACKETED]` placeholders before pasting into a vibe platform.

---

## Table of Contents

1. Splash Screen / Logo Reveal
2. Page / Screen Transition
3. Scroll Text Reveal
4. 3D Floating Hero Object
5. Particle Field / Particle Burst
6. Spring Button Press (Micro-interaction)
7. Achievement / Badge Unlock
8. Score / Counter Count-Up
9. Ambient Background (Floating Particles)
10. Card Stack Scroll
11. Parallax Depth Layers
12. Loading Skeleton → Content Reveal

---

## 1. Splash Screen / Logo Reveal

```
Build a [PHYSICS DROP / PARTICLE BURST / CINEMATIC REVEAL / GLITCH]
splash screen animation for [APP NAME].

Background: [BACKGROUND COLOUR / GRADIENT]. The screen starts completely
[dark/white/brand-colour].

Animation sequence:
1. [0ms - 200ms]: [Starting state - e.g. "4 floating particles drift in
   from the corners, each trailing a soft glow in [ACCENT COLOUR]"]
2. [200ms - 800ms]: [Build - e.g. "The particles converge toward the
   centre with ease-out-expo timing, accelerating as they approach"]
3. [800ms - 1200ms]: [Climax - e.g. "On convergence, they collide and
   burst into 20 smaller fragments that immediately snap back to form
   the [APP NAME] wordmark"]
4. [1200ms - 1600ms]: [Settle - e.g. "The wordmark scales from 1.08 → 1.0
   with a spring ease (cubic-bezier(0.34, 1.56, 0.64, 1))"]
5. [1600ms - 2200ms]: [Tagline fades up from y+10px, opacity 0→1, 300ms
   ease-out]
6. [2200ms - 2500ms]: [Loading bar fills left-to-right with a shimmer
   sweep, then the entire screen fades out / slides up to reveal the
   home screen]

Typography: App name in [DISPLAY FONT] [SIZE]px [COLOUR].
Tagline in [BODY FONT] [SIZE]px [COLOUR].

Use GSAP for sequencing. Respect prefers-reduced-motion: if set, skip to
final state after 100ms fade-in.

Emotional intent: Should feel like [ANALOGY - e.g. "a game booting up for
the first time - anticipation, then a satisfying reveal"].
```

---

## 2. Page / Screen Transition

```
Implement [SHARED ELEMENT / SPATIAL SLIDE / CLIP-PATH EXPAND / CURTAIN WIPE]
transitions between all screens in [APP NAME].

Transition out (current screen leaving):
- Duration: [200-350]ms
- Motion: [e.g. "Scale from 1.0 → 0.95, opacity 1→0, blur 0→4px"]
- Easing: power2.in (GSAP) / cubic-bezier(0.55, 0, 1, 0.45)

Transition in (new screen entering):
- Delay after exit starts: [50-100]ms (slight overlap creates fluidity)
- Motion: [e.g. "Slide in from the right (translateX 100%→0), opacity 0→1"]
- Duration: [250-400]ms
- Easing: expo.out (GSAP) / cubic-bezier(0.16, 1, 0.3, 1)

[FOR SHARED ELEMENT TRANSITION ONLY:]
When a [CARD / GAME CHIP / AVATAR] is tapped:
- That element expands to fill the screen (width/height animate to 100vw/100vh)
- Border-radius animates from [CARD RADIUS]px → 0
- The content of the destination screen fades in over the expanded element
- On back navigation, reverse: screen shrinks back into the card position with spring ease

Direction rules:
- Navigating deeper (home → detail) = slide from right
- Navigating back = slide from left
- Modal / overlay = slide up from bottom, dismiss = slide back down

Use Framer Motion's AnimatePresence + layoutId for shared element,
or GSAP page transition hooks for web.

Emotional intent: Should feel [e.g. "spatial - like moving through physical
space, not swapping flat screens"].
```

---

## 3. Scroll Text Reveal

```
Animate the text content on [SCREEN / PAGE SECTION] to reveal as it
scrolls into the viewport. Use GSAP ScrollTrigger.

For every heading (h1, h2):
- Split text into individual words (use GSAP SplitText plugin or
  manually wrap each word in a span)
- Start state: translateY(24px), opacity 0
- Animate to: translateY(0), opacity 1
- Duration: 600ms per word
- Stagger: 60ms between each word
- Easing: expo.out
- Trigger: when the element is 80% scrolled into view

For body paragraph text:
- Animate the entire paragraph as one block
- Start: translateY(16px), opacity 0
- End: translateY(0), opacity 1
- Duration: 500ms, easing: power2.out
- Trigger: 85% in view

For stat numbers / counters:
- When scrolled into view, animate the number from 0 to [FINAL VALUE]
- Duration: 1200ms, easing: power2.out
- Add a comma formatter if the number is above 1000
- On completion, hold for 200ms then add a subtle scale pulse:
  scale 1→1.05→1 over 300ms with spring ease

ScrollTrigger markers: off in production.
Respect prefers-reduced-motion: if set, show final state immediately
with no animation.

Emotional intent: Should feel [e.g. "like the content is being revealed
as the user earns it - each section unlocking as they scroll"].
```

---

## 4. 3D Floating Hero Object

```
Create a Three.js scene in the hero section of [PAGE]. The scene should
render a [3D LOGO / GEOMETRIC SHAPE / GAME PIECE / ABSTRACT OBJECT] that
floats and reacts to cursor movement.

Scene setup:
- Canvas: full hero section width, [HEIGHT]px tall, transparent background
  so the page background shows through
- Camera: PerspectiveCamera, FOV 45, positioned at z: 5
- Lighting:
  - AmbientLight at intensity 0.4, colour [COLOUR]
  - DirectionalLight at intensity 1.2, position [1, 2, 3], colour [COLOUR]
  - PointLight at intensity 0.8, position [-2, 1, 2], colour [ACCENT COLOUR]
    - this creates the signature rim light

The 3D object:
- [DESCRIBE GEOMETRY: e.g. "An icosahedron (IcosahedronGeometry, radius 1.2,
  detail 1) with a MeshPhysicalMaterial: colour #[HEX], roughness 0.1,
  metalness 0.8, reflectivity 1.0, envMapIntensity 1.5"]
- Base rotation: object slowly rotates on Y axis at 0.003 radians per frame
- Z-axis float: object oscillates on Y position using Math.sin(Date.now() * 0.001) * 0.15

Cursor reactivity:
- Track mouse/pointer position normalised to [-1, 1] for both axes
- Rotate the object toward the cursor:
  targetRotationX = pointer.y * 0.3, targetRotationY = pointer.x * 0.5
- Use lerp (0.05 interpolation factor) so it follows the cursor with
  smooth, slightly lagging motion - not instant

Entry animation (on page load):
- Object starts at scale 0, opacity 0 (use material opacity)
- Animates to scale 1 over 1200ms with spring ease
- Simultaneously rises from y: -1 → y: 0

Performance:
- Limit to 60fps using a clock delta check
- Pause rendering when tab is not visible (document.hidden)
- On mobile / low-power devices detected by GPU tier, fall back to a
  CSS-animated PNG/SVG version of the same object

Use Three.js r155+. Load via CDN if in a vibe platform artifact.

Emotional intent: Should feel [e.g. "like a hologram you can almost reach
out and touch - premium, tactile, alive"].
```

---

## 5. Particle Field / Particle Burst

```
[CHOOSE ONE:]

[A - AMBIENT PARTICLE FIELD (background atmosphere):]
Create a Three.js particle field as the full-page background of [SCREEN].

- Particle count: [800-2000] (use 800 on mobile, 2000 on desktop - detect
  via window.innerWidth)
- Each particle: a tiny square sprite (2x2px) in colour [COLOUR] at
  opacity [0.3-0.6] (randomise per particle)
- Distribution: randomly distributed across the full canvas volume
  (x: -15 to 15, y: -10 to 10, z: -5 to 5)
- Movement: each particle drifts upward at a speed randomised between
  0.003-0.012 per frame. When a particle exits the top, reset it to the bottom.
- Cursor parallax: the entire particle field moves at 10% of cursor
  displacement (slow, subtle)
- Use Points geometry with BufferGeometry for performance (never
  individual Mesh objects)
- Respect prefers-reduced-motion: if set, render particles as static dots

[B - ACHIEVEMENT PARTICLE BURST (on event):]
When [EVENT - e.g. "a player wins a game", "an achievement is unlocked"]:

- Burst 60-80 particles from [ELEMENT POSITION - e.g. "the centre of the
  achievement badge"]
- Particle shapes: mix of star shapes and circles (use a small sprite
  texture, or CSS clip-path stars in a DOM-based version)
- Colours: [COLOUR 1], [COLOUR 2], [COLOUR 3] - randomise per particle
- Physics: each particle gets a randomised initial velocity (vx: +-8,
  vy: -12 to -4), gravity: +0.4 per frame, drag: 0.96 per frame
- Particle lifespan: 800-1200ms (randomise), fade from opacity 1→0
  during the last 40% of lifespan
- Scale: start at 1.0, shrink to 0.2 over lifespan

Use CSS custom element + requestAnimationFrame for DOM-based burst
(preferred in vibe platforms). Or GSAP with custom physics plugin.

Emotional intent: Should feel [e.g. "like confetti exploding from a
party popper - unambiguously celebratory, physically satisfying"].
```

---

## 6. Spring Button Press (Micro-interaction)

```
Apply a spring press micro-interaction to ALL tappable buttons and
interactive cards in [APP NAME]. This is the foundational feel of the
entire product - every tap must feel physically satisfying.

On pointer down / touch start:
- Scale: 1.0 → 0.94 (duration: 100ms, easing: power2.out)
- If the button has a hard drop shadow: reduce shadow offset from
  [ORIGINAL - e.g. "0 6px 0 #A0440A"] to "0 2px 0 #A0440A" simultaneously
  (creates the illusion of the button being physically pressed down)
- Brightness: filter brightness(0.9) - slightly darkens on press

On pointer up / touch end (release):
- Scale: 0.94 → 1.03 → 1.0 (overshoot then settle - total 350ms)
- Shadow: "0 2px 0" → "0 7px 0" → "0 6px 0" (matching the overshoot)
- Brightness: back to filter brightness(1.0)
- Easing for the release: cubic-bezier(0.34, 1.56, 0.64, 1) (spring)

On hover (desktop only):
- Scale: 1.0 → 1.02 (150ms, ease-out)
- Shadow increases slightly: offset-y + 2px

On disabled state:
- No animation. Scale stays at 1.0. Pointer-events: none.
- Opacity: 0.45

Implementation: Use Framer Motion's whileTap / whileHover in React,
or GSAP event listeners for vanilla JS.
For CSS-only: use :active selector with transition - but note CSS :active
doesn't support spring easing, so prefer JS for the release animation.

Apply to: primary CTA buttons, game chips, player avatar rows, card
components, navigation tabs.
Do NOT apply to: text links, disabled buttons, input fields.

Emotional intent: Should feel [e.g. "like pressing a physical arcade
button - immediate, responsive, deeply satisfying"].
```

---

## 7. Achievement / Badge Unlock

```
Create an achievement unlock animation that plays when [EVENT - e.g.
"a user wins a game session", "reaches a milestone", "levels up"].

Sequence:

Phase 1 - Anticipation [0ms-300ms]:
- The badge element starts hidden (scale: 0, opacity: 0)
- A soft glow pulse appears where the badge will be
  (box-shadow grows from 0 → "0 0 0 20px rgba([COLOUR], 0.4)")

Phase 2 - Reveal [300ms-700ms]:
- Badge scales from 0 → 1.15 with expo.out easing (400ms)
- A circular ripple expands outward from the badge centre
  (border: 2px solid [COLOUR], scale 0.8→2.0, opacity 1→0, 400ms)

Phase 3 - Settle [700ms-900ms]:
- Badge scale: 1.15 → 0.95 → 1.0 (spring settle, 200ms)
- Badge glow pulses once more (box-shadow: medium → large → medium)

Phase 4 - Particle Celebration [600ms-1400ms]:
- 40-60 particles burst from the badge centre (see Particle Burst template)
- Particles in [COLOUR 1] and [COLOUR 2]
- Simultaneously: confetti pieces fall from top of the screen
  (12 pieces, randomised start positions along the top, fall at
  randomised speeds 300-600ms, small rotation on the way down)

Phase 5 - Label Reveal [900ms-1100ms]:
- Achievement label text fades in below the badge (translateY 8px→0,
  opacity 0→1, 200ms ease-out)
- Text: "[ACHIEVEMENT NAME]" in [DISPLAY FONT]

Dismiss: The entire assembly fades out after [2500ms] with
translateY(0→-12px) + opacity(1→0), 300ms ease-in.
Or: tap anywhere to dismiss immediately.

Emotional intent: Should feel [e.g. "like levelling up in a great RPG -
there's real weight and ceremony to it, the player feels genuinely
rewarded"].
```

---

## 8. Score / Counter Count-Up

```
When [ELEMENT - e.g. "a score card", "a stat block", "a leaderboard row"]
scrolls into view or is triggered by [EVENT], animate all numerical values
from 0 (or their previous value) to their final value.

For each number:
- Starting value: 0 (or previous value if updating)
- Ending value: [FINAL VALUE - read from data]
- Duration: 1000-1500ms (scale with the magnitude of the number:
  <100 = 800ms, 100-999 = 1200ms, 1000+ = 1500ms)
- Easing: power2.out (starts fast, decelerates to the final value -
  feels like a slot machine landing)
- Decimal handling: if the value has decimals, animate with 1 decimal
  place visible during the count, snap to final format on completion
- Comma formatting: for values >= 1000, apply comma separator
  (Intl.NumberFormat) on every frame update

On completion:
- Hold the final value for 150ms
- Then apply a quick scale pulse: 1.0 → 1.08 → 1.0 over 300ms
  with spring ease - the number "pops" as it lands
- Simultaneously: a brief colour flash (text colour shifts to
  [ACCENT COLOUR] then back to normal, 300ms transition)

For a rank-change scenario (leaderboard position improving):
- The row slides [up/down] to its new position (GSAP flip animation or
  Framer Motion layout animation)
- A [green ▲ / red ▼] delta indicator fades in beside the name
  (translateX -8px → 0, opacity 0→1, 200ms ease-out)
- The delta indicator fades out after 3000ms

Use GSAP's `gsap.to(counter, { innerText: finalValue, snap: { innerText: 1 } })`
pattern, or a custom requestAnimationFrame loop with lerp.

Emotional intent: Should feel [e.g. "like a casino slot landing on
the jackpot - building anticipation, then a satisfying click as it
hits the final number"].
```

---

## 9. Ambient Background (Floating Particles)

```
Create a subtle ambient particle animation as the background layer of
[SCREEN / ALL SCREENS] in [APP NAME]. This animation must never compete
for attention with the foreground content.

Technical approach: Canvas 2D API (lighter than Three.js for simple dots).
Canvas: position fixed, full viewport, z-index -1, pointer-events: none.

Particles:
- Count: 35-50 (never more - this is ambient, not dramatic)
- Each particle is a circle (radius: randomised 1-4px)
- Colour: [COLOUR] at opacity randomised 0.15-0.4 (soft, not vivid)
- Starting position: randomised across full canvas

Movement per frame:
- Each particle has: vx (+-0.3 max), vy (-0.1 to -0.4, always drifting
  slightly upward), and a rotation used to generate a sinusoidal drift
  (x position += Math.sin(time + particle.offset) * 0.3)
- Particles that exit the canvas (top/sides) wrap to the opposite edge

Interactivity (optional - include if app is desktop-primary):
- On cursor move: particles within 80px of cursor get repelled
  (velocity updated away from cursor, magnitude 0.5-1.5, decays in
  30 frames back to normal drift)

Performance rules:
- Pause canvas loop when document is hidden (visibilitychange event)
- On mobile: reduce count to 20, disable cursor interactivity
- On prefers-reduced-motion: set particle velocity to 0 (static dots only)

Emotional intent: Should feel [e.g. "like warm dust motes in a beam
of light - you barely notice them, but the room feels dead without them.
They make the screen feel alive without asking for attention"].
```

---

## 10. Card Stack Scroll

```
Create a scroll-driven card stack animation for the [SECTION NAME] section
of [APP / PAGE]. As the user scrolls, [GAME CARDS / PRODUCT CARDS /
PORTFOLIO ITEMS] should [fan out / stack / flip] with satisfying physical
motion.

Setup: Pin the section container while scroll progresses through the
card sequence. Use GSAP ScrollTrigger with pin: true.

Card layout (starting state):
- All cards are stacked at the same position (top: 0), each slightly
  offset: card N has translateY(N * 6px), scale(1 - N * 0.04),
  and a slight rotateZ (randomised +-2deg per card)
- Only the top card is fully visible; cards below peek out beneath it

As user scrolls through each card's segment:
- Current top card: translateX(-120%) + rotateZ(-15deg) + opacity 0→0
  over 80% of the card's scroll segment (slides out to the left like
  a card being swiped)
- Next card rises to the top position with a spring ease:
  scale from 0.92→1.0, translateY from +30px→0, 300ms
- Remaining cards shift up one level (Z-offset decreases)

Between cards:
- [OPTIONAL] A brief haptic-style scale pulse on the new top card
  (scale 1.0→1.02→1.0, 200ms spring) to mark the transition

Final card in stack:
- Stays in place; the pin releases and normal scroll resumes

Each card's content (don't animate these - keep them static,
let the card movement do the work):
- [CARD CONTENT DESCRIPTION]

Use GSAP ScrollTrigger. For React: use Framer Motion + useScroll +
useTransform to map scroll progress to each transform property.

Emotional intent: Should feel [e.g. "like physically flipping through
a hand of cards - tactile, deliberate, satisfying. Each card reveal
is a small event"].
```

---

## 11. Parallax Depth Layers

```
Build a multi-layer parallax effect for the [HERO / LANDING] section
of [APP NAME]. The effect creates a sense of depth as the user scrolls
or moves their cursor.

Layer structure (back to front, each defined as a CSS layer or absolutely
positioned element):

Layer 1 - Background (moves slowest, 0.1x scroll speed):
- [Description: e.g. "A large, slightly blurred geometric pattern or
  gradient mesh in the brand colour"]
- Parallax factor: 0.1 (moves 10px down for every 100px scrolled)

Layer 2 - Mid-ground decorative (0.3x scroll speed):
- [Description: e.g. "Floating card suit symbols (♠ ♥ ♦ ♣) at 15% opacity,
  scattered across the mid section"]
- Parallax factor: 0.3

Layer 3 - Hero content (0.5x scroll speed - moves at half scroll speed,
creating the illusion of depth):
- [Description: e.g. "The main headline and CTA button"]
- Parallax factor: 0.5

Layer 4 - Foreground decoration (0.7x scroll speed):
- [Description: e.g. "A large 3D game token or emoji in the bottom corner,
  partially cropped"]
- Parallax factor: 0.7

Implementation:
- Track scroll position via window.scrollY or GSAP ScrollTrigger
- On each scroll frame: translate each layer by -(scrollY * parallaxFactor)
- Use will-change: transform and translateZ(0) on each layer for GPU
  compositing
- Cap translation so layers don't scroll off the viewport

Cursor parallax (desktop only):
- Track normalised pointer position (-1 to 1)
- Apply a secondary translation: layer N moves by pointer * (N * 5px)
  (foreground elements track the cursor slightly)
- Use lerp (factor 0.05) for smooth, lagging follow

Mobile: disable cursor parallax, reduce to scroll-only with
0.5x reduced factors to avoid motion sickness.

Emotional intent: Should feel [e.g. "like looking into a diorama -
the scene has real physical depth, and moving around it reveals
the world beyond the screen"].
```

---

## 12. Loading Skeleton → Content Reveal

```
Implement skeleton loading screens for [SCREEN / COMPONENT] that
transition gracefully into real content when data loads.

Skeleton state:
- Each content block (image, heading, body text, button) is replaced
  by a rounded rectangle of the same dimensions
- Skeleton colour: [COLOUR - e.g. "rgba(245,166,35,0.08)"] - warm-tinted,
  not the default grey
- A shimmer sweep animation moves left-to-right across all skeletons:
  - Implement as a pseudo-element with a linear gradient
    (transparent → rgba([SHIMMER COLOUR], 0.18) → transparent)
  - Animation: translateX(-100%) → translateX(100%), 1.4s linear,
    infinite, staggered 0.2s between rows so they don't all shimmer
    in unison

Content reveal (when data arrives):
Phase 1 [0ms-100ms]:
- Skeleton elements fade from opacity 1→0 (all at once, 100ms)

Phase 2 [100ms-400ms]:
- Real content elements fade in and rise from y+12px → y+0,
  opacity 0→1, staggered by 80ms per element (top to bottom)
- Easing: expo.out

Phase 3 [images only]:
- Images additionally scale from 0.96→1.0 as they fade in
  (adds a sense of the image "settling" into place)

Error state (if data fails to load):
- Skeletons stop shimmer animation
- An error icon fades in at the centre of the skeleton area
  (scale 0→1, 200ms spring)
- A "Retry" button appears below (translateY 8px→0, 300ms ease-out)

Respect prefers-reduced-motion: if set, skip skeleton entirely -
show a simple spinner, then cross-fade to content.

Emotional intent: Should feel [e.g. "like watching a Polaroid photo
develop - you know something good is coming, and the reveal feels
earned rather than jarring"].
```
