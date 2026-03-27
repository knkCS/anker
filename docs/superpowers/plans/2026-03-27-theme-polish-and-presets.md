# Theme Polish & Preset System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the solid/primary variant bug, elevate Anker's visual polish (shadows, motion, typography), and introduce a theme preset system so consuming services can express visual personality within the design system.

**Architecture:** Three phases — (1) fix colorPalette defaults across recipes so `solid` variants render primary blue, (2) enrich token layers with deeper shadows, richer motion, and extended typography, (3) add a preset system that merges personality overrides on top of the base theme via a `createAnkerTheme()` factory.

**Tech Stack:** Chakra UI v3 (`createSystem`, `defineRecipe`, `defineSlotRecipe`), TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/theme/recipes/button.ts` | Modify | Add `colorPalette: "primary"` to `defaultVariants`, deprecation comment on `primary` variant |
| `src/theme/recipes/tag.ts` | Modify | Add `colorPalette: "primary"` to `defaultVariants` |
| `src/primitives/leave-page-confirmation.tsx` | Modify | Remove bare `variant="solid"` or switch to `variant="primary"` |
| `src/atoms/comment/comment-reply-box.tsx` | Modify | Remove bare `variant="solid"` or switch to `variant="primary"` |
| `src/atoms/button/button.stories.tsx` | Modify | Add story verifying solid defaults to primary blue |
| `src/theme/tokens/semantic.ts` | Modify | Add `2xl` shadow, `focus-ring` shadow, `colored` shadow tokens |
| `src/theme/tokens/animations.ts` | Modify | Add `slower`/`entrance`/`exit` durations, `spring` easing, keyframe tokens |
| `src/theme/tokens/typography.ts` | Modify | Add `caption`, `overline`, `display` text styles |
| `src/theme/recipes/button.ts` | Modify (phase 2) | Add `_active` scale transform, focus-ring shadow |
| `src/theme/recipes/card.ts` | Modify | Add hover-lift transition to `elevated` variant |
| `src/theme/recipes/modal.ts` | Modify | Add backdrop blur |
| `src/theme/recipes/tooltip.ts` | Modify | Add entrance animation |
| `src/theme/index.ts` | Modify | Register new tokens, export `createAnkerTheme` |
| `src/theme/presets/types.ts` | Create | `ThemePreset` interface |
| `src/theme/presets/default.ts` | Create | Default (no-op) preset |
| `src/theme/presets/index.ts` | Create | Barrel export |
| `src/theme/create-theme.ts` | Create | `createAnkerTheme(preset?)` factory |

---

## Phase 1: Fix colorPalette Defaults

### Task 1: Add colorPalette default to button recipe

**Files:**
- Modify: `src/theme/recipes/button.ts:185-188`

- [ ] **Step 1: Add `colorPalette` to `defaultVariants`**

The stepper and checkbox recipes already use this pattern (`colorPalette: "primary" as never`). Apply the same to the button recipe.

Open `src/theme/recipes/button.ts` and change the `defaultVariants` block:

```ts
// Before:
defaultVariants: {
	size: "lg",
	variant: "solid",
},

