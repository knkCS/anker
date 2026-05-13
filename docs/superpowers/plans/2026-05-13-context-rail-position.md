# Context Rail Position & Unified Collapse Toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move anker's context rail to start below the page header (header band spans main + rail), and replace the rail's collapse toggle with the sidebar's floating round button pattern, mirrored.

**Architecture:** Add a third named slot `"header"` to `AppShell`'s existing external-store slot system (alongside `"actions"` and `"rail"`), exposed via a new `usePageHeader(node)` hook. `AppShellInner` becomes a 2-row grid: row 1 holds the registered header spanning the main + rail columns; row 2 holds the body and the rail. Page templates (`IndexPageTemplate`, `DetailPageTemplate`, `SettingsPageTemplate`) move their `<PageHeader>` from inline JSX into a `usePageHeader(...)` call. The `ContextRail` component swaps its in-rail ghost icon-button for a sidebar-style floating outline `IconButton` anchored at `top=6, left=-3.5`.

**Tech Stack:** React 18 + TypeScript, Chakra UI v3, Vitest + Testing Library, Biome, tsup. Spec: `docs/superpowers/specs/2026-05-13-context-rail-position-design.md`.

**Working directory for all tasks:** `/Users/jeskoiwanovski/repo/anker`.

---

## Task 1: Extend AppShell's slot store with a `header` slot

**Files:**
- Modify: `src/templates/app-shell.tsx`
- Test: `src/templates/app-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

Add at the bottom of `src/templates/app-shell.test.tsx`, inside the `describe("AppShell", () => { … })` block:

```tsx
function HeaderRegistrar({ label = "registered header" }: { label?: string }) {
	usePageHeader(<div data-testid="header-content">{label}</div>);
	return <div data-testid="page-body">body</div>;
}

it("renders header content registered by a descendant via usePageHeader", () => {
	renderWithChakra(
		<AppShell sidebar={<div data-testid="sb" />}>
			<HeaderRegistrar />
		</AppShell>,
	);
	expect(screen.getByTestId("header-content")).toBeInTheDocument();
});

it("renders no header row when no descendant registers a header", () => {
	renderWithChakra(
		<AppShell sidebar={<div data-testid="sb" />}>
			<div data-testid="page-body">body</div>
		</AppShell>,
	);
	expect(screen.queryByTestId("app-shell-header")).not.toBeInTheDocument();
});
```

Also update the import line near the top:

```tsx
import { AppShell, usePageHeader, usePageRail } from "./app-shell";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/templates/app-shell.test.tsx`
Expected: FAIL — `usePageHeader is not exported` (or `not defined`).

- [ ] **Step 3: Add `"header"` to the SlotName union and store**

In `src/templates/app-shell.tsx`, change line 46:

```tsx
type SlotName = "actions" | "header" | "rail";
```

In `createSlotStore()` (around lines 56–64), extend both records to include `header`:

```tsx
const values: Record<SlotName, ReactNode> = {
	actions: null,
	header: null,
	rail: null,
};
const listeners: Record<SlotName, Set<() => void>> = {
	actions: new Set(),
	header: new Set(),
	rail: new Set(),
};
```

- [ ] **Step 4: Export `usePageHeader`**

Add this function in `src/templates/app-shell.tsx` immediately after `usePageRail` (around line 169):

```tsx
/**
 * Register page-header content (typically a <PageHeader>) from any descendant
 * of `<AppShell>`. The content is rendered by AppShell in grid row 1, spanning
 * the main column and the rail column (when present), so the header band
 * crosses both columns and the rail starts below it.
 *
 * Pass `null` (or omit) to clear the registration. The hook is a no-op when
 * called outside an AppShell.
 */
