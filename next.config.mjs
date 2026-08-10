import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Service worker source + output. The client auto-registers /sw.js (register: true default).
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Don't run the SW in `next dev` — it makes hot-reload flaky. Test the PWA via `next build`.
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Verification builds get their own output directory; the dev server keeps `.next` to itself.
  //
  // `next dev` and `next build` write DIFFERENT module manifests into the same folder, so running
  // a build while (or between) dev sessions leaves the dev server serving a manifest describing
  // chunks it never emitted. The symptom is a ChunkLoadError in the browser and, on the server,
  // `TypeError: __webpack_modules__[moduleId] is not a function` with every chunk 404ing — which
  // looks like a code fault and is not one. Run verification builds with `npm run build:check`.
  //
  // NEXT_DIST_DIR is unset on Vercel, so production still builds into `.next` exactly as before.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default withSerwist(nextConfig);
