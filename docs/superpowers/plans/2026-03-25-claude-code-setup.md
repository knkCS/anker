# Claude Code Team Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Claude Code for team-wide use on the @knkcs/anker UI library with permissions, auto-format hooks, pre-commit quality gates, and Chakra v3 reference documentation.

**Architecture:** Four deliverables — settings.json (permissions + hooks), a hook script (pre-commit gate), CLAUDE.md enhancements (anti-patterns + scaffolding + token reference), and a standalone Chakra v3 reference document. No tests needed — this is configuration and documentation.

**Tech Stack:** Claude Code hooks (JSON config + bash scripts), Markdown documentation, jq for JSON parsing in hooks.

**Spec:** `docs/superpowers/specs/2026-03-25-claude-code-setup-design.md`

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Replace | `.claude/settings.json` | Permissions, attribution, hook definitions |
| Create | `.claude/hooks/pre-commit-gate.sh` | Bash script that gates git commits on typecheck + lint |
| Edit | `CLAUDE.md` | Add Chakra v3 anti-patterns, scaffolding checklist, token/recipe reference |
| Create | `docs/chakra-v3-reference.md` | Deep Chakra v3 patterns reference for this repo |

---

### Task 1: Configure `.claude/settings.json`

**Files:**
- Replace: `.claude/settings.json`

- [ ] **Step 1: Write the settings.json file**

