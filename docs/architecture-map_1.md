---
name: architecture-map
description: Build a single self-contained, interactive HTML architecture map of this codebase. Clusters of nodes (entry / routes / services / data / external) with critical-path highlighting, plain-English explanations, click-to-detail sidebar, feature filters, pan + zoom, blast-radius selection, fuzzy search, minimap, complexity heatmap, circular dependency detection, git churn overlay, test coverage overlay, security surface tagging, architectural smell registry, and optional fixes/bugs overlays. Outputs one HTML file you can open directly in a browser.
---

# Architecture Map

You will produce **one self-contained HTML file** (default: `./architecture-map.html`) that renders this codebase as an interactive graph. No build step, no framework, no external assets — open the file directly, or serve with `python3 -m http.server 4747`.

The goal is not a pretty diagram. The goal is a map a non-engineer could open and understand the system from, AND that a future maintainer could spot dead code / hot paths / weak seams / circular dependencies / security surface from at a glance.

---

## What you're building

A dark-themed HTML page with:

1. **Left-to-right column clusters.** Typical six: Client · Server entry · Routes · Services · Data · External APIs. Adapt to the actual stack you find:
   - CLI app → Entry · Commands · Core · Storage · External
   - Frontend-only → Pages · Components · State · API clients · External
   - Library → Public API · Core · Helpers · Tests · External

   Don't force the six-column template if it doesn't fit. Pick clusters that match the codebase you read.

2. **Nodes**, one per significant file, function, or table. Each node carries: a real file path (with line numbers when relevant), a one-sentence technical role, a plain-English version, 2–4 bullet notes, feature tags, complexity tier, and optional security/smell badges.

3. **Edges** between nodes labeled with what flows (function call, HTTP, DB read/write, external API), color-coded by kind.

4. **Filter chips** at the top: "Overview" (default), one per major feature, one for the critical user-flow path, "Show all wires", "Complexity heat", "Security surface", "Git churn", "Coverage", and (optional) "Roadmap & bugs", "Smells".

5. **Right-hand sidebar** that updates on hover/click: shows role + plain English + path + notes + coupling score + incoming/outgoing edges + any per-node fixes/bugs/smells + security flags.

6. **Pan + zoom**, mouse-drag pan, wheel zoom anchored to cursor, Fit/+/- buttons.

7. **Minimap** — a small inset in the bottom-right corner showing the full graph extent and a viewport rectangle. Drag the viewport rectangle to navigate.

8. **Cmd+K fuzzy search** bar — opens an overlay listing all nodes; typing filters by label, path, or role. Enter or click jumps to and selects the node.

9. **Blast-radius mode** — after selecting a node, press `B` (or click "Blast radius" in the sidebar) to perform a transitive forward + backward traversal and highlight every node that would be impacted if this node changed or was deleted. Dims everything outside the blast.

10. **Collapse/expand clusters** — click a cluster header label to fold all its nodes into a single summary pill showing node count + outgoing/incoming edge totals. Edges reroute to the pill. Click again to expand.

11. **Optional badges** on each node:
    - Green circle = fix count
    - Red circle = bug count
    - Yellow triangle = smell count
    - Orange lock = security surface node
    - Purple spiral = part of a circular dependency cycle

---

## Method (do these in order, do not skip)

### 1. Map the stack first
Read README, every package manifest (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.), and the entry point. Identify clusters from what you actually see. Only after that, decide your column layout.

Also check for:
- `.git/` — if present, run `git log --format="%H %ae" --name-only --since="90 days ago"` to get file churn counts. Store as `churn: N` on each node.
- A coverage report (`coverage/lcov.info`, `coverage-summary.json`, `.nyc_output/`, `htmlcov/`, etc.) — if found, parse per-file coverage % and store as `coverage: 0–100` on each node.

### 2. Identify the seam
Find the single most important code path. For an LLM app, it's the prompt-assembly function. For a web app, the request-handler chain for the headline feature. For a CLI, the main loop. Mark every node on this path `critical: true` and every edge on it `kind: 'critical'`. This is the spine — everything else is decoration around it.

