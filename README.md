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
import { Alert, Avatar, Menu, Skeleton, Tooltip } from "@knkcs/anker/primitives";

// Higher-level composites (card, drawer, modal, stepper, table)
import { Card, Drawer, Modal, Stepper } from "@knkcs/anker/components";

// Small reusable units (persona, badges, search, datetime)
import { StatusBadge, Persona, SearchInput } from "@knkcs/anker/atoms";

// Form controls (React Hook Form + Zod)
import { InputField, ArrayField, FormField } from "@knkcs/anker/forms";

// Feedback patterns (confirm modal)
import { ConfirmModalProvider, useConfirmModal } from "@knkcs/anker/feedback";
```

## Brand Colors

The theme includes both **UI-optimized color scales** (primary, secondary, gray) and **exact brand guideline colors** from the knk Brand Guidelines (October 2021).

| Token | HEX | Use |
|-------|-----|-----|
| `primary.500` | `#2087d7` | UI blue — buttons, links, focus rings |
| `secondary.500` | `#e9580c` | UI orange — matches brand orange |
| `brand.blue` | `#004576` | Exact brand blue — logos, headers, branding |
| `brand.navy` | `#0f395d` | Dark blue variant |
| `brand.light-blue` | `#6fa7d1` | Light blue variant |
| `brand.orange` | `#e9580c` | Brand orange (same as secondary.500) |
| `brand.gold` | `#f4b235` | Brand gold accent |
| `brand.light-gray` | `#f2f2f2` | Brand neutral background |

The UI primary blue intentionally differs from the brand guideline blue. The brand blue (`#004576`) is a deep navy designed for print materials; the UI blue (`#2087d7`) is brighter for web accessibility and matches the existing Core application.

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
