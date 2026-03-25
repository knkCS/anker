# Prose Recipe Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Prose from `chakra()` factory to `defineRecipe` + thin wrapper, eliminating the last Chakra v2 anti-pattern in the codebase.

**Architecture:** Extract all styles and the `inWhere()` helper into a `defineRecipe` in `src/theme/recipes/prose.ts`, register it in the theme system, and rewrite `src/primitives/prose.tsx` as a ~15-line wrapper using `useRecipe({ key: "prose" })`. Zero breaking changes.

**Tech Stack:** Chakra UI v3 (`defineRecipe`, `useRecipe`), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-25-prose-recipe-refactor-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/theme/recipes/prose.ts` | Create | `defineRecipe` with `inWhere()` helper and all typographic styles |
| `src/theme/recipes/index.ts` | Modify (after line 13) | Add `prose` barrel export |
| `src/theme/index.ts` | Modify (import block + recipes object) | Import and register `prose` in `recipes` |
| `src/primitives/prose.tsx` | Rewrite | Thin wrapper: `useRecipe` + `chakra.div` |
| `src/primitives/index.ts` | Modify (line 99) | Add `ProseProps` type export |
| `CLAUDE.md` | Modify (lines 197-201) | Fix recipe lists |

---

### Task 1: Create the prose recipe

**Files:**
- Create: `src/theme/recipes/prose.ts`

- [ ] **Step 1: Create the recipe file**

Create `src/theme/recipes/prose.ts` with the full content. Move the `inWhere()` helper, constants, and all styles from `src/primitives/prose.tsx` into a `defineRecipe`:

```ts
import { defineRecipe } from "@chakra-ui/react";

const TRAILING_PSEUDO_REGEX = /(::?[\w-]+(?:\([^)]*\))?)+$/;
const EXCLUDE_CLASSNAME = ".not-prose";
function inWhere<T extends string>(selector: T): T {
	const rebuiltSelector = selector.startsWith("& ")
		? selector.slice(2)
		: selector;
	const match = selector.match(TRAILING_PSEUDO_REGEX);
	const pseudo = match ? match[0] : "";
	const base = match ? selector.slice(0, -match[0].length) : rebuiltSelector;
	return `& :where(${base}):not(${EXCLUDE_CLASSNAME}, ${EXCLUDE_CLASSNAME} *)${pseudo}` as T;
}

export const proseTheme = defineRecipe({
	className: "prose",
	base: {
		color: "fg.muted",
		maxWidth: "65ch",
		fontSize: "sm",
		lineHeight: "1.7em",
		// ... ALL ~50 [inWhere("& ...")] entries verbatim from current prose.tsx lines 23–272 ...
	},
	variants: {
		size: {
			md: {
				fontSize: "sm",
			},
			lg: {
				fontSize: "md",
			},
		},
	},
	defaultVariants: {
		size: "md",
	},
});
```

The `base` object is copied verbatim from the current `chakra("div", { base: { ... } })` call in `src/primitives/prose.tsx` lines 18–273. Do not modify any style values — exact copy.

- [ ] **Step 2: Verify the file compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/theme/recipes/prose.ts
git commit -m "feat(theme): add prose defineRecipe with typographic styles"
```

---

### Task 2: Register the recipe in the theme

**Files:**
- Modify: `src/theme/recipes/index.ts` (add line after line 13)
- Modify: `src/theme/index.ts` (add to `recipes` object at line 98)

- [ ] **Step 1: Add prose export to recipes barrel**

In `src/theme/recipes/index.ts`, add after the `popover` export (line 13):

```ts
export { proseTheme as prose } from "./prose";
```

- [ ] **Step 2: Add `prose` to the import block in `src/theme/index.ts`**

In `src/theme/index.ts`, add `prose` to the destructured import from `"./recipes"` (alphabetically, after `popover`):

```ts
import {
	button,
	card,
	checkbox,
	comment,
	container,
	dialog,
	drawer,
	formLabel,
	input,
	menu,
	modal,
	persona,
	popover,
	prose,
	separator,
	stepper,
	table,
	tabs,
	tag,
	textarea,
	tooltip,
	treeItem,
	tsProperty,
	tsRadioCard,
} from "./recipes";
```