### 3. For each node, open the file and read it
Do not guess. Do not summarize from filename alone. For each node capture:
- `path` — relative path; include `:line` when the most important callsite is at a known line
- `role` — one technical sentence
- `plain` — the same idea, written for someone who has never seen the codebase. No jargon, no unexpanded acronyms. Imagine explaining it to a smart friend who isn't an engineer.
- `notes` — 2–4 bullets of concrete facts: line numbers, model/library versions, surprising couplings
- `tag` — array of feature-filter chip ids this node belongs to (always include `'all'`)
- `loc` — approximate lines of code (read the file, count, round to nearest 10)
- `complexity` — `'low'` | `'med'` | `'high'` | `'critical'`. Use this heuristic:
  - `low`: < 80 LOC, ≤ 3 exported symbols, no deeply nested conditionals
  - `med`: 80–250 LOC, or 4–8 exported symbols, or one major branching path
  - `high`: 250–600 LOC, or ≥ 9 exported symbols, or multiple complex control flows
  - `critical`: > 600 LOC, or the file does too many unrelated things, or is a known bottleneck
- `security` — `true` if the node handles: auth tokens/sessions, user-supplied input that reaches a DB or shell, secrets/env vars, outbound calls with credentials, file uploads, payment data. Any of these = mark it.
- `afferent` — count of other nodes that import/call this node (fan-in)
- `efferent` — count of other nodes this node imports/calls (fan-out)
- `instability` — computed as `efferent / (afferent + efferent)`, rounded to 2 decimal places. 0.0 = maximally stable (nothing it depends on can change it); 1.0 = maximally unstable (depends on everything, nothing depends on it). Store on the node and display in the sidebar.
- `churn` — commit count touching this file in the last 90 days (from git log, 0 if no .git)
- `coverage` — integer 0–100 from the coverage report, or `null` if no report found

### 4. Find dead code AND orphans
**Dead exports:** For every top-level export of every service-layer file, grep for callers. Anything with zero live callers gets a node with `'DEAD — zero callers'` as its sub-label.

**Orphaned nodes:** Any node with `afferent === 0` AND `efferent === 0` (no edges at all, not just no callers) is a structural orphan. Mark sub-label `'ORPHAN — no connections'`.

**Orphaned clusters:** If an entire cluster has zero edges connecting it to any other cluster, flag it in the sidebar notable findings as a potentially vestigial layer.

Do not silently omit any of these. Surfacing isolation is half the value of the map.

### 5. Detect circular dependencies
After building the full edge list, run a depth-first cycle detection over all `normal`, `critical`, and `db` edges (skip `external` / `api` edges — cycles through third-party APIs are expected). For every cycle found:
- Add each participating node to a `CYCLES` registry: `{ 'node-id': [cycleId, ...] }`.
- Add a `cycle: cycleId` property to each edge in the cycle.
- Render cycle edges with a dashed animated stroke in `--critical` color.
- Place a purple spiral badge on each node in a cycle.
- List every cycle in the sidebar notable findings with the full node path of the cycle.

Cycles are architectural debt that make refactoring unsafe. Never omit them.

### 6. Detect architectural smells
After reading all files, populate the `SMELLS` registry (see script shape). Recognize and record these smell types:

| Smell ID | Name | Detection heuristic |
|---|---|---|
| `god-object` | God object | Node with `afferent + efferent > 12` OR `loc > 600` |
| `layer-skip` | Layer skip | Edge from `client` cluster directly to `db` cluster, bypassing `service` |
| `deep-chain` | Deep call chain | Any straight-line chain of 6+ critical edges with no branching |
| `sync-io` | Synchronous I/O | File uses `readFileSync`, `execSync`, or equivalent blocking call on a hot path |
| `fat-config` | Config bloat | A config/constants file with `loc > 300` that is imported by > 6 nodes |
| `duplicate-service` | Duplicate service | Two or more service nodes with near-identical exported function names |
| `implicit-any` | Implicit any (TS only) | TypeScript file with `// @ts-ignore` count > 3 or no type annotations on exported functions |
| `missing-error-boundary` | No error handling | An async function or route handler with no try/catch and no `.catch()` |

Each smell entry: `{ id: 'smell-id', type: 'god-object', t: 'short human description', ref: 'file:line' }`.

A "Smells" filter chip dims everything except nodes with smell badges.