export function usePageHeader(content: ReactNode): void {
	const store = useContext(SlotStoreContext);
	const latest = useRef<ReactNode>(content);
	latest.current = content;
	useEffect(() => {
		if (!store) return;
		store.set("header", latest.current);
		return () => {
			store.clear("header");
		};
	}, [store]);
	useEffect(() => {
		if (!store) return;
		store.set("header", content);
	}, [store, content]);
}
```

- [ ] **Step 5: Render the header row in AppShellInner**

In `src/templates/app-shell.tsx`, replace the entire `AppShellInner` function (currently lines 232–294) with:

```tsx
function AppShellInner({ sidebar, rail, children }: AppShellProps) {
	const railNode = useSlotValue("rail");
	const headerNode = useSlotValue("header");

	const renderedRail = railNode ?? rail;
	const showRailColumn =
		renderedRail !== undefined &&
		renderedRail !== null &&
		renderedRail !== false;
	const showHeaderRow = headerNode !== null && headerNode !== undefined;

	return (
		<Grid
			data-testid="app-shell"
			data-rail={showRailColumn ? "true" : "false"}
			data-header={showHeaderRow ? "true" : "false"}
			templateColumns={showRailColumn ? "auto 1fr auto" : "auto 1fr"}
			templateRows="auto 1fr"
			minH="100vh"
			bg="bg-canvas"
		>
			<Box
				data-testid="app-shell-sidebar"
				gridColumn="1"
				gridRow="1 / 3"
				minW="0"
				position="sticky"
				top="0"
				alignSelf="start"
				maxH="100vh"
			>
				{sidebar}
			</Box>
			{showHeaderRow ? (
				<Box
					data-testid="app-shell-header"
					gridColumn={showRailColumn ? "2 / 4" : "2 / 3"}
					gridRow="1"
					minW="0"
				>
					{headerNode}
				</Box>
			) : null}
			<Flex
				data-testid="app-shell-main"
				gridColumn="2"
				gridRow="2"
				direction="column"
				minW="0"
				bg="bg-canvas"
				borderLeftWidth="1px"
				borderColor="border"
			>
				{children}
			</Flex>
			{showRailColumn ? (
				<Box
					data-testid="app-shell-rail"
					gridColumn="3"
					gridRow="2"
					minW="0"
					position="sticky"
					top="0"
					alignSelf="start"
					maxH="100vh"
					bg="bg-surface"
					borderLeftWidth="1px"
					borderColor="border"
				>
					{renderedRail}
				</Box>
			) : null}
		</Grid>
	);
}
AppShellInner.displayName = "AppShellInner";
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm vitest run src/templates/app-shell.test.tsx`
Expected: all AppShell tests pass (the two new ones and all eight existing ones).

Note: the existing test "sidebar column is sticky to the viewport top" still passes — the sidebar's sticky positioning is unchanged. The existing test "main column shares bg-canvas with the sidebar and has a left divider" must still pass; if it fails on `minH: 100vh` (which I removed from the main column since the grid row now controls height), revert that specific change and keep `minH="100vh"` on `app-shell-main` as before.

- [ ] **Step 7: Commit**

```bash
git add src/templates/app-shell.tsx src/templates/app-shell.test.tsx
git commit -m "feat(app-shell): add usePageHeader slot and 2-row grid"
```

---

## Task 2: Update the header-comment ASCII diagram in app-shell.tsx

**Files:**
- Modify: `src/templates/app-shell.tsx` (top-of-file comment, lines 1–32)

- [ ] **Step 1: Replace the diagram and slot documentation**

In `src/templates/app-shell.tsx`, replace lines 1–32 with:

```tsx
// src/templates/app-shell.tsx
//
// AppShell — top-level layout for authenticated knkCMS pages.
//
// Composition: a 3-column × 2-row CSS grid. The sidebar spans the full
// height on the left. The page header band (when registered) spans the
// main + rail columns across row 1. The main content sits in row 2
// column 2; the optional context rail sits in row 2 column 3, beginning
// below the header band.
//
//     ┌─────────┬───────────────────────────────────┐
//     │         │            page header            │
//     │         ├───────────────────────┬───────────┤
//     │ sidebar │         children      │   rail    │
//     │         │   (body / tabs / …)   │           │
//     │         │                       │           │
//     └─────────┴───────────────────────┴───────────┘
//
// Slot mechanism
// --------------
// AppShell installs an external slot store on its descendants via context.
// Three named slots are exposed:
//
//   - "actions" — registered via `usePageActions(node)` — surfaced by page
//     templates inside their <PageHeader actions=…> slot.
//   - "header"  — registered via `usePageHeader(node)`  — surfaced by
//     AppShell as the content of grid row 1 (spanning the main + rail
//     columns). Page templates push their <PageHeader> here.
//   - "rail"    — registered via `usePageRail(node)`    — surfaced by
//     AppShell as the content of the right rail column (row 2 column 3).
//
// The store uses `useSyncExternalStore` so that producers (deep child
// components rendered after the consumer) and consumers (AppShell, the page
// templates) stay decoupled. A naive `useState`-based context would force the
// consumer to render in the same React commit as the producer, which causes
// the actions/rail to flicker on route changes (the Path-B fix originally
// shipped in odon as PR #115). The external-store pattern lets the producer
// register its content in a `useEffect`, the consumer re-reads on the next
// browser frame, and React's concurrent renderer is happy.
```

- [ ] **Step 2: Commit**

```bash
git add src/templates/app-shell.tsx
git commit -m "docs(app-shell): update top-of-file diagram for header slot"
```

---

## Task 3: Replace ContextRail's collapse toggle with the floating sidebar-style button

**Files:**
- Modify: `src/components/context-rail/context-rail.tsx`
- Test: `src/components/context-rail/context-rail.test.tsx`

- [ ] **Step 1: Write the failing test**

Open `src/components/context-rail/context-rail.test.tsx`. Find the existing toggle-related test (it asserts `data-testid="context-rail-toggle"` exists). Add this new test next to it (inside the same `describe`):

```tsx
it("toggle is positioned as a floating round button on the leading edge", () => {
	renderWithChakra(
		<ContextRail>
			<ContextRail.Header title="X" />
		</ContextRail>,
	);
	const toggle = screen.getByTestId("context-rail-toggle");
	// The toggle floats half-on the leading (left) border of the rail —
	// mirroring the sidebar's trailing-edge toggle pattern.
	const cs = window.getComputedStyle(toggle);
	expect(cs.position).toBe("absolute");
	// Chakra v3 emits spacing tokens as CSS custom properties; we just
	// assert the `left` and `top` properties were set to *something*
	// non-empty, and that the value references the expected spacing
	// tokens. (Exact computed string differs between Chakra versions.)
	expect(cs.top).not.toBe("");
	expect(cs.left).not.toBe("");
	expect(cs.left).toMatch(/3-?5|3\.5/);
});
```

If the file does not already import a `renderWithChakra` helper, copy the helper from `src/templates/app-shell.test.tsx` (lines 2–11) into the test file.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/context-rail/context-rail.test.tsx`
Expected: FAIL — current toggle has `position` static (not absolute) and no `left` offset.

