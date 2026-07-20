// One-command Android release: bump the version everywhere, write the release notes,
// commit, tag, and push. Pushing the v* tag triggers .github/workflows/android-release.yml,
// which builds the SIGNED APK + AAB and publishes the GitHub Release the app checks for updates.
//
// Usage:
//   npm run release:android -- --version 1.1.0 --notes "What changed in this release"
//   npm run release:android -- --patch  --notes "Bug fixes"
//   npm run release:android -- --minor --notes-file notes.txt
//
// Flags:
//   --version X.Y.Z    explicit version   (or --patch / --minor / --major to bump package.json)
//   --notes "..."      release notes shown in the in-app update popup + GitHub Release body
//   --notes-file PATH  read notes from a file instead
//   --dry-run          do everything except commit/tag/push

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : undefined;
}

const pkgPath = resolve(ROOT, "package.json");
const cfgPath = resolve(ROOT, "lib/app-config.ts");
const gradlePath = resolve(ROOT, "android/app/build.gradle");
const notesPath = resolve(ROOT, "RELEASE_NOTES.md");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const current = pkg.version;

// ---- Resolve the target version ----
function bump(v, kind) {
  const [a, b, c] = v.split(".").map((n) => parseInt(n, 10) || 0);
  if (kind === "major") return `${a + 1}.0.0`;
  if (kind === "minor") return `${a}.${b + 1}.0`;
  return `${a}.${b}.${c + 1}`; // patch
}
let version = flag("version");
if (typeof version !== "string") {
  if (flag("major")) version = bump(current, "major");
  else if (flag("minor")) version = bump(current, "minor");
  else if (flag("patch")) version = bump(current, "patch");
}
if (!version || typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Provide --version X.Y.Z (or --patch/--minor/--major). Got:", version);
  process.exit(1);
}

// ---- Resolve the notes ----
let notes = flag("notes");
const notesFile = flag("notes-file");
if (typeof notesFile === "string") notes = readFileSync(resolve(ROOT, notesFile), "utf8");
if (typeof notes !== "string" || !notes.trim()) notes = `RentMaster v${version}\n\nBug fixes and improvements.`;

const dryRun = !!flag("dry-run");

// ---- Update package.json ----
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// ---- Update lib/app-config.ts APP_VERSION ----
let cfg = readFileSync(cfgPath, "utf8");
cfg = cfg.replace(/export const APP_VERSION = "[^"]*";/, `export const APP_VERSION = "${version}";`);
writeFileSync(cfgPath, cfg);

// ---- Update android/app/build.gradle: versionName + auto-increment versionCode ----
let gradle = readFileSync(gradlePath, "utf8");
const codeMatch = gradle.match(/versionCode\s+(\d+)/);
const nextCode = codeMatch ? parseInt(codeMatch[1], 10) + 1 : 1;
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${nextCode}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
writeFileSync(gradlePath, gradle);

// ---- Write release notes (GitHub Release body + in-app popup) ----
writeFileSync(notesPath, `${notes.trim()}\n`);

console.log(`Version:     ${current} -> ${version}`);
console.log(`versionCode: ${nextCode}`);
console.log(`Notes:\n${notes.trim()}\n`);

if (dryRun) {
  console.log("--dry-run: files updated, but nothing committed/tagged/pushed.");
  process.exit(0);
}

// ---- Commit, tag, push (the tag triggers the CI build + release) ----
function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}
run("git add -A");
run(`git commit -m "Release v${version}"`);
run(`git tag v${version}`);
run("git push origin HEAD --follow-tags");

console.log(`\n✅ Pushed v${version}. GitHub Actions is now building the signed APK/AAB and will`);
console.log(`   publish the release in a few minutes: check the Actions tab, then Releases.`);