### 7. Label every edge with what flows
Examples: `'POST /api/foo'`, `'1 · getContext'`, `'messages.stream → sonnet-4-6'`, `'DB write'`, `'cron · nightly'`. Pick an edge `kind`:
- `critical` (red) — on the main seam
- `api` (orange) — call to an external service
- `db` (amber) — DB read/write
- `mount` (sky blue) — entry → route mounts
- `cycle` (dashed red) — part of a circular dependency
- `normal` (grey) — everything else

### 8. Tag nodes and edges for filters
Every node and edge gets a `tag: [...]` array of feature-filter chip ids. Always include `'all'` so the "show all wires" view works. Pick chips from the actual feature surface (e.g. `auth`, `chat`, `billing`, `documents`, `comms`). Don't invent chips for things that don't exist.

### 9. Populate FIXES + KNOWN_BUGS registries
If the user has a roadmap or a known-bug list, populate two registries keyed by node id:

```js
const FIXES      = { 'node-id': [{n: 1, t: 'short fix description'}, ...] };
const KNOWN_BUGS = { 'node-id': [{sev: 'high'|'med'|'low', ref: 'optional-code', t: '...'}, ...] };
```

A single fix can appear under multiple node ids — that shows everywhere the fix touches. Render fix count + bug count as small circular badges in the top-right corner of each node. A "Roadmap & bugs" filter chip dims everything except nodes with badges.

### 10. Sidebar default view earns the map its keep
The default sidebar (no node selected) must contain a **"Notable findings"** section structured as follows. Do not leave any sub-section empty — if a category has no findings, write "None found" rather than omitting it.

```
## Notable findings

### Critical path
[ one paragraph describing the spine you identified and why ]

### Dead code
[ list every dead export found, with file:line ]

### Circular dependencies
[ list every cycle as: A → B → C → A ]

### Architectural smells
[ list every smell with file:line and one-sentence explanation ]

### Security surface
[ list every security-tagged node and what risk it carries ]

### Complexity hotspots
[ list nodes with complexity: 'critical' or 'high' and their LOC ]

### Git churn on the critical path  (omit section if no .git)
[ list critical-path nodes sorted by churn desc, flag any with churn > 20 ]

### Test coverage gaps  (omit section if no coverage report)
[ list critical-path nodes with coverage < 60%, sorted by coverage asc ]

### Orphans & vestigial code
[ list orphaned nodes and clusters ]
```

---

## Interactive features — implementation spec

### Cmd+K fuzzy search
Render a hidden `<div id="search-overlay">` with a text `<input>`. On `keydown` with `(e.metaKey || e.ctrlKey) && e.key === 'k'`, show the overlay and focus the input. Filter the node list in real time by checking if `label`, `path`, or `role` includes the lowercased search string. Render results as a scrollable list; click or Enter on a result: close overlay, pan+zoom the viewport so the node is centered, select the node (trigger sidebar update). Esc closes without selecting.

### Blast-radius mode
When a node is selected, a "Blast radius" button appears in the sidebar. On click (or press `B`):
1. Perform a bidirectional BFS/DFS over all edges from the selected node.
2. Collect: all nodes reachable *from* this node (forward), all nodes that can *reach* this node (backward).
3. Dim all nodes NOT in that set to 15% opacity. Highlight forward-reachable nodes in `--accent` tint, backward-reachable (dependents) in `--external` tint.
4. Show in sidebar: "X nodes would break if this changed. Y nodes feed into it."
5. Press `Esc` or click background to exit blast mode.

### Minimap
Render a `<canvas id="minimap">` element positioned `bottom: 16px; right: 16px` at fixed size 200×130px. On every pan/zoom or layout change, re-draw the minimap by scaling the full SVG coordinate space down to fit the canvas. Draw cluster backgrounds as faint rectangles, nodes as 2px dots colored by their cluster color, and critical-path edges as thin red lines. Draw a white outlined rectangle representing the current viewport. The minimap is interactive: mouse-down + drag on the minimap pans the main viewport proportionally.

### Collapse/expand clusters
Each cluster box has a clickable header label. On click, toggle `collapsed: true/false` on that cluster. When collapsed:
- Hide all nodes belonging to that cluster.
- Render a single pill node at the cluster's center with label `"[ClusterName] (N nodes)"`.
- Re-route all edges that previously connected to nodes in this cluster to instead connect to the pill.
- Edges that connect two nodes both inside the same collapsed cluster are hidden.
On expand, restore original nodes and edges.

