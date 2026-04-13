# LinkCell Design Spec

**Issue:** [knkCS/anker#79](https://github.com/knkCS/anker/issues/79)
**Date:** 2026-04-13

## Summary

Add a `LinkCell` component to DataTable cells for rendering router-aware clickable text in table rows. Uses react-router-dom's `Link` for SPA navigation, composed with Chakra's `Link` for styling via `asChild`.

Counterpart to the existing `UrlCell` (external links with `target="_blank"`). LinkCell handles internal app navigation.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Generics / row context | None | Flat `React.FC` like all other cells; consumers resolve values in column definitions |
| `centered` prop | Omitted | No other cell has this; alignment handled at column level |
| Null handling | `to: string \| null \| undefined` | Renders em-dash; consistent with all other data cells |
| Link appearance | `color="accent"` hardcoded | Links should look like links; matches UrlCell |
| Rendering approach | Chakra `Link` with `asChild` + react-router-dom `Link` | Gets Chakra styling + router behavior without a new primitive |

## Types

```tsx
import type React from "react";

export interface LinkCellProps {
  /** Route path for navigation. Renders em-dash when null/undefined. */
  to: string | null | undefined;
  /** Display text or node. Falls back to `to` value if not provided. */
  label?: React.ReactNode;
}
```

## Rendering Behavior

- **Null/undefined `to`:** renders `<span>{emptyCellValue}</span>` (em-dash `—`) — same pattern as UrlCell
- **Valid `to`:** renders Chakra's `Link` with `asChild` wrapping react-router-dom's `Link`:
  ```tsx
  <ChakraLink color="accent" asChild>
    <RouterLink to={to} onClick={(e) => e.stopPropagation()}>
      {label || to}
    </RouterLink>
  </ChakraLink>
  ```
- **Label fallback:** if no `label` provided, displays the `to` path itself (same pattern as UrlCell showing the URL)

### Event propagation

- `stopPropagation` on the RouterLink's `onClick` to prevent `onRowClick` from firing

### Accessibility

- Inherits standard link semantics from both Chakra Link and router Link
- Visible link text provides accessible name

## File Structure

```
src/components/data-table/cells/
├── link-cell.tsx          # Component + types
├── link-cell.stories.tsx  # Stories
└── index.ts               # Updated — add LinkCell export
```

No changes needed to `data-table/index.ts` or `components/index.ts` — they re-export via `export * from "./cells"`.

## Exports

Added to `cells/index.ts`:

```tsx
export { LinkCell, type LinkCellProps } from "./link-cell";
```

## Dependencies

- `Link` from `../../../primitives/typography` (Chakra Link)
- `Link` from `react-router-dom` (RouterLink)
- `emptyCellValue` from `./cell-utils`

## Stories

File: `link-cell.stories.tsx` — Title: `"Components/DataTable/Cells/LinkCell"`

| Story | Description |
|-------|-------------|
| `Default` | Simple link with label |
| `WithoutLabel` | Displays the `to` path as text |
| `NullValue` | Renders em-dash |
| `InTable` | Full DataTable integration with `onRowClick` to demonstrate stopPropagation |
