# Button & IconButton Atoms Design

**GitHub Issue:** https://github.com/knkCS/anker/issues/1

**Goal:** Add general-purpose Button and IconButton atoms to anker so all knkcs products have consistent button defaults without importing directly from `@chakra-ui/react`.

**Approach:** Thin re-exports of Chakra's Button and IconButton with anker-specific default overrides. Full Chakra API remains available — no restricted prop interface, no maintenance of a parallel type system. A new IconButton theme recipe ensures visual consistency with the existing Button recipe.

---

## Context

Anker's theme layer already defines a rich Button recipe (`src/theme/recipes/button.ts`) with custom variants (`primary`, `secondary`, `outline`, `ghost`, `link`, `link-gray`) and 5 sizes (`xs` through `xl`). Chakra's Button picks up this recipe automatically.

However:
1. **Discoverability** — CLAUDE.md in consumer projects says "never use Chakra directly", so developers don't know they can use Chakra's Button (which inherits anker's theme). There's no `@knkcs/anker/atoms` export for Button.
2. **Defaults** — The recipe defaults to `size: "lg"` and `variant: "solid"`, but most UI contexts want `md` and a neutral variant.
3. **IconButton gap** — No IconButton recipe exists in the theme. IconButton uses Chakra's unstyled defaults, so it doesn't match anker's Button variants.

## Design

### Button Atom

Re-exports Chakra's `Button` with overridden defaults:

| Prop | Chakra/Recipe Default | Anker Default | Rationale |
|------|----------------------|---------------|-----------|
| `size` | `lg` | `md` | Most UI contexts use medium |
| `variant` | `solid` | `secondary` | Primary actions should be explicit |

All of Chakra's `ButtonProps` pass through unchanged. No custom props, no restricted types.

```tsx
import { Button as ChakraButton, type ButtonProps } from "@chakra-ui/react";

export type { ButtonProps };

export const Button = (props: ButtonProps) => {
  return <ChakraButton size="md" variant="secondary" {...props} />;
};
Button.displayName = "Button";
```

### IconButton Atom

Re-exports Chakra's `IconButton` with overridden defaults:

| Prop | Chakra Default | Anker Default | Rationale |
|------|---------------|---------------|-----------|
| `size` | `md` | `md` | Consistent with Button |
| `variant` | `solid` | `ghost` | Icon-only buttons are almost always ghost (menu triggers, close, nav arrows) |

```tsx
import { IconButton as ChakraIconButton, type IconButtonProps } from "@chakra-ui/react";

export type { IconButtonProps };

export const IconButton = (props: IconButtonProps) => {
  return <ChakraIconButton size="md" variant="ghost" {...props} />;
};
IconButton.displayName = "IconButton";
```

### IconButton Theme Recipe

New file `src/theme/recipes/icon-button.ts` that mirrors the Button recipe's variant definitions. This ensures IconButton picks up the same `primary`, `secondary`, `outline`, `ghost`, `link` styling as Button.

The recipe shares the same variant styles as the Button recipe (focus ring, disabled state, hover/active states per variant). Size definitions match Button's sizes.

Registered in `src/theme/index.ts` alongside the existing `button` recipe:

```ts
recipes: {
  button,
  iconButton, // new
  // ...existing recipes
}
```

### File Structure

```
src/atoms/button/
  index.ts              # barrel: exports Button, IconButton, ButtonProps, IconButtonProps
  button.tsx            # Button atom
  icon-button.tsx       # IconButton atom
  button.stories.tsx    # Storybook stories for both

src/theme/recipes/
  icon-button.ts        # new IconButton recipe
```

Follows the established atom pattern (directory with index.ts barrel, component files, stories).

### Stories

Single stories file `button.stories.tsx` under `Atoms/Button`:

- **Default** — Button with all variants side by side
- **Sizes** — all 5 sizes (xs through xl)
- **WithIcons** — Button with leading/trailing Lucide icon children
- **Loading** — loading state demonstration
- **IconButtonVariants** — IconButton with all variants
- **IconButtonSizes** — all 5 sizes

### Internal Migration

Anker's own components currently import Button/IconButton from `@chakra-ui/react`. After adding the atoms, update these to use the new atoms:

- `src/components/modal.tsx`
- `src/components/drawer.tsx`
- `src/components/pagination.tsx`
- `src/atoms/comment/comment.tsx`
- `src/atoms/empty-state/empty-state.stories.tsx`

This ensures anker eats its own dog food and validates the atoms work in practice.

**Note on default overrides:** Internal components that rely on specific variants/sizes already pass them explicitly (e.g., Modal's save button uses `variant="solid" colorPalette="primary"`), so changing the defaults won't break them. Only components relying on Chakra's implicit defaults need verification — inspect each during migration.

### Barrel Export

Add to `src/atoms/index.ts`:

```ts
export { Button, type ButtonProps, IconButton, type IconButtonProps } from "./button";
```

Consumers import as:
```tsx
import { Button, IconButton } from "@knkcs/anker/atoms";
```

## What We're NOT Doing

- **Not changing Action atoms** — they serve a different purpose (specialized drag/edit/remove behaviors with custom Box-based rendering)
- **Not restricting the Chakra API** — full props pass-through, no custom prop interface
- **Not creating a separate export path** — Button/IconButton live in `@knkcs/anker/atoms` alongside everything else
- **Not adding convenience props** (leftIcon, rightIcon) — Chakra v3 uses children for icon placement, which is simpler
