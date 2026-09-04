# Departments Mobile Dropdown Plan

## Goal
Replace the horizontal scrollable chip tab bar on the Departments page mobile view with a native-feeling dropdown selector. Keep the existing vertical sticky sidebar on desktop.

## Current state
`src/pages/Departments.tsx` uses a single `TabsList` that renders as:
- Desktop: vertical sticky sidebar (`md:flex-col md:w-56`)
- Mobile: horizontal overflow-x-auto chip row

The `Select` component from shadcn/ui is already imported and used for the year filter.

## Changes
1. In `src/pages/Departments.tsx`, render the department selector conditionally:
   - **Mobile (< md):** use a full-width `Select` dropdown showing formatted department names. Selecting updates `selectedDepartment` and search params.
   - **Desktop (md+):** keep the existing vertical `TabsList` sidebar.
2. Keep the `Tabs` wrapper and `TabsContent` unchanged so the member grid behavior stays the same.
3. Ensure the dropdown label is clear (e.g., "Select Department" placeholder or visible label).
4. Preserve the active-state styling and accessibility: the dropdown value reflects the currently selected department.
5. Verify the layout no longer overflows horizontally on small screens and the page feels smoother.

## Out of scope
- No changes to desktop sidebar layout or styling.
- No changes to data fetching, member cards, or year filter.
- No changes to routes or navigation.

## Verification
- Typecheck with `bunx tsgo --noEmit -p tsconfig.app.json`.
- Build with `bun run build`.
- Capture mobile and desktop screenshots to confirm the dropdown appears only on mobile and the sidebar remains on desktop.
