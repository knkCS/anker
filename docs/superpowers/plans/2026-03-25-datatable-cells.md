# DataTable Cell Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 11 generic, reusable cell components + shared utilities for anker's DataTable.

**Architecture:** All cells live in `src/components/data-table/cells/`, share a `cell-utils.ts` for null handling and text utilities, and are exported through `data-table/index.ts` → `components/index.ts`. Each cell is a stateless React component that handles null → empty dash and renders formatted content.

**Tech Stack:** React, Chakra UI v3, dayjs (for DateCell), TanStack React Table (consumer-side)

**Spec:** `docs/superpowers/specs/2026-03-25-datatable-cells-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/data-table/cells/cell-utils.ts` | Create | `emptyCellValue`, `truncateText`, `pluralize` |
| `src/components/data-table/cells/truncated-text-cell.tsx` | Create | Text with optional truncation + title tooltip |
| `src/components/data-table/cells/number-cell.tsx` | Create | Locale-aware number formatting |
| `src/components/data-table/cells/boolean-cell.tsx` | Create | Boolean → Yes/No label |
| `src/components/data-table/cells/slug-cell.tsx` | Create | Monospace text |
| `src/components/data-table/cells/code-cell.tsx` | Create | Monospace + bg + truncation |
| `src/components/data-table/cells/url-cell.tsx` | Create | Clickable link |
| `src/components/data-table/cells/color-swatch-cell.tsx` | Create | Color circle + hex string |
| `src/components/data-table/cells/count-cell.tsx` | Create | Item count + pluralize |
| `src/components/data-table/cells/status-badge-cell.tsx` | Create | StatusBadge atom wrapper |
| `src/components/data-table/cells/action-cell.tsx` | Create | Row action icon buttons |
| `src/components/data-table/cells/date-cell.tsx` | Create | Formatted date + optional relative tooltip |
| `src/components/data-table/cells/index.ts` | Create | Barrel export |
| `src/components/data-table/cells/cells.stories.tsx` | Create | All cells in a DataTable story |
| `src/components/data-table/index.ts` | Modify | Add `export * from "./cells"` |
| `src/components/index.ts` | Modify | Add cell + util re-exports |

---

### Task 1: Foundation — cell utilities and barrel

**Files:**
- Create: `src/components/data-table/cells/cell-utils.ts`
- Create: `src/components/data-table/cells/index.ts` (empty barrel, will grow)

- [ ] **Step 1: Create cell-utils.ts**

```ts
/** Dash shown for null/undefined cell values. */
export const emptyCellValue = "—";

/** Truncate text to maxLength, appending "…" if exceeded. */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}…`;
}

/** Return singular or plural form based on count. */
export function pluralize(
	count: number,
	singular: string,
	plural: string,
): string {
	return count === 1 ? singular : plural;
}
```

- [ ] **Step 2: Create empty barrel index.ts**

```ts
export { emptyCellValue, pluralize, truncateText } from "./cell-utils";
```

- [ ] **Step 3: Wire up data-table/index.ts**

Add to `src/components/data-table/index.ts`:

```ts
export * from "./cells";
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/data-table/cells/cell-utils.ts src/components/data-table/cells/index.ts src/components/data-table/index.ts
git commit -m "feat(components): add DataTable cell utilities

Add emptyCellValue, truncateText, and pluralize shared utilities
for DataTable cell primitives.

Closes #9"
```

---

### Task 2: Simple text cells — TruncatedText, Number, Boolean, Slug

Each cell is one file + one commit. All follow the same null → dash pattern.

**Files:**
- Create: `src/components/data-table/cells/truncated-text-cell.tsx`
- Create: `src/components/data-table/cells/number-cell.tsx`
- Create: `src/components/data-table/cells/boolean-cell.tsx`
- Create: `src/components/data-table/cells/slug-cell.tsx`
- Modify: `src/components/data-table/cells/index.ts`

- [ ] **Step 1: Create truncated-text-cell.tsx**

```tsx
import type React from "react";
import { emptyCellValue, truncateText } from "./cell-utils";

export interface TruncatedTextCellProps {
	value: string | null | undefined;
	maxLength?: number;
}

