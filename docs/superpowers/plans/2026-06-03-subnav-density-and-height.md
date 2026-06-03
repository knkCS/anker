# SubNavLayout Density + Self-Stretching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bump NavList default item gap (anker-wide), make SubNavLayout self-stretch inside any parent with a definite height, document the sub-nav sizing contract, then consume the new anker in layout-ui along with setting Catalogs tab default to `page-geometries`.

**Architecture:** Three small anker changes (one component value, one structural wrapper, one docs section), one CHANGELOG note, then a 2-line layout-ui consumer change after anker is released.

**Tech Stack:** TypeScript, React, @chakra-ui/react (Box/Flex/Grid primitives), npm/release tooling for anker.

**Spec:** `/Users/jeskoiwanovski/repo/anker/docs/superpowers/specs/2026-06-03-subnav-density-and-height-design.md` (commit `545a717` on anker/main).

**Branches:**
- anker: `feat/subnav-density-and-height` from `main`
- layout: `feat/subnav-density-bump` from `main` — after anker is released

**Test commands:**
- anker: `cd /Users/jeskoiwanovski/repo/anker && pnpm test <filter>` (or whatever anker uses — check `package.json`)
- layout: `cd /Users/jeskoiwanovski/repo/layout && npm test --workspace=@knkcs/layout-ui -- <filter>`

---

## Pre-work — anker branch

- [ ] **Branch off anker main**

```
cd /Users/jeskoiwanovski/repo/anker && git checkout main && git fetch origin main && git reset --hard origin/main && git checkout -b feat/subnav-density-and-height
```

---

### Task 1: Bump NavList item gap 0.5 → 1

**Files:**
- Modify: `src/components/nav-list/nav-list.tsx` (one line)
- Modify: `src/components/nav-list/nav-list.test.tsx` (add assertion if not already covered)

- [ ] **Step 1: Add or update test asserting the gap**

Open `src/components/nav-list/nav-list.test.tsx`. If a test already covers Group rendering, find it. Add or update a test:

```tsx
it("renders Group with 4px gap between items", () => {
  const { container } = render(
    <NavListModeProvider value={{ collapsed: false }}>
      <NavList aria-label="t">
        <NavList.Group label="Group">
          <NavList.Item><span>One</span></NavList.Item>
          <NavList.Item><span>Two</span></NavList.Item>
        </NavList.Group>
      </NavList>
    </NavListModeProvider>
  );
  // The Group renders a Flex direction="column" — find it.
  // Chakra resolves gap="1" to var(--chakra-spacing-1); in tests it shows up
  // as an inline style or class. Easiest assertion: querySelector for the
  // Flex element and check its computed style.
  const flex = container.querySelector('[data-testid="nav-list-group-items"]');
  expect(flex).toBeInTheDocument();
  // Note: if the existing component doesn't have this data-testid, add it in
  // the source (see Step 3 below) — wrap the Flex in `data-testid="nav-list-group-items"`.
});
```

If the existing test pattern is structural (snapshot or DOM inspection without testids), add a `data-testid` to the Flex in Step 3 and assert from the test.

- [ ] **Step 2: Run to verify FAIL (if test was added)**

```
cd /Users/jeskoiwanovski/repo/anker && pnpm test nav-list
```
Expected: FAIL on the new assertion (no `nav-list-group-items` testid yet).

- [ ] **Step 3: Change the gap + add testid**

In `src/components/nav-list/nav-list.tsx` find:
```tsx
<Flex direction="column" gap="0.5">
  {children}
</Flex>
```
Replace with:
```tsx
<Flex direction="column" gap="1" data-testid="nav-list-group-items">
  {children}
</Flex>
```

- [ ] **Step 4: Run to verify PASS**

```
pnpm test nav-list
```
Expected: PASS.

- [ ] **Step 5: Commit**

```
cd /Users/jeskoiwanovski/repo/anker
git add src/components/nav-list/
git commit -m "feat(nav-list): bump default Group item gap 0.5 → 1 (2px → 4px)"
```

---

### Task 2: SubNavLayout self-stretching wrapper