// After:
defaultVariants: {
	size: "lg",
	variant: "solid",
	colorPalette: "primary" as never,
},
```

- [ ] **Step 2: Add deprecation comment to `primary` variant**

The `primary` variant is now functionally equivalent to `solid` (since solid defaults to the primary colorPalette). Mark it as deprecated so consumers migrate over time.

In the same file, update the comment above the `primary` variant:

```ts
// Before:
// Primary: solid style locked to the primary color palette
primary: {

// After:
// @deprecated Use variant="solid" instead — solid now defaults to
// colorPalette="primary". This variant will be removed in a future
// major release.
primary: {
```

- [ ] **Step 3: Verify in Storybook**

Run: `npm run dev`

Open the Button stories. Confirm:
- `<Button>` (no variant) → blue solid button
- `<Button variant="solid">` → blue solid button
- `<Button variant="solid" colorPalette="secondary">` → orange solid button
- `<Button variant="primary">` → still works (blue), backward-compatible
- `<Button variant="secondary">` → gray outline, unchanged
- `<Button variant="outline">` → unchanged
- `<Button variant="ghost">` → unchanged

- [ ] **Step 4: Commit**

```bash
git add src/theme/recipes/button.ts
git commit -m "fix(theme): default button colorPalette to primary

The solid variant relied on Chakra's colorPalette default (gray),
rendering black buttons when no colorPalette was specified.
Setting colorPalette: 'primary' in defaultVariants makes solid
buttons blue by default, matching user expectations.

Marks the hardcoded 'primary' variant as deprecated since solid
now achieves the same result via the colorPalette default.

Closes #58"
```

---

### Task 2: Add colorPalette default to tag recipe

**Files:**
- Modify: `src/theme/recipes/tag.ts:123-125`

- [ ] **Step 1: Add `colorPalette` to `defaultVariants`**

Open `src/theme/recipes/tag.ts` and change the `defaultVariants` block:

```ts
// Before:
defaultVariants: {
	size: "lg",
},

// After:
defaultVariants: {
	size: "lg",
	colorPalette: "primary" as never,
},
```

- [ ] **Step 2: Verify in Storybook**

Confirm tag with `variant="solid"` renders with primary blue tones, not gray/black.

- [ ] **Step 3: Commit**

```bash
git add src/theme/recipes/tag.ts
git commit -m "fix(theme): default tag colorPalette to primary

Same fix as button — solid tags now render with primary palette
instead of gray/black when no colorPalette is specified.

Closes #59"
```

---

### Task 3: Fix internal components using bare `variant="solid"`

**Files:**
- Modify: `src/primitives/leave-page-confirmation.tsx:58`
- Modify: `src/atoms/comment/comment-reply-box.tsx:101`

- [ ] **Step 1: Fix leave-page-confirmation**

After Task 1, bare `variant="solid"` now renders primary blue — which is correct for a confirm action. However, these components import the Anker `Button` atom (which defaults to `variant="secondary"`), not `ChakraButton` directly.

Check the import in `leave-page-confirmation.tsx`. If it uses the Anker `Button` atom, `variant="solid"` now gets the correct colorPalette from the recipe default. No change needed other than removing a redundant explicit `colorPalette` if present.

If it imports `ChakraButton` directly, add `colorPalette="primary"`:

```tsx
// If needed:
<Button variant="solid" colorPalette="primary" onClick={onConfirmLeave}>
```

- [ ] **Step 2: Fix comment-reply-box**

Same analysis for `comment-reply-box.tsx:101`. The bare `variant="solid"` should now correctly pick up the primary colorPalette from the recipe default. Verify visually in Storybook.

- [ ] **Step 3: Clean up redundant `colorPalette="primary"` on solid buttons**

After the recipe default is in place, these usages have redundant `colorPalette="primary"`:

- `src/components/drawer.tsx:102` — `variant="solid" colorPalette="primary"` → can remove `colorPalette="primary"`
- `src/components/modal.tsx:62` — same
- `src/components/pagination.tsx:59` — keep (uses conditional colorPalette)
- `src/components/stepper/stepper.stories.tsx:20` — `variant="solid" colorPalette="primary"` → can remove `colorPalette="primary"`

Remove the redundant props from drawer.tsx, modal.tsx, and stepper.stories.tsx.

- [ ] **Step 4: Commit**

```bash
git add src/primitives/leave-page-confirmation.tsx src/atoms/comment/comment-reply-box.tsx src/components/drawer.tsx src/components/modal.tsx src/components/stepper/stepper.stories.tsx
git commit -m "fix(components): remove redundant colorPalette on solid buttons

Now that the button recipe defaults colorPalette to primary,
explicit colorPalette='primary' on solid buttons is redundant.
Cleans up internal usages for consistency.

Closes #60"
```

---

### Task 4: Add Storybook story verifying solid default

**Files:**
- Modify: `src/atoms/button/button.stories.tsx`

- [ ] **Step 1: Read current button stories**

Read `src/atoms/button/button.stories.tsx` to understand existing story structure.

- [ ] **Step 2: Add a "SolidDefaultsPrimary" story**

Add a story that demonstrates the solid variant renders with primary blue by default, and that it can be overridden with a different colorPalette:

```tsx
export const SolidDefaultsPrimary: Story = {
	render: () => (
		<HStack gap={4}>
			<Button variant="solid">Primary (default)</Button>
			<Button variant="solid" colorPalette="secondary">Secondary override</Button>
			<Button variant="solid" colorPalette="gray">Gray override</Button>
		</HStack>
	),
};
```

- [ ] **Step 3: Verify in Storybook**

Run: `npm run dev`

Confirm the story shows: blue default, orange secondary override, gray override.

- [ ] **Step 4: Commit**

```bash
git add src/atoms/button/button.stories.tsx
git commit -m "docs(button): add story showing solid colorPalette defaults

Closes #61"
```

---

## Phase 2: Visual Polish Pass

### Task 5: Enrich shadow tokens

**Files:**
- Modify: `src/theme/tokens/semantic.ts:161-197`

- [ ] **Step 1: Add `2xl` and `focus-ring` shadow tokens**

Open `src/theme/tokens/semantic.ts` and add new shadow levels after the existing `xl` shadow:

```ts
shadows: {
	// ... existing xs through xl ...
	"2xl": {
		value: {
			base: "0px 0px 1px rgba(45, 55, 72, 0.04), 0px 24px 48px rgba(45, 55, 72, 0.12)",
			_dark:
				"0px 0px 1px rgba(13, 14, 20, 1), 0px 24px 48px rgba(13, 14, 20, 0.9)",
		},
	},
	"focus-ring": {
		value: {
			base: "0 0 0 3px rgba(32, 135, 215, 0.4)",
			_dark: "0 0 0 3px rgba(32, 135, 215, 0.6)",
		},
	},
},
```

The `2xl` shadow provides a diffused hero-card/modal level. The `focus-ring` shadow replaces outline-based focus indicators with a softer glow using the primary color (`#2087d7 = rgba(32, 135, 215)`).

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS — semantic tokens accept arbitrary keys.

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens/semantic.ts
git commit -m "feat(theme): add 2xl and focus-ring shadow tokens

2xl provides diffused depth for hero cards and modals.
focus-ring provides a primary-tinted glow for interactive focus states.

Closes #62"
```

---

### Task 6: Extend motion tokens

**Files:**
- Modify: `src/theme/tokens/animations.ts`

- [ ] **Step 1: Add extended durations, easings, and keyframes**

Replace the full content of `src/theme/tokens/animations.ts`:

```ts
/**
 * Motion tokens for consistent animation timing across components.
 */
export const durations = {
	fast: { value: "150ms" },
	normal: { value: "200ms" },
	slow: { value: "300ms" },
	slower: { value: "400ms" },
	entrance: { value: "250ms" },
	exit: { value: "200ms" },
};

export const easings = {
	"ease-in": { value: "cubic-bezier(0.4, 0, 1, 1)" },
	"ease-out": { value: "cubic-bezier(0, 0, 0.2, 1)" },
	"ease-in-out": { value: "cubic-bezier(0.4, 0, 0.2, 1)" },
	spring: { value: "cubic-bezier(0.175, 0.885, 0.32, 1.275)" },
};

/**
 * Reusable keyframe definitions for component animations.
 * These are CSS keyframe strings intended for use in globalCss or recipes.
 */
export const keyframes = {
	fadeIn: {
		from: { opacity: 0 },
		to: { opacity: 1 },
	},
	fadeOut: {
		from: { opacity: 1 },
		to: { opacity: 0 },
	},
	slideUp: {
		from: { opacity: 0, transform: "translateY(4px)" },
		to: { opacity: 1, transform: "translateY(0)" },
	},
	slideDown: {
		from: { opacity: 0, transform: "translateY(-4px)" },
		to: { opacity: 1, transform: "translateY(0)" },
	},
	scaleIn: {
		from: { opacity: 0, transform: "scale(0.95)" },
		to: { opacity: 1, transform: "scale(1)" },
	},
};
```

- [ ] **Step 2: Export keyframes from token barrel**

Open `src/theme/tokens/index.ts` and add the keyframes export:

```ts
export { durations, easings, keyframes } from "./animations";
```

- [ ] **Step 3: Register keyframes in theme system**

Open `src/theme/index.ts`. Import `keyframes` from tokens and add to `globalCss`:

```ts
// Add to imports:
import { ..., keyframes } from "./tokens";

// Add to globalCss (inside the createSystem call):
globalCss: {
	"@keyframes fadeIn": keyframes.fadeIn,
	"@keyframes fadeOut": keyframes.fadeOut,
	"@keyframes slideUp": keyframes.slideUp,
	"@keyframes slideDown": keyframes.slideDown,
	"@keyframes scaleIn": keyframes.scaleIn,
	// ... existing body, placeholder, border rules ...
},
```

Also add `keyframes` to the re-export block at the bottom of the file:

```ts
export {
	colors,
	durations,
	easings,
	fonts,
	keyframes,
	radii,
	semanticTokens,
	space,
	textStyles,
	zIndex,
} from "./tokens";
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens/animations.ts src/theme/tokens/index.ts src/theme/index.ts
git commit -m "feat(theme): extend motion tokens with entrance/exit timing, spring easing, keyframes

Adds slower/entrance/exit durations, spring easing for natural
micro-interactions, and fadeIn/fadeOut/slideUp/slideDown/scaleIn
keyframes registered globally for use in component recipes.

Closes #63"
```

---

### Task 7: Add text style presets

**Files:**
- Modify: `src/theme/tokens/typography.ts`

- [ ] **Step 1: Add `caption`, `overline`, and `display` text styles**

Open `src/theme/tokens/typography.ts` and add three new text style entries to the `textStyles` object:

```ts
export const textStyles = {
	// ... existing 7xl through xs entries ...

	// Additional semantic presets
	display: {
		fontSize: "6xl",
		lineHeight: "4.5rem",
		letterSpacing: "-0.03em",
		fontWeight: "bold",
	},
	caption: {
		fontSize: "xs",
		lineHeight: "1rem",
		letterSpacing: "0.01em",
		color: "muted",
	},
	overline: {
		fontSize: "xs",
		lineHeight: "1rem",
		letterSpacing: "0.08em",
		fontWeight: "semibold",
		textTransform: "uppercase" as const,
	},
};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens/typography.ts
git commit -m "feat(theme): add display, caption, and overline text style presets

display: large hero headings with tighter tracking.
caption: small muted text for secondary information.
overline: uppercase label text for section headers.

Closes #64"
```

---

### Task 8: Polish button recipe with active transform and focus-ring

**Files:**
- Modify: `src/theme/recipes/button.ts`

- [ ] **Step 1: Add `_active` scale transform to button base**

Open `src/theme/recipes/button.ts`. Add a subtle press-down effect and upgrade the focus style to use the shadow-based focus ring. Modify the `base` block:

```ts
base: {
	lineHeight: "1.2",
	borderRadius: "md",
	fontWeight: "semibold",
	transitionProperty: "common",
	transitionDuration: "normal",
	_focusVisible: {
		boxShadow: "focus-ring",
		outline: "none",
	},
	_active: {
		transform: "scale(0.98)",
	},
	_disabled: {
		opacity: 0.4,
		cursor: "not-allowed",
		boxShadow: "none",
		_active: {
			transform: "none",
		},
	},
	_hover: {
		_disabled: {
			bg: "initial",
		},
	},
	// WCAG 2.5.8 touch target: expand hit area to 44×44px minimum
	_after: {
		content: '""',
		position: "absolute",
		top: "50%",
		insetInlineStart: "50%",
		minWidth: "44px",
		minHeight: "44px",
		transform: "translate(-50%, -50%)",
	},
},
```

Changes:
- `_focusVisible`: replaced outline with `boxShadow: "focus-ring"` (the semantic shadow token from Task 5)
- `_active`: added `transform: "scale(0.98)"` for tactile press feedback
- `_disabled._active`: prevent scale on disabled buttons

- [ ] **Step 2: Verify in Storybook**

Run: `npm run dev`

Tab-focus a button → should show soft primary-tinted glow instead of hard outline.
Click a button → should see subtle scale-down effect.
Disabled button → no transform on click.

- [ ] **Step 3: Commit**

```bash
git add src/theme/recipes/button.ts
git commit -m "feat(button): add focus-ring shadow and active scale transform

Replaces hard outline focus with soft primary-tinted glow.
Adds subtle scale(0.98) press-down effect for tactile feedback.
Disabled buttons are excluded from the active transform.

Closes #65"
```

---

### Task 9: Polish card recipe with hover-lift

**Files:**
- Modify: `src/theme/recipes/card.ts`

- [ ] **Step 1: Read current card recipe**

Read `src/theme/recipes/card.ts` to understand the current structure.

- [ ] **Step 2: Add transition and hover-lift to `elevated` variant**

Add a transition to the card base and a hover-lift effect to the `elevated` variant:

```ts
base: {
	root: {
		// ... existing styles ...
		transitionProperty: "box-shadow, transform",
		transitionDuration: "normal",
	},
},
variants: {
	variant: {
		elevated: {
			root: {
				boxShadow: "md",
				_hover: {
					boxShadow: "lg",
					transform: "translateY(-1px)",
				},
			},
		},
		// ... flat variant unchanged ...
	},
},
```

Only the `elevated` variant gets hover-lift. The `flat` variant stays static.

- [ ] **Step 3: Verify in Storybook**

Hover an elevated card → should lift slightly with shadow deepening.
Flat card → no change on hover.

- [ ] **Step 4: Commit**

```bash
git add src/theme/recipes/card.ts
git commit -m "feat(card): add hover-lift animation to elevated variant

Elevated cards lift 1px and deepen shadow on hover for
subtle depth feedback. Flat cards are unaffected.

Closes #66"
```

---

### Task 10: Polish tooltip recipe with entrance animation

**Files:**
- Modify: `src/theme/recipes/tooltip.ts`

- [ ] **Step 1: Read current tooltip recipe**

Read `src/theme/recipes/tooltip.ts` to understand the current structure.

- [ ] **Step 2: Add slideUp entrance animation**

Add animation properties to the tooltip content slot or base styles:

```ts
// Add to tooltip base/content styles:
animation: "slideUp 150ms ease-out",
```

Use the globally registered `slideUp` keyframe from Task 6.

- [ ] **Step 3: Verify in Storybook**

Hover a tooltip trigger → tooltip should fade-slide in from below instead of appearing instantly.

- [ ] **Step 4: Commit**

```bash
git add src/theme/recipes/tooltip.ts
git commit -m "feat(tooltip): add slideUp entrance animation

Tooltips now fade-slide in from below (150ms ease-out) instead
of appearing instantly, using the global slideUp keyframe.

Closes #67"
```

---

### Task 11: Polish modal recipe with backdrop blur

**Files:**
- Modify: `src/theme/recipes/modal.ts`

- [ ] **Step 1: Read current modal recipe**

Read `src/theme/recipes/modal.ts` to understand the current structure.

- [ ] **Step 2: Add backdrop blur to overlay slot**

Add `backdropFilter: "blur(4px)"` to the modal's overlay/backdrop slot:

```ts
// In the overlay/backdrop slot:
backdrop: {
	// ... existing styles ...
	backdropFilter: "blur(4px)",
},
```

- [ ] **Step 3: Verify in Storybook**

Open a modal → backdrop should show frosted glass blur effect over content behind it.

- [ ] **Step 4: Commit**

```bash
git add src/theme/recipes/modal.ts
git commit -m "feat(modal): add backdrop blur to overlay

Modal overlay now applies a 4px backdrop blur for a frosted
glass effect, adding visual depth when modals are open.

Closes #68"
```

---

## Phase 3: Theme Preset System

### Task 12: Define ThemePreset interface

**Files:**
- Create: `src/theme/presets/types.ts`

- [ ] **Step 1: Create the ThemePreset type**

Create `src/theme/presets/types.ts`:

```ts
import type { SystemConfig } from "@chakra-ui/react";

/**
 * A theme preset provides optional overrides for token layers.
 * Each field maps to a section of the Chakra theme config.
 * Undefined fields inherit from the base Anker theme.
 */
export interface ThemePreset {
	/** Human-readable preset name (e.g., "vibrant", "editorial") */
	name: string;

	/** Override raw color tokens */
	colors?: SystemConfig["theme"] extends infer T
		? T extends { tokens?: { colors?: infer C } }
			? C
			: never
		: never;

	/** Override semantic tokens (shadows, colors, opacity) */
	semanticTokens?: SystemConfig["theme"] extends infer T
		? T extends { semanticTokens?: infer S }
			? S
			: never
		: never;

	/** Override text style presets */
	textStyles?: Record<
		string,
		{
			fontSize?: string;
			lineHeight?: string;
			letterSpacing?: string;
			fontWeight?: string;
			textTransform?: string;
		}
	>;

	/** Override font families */
	fonts?: { heading?: string; body?: string };

	/** Override border radii */
	radii?: Record<string, string>;

	/** Override duration tokens */
	durations?: Record<string, { value: string }>;

	/** Override easing tokens */
	easings?: Record<string, { value: string }>;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/theme/presets/types.ts
git commit -m "feat(theme): add ThemePreset interface

Defines the shape of theme personality presets — optional
overrides for colors, shadows, typography, radii, and motion
that layer on top of the base Anker theme.

Closes #69"
```

---

### Task 13: Create default preset and barrel export

**Files:**
- Create: `src/theme/presets/default.ts`
- Create: `src/theme/presets/index.ts`

- [ ] **Step 1: Create the default preset**

Create `src/theme/presets/default.ts`:

```ts
import type { ThemePreset } from "./types";

/**
 * Default preset — applies no overrides.
 * Equivalent to using the base Anker theme as-is.
 */
export const defaultPreset: ThemePreset = {
	name: "default",
};
```

- [ ] **Step 2: Create barrel export**

Create `src/theme/presets/index.ts`:

```ts
export type { ThemePreset } from "./types";
export { defaultPreset } from "./default";
```

- [ ] **Step 3: Commit**

```bash
git add src/theme/presets/
git commit -m "feat(theme): add default preset and barrel export

Closes #70"
```

---

### Task 14: Create `createAnkerTheme()` factory

**Files:**
- Create: `src/theme/create-theme.ts`
- Modify: `src/theme/index.ts`

- [ ] **Step 1: Create the factory function**

Create `src/theme/create-theme.ts`:

```ts
import { createSystem, defaultConfig } from "@chakra-ui/react";
import type { ThemePreset } from "./presets/types";
import {
	colors as baseColors,
	durations as baseDurations,
	easings as baseEasings,
	fonts as baseFonts,
	radii as baseRadii,
	semanticTokens as baseSemanticTokens,
	space,
	textStyles as baseTextStyles,
	zIndex,
} from "./tokens";
import { keyframes } from "./tokens";

// Import all recipes
import {
	button,
	card,
	checkbox,
	comment,
	container,
	dialog,
	drawer,
	formLabel,
	input,
	menu,
	modal,
	persona,
	popover,
	prose,
	separator,
	stepper,
	table,
	tabs,
	tag,
	textarea,
	tooltip,
	treeItem,
	tsProperty,
	tsRadioCard,
} from "./recipes";
import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * Creates an Anker theme system with optional preset overrides.
 * Without a preset (or with the default preset), this produces the
 * same system as the default export from `@knkcs/anker/theme`.
 *
 * @example
 * ```tsx
 * import { createAnkerTheme } from "@knkcs/anker/theme";
 * import { vibrant } from "@knkcs/anker/theme/presets";
 *
 * <Provider system={createAnkerTheme(vibrant)}>
 * ```
 */
export function createAnkerTheme(preset?: ThemePreset) {
	const fonts = {
		heading: preset?.fonts?.heading ?? baseFonts.heading,
		body: preset?.fonts?.body ?? baseFonts.body,
	};

	const colors = preset?.colors
		? { ...baseColors, ...preset.colors }
		: baseColors;

	const durations = preset?.durations
		? { ...baseDurations, ...preset.durations }
		: baseDurations;

	const easings = preset?.easings
		? { ...baseEasings, ...preset.easings }
		: baseEasings;

	const radii = preset?.radii ?? baseRadii;

	const textStyles = preset?.textStyles
		? { ...baseTextStyles, ...preset.textStyles }
		: baseTextStyles;

	const semanticTokens = preset?.semanticTokens
		? deepMerge(baseSemanticTokens, preset.semanticTokens)
		: baseSemanticTokens;

	return createSystem(defaultConfig, {
		globalCss: {
			"@keyframes fadeIn": keyframes.fadeIn,
			"@keyframes fadeOut": keyframes.fadeOut,
			"@keyframes slideUp": keyframes.slideUp,
			"@keyframes slideDown": keyframes.slideDown,
			"@keyframes scaleIn": keyframes.scaleIn,
			body: {
				color: "default",
				bg: { base: "white", _dark: "#000" },
			},
			"*::placeholder": {
				opacity: 1,
				color: "muted",
			},
			"*, *::before, *::after": {
				borderColor: "border",
			},
			"table, td, th": {
				borderColor: "border",
			},
			"html, body": {
				height: "100%",
			},
			"#__next, #root, #app": {
				display: "flex",
				flexDirection: "column",
				minH: "100%",
			},
			"*": {
				_motionReduce: {
					animationDuration: "0.01ms !important",
					animationIterationCount: "1 !important",
					transitionDuration: "0.01ms !important",
					scrollBehavior: "auto !important",
				},
			},
		},
		theme: {
			tokens: {
				colors,
				durations,
				easings,
				fonts: {
					heading: { value: fonts.heading },
					body: { value: fonts.body },
				},
				spacing: Object.fromEntries(
					Object.entries(space).map(([k, v]) => [k, { value: v }]),
				),
				radii: typeof radii === "object" && "sm" in radii && typeof (radii as Record<string, unknown>).sm === "string"
					? Object.fromEntries(
							Object.entries(radii).map(([k, v]) => [k, { value: v }]),
						)
					: Object.fromEntries(
							Object.entries(radii).map(([k, v]) => [k, { value: v }]),
						),
				zIndex,
			},
			textStyles,
			semanticTokens,
			recipes: {
				button,
				container,
				prose,
				separator,
				formLabel,
				textarea,
				tooltip,
				tsRadioCard,
				tag,
			},
			slotRecipes: {
				card,
				tsProperty,
				treeItem,
				checkbox,
				comment,
				dialog,
				drawer,
				field: defineSlotRecipe({
					slots: ["root"],
					variants: {
						orientation: {
							vertical: {
								root: { alignItems: "stretch" },
							},
						},
					},
				}),
				input,
				menu,
				modal,
				persona,
				popover,
				stepper,
				table,
				tabs,
			},
		},
	});
}

/** Deep-merge two objects (1 level deep for token groups). */
function deepMerge<T extends Record<string, unknown>>(
	base: T,
	override: Partial<T>,
): T {
	const result = { ...base };
	for (const key of Object.keys(override) as (keyof T)[]) {
		const baseVal = base[key];
		const overrideVal = override[key];
		if (
			baseVal &&
			overrideVal &&
			typeof baseVal === "object" &&
			typeof overrideVal === "object" &&
			!Array.isArray(baseVal)
		) {
			result[key] = { ...baseVal, ...overrideVal } as T[keyof T];
		} else if (overrideVal !== undefined) {
			result[key] = overrideVal as T[keyof T];
		}
	}
	return result;
}
```

- [ ] **Step 2: Export from theme index**

Open `src/theme/index.ts` and add the export:

```ts
// Add at the end of the file:
export { createAnkerTheme } from "./create-theme";
export type { ThemePreset } from "./presets";
export { defaultPreset } from "./presets";
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/theme/create-theme.ts src/theme/index.ts
git commit -m "feat(theme): add createAnkerTheme() factory for preset-based theming

Consumers can now create customized theme systems by passing a
ThemePreset to createAnkerTheme(). Presets override token layers
(colors, shadows, typography, radii, motion) while preserving
all component recipes and structural defaults.

Closes #71"
```

---

### Task 15: Verify end-to-end preset system

**Files:**
- No new files — verification only

- [ ] **Step 1: Create a temporary test story**

Create a quick test story (can be deleted after verification) that uses `createAnkerTheme` with a mock preset:

```tsx
// Temporary: src/theme/__test-story__/preset-test.stories.tsx
import { Provider } from "../../primitives/provider";
import { Button } from "../../atoms/button/button";
import { createAnkerTheme } from "../create-theme";
import type { ThemePreset } from "../presets";

const testPreset: ThemePreset = {
	name: "test",
	fonts: { heading: "Georgia, serif" },
	radii: { sm: "0", md: "0", lg: "0", xl: "0", "2xl": "0" },
};

const testSystem = createAnkerTheme(testPreset);

export default { title: "Theme/Preset Test" };

export const WithPreset = () => (
	<Provider system={testSystem}>
		<Button variant="solid">Sharp corners, serif heading</Button>
	</Provider>
);
```

- [ ] **Step 2: Verify in Storybook**

Run: `npm run dev`

Open the "Theme/Preset Test" story. Confirm:
- Button has sharp corners (radii overridden to 0)
- If heading text is visible, it uses Georgia serif

- [ ] **Step 3: Delete test story and commit**

Delete the temporary test story. Run final checks:

```bash
npm run typecheck && npm run lint
```

- [ ] **Step 4: Final commit**

```bash
git commit -m "chore: verify preset system works end-to-end

Closes #72"
```
