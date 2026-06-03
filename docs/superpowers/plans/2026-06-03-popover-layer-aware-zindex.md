# Popover/Menu/HoverCard Layer-Aware z-index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace anker's hardcoded `style={{ zIndex: 1500 }}` on Popover, Menu, HoverCard positioners with a layer-aware calc so popovers stack correctly inside drawers/modals while still beating sticky page chrome.

**Architecture:** Single CSS calc expression per primitive, mirroring Chakra's recipe pattern. Release as anker 2.9.2. Layout-ui bumps the dep — no code change needed.

**Tech Stack:** anker (React + Chakra UI v3 + biome), publish via GH Actions on `v*` tag.

**Spec:** `/Users/jeskoiwanovski/repo/anker/docs/superpowers/specs/2026-06-03-popover-layer-aware-zindex-design.md` (commit `389a679` on anker/main).

**Branches:**
- anker: `fix/popover-layer-aware-zindex` from main
- layout: `chore/anker-2.9.2` from main, after anker publishes

**Test commands:**
- anker: `cd /Users/jeskoiwanovski/repo/anker && pnpm test <filter>`
- layout: `cd /Users/jeskoiwanovski/repo/layout && npm test --workspace=@knkcs/layout-ui -- <filter>`

---

## Pre-work (anker)

- [ ] **Branch off anker main**

```
cd /Users/jeskoiwanovski/repo/anker && git checkout main && git fetch origin main && git reset --hard origin/main && git checkout -b fix/popover-layer-aware-zindex
```

---

### Task 1: Replace inline z-index on Popover, Menu, HoverCard positioners

**Files:**
- Modify: `src/primitives/popover.tsx`
- Modify: `src/primitives/menu.tsx`
- Modify: `src/primitives/hover-card.tsx`

The change is the same shape in all three files — only the slot-var name differs.

- [ ] **Step 1: Popover**

In `src/primitives/popover.tsx`, find:
```tsx
<ChakraPopover.Positioner style={{ zIndex: 1500 }}>
```

Replace with:
```tsx
<ChakraPopover.Positioner
  style={{
    zIndex:
      "calc(var(--popover-z-index, var(--chakra-z-index-popover, 1500)) + var(--layer-index, 0))",
  }}
>
```

Keep the surrounding comment block (or update it to describe the new pattern). Suggested replacement comment:

```tsx
{/* Layer-aware z-index: starts at zIndex.popover (1500, above docked
    chrome) and adds Chakra's --layer-index offset so popovers stack
    above modals/drawers when opened nested. */}
```

- [ ] **Step 2: Menu**

In `src/primitives/menu.tsx`, find:
```tsx
<ChakraMenu.Positioner style={{ zIndex: 1500 }}>
```

Replace with:
```tsx
<ChakraMenu.Positioner
  style={{
    zIndex:
      "calc(var(--menu-z-index, var(--chakra-z-index-popover, 1500)) + var(--layer-index, 0))",
  }}
>
```

- [ ] **Step 3: HoverCard**

In `src/primitives/hover-card.tsx`, find:
```tsx
<ChakraHoverCard.Positioner style={{ zIndex: 1500 }}>
```

Replace with:
```tsx
<ChakraHoverCard.Positioner
  style={{
    zIndex:
      "calc(var(--hover-card-z-index, var(--chakra-z-index-popover, 1500)) + var(--layer-index, 0))",
  }}
>
```

- [ ] **Step 4: Add test asserting --layer-index participation (Popover)**

In `src/primitives/popover.test.tsx` (create or extend), add:

```ts
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

describe("Popover z-index", () => {
  it("Positioner z-index includes --layer-index for nested-overlay stacking", () => {
    const { container } = render(
      <ChakraProvider value={defaultSystem}>
        <Popover open>
          <PopoverTrigger>open</PopoverTrigger>
          <PopoverContent>content</PopoverContent>
        </Popover>
      </ChakraProvider>
    );
    // The Positioner is portaled; search the full document.
    const positioner = document.querySelector('[data-scope="popover"][data-part="positioner"]') as HTMLElement | null;
    expect(positioner).not.toBeNull();
    const style = positioner!.getAttribute("style") ?? "";
    expect(style).toMatch(/var\(--layer-index/);
    expect(style).toMatch(/1500/);
  });
});
```

