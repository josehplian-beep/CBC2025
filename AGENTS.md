# Architecture
- Store testimonies and devotional posts in `testimonials`, distinguished by `content_type`; reuse the Messages editor so both sections share publishing and access controls.
- Render devotional content as plain text paragraphs, never executable author HTML; sharing embeds use a dedicated read-only post route.
- Keep message section destinations in one shared definition and use the same route-driven selector on both listings so switching stays consistent.
- Derive devotional sharing metadata through a shared helper using the public site origin and only public post covers; client-side head tags alone do not verify crawler previews on static hosting.
- Post share pages are prerendered at build time into `dist/<post path>/index.html` with per-post head tags, so crawlers see them without JS; new posts need a republish to get static previews.
- Vite `base` comes from `GITHUB_PAGES_BASE_PATH` (set by `.github/workflows/static.yml` to `/<repo-name>/`) and defaults to `/`; the main site must always build at the root — never hardcode a GitHub sub-path.