Replace the entire file with:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run lint:write)",
      "Bash(npm run typecheck)",
      "Bash(npm run build)",
      "Bash(npm run test)",
      "Bash(npm run test:watch)",
      "Bash(npx biome check *)",
      "Bash(npx biome check --write *)"
    ]
  },
  "attribution": {
    "commit": ""
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'INPUT=$(cat); FILE=$(echo \"$INPUT\" | jq -r \".tool_input.file_path\"); [[ \"$FILE\" =~ \\.(ts|tsx)$ ]] && npx biome check --write \"$FILE\" || true'"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/pre-commit-gate.sh\""
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Verify the JSON is valid**

Run: `cat .claude/settings.json | jq .`
Expected: Pretty-printed JSON with no errors.

- [ ] **Step 3: Commit**

```bash
git add .claude/settings.json
git commit -m "feat(claude): configure permissions, attribution, and hooks

Pre-approve lint/build/test/typecheck commands. Add PostToolUse hook
for auto-formatting with Biome and PreToolUse hook for pre-commit
quality gate."
```

---

### Task 2: Create pre-commit gate hook script

**Files:**
- Create: `.claude/hooks/pre-commit-gate.sh`

- [ ] **Step 1: Create the hooks directory and script**

Create `.claude/hooks/pre-commit-gate.sh` with:

```bash
#!/bin/bash
# Pre-commit quality gate for Claude Code.
# Runs typecheck and lint before any `git commit` command.
# Exit 2 blocks the commit; stderr is shown to Claude as feedback.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

# Only gate git commit commands
if echo "$COMMAND" | grep -qE '^git commit'; then
  echo "Running typecheck..." >&2
  npm run typecheck >&2 || {
    echo "Typecheck failed — commit blocked" >&2
    exit 2
  }

  echo "Running lint..." >&2
  npm run lint >&2 || {
    echo "Lint failed — commit blocked" >&2
    exit 2
  }
fi

exit 0
```

- [ ] **Step 2: Make the script executable**

Run: `chmod +x .claude/hooks/pre-commit-gate.sh`

- [ ] **Step 3: Verify the script is executable**

Run: `ls -la .claude/hooks/pre-commit-gate.sh`
Expected: `-rwxr-xr-x` permissions.

- [ ] **Step 4: Verify the script handles non-commit commands gracefully**

Run: `echo '{"tool_input":{"command":"ls -la"}}' | bash .claude/hooks/pre-commit-gate.sh; echo "exit: $?"`
Expected: `exit: 0` (non-commit commands pass through).

- [ ] **Step 5: Commit**

```bash
git add .claude/hooks/pre-commit-gate.sh
git commit -m "feat(claude): add pre-commit gate hook script

Blocks git commits when typecheck or lint fails. Uses jq to
extract the command from Claude Code's stdin JSON payload."
```

---

### Task 3: Add Chakra v3 anti-patterns and scaffolding to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (insert after the "Theme Recipes" subsection, before "Breaking Changes")

- [ ] **Step 1: Add the Chakra v3 Anti-Patterns section**

Insert the following after the closing code fence of the "Theme Recipes" subsection, immediately before the `## Breaking Changes` heading. Also fix the existing example in "Theme Recipes" — change `buttonRecipe` to `buttonTheme` to match the actual export name in `src/theme/recipes/button.ts`:

```markdown
## Chakra v3 Anti-Patterns

This project uses Chakra UI v3. Never suggest v2 patterns:

| Never use (Chakra v2) | Use instead (Chakra v3) |
|---|---|
| `extendTheme()` | `createSystem(defaultConfig, { theme: {...} })` |
| `useStyleConfig()` / `useMultiStyleConfig()` | `useRecipe({ key })` / `useSlotRecipe({ key })` |
| `chakra()` factory for styled components | `defineRecipe()` / `defineSlotRecipe()` |
| `<ChakraProvider theme={theme}>` | `<ChakraProvider value={system}>` |
| `useColorModeValue(light, dark)` | `{ base: light, _dark: dark }` in tokens |
| `sx` prop for theme-level styling | Recipes + semantic tokens |
| `colorScheme` prop | `colorPalette` prop |
| `styleConfig` in theme | `recipes` / `slotRecipes` in system theme |
| Physical CSS props (`ml`, `mr`, `right`, `left`) | Logical CSS (`marginInlineStart`, `marginInlineEnd`, `insetInlineStart`, `insetInlineEnd`) |

Additional rules:
- Read `docs/chakra-v3-reference.md` before creating or modifying any theme recipe, token, or Chakra wrapper component
- Never add `prefers-reduced-motion` media queries — the theme handles this globally via `_motionReduce`
- Never import from `@chakra-ui/react` directly in atoms/components/forms if a primitives wrapper exists — use the wrapper instead
```

- [ ] **Step 2: Add the Component Scaffolding Checklist section**

Insert immediately after the anti-patterns section:

```markdown
## Component Scaffolding Checklist

### Primitive (thin Chakra wrapper)
1. Create `src/primitives/{name}.tsx` — wrap Chakra's namespaced API (e.g., `ChakraComponent.Root`, `.Content`, `.Trigger`)
2. Export a simplified props interface that surfaces the most-used Chakra props
3. Set `displayName` — e.g., `Component.displayName = "Component"`
4. Create `src/primitives/{name}.stories.tsx` — title: `"Primitives/{Name}"`
5. Add export to `src/primitives/index.ts` — both type and component
6. If a recipe is needed, create `src/theme/recipes/{name}.ts` and register in `src/theme/index.ts`

### Atom (small reusable UI unit)
1. Create directory `src/atoms/{name}/`
2. Create `src/atoms/{name}/{name}.tsx` — component with defaults, set `displayName`
3. Create `src/atoms/{name}/index.ts` — re-export component and types
4. Create `src/atoms/{name}/{name}.stories.tsx` — title: `"Atoms/{Name}"`
5. Add export to `src/atoms/index.ts`

### Component (higher-level composite)
- Simple: flat file at `src/components/{name}.tsx` + `src/components/{name}.stories.tsx`
- Complex (with hooks/subcomponents): directory at `src/components/{name}/` with `index.ts`, `{name}.tsx`, `use-{name}.tsx`, `{name}.stories.tsx`
- Add export to `src/components/index.ts`

### Form field (RHF wrapper)
1. Create `src/forms/{name}-field.tsx` — wrap `FormField<T>` with Controller render prop
2. Accept `FieldValues` generic, spread field props + `aria-describedby`
3. Set `displayName` via cast: `(Component as { displayName?: string }).displayName = "Name"`
4. Create `src/forms/{name}-field.stories.tsx` — include `FormProvider` decorator with `useForm`
5. Add export to `src/forms/index.ts`

### All layers
- Every exported component must have `displayName` set. For generic function components (e.g., form fields with `<T extends FieldValues>`), use the cast pattern: `(Component as { displayName?: string }).displayName = "Name"`
- Props interfaces must be exported alongside components
- Stories must include Default + at least one variant story
- Use `satisfies Meta<typeof Component>` in story meta
```

- [ ] **Step 3: Add the Semantic Token & Recipe Quick Reference section**

Insert immediately after the scaffolding section:

```markdown
## Semantic Token & Recipe Quick Reference

### Available semantic tokens (use instead of hardcoded colors)

**Backgrounds:** `bg-canvas`, `bg-surface`, `bg-subtle`, `bg-muted`, `bg-accent`, `bg-accent-subtle`, `bg-accent-muted`

**Text:** `default`, `inverted`, `emphasized`, `muted`, `subtle`, `on-accent`, `on-accent-muted`, `on-accent-subtle`

**Interactive:** `accent`, `border`, `success`, `error`

**Color palette tokens** (per-palette): `{palette}.contrast`, `{palette}.fg`, `{palette}.subtle`, `{palette}.muted`, `{palette}.emphasized`, `{palette}.solid`, `{palette}.focusRing`, `{palette}.border`

### Registered recipes (single-part)
`button`, `container`, `separator`, `formLabel`, `textarea`, `tooltip`, `tsRadioCard`, `tsProperty`, `treeItem`, `tag`

### Registered slot recipes (multi-part)
`card`, `checkbox`, `comment`, `dialog`, `drawer`, `field` (inline in theme/index.ts), `input`, `menu`, `modal`, `persona`, `popover`, `stepper`, `table`, `tabs`
```

- [ ] **Step 4: Verify CLAUDE.md renders correctly**

Run: `head -200 CLAUDE.md` and visually verify the new sections are in place and properly formatted.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): add Chakra v3 anti-patterns, scaffolding checklist, and token reference

