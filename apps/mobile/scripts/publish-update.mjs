#!/usr/bin/env node
// Publishes an EAS Update to a channel, bundled with the same EXPO_PUBLIC_*
// values as the builds on that channel.
//
// Why this exists: `eas update` ignores the build profile `env` blocks in
// eas.json, and this project's EAS-hosted variables are "secret" (unreadable at
// publish time). A bare `eas update` therefore bundles whatever is in the local
// shell/.env — or nothing at all in CI — and ships a JS bundle with a localhost
// or missing API URL to every installed app on the channel.
//
// Usage:
//   node scripts/publish-update.mjs <channel> [--message "..."] [--platform android|ios|all]
//
// After publishing it checks that at least one finished build on the channel
// has the update's runtime version, and warns when the update can't reach anyone.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const [channel, ...rest] = argv;
  const options = { channel, message: undefined, platform: "all" };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--message" || arg === "-m") options.message = rest[++i];
    else if (arg.startsWith("--message=")) options.message = arg.slice("--message=".length);
    else if (arg === "--platform" || arg === "-p") options.platform = rest[++i];
    else if (arg.startsWith("--platform=")) options.platform = arg.slice("--platform=".length);
    else fail(`Unknown argument: ${arg}`);
  }
  return options;
}

function sortedJson(value) {
  return JSON.stringify(value ?? {}, Object.keys(value ?? {}).sort());
}

// cmd.exe needs the whole command line as one string; quote anything with spaces
// or shell metacharacters ("" is an escaped quote inside a quoted argument).
function quoteForCmd(arg) {
  return /[\s"&|<>^%()]/.test(arg) ? `"${arg.replace(/"/g, '""')}"` : arg;
}

function run(command, args, { env, captureStdout = false } = {}) {
  const result = isWindows
    ? spawnSync([command, ...args].map(quoteForCmd).join(" "), {
        cwd: projectDir,
        env,
        shell: true,
        stdio: ["inherit", captureStdout ? "pipe" : "inherit", "inherit"],
        encoding: "utf8",
      })
    : spawnSync(command, args, {
        cwd: projectDir,
        env,
        stdio: ["inherit", captureStdout ? "pipe" : "inherit", "inherit"],
        encoding: "utf8",
      });
  if (result.error?.code === "ENOENT") {
    fail(`"${command}" not found. Install it with: npm install -g eas-cli`);
  }
  return result;
}

function parseJsonArray(stdout) {
  const start = stdout.indexOf("[");
  const end = stdout.lastIndexOf("]");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return null;
  }
}

const { channel, message: messageArg, platform } = parseArgs(process.argv.slice(2));
const easJson = JSON.parse(readFileSync(path.join(projectDir, "eas.json"), "utf8"));
const profiles = Object.entries(easJson.build ?? {}).filter(([, p]) => p.channel === channel);

if (!channel || channel.startsWith("-")) {
  fail(
    'Usage: node scripts/publish-update.mjs <channel> [--message "..."] [--platform android|ios|all]'
  );
}
if (profiles.length === 0) {
  const known = [...new Set(Object.values(easJson.build ?? {}).map((p) => p.channel))];
  fail(
    `No build profile in eas.json uses channel "${channel}". Known channels: ${known.join(", ")}`
  );
}
if (!["android", "ios", "all"].includes(platform)) {
  fail(`--platform must be android, ios or all (got "${platform}")`);
}

// Profiles that share a channel receive the same updates, so they must agree on
// what gets bundled — otherwise the update silently reconfigures some builds.
const [[baseName, base]] = profiles;
for (const [name, profile] of profiles.slice(1)) {
  if (
    sortedJson(profile.env) !== sortedJson(base.env) ||
    profile.environment !== base.environment
  ) {
    fail(
      `Build profiles "${baseName}" and "${name}" share channel "${channel}" but have different ` +
        `"env"/"environment" in eas.json. Make them identical or give them separate channels.`
    );
  }
}
if (!base.environment) {
  fail(
    `Build profile "${baseName}" has no "environment" in eas.json (required by EAS Update on SDK 55+).`
  );
}

// Only the profile's EXPO_PUBLIC_* values may reach the bundle: drop any from the
// shell and disable .env loading, exactly like an EAS build (where .env is gitignored).
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith("EXPO_PUBLIC_"))
);
Object.assign(env, base.env, { EXPO_NO_DOTENV: "1" });

const message =
  messageArg ||
  spawnSync("git", ["log", "-1", "--format=%s"], {
    cwd: projectDir,
    encoding: "utf8",
  }).stdout?.trim() ||
  `Update to ${channel}`;

const profileNames = profiles.map(([name]) => name).join(", ");
console.log(
  `\n▶ Publishing to channel "${channel}" (EAS environment "${base.environment}", ` +
    `env from build profile(s): ${profileNames})\n`
);

const publish = run(
  "eas",
  [
    "update",
    "--channel",
    channel,
    "--environment",
    base.environment,
    "--platform",
    platform,
    "--message",
    message,
    "--non-interactive",
    "--json",
  ],
  { env, captureStdout: true }
);
if (publish.status !== 0) fail("eas update failed (see output above).");

const updates = parseJsonArray(publish.stdout ?? "");
if (!updates?.length) {
  console.log(publish.stdout);
  fail("Published, but could not read the update details from eas update --json.");
}

console.log("\n✔ Published");
let unreachable = 0;
for (const update of updates) {
  console.log(`  ${update.platform}: runtime ${update.runtimeVersion}, group ${update.group}`);

  const builds = parseJsonArray(
    run(
      "eas",
      [
        "build:list",
        "--channel",
        channel,
        "--platform",
        update.platform,
        "--runtime-version",
        update.runtimeVersion,
        "--status",
        "finished",
        "--limit",
        "1",
        "--json",
        "--non-interactive",
      ],
      { env, captureStdout: true }
    ).stdout ?? ""
  );
  if (builds?.length) {
    console.log(
      `    reaches builds like ${builds[0].id} (${builds[0].buildProfile}, ${builds[0].createdAt})`
    );
  } else {
    unreachable++;
    console.warn(
      `    ⚠ no finished ${update.platform} build on "${channel}" has this runtime version, so no ` +
        `installed app will receive it. Native code or eas.json changed since the last build: ` +
        `run \`eas build --profile ${baseName} --platform ${update.platform}\`.`
    );
  }
}
console.log(
  unreachable === updates.length
    ? "\nThis update is not reachable by any existing build yet.\n"
    : "\nInstalled apps download it on next launch or foreground, then show the restart banner.\n"
);