- [ ] **Step 3: Rewrite the toggle and the outer Box**

In `src/components/context-rail/context-rail.tsx`, replace the entire return body of `ContextRailRoot` (lines 75–117) with:

```tsx
return (
	<RailRootContext.Provider value={true}>
		<Box
			data-testid="context-rail"
			data-collapsed={collapsed ? "true" : "false"}
			w={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
			minH="100vh"
			transition="width 250ms ease-out"
			position="relative"
		>
			<IconButton
				data-testid="context-rail-toggle"
				aria-label={
					collapsed ? "Expand context rail" : "Collapse context rail"
				}
				onClick={() => setCollapsed((c) => !c)}
				variant="outline"
				size="xs"
				position="absolute"
				top="6"
				left="-3.5"
				width="7"
				height="7"
				minW="7"
				borderRadius="full"
				bg="bg-surface"
				borderColor="border"
				boxShadow="sm"
				zIndex={1}
				_hover={{ bg: "bg-muted" }}
			>
				{collapsed ? (
					<PanelRightOpen size={14} />
				) : (
					<PanelRightClose size={14} />
				)}
			</IconButton>
			{collapsed ? null : (
				<Box h="full" overflowY="auto" px="4" pt="4" pb="4">
					{children}
				</Box>
			)}
		</Box>
	</RailRootContext.Provider>
);
```

