# DirtyDot Atom + Dirty Surfaces Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@knkcs/anker@2.7.0` with a new `<DirtyDot />` atom and a `Forms/Dirty surfaces` mdx page that catalogues the three established dirty surfaces (field visual, counter chip, tab dot).

**Architecture:** Additive only. New folder `src/atoms/dirty-dot/` mirroring the `empty-state` atom shape (`<name>.tsx`, `<name>.stories.tsx`, `index.ts`). New mdx in `src/forms/dirty-surfaces.mdx`. Re-exports added to `src/atoms/index.ts`. No breaking changes — minor version bump `2.6.4 → 2.7.0`.

**Tech Stack:** React 19, Chakra UI v3 primitives (`Box` from `../../primitives/layout`), Vitest + `@testing-library/react`, Storybook 8 mdx, npm + git tags for release.

**Spec:** `/Users/jeskoiwanovski/repo/template/docs/superpowers/specs/2026-05-29-tab-dirty-dot-and-not-found-design.md` §3.

---

## File structure

| File | Responsibility |
|---|---|
| `src/atoms/dirty-dot/dirty-dot.tsx` | The `DirtyDot` component + `DirtyDotProps` type. |
| `src/atoms/dirty-dot/dirty-dot.test.tsx` | Two vitest cases (renders / suppressed). |
| `src/atoms/dirty-dot/dirty-dot.stories.tsx` | One Storybook story for visual reference. |
| `src/atoms/dirty-dot/index.ts` | Barrel for the folder. |
| `src/atoms/index.ts` | Append re-export of `DirtyDot` + `DirtyDotProps`. |
| `src/forms/dirty-surfaces.mdx` | Storybook docs page under `Forms/Dirty surfaces`. |
| `package.json` | Version bump 2.6.4 → 2.7.0. |
| `CHANGELOG.md` (if present) | 2.7.0 entry. |

---

### Task 1: Create DirtyDot atom folder + failing test

**Files:**
- Create: `src/atoms/dirty-dot/dirty-dot.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { DirtyDot } from "./dirty-dot";

describe("DirtyDot", () => {
  it("renders the dot when active (default)", () => {
    const { container } = render(<DirtyDot />);
    const span = container.querySelector("span[aria-label]");
    expect(span).not.toBeNull();
    expect(span?.getAttribute("aria-label")).toBe("ungespeicherte Änderungen");
  });

  it("renders nothing when active is false", () => {
    const { container } = render(<DirtyDot active={false} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/atoms/dirty-dot/dirty-dot.test.tsx`
Expected: FAIL — `Failed to resolve import "./dirty-dot"`.

- [ ] **Step 3: Commit failing test**

```bash
git checkout -b feat/dirty-dot-atom
git add src/atoms/dirty-dot/dirty-dot.test.tsx
git commit -m "test(dirty-dot): add failing tests for new atom"
```

---

### Task 2: Implement DirtyDot

**Files:**
- Create: `src/atoms/dirty-dot/dirty-dot.tsx`
- Create: `src/atoms/dirty-dot/index.ts`

- [ ] **Step 1: Implement the atom**

`src/atoms/dirty-dot/dirty-dot.tsx`:

```tsx
import type { BoxProps } from "../../primitives/layout";
import { Box } from "../../primitives/layout";

export interface DirtyDotProps {
	/** Render nothing when false. @default true */
	active?: boolean;
	/** aria-label for screen readers. @default "ungespeicherte Änderungen" */
	label?: string;
	/** Box prop overrides (ml, color, size if anyone needs them). */
	boxProps?: BoxProps;
}

export function DirtyDot({
	active = true,
	label = "ungespeicherte Änderungen",
	boxProps,
}: DirtyDotProps) {
	if (!active) return null;
	return (
		<Box
			as="span"
			display="inline-block"
			width="6px"
			height="6px"
			bg="yellow.500"
			borderRadius="full"
			ml="2"
			aria-label={label}
			{...boxProps}
		/>
	);
}
DirtyDot.displayName = "DirtyDot";
```

