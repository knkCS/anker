# AppShell Internal-Scroll Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch `@knkcs/anker`'s `AppShell` from document scroll to an internal-scroll shell so the sidebar account footer and the context rail stay pinned while page content scrolls.

**Architecture:** The grid becomes a fixed `100vh` viewport that never scrolls the document (`overflow:hidden`); the header band stays fixed in row 1; the sidebar, main, and rail each scroll internally. The fix replaces three uses of `min-height:100vh` (an unbounded floor) with bounded heights so each region's internal `overflow:auto` engages. No consumer code changes — the page templates already conform.

**Tech Stack:** React + TypeScript, Chakra UI v3 (anker primitives), Vitest + Testing Library, Biome, Storybook, tsup.

## Global Constraints

- Repo: `/Users/jeskoiwanovski/repo/anker`. Branch: `feat/appshell-internal-scroll` (already created; the spec is already committed there).
- Spec: `docs/superpowers/specs/2026-06-27-appshell-internal-scroll-design.md`.
- Commands (run from repo root): tests `npm test` · single file `npx vitest run <path>` · typecheck `npm run typecheck` · lint `npm run lint`.
- Chakra height tokens: `h="full"` ⇒ `height:100%`; `h="100vh"` ⇒ `height:100vh`; `minH="0"` ⇒ `min-height:0`.
- Tests assert layout via `toHaveStyle({ ... })` with camelCase keys (e.g. `overflowY: "auto"`); this already works for layout props in this suite.
- No public API or prop-name changes. The only new DOM is two `data-testid`s on the sidebar body/footer (for test selectors).
- Version after the change: bump `2.10.0` → `2.10.1` (behavioral bug fix, no API change).
- No mediahub source changes — mediahub only bumps the `@knkcs/anker` version (Task 5, post-release).

---

### Task 1: AppShell — fixed-viewport grid with internal-scrolling columns

**Files:**
- Modify: `src/templates/app-shell.tsx` (the `<Grid>`, sidebar `<Box>`, main `<Flex>`, rail `<Box>` inside `AppShellInner`, ~lines 293–361)
- Test: `src/templates/app-shell.test.tsx` (replace the two "is sticky" tests at ~lines 109–132)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a shell whose `[data-testid="app-shell"]` grid is `height:100vh; overflow:hidden`, whose `[data-testid="app-shell-main"]` and `[data-testid="app-shell-rail"]` are `overflowY:auto; minH:0`, and whose `[data-testid="app-shell-sidebar"]` stretches to the full grid height (no longer `position:sticky`). The sidebar box keeps `zIndex={11}`.

- [ ] **Step 1: Replace the two stale "is sticky" tests with new-model tests**

In `src/templates/app-shell.test.tsx`, delete these two existing tests verbatim:

```tsx
	it("sidebar column is sticky to the viewport top", () => {
		// Regression: previously the sidebar scrolled away with the grid when
		// the main column overflowed the viewport. The sidebar must stay put.
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb">sidebar</div>}>
				<div>main</div>
			</AppShell>,
		);
		const sidebarCol = screen.getByTestId("app-shell-sidebar");
		expect(sidebarCol).toHaveStyle({ position: "sticky", top: "0" });
	});

	it("rail column is sticky to the viewport top", () => {
		renderWithChakra(
			<AppShell
				sidebar={<div data-testid="sb" />}
				rail={<div data-testid="rail">rail</div>}
			>
				<div>main</div>
			</AppShell>,
		);
		const railCol = screen.getByTestId("app-shell-rail");
		expect(railCol).toHaveStyle({ position: "sticky", top: "0" });
	});
```

Insert in their place:

