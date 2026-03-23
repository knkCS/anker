# NativeSelect Primitive Design

**GitHub Issue:** https://github.com/knkCS/anker/issues/2

**Goal:** Add a standalone `NativeSelect` primitive that collapses Chakra's `NativeSelect.Root/.Field/.Indicator` compound pattern into a single component for use outside form contexts.

**Approach:** Flat wrapper in `src/primitives/` following the Switch pattern — assembles the compound parts internally, exposes a simplified props interface with anker defaults.

---

## Context

Anker has two existing select components:
1. **`BaseSelect`** (atoms) — rich `chakra-react-select` wrapper for custom option rendering, search, multi-select
2. **`SelectField`** (forms) — wraps Chakra's `NativeSelect` compound component but requires react-hook-form context

The gap: no lightweight standalone native `<select>` for toolbars, filter bars, and inline controls. Consumers must import `NativeSelect.Root/.Field/.Indicator` from Chakra directly and wire up the compound pattern manually.

## Design

### Component API

```tsx
<NativeSelect size="sm" placeholder="All statuses" value={v} onChange={(e) => setV(e.target.value)}>
  <option value="draft">Draft</option>
  <option value="published">Published</option>
</NativeSelect>
```

### Props

The component accepts `NativeSelectRootProps` (which includes `size`, `variant`, `disabled`, `invalid`) merged with `NativeSelectFieldProps` (which includes `value`, `onChange`, `placeholder`, `children`, and all standard `<select>` HTML attributes except `disabled`/`required`/`readOnly`/`size` which are controlled by Root).

```tsx
import {
  NativeSelect as ChakraNativeSelect,
  type NativeSelectRootProps,
  type NativeSelectFieldProps,
} from "@chakra-ui/react";

export interface NativeSelectProps
  extends NativeSelectRootProps,
    Omit<NativeSelectFieldProps, "placeholder"> {
  /** Rendered as a disabled first <option> */
  placeholder?: string;
}
```

If there are prop name collisions between Root and Field, Root props win (they control the outer container's slot recipe — `size`, `variant`). In practice, most overlap is handled by Chakra's own `Omitted` type on Field (`disabled`, `required`, `readOnly`, `size` are already excluded from `NativeSelectFieldProps`). The `unstyled` prop appears in both Root and Field via `UnstyledProp` — the implementation destructures it and forwards it to Root only, which controls styling for the entire compound component. This is intentional — per-part unstyled control is not needed for this simplified wrapper.

### Implementation

```tsx
import type * as React from "react";

export const NativeSelect = function NativeSelect({
  ref,
  ...props
}: NativeSelectProps & { ref?: React.Ref<HTMLSelectElement> }) {
  const { size, variant, disabled, invalid, unstyled, placeholder, children, ...fieldProps } = props;

  return (
    <ChakraNativeSelect.Root
      size={size}
      variant={variant}
      disabled={disabled}
      invalid={invalid}
      unstyled={unstyled}
    >
      <ChakraNativeSelect.Field ref={ref} {...fieldProps}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </ChakraNativeSelect.Field>
      <ChakraNativeSelect.Indicator />
    </ChakraNativeSelect.Root>
  );
}
NativeSelect.displayName = "NativeSelect";
```

### Defaults

No default overrides needed. Chakra's `nativeSelect` slot recipe defaults (`size: "md"`, `variant: "outline"`) are appropriate for anker.

### No Theme Recipe Needed

Chakra v3 ships a built-in `nativeSelect` slot recipe. Anker doesn't need to override it — the default styling (outline border, chevron indicator) matches the input recipe's look and feel.

### File Structure

```
src/primitives/
  native-select.tsx           # NativeSelect component
  native-select.stories.tsx   # Stories
  index.ts                    # Updated barrel export
```

Follows the primitives pattern — single file per component, stories alongside.

### Stories

**`native-select.stories.tsx`** (`Primitives/NativeSelect`):
- **Default** — basic usage with a few options
- **Sizes** — xs through xl side by side
- **WithPlaceholder** — placeholder as disabled first option
- **Disabled** — disabled state

### Internal Refactor

`SelectField` (`src/forms/select-field.tsx`) can be updated to use the new primitive internally, replacing its manual `Root/Field/Indicator` assembly. Note: `SelectField` maps `readOnly` to `disabled` via `disabled={readOnly || disabled}` — this logic must be preserved when refactoring, not blindly delegated. The refactor replaces the compound boilerplate but keeps `SelectField`'s existing prop mapping.

### Barrel Export

Add to `src/primitives/index.ts`:

```ts
// NativeSelect
export type { NativeSelectProps } from "./native-select";
export { NativeSelect } from "./native-select";
```

Consumers import as:
```tsx
import { NativeSelect } from "@knkcs/anker/primitives";
```

## What We're NOT Doing

- **Not adding a theme recipe** — Chakra's built-in `nativeSelect` slot recipe is sufficient
- **Not replacing BaseSelect** — it serves a different purpose (rich custom options)
- **Not exposing compound parts** — consumers who need part-level control can use Chakra directly
- **Not adding `onChange` sugar** — keeping the standard `React.ChangeEvent<HTMLSelectElement>` signature (no `(value: string) => void` shorthand)
- **Not supporting `readOnly`** — native `<select>` elements don't honor `readOnly`; use `disabled` instead. `SelectField` maps `readOnly` to `disabled` internally for form context convenience, but that's a form-layer concern.
