# Sticky Page Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AppShell's page-header band sticky by default, with an opt-out `stickyHeader` prop on each anker page template.

**Architecture:** Three coordinated edits inside anker: (1) the slot store backing `usePageHeader` carries a `{ node, sticky }` pair instead of a bare ReactNode; (2) `AppShellInner` reads the `sticky` flag and renders the existing header Box with conditional `position/top/zIndex` plus a `data-sticky-header` attribute; (3) `DetailPageTemplate`, `SettingsPageTemplate`, `IndexPageTemplate` each accept `stickyHeader?: boolean` (default `true`) and forward it through `usePageHeader`. Backward-compatible: existing single-arg `usePageHeader(node)` calls still compile and default to sticky.

**Tech Stack:** React 19, Chakra UI 3, vitest, Storybook, tsup.

**Spec:** `/Users/jeskoiwanovski/repo/anker/docs/superpowers/specs/2026-05-28-sticky-page-header-design.md`

**Branch:** `feat/sticky-page-header` (already created in `/Users/jeskoiwanovski/repo/anker`; spec committed at `f2c4dbf`).

**Conventions:** Conventional commits with scope `app-shell` / `templates`. Biome formatter (tabs). TDD; existing tests use vitest + `@testing-library/react`. Verify with `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify-exports`, `npm run test`.

---

## File Structure

**Modify (all in `/Users/jeskoiwanovski/repo/anker`):**
- `src/templates/app-shell.tsx` — slot-store header value shape, `usePageHeader` signature, `AppShellInner` header-Box rendering.
- `src/templates/app-shell.test.tsx` — three new tests (default sticky; opt-out false; single-arg API still works).
- `src/templates/detail-page-template.tsx` — add `stickyHeader` prop, forward via `usePageHeader`.
- `src/templates/detail-page-template.test.tsx` — verify the prop reaches the slot.
- `src/templates/settings-page-template.tsx` — same.
- `src/templates/index-page-template.tsx` — same.
- `src/templates/app-shell.stories.tsx` (or whatever the existing story file is) — add a "Sticky vs not" story.
- `package.json` — minor version bump `2.5.1 → 2.6.0`.

---

## Task 1: Header slot value + `usePageHeader` API

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/templates/app-shell.tsx`
- Modify: `/Users/jeskoiwanovski/repo/anker/src/templates/app-shell.test.tsx`

Change the header slot value from `ReactNode | null` to `{ node: ReactNode; sticky: boolean } | null`. Extend the public `usePageHeader` to accept an optional `{ sticky?: boolean }` (defaulting to `true`). Existing single-arg call sites keep working.

- [ ] **Step 1: Write the failing test**

Append to `/Users/jeskoiwanovski/repo/anker/src/templates/app-shell.test.tsx`:

```tsx
function HeaderRegistrar({
	sticky,
}: {
	sticky?: boolean;
}) {
	usePageHeader(
		<div data-testid="header-content">registered header</div>,
		sticky === undefined ? undefined : { sticky },
	);
	return <div data-testid="page-body">body</div>;
}

describe("AppShell — sticky page header", () => {
	it("marks the header row sticky by default when content is registered", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderRegistrar />
			</AppShell>,
		);
		const headerBox = screen.getByTestId("app-shell-header");
		expect(headerBox).toHaveAttribute("data-sticky-header", "true");
	});

	it("marks the header row non-sticky when the registration opts out", () => {
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderRegistrar sticky={false} />
			</AppShell>,
		);
		const headerBox = screen.getByTestId("app-shell-header");
		expect(headerBox).toHaveAttribute("data-sticky-header", "false");
	});

	it("keeps the single-arg usePageHeader form working (defaults to sticky)", () => {
		// Identical to the first test, but exercises the legacy single-arg API
		// shape that already-published consumers use.
		renderWithChakra(
			<AppShell sidebar={<div data-testid="sb" />}>
				<HeaderRegistrar />
			</AppShell>,
		);
		expect(screen.getByTestId("app-shell-header")).toHaveAttribute(
			"data-sticky-header",
			"true",
		);
	});
});
```

- [ ] **Step 2: Verify FAIL**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test -- src/templates/app-shell.test.tsx 2>&1 | tail -10
```
Expected: FAIL — `data-sticky-header` attribute not on the element.

