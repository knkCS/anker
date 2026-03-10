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
import system from "@knkcs/anker/theme";

function App() {
  return (
    <Provider value={system}>
      <YourApp />
    </Provider>
  );
}
```

### Imports by layer

```tsx
// Design tokens and Chakra system
import system from "@knkcs/anker/theme";

// Chakra UI wrappers with consistent defaults
import { Alert, Avatar, Menu, Tooltip } from "@knkcs/anker/primitives";

// Higher-level composites (card, drawer, modal, stepper, table)
import { Card, Drawer, Modal, Stepper } from "@knkcs/anker/components";

// Small reusable units (persona, badges, search, datetime)
import { StatusBadge, Persona, SearchInput } from "@knkcs/anker/atoms";

// Form controls (React Hook Form + Zod)
import { InputField, ArrayField, FormField } from "@knkcs/anker/forms";

// Feedback patterns (confirm modal)
import { ConfirmModalProvider, useConfirmModal } from "@knkcs/anker/feedback";
```

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
