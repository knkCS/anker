# @knkcs/anker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the @knkcs/anker shared UI kit — a single npm package with design tokens, primitives, atoms, form controls, and feedback components for all knkCMS microservices.

**Architecture:** Six-layer component library (theme → primitives → components → atoms → forms → feedback) built on Chakra UI v3. Each layer builds on the previous. Distributed as `@knkcs/anker` with subpath exports. Storybook for docs.

**Tech Stack:** React 19, TypeScript (strict), Chakra UI v3, React Hook Form + Zod, Lucide React, tsup (build), Storybook 8 (docs), Biome (lint/format), Vitest (tests)

**Reference codebase:** `/Users/jeskoiwanovski/repo/core/web/src/` — the source components being rebuilt. Read files from here for reference, but never import from `@root/`.

---

## Phase 1: Project Scaffolding

### Task 1: Initialize package.json

**Files:**
- Create: `package.json`

**Step 1: Create package.json**

```json
{
  "name": "@knkcs/anker",
  "version": "0.0.1",
  "description": "UI component library for the knk software group",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    "./theme": {
      "import": "./dist/theme/index.js",
      "types": "./dist/theme/index.d.ts"
    },
    "./primitives": {
      "import": "./dist/primitives/index.js",
      "types": "./dist/primitives/index.d.ts"
    },
    "./components": {
      "import": "./dist/components/index.js",
      "types": "./dist/components/index.d.ts"
    },
    "./atoms": {
      "import": "./dist/atoms/index.js",
      "types": "./dist/atoms/index.d.ts"
    },
    "./forms": {
      "import": "./dist/forms/index.js",
      "types": "./dist/forms/index.d.ts"
    },
    "./feedback": {
      "import": "./dist/feedback/index.js",
      "types": "./dist/feedback/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "tsup",
    "build:storybook": "storybook build",
    "lint": "biome check src",
    "lint:write": "biome check src --write",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "@chakra-ui/react": "^3.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.0.0",
    "react-router-dom": "^6.0.0",
    "react-i18next": ">=12"
  },
  "dependencies": {
    "lucide-react": "^0.400.0",
    "next-themes": "^0.4.0",
    "color2k": "^2.0.0",
    "dayjs": "^1.11.0",
    "chakra-react-select": "^5.0.0",
    "lodash.debounce": "^4.0.0"
  },
  "devDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@chakra-ui/react": "^3.33.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "react-router-dom": "^6.28.0",
    "react-i18next": "^14.0.0",
    "i18next": "^23.0.0",
    "typescript": "^5.7.0",
    "tsup": "^8.3.0",
    "@biomejs/biome": "^2.2.0",
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^25.0.0",
    "storybook": "^8.4.0",
    "@storybook/react": "^8.4.0",
    "@storybook/react-vite": "^8.4.0",
    "@storybook/addon-essentials": "^8.4.0",
    "@storybook/addon-a11y": "^8.4.0",
    "@storybook/blocks": "^8.4.0"
  },
  "license": "SEE LICENSE IN LICENSE"
}
```

**Step 2: Install dependencies**

Run: `cd /Users/jeskoiwanovski/repo/anker && npm install`
Expected: `node_modules/` created, no errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: initialize package.json with dependencies"
```

---

### Task 2: Configure TypeScript

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`

