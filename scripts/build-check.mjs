#!/usr/bin/env node
// A production build for VERIFICATION only — `npm run build:check`.
//
// Identical to `next build` except that it writes to `.next-build` instead of `.next` (see
// `distDir` in next.config.mjs). That separation is the point: sharing one output directory with
// a running dev server corrupts the module manifest, and the result is a ChunkLoadError in the
// browser that looks like a code fault and is not one.
//
// This exists as a node wrapper rather than `NEXT_DIST_DIR=… next build` in package.json because
// npm scripts run through cmd.exe on Windows, where the inline env-var prefix is a syntax error.
//
// `npm run build` is deliberately left alone — that is what Vercel runs.

import { spawn } from "node:child_process";

const child = spawn("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true, // needed for `npx` resolution on Windows
  env: { ...process.env, NEXT_DIST_DIR: ".next-build" },
});

child.on("exit", (code) => process.exit(code ?? 1));