- [ ] **Step 3: Update the slot store types + `usePageHeader`**

Edit `/Users/jeskoiwanovski/repo/anker/src/templates/app-shell.tsx`.

(a) Add a type for the header slot value (private; keep near the existing `SlotName` declaration):

```ts
interface HeaderSlotValue {
	node: ReactNode;
	sticky: boolean;
}
```

(b) The slot store generically stores `ReactNode` today. Loosen the value type so the header slot can carry an object instead. Replace the existing `SlotStore` interface and `createSlotStore` body. Current:

```ts
interface SlotStore {
	get(slot: SlotName): ReactNode;
	set(slot: SlotName, node: ReactNode): void;
	clear(slot: SlotName): void;
	subscribe(slot: SlotName, listener: () => void): () => void;
}

function createSlotStore(): SlotStore {
	const values: Record<SlotName, ReactNode> = {
		actions: null,
		header: null,
		rail: null,
	};
	// …
}
```

Replace with (the slot store now holds `unknown`; consumers cast to the slot-specific shape they expect):

```ts
interface SlotStore {
	get(slot: SlotName): unknown;
	set(slot: SlotName, value: unknown): void;
	clear(slot: SlotName): void;
	subscribe(slot: SlotName, listener: () => void): () => void;
}

function createSlotStore(): SlotStore {
	const values: Record<SlotName, unknown> = {
		actions: null,
		header: null,
		rail: null,
	};
	const listeners: Record<SlotName, Set<() => void>> = {
		actions: new Set(),
		header: new Set(),
		rail: new Set(),
	};

	function notify(slot: SlotName) {
		for (const listener of listeners[slot]) listener();
	}

	return {
		get(slot) {
			return values[slot];
		},
		set(slot, value) {
			if (values[slot] === value) return;
			values[slot] = value;
			notify(slot);
		},
		clear(slot) {
			if (values[slot] === null) return;
			values[slot] = null;
			notify(slot);
		},
		subscribe(slot, listener) {
			listeners[slot].add(listener);
			return () => {
				listeners[slot].delete(listener);
			};
		},
	};
}
```

(c) Adjust the internal `useSlotValue` so it returns the raw stored value (typed `unknown`) and let callers cast. The current implementation returns `ReactNode`. Replace its return type:

```ts
function useSlotValue(slot: SlotName): unknown {
	const store = useContext(SlotStoreContext);
	const subscribe = useCallback(
		(listener: () => void) => {
			if (!store) return () => undefined;
			return store.subscribe(slot, listener);
		},
		[store, slot],
	);
	const getSnapshot = useCallback(() => {
		if (!store) return null;
		return store.get(slot);
	}, [store, slot]);
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

(d) Update `usePageActions` and `usePageRail` callers of `useSlotValue` — they previously got `ReactNode`. Since both consumers (`AppShellInner` for `rail`, and `useRegisteredPageActions` for `actions`) treat the result as `ReactNode`, add casts at the read sites (Task 2 step handles AppShellInner; for `useRegisteredPageActions`, add the cast inline). Find `useRegisteredPageActions`:

```bash
grep -n "useRegisteredPageActions" /Users/jeskoiwanovski/repo/anker/src/templates/app-shell.tsx
```

Update its body to cast: `return useSlotValue("actions") as ReactNode;`.

Same treatment for the rail read site in `AppShellInner` (Task 2 step 3 covers it explicitly).

(e) Replace the public `usePageHeader` signature. Current:

```ts
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

Replace with:

```ts
/**
 * Register page-header content (typically a <PageHeader>) from any descendant
 * of `<AppShell>`. The content is rendered by AppShell in grid row 1, spanning
 * the main column and the rail column (when present).
 *
 * Pass `options.sticky === false` to opt out of the default sticky behaviour
 * for the specific page. The hook is a no-op when called outside an AppShell.
 */
export function usePageHeader(
	content: ReactNode,
	options?: { sticky?: boolean },
): void {
	const store = useContext(SlotStoreContext);
	const sticky = options?.sticky ?? true;
	const value: HeaderSlotValue = { node: content, sticky };
	const latest = useRef<HeaderSlotValue>(value);
	latest.current = value;
	useEffect(() => {
		if (!store) return;
		store.set("header", latest.current);
		return () => {
			store.clear("header");
		};
	}, [store]);
	useEffect(() => {
		if (!store) return;
		store.set("header", { node: content, sticky });
	}, [store, content, sticky]);
}
```