**Step 1: Create tsconfig.json (for IDE + type checking)**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@anker/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.stories.tsx", "**/*.test.tsx"]
}
```

**Step 2: Create tsconfig.build.json (for tsup declaration generation)**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true
  },
  "exclude": ["node_modules", "dist", "**/*.stories.tsx", "**/*.test.tsx"]
}
```

**Step 3: Verify typecheck runs**

Run: `npx tsc --noEmit`
Expected: No errors (no source files yet, should exit clean)

**Step 4: Commit**

```bash
git add tsconfig.json tsconfig.build.json
git commit -m "chore: add TypeScript configuration"
```

---

### Task 3: Configure tsup (build)

**Files:**
- Create: `tsup.config.ts`

**Step 1: Create tsup.config.ts**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "theme/index": "src/theme/index.ts",
    "primitives/index": "src/primitives/index.ts",
    "components/index": "src/components/index.ts",
    "atoms/index": "src/atoms/index.ts",
    "forms/index": "src/forms/index.ts",
    "feedback/index": "src/feedback/index.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "@chakra-ui/react",
    "react-hook-form",
    "@hookform/resolvers",
    "zod",
    "react-router-dom",
    "react-i18next",
  ],
  treeshake: true,
  sourcemap: true,
  minify: false,
});
```

**Step 2: Create placeholder entry files so tsup can resolve**

Create these empty barrel files (will be populated in later tasks):

- `src/theme/index.ts` → `export {};`
- `src/primitives/index.ts` → `export {};`
- `src/components/index.ts` → `export {};`
- `src/atoms/index.ts` → `export {};`
- `src/forms/index.ts` → `export {};`
- `src/feedback/index.ts` → `export {};`

**Step 3: Verify build runs**

Run: `npm run build`
Expected: `dist/` created with 6 entry points, no errors

**Step 4: Commit**

```bash
git add tsup.config.ts src/
git commit -m "chore: add tsup build config with subpath entry points"
```

---

### Task 4: Configure Biome (lint/format)

**Files:**
- Create: `biome.json`

**Step 1: Create biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.4/schema.json",
  "root": true,
  "files": {
    "includes": ["src/**"],
    "ignoreUnknown": true
  },
  "linter": {
    "enabled": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  }
}
```

**Step 2: Verify lint runs**

Run: `npm run lint`
Expected: Clean output, no errors

**Step 3: Commit**

```bash
git add biome.json
git commit -m "chore: add Biome linter/formatter config"
```

---

### Task 5: Configure Storybook

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.tsx`

**Step 1: Create .storybook/main.ts**

```typescript
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
```

**Step 2: Create .storybook/preview.tsx**

This wraps every story in the Anker theme provider.

```tsx
import { ChakraProvider } from "@chakra-ui/react";
import type { Preview } from "@storybook/react";
import React from "react";
// Will import from our theme once built; placeholder for now
// import system from "../src/theme";

const preview: Preview = {
  decorators: [
    (Story) => (
      // <ChakraProvider value={system}>
      <Story />
      // </ChakraProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

**Step 3: Verify storybook starts**

Run: `npm run dev`
Expected: Storybook opens on localhost:6006 (may show "no stories" — that's fine)
Press Ctrl+C to stop.

**Step 4: Commit**

```bash
git add .storybook/
git commit -m "chore: add Storybook configuration"
```

---

### Task 6: Configure Vitest (tests)

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

**Step 1: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      "@anker": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

**Step 2: Create src/test/setup.ts**

```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 3: Verify test runner works**

Run: `npm run test`
Expected: "No test files found" or similar — no errors

**Step 4: Commit**

```bash
git add vitest.config.ts src/test/
git commit -m "chore: add Vitest test configuration"
```

---

### Task 7: Add .gitignore and initial commit of project files

**Files:**
- Create: `.gitignore`

**Step 1: Create .gitignore**

```
node_modules/
dist/
storybook-static/
*.tsbuildinfo
.DS_Store
```

**Step 2: Commit all project scaffolding**

```bash
git add .gitignore CLAUDE.md README.md LICENSE .claude/
git commit -m "chore: add project docs and gitignore"
```

---

## Phase 2: Theme & Design Tokens (Layer 1)

**Reference:** Read from `/Users/jeskoiwanovski/repo/core/web/src/theme/` for source material. Rebuild with fixes listed in the design doc.

### Task 8: Color tokens

**Files:**
- Create: `src/theme/tokens/colors.ts`

**Step 1: Create color scales**

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/theme/index.ts` (lines 38-90 for color definitions).

Rebuild as `src/theme/tokens/colors.ts` — consolidate the primary and blue duplicate into a single primary scale. Export the raw token object.

```typescript
export const colors = {
  primary: {
    "50": { value: "#f1f7fe" },
    "100": { value: "#e2effc" },
    "200": { value: "#bfddf8" },
    "300": { value: "#87c1f2" },
    "400": { value: "#48a3e8" },
    "500": { value: "#2087d7" },
    "600": { value: "#126ab7" },
    "700": { value: "#105595" },
    "800": { value: "#11497b" },
    "900": { value: "#143e66" },
    "950": { value: "#0d2744" },
  },
  secondary: {
    "50": { value: "#F8D6BC" },
    "100": { value: "#F6CAA9" },
    "200": { value: "#F2B584" },
    "300": { value: "#EE9D5F" },
    "400": { value: "#EA863A" },
    "500": { value: "#E47018" },
    "600": { value: "#B15713" },
    "700": { value: "#7E3E0D" },
    "800": { value: "#4C2508" },
    "900": { value: "#190C03" },
  },
  gray: {
    "50": { value: "#f8fafc" },
    "100": { value: "#f1f5f9" },
    "200": { value: "#e2e8f0" },
    "300": { value: "#cbd5e1" },
    "400": { value: "#94a3b8" },
    "500": { value: "#64748b" },
    "600": { value: "#475569" },
    "700": { value: "#334155" },
    "800": { value: "#1e293b" },
    "900": { value: "#0f172a" },
  },
};
```

**Step 2: Commit**

```bash
git add src/theme/tokens/colors.ts
git commit -m "feat(theme): add color scale tokens"
```

---

### Task 9: Semantic tokens

**Files:**
- Create: `src/theme/tokens/semantic.ts`

**Step 1: Create semantic tokens**

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/theme/foundations/tokens.ts`.

Rebuild as `src/theme/tokens/semantic.ts` — consolidate shadows from the legacy `shadows.ts` file into this single file. Fix the blue/primary duplication by removing the `blue` semantic tokens and using `primary` everywhere.

```typescript
export const semanticTokens = {
  colors: {
    "bg-canvas": { value: { base: "gray.50", _dark: "gray.900" } },
    "bg-surface": { value: { base: "white", _dark: "gray.800" } },
    "bg-subtle": { value: { base: "gray.50", _dark: "gray.700" } },
    "bg-muted": { value: { base: "gray.100", _dark: "gray.600" } },
    default: { value: { base: "gray.900", _dark: "white" } },
    inverted: { value: { base: "white", _dark: "gray.900" } },
    emphasized: { value: { base: "gray.700", _dark: "gray.100" } },
    muted: { value: { base: "gray.600", _dark: "gray.300" } },
    subtle: { value: { base: "gray.500", _dark: "gray.400" } },
    border: {
      DEFAULT: {
        value: { base: "{colors.gray.200}", _dark: "{colors.gray.700}" },
      },
    },
    accent: { value: { base: "primary.500", _dark: "primary.200" } },
    success: { value: { base: "green.600", _dark: "green.200" } },
    error: { value: { base: "red.600", _dark: "red.200" } },
    primary: {
      contrast: { value: { base: "white", _dark: "white" } },
      fg: {
        value: {
          base: "{colors.primary.700}",
          _dark: "{colors.primary.300}",
        },
      },
      subtle: {
        value: {
          base: "{colors.primary.100}",
          _dark: "{colors.primary.900}",
        },
      },
      muted: {
        value: {
          base: "{colors.primary.200}",
          _dark: "{colors.primary.800}",
        },
      },
      emphasized: {
        value: {
          base: "{colors.primary.300}",
          _dark: "{colors.primary.700}",
        },
      },
      solid: {
        value: {
          base: "{colors.primary.500}",
          _dark: "{colors.primary.500}",
        },
      },
      focusRing: {
        value: {
          base: "{colors.primary.500}",
          _dark: "{colors.primary.500}",
        },
      },
      border: {
        value: {
          base: "{colors.primary.500}",
          _dark: "{colors.primary.400}",
        },
      },
    },
    "bg-accent": { value: "primary.600" },
    "bg-accent-subtle": { value: "primary.500" },
    "bg-accent-muted": { value: "primary.400" },
    "on-accent": { value: "white" },
    "on-accent-muted": { value: "primary.50" },
    "on-accent-subtle": { value: "primary.100" },
  },
  shadows: {
    xs: {
      value: {
        base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 1px 2px rgba(45, 55, 72, 0.1)",
        _dark:
          "0px 0px 1px rgba(13, 14, 20, 1), 0px 1px 2px rgba(13, 14, 20, 0.9)",
      },
    },
    sm: {
      value: {
        base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 2px 4px rgba(45, 55, 72, 0.1)",
        _dark:
          "0px 0px 1px rgba(13, 14, 20, 1), 0px 2px 4px rgba(13, 14, 20, 0.9)",
      },
    },
    md: {
      value: {
        base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 4px 8px rgba(45, 55, 72, 0.1)",
        _dark:
          "0px 0px 1px rgba(13, 14, 20, 1), 0px 4px 8px rgba(13, 14, 20, 0.9)",
      },
    },
    lg: {
      value: {
        base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 8px 16px rgba(45, 55, 72, 0.1)",
        _dark:
          "0px 0px 1px rgba(13, 14, 20, 1), 0px 8px 16px rgba(13, 14, 20, 0.9)",
      },
    },
    xl: {
      value: {
        base: "0px 0px 1px rgba(45, 55, 72, 0.05), 0px 16px 24px rgba(45, 55, 72, 0.1)",
        _dark:
          "0px 0px 1px rgba(13, 14, 20, 1), 0px 16px 24px rgba(13, 14, 20, 0.9)",
      },
    },
  },
};
```

**Step 2: Commit**

```bash
git add src/theme/tokens/semantic.ts
git commit -m "feat(theme): add semantic color and shadow tokens"
```

---

### Task 10: Typography, spacing, and radii tokens

**Files:**
- Create: `src/theme/tokens/typography.ts`
- Create: `src/theme/tokens/spacing.ts`
- Create: `src/theme/tokens/radii.ts`
- Create: `src/theme/tokens/index.ts`

**Step 1: Create typography.ts**

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/theme/foundations/text-styles.ts` and `fonts.ts`.

Merge text styles and fonts into a single file.

```typescript
export const fonts = {
  heading: { value: "'InterVariable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" },
  body: { value: "'InterVariable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" },
};

export const textStyles = {
  "7xl": { fontSize: "7xl", lineHeight: "5.75rem", letterSpacing: "-0.02em" },
  "6xl": { fontSize: "6xl", lineHeight: "4.5rem", letterSpacing: "-0.02em" },
  "5xl": { fontSize: "5xl", lineHeight: "3.75rem", letterSpacing: "-0.02em" },
  "4xl": { fontSize: "4xl", lineHeight: "2.75rem", letterSpacing: "-0.02em" },
  "3xl": { fontSize: "3xl", lineHeight: "2.375rem" },
  "2xl": { fontSize: "2xl", lineHeight: "2rem" },
  xl: { fontSize: "xl", lineHeight: "1.875rem" },
  lg: { fontSize: "lg", lineHeight: "1.75rem" },
  md: { fontSize: "md", lineHeight: "1.5rem" },
  sm: { fontSize: "sm", lineHeight: "1.25rem" },
  xs: { fontSize: "xs", lineHeight: "1.125rem" },
};
```

**Step 2: Create spacing.ts**

```typescript
export const spacing = {
  "4.5": { value: "1.125rem" },
};
```

**Step 3: Create radii.ts**

```typescript
export const radii = {
  sm: { value: "0.25rem" },
  md: { value: "0.375rem" },
  lg: { value: "0.5rem" },
  xl: { value: "0.75rem" },
  "2xl": { value: "1rem" },
};
```

**Step 4: Create tokens/index.ts barrel**

```typescript
export { colors } from "./colors";
export { semanticTokens } from "./semantic";
export { fonts, textStyles } from "./typography";
export { spacing } from "./spacing";
export { radii } from "./radii";
```

**Step 5: Commit**

```bash
git add src/theme/tokens/
git commit -m "feat(theme): add typography, spacing, and radii tokens"
```

---

### Task 11: Theme recipes

**Files:**
- Create: `src/theme/recipes/` — all 24 recipe files
- Create: `src/theme/recipes/index.ts`

**Step 1: Copy and fix all recipe files from Core**

Read each recipe from `/Users/jeskoiwanovski/repo/core/web/src/theme/components/`. For each file:

1. Copy the recipe definition
2. Fix hardcoded values: replace `blue.500` → `primary.500`, replace legacy `shadows.md` → semantic token refs
3. Replace `colorPalette: "blue"` defaults → `colorPalette: "primary"` in defaultVariants
4. Skip `condition-tree.ts` (excluded from kit)

Files to create (one per recipe):
- `src/theme/recipes/button.ts`
- `src/theme/recipes/card.ts`
- `src/theme/recipes/checkbox.ts`
- `src/theme/recipes/comment.ts`
- `src/theme/recipes/container.ts`
- `src/theme/recipes/dialog.ts`
- `src/theme/recipes/drawer.ts`
- `src/theme/recipes/form-label.ts`
- `src/theme/recipes/input.ts`
- `src/theme/recipes/menu.ts`
- `src/theme/recipes/modal.ts`
- `src/theme/recipes/persona.ts`
- `src/theme/recipes/popover.ts`
- `src/theme/recipes/property.ts`
- `src/theme/recipes/radio-card.ts`
- `src/theme/recipes/separator.ts`
- `src/theme/recipes/stepper.ts`
- `src/theme/recipes/table.ts`
- `src/theme/recipes/tabs.ts`
- `src/theme/recipes/tag.ts`
- `src/theme/recipes/textarea.ts`
- `src/theme/recipes/tooltip.ts`
- `src/theme/recipes/tree-item.ts`
- `src/theme/recipes/index.ts`

**Step 2: Create recipes/index.ts**

Re-export all recipes as named exports matching Core's pattern. Reference: `/Users/jeskoiwanovski/repo/core/web/src/theme/components/index.ts`.

**Step 3: Commit**

```bash
git add src/theme/recipes/
git commit -m "feat(theme): add all 24 component recipes"
```

---

### Task 12: Color utilities

**Files:**
- Create: `src/theme/utils/color.ts`
- Create: `src/theme/utils/index.ts`

**Step 1: Copy color utility from Core**

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/theme/tools/color.ts`.

Rebuild — uses `color2k` for `transparentize` and hex conversion. Copy as-is (it has no Core dependencies).

**Step 2: Commit**

```bash
git add src/theme/utils/
git commit -m "feat(theme): add color utility helpers"
```

---

### Task 13: Theme system entry point

**Files:**
- Create: `src/theme/index.ts` (replace placeholder)

**Step 1: Create the main theme system**

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/theme/index.ts`.

Rebuild using the new token/recipe imports. Key changes from Core:
- Import colors from `./tokens/colors` instead of inline
- Import semantic tokens from `./tokens/semantic` instead of duplicate definitions
- Import recipes from `./recipes/` barrel
- No `condition-tree` in slotRecipes
- Global CSS stays the same

```typescript
import { createSystem, defaultConfig, defineSlotRecipe } from "@chakra-ui/react";
import { colors } from "./tokens/colors";
import { semanticTokens } from "./tokens/semantic";
import { fonts, textStyles } from "./tokens/typography";
import { spacing } from "./tokens/spacing";
import { radii } from "./tokens/radii";
import {
  button, card, checkbox, comment, container, dialog, drawer,
  formLabel, input, menu, persona, popover, separator, stepper,
  table, tabs, tag, textarea, tooltip, treeItem, tsProperty, tsRadioCard,
} from "./recipes";

const system = createSystem(defaultConfig, {
  globalCss: {
    body: { color: "default", bg: { base: "white", _dark: "#000" } },
    "*::placeholder": { opacity: 1, color: "muted" },
    "*, *::before, *::after": { borderColor: "border" },
    "table, td, th": { borderColor: "border" },
    "html, body": { height: "100%" },
    "#__next, #root, #app": {
      display: "flex",
      flexDirection: "column",
      minH: "100%",
    },
  },
  theme: {
    tokens: {
      colors,
      fonts,
      spacing,
      radii,
    },
    semanticTokens,
    textStyles,
    recipes: {
      button, container, separator, formLabel,
      textarea, tooltip, tsRadioCard, tsProperty, treeItem, tag,
    },
    slotRecipes: {
      card, checkbox, comment, dialog, drawer,
      field: defineSlotRecipe({
        slots: ["root"],
        variants: {
          orientation: {
            vertical: { root: { alignItems: "stretch" } },
          },
        },
      }),
      input, menu, persona, popover, stepper, table, tabs,
    },
  },
});

export type AnkerTheme = typeof system;
export default system;

// Re-export tokens for consumer overrides
export { colors } from "./tokens/colors";
export { semanticTokens } from "./tokens/semantic";
export { fonts, textStyles } from "./tokens/typography";
export { spacing } from "./tokens/spacing";
export { radii } from "./tokens/radii";
```

**Step 2: Verify build succeeds**

Run: `npm run build`
Expected: `dist/theme/index.js` created, no errors

**Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/theme/index.ts
git commit -m "feat(theme): create main theme system entry point"
```

---

### Task 14: Update Storybook preview to use theme

**Files:**
- Modify: `.storybook/preview.tsx`

**Step 1: Uncomment the theme provider**

```tsx
import { ChakraProvider } from "@chakra-ui/react";
import type { Preview } from "@storybook/react";
import React from "react";
import system from "../src/theme";

const preview: Preview = {
  decorators: [
    (Story) => (
      <ChakraProvider value={system}>
        <Story />
      </ChakraProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

**Step 2: Verify storybook starts with theme**

Run: `npm run dev`
Expected: Storybook opens with no errors. Stop with Ctrl+C.

**Step 3: Commit**

```bash
git add .storybook/preview.tsx
git commit -m "chore: wire theme into Storybook preview"
```

---

## Phase 3: UI Primitives (Layer 2)

**Pattern:** For each primitive, read the Core source, rebuild without `@root/` imports, replace FontAwesome with Lucide, write a Storybook story.

### Task 15: Tooltip primitive

**Files:**
- Create: `src/primitives/tooltip.tsx`
- Create: `src/primitives/tooltip.stories.tsx`

**Step 1: Build Tooltip**

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/ui/tooltip.tsx`.

Rebuild as `src/primitives/tooltip.tsx`. This is a clean wrapper — copy and adjust imports to use `@chakra-ui/react` directly (it already does, no changes needed beyond removing the `@root` path alias).

**Step 2: Write Storybook story**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@chakra-ui/react";
import { Tooltip } from "./tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Primitives/Tooltip",
  component: Tooltip,
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="This is a tooltip">
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tooltip content="I won't show" disabled>
      <Button>Disabled tooltip</Button>
    </Tooltip>
  ),
};
```

**Step 3: Verify in Storybook**

Run: `npm run dev`
Expected: Tooltip stories visible and interactive.

**Step 4: Commit**

```bash
git add src/primitives/tooltip.tsx src/primitives/tooltip.stories.tsx
git commit -m "feat(primitives): add Tooltip component"
```

---

### Task 16: Remaining primitives (batch)

**Files:**
- Create one `.tsx` + one `.stories.tsx` per primitive
- Update: `src/primitives/index.ts`

For each of the remaining 12 primitives, follow the same pattern as Task 15:

1. Read the Core source from `/Users/jeskoiwanovski/repo/core/web/src/components/ui/<component>.tsx`
2. Rebuild in `src/primitives/<component>.tsx` — remove `@root/` imports, replace FontAwesome with Lucide icons (`react-icons/lu` → `lucide-react`)
3. Write a basic Storybook story in `src/primitives/<component>.stories.tsx`

Components (in order):
1. `alert.tsx` — ref: `core/web/src/components/ui/alert.tsx`
2. `avatar.tsx` — ref: `core/web/src/components/ui/avatar.tsx`
3. `color-mode.tsx` — ref: `core/web/src/components/ui/color-mode.tsx`. Replace `react-icons` imports with `lucide-react` (`LuMoon` → `Moon`, `LuSun` → `Sun`)
4. `menu.tsx` — ref: `core/web/src/components/ui/menu.tsx`. Replace `react-icons` (`LuCheck` → `Check`, `LuChevronRight` → `ChevronRight`)
5. `number-input.tsx` — ref: `core/web/src/components/ui/number-input.tsx`
6. `prose.tsx` — ref: `core/web/src/components/ui/prose.tsx`
7. `provider.tsx` — ref: `core/web/src/components/ui/provider.tsx`
8. `radio.tsx` — ref: `core/web/src/components/ui/radio.tsx`
9. `stat.tsx` — ref: `core/web/src/components/ui/stat.tsx`
10. `switch.tsx` — ref: `core/web/src/components/ui/switch.tsx`
11. `toaster.tsx` — ref: `core/web/src/components/ui/toaster.tsx`. Change: make `placement` configurable via a default export function or config.
12. `toggle-tip.tsx` — ref: `core/web/src/components/ui/toggle-tip.tsx`. Replace `HiOutlineInformationCircle` with `Info` from lucide-react.

**Special:** `leave-page-confirmation.tsx` — ref: `core/web/src/components/ui/leave-page-confirmation/`. Refactor: accept `blocked: boolean` as prop instead of using `unstable_useBlocker` internally. The consuming app handles the router integration.

After all are created, update the barrel:

```typescript
// src/primitives/index.ts
export { Alert, type AlertProps } from "./alert";
export { Avatar, type AvatarProps } from "./avatar";
export { ColorModeProvider, useColorMode, useColorModeValue, ColorModeButton } from "./color-mode";
export { MenuContent, MenuCheckboxItem, MenuRadioItem, MenuItemGroup, MenuTriggerItem, type MenuContentProps } from "./menu";
export { NumberInput, type NumberInputProps } from "./number-input";
export { Prose } from "./prose";
export { Provider } from "./provider";
export { Radio, type RadioProps } from "./radio";
export { StatLabel, StatValueText, StatUpTrend, StatDownTrend } from "./stat";
export { Switch, type SwitchProps } from "./switch";
export { Toaster, toaster } from "./toaster";
export { ToggleTip, InfoTip } from "./toggle-tip";
export { Tooltip, type TooltipProps } from "./tooltip";
export { LeavePageConfirmation, type LeavePageConfirmationProps } from "./leave-page-confirmation";
```

**Verify:** Run `npm run build` and `npm run typecheck` — no errors.

**Commit after each batch of 3-4 primitives.** Suggested commit messages:
- `feat(primitives): add Alert, Avatar, ColorMode`
- `feat(primitives): add Menu, NumberInput, Prose, Provider`
- `feat(primitives): add Radio, Stat, Switch, Toaster`
- `feat(primitives): add ToggleTip, Tooltip, LeavePageConfirmation`
- `feat(primitives): add barrel exports`

---

## Phase 4: Base Components (Layer 3)

### Task 17: Card, Drawer, Switch (ready components)

**Files:**
- Create: `src/components/card.tsx` — ref: `core/web/src/components/base/BaseCard.tsx`. Fix: remove hardcoded `bg="white"`, use `bg="bg-surface"` token. Remove hardcoded `maxW`.
- Create: `src/components/drawer.tsx` — ref: `core/web/src/components/base/BaseDrawer.tsx`. Fix: replace `gray.50` → `bg-subtle`, `gray.300` → `border`.
- Create: `src/components/switch.tsx` — ref: `core/web/src/components/base/BaseSwitch.tsx`. Clean, just update import of Switch from `../primitives/switch`.
- Create: stories for each
- Update: `src/components/index.ts`

**Commit:** `feat(components): add Card, Drawer, LabeledSwitch`

---

### Task 18: Modal (rebuild)

**Files:**
- Create: `src/components/modal.tsx`
- Create: `src/components/modal.stories.tsx`

**Step 1: Rebuild Modal without Formik**

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/base/BaseModal.tsx`.

Rebuild as a composable dialog:

```tsx
import { Dialog, Portal, Button, chakra } from "@chakra-ui/react";
import { X } from "lucide-react";
import type React from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  saveLabel?: string;
  cancelLabel?: string;
  onSave?: () => void;
  saveDisabled?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  header,
  children,
  footer,
  size = "lg",
  saveLabel = "Save",
  cancelLabel = "Cancel",
  onSave,
  saveDisabled,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size={size}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{header}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Close">
                  <X size={16} />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            {(footer || onSave) && (
              <Dialog.Footer>
                {footer ?? (
                  <>
                    <Button variant="outline" onClick={onClose}>
                      {cancelLabel}
                    </Button>
                    {onSave && (
                      <Button
                        colorPalette="primary"
                        onClick={onSave}
                        disabled={saveDisabled}
                      >
                        {saveLabel}
                      </Button>
                    )}
                  </>
                )}
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
```

Key changes from Core: no Formik, labels are props with English defaults, footer is customizable via render prop or default save/cancel, Lucide X icon.

**Step 2: Write story, verify in Storybook**

**Step 3: Commit**

```bash
git add src/components/modal.tsx src/components/modal.stories.tsx
git commit -m "feat(components): add Modal (rebuilt without Formik)"
```

---

### Task 19: Widget, FactBox, Table, TableItem, TableData

**Files:**
- Create each component in `src/components/`
- Create stories for each

For each, read the Core reference and apply fixes per the design doc:

1. **Widget** — ref: `core/web/src/components/base/BaseWidget.tsx`. Change: `icon: IconProp` (FontAwesome) → `icon: React.ReactNode` (generic). Consumers pass `<Settings size={20} />` from Lucide.
2. **FactBox** — ref: `core/web/src/components/base/BaseFactBox.tsx`. Inline the Collapse dependency from atoms/actions.
3. **Table** — ref: `core/web/src/components/base/BaseTable.tsx`. Add `role="grid"`, `aria-colcount`, make column count configurable.
4. **TableItem** — ref: `core/web/src/components/base/BaseTableItem.tsx`. Add generic `<T>`, `role="row"`, replace hardcoded colors with tokens.
5. **TableData** — ref: `core/web/src/components/base/BaseTableData.tsx`. Replace `color="gray.600"` → `color="muted"`.

**Commit after each pair:** `feat(components): add Widget and FactBox`, then `feat(components): add Table, TableItem, TableData`

---

### Task 20: Stepper compound component

**Files:**
- Create: `src/components/stepper/stepper.tsx`
- Create: `src/components/stepper/use-stepper.tsx`
- Create: `src/components/stepper/index.ts`
- Create: `src/components/stepper/stepper.stories.tsx`

Read references:
- `/Users/jeskoiwanovski/repo/core/web/src/components/stepper/stepper.tsx`
- `/Users/jeskoiwanovski/repo/core/web/src/components/stepper/use-stepper.tsx`

Changes:
1. Replace `FontAwesomeIcon(faCheck)` → `<Check size={14} />` from lucide-react
2. Inline `getChildOfType` and `getChildrenOfType` utilities (they are ~10 lines each, read from `/Users/jeskoiwanovski/repo/core/web/src/utils/get-child-of-type.ts` and `get-children-of-type.ts`)
3. `use-stepper.tsx` — copy as-is (no Core dependencies)

**Commit:** `feat(components): add Stepper compound component`

---

### Task 21: Components barrel export

**Files:**
- Update: `src/components/index.ts`

```typescript
export { Card, type CardProps } from "./card";
export { Drawer, type DrawerProps } from "./drawer";
export { LabeledSwitch } from "./switch";
export { Modal, type ModalProps } from "./modal";
export { Widget, type WidgetProps } from "./widget";
export { FactBox, type FactBoxProps } from "./fact-box";
export { Table } from "./table";
export { TableItem, type TableItemProps } from "./table-item";
export { TableData } from "./table-data";
export {
  Stepper, StepperStep, StepperSteps, StepperContent,
  StepperCompleted, StepperContainer,
  type StepperProps, type StepperStepProps,
} from "./stepper";
export {
  useStepper, useStepperContext, useStepperPrevButton, useStepperNextButton,
} from "./stepper/use-stepper";
```

**Verify:** `npm run build && npm run typecheck`

**Commit:** `feat(components): add barrel exports`

---

## Phase 5: Atoms (Layer 4)

### Task 22: Action atoms

**Files:**
- Create: `src/atoms/actions/` — action.tsx, edit.tsx, remove.tsx, collapse.tsx, filter.tsx, handle.tsx, index.ts

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/atoms/actions/`.

Changes: replace `useTranslation()` calls with prop-based labels. E.g., `editLabel="Edit"` as default. Replace FontAwesome icons with Lucide (`faEdit` → `Pencil`, `faTimes` → `X`, `faFilter` → `Filter`, `faGripVertical` → `GripVertical`).

**Commit:** `feat(atoms): add action atoms`

---

### Task 23: Simple atoms (batch)

Create each in `src/atoms/<name>/`:

1. **CheckboxCard** — ref: `core/web/src/components/atoms/checkbox-card/`. Copy as-is (no Core deps).
2. **EmptyPanel** — ref: `core/web/src/components/atoms/empty-panel/`. Copy as-is.
3. **EmptyState** — ref: `core/web/src/components/atoms/empty-state/`. Copy as-is.
4. **TextInput** — ref: `core/web/src/components/atoms/text-input/`. Copy as-is.
5. **TextOverflow** — ref: `core/web/src/components/atoms/text-overflow/`. Update Tooltip import to `../primitives/tooltip` → `@anker/primitives/tooltip`.
6. **SearchInput** — ref: `core/web/src/components/atoms/searchinput/`. Copy as-is (uses lodash.debounce, no Core deps).
7. **DateInput** — ref: `core/web/src/components/atoms/date-input/`. Copy as-is.

**Commit per batch of 3-4:** `feat(atoms): add CheckboxCard, EmptyPanel, EmptyState, TextInput`, then `feat(atoms): add TextOverflow, SearchInput, DateInput`

---

### Task 24: DateTime atom

**Files:**
- Create: `src/atoms/datetime/` — relative-datetime.tsx, utils/, types.ts, index.ts

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/atoms/datetime/`. Copy the entire directory (it's fully generic, uses dayjs only).

**Commit:** `feat(atoms): add DateTime (relative time display)`

---

### Task 25: Persona atom

**Files:**
- Create: `src/atoms/persona/persona.tsx`
- Create: `src/atoms/persona/index.ts`
- Create: `src/atoms/persona/persona.stories.tsx`

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/atoms/persona/persona.tsx`.

Change: update Avatar import from `@root/components/ui/avatar` to use our primitives `../../primitives/avatar`.

**Commit:** `feat(atoms): add Persona compound component`

---

### Task 26: Select atom

**Files:**
- Create: `src/atoms/select/` — base-select.tsx, table-menu-list.tsx, types.ts, index.ts

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/atoms/select/`. Copy as-is — uses `chakra-react-select` which is a direct dependency. No Core imports.

**Commit:** `feat(atoms): add Select (base-select, table-menu-list)`

---

### Task 27: Comment atom

**Files:**
- Create: `src/atoms/comment/` — comment.tsx, comment-reply-box.tsx, types.ts, index.ts

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/atoms/comment/`.

Change: update Prose import to `../../primitives/prose`. Update RelativeDateTime import to `../datetime`.

**Commit:** `feat(atoms): add Comment`

---

### Task 28: Stat atom

**Files:**
- Create: `src/atoms/stat/stat.tsx`

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/atoms/stat/stat.tsx`.

Change: replace FontAwesome `icon: IconProp` with `icon: React.ReactNode`.

**Commit:** `feat(atoms): add Stat`

---

### Task 29: StatusBadge (rebuild)

**Files:**
- Create: `src/atoms/status-badge/status-badge.tsx`
- Create: `src/atoms/status-badge/index.ts`

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/atoms/status-badge/status-badge.tsx`.

**Rebuild:** Remove Core `Status` type and `@root/utils/color` import. New props interface:

```typescript
export interface StatusBadgeProps {
  label: string;
  color: string; // hex color for badge background
}
```

Inline the text color contrast function (it's ~15 lines from `@root/utils/color`). Use `color2k` from our own deps.

**Commit:** `feat(atoms): add StatusBadge (generic, decoupled from Core)`

---

### Task 30: TypeBadge (rebuild)

**Files:**
- Create: `src/atoms/type-badge/type-badge.tsx`
- Create: `src/atoms/type-badge/index.ts`

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/atoms/type-badge/type-badge.tsx`.

**Rebuild:** Remove Core `TaskType` import. New props: `{ name: string }`.

**Commit:** `feat(atoms): add TypeBadge (generic, decoupled from Core)`

---

### Task 31: Atoms barrel export

**Files:**
- Update: `src/atoms/index.ts`

Export all atoms. Verify build + typecheck.

**Commit:** `feat(atoms): add barrel exports`

---

## Phase 6: Form Components (Layer 5)

### Task 32: FormField (core form infrastructure)

**Files:**
- Create: `src/forms/form-field.tsx`
- Create: `src/forms/controlled-form-field.tsx`

**Step 1: Build FormField (RHF version)**

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/forms/inputs/form-control.tsx`.

Rebuild using React Hook Form's `Controller` pattern:

```tsx
import { Field } from "@chakra-ui/react";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";
import type React from "react";

export interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  helperText?: string;
  required?: boolean;
  children: (field: {
    value: unknown;
    onChange: (...event: unknown[]) => void;
    onBlur: () => void;
    ref: React.Ref<unknown>;
  }) => React.ReactNode;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  helperText,
  required,
  children,
}: FormFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field.Root invalid={!!fieldState.error} required={required}>
          {label && <Field.Label>{label}</Field.Label>}
          {children(field)}
          {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
          {fieldState.error && (
            <Field.ErrorText>{fieldState.error.message}</Field.ErrorText>
          )}
        </Field.Root>
      )}
    />
  );
}
```

**Step 2: Build ControlledFormField (no RHF)**

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/forms/inputs/controlled-form-control.tsx`.

Rebuild as standalone (accepts `error`, `value`, `onChange` as props — no form context needed).

**Step 3: Commit**

```bash
git add src/forms/form-field.tsx src/forms/controlled-form-field.tsx
git commit -m "feat(forms): add FormField and ControlledFormField"
```

---

### Task 33: Simple form fields (batch)

For each, create `src/forms/<name>-field.tsx` following the FormField pattern:

1. **InputField** — wraps `<Input>` in FormField
2. **TextareaField** — wraps `<Textarea>` in FormField
3. **NumberInputField** — wraps our `NumberInput` primitive in FormField
4. **CheckboxField** — wraps `<Checkbox>` in FormField
5. **RadioGroupField** — wraps our `Radio` primitive in FormField
6. **SwitchField** — wraps our `Switch` primitive in FormField
7. **SelectField** — wraps native `<select>` in FormField
8. **SelectActionField** — button + dropdown in FormField

Read references from `/Users/jeskoiwanovski/repo/core/web/src/components/forms/inputs/`. Each Formik `useField(name)` becomes RHF `Controller`.

**Commit per batch of 3-4:** `feat(forms): add InputField, TextareaField, NumberInputField`, etc.

---

### Task 34: Advanced form fields

1. **ColorPickerField** — ref: `core/web/src/components/forms/inputs/color-picker-control.tsx`. Uses `react-colorful`.
2. **CodeField** — ref: `core/web/src/components/forms/inputs/code-control.tsx`. Uses `@monaco-editor/react`.
3. **MarkdownField** — ref: `core/web/src/components/forms/inputs/markdown-control.tsx`. Uses `@uiw/react-md-editor`.
4. **DatePickerField** — ref: `core/web/src/components/forms/inputs/datepicker/`. Uses `@react-aria/datepicker`.
5. **FileField** — ref: `core/web/src/components/forms/inputs/file-control.tsx`. Uses `react-dropzone`.

**Commit per pair:** `feat(forms): add ColorPickerField, CodeField`, etc.

---

### Task 35: ArrayField (rebuild)

**Files:**
- Create: `src/forms/array-field.tsx`

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/forms/inputs/array-control.tsx`.

Rebuild using RHF's `useFieldArray` instead of Formik's `FieldArray`. Support both "dynamic" (add/remove) and "keyed" (fixed keys) modes.

**Commit:** `feat(forms): add ArrayField (RHF useFieldArray)`

---

### Task 36: SearchInput (forms), EditableHeading, DirtyFormGuard

1. **SearchInput (forms)** — generic version with `onSearch` callback prop, debounced. No URL coupling.
2. **EditableHeading** — ref: `core/web/src/components/forms/editable-heading/`. Replace i18n with label props.
3. **DirtyFormGuard** — replaces FormikDirtyPrompt. Uses RHF `formState.isDirty` and our LeavePageConfirmation primitive.

**Commit:** `feat(forms): add SearchInput, EditableHeading, DirtyFormGuard`

---

### Task 37: Forms barrel export

**Files:**
- Update: `src/forms/index.ts`

Export all form fields. Verify build + typecheck.

**Commit:** `feat(forms): add barrel exports`

---

## Phase 7: Feedback (Layer 6)

### Task 38: ConfirmModal + Provider

**Files:**
- Create: `src/feedback/confirm-modal.tsx`
- Create: `src/feedback/index.ts`
- Create: `src/feedback/confirm-modal.stories.tsx`

Read reference: `/Users/jeskoiwanovski/repo/core/web/src/components/modals/confirm-modal/confirm-modal.tsx`.

Changes:
1. Replace `Markup` from `interweave` with direct ReactNode rendering (accept `message: React.ReactNode` instead of HTML string)
2. Replace FontAwesome icons with Lucide
3. Labels as props with English defaults

Keep the `ConfirmModalProvider` + `useConfirmModal()` hook pattern — it's excellent.

**Verify in Storybook.**

**Commit:** `feat(feedback): add ConfirmModal with provider and hook`

---

## Phase 8: CI/CD & Polish

### Task 39: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
      - run: npm run test
```

**Commit:** `ci: add GitHub Actions workflow`

---

### Task 40: GitHub Pages Storybook deployment

**Files:**
- Create: `.github/workflows/storybook.yml`

```yaml
name: Deploy Storybook

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build:storybook
      - uses: actions/upload-pages-artifact@v3
        with:
          path: storybook-static
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Commit:** `ci: add Storybook GitHub Pages deployment`

---

### Task 41: npm publish workflow

**Files:**
- Create: `.github/workflows/publish.yml`

```yaml
name: Publish

on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Commit:** `ci: add npm publish on tag workflow`

---

### Task 42: Final verification

**Step 1: Full build**

Run: `npm run build`
Expected: All 6 entry points built, no errors

**Step 2: Full typecheck**

Run: `npm run typecheck`
Expected: No type errors

**Step 3: Full lint**

Run: `npm run lint`
Expected: Clean

**Step 4: Storybook build**

Run: `npm run build:storybook`
Expected: `storybook-static/` created

**Step 5: Review dist/ output**

Run: `ls -la dist/`
Expected: theme/, primitives/, components/, atoms/, forms/, feedback/ directories with .js and .d.ts files

---

## Summary

| Phase | Tasks | Components | Commits |
|-------|-------|------------|---------|
| 1. Scaffolding | 1-7 | 0 | 7 |
| 2. Theme | 8-14 | 24 recipes + tokens | 7 |
| 3. Primitives | 15-16 | 14 | ~5 |
| 4. Components | 17-21 | 10 | ~5 |
| 5. Atoms | 22-31 | 15 groups | ~10 |
| 6. Forms | 32-37 | 19 | ~6 |
| 7. Feedback | 38 | 1 | 1 |
| 8. CI/CD | 39-42 | 0 | 3 |
| **Total** | **42 tasks** | **~80 components** | **~44 commits** |