Also remove the now-unused `Flex` import (`Flex` is no longer referenced in this file): change line 6 from

```tsx
import { Box, Flex } from "../../primitives/layout";
```

to

```tsx
import { Box } from "../../primitives/layout";
```

And remove the now-unused `ChevronRight` import — change line 2 from

```tsx
import { ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
```

to

```tsx
import { PanelRightClose, PanelRightOpen } from "lucide-react";
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/components/context-rail/context-rail.test.tsx`
Expected: the new test passes. All previously-passing tests still pass (toggle is still present with the same `data-testid` and `aria-label` values).

If a previously-passing test asserts that the toggle is in a specific DOM position (e.g., "second child of the rail container") rather than its visual position, update that test to use the new structure.

- [ ] **Step 5: Verify outer overflow allows the toggle to escape**

The outer `Box` no longer sets `overflow="hidden"`; it relies on the default `visible`. The inner scroll `Box` keeps its own `overflowY="auto"` so content still clips. Run the full ContextRail test file again to be sure:

Run: `pnpm vitest run src/components/context-rail/`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx
git commit -m "feat(context-rail): unify collapse toggle with sidebar pattern"
```

---

## Task 4: Migrate IndexPageTemplate to register its header via the slot

**Files:**
- Modify: `src/templates/index-page-template.tsx`
- Test: existing `src/templates/index-page-template.stories.tsx` is used for visual verification; if a `.test.tsx` exists, update it accordingly.

- [ ] **Step 1: Check for an existing test file**

Run: `ls src/templates/index-page-template.test.tsx 2>/dev/null && echo EXISTS || echo MISSING`

If `EXISTS`, open the file and find any test that asserts a `<PageHeader>` is rendered as a direct child of the template's root. Note its name — you'll update it in Step 4.

- [ ] **Step 2: Update the imports**

In `src/templates/index-page-template.tsx`, find the imports for the template (around lines 22–25) and add `usePageHeader` to the import from `./app-shell`. Current state has only `useRegisteredPageActions` imported from `./app-shell`. Result:

```tsx
import { useRegisteredPageActions, usePageHeader } from "./app-shell";
```

(If `useRegisteredPageActions` is imported on a different line or via a different name, just add `usePageHeader` to whichever import statement pulls from `./app-shell`.)

- [ ] **Step 3: Replace the inline PageHeader render with `usePageHeader`**

In `IndexPageTemplate` (lines 66–100), change the function body so:

1. Before the `return`, call `usePageHeader(...)` with a `<PageHeader>` element built from the props.
2. Remove the `<PageHeader … />` JSX from the returned tree.

The new body looks like:

```tsx
export function IndexPageTemplate({
	breadcrumbs,
	title,
	subtitle,
	eyebrow,
	actions,
	tabs,
	toolbar,
	children,
}: IndexPageTemplateProps) {
	const registered = useRegisteredPageActions();
	const resolvedActions = actions ?? registered;
	usePageHeader(
		<PageHeader
			breadcrumbs={breadcrumbs}
			title={title}
			subtitle={subtitle}
			eyebrow={eyebrow}
			actions={resolvedActions}
		/>,
	);
	return (
		<Flex
			data-testid="index-page-template"
			direction="column"
			flex="1"
			minH="0"
		>
			{tabs ? <Box>{tabs}</Box> : null}
			{toolbar ? <Box>{toolbar}</Box> : null}
			<Box flex="1" minH="0">
				{children}
			</Box>
		</Flex>
	);
}
```

- [ ] **Step 4: Update the test (if one exists)**

If `src/templates/index-page-template.test.tsx` exists and asserts the header is a child of `index-page-template`, change the assertion to: wrap the test render in an `<AppShell>` and assert the header appears under `app-shell-header` instead.

Example update:

```tsx
import { AppShell } from "./app-shell";