### Path explainer
Shift+click a second node while one is already selected. The sidebar switches to "Path" mode:
- Run Dijkstra's (or BFS for unweighted) over directed edges to find the shortest path.
- If a path exists: render it as a numbered step list. Each step shows: node label → edge label → next node label, plus a one-sentence plain-English narrative of what happens at that step.
- If no directed path exists: show "No direct path found. Shortest undirected path: ..." using bidirectional BFS ignoring edge direction.
- A "Clear path" button or Esc returns to normal selection mode.

### Keyboard shortcuts
Render a `?` button in the top-right. Pressing `?` toggles a keyboard shortcut cheat sheet overlay. Implement these shortcuts:

| Key | Action |
|---|---|
| `Cmd/Ctrl+K` | Open fuzzy search |
| `F` | Fit entire graph to viewport |
| `Esc` | Clear selection / close overlays |
| `B` | Toggle blast-radius mode on selected node |
| `H` | Toggle sidebar visibility |
| `C` | Toggle complexity heatmap filter |
| `S` | Toggle security surface filter |
| `1`–`9` | Activate the Nth filter chip |
| `←` / `→` | Navigate backward/forward through node selection history |
| `Shift+Click` | Select second node for path explainer |
| `?` | Toggle shortcut reference |

### Selection history breadcrumb
Maintain an array of the last 10 selected node ids. `←` and `→` arrow keys navigate through it. Render the last 3 entries as a breadcrumb trail at the top of the sidebar: `auth-middleware → user-service → db-pool` so the user can retrace their exploration path.

### Overlay modes (filter chips)

**Complexity heatmap** (`C` key or chip): Override each node's fill color with a heat gradient based on `complexity`: `low` → dark green tint, `med` → amber tint, `high` → orange tint, `critical` → pulsing red tint. Show a legend strip in the sidebar.

**Security surface** (`S` key or chip): Dim all non-security nodes to 10% opacity. Highlight security nodes with a bright orange lock icon and a glowing border. Edges between security nodes are highlighted. Sidebar lists all security nodes and their risk type.

**Git churn** (chip, only shown if churn data exists): Color nodes from cool (churn=0) to hot (churn=max) on a blue → yellow → red gradient. Tooltip on hover shows "Changed N times in 90 days". High-churn nodes on the critical path are flagged with a flame icon.

**Coverage** (chip, only shown if coverage data exists): Color nodes from red (0%) to green (100%). Nodes with `coverage === null` (not measured) rendered with a grey crosshatch pattern. Sidebar shows average coverage of critical-path nodes.

---

## Visual / technical contract

- **One HTML file.** Embedded `<style>` and `<script>`. No external scripts, no fonts, no images, no D3, no React. Vanilla SVG + one `<canvas>` for the minimap.
- **Hand-positioned layout.** Each node has explicit `x, y, w, h`. Do not pull in an auto-layout library. Leave clear vertical channels between clusters so edges curve through gutters instead of crossing nodes.
- **Edges are cubic beziers**: `M x1 y1 C cx1 y1, cx2 y2, x2 y2` with arrowhead markers at destination. Stagger labels on shared gutters. Cycle edges use `stroke-dasharray: 6 3` with a CSS `@keyframes` dash animation.
- **Pan/zoom:** `transform: translate(tx, ty) scale(s)` on the SVG root group; anchor zoom to wheel cursor.
- **Click on canvas background clears selection** and exits blast-radius mode. Click on a node selects it and dims unconnected nodes. Hover behaves like a temporary selection.
- **Smooth transitions:** Node opacity changes use `transition: opacity 0.15s ease`. Sidebar content fades in with `transition: opacity 0.1s`.
- **Responsive sidebar:** On viewport < 900px wide, sidebar collapses to a bottom drawer that slides up on node selection.

### Required script shape
The user must be able to edit the map by hand later. The script section must follow this shape exactly:

```js
const clusters = [
  { id, label, x, y, w, h, color },
  ...
];

const N = (id, cluster, label, sub, x, y, w, h, color, opts = {}) => ({
  id, cluster, label, sub, x, y, w, h, color, ...opts
});

const nodes = [
  N('node-id', 'cluster-id', 'label.js', 'sub-label', x, y, w, h, 'service', {
    role:       'one technical sentence',
    plain:      'plain-English version',
    path:       'relative/path/to/file.js:42',
    notes:      ['line:N, note', 'line:N, note'],
    tag:        ['overview', 'feature-name', 'all'],
    critical:   true,        // optional — marks node on the spine
    complexity: 'high',      // 'low' | 'med' | 'high' | 'critical'
    loc:        340,         // lines of code
    security:   true,        // optional — marks security surface node
    afferent:   5,           // fan-in count
    efferent:   3,           // fan-out count
    instability: 0.37,       // efferent / (afferent + efferent)
    churn:      12,          // git commits in last 90 days (0 if no .git)
    coverage:   74,          // integer 0–100, or null
  }),
  ...
];

const edges = [
  {
    from: 'a', to: 'b',
    kind:  'critical',              // 'critical'|'api'|'db'|'mount'|'cycle'|'normal'
    label: '1 · doThing',
    tag:   ['overview','feature','all'],
    cycle: 'cycle-1',              // optional — cycle id if this edge is part of a cycle
  },
  ...
];

const FIXES      = { 'node-id': [{n: 1, t: 'short fix description'}, ...] };
const KNOWN_BUGS = { 'node-id': [{sev: 'high'|'med'|'low', ref: 'file:line', t: '...'}, ...] };
const SMELLS     = { 'node-id': [{id: 'smell-id', type: 'god-object', t: 'description', ref: 'file:line'}, ...] };
const CYCLES     = { 'node-id': ['cycle-1', ...] };  // node → cycle membership
```

### Color palette (CSS vars)

```
--bg        #0F0F0F   --panel     #161616
--panel-2   #1c1c1c   --border    #2a2a2a
--text      #e8e8e8   --muted     #8a8a8a
--client    #4ea1ff   --route     #7bd389
--service   #c792ea   --db        #ffb86b
--external  #ff6b9d   --critical  #ff3860
--accent    #f5b942   --accent-2  #ff7a45
--cycle     #b04fff   --security  #ff8c42
--dead      #444444   --smell     #ffdd57
--heat-low  #1a4731   --heat-med  #7a4f00
--heat-high #7a1f00   --heat-crit #ff3860
```

Cluster fill is a darker tint of the cluster's color. Node stroke uses the color directly. Critical nodes get a 2.2px stroke. Dead/orphan nodes get `--dead` color and a diagonal crosshatch fill. Security nodes get a 1px dashed `--security` outer glow.

---

## Rules

- **One file. No build step.** Opens in any modern browser.
- **Every label is a real file or function name from the repo.** Every path is real. Every line number you cite must have been confirmed by reading the file at that line.
- **No invented bugs or smells.** `KNOWN_BUGS` and `SMELLS` only include things you can cite with `file:line`.
- **No invented churn or coverage.** If `.git` does not exist, set `churn: 0` on all nodes and omit the churn chip. If no coverage report is found, set `coverage: null` on all nodes and omit the coverage chip.
- **Plain-English text** in `plain:` is readable by someone who has never seen the codebase. No jargon, no unexpanded acronyms.
- **Preserve the script shape** above so the user can edit nodes/edges by hand without reverse-engineering your structure.
- **No emojis** in node labels or sub-labels. Use them only in section headers or the legend if they aid scanning.
- **Blast radius and path explainer must work correctly.** Do not stub them out. Test your BFS logic mentally against at least one cycle in your graph before outputting.
- **Minimap must reflect the actual graph extent.** If the SVG viewBox is `0 0 2400 1600`, the minimap must scale to that, not to a hardcoded estimate.

---

## Deliverables

1. The HTML file at the path the user requested (default `./architecture-map.html`).
2. A short reply summarizing:
   - Node count / edge count
   - The critical path you identified (list every node on the spine)
   - Dead exports found (file:line for each)
   - Circular dependencies detected (list each cycle)
   - Architectural smells found (type + file)
   - Security surface nodes identified
   - Complexity hotspots (any `critical` or `high` nodes)
   - Git churn leaders on the critical path (if .git found)
   - Coverage gaps on the critical path (if coverage report found)
   - Top 3 surprises that a maintainer should know immediately
3. How to view it: open the file directly, or `python3 -m http.server 4747` → `http://localhost:4747/architecture-map.html`.
