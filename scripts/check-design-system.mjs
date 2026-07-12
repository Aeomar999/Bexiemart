#!/usr/bin/env node
/**
 * Bexiemart design-system guardrail.
 *
 * Scans mobile + admin source for the four adherence rules in
 * docs/DESIGN-SYSTEM.md §10 and reports violations grouped by rule:
 *   1. raw-hex      — hardcoded hex colors outside Layer-1 token files
 *   2. elevation    — shadow-* / RN elevation (flat design → borders only)
 *   3. arbitrary    — off-scale Tailwind arbitrary values (p-[13px], text-[15px] …)
 *   4. raw-control  — <input>/<button> (admin) or <TextInput> (mobile) outside components/ui/
 *
 * Usage:
 *   node scripts/check-design-system.mjs            # report only, exit 0
 *   node scripts/check-design-system.mjs --strict   # exit 1 if any violations (CI gate)
 *
 * The codebase is not clean yet (Phases 1–4 migrate the ~50 offenders the audit
 * found). Run in report mode until those land, then flip CI to --strict.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STRICT = process.argv.includes("--strict");

const SCAN_ROOTS = ["apps/admin/src", "apps/mobile/app", "apps/mobile/src"];
const EXCLUDE_SEGMENTS = [
  "node_modules", ".next", "dist", "build", "coverage",
  `${sep}android${sep}`, `${sep}ios${sep}`, "__mocks__", "__tests__",
];
const EXCLUDE_FILE_RE = /\.(test|spec)\.[jt]sx?$/;
// Layer-1 token files legitimately define raw hex primitives.
const TOKEN_FILES = new Set(["global.css", "globals.css", "tokens.ts", "colors.ts"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);

const isUiComponent = (p) => p.includes(`${sep}components${sep}ui${sep}`);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    const full = join(dir, name);
    if (EXCLUDE_SEGMENTS.some((s) => full.includes(s))) continue;
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) { walk(full, out); continue; }
    const dot = name.lastIndexOf(".");
    if (dot < 0 || !EXTS.has(name.slice(dot))) continue;
    if (EXCLUDE_FILE_RE.test(name)) continue;
    out.push(full);
  }
  return out;
}

const HEX_RE = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/;
const SHADOW_CLASS_RE = /\bshadow-(?!none\b)[a-z0-9[]/;
const RN_ELEVATION_RE = /\b(elevation|shadowColor|shadowOpacity|shadowRadius|shadowOffset)\b/;
const ARBITRARY_RE =
  /\b(?:p|px|py|pl|pr|pt|pb|m|mx|my|ml|mr|mt|mb|gap|gap-x|gap-y|h|w|min-h|min-w|max-h|max-w|size|text|rounded|top|bottom|left|right|inset|leading|tracking|space-x|space-y)-\[([^\]]+)\]/g;

const rules = {
  "raw-hex": [],
  elevation: [],
  arbitrary: [],
  "raw-control": [],
};

function scanFile(file) {
  const rel = file.slice(ROOT.length + 1);
  const base = basename(file);
  const isToken = TOKEN_FILES.has(base);
  const isAdmin = rel.includes(`apps${sep}admin`);
  const isMobile = rel.includes(`apps${sep}mobile`);
  const inUi = isUiComponent(file);
  const src = readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);

  lines.forEach((line, i) => {
    const at = { file: rel.split(sep).join("/"), line: i + 1, text: line.trim().slice(0, 120) };

    // 1. raw hex (skip Layer-1 token files)
    if (!isToken && HEX_RE.test(line)) rules["raw-hex"].push(at);

    // 2. elevation / shadow (flat design)
    if (SHADOW_CLASS_RE.test(line) || RN_ELEVATION_RE.test(line)) rules.elevation.push(at);

    // 3. off-scale arbitrary Tailwind values (ignore color/var arbitraries)
    let m;
    ARBITRARY_RE.lastIndex = 0;
    while ((m = ARBITRARY_RE.exec(line))) {
      const val = m[1];
      if (val.includes("var(") || val.startsWith("#") || val.startsWith("--")) continue; // color/token ref
      if (!/[0-9]/.test(val)) continue; // e.g. calc keywords without magnitude
      rules.arbitrary.push({ ...at, text: `${m[0]}  —  ${at.text}` });
      break; // one flag per line is enough
    }

    // 4. raw control elements outside components/ui/
    if (!inUi) {
      if (isAdmin && /<input\b/.test(line)) rules["raw-control"].push({ ...at, text: `<input>  —  ${at.text}` });
      if (isAdmin && /<button\b/.test(line)) rules["raw-control"].push({ ...at, text: `<button>  —  ${at.text}` });
      if (isMobile && /<TextInput\b/.test(line)) rules["raw-control"].push({ ...at, text: `<TextInput>  —  ${at.text}` });
    }
  });
}

const files = SCAN_ROOTS.flatMap((r) => walk(join(ROOT, r)));
files.forEach(scanFile);

const LABELS = {
  "raw-hex": "Raw hex colors (use semantic tokens — DESIGN-SYSTEM.md §2)",
  elevation: "Shadow / elevation (flat design — borders only — §8)",
  arbitrary: "Off-scale arbitrary values (use the spacing/radius/type scale — §4–6)",
  "raw-control": "Raw control outside components/ui/ (use the shared component — §7)",
};

let total = 0;
console.log(`\n🎨  Bexiemart design-system check — ${files.length} files scanned\n`);
for (const key of Object.keys(rules)) {
  const hits = rules[key];
  total += hits.length;
  const icon = hits.length ? "✗" : "✓";
  console.log(`${icon}  ${LABELS[key]}: ${hits.length}`);
  hits.slice(0, 8).forEach((h) => console.log(`      ${h.file}:${h.line}  ${h.text}`));
  if (hits.length > 8) console.log(`      … and ${hits.length - 8} more`);
  console.log("");
}

console.log(`Total violations: ${total}  (${STRICT ? "strict — CI gate" : "report only"})\n`);
process.exit(STRICT && total > 0 ? 1 : 0);