it("registers the page header via the AppShell slot", () => {
	render(
		<ChakraProvider value={defaultSystem}>
			<AppShell sidebar={<div />}>
				<IndexPageTemplate title="Users">body</IndexPageTemplate>
			</AppShell>
		</ChakraProvider>,
	);
	const headerCell = screen.getByTestId("app-shell-header");
	expect(within(headerCell).getByText("Users")).toBeInTheDocument();
});
```

(Use `within` from `@testing-library/react`.)

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run src/templates/index-page-template`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/templates/index-page-template.tsx \
	$(ls src/templates/index-page-template.test.tsx 2>/dev/null)
git commit -m "feat(index-page-template): register header via usePageHeader"
```

---

## Task 5: Migrate DetailPageTemplate to register its header via the slot

**Files:**
- Modify: `src/templates/detail-page-template.tsx`
- Test: `src/templates/detail-page-template.test.tsx` (exists per directory listing)

- [ ] **Step 1: Update imports**

In `src/templates/detail-page-template.tsx`, add `usePageHeader` to the import from `./app-shell` (same approach as Task 4 Step 2).

- [ ] **Step 2: Remove both inline `<PageHeader>` renders and replace with one `usePageHeader` call**

The function has two return paths — one for `bodyTabs`, one for the default. Both currently render an identical `<PageHeader>`. Hoist a single `usePageHeader` call to the top of the function so it runs once per render regardless of branch:

Right after the `if (tabs && bodyTabs) throw …;` guard (line 100–103) and after `const resolvedActions = actions ?? registered;` (line 105), add:

```tsx
usePageHeader(
	<PageHeader
		breadcrumbs={breadcrumbs}
		title={title}
		subtitle={subtitle}
		eyebrow={eyebrow}
		actions={resolvedActions}
	/>,
);
```

Then remove the `<PageHeader … />` JSX from both return blocks (the first at lines 123–129, the second at lines 160–166). The two `<Flex data-testid="detail-page-template" …>` opening tags remain as-is; only the `<PageHeader>` lines are deleted.

- [ ] **Step 3: Update the test file**

Open `src/templates/detail-page-template.test.tsx`. Find every test that renders `<DetailPageTemplate>` without an `<AppShell>` wrapper and asserts the header (title / breadcrumbs / actions) appears in the output. Each of those tests must be updated:

- Wrap the render in `<AppShell sidebar={<div />}> … </AppShell>`.
- Change header assertions to query inside `screen.getByTestId("app-shell-header")` using `within`.

For tests that assert body behavior (tabs, subheader, children) — no change needed; those still work because the template still renders that part of its tree directly.

If a test asserts the `throw` from the `tabs && bodyTabs` guard, leave it alone — that runs before the `usePageHeader` call.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/templates/detail-page-template`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/templates/detail-page-template.tsx src/templates/detail-page-template.test.tsx
git commit -m "feat(detail-page-template): register header via usePageHeader"
```

---

## Task 6: Migrate SettingsPageTemplate to register its header via the slot

**Files:**
- Modify: `src/templates/settings-page-template.tsx`
- Test: `src/templates/settings-page-template.test.tsx` (exists per directory listing)

- [ ] **Step 1: Apply the same migration pattern as Task 4**

In `src/templates/settings-page-template.tsx`:

1. Add `usePageHeader` to the `./app-shell` import.
2. Locate the `<PageHeader … />` JSX inside the template's main return tree (currently at lines 114 and 150 per the earlier grep).
3. If there are two render branches each containing a `<PageHeader>` (similar to DetailPageTemplate), hoist a single `usePageHeader(<PageHeader …/>)` call to the top of the function. If there's only one branch, replace the inline render with a `usePageHeader` call directly above the `return`.

Construct the `<PageHeader>` from the same props that are currently passed to the inline `<PageHeader>`. Do not change any of those prop expressions — only move them from JSX to the slot call.

- [ ] **Step 2: Update the test file**

Open `src/templates/settings-page-template.test.tsx`. Same approach as Task 5 Step 3: wrap header-asserting tests in `<AppShell>`, query header content under `app-shell-header`.

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run src/templates/settings-page-template`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/templates/settings-page-template.tsx src/templates/settings-page-template.test.tsx
git commit -m "feat(settings-page-template): register header via usePageHeader"
```

---

## Task 7: Re-export `usePageHeader` from the templates barrel

**Files:**
- Modify: `src/templates/index.ts`

- [ ] **Step 1: Add the export**

Open `src/templates/index.ts`. Find the export line that re-exports `usePageActions`, `usePageRail`, etc. from `./app-shell`. It looks like:

```ts
export { AppShell, usePageActions, usePageRail } from "./app-shell";
```

Update it to:

```ts
export { AppShell, usePageActions, usePageHeader, usePageRail } from "./app-shell";
```

(The actual export list in the barrel may include additional names like `useRegisteredPageActions` — leave those alone; just add `usePageHeader` in alphabetical position.)

- [ ] **Step 2: Verify with typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/templates/index.ts
git commit -m "feat(templates): re-export usePageHeader from barrel"
```

