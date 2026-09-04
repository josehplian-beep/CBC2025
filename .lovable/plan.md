# Media page layout polish + watch page search placement

## Goals

1. **Media page (`src/pages/Media.tsx`)** — clean up the layout and make it more polished and interactive.
2. **Watch page (`src/pages/WatchVideo.tsx`)** — move the search bar below the video player so it sits with the "Recent Videos" section while a video is playing.

## Media page improvements

**Layout fixes**
- Clean up the hero spacing and align the sticky tab bar with the container (currently the pills + social icons can crowd on smaller screens).
- On mobile, wrap the tab pills and move the social icons to their own row (or hide them below `sm`) so the tab bar never overflows.
- Remove the `pt-24` overlap guess — keep consistent `container` padding so sections align.

**Visual & interactive polish**
- Hero: add a subtle backdrop image/haze using existing tokens (`--hero-gradient`, haze keyframes already in `index.css`) and a live-viewer hint ("Watch Live" quick link when it's Sunday service time).
- Video grid: switch the "View More" button to the same infinite-scroll IntersectionObserver pattern used in the gallery (consistent behavior across the app).
- Video cards: keep `VideoCard` but add a hover lift (`hover:-translate-y-1`) and lazy-loaded thumbnails (`loading="lazy"`).
- Albums tab: skeleton cards while loading (currently just text), 1:1 cover thumbnails with `object-cover`, and photo-count badges.
- Empty/loading states with skeletons matching the grid shape.
- Livestream tab: tidy the player card spacing and keep the red "LIVE" theme; countdown card stays.

**All colors stay on the palette tokens** (primary, accent, live, muted) — no hardcoded hexes beyond what's already tokenized.

## Watch page (`src/pages/WatchVideo.tsx`)

- Move the search input from the top of the page to directly above the "Recent Videos" grid, so the player + title + note-taker stay unobstructed while the video plays.
- Keep the clear (✕) button and result count behavior unchanged.

## Verification

- `bunx tsgo --noEmit -p tsconfig.app.json` passes.
- Browser check: media page desktop + mobile width (tabs don't overflow), watch page shows search below the player and filtering still works.
