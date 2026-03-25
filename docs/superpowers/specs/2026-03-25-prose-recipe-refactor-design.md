# Prose Recipe Refactor — Design Spec

## Problem

`src/primitives/prose.tsx` uses the `chakra()` factory pattern — a Chakra v2 anti-pattern listed in CLAUDE.md. The factory bakes ~250 lines of typographic styles directly into the component, making them impossible for consumers to override via the theme system. Every other single-element styled component in the library uses `defineRecipe`.

## Goal

Refactor Prose from `chakra()` factory to `defineRecipe` + thin wrapper, matching the established pattern. Zero breaking changes to the public API.

## Design

### Approach

Recipe in its own file (`src/theme/recipes/prose.ts`) + thin wrapper in `src/primitives/prose.tsx`. This follows the same pattern as button, tooltip, tag, and all other single-part recipes.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/theme/recipes/prose.ts` | Create | `defineRecipe` with all styles and `inWhere()` helper |
| `src/theme/recipes/index.ts` | Modify | Add `prose` export |
| `src/theme/index.ts` | Modify | Register `prose` in `recipes` |
| `src/primitives/prose.tsx` | Rewrite | Thin wrapper using `useRecipe({ key: "prose" })` |
| `src/primitives/index.ts` | Modify | Add `ProseProps` type export |
| `CLAUDE.md` | Modify | Add `prose` to registered recipes list, fix recipe lists |

### Files that do NOT change

| File | Reason |
|------|--------|
| `src/primitives/prose.stories.tsx` | Public API is identical |
| `src/atoms/comment/comment.tsx` | `css` prop override still works |

### Recipe: `src/theme/recipes/prose.ts`

- Exports `proseTheme` (named export, consistent with `buttonTheme`, `tableTheme`, etc.)
- Contains the `inWhere()` helper function (module-private, used to generate CSS selector keys at import time)
- Contains `TRAILING_PSEUDO_REGEX` and `EXCLUDE_CLASSNAME` constants (module-private)
- Uses `defineRecipe` with:
  - `className: "prose"` for CSS cascade identification
  - `base: { ... }` — all ~50 `[inWhere("& p")]`-style entries moved verbatim from current `chakra()` call
  - `variants: { size: { md: { fontSize: "sm" }, lg: { fontSize: "md" } } }`
  - `defaultVariants: { size: "md" }`

**Note on computed selector keys:** The `inWhere()` function produces string keys like `& :where(p):not(.not-prose, .not-prose *)` at module load time. These are standard CSS selector strings used as computed property keys in the style object. `defineRecipe` accepts arbitrary selector keys in its `base` object — this is valid Panda CSS / Chakra v3 behavior. However, no existing recipe in this codebase currently uses computed keys, making Prose the first. Visual verification in Storybook is required to confirm identical rendering.

### Wrapper: `src/primitives/prose.tsx`

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

Key decisions:
- `"use client"` directive is dropped — `useRecipe` itself is marked `"use client"` inside Chakra's package, so the boundary is handled upstream. This matches how other primitives (e.g., `stepper.tsx` which uses `useSlotRecipe`) omit it.
- `ProseProps` extends `HTMLChakraProps<"div">` for full style prop forwarding
- Consumer `css` prop merges via Chakra's built-in css prop spreading
- `size` is destructured separately and passed to the recipe; all other props spread to the div

**Silent failure safeguard:** If the `prose` recipe is not registered in `theme/index.ts`, `useRecipe({ key: "prose" })` will silently return a no-op CVA function — the component renders with zero styles and no runtime error. The verification step must confirm styles are visually present, not just that the build passes.

### Registration

`src/theme/recipes/index.ts`:
```ts
export { proseTheme as prose } from "./prose";
```

`src/theme/index.ts` — add `prose` to the `recipes` object:
```ts
recipes: {
    button,
    container,
    prose,
    separator,
    // ...
},
```

### `src/primitives/index.ts`

Add `ProseProps` type export alongside the existing component export:
```ts
export type { ProseProps } from "./prose";
export { Prose } from "./prose";
```

### CLAUDE.md

Add `prose` to the "Registered recipes (single-part)" line and fix the recipe lists. `tsProperty` and `treeItem` are currently slot recipes (confirmed in `src/theme/index.ts`) but are incorrectly listed under single-part recipes in CLAUDE.md — fix this in the same commit:

Registered recipes (single-part):
```
`button`, `container`, `prose`, `separator`, `formLabel`, `textarea`, `tooltip`, `tsRadioCard`, `tag`
```

Registered slot recipes (multi-part):
```
`card`, `checkbox`, `comment`, `dialog`, `drawer`, `field`, `input`, `menu`, `modal`, `persona`, `popover`, `stepper`, `table`, `tabs`, `tsProperty`, `treeItem`
```

## Public API

No breaking changes. The component signature, props, and behavior are identical:

```tsx
// Before and after — same usage
<Prose size="lg" css={{ "& p": { fontSize: "inherit!important" } }}>
    <h1>Title</h1>
    <p>Content</p>
</Prose>
```

New addition: `ProseProps` type is now exported (previously no props type existed).

## Verification

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes
- Prose Storybook stories render identically (manual visual check — confirms recipe is resolving and computed selector keys work inside `defineRecipe`)
- Comment atom renders prose content identically (manual visual check)
- If styles are missing entirely, the recipe is not registered — `useRecipe({ key: "prose" })` returns an empty CVA function silently. Confirm styles are visually present, not just that the build passes.