Add three new sections to CLAUDE.md:
- Chakra v3 anti-patterns table (v2 vs v3 patterns)
- Component scaffolding checklist per layer
- Semantic token and recipe quick reference"
```

---

### Task 4: Create Chakra v3 reference document

**Files:**
- Create: `docs/chakra-v3-reference.md`

- [ ] **Step 1: Write the reference document**

Create `docs/chakra-v3-reference.md` with the following content. This is the deep reference that CLAUDE.md points to via the rule "Read `docs/chakra-v3-reference.md` before creating or modifying any theme recipe, token, or Chakra wrapper component."

```markdown
# Chakra v3 Reference — @knkcs/anker

This document describes how anker uses Chakra UI v3. Read this before creating or modifying any theme recipe, token, or Chakra wrapper component.

## System Setup

The theme system is created in `src/theme/index.ts`:

​```tsx
import { createSystem, defaultConfig } from "@chakra-ui/react";

const system = createSystem(defaultConfig, {
  globalCss: { /* ... */ },
  theme: {
    tokens: { colors, durations, easings, fonts, spacing, radii, zIndex },
    textStyles,
    semanticTokens,
    recipes: { button, container, separator, formLabel, textarea, tooltip, ... },
    slotRecipes: { card, checkbox, dialog, drawer, field, input, menu, modal, ... },
  },
});

export default system;
​```

The provider in `src/primitives/provider.tsx` wraps `ChakraProvider` with `value={system}`:

​```tsx
<ChakraProvider value={system ?? defaultSystem}>
  <ColorModeProvider {...props} />
</ChakraProvider>
​```

## Recipe Patterns

### Single-part recipe (`defineRecipe`)

Used for components with a single DOM element or where all styling applies to the root.