- [ ] **Step 4: Build + typecheck**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run typecheck 2>&1 | tail -5
```
Expected: clean. (AppShell render still reads the slot as `ReactNode` — Task 2 fixes that. Until then, the rendered header may be `[object Object]` in the DOM. The new tests assert the data-attribute, not the content — they pass once Task 2 lands.)

If typecheck complains about the rail/actions casts, ensure both reads use `as ReactNode` (per step 3d).

- [ ] **Step 5: Commit**

```bash
cd /Users/jeskoiwanovski/repo/anker
git add src/templates/app-shell.tsx src/templates/app-shell.test.tsx
git commit -m "feat(app-shell): header slot carries sticky flag"
```

(The tests are still failing at this point — Task 2 renders the data attribute. We commit incrementally for bisectability; both tasks land in the same PR.)

---

## Task 2: AppShell renders sticky props + `data-sticky-header`

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/templates/app-shell.tsx`

The header Box reads the slot's `node` and `sticky` and renders `position: sticky; top: 0; z-index: docked` + `data-sticky-header` accordingly.

- [ ] **Step 1: Read AppShellInner**

```bash
sed -n '270,335p' /Users/jeskoiwanovski/repo/anker/src/templates/app-shell.tsx
```

Confirm the current shape: `const headerNode = useSlotValue("header");` and the `{showHeaderRow ? (<Box …>{headerNode}</Box>) : null}` block.

- [ ] **Step 2: Read the slot as `HeaderSlotValue`**

Replace the existing `const headerNode = useSlotValue("header");` line with:

```ts
	const headerSlot = useSlotValue("header") as HeaderSlotValue | null;
	const headerNode = headerSlot?.node ?? null;
	const headerSticky = headerSlot?.sticky ?? true;
```

Also update the rail read line right above (or below) to cast: `const railNode = useSlotValue("rail") as ReactNode;` — needed because Task 1 made `useSlotValue` return `unknown`.

- [ ] **Step 3: Update `showHeaderRow`**

`showHeaderRow` previously checked `headerNode !== null && headerNode !== undefined`. Keep that exact check — `headerNode` is the `.node` from the slot value, so the semantics are unchanged.

- [ ] **Step 4: Render conditional sticky on the header Box**

Find the header Box block:

```tsx
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
```

Replace with:

```tsx
{showHeaderRow ? (
	<Box
		data-testid="app-shell-header"
		data-sticky-header={headerSticky ? "true" : "false"}
		gridColumn={showRailColumn ? "2 / 4" : "2 / 3"}
		gridRow="1"
		minW="0"
		position={headerSticky ? "sticky" : undefined}
		top={headerSticky ? "0" : undefined}
		zIndex={headerSticky ? "docked" : undefined}
	>
		{headerNode}
	</Box>
) : null}
```

- [ ] **Step 5: Verify Task 1 tests now PASS**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test -- src/templates/app-shell.test.tsx 2>&1 | tail -10
```
Expected: the three new tests PASS, all existing tests still PASS.

- [ ] **Step 6: Run the full suite**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test 2>&1 | tail -5
```
Expected: green.

- [ ] **Step 7: Commit**

```bash
cd /Users/jeskoiwanovski/repo/anker
git add src/templates/app-shell.tsx
git commit -m "feat(app-shell): sticky header row by default + data-sticky-header"
```

---

