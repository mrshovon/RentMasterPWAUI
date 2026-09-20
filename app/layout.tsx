import type { Metadata, Viewport } from "next";
import { Baloo_Da_2 } from "next/font/google";
import "./globals.css";
import { Toaster } from "../components/toast";
import { ConfirmHost } from "../components/confirm";
import { UpdateGate } from "../components/update-gate";
import { MaintenanceGate } from "../components/maintenance-gate";
import { AnalyticsGate } from "../components/analytics-gate";
import { AnnouncementGate } from "../components/announcement-gate";
import { NotificationSoundGate } from "../components/notification-sound-gate";
import { DeepLinkGate } from "../components/deep-link-gate";
import { LoginPopupGate } from "../components/login-popup-gate";
import { FontGate } from "../components/font-gate";
import { LanguageProvider } from "../lib/i18n";

// The DEFAULT display face — banner titles, metric values and hub-tile labels. Body copy
// deliberately stays on the system stack (font-sans); this is opt-in per element.
//
// Since the admin font picker exists it is also the permanent Bengali fallback at the end of
// the `font-display` stack (see tailwind.config.js), so a Latin-only admin choice still has
// something with Bengali glyphs behind it. Leave the --font-display variable to next/font:
// nothing at runtime writes to it, because doing so would discard the size-adjust fallback
// face next/font generates alongside it.
//
// Chosen for its BENGALI coverage as much as its Latin. The app ships a full bn.ts, and most
// rounded display faces carry no Bengali glyphs — a Bangla heading would silently fall back to
// the system Bengali font and stop matching its English twin, which is exactly the class of
// silent-degradation bug lib/i18n.tsx exists to avoid.
//
// No `weight`: the family has a variable wght axis (400-800), so one file covers every weight
// we use instead of three static cuts.
const display = Baloo_Da_2({
  subsets: ["latin", "bengali"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bari360 — Property Management",
  description: "Next-generation multi-tenant property management ecosystem.",
  manifest: "/manifest.json",
  applicationName: "Bari360",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bari360",
  },
  // All generated from the brand logo by `npm run gen-icons`.
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // The app defaults to the light theme; the toggle updates this meta live at runtime.
  themeColor: "#f6f8fb",
  width: "device-width",
  initialScale: 1,
  // Draw under the Android status/nav bars so safe-area insets can be applied.
  viewportFit: "cover",
};

// Runs before paint so the saved theme is applied with no flash of the wrong palette.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('rentmaster-theme');document.documentElement.dataset.theme=(t==='dark')?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

// The same trick for the admin-chosen typeface: replay the cache components/font-gate.tsx
// wrote, before first paint, so a configured font does not flash the default one on every
// load. The gate then refetches and corrects this if the admin has changed something.
//
// EVERY VALUE IS RE-CHECKED HERE. localStorage is the least trustworthy input in the app —
// anything running in this origin can write it — and these values go straight into CSS. The
// family names are matched against the four fixed constants from lib/font-validate.ts, so
// this script cannot introduce a family name of its own; the URL check denies exactly the
// characters that could close the url(), the declaration or the rule. If any check fails we
// set nothing, and the var() fallbacks in tailwind.config.js render the app as it shipped.
//
// `?nofont=1` is the way back in if an admin ever saves something unreadable.
const FONT_INIT = `(function(){try{
if(location.search.indexOf('nofont=1')>-1)return;
var c=JSON.parse(localStorage.getItem('rentmaster-fonts')||'null');if(!c||c.v!==1)return;
var FAM=/^"[A-Za-z0-9 .-]{1,60}"(, *"[A-Za-z0-9 .-]{1,60}")*$/;
var G=/^https:\\/\\/fonts\\.googleapis\\.com\\/css2\\?[A-Za-z0-9=&:;,.+@%_-]{1,700}$/;
var U=/^https:\\/\\/[^"'()\\\\;{}<>\\s]{1,480}$/;
var N=/^Bari360 Custom (Latin|Bangla)( Heading)?$/;
var d=document.documentElement;
if(c.b&&FAM.test(c.b))d.style.setProperty('--font-body',c.b);
if(c.h&&FAM.test(c.h))d.style.setProperty('--font-heading',c.h);
var css='',i,x,f=c.f||[];
for(i=0;i<f.length;i++){x=f[i];
if(x&&N.test(x.n)&&U.test(x.u)&&/^(woff2|woff|truetype|opentype)$/.test(x.t)){
css+='@font-face{font-family:"'+x.n+'";src:url("'+x.u+'") format("'+x.t+'");font-display:swap;font-weight:100 900;font-style:normal;}';}}
if(css){var s=document.createElement('style');s.id='bari360-font-faces';s.textContent=css;document.head.appendChild(s);}
if(c.g&&G.test(c.g)){
var p=document.createElement('link');p.rel='preconnect';p.href='https://fonts.gstatic.com';p.crossOrigin='';document.head.appendChild(p);
var l=document.createElement('link');l.id='bari360-gfonts';l.rel='stylesheet';l.href=c.g;
l.media='print';l.onload=function(){this.media='all';};document.head.appendChild(l);}
}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={display.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script dangerouslySetInnerHTML={{ __html: FONT_INIT }} />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased font-sans selection:bg-primary/30 selection:text-heading">
        <LanguageProvider>
          {children}
          <Toaster />
          <ConfirmHost />
          {/* First: it only routes, and a deep link should land before anything else
              decides what to show on the page it lands on. */}
          <DeepLinkGate />
          <UpdateGate />
          {/* Before MaintenanceGate on purpose: if both ever fire at once, the maintenance
              portal mounts second and lands on top, which is the one that must be read. */}
          {/* Signed-out login screen only, and phones only. Its own gate rather than a mode of
              AnnouncementGate, which requires a session and skips "/" by design. */}
          <LoginPopupGate />
          <AnnouncementGate />
          <MaintenanceGate />
          {/* Renders nothing — loads GA/GTM if the admin has configured and enabled it. */}
          <AnalyticsGate />
          {/* Renders nothing — applies the typeface the admin chose in the admin panel. Most
              loads are already correct by the time this mounts; FONT_INIT above replayed it
              before first paint. */}
          <FontGate />
          {/* Renders nothing — plays the Bari360 tone for pushes that land while a page is open. */}
          <NotificationSoundGate />
        </LanguageProvider>
      </body>
    </html>
  );
}
