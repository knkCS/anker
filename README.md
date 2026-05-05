# @knkcs/anker

The UI component library for the knk software group. Provides a shared design system, primitives, atoms, form controls, and feedback components across all knkCMS microservices.

## Stack

- React 19 + TypeScript
- Chakra UI v3 (theme system, recipes, slot recipes)
- React Hook Form + Zod (form state + validation)
- Lucide React (icons)
- Storybook (documentation)

## Setup for consumers

This is the canonical setup for any knkCMS solution adopting `@knkcs/anker`. Follow it in order — the rest of the README assumes you've done these steps.

### 1. Install

```bash
npm install @knkcs/anker
```

Install the peer dependencies (your project may already have them):

```bash
npm install react react-dom @chakra-ui/react react-hook-form @hookform/resolvers zod react-router-dom react-i18next next-themes lucide-react
```

`next-themes` powers light/dark mode. `lucide-react` provides icons (anker uses lucide exclusively — never FontAwesome).

### 2. Provider tree

Mount providers at the root of the React tree:

```tsx
import { Provider } from "@knkcs/anker/primitives";
import { ConfirmModalProvider } from "@knkcs/anker/feedback";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

export function Root({ children }) {
  return (
    <Provider>
      <I18nextProvider i18n={i18n}>
        <ConfirmModalProvider>
          {children}
        </ConfirmModalProvider>
      </I18nextProvider>
    </Provider>
  );
}
```

- `<Provider>` from `@knkcs/anker/primitives` mounts Chakra UI v3 with anker's theme system and wires up `next-themes` for light/dark mode.
- `<ConfirmModalProvider>` from `@knkcs/anker/feedback` enables `useConfirmModal()` for destructive-action confirmations.
- `<I18nextProvider>` is the consumer's choice — anker doesn't ship i18n. All anker user-facing strings are props with English defaults; consumers translate them at call sites.

### 3. Fonts

anker's theme assumes **Inter Tight** (UI) and **JetBrains Mono** (code, IDs, API keys). Load both via Google Fonts in your HTML:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
>
```

The theme falls back to `system-ui` and `ui-monospace` if the fonts aren't loaded, but the visual character of anker depends on Inter Tight — install it.

### 4. Theme

anker exports a default theme system that needs no configuration:

```tsx
import system from "@knkcs/anker/theme";
import { Provider } from "@knkcs/anker/primitives";

<Provider system={system}>{children}</Provider>
// or simply (uses the default automatically):
<Provider>{children}</Provider>
```

To customize tokens (fonts, radii, brand colors), use `createAnkerTheme(preset)`:

```tsx
import { createAnkerTheme, type ThemePreset } from "@knkcs/anker/theme";
import { Provider } from "@knkcs/anker/primitives";

const editorial: ThemePreset = {
  name: "editorial",
  fonts: { heading: "Georgia, serif" },
  radii: { sm: "0", md: "0", lg: "0", xl: "0", "2xl": "0" },
};

<Provider system={createAnkerTheme(editorial)}>{children}</Provider>
```

Presets override token layers (colors, semanticTokens, textStyles, fonts, radii, durations, easings) while preserving every component recipe and structural default. See `docs/design-system.md` for the full preset reference.

### 5. CLAUDE-ANKER.md (Claude Code consumers)

If your project uses Claude Code, `@`-import anker's design-system rules into your root `CLAUDE.md`:

```
@node_modules/@knkcs/anker/CLAUDE-ANKER.md
```

Claude will then follow anker's design principles, token rules, page templates, and component conventions when assisting with your code. The file is included in the npm tarball (no separate install).

### 6. Disabling parts of the system

You can opt out of anker subsystems if you don't need them:

- **Opt out of the sidebar / app shell** — use `<AuthPageTemplate>`, `<MarketingPageTemplate>`, or `<ErrorPage>` from `@knkcs/anker/templates`. They render no sidebar at all.
- **Opt out of the rail column** — pass `rail={null}` (or omit) to `<AppShell>`. The grid drops to two columns and the main column expands.
- **Opt out of dark mode** — don't wire `next-themes`. anker's tokens are defined for both modes, but if you never toggle the mode, only light renders.
- **Opt out of the confirm modal** — don't mount `<ConfirmModalProvider>`. This is only safe if your code never calls `useConfirmModal()` and you don't use any anker components that depend on it (currently none do — it's a consumer-only API).
- **Opt out of i18n** — use anker components without wrapping them in `<I18nextProvider>`. They'll fall back to English defaults.

### 7. Hello world

Minimal consumer app — sidebar, page-header, table.

```tsx
import { Provider } from "@knkcs/anker/primitives";
import { ConfirmModalProvider } from "@knkcs/anker/feedback";
import {
  AppShell,
  IndexPageTemplate,
} from "@knkcs/anker/templates";
import { Sidebar, Toolbar } from "@knkcs/anker/components";
import { Button } from "@knkcs/anker/atoms";
import { Users, Plus } from "lucide-react";

function App() {
  return (
    <Provider>
      <ConfirmModalProvider>
        <AppShell
          sidebar={
            <Sidebar storageKey="myapp-sidebar">
              <Sidebar.Header>
                <Sidebar.Logo wordmark="MyApp" />
              </Sidebar.Header>
              <Sidebar.Body>
                <Sidebar.Section label="Identity">
                  <Sidebar.Item icon={<Users size={16} />} active>
                    Users
                  </Sidebar.Item>
                </Sidebar.Section>
              </Sidebar.Body>
            </Sidebar>
          }
        >
          <IndexPageTemplate
            title="Users"
            subtitle="People with access to this workspace."
            actions={
              <Button colorPalette="primary" size="sm">
                <Plus size={14} /> Add user
              </Button>
            }
            toolbar={
              <Toolbar>
                <Toolbar.Search placeholder="Search…" value="" onChange={() => {}} />
                <Toolbar.Right>
                  <Toolbar.Count>0 users</Toolbar.Count>
                </Toolbar.Right>
              </Toolbar>
            }
          >
            {/* DataTable goes here */}
          </IndexPageTemplate>
        </AppShell>
      </ConfirmModalProvider>
    </Provider>
  );
}
```

This is the canonical wiring. Every list page in every knkCMS solution looks like this — that's the contract.

## Imports by layer

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

// Page-level templates (AppShell, IndexPageTemplate, …)
import { AppShell, IndexPageTemplate, DetailPageTemplate } from "@knkcs/anker/templates";
```

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

The theme uses **Inter Tight** (UI) and **JetBrains Mono** (code, IDs, API keys). See the "Setup for consumers → Fonts" section above for installation instructions. The theme falls back to `system-ui` and `ui-monospace` if the fonts aren't loaded, but Inter Tight is the visual character anker is designed around — install it.

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

Reference documents in this repo:

- [`docs/design-system.md`](docs/design-system.md) — visual language: tokens, typography, motion. Read first.
- [`docs/page-patterns.md`](docs/page-patterns.md) — page-level contract: app shell, templates, slot mechanism, authoring rules.
- [`CLAUDE-ANKER.md`](CLAUDE-ANKER.md) — design-system rules consumers `@`-import into their `CLAUDE.md`.

## License

Proprietary - knk Gruppe. See [LICENSE](LICENSE) for details.