- [ ] **Step 2: Create barrel**

`src/atoms/dirty-dot/index.ts`:

```ts
export { DirtyDot, type DirtyDotProps } from "./dirty-dot";
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run src/atoms/dirty-dot/dirty-dot.test.tsx`
Expected: PASS — 2/2.

- [ ] **Step 4: Commit**

```bash
git add src/atoms/dirty-dot/dirty-dot.tsx src/atoms/dirty-dot/index.ts
git commit -m "feat(dirty-dot): add DirtyDot atom"
```

---

### Task 3: Export from atoms barrel

**Files:**
- Modify: `src/atoms/index.ts`

- [ ] **Step 1: Append export**

Open `src/atoms/index.ts` and append (keep alphabetical placement if the file is sorted; otherwise append at end):

```ts
// DirtyDot
export { DirtyDot, type DirtyDotProps } from "./dirty-dot";
```

- [ ] **Step 2: Verify import path resolves**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Run verify-exports**

Run: `npm run verify-exports` (or `npm run build && npm run verify-exports` if the script needs the build artifact)
Expected: `DirtyDot` and `DirtyDotProps` present in the resolved exports of `@knkcs/anker/atoms`.

- [ ] **Step 4: Commit**

```bash
git add src/atoms/index.ts
git commit -m "feat(atoms): re-export DirtyDot from atoms barrel"
```

---

### Task 4: Storybook story for DirtyDot

**Files:**
- Create: `src/atoms/dirty-dot/dirty-dot.stories.tsx`

- [ ] **Step 1: Write the story**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { DirtyDot } from "./dirty-dot";

const meta: Meta<typeof DirtyDot> = {
	title: "Atoms/DirtyDot",
	component: DirtyDot,
	args: { active: true },
	argTypes: {
		active: { control: "boolean" },
		label: { control: "text" },
	},
};
export default meta;

type Story = StoryObj<typeof DirtyDot>;

export const Active: Story = {
	render: (args) => (
		<span style={{ font: "14px system-ui" }}>
			Editor
			<DirtyDot {...args} />
		</span>
	),
};

export const Hidden: Story = {
	args: { active: false },
	render: (args) => (
		<span style={{ font: "14px system-ui" }}>
			Editor
			<DirtyDot {...args} />
		</span>
	),
};
```

- [ ] **Step 2: Run Storybook build (smoke)**

Run: `npm run build-storybook`
Expected: builds without errors and the new story is included.

- [ ] **Step 3: Commit**

```bash
git add src/atoms/dirty-dot/dirty-dot.stories.tsx
git commit -m "docs(dirty-dot): add Storybook story"
```

---

### Task 5: Dirty Surfaces docs page

**Files:**
- Create: `src/forms/dirty-surfaces.mdx`

- [ ] **Step 1: Write the mdx page**

```mdx
import { Meta } from "@storybook/blocks";

<Meta title="Forms/Dirty surfaces" />

# Dirty surfaces

knkCMS surfaces unsaved changes in three coordinated ways. Use the matching
component for the surface you need — don't invent new dirty visuals.

| Surface | Component | Where it fires |
|---|---|---|
| **Field-level dirty visual** | yellow input border + dot on label | automatic on `InputField` / `SelectField` / `SwitchField` / `TextareaField` / `ArrayField` / `RadioGroupField` / `CheckboxField` via `formState.dirtyFields`. Opt out with `showDirtyState={false}`. |
| **Header counter chip** | `<DirtyCounter />` | reads dirty count from `useFormContext`. Mount in the page header via `usePageActions`. |
| **Tab-trigger dot** | `<DirtyDot active={…} />` | when a tabbed page has editable content on one tab and the user might be on another. Mount inside the `Tabs.Trigger`. |

## Field-level dirty visual

```tsx
import { InputField } from "@knkcs/anker/forms";

<InputField name="title" label="Title" />
// Yellow border + label dot appear automatically when the field is dirty.
```

## Header counter chip