---

## Task 8: Add a Storybook story for the new layout

**Files:**
- Modify: `src/templates/app-shell.stories.tsx`

- [ ] **Step 1: Add the new story**

Open `src/templates/app-shell.stories.tsx`. Read the file to learn its conventions — the existing stories will show how `meta` and the default export are structured.

Add a new exported story `WithHeaderAndRail` that:

1. Renders an `<AppShell>` with a real `<Sidebar>` and a `rail` that contains a real `<ContextRail>` with a header and one section.
2. Inside `children`, places a small component that calls `usePageHeader(<PageHeader breadcrumbs={…} title="Users" actions={<Button>Invite</Button>} />)` and renders some body content (e.g., a placeholder DataTable or a list of fake rows).

The story should visually demonstrate: header band spans main + rail; rail begins below the header; rail collapse toggle floats on the leading edge.

Use the import paths and Story typing already used by the other stories in the file.

- [ ] **Step 2: Verify the story renders**

Run: `pnpm storybook` in a separate terminal, navigate to the AppShell story, confirm the new story renders without console errors. Click the rail's collapse toggle to confirm it works and visually mirrors the sidebar toggle. Then stop Storybook.

This step is a manual verification; no automated assertion.

- [ ] **Step 3: Commit**

```bash
git add src/templates/app-shell.stories.tsx
git commit -m "docs(stories): add WithHeaderAndRail story"
```

---

## Task 9: Update `docs/page-patterns.md`

**Files:**
- Modify: `docs/page-patterns.md`

- [ ] **Step 1: Update the App-shell composition diagram**

Locate the ASCII diagram in §App shell composition (around lines 48–55). Replace it with:

```
┌────────────┬────────────────────────────────────────────────────┐
│            │                  Page header                       │
│            │     (breadcrumbs · title · page actions)           │
│  Sidebar   ├────────────────────────────────────┬───────────────┤
│   240px    │         Main content               │ ContextRail   │
│ ↔ 60px     │            (fluid)                 │    320px      │
│ collapsed  │                                    │  ↔ 44px       │
│            │                                    │  collapsed    │
└────────────┴────────────────────────────────────┴───────────────┘
```

(Match the exact spacing/style of the surrounding markdown — the column-width annotations below should still read the same.)

- [ ] **Step 2: Document the header slot**