**Files:**
- Modify: `src/templates/subnav-layout.tsx`
- Modify: `src/templates/subnav-layout.test.tsx`

- [ ] **Step 1: Read the current `SubNavLayoutRoot` return**

Open `src/templates/subnav-layout.tsx` — find the `<Grid …>` inside `SubNavLayoutRoot`'s return. The `<Grid>` currently has `flex="1" minH="0"`.

- [ ] **Step 2: Write a failing test asserting the outer Box wrapper exists**

In `subnav-layout.test.tsx`, add:

```tsx
it("self-stretches via outer flex wrapper", () => {
  const { container } = render(
    <SubNavLayout>
      <SubNavLayout.Nav><div /></SubNavLayout.Nav>
      <SubNavLayout.Detail><div /></SubNavLayout.Detail>
    </SubNavLayout>
  );
  // The grid (testid "subnav-layout") must be wrapped in an h=100% flex column.
  const grid = container.querySelector('[data-testid="subnav-layout"]');
  expect(grid).toBeInTheDocument();
  const parent = grid?.parentElement;
  expect(parent).toBeInTheDocument();
  expect(parent).toHaveAttribute("data-testid", "subnav-layout-stretch");
});
```

- [ ] **Step 3: Verify FAIL**

```
pnpm test subnav-layout
```
Expected: FAIL — wrapper doesn't exist yet.

- [ ] **Step 4: Add the wrapper**

In `subnav-layout.tsx`, locate the `return (...)` inside `SubNavLayoutRoot`. Wrap the existing `<Grid …>{children}…</Grid>` block in:

```tsx
<Box
  data-testid="subnav-layout-stretch"
  h="100%"
  display="flex"
  flexDirection="column"
  minH="0"
>
  <Grid …>{children}…</Grid>
</Box>
```

The full return becomes:

```tsx
return (
  <NavListModeProvider value={navMode}>
    <Box
      data-testid="subnav-layout-stretch"
      h="100%"
      display="flex"
      flexDirection="column"
      minH="0"
    >
      <Grid
        data-testid="subnav-layout"
        data-collapsed={collapsed ? "true" : "false"}
        gridTemplateColumns={`${collapsed ? COLLAPSED_NAV : EXPANDED_NAV} 1fr`}
        alignItems="stretch"
        minH="0"
        flex="1"
        position="relative"
        transition="grid-template-columns 250ms ease-out"
      >
        {children}
        {/* existing IconButton */}
        <IconButton …/>
      </Grid>
    </Box>
  </NavListModeProvider>
);
```

