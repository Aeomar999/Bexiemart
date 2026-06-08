# Platform Notes — Vibe Coding Platforms

Platform-specific constraints, best practices, and gotchas for animation prompting.
Reference this file when tailoring a prompt for a specific platform.

---

## Lovable

**Strengths:** React + Tailwind, excellent at Framer Motion, good at GSAP via CDN.

**Animation approach:** Prefer Framer Motion (motion.div, AnimatePresence, useScroll, useTransform). It's natively supported and the most reliable output.

**Best for:** Spring micro-interactions, page transitions, scroll reveals, card animations.

**Three.js:** Possible via @react-three/fiber — include it in the prompt explicitly: "Use @react-three/fiber and @react-three/drei for the Three.js scene."

**Gotchas:**
- Lovable sometimes ignores GSAP unless you explicitly say "install GSAP via npm and import gsap and ScrollTrigger"
- For particle systems, specify "use a Canvas 2D element with useRef and useEffect, not a third-party library" — Lovable handles this more reliably than Three.js Points for simple particles
- Always specify "add will-change: transform to animated elements for GPU compositing"

**Prompt tip:** Start with "In a React component using Framer Motion, build..." for most animations. Add "Use GSAP with ScrollTrigger for scroll-driven animations" only when Framer Motion's useScroll isn't expressive enough.

---

## v0 (Vercel)

**Strengths:** Next.js, shadcn/ui, excellent at CSS animations and Framer Motion.

**Animation approach:** Framer Motion is the most reliable. CSS @keyframes for simple loops. Avoid GSAP unless the user specifically requests it.

**Best for:** Component-level animations, micro-interactions, skeleton loaders, hover effects.

**Three.js:** Use @react-three/fiber. Specify "create a Canvas component with OrbitControls disabled, add to the hero section as a fixed-size block."

**Gotchas:**
- v0 sometimes over-generates UI components and under-delivers on animation timing specifics — be very explicit about duration values in milliseconds
- CSS custom properties work well: specify animation variables as CSS custom properties for easy tuning
- ScrollTrigger requires a client component ("use client") — always specify this in Next.js animation prompts

**Prompt tip:** "Build a Next.js client component ('use client') that uses Framer Motion to..." is the most reliable opening for v0 animation prompts.

---

## Bolt (StackBlitz)

**Strengths:** Full Node.js environment, npm install works, any library is fair game.

**Animation approach:** Most flexible platform. GSAP, Three.js, Framer Motion, Lottie — all work natively.

**Best for:** Complex animations that need GSAP's full power (ScrollTrigger, SplitText, Flip), Three.js scenes, Lottie integration.

**Three.js:** Works perfectly. Specify the exact version: "Use Three.js r155 via npm."

**Gotchas:**
- Bolt is the most capable but also most likely to generate overly complex boilerplate — keep the prompt tightly scoped to the animation, not the whole app
- For GSAP ScrollTrigger: always add "register ScrollTrigger with gsap.registerPlugin(ScrollTrigger) at the top of the file"
- Lottie: "Use lottie-web via npm. Load the animation JSON from [URL or inline data]."

**Prompt tip:** In Bolt, you can be more technically specific than on other platforms. Include exact GSAP timeline syntax in your prompt and it will usually replicate it faithfully.

---

## Framer

**Strengths:** Native animation tool — the richest animation output of any vibe platform.

**Animation approach:** Framer's built-in animation system + Code Components for custom logic.

**Best for:** Scroll animations, complex page transitions, interactive prototypes, cursor effects, magnetic elements.

**Three.js:** Use a Code Component: "Create a Framer Code Component that renders a Three.js canvas. Import Three.js from the Framer CDN or as a package override."