export const TruncatedTextCell: React.FC<TruncatedTextCellProps> = ({
	value,
	maxLength,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const display =
		maxLength != null ? truncateText(value, maxLength) : value;
	return <span title={value}>{display}</span>;
};
TruncatedTextCell.displayName = "TruncatedTextCell";
```

- [ ] **Step 2: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { TruncatedTextCell, type TruncatedTextCellProps } from "./truncated-text-cell";
```

```bash
git add src/components/data-table/cells/truncated-text-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add TruncatedTextCell for DataTable

Closes #11"
```

- [ ] **Step 3: Create number-cell.tsx**

```tsx
import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface NumberCellProps {
	value: number | string | null | undefined;
	locale?: string;
}

export const NumberCell: React.FC<NumberCellProps> = ({ value, locale }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const num = Number(value);
	const display = Number.isNaN(num) ? String(value) : num.toLocaleString(locale);
	return <span>{display}</span>;
};
NumberCell.displayName = "NumberCell";
```

- [ ] **Step 4: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { NumberCell, type NumberCellProps } from "./number-cell";
```

```bash
git add src/components/data-table/cells/number-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add NumberCell for DataTable

Closes #12"
```

- [ ] **Step 5: Create boolean-cell.tsx**

```tsx
import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface BooleanCellProps {
	value: boolean | null | undefined;
	trueLabel?: string;
	falseLabel?: string;
}

export const BooleanCell: React.FC<BooleanCellProps> = ({
	value,
	trueLabel = "Yes",
	falseLabel = "No",
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return <span>{value ? trueLabel : falseLabel}</span>;
};
BooleanCell.displayName = "BooleanCell";
```

- [ ] **Step 6: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { BooleanCell, type BooleanCellProps } from "./boolean-cell";
```

```bash
git add src/components/data-table/cells/boolean-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add BooleanCell for DataTable

Closes #13"
```

- [ ] **Step 7: Create slug-cell.tsx**

```tsx
import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface SlugCellProps {
	value: string | null | undefined;
}

export const SlugCell: React.FC<SlugCellProps> = ({ value }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return (
		<span style={{ fontFamily: "var(--chakra-fonts-mono)" }}>{value}</span>
	);
};
SlugCell.displayName = "SlugCell";
```

- [ ] **Step 8: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { SlugCell, type SlugCellProps } from "./slug-cell";
```

```bash
git add src/components/data-table/cells/slug-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add SlugCell for DataTable

Closes #18"
```

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: No errors

---

### Task 3: Styled text cells — Code, Url, ColorSwatch, Count

**Files:**
- Create: `src/components/data-table/cells/code-cell.tsx`
- Create: `src/components/data-table/cells/url-cell.tsx`
- Create: `src/components/data-table/cells/color-swatch-cell.tsx`
- Create: `src/components/data-table/cells/count-cell.tsx`
- Modify: `src/components/data-table/cells/index.ts`

- [ ] **Step 1: Create code-cell.tsx**

```tsx
import type React from "react";
import { emptyCellValue, truncateText } from "./cell-utils";

export interface CodeCellProps {
	value: string | null | undefined;
	maxLength?: number;
}

export const CodeCell: React.FC<CodeCellProps> = ({
	value,
	maxLength = 80,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const display = truncateText(value, maxLength);
	return (
		<code
			title={value}
			style={{
				fontFamily: "monospace",
				fontSize: "0.85em",
				backgroundColor: "var(--chakra-colors-bg-subtle)",
				padding: "0.1em 0.4em",
				borderRadius: "var(--chakra-radii-sm)",
			}}
		>
			{display}
		</code>
	);
};
CodeCell.displayName = "CodeCell";
```

- [ ] **Step 2: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { CodeCell, type CodeCellProps } from "./code-cell";
```

```bash
git add src/components/data-table/cells/code-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add CodeCell for DataTable

Closes #15"
```

- [ ] **Step 3: Create url-cell.tsx**

```tsx
import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface UrlCellProps {
	value: string | null | undefined;
	label?: string;
}

export const UrlCell: React.FC<UrlCellProps> = ({ value, label }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return (
		<a
			href={value}
			target="_blank"
			rel="noopener noreferrer"
			title={value}
			style={{ color: "var(--chakra-colors-accent)" }}
		>
			{label || value}
		</a>
	);
};
UrlCell.displayName = "UrlCell";
```

- [ ] **Step 4: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { UrlCell, type UrlCellProps } from "./url-cell";
```

```bash
git add src/components/data-table/cells/url-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add UrlCell for DataTable

Closes #16"
```

- [ ] **Step 5: Create color-swatch-cell.tsx**

```tsx
import { Box, HStack } from "@chakra-ui/react";
import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface ColorSwatchCellProps {
	value: string | null | undefined;
}

export const ColorSwatchCell: React.FC<ColorSwatchCellProps> = ({ value }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return (
		<HStack gap={2}>
			<Box
				width="1rem"
				height="1rem"
				borderRadius="full"
				bg={value}
				borderWidth="1px"
				borderColor="border"
				flexShrink={0}
			/>
			<span>{value}</span>
		</HStack>
	);
};
ColorSwatchCell.displayName = "ColorSwatchCell";
```

- [ ] **Step 6: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { ColorSwatchCell, type ColorSwatchCellProps } from "./color-swatch-cell";
```

```bash
git add src/components/data-table/cells/color-swatch-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add ColorSwatchCell for DataTable

Closes #14"
```

- [ ] **Step 7: Create count-cell.tsx**

```tsx
import type React from "react";
import { emptyCellValue, pluralize } from "./cell-utils";

export interface CountCellProps {
	value: unknown[] | Record<string, unknown> | number | null | undefined;
	singular: string;
	plural: string;
	countFn?: (value: unknown) => number;
}

export const CountCell: React.FC<CountCellProps> = ({
	value,
	singular,
	plural,
	countFn,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;

	let count: number;
	if (countFn) {
		count = countFn(value);
	} else if (typeof value === "number") {
		count = value;
	} else if (Array.isArray(value)) {
		count = value.length;
	} else if (typeof value === "object") {
		count = Object.keys(value).length;
	} else {
		return <span>{emptyCellValue}</span>;
	}

	return (
		<span>
			{count} {pluralize(count, singular, plural)}
		</span>
	);
};
CountCell.displayName = "CountCell";
```

- [ ] **Step 8: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { CountCell, type CountCellProps } from "./count-cell";
```

```bash
git add src/components/data-table/cells/count-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add CountCell for DataTable

Closes #17"
```

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: No errors

---

### Task 4: Complex cells — StatusBadge, Action, Date

These cells depend on anker atoms/primitives.

**Files:**
- Create: `src/components/data-table/cells/status-badge-cell.tsx`
- Create: `src/components/data-table/cells/action-cell.tsx`
- Create: `src/components/data-table/cells/date-cell.tsx`
- Modify: `src/components/data-table/cells/index.ts`

- [ ] **Step 1: Create status-badge-cell.tsx**

```tsx
import type React from "react";
import { StatusBadge } from "../../../atoms/status-badge";
import { emptyCellValue } from "./cell-utils";

export interface StatusBadgeCellProps {
	value: string | null | undefined;
	colorMap?: Record<string, string>;
}

export const StatusBadgeCell: React.FC<StatusBadgeCellProps> = ({
	value,
	colorMap,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const color = colorMap?.[value] ?? "#808080";
	return <StatusBadge label={value} color={color} />;
};
StatusBadgeCell.displayName = "StatusBadgeCell";
```

- [ ] **Step 2: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { StatusBadgeCell, type StatusBadgeCellProps } from "./status-badge-cell";
```

```bash
git add src/components/data-table/cells/status-badge-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add StatusBadgeCell for DataTable

Closes #19"
```

- [ ] **Step 3: Create action-cell.tsx**

```tsx
import { HStack } from "@chakra-ui/react";
import type React from "react";
import { IconButton } from "../../../atoms/button";
import { Tooltip } from "../../../primitives/tooltip";

export interface ActionCellAction {
	icon: React.ElementType;
	label: string;
	onClick: () => void;
	variant?: string;
	colorPalette?: string;
	disabled?: boolean;
}

export interface ActionCellProps {
	actions: ActionCellAction[];
}

export const ActionCell: React.FC<ActionCellProps> = ({ actions }) => {
	return (
		<HStack gap={1}>
			{actions.map((action, index) => (
				<Tooltip key={`${action.label}-${index}`} content={action.label}>
					<IconButton
						aria-label={action.label}
						size="sm"
						variant={action.variant ?? "ghost"}
						colorPalette={action.colorPalette}
						onClick={action.onClick}
						disabled={action.disabled}
					>
						<action.icon size={16} />
					</IconButton>
				</Tooltip>
			))}
		</HStack>
	);
};
ActionCell.displayName = "ActionCell";
```

- [ ] **Step 4: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { ActionCell, type ActionCellAction, type ActionCellProps } from "./action-cell";
```

```bash
git add src/components/data-table/cells/action-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add ActionCell for DataTable

Closes #20"
```

- [ ] **Step 5: Create date-cell.tsx**

```tsx
import dayjs from "dayjs";
import type React from "react";
import { formatRelativeDateTime } from "../../../atoms/datetime/utils/relative-date-time-utils";
import { Tooltip } from "../../../primitives/tooltip";
import { emptyCellValue } from "./cell-utils";

export interface DateCellProps {
	value: string | Date | number | null | undefined;
	format?: string;
	showRelative?: boolean;
}

export const DateCell: React.FC<DateCellProps> = ({
	value,
	format = "MMM D, YYYY",
	showRelative,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;

	const formatted = dayjs(value).format(format);

	if (showRelative) {
		const relative = formatRelativeDateTime(value);
		return (
			<Tooltip content={relative}>
				<span>{formatted}</span>
			</Tooltip>
		);
	}

	return <span>{formatted}</span>;
};
DateCell.displayName = "DateCell";
```

- [ ] **Step 6: Add to barrel and commit**

Add to `cells/index.ts`:
```ts
export { DateCell, type DateCellProps } from "./date-cell";
```

```bash
git add src/components/data-table/cells/date-cell.tsx src/components/data-table/cells/index.ts
git commit -m "feat(components): add DateCell for DataTable

Closes #21"
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: No errors

---

### Task 5: Exports, story, and verification

**Files:**
- Modify: `src/components/index.ts`
- Create: `src/components/data-table/cells/cells.stories.tsx`

- [ ] **Step 1: Add cell re-exports to components/index.ts**

After the existing `// DataTable` section and before the `// Drawer` section, add:

```ts
// DataTable Cells
export type {
	ActionCellAction,
	ActionCellProps,
	BooleanCellProps,
	CodeCellProps,
	ColorSwatchCellProps,
	CountCellProps,
	DateCellProps,
	NumberCellProps,
	SlugCellProps,
	StatusBadgeCellProps,
	TruncatedTextCellProps,
	UrlCellProps,
} from "./data-table";
export {
	ActionCell,
	BooleanCell,
	CodeCell,
	ColorSwatchCell,
	CountCell,
	DateCell,
	NumberCell,
	SlugCell,
	StatusBadgeCell,
	TruncatedTextCell,
	UrlCell,
	emptyCellValue,
	pluralize,
	truncateText,
} from "./data-table";
```

- [ ] **Step 2: Create cells.stories.tsx**

Create `src/components/data-table/cells/cells.stories.tsx` showing all 11 cells in a DataTable. Define a sample data type with one column per cell type. Use story title `Components/DataTable/Cells`. Include:
- A Default story with 3-5 sample rows
- Each column uses one cell type
- Show null values in at least one row to verify empty dash rendering
- Use `satisfies Meta` pattern

- [ ] **Step 3: Run all checks**

Run:
1. `npm run typecheck` — no errors
2. `npm run lint` — no new errors
3. `npm run build` — success
4. `npm run test` — all pass

- [ ] **Step 4: Commit**

```bash
git add src/components/index.ts src/components/data-table/cells/cells.stories.tsx
git commit -m "feat(components): add DataTable cell exports and stories"
```

- [ ] **Step 5: Push**

```bash
git push origin main
```

This closes issues #9, #11-#21 via the individual commit messages.