```tsx
	it("the shell grid is a fixed 100vh viewport that does not scroll the document", () => {
		// Internal-scroll model: the grid is exactly the viewport height and
		// clips its own overflow, so the document never scrolls — the columns
		// scroll internally instead.
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb">sidebar</div>}>
				<div>main</div>
			</AppShell>,
		);
		const grid = screen.getByTestId("app-shell");
		expect(grid).toHaveStyle({ height: "100vh", overflow: "hidden" });
		expect(grid).not.toHaveStyle({ minHeight: "100vh" });
	});

	it("the main column scrolls internally", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<div>main</div>
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell-main")).toHaveStyle({
			overflowY: "auto",
		});
	});

	it("the rail column scrolls internally and is no longer sticky", () => {
		renderWithChakra(
			<AppShell
				sidebar={<div data-testid="sb" />}
				rail={<div data-testid="rail">rail</div>}
			>
				<div>main</div>
			</AppShell>,
		);
		const railCol = screen.getByTestId("app-shell-rail");
		expect(railCol).toHaveStyle({ overflowY: "auto" });
		expect(railCol).not.toHaveStyle({ position: "sticky" });
	});

	it("the sidebar column fills the grid height and is no longer sticky", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<div>main</div>
			</AppShell>,
		);
		const sidebarCol = screen.getByTestId("app-shell-sidebar");
		expect(sidebarCol).not.toHaveStyle({ position: "sticky" });
		expect(sidebarCol).toHaveStyle({ zIndex: "11" });
	});
```

- [ ] **Step 2: Run the tests and confirm the new ones fail**

Run: `npx vitest run src/templates/app-shell.test.tsx`
Expected: the four new tests FAIL (grid still `minHeight:100vh` not `height:100vh`; main/rail not `overflowY:auto`; sidebar still `position:sticky`). Pre-existing tests still pass.

- [ ] **Step 3: Update the grid in `src/templates/app-shell.tsx`**

Find the `<Grid data-testid="app-shell" …>` opening props (~line 294) and change `minH="100vh"` to `h="100vh"` plus `overflow="hidden"`:

```tsx
		<Grid
			data-testid="app-shell"
			data-rail={showRailColumn ? "true" : "false"}
			data-header={showHeaderRow ? "true" : "false"}
			templateColumns={showRailColumn ? "auto 1fr auto" : "auto 1fr"}
			templateRows="auto 1fr"
			h="100vh"
			overflow="hidden"
			bg="bg-canvas"
		>
```

- [ ] **Step 4: Update the sidebar `<Box>` (remove sticky, let it stretch)**

Find `<Box data-testid="app-shell-sidebar" …>` (~line 303). Remove `position="sticky"`, `top="0"`, `alignSelf="start"`, and `maxH="100vh"`. Keep the comment on `zIndex`. Result:

```tsx
			<Box
				data-testid="app-shell-sidebar"
				gridColumn="1"
				gridRow="1 / 3"
				minW="0"
				// One above Chakra's `docked` (10) so the Sidebar's collapse
				// toggle — positioned with `right: -3.5` to protrude into the
				// next column — renders above the sticky page-header band.
				zIndex={11}
			>
				{sidebar}
			</Box>
```

- [ ] **Step 5: Update the main `<Flex>` (scroll internally)**

Find `<Flex data-testid="app-shell-main" …>` (~line 333). Add `minH="0"` and `overflowY="auto"`:

```tsx
			<Flex
				data-testid="app-shell-main"
				gridColumn="2"
				gridRow="2"
				direction="column"
				minW="0"
				minH="0"
				overflowY="auto"
				bg="bg-canvas"
				borderLeftWidth="1px"
				borderColor="border"
			>
				{children}
			</Flex>
```

- [ ] **Step 6: Update the rail `<Box>` (scroll internally, remove sticky)**

Find `<Box data-testid="app-shell-rail" …>` (~line 346). Remove `position="sticky"`, `top="0"`, `alignSelf="start"`, `maxH="100vh"`; add `minH="0"` and `overflowY="auto"`:

```tsx
				<Box
					data-testid="app-shell-rail"
					gridColumn="3"
					gridRow="2"
					minW="0"
					minH="0"
					overflowY="auto"
					bg="bg-surface"
					borderLeftWidth="1px"
					borderColor="border"
				>
					{renderedRail}
				</Box>
```

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npx vitest run src/templates/app-shell.test.tsx`
Expected: PASS (all tests, including the four new ones).

- [ ] **Step 8: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/templates/app-shell.tsx src/templates/app-shell.test.tsx
git commit -m "fix(app-shell): internal-scroll grid so side columns stay pinned"
```

---

### Task 2: Sidebar — fill the column height and pin the footer