## Task 3: Page templates accept `stickyHeader` prop

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/templates/detail-page-template.tsx`
- Modify: `/Users/jeskoiwanovski/repo/anker/src/templates/settings-page-template.tsx`
- Modify: `/Users/jeskoiwanovski/repo/anker/src/templates/index-page-template.tsx`
- Modify: `/Users/jeskoiwanovski/repo/anker/src/templates/detail-page-template.test.tsx` (if it exists)

Identical surgery per template: add the prop, default `true`, forward through `usePageHeader`.

- [ ] **Step 1: Write the failing test (DetailPageTemplate)**

Find or create `/Users/jeskoiwanovski/repo/anker/src/templates/detail-page-template.test.tsx`. Append:

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./app-shell";
import { DetailPageTemplate } from "./detail-page-template";

function renderShell(ui: ReactElement) {
	return render(
		<ChakraProvider value={defaultSystem}>
			<AppShell sidebar={<div data-testid="sb" />}>{ui}</AppShell>
		</ChakraProvider>,
	);
}

describe("DetailPageTemplate — sticky header", () => {
	it("renders a sticky header by default", () => {
		renderShell(<DetailPageTemplate title="X">body</DetailPageTemplate>);
		expect(screen.getByTestId("app-shell-header")).toHaveAttribute(
			"data-sticky-header",
			"true",
		);
	});

	it("opts out when stickyHeader={false}", () => {
		renderShell(
			<DetailPageTemplate title="X" stickyHeader={false}>
				body
			</DetailPageTemplate>,
		);
		expect(screen.getByTestId("app-shell-header")).toHaveAttribute(
			"data-sticky-header",
			"false",
		);
	});
});
```

(If `detail-page-template.test.tsx` already exists with another shape, copy its `describe` style and append the new `describe` block.)

- [ ] **Step 2: Verify FAIL**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test -- src/templates/detail-page-template.test.tsx 2>&1 | tail -10
```
Expected: FAIL — the prop type doesn't accept `stickyHeader`.

- [ ] **Step 3: Update DetailPageTemplate**

Edit `/Users/jeskoiwanovski/repo/anker/src/templates/detail-page-template.tsx`.

Add to `DetailPageTemplateProps`:

```ts
	/**
	 * Pin the page-header band to the top of the viewport while the body
	 * scrolls. @default true
	 */
	stickyHeader?: boolean;
```

Add to the destructured props in the component signature: `stickyHeader = true,` alongside the other props.

Change the `usePageHeader` call from:

```tsx
	usePageHeader(
		<PageHeader … />,
	);
```

to:

```tsx
	usePageHeader(
		<PageHeader … />,
		{ sticky: stickyHeader },
	);
```

- [ ] **Step 4: Run DetailPageTemplate tests**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run test -- src/templates/detail-page-template.test.tsx 2>&1 | tail -10
```
Expected: PASS (both new tests + existing).

- [ ] **Step 5: Apply the same surgery to SettingsPageTemplate**

In `/Users/jeskoiwanovski/repo/anker/src/templates/settings-page-template.tsx`:

(a) Add to `SettingsPageTemplateProps`:

```ts
	/**
	 * Pin the page-header band to the top of the viewport while the body
	 * scrolls. @default true
	 */
	stickyHeader?: boolean;
```

(b) Add to the destructured props: `stickyHeader = true,`.

(c) Change `usePageHeader(<PageHeader … />);` to `usePageHeader(<PageHeader … />, { sticky: stickyHeader });`.

- [ ] **Step 6: Apply the same surgery to IndexPageTemplate**

In `/Users/jeskoiwanovski/repo/anker/src/templates/index-page-template.tsx`:

(a) Add to `IndexPageTemplateProps`:

```ts
	/**
	 * Pin the page-header band to the top of the viewport while the body
	 * scrolls. @default true
	 */
	stickyHeader?: boolean;
```

(b) Destructure with default: `stickyHeader = true,`.

(c) Update the `usePageHeader` call to pass `{ sticky: stickyHeader }`.

- [ ] **Step 7: Mirror the test for SettingsPageTemplate and IndexPageTemplate**

If those templates have existing test files (look with `ls src/templates/*.test.tsx`), append a parallel `describe` block for each. Use the exact test shape from Step 1, replacing `DetailPageTemplate` with the respective component and providing the minimum props each requires (title, breadcrumbs as needed).

If a template has no test file yet, skip the per-template test — the DetailPageTemplate test plus the AppShell tests already cover the wiring; per-template tests are duplicative and additive only.

- [ ] **Step 8: Full suite + typecheck**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run typecheck 2>&1 | tail -3
cd /Users/jeskoiwanovski/repo/anker && npm run test 2>&1 | tail -5
```
Expected: clean + green.

- [ ] **Step 9: Commit**

```bash
cd /Users/jeskoiwanovski/repo/anker
git add src/templates/detail-page-template.tsx \
  src/templates/settings-page-template.tsx \
  src/templates/index-page-template.tsx \
  src/templates/detail-page-template.test.tsx
