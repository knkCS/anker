# DataTable Cell Primitives — Design Spec

## Problem

Anker's DataTable provides the table infrastructure (sorting, pagination, selection, loading) but has no reusable cell renderers. Consumers must write their own `cell:` functions for every column, duplicating common patterns (truncated text, formatted numbers, dates, action buttons). Fieldkit has 23 spec-driven cells but they're coupled to fieldkit's `CellProps<S>` interface. The generic rendering logic needs to be extracted into anker.

## Goal

Add 11 generic, reusable cell components + 3 shared utilities to anker, co-located with DataTable. Cells are standalone React components usable as TanStack `cell` renderers. Each handles null/undefined → empty dash. No domain coupling, no fieldkit dependency.

## Design

### Location

```
src/components/data-table/cells/
├── index.ts                  # barrel export
├── cell-utils.ts             # truncateText, pluralize, emptyCellValue
├── truncated-text-cell.tsx
├── number-cell.tsx
├── boolean-cell.tsx
├── color-swatch-cell.tsx
├── code-cell.tsx
├── url-cell.tsx
├── count-cell.tsx
├── slug-cell.tsx
├── status-badge-cell.tsx
├── action-cell.tsx
├── date-cell.tsx
└── cells.stories.tsx
```

### Export chain

```
cells/index.ts → data-table/index.ts → components/index.ts → @knkcs/anker/components
```

Consumer usage:
```tsx
import { DataTable, TruncatedTextCell, ActionCell, emptyCellValue } from "@knkcs/anker/components";
```

### Shared utilities: `cell-utils.ts`

```ts
/** Dash shown for null/undefined values. */
export const emptyCellValue = "—";

/** Truncate text to maxLength, appending "…" if exceeded. */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}…`;
}

/** Return singular or plural form based on count. */
export function pluralize(count: number, singular: string, plural: string): string {
	return count === 1 ? singular : plural;
}
```

### Cell components

Every cell follows the same null-handling pattern:
```tsx
if (value == null) return <span>{emptyCellValue}</span>;
```

#### TruncatedTextCell (#11)

```tsx
interface TruncatedTextCellProps {
	value: string | null | undefined;
	maxLength?: number; // default: no truncation
}
```
Renders text. If `maxLength` set and exceeded, truncates with `…` and shows full text in `title` attribute.

#### NumberCell (#12)

```tsx
interface NumberCellProps {
	value: number | string | null | undefined;
	locale?: string; // default: undefined (browser locale)
}
```
Renders `Number(value).toLocaleString(locale)`. If `NaN`, renders raw string.

#### BooleanCell (#13)

```tsx
interface BooleanCellProps {
	value: boolean | null | undefined;
	trueLabel?: string;  // default: "Yes"
	falseLabel?: string; // default: "No"
}
```

#### ColorSwatchCell (#14)

```tsx
interface ColorSwatchCellProps {
	value: string | null | undefined; // hex color
}
```
Renders inline-flex: 1rem circular `<span>` with `background: value` + 1px border, followed by the color string.

#### CodeCell (#15)

```tsx
interface CodeCellProps {
	value: string | null | undefined;
	maxLength?: number; // default: 80
}
```
Monospace font, `bg-subtle` background, small padding, border-radius. Truncates at maxLength with `title` tooltip.

#### UrlCell (#16)

```tsx
interface UrlCellProps {
	value: string | null | undefined;
	label?: string; // display text, defaults to URL
}
```
Renders `<a href={value} target="_blank" rel="noopener noreferrer">`. Uses semantic `accent` color.

#### CountCell (#17)

```tsx
interface CountCellProps {
	value: unknown[] | Record<string, unknown> | number | null | undefined;
	singular: string;  // e.g. "item"
	plural: string;    // e.g. "items"
	countFn?: (value: unknown) => number; // custom count extraction
}
```
Extracts count from array (`.length`), object (`Object.keys().length`), or number (direct). Renders `{count} {pluralize(count, singular, plural)}`.

#### SlugCell (#18)

```tsx
interface SlugCellProps {
	value: string | null | undefined;
}
```
Monospace font, that's it.

#### StatusBadgeCell (#19)

```tsx
interface StatusBadgeCellProps {
	value: string | null | undefined;
	colorMap?: Record<string, string>; // value → color mapping
}
```
Uses anker's `StatusBadge` atom. Looks up color from `colorMap?.[value] ?? "#808080"` (gray fallback). The concrete fallback is required because `StatusBadge`'s `color` prop is non-optional and `color2k`'s `readableColor` will throw on `undefined`.

#### ActionCell (#20)

```tsx
interface ActionCellAction {
	icon: React.ElementType; // lucide-react icon component
	label: string;           // aria-label + tooltip text
	onClick: () => void;
	variant?: string;
	colorPalette?: string;
	disabled?: boolean;
}

interface ActionCellProps {
	actions: ActionCellAction[];
}
```
Renders `HStack` of individually `Tooltip`-wrapped `IconButton` components (one `Tooltip` per action, not one for the whole `HStack`). Each `IconButton` (from atoms) has `aria-label={action.label}`, `size="sm"`, `variant="ghost"`. Touch targets are handled by the button recipe's `::after` pseudo (44px minimum), so no additional size overrides needed.

#### DateCell (#21)

```tsx
interface DateCellProps {
	value: string | Date | number | null | undefined;
	format?: string;        // dayjs format, default: "MMM D, YYYY"
	showRelative?: boolean; // show relative time in tooltip
}
```
Formats with dayjs (already an anker dependency). If `showRelative`, wraps in `Tooltip` showing relative time via `formatRelativeDateTime` from `../../atoms/datetime/utils/relative-date-time-utils` — this reuses the existing utility which already extends the `relativeTime` plugin, avoiding duplication.

### Anker dependencies

| Cell | Import from |
|------|-------------|
| ColorSwatchCell | `@chakra-ui/react` (HStack, Box — layout only) |
| StatusBadgeCell | `../../atoms/status-badge` |
| ActionCell | `../../atoms/button` (IconButton), `../../primitives/tooltip` |
| DateCell | `../../primitives/tooltip`, `../../atoms/datetime/utils/relative-date-time-utils`, `dayjs` |
| All others | No anker dependencies beyond `cell-utils` |

### Stories: `cells.stories.tsx`

One story file showing all cells in a single DataTable. More useful than 11 isolated stories since cells are designed for table context. Story defines a sample data type with columns using each cell type.

Title: `Components/DataTable/Cells`

### Modified files

| File | Change |
|------|--------|
| `src/components/data-table/index.ts` | Add `export * from "./cells"` |
| `src/components/index.ts` | Add cell + util re-exports from `./data-table` |

**Note on exports:** `components/index.ts` uses explicit named exports (not wildcards), so each new cell component, props type, and utility must be explicitly re-exported. These re-export from `"./data-table"` (which itself re-exports from `"./cells"`), so there is only one source of truth — `cells/index.ts`.

### Conventions

- Every cell has `displayName` set
- Every props interface is exported
- No internal state — all cells are pure render functions
- Props use English defaults (e.g., `trueLabel = "Yes"`)
- No `React.FC` for cells that don't need it — use plain function components with explicit return types where simpler

## Public API

New exports from `@knkcs/anker/components`:
- 11 cell components + 11 props interfaces
- `ActionCellAction` type
- `emptyCellValue` constant
- `truncateText` function
- `pluralize` function

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Storybook: `Components/DataTable/Cells` story shows all 11 cells rendering correctly in a table