**Gotchas:**
- Framer handles most simple animations through its visual interface — prompts are most useful for Code Components (custom logic, Three.js, GSAP, Canvas)
- Framer's built-in scroll effects (Parallax, Fade, Blur on scroll) are easier to describe in plain design-language terms rather than technical specs
- For GSAP: "Create a Framer Code Component that imports GSAP and uses a useEffect to run a GSAP timeline on the component ref."

**Prompt tip:** For Framer, describe the animation in motion design terms first ("the card should feel like it's being pulled magnetically toward the cursor") then add the technical implementation after.

---

## Cursor (AI Code Editor)

**Strengths:** Full codebase context, any library, excellent at incremental additions to existing code.

**Animation approach:** All libraries work. The key advantage is that Cursor understands the existing codebase, so prompts can reference existing component names.

**Best for:** Adding animations to an existing React/Next.js/Vue app without breaking existing code.

**Three.js:** Full support. Reference the existing component structure in your prompt.

**Gotchas:**
- Always reference the existing tech stack in the prompt: "This is a Next.js 14 app using Tailwind and Framer Motion. Add..."
- Cursor sometimes adds animations inline rather than creating a reusable hook — specify "create a reusable useAnimation hook" if you want it extracted
- For GSAP ScrollTrigger in Next.js: "Wrap the ScrollTrigger initialisation in a useLayoutEffect, not useEffect, to avoid hydration issues"

**Prompt tip:** "In the existing [ComponentName] component, add a Framer Motion animation that..." is the most context-aware approach for Cursor.

---

## Claude Artifacts (claude.ai)

**Strengths:** HTML/CSS/JS in a single file, React components, CDN libraries via cdnjs.cloudflare.com.

**Animation approach:** CSS @keyframes for simple loops, GSAP via CDN for complex timelines, Three.js via CDN for 3D.

**CDN sources (CSP-enforced — only these work):**
- `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js`
- `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js`
- `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- `https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js`

**Gotchas:**
- Three.js r128 (the CDN version) does NOT have OrbitControls as a separate import — implement manually or skip
- No ES modules via CDN — use UMD globals (GSAP exposes `gsap` globally, Three.js exposes `THREE` globally)
- No `position: fixed` in artifacts — it collapses the iframe. Use absolute positioning within a min-height container instead
- localStorage/sessionStorage are not supported
- No `import` statements — use script tags with CDN src

**Prompt tip:** "Build this as a single HTML file. Load GSAP from cdnjs.cloudflare.com. Use vanilla JS and GSAP (the global `gsap` object) to..." is the most reliable framing.

---

## Animation Library Quick-Pick

Use this to decide which library to recommend in a prompt:

| Need | Best Library | Platform |
|------|-------------|----------|
| Spring micro-interactions in React | Framer Motion | All React platforms |
| Complex timelines, staggered sequences | GSAP | Bolt, Cursor, Artifacts |
| Scroll-driven animations | GSAP ScrollTrigger | Bolt, Cursor |
| 3D scenes, WebGL | Three.js / @react-three/fiber | All |
| Pre-built motion graphics | Lottie | All |
| Simple loops, hover effects | CSS @keyframes | All |
| Page transitions in Next.js | Framer Motion AnimatePresence | v0, Cursor, Lovable |
| Cursor-reactive effects | Custom JS (mouse events + lerp) | All |
| Physics simulations | Matter.js or custom | Bolt, Cursor |

---

## Global Animation Performance Rules

Include these in every prompt where performance matters:

```text
Performance requirements:
- Add will-change: transform to all elements that will animate transform properties
- Use translateZ(0) or translate3d(0,0,0) to promote animated elements to their own GPU layer
- Never animate width, height, top, left, or margin — always use transform equivalents
- Pause all animations when document.hidden is true (visibilitychange event)
- Respect prefers-reduced-motion: @media (prefers-reduced-motion: reduce) — either
  show the final state immediately, or replace motion with a simple opacity fade
- On mobile: reduce particle counts by 50%, disable cursor-reactive effects,
  limit Three.js scenes to simple geometry with basic materials
```
