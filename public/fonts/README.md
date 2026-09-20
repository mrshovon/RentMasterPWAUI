# Self-hosted fonts

Only faces that the admin font picker offers but that **cannot be loaded from Google Fonts**
live here. Everything else in `lib/font-catalog.ts` is fetched from `fonts.googleapis.com` at
runtime, and a custom font an admin uploads goes to Supabase storage, not into this folder.

## Shadhinata 2.0 — not installed yet

`app/globals.css` already declares the `@font-face`, and `lib/font-catalog.ts` already has the
catalogue entry. The **font file itself is missing**, so the entry is marked unavailable and
the picker greys it out.

### To install it

1. Obtain `Shadhinata 2.0` as `.ttf` or `.otf`, **from a source whose licence permits
   redistribution inside a commercial web app**. This is the part that stopped it shipping:
   the face is not on Google Fonts, not in the Free Bangla Fonts Project, and not in the open
   Bangla font repos (`maateen/bangla-web-fonts`, `fahimscirex/bangla-fonts`). The aggregator
   sites that carry it state no licence at all, which is not good enough to bundle.

2. Convert it to WOFF2 and put it here as `shadhinata-2.woff2`:

   ```
   pip install fonttools brotli
   pyftsubset Shadhinata2.ttf \
     --unicodes=U+0980-09FF,U+200C-200D,U+25CC \
     --flavor=woff2 --output-file=public/fonts/shadhinata-2.woff2
   ```

   The subset matches the `unicode-range` on the `@font-face` in `app/globals.css` — this face
   is only ever asked to draw Bengali, so Latin glyphs in it would be dead weight. Aim for
   under ~250 KB; for scale, the Baloo Da 2 slices next/font already precaches total ~160 KB.

3. Drop the licence next to it as `Shadhinata-2.0-LICENSE.txt`.

4. Flip `SHADHINATA_INSTALLED` to `true` in `lib/font-catalog.ts`.

### Note on the service worker

Anything in `public/` is **precached for every user**, whether or not the font is selected.
That cannot be configured away — Serwist's `exclude` only reaches webpack assets, and a
`manifestTransform` runs before `public/` entries are appended. It is the reason to subset the
file rather than ship the full face.

If the licence turns out to forbid redistribution, do not bundle it: an admin can still install
it through the **custom font** upload in Settings → System fonts, which is one of the reasons
that path exists.