Registered: `button`, `container`, `separator`, `formLabel`, `textarea`, `tooltip`, `tsRadioCard`, `tsProperty`, `treeItem`, `tag`

Structure:

​```tsx
import { defineRecipe } from "@chakra-ui/react";

export const buttonTheme = defineRecipe({
  base: {
    lineHeight: "1.2",
    borderRadius: "md",
    fontWeight: "semibold",
    transitionProperty: "common",
    transitionDuration: "normal",
    _focusVisible: {
      outlineOffset: "2px",
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.600",
    },
    _disabled: {
      opacity: 0.4,
      cursor: "not-allowed",
    },
  },
  variants: {
    size: {
      lg: { h: "9", px: 3, fontSize: "sm" },
      md: { h: "8", px: 2.5, fontSize: "sm" },
      sm: { h: "7", px: 2, fontSize: "sm" },
    },
    variant: {
      primary: {
        bg: "primary.500",
        color: "white",
        _hover: { bg: "primary.600" },
      },
      secondary: {
        bg: { base: "white", _dark: "gray.800" },
        borderWidth: "1px",
        borderColor: "gray.200",
      },
      ghost: {
        _hover: { bg: "transparent", color: "primary.500" },
      },
    },
  },
  defaultVariants: {
    size: "lg",
    variant: "solid",
  },
});
​```

Key points:
- Export the recipe from `src/theme/recipes/{name}.ts`
- Register it in `src/theme/index.ts` under `recipes: { ... }`
- Re-export from `src/theme/recipes/index.ts`

### Multi-part recipe (`defineSlotRecipe`)

Used for composite components with multiple named slots.

Registered: `card`, `checkbox`, `comment`, `dialog`, `drawer`, `field` (inline), `input`, `menu`, `modal`, `persona`, `popover`, `stepper`, `table`, `tabs`

Structure:

​```tsx
import { defineSlotRecipe } from "@chakra-ui/react";

export const cardSlotRecipe = defineSlotRecipe({
  slots: ["root", "header", "body", "footer", "title", "description"],
  base: {
    root: {
      bg: { base: "white", _dark: "gray.800" },
    },
  },
  variants: {
    variant: {
      elevated: { root: { boxShadow: "md" } },
      flat: { root: { shadow: "md" } },
    },
  },
  defaultVariants: {
    variant: "elevated",
  },
});
​```

Key points:
- `slots` array declares all styleable parts
- Each entry in `base`/`variants` maps slot names to style objects
- `colorPalette` default uses `as never` cast: `defaultVariants: { colorPalette: "primary" as never }`

### Consuming recipes in components

**Pattern 1 — Automatic:** Chakra applies recipes automatically when the recipe key matches the Chakra component name. Button, Input, Card, etc. pick up their recipes from the system without any code.

**Pattern 2 — Manual with `useSlotRecipe`:** For custom multi-part components (e.g., Stepper):

​```tsx
import { chakra, useSlotRecipe } from "@chakra-ui/react";
import { createContext, useContext } from "react";

// 1. Create a context for distributing slot styles
const StylesContext = createContext<StepperStyles>({});
const useStyles = () => useContext(StylesContext);

// 2. In the root component, call useSlotRecipe
const recipe = useSlotRecipe({ key: "stepper" });
const styles = recipe({ variant, size, orientation });

// 3. Provide styles via context
<StylesContext.Provider value={styles}>
  {children}
</StylesContext.Provider>

// 4. In child components, consume styles
const styles = useStyles();
<chakra.div css={styles.icon} data-active={dataAttr(isActive)}>
  {content}
</chakra.div>
​```

## Token Inventory

### Color scales

**primary** (UI blue — `#2087d7` at 500, brighter than brand blue for web accessibility):
50 `#f1f7fe` · 100 `#e2effc` · 200 `#bfddf8` · 300 `#87c1f2` · 400 `#48a3e8` · 500 `#2087d7` · 600 `#126ab7` · 700 `#105595` · 800 `#11497b` · 900 `#143e66` · 950 `#0d2744`

