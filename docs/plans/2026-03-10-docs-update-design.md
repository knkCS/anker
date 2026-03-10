# Documentation Update — Design Document

**Date:** 2026-03-10

**Goal:** Update README.md and CLAUDE.md to reflect all changes from the UI/UX polish and accessibility audit work (38+ commits).

## Approach

Surgical update — patch gaps in existing docs without restructuring. Both files keep their current structure with targeted additions and fixes.

## README.md Changes

1. **Fix Provider usage** — Remove explicit `system` import, simplify to `<Provider>`
2. **Update imports example** — Add `Skeleton` to primitives import line
3. **Add "Accessibility" section** (after Font) — prefers-reduced-motion, RTL-ready, ARIA on forms, WCAG AA touch targets
4. **Add "Breaking Changes" section** (before License) — FactBox `childs` → `items`
5. **Add "Notable Component Props" section** (after Brand Colors) — Table of key new props: Modal/Drawer `loading`, Table/ArrayField `emptyState`, Card slots, Persona `interactive`, TypeBadge `colorPalette`, FormField `description`

## CLAUDE.md Changes

1. **Fix Provider reference** — `<ChakraProvider value={system}>` → `<Provider>` (defaults to anker system)
2. **Update component counts** — Primitives 13→14 (Skeleton), atoms EmptyPanel merged into EmptyState
3. **Update directory layout** — Add `tokens/animations.ts`, `tokens/z-index.ts`
4. **Expand Design Principles** — Add: RTL (logical CSS), prefers-reduced-motion (theme-level), displayName required
5. **Add "Accessibility Conventions" subsection** — aria-describedby in FormField, aria-live on errors, aria-current on Stepper, ≥44px touch targets
6. **Add "Breaking Changes" note** — FactBox `childs` → `items`