In the slot-mechanism subsection of §App shell composition (you'll see entries describing `actions` and `rail`), insert an entry for `header` between them so the order is `actions`, `header`, `rail`:

```markdown
- **`header`**  — registered via `usePageHeader(content)`. Surfaced as the
  body of grid row 1, spanning the main column and the rail column. Page
  templates push their `<PageHeader>` here so the header band crosses both
  columns and the rail's content begins below it.
```

- [ ] **Step 3: Add a short paragraph explaining the rail's vertical origin**

Immediately after the slot-mechanism block (and before the `// Layout` code example around line 95–120), add:

```markdown
The rail column's coordinate origin sits in grid row 2, below the header
band. Its `position: sticky; top: 0` therefore pins to the bottom of the
header, not to the viewport top. The sidebar still spans both rows and
remains sticky to the viewport top.
```

- [ ] **Step 4: Update the ContextRail "Collapsed state" / "Rail Root contract" sections**

In §4. ContextRail patterns, find "Collapsed state" (around line 366) and the "Rail Root contract" block immediately after. Edit them to reflect the new toggle:

In "Collapsed state", after the existing first sentence, add:

```markdown
The collapse toggle is a small round outline button (28×28, `bg-surface`,
`border`, `shadow-sm`) anchored at `top: 6, left: -3.5` — it floats half-on
the rail's leading edge, mirroring the sidebar's trailing-edge toggle. It
is visually identical in expanded and collapsed states; only the icon
swaps (`PanelRightClose` ↔ `PanelRightOpen`).
```

In "Rail Root contract", the bullet about "the Root provides the column width … the collapse toggle button …" — update the collapse-toggle phrase to read "the floating collapse toggle (mirrors `<Sidebar>` on the leading edge)".

- [ ] **Step 5: Commit**

```bash
git add docs/page-patterns.md
git commit -m "docs(page-patterns): rail position & unified collapse toggle"
```

---

## Task 10: Update `CLAUDE-ANKER.md`

**Files:**
- Modify: `CLAUDE-ANKER.md`

- [ ] **Step 1: Update the AppShell row**

In `CLAUDE-ANKER.md`, find line 80 (the `<AppShell>` table row):

```markdown
| `<AppShell>` | Authenticated chrome (sidebar · main · rail). Provides `usePageActions(node)` and `usePageRail(node)` hooks. |
```

Replace with:

```markdown
| `<AppShell>` | Authenticated chrome (sidebar · main · rail). Provides `usePageActions(node)`, `usePageHeader(node)`, and `usePageRail(node)` hooks. Page templates register their `<PageHeader>` via `usePageHeader`, which renders it as a band spanning main + rail. |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE-ANKER.md
git commit -m "docs(claude-anker): mention usePageHeader on AppShell row"
```

---

## Task 11: Full verification before release

**Files:** none modified — verification only.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass, no skipped tests added.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 4: Build the package**

Run: `pnpm build`
Expected: build succeeds. Inspect `dist/` — `usePageHeader` should appear in the published type declarations next to `usePageRail`.

- [ ] **Step 5: Manual visual check via Storybook**

Run: `pnpm storybook`
Navigate to the new `AppShell` → `WithHeaderAndRail` story (from Task 8). Confirm:
- Header band crosses main + rail (visible horizontal line below the header, spanning both columns).
- Rail's content starts below the header band.
- Rail's collapse toggle is a round outline button floating on the leading edge, vertically aligned with the sidebar's toggle.
- Collapsing the rail keeps the toggle in the same position; only the icon swaps.

Stop Storybook.

- [ ] **Step 6: No commit (verification only)**

If any step failed, fix the issue inline in the relevant prior task's files and commit the fix with an appropriate `fix(...)` message before continuing.

---

## Post-release: bump anker in odon

(Not part of this plan. After merging and releasing the new anker version, bump `@knkcs/anker` in odon and verify the Users / User-detail pages match the reference designs.)
