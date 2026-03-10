# CLAUDE.md

This file provides guidance to Claude Code when working with the @knkcs/anker UI library.

## Project Overview

Anker is the shared UI component library for the knk software group, extracted and rebuilt from the knkCMS Core monolith. It provides design tokens, primitives, atoms, form controls, and feedback components used by all knkCMS microservices (Core, Shell, Odon, Template, and future services).

## Architecture

### Package Structure

Single npm package (`@knkcs/anker`) with subpath exports organized in six layers:

1. **`/theme`** — Chakra UI v3 design tokens, color scales, semantic tokens, shadows, typography, spacing, and 24 component recipes. Consumers use `<ChakraProvider value={system}>`.
2. **`/primitives`** — Thin wrappers around Chakra UI components with consistent defaults (Alert, Avatar, Menu, Tooltip, Switch, etc.). 13 components.
3. **`/components`** — Higher-level composites: Card, Drawer, Modal, Stepper, Table, Widget, FactBox. 10 components.
4. **`/atoms`** — Small reusable UI units: Persona, StatusBadge, TypeBadge, SearchInput, DateTime, EmptyState, Comment, Select, etc. 15 component groups.
5. **`/forms`** — Form controls built on React Hook Form + Zod: InputField, TextareaField, ArrayField, DatePickerField, CodeField, etc. 19 components.
6. **`/feedback`** — Feedback patterns: ConfirmModal with provider + `useConfirmModal` hook.

### Key Technology Choices

| Concern | Choice |
|---------|--------|
| UI framework | Chakra UI v3 (recipes, slot recipes, semantic tokens) |
| Icons | Lucide React (replacing FontAwesome from Core) |
| Form state | React Hook Form (replacing Formik from Core) |
| Validation | Zod (replacing Yup from Core) |
| Build | tsup (esbuild-based, ESM + CJS + .d.ts) |
| Docs | Storybook, deployed to GitHub Pages |
| Lint/format | Biome |
| Types | TypeScript strict mode |

### Directory Layout

```
src/
├── theme/           # Design tokens + recipes
│   ├── tokens/      # colors, semantic, shadows, spacing, radii, typography
│   ├── recipes/     # Chakra component recipes (24 files)
│   └── utils/       # Color manipulation helpers
├── primitives/      # Chakra wrappers (alert, avatar, menu, tooltip, etc.)
├── components/      # Card, Drawer, Modal, Stepper, Table, Widget, FactBox
├── atoms/           # Persona, StatusBadge, SearchInput, DateTime, Select, etc.
├── forms/           # React Hook Form controls (InputField, ArrayField, etc.)
├── feedback/        # ConfirmModal + provider
└── index.ts
stories/             # Storybook stories (mirrors src/ structure)
```

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Storybook dev server
npm run build        # Build library with tsup
npm run lint         # Lint with Biome
npm run lint:write   # Lint and auto-fix
npm run typecheck    # TypeScript checking (tsc --noEmit)
npm run test         # Run tests
```

## Design Principles

- **No domain coupling**: Components must not import from any service codebase (no @root/, no API calls, no service-specific types)
- **Token-first styling**: Use semantic tokens (bg-canvas, accent, border, etc.) instead of hardcoded colors
- **Props over i18n**: User-facing strings are props with English defaults, not i18n keys
- **Lucide icons only**: All icons use lucide-react. No FontAwesome.
- **React Hook Form**: Form controls use RHF Controller pattern. Provide ControlledFormField for non-RHF usage.
- **Accessibility**: All interactive components must have proper ARIA attributes
- **Composable over opinionated**: Prefer render props and slots over baked-in behavior (e.g., Modal accepts children, not a Formik form)

## Patterns

### Component File Structure

Each component follows this pattern:
```
component-name/
├── component-name.tsx    # Main component
├── types.ts              # Props interface (if complex)
├── index.ts              # Re-export
└── component-name.stories.tsx  # Storybook story
```

### Form Controls

Form controls follow the `*Field` naming convention and wrap RHF's Controller:
```tsx
// Example: InputField
import { Controller, useFormContext } from "react-hook-form";

interface InputFieldProps {
  name: string;
  label?: string;
  // ...
}
```

### Theme Recipes

Component recipes use Chakra v3's `defineRecipe` (single-part) or `defineSlotRecipe` (multi-part):
```tsx
import { defineRecipe } from "@chakra-ui/react";
export const buttonRecipe = defineRecipe({ ... });
```

## Peer Dependencies

Consuming projects must install:
- react >= 18
- react-dom >= 18
- @chakra-ui/react ^3.0.0
- react-hook-form ^7.0.0
- @hookform/resolvers ^3.0.0
- zod ^3.0.0
- react-router-dom ^6.0.0
- react-i18next >= 12
