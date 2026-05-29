# PR FORGD — Brand Kit

## Brand specs
- **Navy** `#001228` (primary background)
- **Lime** `#7FFF3B` (accent)
- **White** `#FFFFFF`
- **Typeface**: Impact / Arial Black (web), Anton (free Google Font equivalent for print/export)
- **Tagline**: "Train. Track. Forge."
- **Aesthetic**: Tactical viewfinder corners + heavy condensed display type

## Files

### `svg/` — primary working files (require Impact/Anton in the rendering context)
- `icon.svg` — primary 512×512 square logo (PR over FORGD with corner brackets)
- `favicon.svg` — same square format, optimized for browser tabs / app icons
- `header.svg` — horizontal lockup: small icon + "PR FORGD" wordmark + lime tagline

### `svg-outlined/` — font-independent versions (text baked to vector paths)
Same files as `svg/` with all text converted to SVG paths. Use these for print, email signatures, third-party tools, or anywhere Impact/Anton may not be installed.

### `png/` — raster exports
- `favicon-{16,32,48,64,192,512}.png` — square favicon at standard sizes
- `icon-{256,512,1024}.png` — primary icon
- `header-{800,1600,2400}.png` — header lockup at 1x, 2x, 3x for high-DPI screens

### `favicon.ico` — multi-resolution Windows/browser icon (16/32/48/64)
Drop this at `/favicon.ico` on your web server.

## Quick use

**Website header:** `<img src="/prforgd-brand-kit/svg/header.svg" alt="PR FORGD">`

**Browser tab icon:**
```html
<link rel="icon" href="/favicon.ico">
<link rel="icon" type="image/svg+xml" href="/prforgd-brand-kit/svg/favicon.svg">
<link rel="apple-touch-icon" href="/prforgd-brand-kit/png/favicon-192.png">
```

**Social/OG preview:** use `png/icon-1024.png` or `png/header-2400.png`

## Notes
- The icon font-family chain prefers Impact (system font on Mac/Windows) and falls back to Anton (Google Font) and Arial Black. If you're rendering server-side or in environments without these fonts, use the `svg-outlined/` versions.
- Tagline uses bright lime (`#7FFF3B`) on white — high-impact but reduced contrast. For body-text contexts, consider darkening the lime or using navy.
