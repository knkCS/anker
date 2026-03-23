# Button & IconButton Atoms Design

**GitHub Issue:** https://github.com/knkCS/anker/issues/1

**Goal:** Add general-purpose Button and IconButton atoms to anker so all knkcs products have consistent button defaults without importing directly from `@chakra-ui/react`.

**Approach:** Thin re-exports of Chakra's Button and IconButton with anker-specific default overrides. Full Chakra API remains available — no restricted prop interface, no maintenance of a parallel type system.

---

## Context

Anker's theme layer already defines a rich Button recipe (`src/theme/recipes/button.ts`) with custom variants (`primary`, `secondary`, `outline`, `ghost`, `link`, `link-gray`) and 5 sizes (`xs` through `xl`). Chakra's Button picks up this recipe automatically.

However:
1. **Discoverability** — CLAUDE.md in consumer projects says "never use Chakra directly", so developers don't know they can use Chakra's Button (which inherits anker's theme). There's no `@knkcs/anker/atoms` export for Button.
2. **Defaults** — The recipe defaults to `size: "lg"` and `variant: "solid"`, but most UI contexts want `md` and a neutral variant.
3. **IconButton defaults** — Chakra v3's IconButton is a thin wrapper around Button (zeroed padding), so it already inherits anker's button recipe variants. However, it still defaults to `variant: "solid"` which isn't ideal for icon-only buttons.

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

export const Button = ({
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  return <ChakraButton size="md" variant="secondary" ref={ref} {...props} />;
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

export const IconButton = ({
  ref,
  ...props
}: IconButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  return <ChakraIconButton size="md" variant="ghost" ref={ref} {...props} />;
};
IconButton.displayName = "IconButton";
```

### No IconButton Theme Recipe Needed

Chakra v3's `IconButton` is a `forwardRef` wrapper around `Button` with zeroed padding — it delegates entirely to the `button` recipe key. All of anker's button variants (`primary`, `secondary`, `outline`, `ghost`, `link`, `link-gray`) already work on IconButton out of the box. A separate `iconButton` recipe would be unreferenced and have no effect.

The atom's default override (`variant="ghost"`) is sufficient — no theme changes needed.

### File Structure

```
src/atoms/button/
  index.ts                    # barrel: exports Button, IconButton, ButtonProps, IconButtonProps
  button.tsx                  # Button atom
  icon-button.tsx             # IconButton atom
  button.stories.tsx          # Button stories
  icon-button.stories.tsx     # IconButton stories
```

Follows the established atom pattern (directory with index.ts barrel, component files, one stories file per component).

### Stories

Two stories files, one per component (consistent with existing atom pattern where each component has its own stories file):

**`button.stories.tsx`** (`Atoms/Button`):
- **Default** — Button with all variants side by side (`primary`, `secondary`, `outline`, `ghost`, `link`, `link-gray`)
- **Sizes** — all 5 sizes (xs through xl)
- **WithIcons** — Button with leading/trailing Lucide icon children
- **Loading** — loading state demonstration

**`icon-button.stories.tsx`** (`Atoms/IconButton`):
- **Default** — IconButton with all variants
- **Sizes** — all 5 sizes

### Internal Migration

Anker's own components currently import Button/IconButton from `@chakra-ui/react`. After adding the atoms, update these to use the new atoms:

- `src/components/modal.tsx`
- `src/components/drawer.tsx`
- `src/components/pagination.tsx`
- `src/atoms/comment/comment.tsx`
- `src/atoms/empty-state/empty-state.stories.tsx`

This ensures anker eats its own dog food and validates the atoms work in practice.

**Note on default overrides:** All internal usages pass variants/sizes explicitly — verified per file:
- `modal.tsx`: cancel `variant="outline"`, save `variant="solid" colorPalette="primary"`, close IconButton `variant="ghost" size="sm"` — all explicit
- `drawer.tsx`: close `variant="ghost" size="sm"`, save `variant="outline" colorPalette="primary" size="sm"` — all explicit
- `pagination.tsx`: nav IconButtons `variant="ghost" size="sm"`, page Buttons `variant="solid"/"ghost" size="sm"` — all explicit
- `comment.tsx`: CommentAction sets `variant="outline" size="xs"` — explicit

No component relies on Chakra's implicit defaults, so the new anker defaults won't break anything.

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