# Add any other test files you created in Step 7:
git add src/templates/settings-page-template.test.tsx 2>/dev/null || true
git add src/templates/index-page-template.test.tsx 2>/dev/null || true
git commit -m "feat(templates): stickyHeader prop on Detail/Settings/IndexPageTemplate"
```

---

## Task 4: Storybook story showing sticky behaviour

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/src/templates/app-shell.stories.tsx`

Add a story that renders a long body so the sticky header is observable, plus an opt-out variant.

- [ ] **Step 1: Inspect existing stories**

```bash
cd /Users/jeskoiwanovski/repo/anker && ls src/templates/*.stories.tsx
```

Open the AppShell story file (or whichever is the canonical "page shell" story file) and read it briefly to match the existing harness shape.

- [ ] **Step 2: Append two stories**

```tsx
function LongBody({ count = 40 }: { count?: number }) {
	return (
		<Box p="6">
			{Array.from({ length: count }, (_, i) => (
				<Box key={i} py="3" borderBottomWidth="1px" borderBottomColor="border">
					Row {i + 1} — scroll to see the sticky header stay pinned.
				</Box>
			))}
		</Box>
	);
}

export const StickyHeaderDefault: Story = {
	render: () => (
		<AppShell sidebar={<Box w="180px" p="4">sidebar</Box>}>
			<DetailPageTemplate
				breadcrumbs={[{ label: "Templates", to: "#" }, { label: "Demo" }]}
				title="Sticky header — default"
				subtitle="Scroll the body; the header stays pinned."
			>
				<LongBody />
			</DetailPageTemplate>
		</AppShell>
	),
};

export const StickyHeaderOptOut: Story = {
	render: () => (
		<AppShell sidebar={<Box w="180px" p="4">sidebar</Box>}>
			<DetailPageTemplate
				breadcrumbs={[{ label: "Templates", to: "#" }, { label: "Demo" }]}
				title="Sticky header — opted out"
				subtitle="Scroll the body; the header scrolls away."
				stickyHeader={false}
			>
				<LongBody />
			</DetailPageTemplate>
		</AppShell>
	),
};
```

