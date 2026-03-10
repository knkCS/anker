# UI/UX Polish — Design Document

**Date:** 2026-03-10

**Goal:** Elevate anker from a component library to a polished design system through token-level improvements, dark mode fixes, component consolidation, and visual polish.

## Approach

Changes are organized in 4 phases by impact:

1. **Tokens & dark mode** — motion tokens, opacity tokens, z-index scale, bumped border-radius, semantic color audit
2. **Consolidation & fixes** — merge EmptyPanel/EmptyState, fix Provider default, add FormField description, consolidate SearchInput, fix TableItem styling
3. **Component polish** — Card slots, Widget hierarchy, Drawer header, Persona interactive, TypeBadge color, Action transitions, FactBox rename
4. **New additions** — Skeleton primitives, plus nice-to-haves

## Key Decisions

- **Motion tokens** added to semantic.ts, applied via recipes. Not a full animation library.
- **Border-radius bump** is global — sm: 0.375rem, md: 0.5rem, lg: 0.75rem, xl: 1rem, 2xl: 1.25rem
- **EmptyPanel removed**, EmptyState gains `description` as ReactNode and `icon` prop
- **Provider** accepts `system` prop, defaults to anker's system
- **SearchInput**: forms version kept (more configurable), atoms version becomes a re-export
- **All raw `gray.500`** in action icons → `subtle` semantic token
- **All raw `gray.100`/`blue.100`** in select → semantic tokens
- **`childs`** in FactBox renamed to `items` (breaking change, documented)