**secondary** (brand orange — matches brand guideline `#e9580c`):
50 `#FEF0E6` · 100 `#FCD9BF` · 200 `#F9B888` · 300 `#F59651` · 400 `#F27726` · 500 `#e9580c` · 600 `#C54A0A` · 700 `#9A3A08` · 800 `#6F2A06` · 900 `#441A03`

**gray** (blue-tinted):
50 `#f8fafc` · 100 `#f1f5f9` · 200 `#e2e8f0` · 300 `#cbd5e1` · 400 `#94a3b8` · 500 `#64748b` · 600 `#475569` · 700 `#334155` · 800 `#1e293b` · 900 `#0f172a`

**brand** (exact knk Brand Guidelines, October 2021 — use for logos, headers, about pages):
blue `#004576` · navy `#0f395d` · light-blue `#6fa7d1` · orange `#e9580c` · gold `#f4b235` · light-gray `#f2f2f2`

### Semantic color tokens

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `bg-canvas` | `gray.50` | `gray.900` | Page background |
| `bg-surface` | `white` | `gray.800` | Card/panel backgrounds |
| `bg-subtle` | `gray.50` | `gray.700` | Subtle background |
| `bg-muted` | `gray.100` | `gray.600` | Muted background |
| `default` | `gray.900` | `white` | Primary text |
| `inverted` | `white` | `gray.900` | Inverted text |
| `emphasized` | `gray.700` | `gray.100` | Emphasized text |
| `muted` | `gray.600` | `gray.300` | Muted text |
| `subtle` | `gray.500` | `gray.400` | Subtle text |
| `border` | `gray.200` | `gray.700` | Default borders |
| `accent` | `primary.500` | `primary.200` | Accent color |
| `success` | `green.600` | `green.200` | Success indicators |
| `error` | `red.600` | `red.200` | Error indicators |

**Accent surface tokens** (static, no dark variant):
`bg-accent` (`primary.600`) · `bg-accent-subtle` (`primary.500`) · `bg-accent-muted` (`primary.400`) · `on-accent` (`white`) · `on-accent-muted` (`primary.50`) · `on-accent-subtle` (`primary.100`)

**Color palette tokens** (per-palette, used by components with `colorPalette` prop):
`{palette}.contrast` · `{palette}.fg` · `{palette}.subtle` · `{palette}.muted` · `{palette}.emphasized` · `{palette}.solid` · `{palette}.focusRing` · `{palette}.border`

### Shadow tokens

All shadows have light/dark variants. Pattern: ambient + key shadow.

| Token | Light |
|---|---|
| `xs` | `0px 0px 1px rgba(45,55,72,0.05), 0px 1px 2px rgba(45,55,72,0.1)` |
| `sm` | `0px 0px 1px rgba(45,55,72,0.05), 0px 2px 4px rgba(45,55,72,0.1)` |
| `md` | `0px 0px 1px rgba(45,55,72,0.05), 0px 4px 8px rgba(45,55,72,0.1)` |
| `lg` | `0px 0px 1px rgba(45,55,72,0.05), 0px 8px 16px rgba(45,55,72,0.1)` |
| `xl` | `0px 0px 1px rgba(45,55,72,0.05), 0px 16px 24px rgba(45,55,72,0.1)` |

### Opacity tokens

`disabled`: 0.4 · `readOnly`: 0.8

### Spacing (custom additions to Chakra defaults)

`1.5` → `0.375rem` · `2.5` → `0.625rem` · `3.5` → `0.875rem` · `4.5` → `1.125rem`

### Border radii

`sm` → `0.375rem` · `md` → `0.5rem` · `lg` → `0.75rem` · `xl` → `1rem` · `2xl` → `1.25rem`

### Z-index scale

`dropdown` 1000 < `sticky` 1100 < `overlay` 1300 < `modal` 1400 < `popover` 1500 < `toast` 1700