- [ ] **Step 3: Add `prose` to the `recipes` object**

In the same file, add `prose` to the `recipes` object (after `container`):

```ts
recipes: {
	button,
	container,
	prose,
	separator,
	formLabel,
	textarea,
	tooltip,
	tsRadioCard,
	tag,
},
```

- [ ] **Step 4: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/theme/recipes/index.ts src/theme/index.ts
git commit -m "feat(theme): register prose recipe in theme system"
```

---

### Task 3: Rewrite the Prose wrapper

**Files:**
- Rewrite: `src/primitives/prose.tsx`
- Modify: `src/primitives/index.ts` (line 99)

- [ ] **Step 1: Rewrite prose.tsx**

Replace the entire content of `src/primitives/prose.tsx` with:

```tsx
import { chakra, type HTMLChakraProps, useRecipe } from "@chakra-ui/react";
import type React from "react";

export interface ProseProps extends HTMLChakraProps<"div"> {
	size?: "md" | "lg";
}

export const Prose = ({
	ref,
	size,
	...props
}: ProseProps & { ref?: React.Ref<HTMLDivElement> }) => {
	const recipe = useRecipe({ key: "prose" });
	const styles = recipe({ size });
	return <chakra.div ref={ref} css={styles} {...props} />;
};
Prose.displayName = "Prose";
```

- [ ] **Step 2: Add ProseProps type export to primitives index**

In `src/primitives/index.ts`, change the Prose export section (line 99) from:

```ts
// Prose
export { Prose } from "./prose";
```

to:

```ts
// Prose
export type { ProseProps } from "./prose";
export { Prose } from "./prose";
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No new errors (pre-existing warnings are acceptable)

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: Build success for all 6 entry points

- [ ] **Step 6: Run tests**

Run: `npm run test`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/primitives/prose.tsx src/primitives/index.ts
git commit -m "refactor(primitives): rewrite Prose to use theme recipe instead of chakra() factory"
```

---

### Task 4: Update CLAUDE.md recipe lists

**Files:**
- Modify: `CLAUDE.md` (lines 197-201)

- [ ] **Step 1: Fix the recipe lists**

In `CLAUDE.md`, replace lines 197-201:

From:
```
### Registered recipes (single-part)
`button`, `container`, `separator`, `formLabel`, `textarea`, `tooltip`, `tsRadioCard`, `tsProperty`, `treeItem`, `tag`

### Registered slot recipes (multi-part)
`card`, `checkbox`, `comment`, `dialog`, `drawer`, `field` (inline in theme/index.ts), `input`, `menu`, `modal`, `persona`, `popover`, `stepper`, `table`, `tabs`
```

To:
```
### Registered recipes (single-part)
`button`, `container`, `prose`, `separator`, `formLabel`, `textarea`, `tooltip`, `tsRadioCard`, `tag`

### Registered slot recipes (multi-part)
`card`, `checkbox`, `comment`, `dialog`, `drawer`, `field` (inline in theme/index.ts), `input`, `menu`, `modal`, `persona`, `popover`, `stepper`, `table`, `tabs`, `tsProperty`, `treeItem`
```

Changes:
- Added `prose` to single-part recipes
- Moved `tsProperty` and `treeItem` from single-part to slot recipes (they are `defineSlotRecipe` in the code)

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add prose recipe and fix recipe list classification in CLAUDE.md"
```

---

### Task 5: Visual verification

- [ ] **Step 1: Start Storybook**

Run: `npm run dev`

- [ ] **Step 2: Verify Prose stories**

Open `http://localhost:6006` and navigate to **Primitives > Prose**. Verify:
- Default story: headings, paragraphs, links, bold, italic, code, lists, blockquotes, and pre blocks all render with correct typography
- Large story: renders with larger base font size

If styles are completely missing (plain unstyled text), the recipe is not registered — go back to Task 2 and verify `prose` is in the `recipes` object in `theme/index.ts`.

- [ ] **Step 3: Verify Comment atom**

Navigate to **Atoms > Comment**. Verify prose content inside comments renders with proper typography and that the Comment's `css` overrides (font size inheritance, first/last child margins) still apply.

- [ ] **Step 4: Stop Storybook and mark complete**

Ctrl+C to stop the dev server. All verification complete.