**Files:**
- Modify: `src/components/sidebar/sidebar.tsx` (`SidebarRoot` outer `<Box>` ~line 86, inner `<Flex>` ~line 92, `SidebarBody` ~line 145, `SidebarFooter` ~line 152)
- Test: `src/components/sidebar/sidebar.test.tsx` (add a new `describe` block)

**Interfaces:**
- Consumes: the Task 1 shell — the sidebar grid cell is now a definite `100vh` (the grid stretches `[data-testid="app-shell-sidebar"]` to full height).
- Produces: `[data-testid="sidebar"]` is `height:100%` (not `minHeight:100vh`); `[data-testid="sidebar-body"]` is `flex:1; minH:0; overflowY:auto`; `[data-testid="sidebar-footer"]` is `flexShrink:0`.

- [ ] **Step 1: Write the failing tests**

In `src/components/sidebar/sidebar.test.tsx`, append this `describe` block at the end of the file. The file already imports `Sidebar`, `screen`, `describe`, `it`, `expect`, and defines the `renderWithChakra(ui)` helper used below:

```tsx
describe("Sidebar — internal-scroll layout", () => {
	function renderFull() {
		return renderWithChakra(
			<Sidebar>
				<Sidebar.Header>
					<Sidebar.Logo productName="test" />
				</Sidebar.Header>
				<Sidebar.Body>
					<Sidebar.Section label="Library">
						<Sidebar.Item>All</Sidebar.Item>
					</Sidebar.Section>
				</Sidebar.Body>
				<Sidebar.Footer>
					<div data-testid="footer-content">account</div>
				</Sidebar.Footer>
			</Sidebar>,
		);
	}

	it("the sidebar fills its column height instead of forcing min-height 100vh", () => {
		renderFull();
		const inner = screen.getByTestId("sidebar");
		expect(inner).toHaveStyle({ height: "100%" });
		expect(inner).not.toHaveStyle({ minHeight: "100vh" });
	});

	it("the body scrolls internally", () => {
		renderFull();
		expect(screen.getByTestId("sidebar-body")).toHaveStyle({
			overflowY: "auto",
		});
	});

	it("the footer never shrinks, so it stays pinned to the bottom", () => {
		renderFull();
		expect(screen.getByTestId("sidebar-footer")).toHaveStyle({
			flexShrink: "0",
		});
	});
});
```

> Note: `renderWithChakra` uses jsdom's default `innerWidth` (sidebar renders collapsed), but the asserted styles (`height`, `overflowY`, `flexShrink`) are collapse-independent, so this is fine.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/components/sidebar/sidebar.test.tsx`
Expected: the three new tests FAIL — `sidebar` is `minHeight:100vh` not `height:100%`; `sidebar-body` / `sidebar-footer` test IDs don't exist yet.

- [ ] **Step 3: Update `SidebarRoot` outer `<Box>` and inner `<Flex>`**

In `src/components/sidebar/sidebar.tsx`, the `SidebarRoot` return (~line 83). Add `h="full"` to the outer `<Box>` and change the inner `<Flex>` from `minH="100vh"` to `h="full"`:

```tsx
				<Box
					position="relative"
					w={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
					transition="width 250ms ease-out"
					flexShrink={0}
					h="full"
				>
					<Flex
						data-testid="sidebar"
						data-collapsed={collapsed ? "true" : "false"}
						direction="column"
						w="full"
						h="full"
						bg="bg-canvas"
						borderRightWidth="1px"
						borderRightColor="border"
						overflow="hidden"
					>
						{children}
					</Flex>
```

(Leave the `<IconButton …>` collapse toggle and the rest of the `SidebarRoot` body unchanged.)

- [ ] **Step 4: Update `SidebarBody` (add testid + `minH:0`)**

Replace `SidebarBody` (~line 145):

```tsx
const SidebarBody = ({ children }: { children?: React.ReactNode }) => (
	<Box data-testid="sidebar-body" flex="1" minH="0" overflowY="auto" py="3">
		{children}
	</Box>
);
SidebarBody.displayName = "Sidebar.Body";
```

- [ ] **Step 5: Update `SidebarFooter` (add testid + `flexShrink:0`)**

Replace `SidebarFooter` (~line 152):