### Motion tokens

**Durations:** `fast` 150ms · `normal` 200ms · `slow` 300ms

**Easings:** `ease-in` cubic-bezier(0.4, 0, 1, 1) · `ease-out` cubic-bezier(0, 0, 0.2, 1) · `ease-in-out` cubic-bezier(0.4, 0, 0.2, 1)

### Typography

**Font family:** `InterVariable, -apple-system, system-ui, sans-serif` (both heading and body)

**Text styles:** `7xl` through `xs` — each defines `fontSize`, `lineHeight`, and optional `letterSpacing` (negative tracking on 4xl+)

## Dark Mode

- All semantic tokens use `{ base: "lightValue", _dark: "darkValue" }` syntax
- Never use `useColorModeValue` — it's a Chakra v2 pattern
- Components get dark mode automatically through semantic tokens
- `ColorModeProvider` in `src/primitives/color-mode.tsx` handles the toggle

## Global CSS Conventions

Defined in `src/theme/index.ts` `globalCss`:

- `body` uses `color: "default"` semantic token and `bg: { base: "white", _dark: "#000" }` (note: body background uses hardcoded `#000` for dark mode, not the `bg-canvas` semantic token)
- `*::placeholder` has `opacity: 1` and `color: "muted"`
- `*, *::before, *::after` and `table, td, th` inherit `borderColor: "border"` token
- `#__next, #root, #app` are flex column containers with `minH: 100%`
- `_motionReduce` handles `prefers-reduced-motion` globally — sets animation/transition duration to `0.01ms !important`. Never add per-component reduced-motion queries.

## CSS Custom Properties Pattern

Some recipes use CSS custom properties for state-dependent styling (e.g., menu recipe):

​```tsx
const $bg = "--menu-bg";

// In base styles:
{
  [$bg]: "colors.white",
  bg: `var(${$bg})`,
  _dark: {
    [$bg]: "colors.gray.800",
  },
}
​```

This avoids duplication when multiple states need to reference the same computed value.
```

- [ ] **Step 2: Verify the document renders correctly**

Run: `wc -l docs/chakra-v3-reference.md`
Expected: ~250-300 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/chakra-v3-reference.md
git commit -m "docs: add Chakra v3 reference for Claude Code

Comprehensive reference covering system setup, recipe patterns
(defineRecipe + defineSlotRecipe), recipe consumption patterns,
full token inventory (colors, semantic tokens, shadows, spacing,
radii, z-index, motion, typography), dark mode, and global CSS
conventions."
```

---

### Task 5: Verify everything works together

- [ ] **Step 1: Verify jq is available**

Run: `which jq`
Expected: A path like `/usr/bin/jq` or `/opt/homebrew/bin/jq`. If not installed, run `brew install jq`.

- [ ] **Step 2: Verify the hook script runs**

Run: `echo '{"tool_input":{"command":"git commit -m test"}}' | bash .claude/hooks/pre-commit-gate.sh; echo "exit: $?"`
Expected: Typecheck and lint run. Exit code 0 if both pass, 2 if either fails.

- [ ] **Step 3: Verify settings.json is valid**

Run: `cat .claude/settings.json | jq .`
Expected: Valid JSON, no errors.

- [ ] **Step 4: Verify CLAUDE.md has all new sections**

Run: `grep -c "## Chakra v3 Anti-Patterns\|## Component Scaffolding Checklist\|## Semantic Token & Recipe Quick Reference" CLAUDE.md`
Expected: `3`

- [ ] **Step 5: Verify chakra-v3-reference.md exists and is complete**

Run: `grep -c "## System Setup\|## Recipe Patterns\|## Token Inventory\|## Dark Mode\|## Global CSS Conventions\|## CSS Custom Properties" docs/chakra-v3-reference.md`
Expected: `6`

- [ ] **Step 6: Run the full CI pipeline locally to ensure nothing is broken**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: All pass (documentation-only changes should not break anything).