```tsx
import { DirtyCounter } from "@knkcs/anker/forms";
import { usePageActions } from "@knkcs/anker/templates";

usePageActions(<DirtyCounter />);
```

## Tab-trigger dot

```tsx
import { DirtyDot } from "@knkcs/anker/atoms";

<Tabs.Trigger value="editor">
  Editor
  <DirtyDot active={isDirty} />
</Tabs.Trigger>
```

The dot is a 6px yellow circle with `ml="2"` and the aria-label
"ungespeicherte Änderungen". Pass `active={false}` to hide it; use `boxProps`
to override colour or margin if you really need to.
```

- [ ] **Step 2: Verify Storybook picks it up**

Run: `npm run build-storybook`
Expected: builds clean; `Forms/Dirty surfaces` appears in the nav tree (visible by inspecting the build output index or running `npm run storybook` locally).

- [ ] **Step 3: Commit**

```bash
git add src/forms/dirty-surfaces.mdx
git commit -m "docs(forms): catalogue the three dirty surfaces"
```

---

### Task 6: Lint + typecheck + full test pass

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Full test suite**

Run: `npm test`
Expected: all green, including the two new `DirtyDot` cases.

- [ ] **Step 4: Build + verify-exports**

Run: `npm run build && npm run verify-exports`
Expected: clean; `DirtyDot` exported from `@knkcs/anker/atoms`.

- [ ] **Step 5: If any of the above failed, fix and commit**

```bash
git add -A
git commit -m "fix(dirty-dot): address lint/typecheck/build feedback"
```

(Skip if everything passed.)

---

### Task 7: Version bump + release

**Files:**
- Modify: `package.json` (version field)
- Modify: `CHANGELOG.md` if it exists

- [ ] **Step 1: Bump version**

Edit `package.json`:

```json
"version": "2.7.0",
```

- [ ] **Step 2: Update changelog (if CHANGELOG.md exists)**

Prepend under a new `## 2.7.0 — 2026-05-29` heading:

```markdown
## 2.7.0 — 2026-05-29

### Added
- `DirtyDot` atom — a 6px yellow dot for tab-trigger unsaved-changes signalling.
- `Forms/Dirty surfaces` Storybook page documenting the three dirty surfaces
  (field visual, `DirtyCounter` chip, `DirtyDot` tab indicator).
```

If `CHANGELOG.md` does not exist, skip this step.

- [ ] **Step 3: Commit version bump**

```bash
git add package.json CHANGELOG.md 2>/dev/null
git add package.json
git commit -m "chore(release): 2.7.0"
```

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/dirty-dot-atom
gh pr create --title "feat: DirtyDot atom + dirty-surfaces docs (2.7.0)" --body "$(cat <<'EOF'
## Summary
- New `DirtyDot` atom (6px yellow tab-trigger dot).
- New `Forms/Dirty surfaces` Storybook page cataloguing the three dirty surfaces.
- Version bump 2.6.4 → 2.7.0 (additive, no breaking changes).

## Test Plan
- [ ] `npm test` green (incl. 2 new DirtyDot tests)
- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm run build && npm run verify-exports` clean
- [ ] Storybook shows `Atoms/DirtyDot` and `Forms/Dirty surfaces`
EOF
)"
```

- [ ] **Step 5: After merge, tag and publish**

(Run on `main` after the PR merges.)

```bash
git checkout main
git pull
git tag v2.7.0
git push origin v2.7.0
```

The existing publish workflow handles npm publication on tag push. Verify by:

```bash
npm view @knkcs/anker@2.7.0 version
```

Expected output: `2.7.0`.

---

## Acceptance criteria check

- [ ] `@knkcs/anker@2.7.0` published with `DirtyDot` exported from `@knkcs/anker/atoms`.
- [ ] `Forms/Dirty surfaces` mdx page visible in Storybook.
- [ ] Two vitest tests cover DirtyDot: renders when `active` true/omitted; renders nothing when `active` false.
- [ ] Existing `lint` / `typecheck` / `build` / `verify-exports` / `test` pipeline clean.