The existing `<IconButton>` stays inside the Grid (it's positioned absolute relative to it).

Ensure `Box` is imported (it should be).

- [ ] **Step 5: Verify PASS + run all subnav-layout tests**

```
pnpm test subnav-layout
```
Expected: PASS for all existing tests + the new one.

- [ ] **Step 6: Commit**

```
git add src/templates/subnav-layout.tsx src/templates/subnav-layout.test.tsx
git commit -m "feat(subnav-layout): self-stretching outer flex wrapper"
```

---

### Task 3: Page-patterns doc — SubNavLayout sizing note

**Files:**
- Modify: `docs/page-patterns.md`

- [ ] **Step 1: Read the current doc**

Open `docs/page-patterns.md`. Find a logical section to insert the SubNavLayout sizing note — likely near the page-templates section or at the end of the existing patterns.

- [ ] **Step 2: Add the section**

Append (or insert at the appropriate place):

```markdown
### SubNavLayout sizing

`<SubNavLayout>` self-stretches to fill its parent's height. The only
requirement on the parent is that it have a definite height. Inside a
page template's main column this is automatic — page templates establish
the grid row that gives content its height.

Outside a page template (e.g. inside a tab body), wrap the SubNavLayout
in a container with a definite height:

\`\`\`tsx
// in a tab body inside a fixed-height shell
<Box flex="1" minH="0">
  <SubNavLayout …>…</SubNavLayout>
</Box>
\`\`\`

Or set \`h="100%"\` if the parent has explicit height. Without a definite
parent height, the rail collapses to its content height.
```

(Render the inner code fence using literal triple backticks — escape as needed for the surrounding doc format.)

- [ ] **Step 3: Commit**

```
git add docs/page-patterns.md
git commit -m "docs(page-patterns): add SubNavLayout sizing section"
```

---

### Task 4: CHANGELOG entry

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Read the top of CHANGELOG.md**

The current top entry is `## 2.8.0 — 2026-05-29`. Add a NEW entry above it for the next version `2.9.0`.

- [ ] **Step 2: Add the entry**

At the top of `CHANGELOG.md`, above `## 2.8.0`:

```markdown
## 2.9.0 — 2026-06-03

### Changed
- `NavList.Group`: increased default gap between items from 2px to 4px.
  Visual change for all consumers; no API change.
- `SubNavLayout`: now wraps its inner Grid in a flex column so it
  self-stretches inside any parent with a definite height. Consumers
  no longer need to wrap SubNavLayout in their own flex container.

### Docs
- Added "SubNavLayout sizing" section to `docs/page-patterns.md`.
```

- [ ] **Step 3: Bump version in package.json**

```
cd /Users/jeskoiwanovski/repo/anker
```

Open `package.json`. Find `"version": "2.8.0"`. Change to `"version": "2.9.0"`.

- [ ] **Step 4: Commit**

```
git add CHANGELOG.md package.json
git commit -m "chore(release): 2.9.0 (NavList gap + SubNavLayout self-stretching)"
```

---

### Task 5: Push anker branch, open PR, merge, publish

- [ ] **Step 1: Push branch**

```
cd /Users/jeskoiwanovski/repo/anker
git push -u origin feat/subnav-density-and-height
```

- [ ] **Step 2: Open PR**

```
gh pr create --title "feat: SubNavLayout self-stretching + NavList density 2.9.0" --body "$(cat <<'EOF'
## Summary

- NavList.Group item gap 0.5 → 1 (2px → 4px)
- SubNavLayout wraps its inner Grid in a flex column so it self-stretches inside any parent with a definite height
- page-patterns.md gains a "SubNavLayout sizing" section
- Version bump to 2.9.0

Spec: \`docs/superpowers/specs/2026-06-03-subnav-density-and-height-design.md\`
Plan: \`docs/superpowers/plans/2026-06-03-subnav-density-and-height.md\`

## Test plan

- [x] nav-list tests pass with the new gap
- [x] subnav-layout tests pass with the new wrapper
- [ ] After publish: layout-ui PR bumps to 2.9.0 and verifies Catalogs sub-nav fills full height with proper item spacing

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Merge PR (squash + auto)**

```
gh pr merge <PR#> --squash --auto
```

- [ ] **Step 4: Publish 2.9.0**

Anker's release process — check `package.json` `scripts` or `README.md` for the exact publish command. Likely:
```
cd /Users/jeskoiwanovski/repo/anker
git checkout main && git pull
npm run release   # or pnpm release / npm publish — check what anker uses
```

If unsure of the publish command, ASK before publishing.

- [ ] **Step 5: Confirm new version appears in the registry**

```
npm view @knkcs/anker version
```
Expected: `2.9.0`.

---

## Pre-work — layout branch (after anker is published)

- [ ] **Branch off layout main**

```
cd /Users/jeskoiwanovski/repo/layout && git checkout main && git fetch origin main && git reset --hard origin/main && git checkout -b feat/subnav-density-bump
```

---

### Task 6: Bump anker dep + change DEFAULT_CATALOG

**Files:**
- Modify: `packages/layout-ui/package.json`
- Modify: `packages/layout-ui/src/components/stylesheet-detail/catalogs-tab.tsx`
- Modify: any test asserting the default catalog

- [ ] **Step 1: Bump anker pin**

```
cd /Users/jeskoiwanovski/repo/layout/packages/layout-ui
```

Open `package.json`. Find `"@knkcs/anker": "^2.4.0"`. Change to `"@knkcs/anker": "^2.9.0"`.

Run install at the workspace root:
```
cd /Users/jeskoiwanovski/repo/layout && npm install
```

- [ ] **Step 2: Change DEFAULT_CATALOG**

Open `packages/layout-ui/src/components/stylesheet-detail/catalogs-tab.tsx`. Find line 83 (or wherever it is now):

```ts
const DEFAULT_CATALOG: CatalogKey = "glue";
```

Change to:

```ts
const DEFAULT_CATALOG: CatalogKey = "page-geometries";
```

- [ ] **Step 3: Update tests asserting default catalog**

Search for tests that assert the default behavior:
```
grep -rn 'glue\|DEFAULT_CATALOG' packages/layout-ui/src/components/stylesheet-detail/catalogs-tab.test.tsx
```

If any test asserts `getByText("Glue patterns")` after entering the tab without a catalogKey, update to `getByText("Page geometries")` or similar i18n key.

- [ ] **Step 4: Verify**

```
cd /Users/jeskoiwanovski/repo/layout && npm test --workspace=@knkcs/layout-ui -- catalogs-tab
cd /Users/jeskoiwanovski/repo/layout/packages/layout-ui && npx tsc --noEmit
```
Expected: PASS.

- [ ] **Step 5: Commit**

```
cd /Users/jeskoiwanovski/repo/layout
git add packages/layout-ui/package.json packages/layout-ui/src/components/stylesheet-detail/catalogs-tab.tsx
git add packages/layout-ui/src/components/stylesheet-detail/catalogs-tab.test.tsx 2>/dev/null
git add package-lock.json packages/layout-ui/package-lock.json 2>/dev/null
git commit -m "feat(layout-ui): bump anker to 2.9.0; Catalogs tab defaults to page-geometries"
```

(`package-lock.json` adds aren't strictly required if no lockfile changed; but include them if `npm install` updated lockfiles.)

---

### Task 7: Push, PR, merge, ship layout

- [ ] **Step 1: Push**

```
cd /Users/jeskoiwanovski/repo/layout
git push -u origin feat/subnav-density-bump
```

- [ ] **Step 2: Open PR**

```
gh pr create --title "feat(layout-ui): bump anker 2.9.0 + Catalogs tab default = page-geometries" --body "$(cat <<'EOF'
## Summary

- Bump @knkcs/anker from ^2.4.0 to ^2.9.0 (NavList density + SubNavLayout self-stretching from knkcs/anker#…)
- Change Catalogs tab DEFAULT_CATALOG from \"glue\" to \"page-geometries\"

## Test plan

- [x] catalogs-tab tests pass
- [x] tsc clean
- [ ] After ship: Catalogs tab opens on Page geometries; sub-nav items have visible breathing room; sub-nav rail fills full body height; collapsed icons spaced evenly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Merge + ship**

```
gh pr merge <PR#> --squash --auto
cd /Users/jeskoiwanovski/repo/knkcms-deploy && make ship-layout
```

After ship: kubectl confirm image, then hard-refresh the browser.

---

## Self-review

**Spec coverage:**
- A. NavList gap bump → Task 1 ✓
- B. SubNavLayout wrapper → Task 2 ✓
- C. page-patterns doc → Task 3 ✓
- D. CHANGELOG entries + version bump → Task 4 ✓
- E. layout-ui DEFAULT_CATALOG + dep bump → Task 6 ✓
- Tests at each layer (anker NavList, anker SubNavLayout, layout catalogs-tab) ✓

**Placeholder scan:** Task 5 Step 4 says "check what anker uses" for the publish command — that's an operational ASK that depends on what the repo's tooling actually does. Not a placeholder in the "implement later" sense. If the engineer doesn't recognize the publish flow, they should ASK rather than guess. The plan can't enumerate every release tooling permutation upstream.

**Type consistency:**
- `nav-list-group-items` testid consistent between Task 1 source and Task 1 test.
- `subnav-layout-stretch` testid consistent between Task 2 source and Task 2 test.
- Version `2.9.0` consistent across CHANGELOG, package.json, layout-ui dep bump.

---

## Execution Handoff

Plan complete and saved to `anker/docs/superpowers/plans/2026-06-03-subnav-density-and-height.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, continuous progress.

**2. Inline Execution** — batched here with checkpoints.

Which approach?
