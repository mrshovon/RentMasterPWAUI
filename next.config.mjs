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
};

export default withSerwist(nextConfig);
