# Departments Tabs — Vertical Layout

## Goal
Turn the horizontal department tab bar (Deacon, Women, Youth, Church School, Worship Team, Mission, Building, Culture, Media Team, Auditors) into a vertical, mobile-friendly list on `src/pages/Departments.tsx`.

## Changes

### Desktop (md and up)
- Two-column layout: vertical tab list on the left (~220px sticky sidebar), member grid on the right.
- Vertical tabs: full-width buttons, left-aligned text, active tab highlighted with the primary color and a left accent bar, smooth hover transitions.

### Mobile (< md)
- The vertical tab list becomes a horizontally scrollable chip row (sticky under the nav, swipeable, no wrapping/overlap), or a compact vertical accordion-style list above the grid — pick vertical list stacked above the member cards with smooth scrolling.
- Keep deep-linking via `?tab=` search param unchanged.

### Polish
- Smooth active-state transition (framer-motion layout underline/background pill).
- Keep year filter above the tabs; member grid unchanged.

## Technical
- Edit only `src/pages/Departments.tsx`.
- Use existing shadcn `Tabs` primitives with a `flex-col` TabsList for desktop; responsive classes switch to a scrollable row on mobile.
- `motion.div` with `layoutId` for the animated active indicator.
- Typecheck with `bunx tsgo --noEmit -p tsconfig.app.json` and verify desktop + mobile via screenshots.
