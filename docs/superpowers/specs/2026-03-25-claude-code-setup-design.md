# Claude Code Team Setup — Design Spec

**Date:** 2026-03-25
**Goal:** Configure Claude Code for team-wide use on the @knkcs/anker UI library, with Chakra UI v3 optimization, automated quality gates, and component scaffolding guidance.

## 1. `.claude/settings.json` — Permissions, Attribution & Hooks

Replace the current empty settings with a fully configured shared settings file.

### 1.1 Permissions

Pre-approve local, non-destructive commands so Claude can work without prompting:

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
  }
}
```

**Explicitly excluded** (require manual approval):
- `npm publish` — publishing is a release process
- `git push` — pushing is a human decision
- Destructive git operations (`reset --hard`, `push --force`, `branch -D`)

### 1.2 Attribution

Empty — no AI attribution in commit messages:

```json
{
  "attribution": {
    "commit": ""
  }
}
```

### 1.3 Hooks

Claude Code hooks use `PreToolUse` / `PostToolUse` events with tool-name matchers. Hook commands receive event data as JSON on stdin and use exit codes to control behavior (exit 0 = allow, exit 2 = block with stderr feedback).

**Hook 1: PostToolUse — Auto-format with Biome**

Triggers after Claude edits or writes any file via the `Edit` or `Write` tools. Extracts the file path from stdin JSON, checks if it's a `.ts`/`.tsx` file, and runs Biome on it.

```json
{
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
    ]
  }
}
```

**Hook 2: PreToolUse — Typecheck + lint gate before git commit**

There is no `PreCommit` event in Claude Code. Instead, we use a `PreToolUse` hook on the `Bash` tool with a script that inspects the command. If the command is a `git commit`, the script runs typecheck and lint first. Exit code 2 blocks the commit and shows the error to Claude.

Script at `.claude/hooks/pre-commit-gate.sh`:

```bash
#!/bin/bash
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

Hook configuration:

```json
{
  "hooks": {
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

## 2. CLAUDE.md Enhancements

Add three new sections to the existing CLAUDE.md, after the current "Patterns" section.

### 2.1 Chakra v3 Anti-Patterns

A table of v2 patterns that Claude must never suggest, with their v3 replacements:

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
- Never import from `@chakra-ui/react` directly in atoms/components/forms — use anker's primitives layer where a wrapper exists

### 2.2 Component Scaffolding Checklist

Instructions for creating new components, organized by layer:

**Primitive (thin Chakra wrapper):**
1. Create `src/primitives/{name}.tsx` — wrap Chakra's namespaced API (e.g., `ChakraComponent.Root`, `.Content`, `.Trigger`)
2. Export a simplified props interface that surfaces the most-used Chakra props
3. Set `displayName`
4. Create `src/primitives/{name}.stories.tsx` — title: `"Primitives/{Name}"`
5. Add export to `src/primitives/index.ts` — both type and component
6. If a recipe is needed, create `src/theme/recipes/{name}.ts` and register in `src/theme/index.ts`

**Atom (small reusable UI unit):**
1. Create directory `src/atoms/{name}/`
2. Create `src/atoms/{name}/{name}.tsx` — component with defaults, set `displayName`
3. Create `src/atoms/{name}/index.ts` — re-export component and types
4. Create `src/atoms/{name}/{name}.stories.tsx` — title: `"Atoms/{Name}"`
5. Add export to `src/atoms/index.ts`

**Component (higher-level composite):**
- Simple: flat file at `src/components/{name}.tsx` + `src/components/{name}.stories.tsx`
- Complex (with hooks/subcomponents): directory at `src/components/{name}/` with `index.ts`, `{name}.tsx`, `use-{name}.tsx`, `{name}.stories.tsx`
- Add export to `src/components/index.ts`

**Form field (RHF wrapper):**
1. Create `src/forms/{name}-field.tsx` — wrap `FormField<T>` with `Controller` render prop
2. Accept `FieldValues` generic, spread field props + `aria-describedby`
3. Set `displayName` via cast: `(Component as { displayName?: string }).displayName = "Name"`
4. Create `src/forms/{name}-field.stories.tsx` — include `FormProvider` decorator with `useForm`
5. Add export to `src/forms/index.ts`

**All layers:**
- Every exported component must have `displayName` set. For generic function components (e.g., form fields with `<T extends FieldValues>`), use the cast pattern: `(Component as { displayName?: string }).displayName = "Name"`
- Props interfaces must be exported alongside components
- Stories must include Default + at least one variant story
- Use `satisfies Meta<typeof Component>` in story meta

### 2.3 Semantic Token & Recipe Quick Reference

**Available semantic tokens** (use these instead of hardcoded colors):

Backgrounds: `bg-canvas`, `bg-surface`, `bg-subtle`, `bg-muted`, `bg-accent`, `bg-accent-subtle`, `bg-accent-muted`

Text: `default`, `inverted`, `emphasized`, `muted`, `subtle`, `on-accent`, `on-accent-muted`, `on-accent-subtle`

Interactive: `accent`, `border`, `success`, `error`

Color palette tokens (per-palette): `{palette}.contrast`, `{palette}.fg`, `{palette}.subtle`, `{palette}.muted`, `{palette}.emphasized`, `{palette}.solid`, `{palette}.focusRing`, `{palette}.border`

**Registered recipes** (single-part): `button`, `container`, `separator`, `formLabel`, `textarea`, `tooltip`, `tsRadioCard`, `tsProperty`, `treeItem`, `tag`

**Registered slot recipes** (multi-part): `card`, `checkbox`, `comment`, `dialog`, `drawer`, `field` (inline in theme/index.ts), `input`, `menu`, `modal`, `persona`, `popover`, `stepper`, `table`, `tabs`

## 3. Chakra v3 Reference Document

New file at `docs/chakra-v3-reference.md`. This is the deep reference that CLAUDE.md points to.

### 3.1 System Setup

Documents how `createSystem` works in this repo:
- Entry point: `src/theme/index.ts`
- Structure: `createSystem(defaultConfig, { globalCss, theme: { tokens, textStyles, semanticTokens, recipes, slotRecipes } })`
- Provider: `src/primitives/provider.tsx` wraps `ChakraProvider` with `value={system}`

### 3.2 Recipe Patterns

**Single-part recipe** (`defineRecipe`):
- Used for: button, tooltip, tag, separator, etc.
- Structure: `{ base, variants, defaultVariants }`
- Example: button recipe with variant/size axes

**Multi-part recipe** (`defineSlotRecipe`):
- Used for: card, input, table, stepper, modal, etc.
- Structure: `{ slots: [...], base: { slotName: styles }, variants, defaultVariants }`
- `colorPalette` default uses `as never` cast: `defaultVariants: { colorPalette: "primary" as never }`

### 3.3 Consuming Recipes in Components

**Pattern 1 — Automatic** (Chakra applies recipe by component key):
Components like Button, Input automatically pick up their recipe from the system.

**Pattern 2 — Manual with useSlotRecipe** (for custom multi-part components):
```tsx
const recipe = useSlotRecipe({ key: "stepper" })
const styles = recipe({ variant, size, orientation })
// Distribute via React Context
<StylesContext.Provider value={styles}>
// Consume in children
const styles = useStyles()
<chakra.div css={styles.slotName}>
```

### 3.4 Token Inventory

Full listing of:
- Color scales: `primary` (50-950), `secondary` (50-900), `gray` (50-900), `brand` (blue, navy, light-blue, orange, gold, light-gray)
- Semantic color tokens (backgrounds, text, interactive, per-palette)
- Shadow tokens: xs, sm, md, lg, xl (with dark mode variants)
- Spacing additions: 1.5, 2.5, 3.5, 4.5
- Radii: sm, md, lg, xl, 2xl
- Z-index: dropdown(1000), sticky(1100), overlay(1300), modal(1400), popover(1500), toast(1700)
- Motion: durations (fast/normal/slow), easings (ease-in/ease-out/ease-in-out)
- Typography: Inter Variable font, text styles from xs to 7xl

### 3.5 Dark Mode

- All tokens use `{ base: "lightValue", _dark: "darkValue" }` syntax
- Never use `useColorModeValue` — it's a v2 pattern
- Components get dark mode for free via semantic tokens
- `ColorModeProvider` in `src/primitives/color-mode.tsx` handles toggle

### 3.6 Global CSS Conventions

- `_motionReduce` handles `prefers-reduced-motion` globally — never add per-component
- All `*::before, *::after` elements inherit `borderColor: "border"` token
- Placeholder opacity is 1, color is `muted` token
- `#__next, #root, #app` are flex column containers

### 3.7 CSS Custom Properties Pattern

Some recipes use CSS custom properties for state-dependent styling:
```tsx
const $bg = "--menu-bg"
// In recipe:
[$bg]: "colors.white"
bg: `var(${$bg})`
// In state:
_dark: { [$bg]: "colors.gray.800" }
```

## 4. Files Changed

| Action | File |
|---|---|
| Replace | `.claude/settings.json` |
| Create | `.claude/hooks/pre-commit-gate.sh` |
| Edit | `CLAUDE.md` (add sections 2.1, 2.2, 2.3) |
| Create | `docs/chakra-v3-reference.md` |

## 5. Out of Scope

- No IDE-specific config (.vscode, .cursor, etc.)
- No husky/lint-staged (CI handles human commits, Claude hooks handle Claude commits)
- No auto-test hook (test coverage is light, not worth the overhead per-edit)
- No `npm publish` or `git push` permissions
- No changes to CI/CD workflows