If `popover.test.tsx` doesn't exist, create it. If existing tests use a different helper to mount Popover (look at `popover.stories.tsx` for the open pattern), adapt the open mechanism. The structural assertion (`style` contains `--layer-index` and `1500`) is the load-bearing part.

- [ ] **Step 5: Same shape test for Menu**

In `src/primitives/menu.test.tsx`, add a test asserting menu positioner style contains `--layer-index` and `1500`. Adapt the open pattern from menu.stories.tsx if needed.

- [ ] **Step 6: Same shape test for HoverCard**

In `src/primitives/hover-card.test.tsx`, add a test asserting hover-card positioner style contains `--layer-index` and `1500`. Adapt the open pattern from hover-card.stories.tsx.

- [ ] **Step 7: Run all primitive tests**

```
cd /Users/jeskoiwanovski/repo/anker && pnpm test popover menu hover-card
```
Expected: PASS.

- [ ] **Step 8: Run lint (CI step that broke last time)**

```
cd /Users/jeskoiwanovski/repo/anker && npm run lint
```
Expected: PASS. If biome reports formatting issues, run:
```
npx @biomejs/biome check --write src/primitives/popover.tsx src/primitives/menu.tsx src/primitives/hover-card.tsx src/primitives/popover.test.tsx src/primitives/menu.test.tsx src/primitives/hover-card.test.tsx
```
Then re-run `npm run lint`.

- [ ] **Step 9: Commit**

```
cd /Users/jeskoiwanovski/repo/anker
git add src/primitives/popover.tsx src/primitives/menu.tsx src/primitives/hover-card.tsx \
        src/primitives/popover.test.tsx src/primitives/menu.test.tsx src/primitives/hover-card.test.tsx
git commit -m "fix(primitives): layer-aware z-index on popover/menu/hover-card positioners"
```

---

### Task 2: CHANGELOG + version bump 2.9.2

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `package.json`

- [ ] **Step 1: Add CHANGELOG entry**

Open `/Users/jeskoiwanovski/repo/anker/CHANGELOG.md`. Insert above `## 2.9.1`:

```markdown
## 2.9.2 — 2026-06-03

### Fixed
- `Popover`, `Menu`, `HoverCard`: positioner z-index now participates in
  Chakra v3's `--layer-index` mechanism. Popovers/menus/hover-cards
  opened inside a drawer or modal now stack correctly above the parent
  overlay (previously the hardcoded `zIndex: 1500` left them at the same
  z-index as drawers, causing visual clipping in nested cases).
```

- [ ] **Step 2: Bump package.json**

```
cd /Users/jeskoiwanovski/repo/anker
```

Open `package.json`. Find `"version": "2.9.1"`. Change to `"version": "2.9.2"`.

- [ ] **Step 3: Verify lint still clean**

```
npm run lint
```

- [ ] **Step 4: Commit**

```
git add CHANGELOG.md package.json
git commit -m "chore(release): 2.9.2 — layer-aware popover/menu/hover-card z-index"
```

---

### Task 3: PR, merge, tag, publish

- [ ] **Step 1: Push branch**

```
cd /Users/jeskoiwanovski/repo/anker
git push -u origin fix/popover-layer-aware-zindex
```

- [ ] **Step 2: Open PR**

