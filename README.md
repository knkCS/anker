# @knkcs/anker

The UI component library for the knk software group. Provides a shared design system, primitives, atoms, form controls, and feedback components across all knkCMS microservices.

## Stack

- React 19 + TypeScript
- Chakra UI v3 (theme system, recipes, slot recipes)
- React Hook Form + Zod (form state + validation)
- Lucide React (icons)
- Storybook (documentation)

## Installation

```bash
npm install @knkcs/anker
```

## Usage

```tsx
import { Provider } from "@knkcs/anker/primitives";

function App() {
  return (
    <Provider>
      <YourApp />
    </Provider>
  );
}
```

The `Provider` defaults to anker's theme system. To override with a custom system, pass it via the `system` prop.

### Imports by layer

```tsx
// Design tokens and Chakra system
import system from "@knkcs/anker/theme";

// Chakra UI wrappers with consistent defaults
import { Accordion, Alert, Avatar, Breadcrumb, Menu, Popover, Skeleton, Spinner, Tooltip } from "@knkcs/anker/primitives";

// Higher-level composites (card, drawer, modal, pagination, stepper, table, timeline)
import { Card, Drawer, Modal, Pagination, Stepper, Timeline } from "@knkcs/anker/components";

// Small reusable units (persona, badges, search, datetime, clipboard, data list)
import { StatusBadge, Persona, SearchInput, ClipboardButton, DataList } from "@knkcs/anker/atoms";

// Form controls (React Hook Form + Zod)
import { InputField, ArrayField, FormField } from "@knkcs/anker/forms";

// Feedback patterns (confirm modal)
import { ConfirmModalProvider, useConfirmModal } from "@knkcs/anker/feedback";
```

## Using with Claude Code

If your consumer project uses Claude Code, add this line to your root `CLAUDE.md` to import anker's design-system rules automatically:

```
@node_modules/@knkcs/anker/CLAUDE-ANKER.md
```

Claude will then follow anker's design principles, token rules, and component conventions when assisting with your code.

## Brand Colors

The theme includes both **UI-optimized color scales** (primary, secondary, gray) and **exact brand guideline colors** from the knk Brand Guidelines (October 2021).

| Token | HEX | Use |
|-------|-----|-----|
| `primary.700` | `#134788` | **Action anchor** — buttons, links, focus rings (via the `accent` semantic token) |
| `primary.800` | `#0f395d` | Hover on primary; equals `brand.navy` |
| `secondary.600` | `#e9580c` | Brand orange anchor — reserved for branded moments, not standard CTAs |
| `brand.blue` | `#004576` | Exact brand-guideline blue — logos, headers, branding |
| `brand.navy` | `#0f395d` | Dark blue variant — equals `primary.800` |
| `brand.light-blue` | `#6fa7d1` | Light blue variant |
| `brand.orange` | `#e9580c` | Brand orange (same as `secondary.600`) |
| `brand.gold` | `#f4b235` | Brand gold accent |
| `brand.light-gray` | `#f2f2f2` | Brand neutral background |

The UI primary anchor (`primary.700` = `#134788`) is intentionally one step lighter than the brand-guideline blue (`brand.blue` = `#004576`), which reads as too heavy as a CTA on white surfaces. The brand-guideline navy (`#0f395d`, `brand.navy`) lives at `primary.800` and is used for hover states on primary actions. See `docs/design-system.md` for the full palette and semantic-token reference.

## Notable Component Props

| Component | Prop | Description |
|-----------|------|-------------|
| `Modal`, `Drawer` | `loading` | Shows spinner on save button during async operations |
| `Table`, `ArrayField` | `emptyState` | Content to display when there are no items |
| `Card` | `title`, `header`, `footer` | Slot props for structured card layout |
| `Persona` | `interactive` | Adds hover state and pointer cursor |
| `TypeBadge` | `colorPalette` | Chakra color palette for visual differentiation |
| `FormField` | `description` | Persistent description that shows alongside errors |

## Font

The theme uses [Inter](https://rsms.me/inter/) as its primary typeface. Install the variable font in your app:

```bash
npm install @fontsource-variable/inter
```

Then import it in your app entry point:

```tsx
import "@fontsource-variable/inter";
```

If Inter is not installed, the theme gracefully falls back to the system font stack (`-apple-system, system-ui, sans-serif`).

## Accessibility

- **Reduced motion** — The theme globally disables animations and transitions when the user prefers reduced motion (`prefers-reduced-motion: reduce`)
- **RTL-ready** — All components use logical CSS properties (`marginInlineStart`, `insetInlineEnd`) instead of physical direction properties
- **Form ARIA** — `FormField` automatically links inputs to helper text and errors via `aria-describedby`, errors are announced with `aria-live="polite"`
- **Touch targets** — All interactive elements meet the WCAG 44×44px minimum touch target size
- **Stepper** — Active step uses `aria-current="step"`

## Breaking Changes

- **FactBox**: The `childs` prop on `FactBoxAction` has been renamed to `items`

## Development

```bash
npm install
npm run dev          # Storybook dev server
npm run build        # Build library with tsup
npm run lint         # Biome
npm run typecheck    # tsc --noEmit
```

## Documentation

Interactive component docs are available at [https://knkcs.github.io/anker/](https://knkcs.github.io/anker/)

## License

Proprietary - knk Gruppe. See [LICENSE](LICENSE) for details.