(Match the existing story file's import set — `DetailPageTemplate`, `Box`, `Story` type, `AppShell`. If `Story` is a different name, adapt.)

- [ ] **Step 3: Visual sanity check**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -5
```
Expected: clean. (We don't launch Storybook here — story file just needs to compile. The visual sign-off happens during review.)

- [ ] **Step 4: Commit**

```bash
cd /Users/jeskoiwanovski/repo/anker
git add src/templates/app-shell.stories.tsx
git commit -m "docs(app-shell): sticky header stories (default + opt-out)"
```

---

## Task 5: Export + bump to 2.6.0 + ship

**Files:**
- Modify: `/Users/jeskoiwanovski/repo/anker/package.json`

No new public exports are added (the `stickyHeader` prop is part of each template's existing exported props interface). Only the version bumps.

- [ ] **Step 1: Bump version**

In `/Users/jeskoiwanovski/repo/anker/package.json`, change:

```json
  "version": "2.5.1",
```

to:

```json
  "version": "2.6.0",
```

- [ ] **Step 2: Full pipeline locally**

```bash
cd /Users/jeskoiwanovski/repo/anker
npm run lint 2>&1 | tail -5
npm run typecheck 2>&1 | tail -3
npm run build 2>&1 | tail -5
npm run verify-exports 2>&1 | tail -3
npm run test 2>&1 | tail -5
```
Expected: every step clean. If `lint` flags pre-existing biome warnings as errors (CI-stricter behavior we hit before), run `npx biome check --write --unsafe src/` to apply formatter+safe rules, then re-run lint.

- [ ] **Step 3: Commit + tag prep**

```bash
cd /Users/jeskoiwanovski/repo/anker
git add package.json
git commit -m "chore(release): 2.6.0 — sticky page header"
```

- [ ] **Step 4: Pack a local tarball for consumer pre-validation**

```bash
cd /Users/jeskoiwanovski/repo/anker && npm run build 2>&1 | tail -3
cd /Users/jeskoiwanovski/repo/anker && npm pack 2>&1 | tail -3
mv knkcs-anker-2.6.0.tgz /tmp/knkcs-anker-2.6.0.tgz
ls -la /tmp/knkcs-anker-2.6.0.tgz
```

(Consumer SPAs can install this tarball for smoke before the registry publish completes. Matches the workflow we used for 2.5.0 / 2.5.1.)

- [ ] **Step 5: Push + PR + merge + tag**

```bash
cd /Users/jeskoiwanovski/repo/anker
git push -u origin feat/sticky-page-header
```

Open the PR:

```bash
cd /Users/jeskoiwanovski/repo/anker
gh pr create --base main --title "feat: sticky page header by default (2.6.0)" --body "$(cat <<'EOF'
## Summary

- AppShell's header band is now sticky by default (\`position: sticky; top: 0; z-index: docked\`).
- Each anker page template (\`DetailPageTemplate\`, \`SettingsPageTemplate\`, \`IndexPageTemplate\`) accepts a new \`stickyHeader?: boolean\` prop defaulting to \`true\`. Pass \`false\` to opt out per page.
- \`usePageHeader\` accepts an optional second argument \`{ sticky?: boolean }\`; single-arg form unchanged.
- New AppShell tests verify the data attribute on the header row; new DetailPageTemplate tests verify the prop forwarding; new Storybook stories show default + opt-out behaviour.

Spec: \`docs/superpowers/specs/2026-05-28-sticky-page-header-design.md\`.

## Test Plan

- vitest: 1115+ tests passing (new sticky tests + existing).
- Storybook: \`StickyHeaderDefault\` / \`StickyHeaderOptOut\` stories.
- Full pipeline (\`lint\`, \`typecheck\`, \`build\`, \`verify-exports\`, \`test\`) green.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Merge (manual gate — wait for review):

```bash
cd /Users/jeskoiwanovski/repo/anker
gh pr merge <PR#> --merge --admin
```

Then tag and push:

```bash
cd /Users/jeskoiwanovski/repo/anker
git checkout main && git pull
git tag v2.6.0
git push origin v2.6.0
```

Watch the publish workflow:

```bash
cd /Users/jeskoiwanovski/repo/anker && gh run watch $(gh run list --workflow=publish.yml --limit 1 --json databaseId -q '.[0].databaseId') --exit-status 2>&1 | tail -10
```

If the workflow fails on the pre-existing biome lint issues (CI is stricter than local — same gotcha as 2.5.0), apply the same hotfix pattern: run `npx biome check --write --unsafe src/` on main, bump to 2.6.1, tag and re-publish.

- [ ] **Step 6: Verify publish**

```bash
npm view @knkcs/anker version 2>&1 | tail -2
```
Expected: `2.6.0` (or `2.6.1` if the hotfix path was needed).

---

## Final Verification

- [ ] `npm run test` green (1100+ tests).
- [ ] `npm run typecheck` clean.
- [ ] `npm run build` clean.
- [ ] `npm run verify-exports` clean.
- [ ] `@knkcs/anker@2.6.x` resolvable from npmjs (`npm view`).
- [ ] Storybook stories render the sticky default + opt-out (visual sign-off during review).

---

## Notes for the Implementer

- **Backward compatibility.** Single-arg `usePageHeader(node)` keeps working unchanged because the new second argument is optional and defaults to `{ sticky: true }`. Existing call sites in odon, layout, core, template all keep compiling.
- **Slot store type loosening.** Changing the store's internal value from `ReactNode` to `unknown` is intentional — the header slot now carries an object. The `usePageActions` and `usePageRail` flows already pass `ReactNode`, and their consumers (`useRegisteredPageActions`, `AppShellInner`'s rail read) cast back to `ReactNode` on read. No public type leaks.
- **z-index token.** Use Chakra's `docked` token (above default content; below `modal`/`popover`/`tooltip`). Don't hardcode a number.
- **Lint surprise.** Anker's CI runs `biome check` with stricter behaviour than local. The previous 2.5.0 release hit this — be prepared to ship a `2.6.1` hotfix that runs `biome check --write --unsafe src/` to clean up the noUnusedImports warnings if the CI workflow fails on them.
- **Don't touch `PageHeader` itself.** Its `bg="bg-surface"` opacity is the only sticky-related property it needs, and it's already there.
- **Don't refactor the slot store further.** The `unknown`-typed store is a small concession to support multiple value shapes; resist the urge to introduce a generic `SlotValue<T>` map type unless a third slot needs a non-ReactNode shape.