```
gh pr create --title "fix(primitives): layer-aware z-index (2.9.2)" --body "$(cat <<'EOF'
## Summary

Popover/Menu/HoverCard positioners hardcoded \`zIndex: 1500\`, bypassing Chakra v3's \`--layer-index\` calc and causing nested popovers (e.g. ColorPickerField inside a DrawerRoot) to render below the parent overlay.

Replace with a layer-aware calc that mirrors Chakra's recipe pattern: \`calc(var(--<x>-z-index, var(--chakra-z-index-popover, 1500)) + var(--layer-index, 0))\`. Preserves the original fix (above sticky docked chrome at 10) AND participates in layer-manager stacking against modals/drawers.

Spec: \`docs/superpowers/specs/2026-06-03-popover-layer-aware-zindex-design.md\`
Plan: \`docs/superpowers/plans/2026-06-03-popover-layer-aware-zindex.md\`

## Test plan

- [x] popover/menu/hover-card tests assert positioner style includes \`--layer-index\` and \`1500\`
- [x] lint clean
- [ ] After publish: layout-ui's ColorPickerField popover inside Edit Color drawer renders above the drawer

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Merge**

```
gh pr merge <PR#> --squash --auto
```

- [ ] **Step 4: Tag + push tag (triggers GH Actions publish)**

```
cd /Users/jeskoiwanovski/repo/anker
git checkout main && git pull --ff-only origin main
git tag v2.9.2
git push origin v2.9.2
```

- [ ] **Step 5: Verify publish**

The publish workflow takes a few minutes. Verify with:
```
npm view @knkcs/anker version
```
Expected (eventually): `2.9.2`. If it stays at `2.9.1`, check workflow status:
```
gh run list --repo knkCS/anker --workflow Publish --limit 3
gh run view <run-id> --repo knkCS/anker --log-failed | tail -40
```

Common failure: lint check on the test files (biome formatting). If so, fix on a follow-up PR + retag.

---

## Pre-work (layout) — after anker 2.9.2 is on npm

- [ ] **Branch off layout main**

```
cd /Users/jeskoiwanovski/repo/layout && git checkout main && git fetch origin main && git reset --hard origin/main && git checkout -b chore/anker-2.9.2
```

---

### Task 4: Bump @knkcs/anker to ^2.9.2

**File:** `packages/layout-ui/package.json`

- [ ] **Step 1: Bump dep**

```
cd /Users/jeskoiwanovski/repo/layout && python3 -c "
import json
p = 'packages/layout-ui/package.json'
with open(p) as f: pkg = json.load(f)
pkg['peerDependencies']['@knkcs/anker'] = '^2.9.2'
with open(p, 'w') as f:
    json.dump(pkg, f, indent=2)
    f.write('\n')
"
grep '@knkcs/anker' packages/layout-ui/package.json
```

- [ ] **Step 2: Install**

```
cd /Users/jeskoiwanovski/repo/layout && npm install
cat node_modules/@knkcs/anker/package.json | grep '"version"' | head -1
```
Expected: `"version": "2.9.2"`.

- [ ] **Step 3: tsc + tests**

```
cd /Users/jeskoiwanovski/repo/layout/packages/layout-ui && npx tsc --noEmit
cd /Users/jeskoiwanovski/repo/layout && npm test --workspace=@knkcs/layout-ui
```
Expected: PASS.

- [ ] **Step 4: Commit**

```
cd /Users/jeskoiwanovski/repo/layout
git add packages/layout-ui/package.json package-lock.json
git commit -m "chore(deps): bump @knkcs/anker to ^2.9.2 (layer-aware popover z-index)"
```

---

### Task 5: Layout PR + merge + ship

- [ ] **Step 1: Push + open PR**

```
cd /Users/jeskoiwanovski/repo/layout
git push -u origin chore/anker-2.9.2
gh pr create --title "chore(deps): bump @knkcs/anker to ^2.9.2 (popover layer-aware z-index)" --body "Pick up knkCS/anker#... — ColorPickerField popover inside Edit Color drawer now renders above the drawer.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 2: Merge + ship**

```
gh pr merge <PR#> --squash --auto
cd /Users/jeskoiwanovski/repo/knkcms-deploy && make ship-layout
```

Verify:
```
kubectl -n knkcms get pod -l app.kubernetes.io/name=layout -o jsonpath='{.items[0].status.containerStatuses[0].image}'
```
Expected: new layout image tag.

Hard-refresh the browser; ColorPickerField popover should now appear above the drawer Content panel.

---

## Self-review

**Spec coverage:**
- A. Replace hardcoded zIndex on popover/menu/hover-card → Task 1 ✓
- B. CHANGELOG + version bump → Task 2 ✓
- C. PR/merge/tag/publish → Task 3 ✓
- D. Layout-ui dep bump → Task 4 ✓
- E. Ship layout → Task 5 ✓
- Structural tests for `--layer-index` in style → Task 1 (steps 4-6) ✓
- Docked-chrome fallback at 1500 preserved → covered by calc default

**Placeholder scan:** Task 3 step 2 has `<PR#>` placeholder — these are operational placeholders (PR number unknown until created). Acceptable since the engineer fills them in from gh pr create output. Task 5 step 1/2 same.

**Type consistency:**
- Slot-var names: `--popover-z-index`, `--menu-z-index`, `--hover-card-z-index` consistent across spec, code, and Chakra recipe naming.
- Version `2.9.2` consistent across CHANGELOG, package.json, layout dep bump, tag.

---

## Execution Handoff

Plan complete and saved to `anker/docs/superpowers/plans/2026-06-03-popover-layer-aware-zindex.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, continuous progress.

**2. Inline Execution** — batched here.

Which?