```tsx
const SidebarFooter = ({ children }: { children: React.ReactNode }) => (
	<Box
		data-testid="sidebar-footer"
		flexShrink={0}
		p="3"
		borderTopWidth="1px"
		borderTopColor="border"
	>
		{children}
	</Box>
);
SidebarFooter.displayName = "Sidebar.Footer";
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx vitest run src/components/sidebar/sidebar.test.tsx`
Expected: PASS (all tests, including the three new ones).

- [ ] **Step 7: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/sidebar/sidebar.tsx src/components/sidebar/sidebar.test.tsx
git commit -m "fix(sidebar): fill column height and pin footer (flex-shrink 0)"
```

---

### Task 3: ContextRail — bound the root height so its body scrolls

**Files:**
- Modify: `src/components/context-rail/context-rail.tsx` (`ContextRailRoot` `<Box>` ~lines 98–105)
- Test: `src/components/context-rail/context-rail.test.tsx` (add a test)

**Interfaces:**
- Consumes: the Task 1 shell — the rail column (`[data-testid="app-shell-rail"]`) is now a bounded, internally-scrolling cell.
- Produces: `[data-testid="context-rail"]` is `height:100%` (not `minHeight:100vh`), so its existing inner `<Stack h="full" overflowY="auto">` engages.

- [ ] **Step 1: Write the failing test**

In `src/components/context-rail/context-rail.test.tsx`, add this test inside the existing top-level `describe("ContextRail", …)` block. The file already imports `ContextRail`, `screen`, `describe`, `it`, `expect`, and defines the `renderWithChakra(ui)` helper used below:

```tsx
	it("the rail root fills its column height instead of forcing min-height 100vh", () => {
		renderWithChakra(
			<ContextRail>
				<ContextRail.Section id="s" label="Section">
					<div>content</div>
				</ContextRail.Section>
			</ContextRail>,
		);
		const root = screen.getByTestId("context-rail");
		expect(root).toHaveStyle({ height: "100%" });
		expect(root).not.toHaveStyle({ minHeight: "100vh" });
	});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run src/components/context-rail/context-rail.test.tsx`
Expected: the new test FAILS — root is `minHeight:100vh`, not `height:100%`.

- [ ] **Step 3: Update `ContextRailRoot` `<Box>`**

In `src/components/context-rail/context-rail.tsx`, change the root `<Box>` (~line 98) from `minH="100vh"` to `h="full"`:

```tsx
				<Box
					data-testid="context-rail"
					data-collapsed={collapsed ? "true" : "false"}
					w={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
					h="full"
					transition="width 250ms ease-out"
					position="relative"
				>
```

(Leave the inner `<Stack h="full" overflowY="auto" …>` and collapsed `<Flex h="full" overflowY="auto" …>` unchanged — they now have a bounded parent.)

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run src/components/context-rail/context-rail.test.tsx`
Expected: PASS (all tests, including the new one).

- [ ] **Step 5: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx
git commit -m "fix(context-rail): bound root height so the rail body scrolls"
```

---

### Task 4: Visual verification, docs, and version bump

**Files:**
- Verify (no edit unless broken): `src/templates/app-shell.stories.tsx`
- Modify: `docs/page-patterns.md` (scroll-model paragraph, ~lines 96–100)
- Modify: `CHANGELOG.md` (new version section at top)
- Modify: `package.json` (`"version"`)

**Interfaces:**
- Consumes: the implemented behavior from Tasks 1–3.
- Produces: published-ready docs + a `2.10.1` version.

- [ ] **Step 1: Visually verify in Storybook**

Run: `npm run dev` (Storybook on http://localhost:6006). Open the **AppShell** story and a story that renders a long sidebar/rail or long main content. Confirm in the browser:
- The sidebar account footer stays pinned to the bottom while the main content scrolls.
- The rail scrolls internally (no document scroll); its content is not cut off.
- The page header band stays fixed at the top.
- No spurious horizontal scrollbar on the main column. If one appears, add `overflowX="hidden"` to the main `<Flex>` in `src/templates/app-shell.tsx` (next to `overflowY="auto"`), re-run `npx vitest run src/templates/app-shell.test.tsx`, and amend Task 1's commit or add a follow-up commit.
- The sidebar/rail collapse toggles are still visible and clickable (not clipped by the grid's `overflow:hidden`).

If `app-shell.stories.tsx` hardcodes a document-scroll workaround (e.g. a wrapper with an explicit tall height or its own `overflow`), remove that workaround so the story exercises the real shell. Otherwise leave it unchanged. Stop Storybook when done.

- [ ] **Step 2: Update the scroll-model paragraph in `docs/page-patterns.md`**

Replace the paragraph at ~lines 96–100 (currently beginning "The rail column's coordinate origin sits in grid row 2, below the header band. Its `position: sticky; top: 0` therefore pins to the bottom of the header…") with:

```markdown
`<AppShell>` is an **internal-scroll** shell: the grid is exactly `100vh` and
never scrolls the document (`overflow: hidden`). The header band is fixed in
grid row 1; the sidebar, main column, and rail each scroll **internally**. The
sidebar's account footer and the rail therefore stay pinned to the viewport
while their content scrolls. When the page header includes a tabs row, the rail
and main content begin **below the entire header band**.
```

Then scan the surrounding sections (search the file for `sticky`, `scroll`, `100vh`, `viewport top`) and reword any remaining text that still describes document-scroll or "sticky to the viewport top" so it matches the internal-scroll model.

- [ ] **Step 3: Add a CHANGELOG entry**

In `CHANGELOG.md`, insert a new section directly above the `## 2.10.0 — 2026-06-04` heading:

```markdown
## 2.10.1 — 2026-06-27

### Fixed
- `AppShell`, `Sidebar`, `ContextRail`: the sidebar account footer and the
  context rail no longer scroll out of view when the main column or rail is
  taller than the viewport. `AppShell` now uses an internal-scroll model — the
  grid is a fixed `100vh` that does not scroll the document; the header band is
  fixed, and the sidebar, main, and rail scroll internally. Root cause: the
  three components used `min-height: 100vh` (an unbounded floor) where a bounded
  height is required for internal `overflow: auto` to engage.

```

- [ ] **Step 4: Bump the package version**

In `package.json`, change `"version": "2.10.0"` to `"version": "2.10.1"`.

- [ ] **Step 5: Run the full test suite, typecheck, and lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add docs/page-patterns.md CHANGELOG.md package.json src/templates/app-shell.stories.tsx
git commit -m "docs(app-shell): document internal-scroll model; release 2.10.1"
```

(If `app-shell.stories.tsx` was not modified in Step 1, omit it from the `git add`.)

---

### Task 5: Rollout to mediahub (operational — requires the anker release first)

> This task is operational and runs **after** anker `2.10.1` is published to the registry the mediahub Docker build pulls from. It is not part of the anker code change. Do it once the anker branch is merged and released.

**Files:**
- Modify (mediahub repo): `/Users/jeskoiwanovski/repo/mediahub/web/package.json`, `/Users/jeskoiwanovski/repo/mediahub/packages/mediahub-ui/package.json`

- [ ] **Step 1: Publish anker `2.10.1`**

Merge `feat/appshell-internal-scroll` to anker `main` and publish via the repo's normal release process (`npm run build` then publish; `prepublishOnly` runs `build` + `verify-exports`). Confirm `2.10.1` is available in the registry.

- [ ] **Step 2: Bump the anker dependency in mediahub**

In both `/Users/jeskoiwanovski/repo/mediahub/web/package.json` and `/Users/jeskoiwanovski/repo/mediahub/packages/mediahub-ui/package.json`, change the `@knkcs/anker` range from `^2.10.0` to `^2.10.1`. Then from `/Users/jeskoiwanovski/repo/mediahub`:

```bash
npm install
cd web && npm run tscheck
```

Expected: install resolves `@knkcs/anker@2.10.1`; tscheck passes.

- [ ] **Step 3: Ship and verify in the cluster**

From `/Users/jeskoiwanovski/repo/knkcms-deploy`: `make ship-mediahub`. Then open the mediahub asset-detail page in a short browser window, scroll, and confirm the account footer stays pinned and the rail scrolls internally.

- [ ] **Step 4: Commit the mediahub bump**

```bash
cd /Users/jeskoiwanovski/repo/mediahub
git add web/package.json packages/mediahub-ui/package.json package-lock.json
git commit -m "chore(deps): bump @knkcs/anker to 2.10.1 (sticky sidebar footer fix)"
```
