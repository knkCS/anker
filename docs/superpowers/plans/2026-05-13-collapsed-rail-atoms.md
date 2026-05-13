# Collapsed Context Rail Atoms — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five mode-aware compact atoms to `<ContextRail>` (`IconButton`, `ValueTile`, `StatusIcon`, `Avatar`, `Divider`) so the collapsed 44px column surfaces useful information instead of empty space, then migrate odon's four rails to use them.

**Architecture:** `<ContextRail>` exposes a new internal `RailModeContext` carrying `{ collapsed: boolean }`. Each atom reads this context and renders an expanded form (full-width row/button) or a compact 32×32 form (with a left-placed tooltip) accordingly. Atoms are tagged via a `Symbol.for("anker.contextRail.atom")` static field on the component function so `<ContextRail.Section>` can filter children in collapsed mode — only atom-tagged children render; section header and non-atom JSX are hidden. The rail Root renders its `children` in both modes (currently it renders nothing in collapsed mode beyond the toggle); the collapsed body becomes a vertical `Flex` of atoms.

**Tech Stack:** React 18 + TypeScript, Chakra UI v3, Vitest + Testing Library, Biome, tsup, Storybook MDX.

**Spec:** `docs/superpowers/specs/2026-05-13-collapsed-rail-atoms-design.md`.

**Repos / branches:**
- Anker: `/Users/jeskoiwanovski/repo/anker`, branch `feature/collapsed-rail-atoms` (already checked out, spec commit `d386a6b` present).
- Odon: `/Users/jeskoiwanovski/repo/odon`, branch `feature/anker-2.3-rail-atoms` (create when reaching Task 12).

## File plan

- `src/components/context-rail/context-rail.tsx` — Root + Header + Section + Footer + new `RailModeContext` + barrel export including new atoms. (Existing file, ~250 lines; this change adds ~30 lines for the context + Root collapsed-mode children rendering + Section filter logic.)
- `src/components/context-rail/atoms.tsx` — **NEW.** Five atom components (`IconButton`, `ValueTile`, `StatusIcon`, `Avatar`, `Divider`) + the `useContextRailMode` hook + the `RAIL_ATOM` sentinel + helper to test if a child is an atom. Single file (~250 lines total) because each atom is small and they're tightly related.
- `src/components/context-rail/context-rail.test.tsx` — extend with one `describe` block per atom plus integration tests.
- `src/components/context-rail/context-rail.stories.tsx` (or `context-rail.mdx`) — add per-atom stories + a "Full rail collapsed vs expanded" story.
- `docs/page-patterns.md` — extend §ContextRail with a "Compact atoms" subsection.
- `CLAUDE-ANKER.md` — update the `<ContextRail>` row.

---

## Task 1: RailModeContext on the Root

**Files:**
- Modify: `src/components/context-rail/context-rail.tsx`
- Test: `src/components/context-rail/context-rail.test.tsx`

- [ ] **Step 1: Write the failing test**

Add inside the existing `describe("ContextRail", …)` in `src/components/context-rail/context-rail.test.tsx`:

```tsx
it("provides RailModeContext with collapsed=false when expanded", () => {
    function Probe() {
        const mode = useContextRailMode();
        return <div data-testid="probe">{String(mode.collapsed)}</div>;
    }
    renderWithChakra(
        <ContextRail>
            <Probe />
        </ContextRail>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("false");
});

it("provides RailModeContext with collapsed=true when rail is collapsed", async () => {
    function Probe() {
        const mode = useContextRailMode();
        return <div data-testid="probe">{String(mode.collapsed)}</div>;
    }
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", { value: 1600, configurable: true });
    renderWithChakra(
        <ContextRail>
            <Probe />
        </ContextRail>,
    );
    // expand confirmed; now collapse via the toggle
    expect(screen.getByTestId("probe")).toHaveTextContent("false");
    await user.click(screen.getByTestId("context-rail-toggle"));
    expect(screen.getByTestId("probe")).toHaveTextContent("true");
});
```

Update imports at the top of the test file to include `useContextRailMode`:

```tsx
import { ContextRail, useContextRailMode } from "./context-rail";
```

- [ ] **Step 2: Run tests to verify they fail**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: FAIL — `useContextRailMode` is not exported.

- [ ] **Step 3: Implement RailModeContext and the hook**

In `src/components/context-rail/context-rail.tsx`, add immediately after the existing `RailRootContext` declaration (around line 20):

```tsx
/**
 * Carries the rail's collapsed state to atom subcomponents. Atoms read this
 * to decide between their expanded and compact renderings. Provided by
 * `<ContextRail>`; defaults to `{ collapsed: false }` when used outside.
 */
const RailModeContext = createContext<{ collapsed: boolean }>({
    collapsed: false,
});

/**
 * Hook used by rail atoms to read the rail's collapsed state. Returns
 * `{ collapsed: false }` when called outside a `<ContextRail>` Root —
 * atoms then render their expanded form, matching the dev-mode warning
 * behavior of other rail subcomponents.
 */
export function useContextRailMode(): { collapsed: boolean } {
    return useContext(RailModeContext);
}
```

In `ContextRailRoot` (around line 65), wrap the existing return JSX with a `RailModeContext.Provider` that exposes the `collapsed` state. The wrapping order is: `RailRootContext.Provider` (existing, outermost) → `RailModeContext.Provider` (new) → existing `<Box data-testid="context-rail">`. Add the new provider INSIDE the existing one:

```tsx
return (
    <RailRootContext.Provider value={true}>
        <RailModeContext.Provider value={{ collapsed }}>
            <Box
                data-testid="context-rail"
                /* …existing props… */
            >
                {/* existing children */}
            </Box>
        </RailModeContext.Provider>
    </RailRootContext.Provider>
);
```

- [ ] **Step 4: Run the test to verify it passes**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: PASS for the new tests AND all existing tests (the change is purely additive at the Root level).

- [ ] **Step 5: Commit**

```bash
git add src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx
git commit -m "feat(context-rail): expose RailModeContext for compact atoms"
```

---

## Task 2: Render children in collapsed mode + Section filter

**Files:**
- Modify: `src/components/context-rail/context-rail.tsx`
- Test: `src/components/context-rail/context-rail.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add inside `describe("ContextRail", …)`:

```tsx
it("renders children in collapsed mode (atoms appear, header/section chrome hidden)", async () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    renderWithChakra(
        <ContextRail>
            <ContextRail.Header eyebrow="EYE" title="Title" />
            <ContextRail.Section id="s1" label="Section label">
                <div data-testid="atom-marker" data-rail-atom="true">atom</div>
                <div data-testid="non-atom">free-form jsx</div>
            </ContextRail.Section>
        </ContextRail>,
    );
    // Atom is rendered
    expect(screen.getByTestId("atom-marker")).toBeInTheDocument();
    // Non-atom inside section is hidden
    expect(screen.queryByTestId("non-atom")).not.toBeInTheDocument();
    // Section's label text is hidden in collapsed mode
    expect(screen.queryByText("Section label")).not.toBeInTheDocument();
    // Header's title text is hidden in collapsed mode
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
});

it("renders Section children normally in expanded mode", () => {
    Object.defineProperty(window, "innerWidth", { value: 1600, configurable: true });
    renderWithChakra(
        <ContextRail>
            <ContextRail.Section id="s1" label="Section label">
                <div data-testid="non-atom">free-form jsx</div>
            </ContextRail.Section>
        </ContextRail>,
    );
    expect(screen.getByTestId("non-atom")).toBeInTheDocument();
    expect(screen.getByText("Section label")).toBeInTheDocument();
});
```

The "atom" test marker uses a `data-rail-atom="true"` attribute that the implementation will be allowed to detect. (Real atoms will use a `Symbol` field on their component function — see Task 3 — but the integration test uses the attribute as a stand-in since we don't have real atoms yet.) **Edit:** since atoms aren't built yet, this test will need adjustment in Task 3 — for now, write a placeholder that asserts only the chrome-hiding behavior:

Replace the first test with:

```tsx
it("hides Section labels and Header in collapsed mode", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    renderWithChakra(
        <ContextRail>
            <ContextRail.Header eyebrow="EYE" title="Title" />
            <ContextRail.Section id="s1" label="Section label">
                <div data-testid="non-atom">free-form jsx</div>
            </ContextRail.Section>
        </ContextRail>,
    );
    // Header and Section labels are hidden in collapsed mode
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
    expect(screen.queryByText("Section label")).not.toBeInTheDocument();
    // Non-atom JSX inside Section is hidden in collapsed mode
    expect(screen.queryByTestId("non-atom")).not.toBeInTheDocument();
});
```

The atom-passes-through behavior gets its own test in Task 3.

- [ ] **Step 2: Run tests to verify they fail**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: FAIL — currently the Root renders nothing in collapsed mode (or renders everything if it just got changed in Task 1; the assertion that section labels are hidden will fail).

- [ ] **Step 3: Render children in collapsed mode + a vertical Flex stack**

In `src/components/context-rail/context-rail.tsx`, find the `ContextRailRoot` return JSX. The current structure (after Task 1) renders the toggle button and conditionally the expanded body:

```tsx
<IconButton …toggle button… />
{collapsed ? null : (
    <Box h="full" overflowY="auto" px="4" pt="4" pb="4">
        {children}
    </Box>
)}
```

Replace the conditional with one that ALSO renders children in collapsed mode, but inside a tight vertical Flex:

```tsx
{collapsed ? (
    <Flex
        data-testid="context-rail-collapsed-body"
        direction="column"
        align="center"
        gap="2"
        pt="14"  /* enough top padding to clear the floating toggle (top=6, size=7) */
        pb="3"
        h="full"
        overflowY="auto"
    >
        {children}
    </Flex>
) : (
    <Box h="full" overflowY="auto" px="4" pt="4" pb="4">
        {children}
    </Box>
)}
```

Add the `Flex` import to the existing layout import line:

```tsx
import { Box, Flex } from "../../primitives/layout";
```

- [ ] **Step 4: Hide Header in collapsed mode**

In `ContextRailHeader`, read the new context and return null when collapsed:

```tsx
const ContextRailHeader = ({ eyebrow, title }: ContextRailHeaderProps) => {
    useWarnIfOutsideRailRoot("ContextRail.Header");
    const { collapsed } = useContextRailMode();
    if (collapsed) return null;
    return (
        <Box mb="4" pb="3" borderBottomWidth="1px" borderBottomColor="border">
            {/* existing eyebrow + heading */}
        </Box>
    );
};
```

- [ ] **Step 5: Section filters non-atom children when collapsed**

In `ContextRailSection`, also read the mode. When collapsed, render only `React.Children` that are React elements whose `.type` has a `railAtom` static field set to a known sentinel. The sentinel and atoms come in Task 3; for now, define the sentinel and the filter helper, then use them:

Add near the top of `context-rail.tsx` (before any component definitions, e.g., after the `isDevMode` function):

```tsx
/**
 * Sentinel placed on rail-atom component functions (e.g., ContextRail.IconButton)
 * so that `<ContextRail.Section>` can filter children in collapsed mode and
 * keep only the atom-tagged ones.
 */
export const RAIL_ATOM = Symbol.for("anker.contextRail.atom");

function isRailAtom(child: React.ReactNode): boolean {
    if (!React.isValidElement(child)) return false;
    const type = child.type as { railAtom?: symbol } | string;
    return typeof type === "function" && type.railAtom === RAIL_ATOM;
}
```

(Yes, the function-check is loose: `typeof type === "function"` is true for both regular components and class components; that's fine for our purposes.)

Note: `React` namespace — add `import * as React from "react"` at the top if not already present (the current file uses `import type React from "react"`; switch to `import * as React from "react"` so the runtime `React.Children` and `React.isValidElement` are available, OR `import React, { … } from "react"`). Use whichever form is consistent with the rest of the file's React usage.

Update the imports at the top:

```tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
```

In `ContextRailSection`, replace the rendering with:

```tsx
const ContextRailSection = ({ id, icon, label, defaultOpen = true, action, children }: ContextRailSectionProps) => {
    useWarnIfOutsideRailRoot("ContextRail.Section");
    const { collapsed } = useContextRailMode();
    const [open, setOpen] = useState(defaultOpen);

    if (collapsed) {
        // Only atom-tagged children are rendered; section chrome (header, label, toggle, action) is hidden.
        const atomChildren = React.Children.toArray(children).filter(isRailAtom);
        if (atomChildren.length === 0) return null;
        return <>{atomChildren}</>;
    }

    return (
        <Box data-section-id={id} borderBottomWidth="1px" borderBottomColor="border-muted">
            {/* existing expanded JSX unchanged */}
        </Box>
    );
};
```

- [ ] **Step 6: Footer pins in collapsed mode**

In `ContextRailFooter`, render with a top divider in both modes; the existing layout already pins the Footer at the bottom of the parent flex via `mt="auto"` — but the current implementation uses `mt="4"`. Update to keep its behavior consistent:

```tsx
const ContextRailFooter = ({ children }: { children: React.ReactNode }) => {
    const { collapsed } = useContextRailMode();
    return (
        <Box
            mt={collapsed ? "auto" : "4"}
            pt={collapsed ? "3" : "4"}
            borderTopWidth="1px"
            borderTopColor="border-muted"
            w="full"
        >
            {children}
        </Box>
    );
};
```

The `mt="auto"` requires the parent Flex to have `direction="column"`, which the collapsed body already does (see Step 3).

- [ ] **Step 7: Run tests**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: PASS — the new "hides Section labels and Header in collapsed mode" test passes; existing tests still pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx
git commit -m "feat(context-rail): render children in collapsed mode; hide Header/Section chrome"
```

---

## Task 3: IconButton atom

**Files:**
- Create: `src/components/context-rail/atoms.tsx`
- Modify: `src/components/context-rail/context-rail.tsx` (re-export from barrel)
- Test: `src/components/context-rail/context-rail.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add a new `describe` block at the bottom of `context-rail.test.tsx`:

```tsx
describe("ContextRail.IconButton", () => {
    it("renders an outline Button with label text in expanded mode", () => {
        renderWithChakra(
            <ContextRail>
                <ContextRail.IconButton
                    label="Invite user"
                    icon={<span data-testid="ico">＋</span>}
                    onClick={() => {}}
                />
            </ContextRail>,
        );
        // Expanded shows the label text inside the button
        expect(screen.getByRole("button", { name: /Invite user/i })).toBeInTheDocument();
        expect(screen.getByTestId("ico")).toBeInTheDocument();
    });

    it("renders an icon-only IconButton with tooltip in collapsed mode", () => {
        Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
        renderWithChakra(
            <ContextRail>
                <ContextRail.IconButton
                    label="Invite user"
                    icon={<span data-testid="ico">＋</span>}
                    onClick={() => {}}
                />
            </ContextRail>,
        );
        // Collapsed shows the icon but NOT the visible label text
        expect(screen.getByTestId("ico")).toBeInTheDocument();
        expect(screen.queryByText("Invite user")).not.toBeInTheDocument();
        // Button has aria-label (so screen readers + Chakra tooltip both work)
        const btn = screen.getByRole("button", { name: "Invite user" });
        expect(btn).toBeInTheDocument();
    });

    it("calls onClick when clicked", async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        renderWithChakra(
            <ContextRail>
                <ContextRail.IconButton label="Action" icon={<span>X</span>} onClick={onClick} />
            </ContextRail>,
        );
        await user.click(screen.getByRole("button", { name: /Action/i }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it("is tagged with RAIL_ATOM so Section filters it through in collapsed mode", () => {
        // The static `railAtom` field is the sentinel that lets Section
        // recognize this as an atom.
        const type = ContextRail.IconButton as unknown as { railAtom: symbol };
        expect(type.railAtom).toBe(Symbol.for("anker.contextRail.atom"));
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: FAIL — `ContextRail.IconButton` doesn't exist yet.

- [ ] **Step 3: Create atoms.tsx with the IconButton atom**

Create `src/components/context-rail/atoms.tsx`:

```tsx
// src/components/context-rail/atoms.tsx
//
// Compact atoms for `<ContextRail>`. Each atom is mode-aware (reads the
// rail's `collapsed` state from `RailModeContext` via `useContextRailMode`)
// and renders an expanded form (full-width row/button) or a compact
// 32×32 form (icon + tooltip) accordingly. Each atom carries a
// `railAtom` static field so `<ContextRail.Section>` can filter children
// in collapsed mode.
import type React from "react";
import { Button, IconButton } from "../../atoms/button";
import { Tooltip } from "../../primitives/tooltip";
import { Box, Flex } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { RAIL_ATOM, useContextRailMode } from "./context-rail";

type IconButtonTone =
    | "default"
    | "primary"
    | "outline-red"
    | "outline-primary"
    | "ghost";

export interface ContextRailIconButtonProps {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    tone?: IconButtonTone;
}

function buttonVariantFromTone(tone: IconButtonTone): {
    variant: "outline" | "solid" | "ghost";
    colorPalette?: string;
} {
    switch (tone) {
        case "primary":
            return { variant: "solid", colorPalette: "primary" };
        case "outline-red":
            return { variant: "outline", colorPalette: "red" };
        case "outline-primary":
            return { variant: "outline", colorPalette: "primary" };
        case "ghost":
            return { variant: "ghost" };
        default:
            return { variant: "outline" };
    }
}

export function ContextRailIconButton({
    label,
    icon,
    onClick,
    tone = "default",
}: ContextRailIconButtonProps) {
    const { collapsed } = useContextRailMode();
    const { variant, colorPalette } = buttonVariantFromTone(tone);

    if (collapsed) {
        return (
            <Tooltip content={label} positioning={{ placement: "left" }}>
                <IconButton
                    variant={variant}
                    colorPalette={colorPalette}
                    size="sm"
                    aria-label={label}
                    onClick={onClick}
                >
                    {icon}
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <Button
            variant={variant}
            colorPalette={colorPalette}
            size="sm"
            w="full"
            onClick={onClick}
        >
            {icon}
            {label}
        </Button>
    );
}
ContextRailIconButton.displayName = "ContextRail.IconButton";
// Tag this component as a rail atom so `<ContextRail.Section>` keeps it in collapsed mode.
(ContextRailIconButton as unknown as { railAtom: symbol }).railAtom = RAIL_ATOM;
```

A note on `Tooltip` import: if the anker primitives barrel doesn't export `Tooltip`, find the right import path (likely `../../primitives/tooltip` based on directory pattern). If it's missing entirely, fall back to Chakra's `Tooltip` directly via the same import the rest of the codebase uses for tooltips — grep `import.*Tooltip` in `src/` to find the convention.

- [ ] **Step 4: Re-export the atom from the ContextRail barrel**

In `src/components/context-rail/context-rail.tsx`, find the existing `Object.assign(ContextRailRoot, {...})` at the bottom of the file. Add the new atom:

```tsx
import { ContextRailIconButton } from "./atoms";

// ... existing component definitions ...

export const ContextRail = Object.assign(ContextRailRoot, {
    Header: ContextRailHeader,
    Section: ContextRailSection,
    Footer: ContextRailFooter,
    IconButton: ContextRailIconButton,
});
```

The import goes near the top of the file with the other imports.

- [ ] **Step 5: Run tests**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: PASS — all four new IconButton tests pass; all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/context-rail/atoms.tsx src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx
git commit -m "feat(context-rail): add IconButton atom"
```

---

## Task 4: ValueTile atom

**Files:**
- Modify: `src/components/context-rail/atoms.tsx`
- Modify: `src/components/context-rail/context-rail.tsx` (barrel)
- Test: `src/components/context-rail/context-rail.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
describe("ContextRail.ValueTile", () => {
    it("renders the value and label in expanded mode", () => {
        renderWithChakra(
            <ContextRail>
                <ContextRail.ValueTile value={100} label="Total users" />
            </ContextRail>,
        );
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("Total users")).toBeInTheDocument();
    });

    it("renders a 32×32 tile with tooltip in collapsed mode", () => {
        Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
        renderWithChakra(
            <ContextRail>
                <ContextRail.ValueTile value={100} label="Total users" />
            </ContextRail>,
        );
        // Tile shows the value
        expect(screen.getByText("100")).toBeInTheDocument();
        // Label text is NOT visible (only in tooltip)
        expect(screen.queryByText("Total users")).not.toBeInTheDocument();
    });

    it("is hidden in collapsed mode when value is zero", () => {
        Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
        renderWithChakra(
            <ContextRail>
                <ContextRail.ValueTile value={0} label="Suspended" />
            </ContextRail>,
        );
        expect(screen.queryByText("0")).not.toBeInTheDocument();
        expect(screen.queryByText("Suspended")).not.toBeInTheDocument();
    });

    it("renders zero in collapsed mode when keepWhenEmpty is set", () => {
        Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
        renderWithChakra(
            <ContextRail>
                <ContextRail.ValueTile value={0} label="Suspended" keepWhenEmpty />
            </ContextRail>,
        );
        expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("ValueTile is tagged with RAIL_ATOM", () => {
        const type = ContextRail.ValueTile as unknown as { railAtom: symbol };
        expect(type.railAtom).toBe(Symbol.for("anker.contextRail.atom"));
    });
});
```

- [ ] **Step 2: Verify failing**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: FAIL — `ContextRail.ValueTile` doesn't exist.

- [ ] **Step 3: Add the ValueTile atom**

In `src/components/context-rail/atoms.tsx`, append:

```tsx
export interface ContextRailValueTileProps {
    value: number | string;
    label: string;
    muted?: boolean;
    keepWhenEmpty?: boolean;
}

function isEmpty(value: number | string): boolean {
    if (value === 0) return true;
    if (value === "0" || value === "") return true;
    return false;
}

export function ContextRailValueTile({
    value,
    label,
    muted,
    keepWhenEmpty,
}: ContextRailValueTileProps) {
    const { collapsed } = useContextRailMode();
    const hideWhenEmpty = collapsed && isEmpty(value) && !keepWhenEmpty;

    if (hideWhenEmpty) return null;

    if (collapsed) {
        return (
            <Tooltip content={label} positioning={{ placement: "left" }}>
                <Box
                    w="8"
                    h="8"
                    borderRadius="md"
                    bg="bg-subtle"
                    borderWidth="1px"
                    borderColor="border"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                    color={muted ? "muted" : "default"}
                    aria-label={`${label}: ${value}`}
                >
                    {value}
                </Box>
            </Tooltip>
        );
    }

    return (
        <Box bg="bg-subtle" borderRadius="md" p="2" minW="0" flex="1">
            <Text fontSize="xs" color="muted" mb="1">
                {label}
            </Text>
            <Text fontSize="lg" fontWeight="semibold" color={muted ? "muted" : "default"}>
                {value}
            </Text>
        </Box>
    );
}
ContextRailValueTile.displayName = "ContextRail.ValueTile";
(ContextRailValueTile as unknown as { railAtom: symbol }).railAtom = RAIL_ATOM;
```

- [ ] **Step 4: Re-export from the barrel**

In `src/components/context-rail/context-rail.tsx`, update the import and the `Object.assign`:

```tsx
import { ContextRailIconButton, ContextRailValueTile } from "./atoms";
// ...
export const ContextRail = Object.assign(ContextRailRoot, {
    Header: ContextRailHeader,
    Section: ContextRailSection,
    Footer: ContextRailFooter,
    IconButton: ContextRailIconButton,
    ValueTile: ContextRailValueTile,
});
```

- [ ] **Step 5: Run tests**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: PASS for all new ValueTile tests + existing ones.

- [ ] **Step 6: Commit**

```bash
git add src/components/context-rail/atoms.tsx src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx
git commit -m "feat(context-rail): add ValueTile atom"
```

---

## Task 5: StatusIcon atom

**Files:**
- Modify: `src/components/context-rail/atoms.tsx`
- Modify: `src/components/context-rail/context-rail.tsx` (barrel)
- Test: `src/components/context-rail/context-rail.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
describe("ContextRail.StatusIcon", () => {
    it("renders icon + label in expanded mode", () => {
        renderWithChakra(
            <ContextRail>
                <ContextRail.StatusIcon
                    tone="green"
                    icon={<span data-testid="ico">🛡</span>}
                    label="MFA: Active"
                />
            </ContextRail>,
        );
        expect(screen.getByTestId("ico")).toBeInTheDocument();
        expect(screen.getByText("MFA: Active")).toBeInTheDocument();
    });

    it("renders 32×32 tinted circle with tooltip in collapsed mode", () => {
        Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
        renderWithChakra(
            <ContextRail>
                <ContextRail.StatusIcon
                    tone="red"
                    icon={<span data-testid="ico">🛡</span>}
                    label="MFA: Off"
                />
            </ContextRail>,
        );
        expect(screen.getByTestId("ico")).toBeInTheDocument();
        // Label is NOT visible (in tooltip only)
        expect(screen.queryByText("MFA: Off")).not.toBeInTheDocument();
    });

    it("StatusIcon is tagged with RAIL_ATOM", () => {
        const type = ContextRail.StatusIcon as unknown as { railAtom: symbol };
        expect(type.railAtom).toBe(Symbol.for("anker.contextRail.atom"));
    });
});
```

- [ ] **Step 2: Verify failing**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

- [ ] **Step 3: Add the StatusIcon atom**

In `src/components/context-rail/atoms.tsx`, append:

```tsx
type StatusTone = "green" | "amber" | "red" | "gray";

export interface ContextRailStatusIconProps {
    icon: React.ReactNode;
    label: string;
    tone: StatusTone;
}

const STATUS_TINTS: Record<StatusTone, { bg: string; color: string }> = {
    green: { bg: "green.50", color: "green.700" },
    amber: { bg: "yellow.50", color: "yellow.700" },
    red: { bg: "red.50", color: "red.700" },
    gray: { bg: "gray.100", color: "gray.700" },
};

export function ContextRailStatusIcon({
    icon,
    label,
    tone,
}: ContextRailStatusIconProps) {
    const { collapsed } = useContextRailMode();
    const tint = STATUS_TINTS[tone];

    if (collapsed) {
        return (
            <Tooltip content={label} positioning={{ placement: "left" }}>
                <Flex
                    w="8"
                    h="8"
                    borderRadius="full"
                    bg={tint.bg}
                    color={tint.color}
                    align="center"
                    justify="center"
                    aria-label={label}
                >
                    {icon}
                </Flex>
            </Tooltip>
        );
    }

    return (
        <Flex align="center" gap="2" py="1">
            <Flex
                w="6"
                h="6"
                borderRadius="full"
                bg={tint.bg}
                color={tint.color}
                align="center"
                justify="center"
                flexShrink={0}
            >
                {icon}
            </Flex>
            <Text fontSize="xs" color="muted">
                {label}
            </Text>
        </Flex>
    );
}
ContextRailStatusIcon.displayName = "ContextRail.StatusIcon";
(ContextRailStatusIcon as unknown as { railAtom: symbol }).railAtom = RAIL_ATOM;
```

- [ ] **Step 4: Re-export from barrel**

```tsx
import {
    ContextRailIconButton,
    ContextRailStatusIcon,
    ContextRailValueTile,
} from "./atoms";
// ...
export const ContextRail = Object.assign(ContextRailRoot, {
    Header: ContextRailHeader,
    Section: ContextRailSection,
    Footer: ContextRailFooter,
    IconButton: ContextRailIconButton,
    StatusIcon: ContextRailStatusIcon,
    ValueTile: ContextRailValueTile,
});
```

- [ ] **Step 5: Run tests**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/context-rail/atoms.tsx src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx
git commit -m "feat(context-rail): add StatusIcon atom"
```

---

## Task 6: Avatar atom

**Files:**
- Modify: `src/components/context-rail/atoms.tsx`
- Modify: `src/components/context-rail/context-rail.tsx` (barrel)
- Test: `src/components/context-rail/context-rail.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
describe("ContextRail.Avatar", () => {
    it("renders an avatar with label in expanded mode", () => {
        renderWithChakra(
            <ContextRail>
                <ContextRail.Avatar initials="JS" label="Jana Schmid · jana@knk.de" />
            </ContextRail>,
        );
        expect(screen.getByText("JS")).toBeInTheDocument();
        expect(screen.getByText(/Jana Schmid/)).toBeInTheDocument();
    });

    it("renders a 32×32 avatar with tooltip in collapsed mode", () => {
        Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
        renderWithChakra(
            <ContextRail>
                <ContextRail.Avatar initials="JS" label="Jana Schmid · jana@knk.de" />
            </ContextRail>,
        );
        expect(screen.getByText("JS")).toBeInTheDocument();
        expect(screen.queryByText(/Jana Schmid/)).not.toBeInTheDocument();
    });

    it("Avatar is tagged with RAIL_ATOM", () => {
        const type = ContextRail.Avatar as unknown as { railAtom: symbol };
        expect(type.railAtom).toBe(Symbol.for("anker.contextRail.atom"));
    });
});
```

- [ ] **Step 2: Verify failing**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

- [ ] **Step 3: Add the Avatar atom**

Append to `atoms.tsx`:

```tsx
export interface ContextRailAvatarProps {
    initials: string;
    label: string;
    src?: string;
    onClick?: () => void;
}

export function ContextRailAvatar({
    initials,
    label,
    src,
    onClick,
}: ContextRailAvatarProps) {
    const { collapsed } = useContextRailMode();

    const avatarBox = (
        <Flex
            w={collapsed ? "8" : "10"}
            h={collapsed ? "8" : "10"}
            borderRadius="full"
            bg="bg-emphasis"
            color="white"
            align="center"
            justify="center"
            fontWeight="bold"
            fontSize={collapsed ? "xs" : "sm"}
            flexShrink={0}
            cursor={onClick ? "pointer" : "default"}
            onClick={onClick}
            backgroundImage={src ? `url(${src})` : undefined}
            backgroundSize="cover"
            backgroundPosition="center"
            aria-label={label}
        >
            {!src && initials}
        </Flex>
    );

    if (collapsed) {
        return (
            <Tooltip content={label} positioning={{ placement: "left" }}>
                {avatarBox}
            </Tooltip>
        );
    }

    return (
        <Flex align="center" gap="3" py="1">
            {avatarBox}
            <Text fontSize="xs" color="muted" truncate>
                {label}
            </Text>
        </Flex>
    );
}
ContextRailAvatar.displayName = "ContextRail.Avatar";
(ContextRailAvatar as unknown as { railAtom: symbol }).railAtom = RAIL_ATOM;
```

- [ ] **Step 4: Re-export from barrel**

```tsx
import {
    ContextRailAvatar,
    ContextRailIconButton,
    ContextRailStatusIcon,
    ContextRailValueTile,
} from "./atoms";
// ...
export const ContextRail = Object.assign(ContextRailRoot, {
    Header: ContextRailHeader,
    Section: ContextRailSection,
    Footer: ContextRailFooter,
    Avatar: ContextRailAvatar,
    IconButton: ContextRailIconButton,
    StatusIcon: ContextRailStatusIcon,
    ValueTile: ContextRailValueTile,
});
```

- [ ] **Step 5: Run tests**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/context-rail/atoms.tsx src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx
git commit -m "feat(context-rail): add Avatar atom"
```

---

## Task 7: Divider atom

**Files:**
- Modify: `src/components/context-rail/atoms.tsx`
- Modify: `src/components/context-rail/context-rail.tsx` (barrel)
- Test: `src/components/context-rail/context-rail.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
describe("ContextRail.Divider", () => {
    it("renders a horizontal rule with margins in expanded mode", () => {
        renderWithChakra(
            <ContextRail>
                <ContextRail.Divider />
            </ContextRail>,
        );
        const div = screen.getByTestId("context-rail-divider");
        expect(div).toBeInTheDocument();
    });

    it("renders a narrow centered line in collapsed mode", () => {
        Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
        renderWithChakra(
            <ContextRail>
                <ContextRail.Divider />
            </ContextRail>,
        );
        expect(screen.getByTestId("context-rail-divider")).toBeInTheDocument();
    });

    it("Divider is tagged with RAIL_ATOM", () => {
        const type = ContextRail.Divider as unknown as { railAtom: symbol };
        expect(type.railAtom).toBe(Symbol.for("anker.contextRail.atom"));
    });
});
```

- [ ] **Step 2: Verify failing**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

- [ ] **Step 3: Add the Divider atom**

Append to `atoms.tsx`:

```tsx
export function ContextRailDivider() {
    const { collapsed } = useContextRailMode();
    if (collapsed) {
        return (
            <Box
                data-testid="context-rail-divider"
                w="5"
                h="1px"
                bg="border"
                my="1"
            />
        );
    }
    return (
        <Box
            data-testid="context-rail-divider"
            w="full"
            h="1px"
            bg="border"
            my="3"
        />
    );
}
ContextRailDivider.displayName = "ContextRail.Divider";
(ContextRailDivider as unknown as { railAtom: symbol }).railAtom = RAIL_ATOM;
```

- [ ] **Step 4: Re-export from barrel**

```tsx
import {
    ContextRailAvatar,
    ContextRailDivider,
    ContextRailIconButton,
    ContextRailStatusIcon,
    ContextRailValueTile,
} from "./atoms";
// ...
export const ContextRail = Object.assign(ContextRailRoot, {
    Header: ContextRailHeader,
    Section: ContextRailSection,
    Footer: ContextRailFooter,
    Avatar: ContextRailAvatar,
    Divider: ContextRailDivider,
    IconButton: ContextRailIconButton,
    StatusIcon: ContextRailStatusIcon,
    ValueTile: ContextRailValueTile,
});
```

- [ ] **Step 5: Run tests**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/context-rail/atoms.tsx src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx
git commit -m "feat(context-rail): add Divider atom"
```

---

## Task 8: Section + atoms integration test

**Files:**
- Test: `src/components/context-rail/context-rail.test.tsx`

- [ ] **Step 1: Write the integration test**

Add inside `describe("ContextRail", …)`:

```tsx
it("section in collapsed mode keeps atoms and hides non-atom children", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    renderWithChakra(
        <ContextRail>
            <ContextRail.Section id="s1" label="Users">
                <ContextRail.ValueTile value={42} label="Total: 42" />
                <div data-testid="free-form">free-form content</div>
                <ContextRail.IconButton
                    label="Invite"
                    icon={<span>＋</span>}
                    onClick={() => {}}
                />
            </ContextRail.Section>
        </ContextRail>,
    );
    // Atoms render
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
    // Non-atom hidden
    expect(screen.queryByTestId("free-form")).not.toBeInTheDocument();
    // Section label hidden
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
});

it("full rail with header, section atoms, and footer renders in collapsed mode", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    renderWithChakra(
        <ContextRail>
            <ContextRail.Header title="Overview" />
            <ContextRail.ValueTile value={100} label="Total" />
            <ContextRail.Divider />
            <ContextRail.StatusIcon tone="green" icon={<span>🛡</span>} label="MFA" />
            <ContextRail.Footer>
                <ContextRail.IconButton label="Open" icon={<span>→</span>} onClick={() => {}} tone="primary" />
            </ContextRail.Footer>
        </ContextRail>,
    );
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByTestId("context-rail-divider")).toBeInTheDocument();
    expect(screen.getByText("🛡")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    // Header title hidden
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests**

```
pnpm vitest run src/components/context-rail/context-rail.test.tsx
```

Expected: PASS for both new integration tests.

- [ ] **Step 3: Commit**

```bash
git add src/components/context-rail/context-rail.test.tsx
git commit -m "test(context-rail): integration tests for atoms in Section + Footer"
```

---

## Task 9: Storybook stories

**Files:**
- Modify: `src/components/context-rail/context-rail.stories.tsx`

- [ ] **Step 1: Read the file**

Read `src/components/context-rail/context-rail.stories.tsx` to learn the existing meta + story convention (StoryObj, `args`-style, or template-based).

- [ ] **Step 2: Add stories**

Append a new section to the file with these stories, adapting the convention you observed:

```tsx
export const AtomsExpanded: Story = {
    render: () => (
        <ContextRail>
            <ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
            <ContextRail.Section id="users" label="Users">
                <ContextRail.ValueTile value={100} label="Total" />
                <ContextRail.ValueTile value={100} label="Active" muted />
            </ContextRail.Section>
            <ContextRail.StatusIcon tone="amber" icon={<Shield size={14} />} label="2FA: 0 of 100 enabled" />
            <ContextRail.Divider />
            <ContextRail.Section id="actions" label="Quick actions">
                <ContextRail.IconButton label="Invite user" icon={<UserPlus size={14} />} onClick={() => {}} />
                <ContextRail.IconButton label="Import CSV" icon={<Upload size={14} />} onClick={() => {}} />
                <ContextRail.IconButton label="Export all" icon={<Download size={14} />} onClick={() => {}} />
            </ContextRail.Section>
        </ContextRail>
    ),
};

export const AtomsCollapsed: Story = {
    render: () => {
        // Force collapsed start state by setting an explicit storage key
        // and writing "true" to localStorage before mount. Cleaner: just
        // start at narrow viewport (the rail collapses below 1440px).
        return (
            <div style={{ width: 1200 }}>
                <ContextRail storageKey="story-collapsed-rail">
                    <ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
                    <ContextRail.ValueTile value={100} label="Total users" />
                    <ContextRail.ValueTile value={100} label="Active users" muted />
                    <ContextRail.Divider />
                    <ContextRail.StatusIcon tone="amber" icon={<Shield size={14} />} label="2FA: 0 of 100 enabled" />
                    <ContextRail.Divider />
                    <ContextRail.IconButton label="Invite user" icon={<UserPlus size={14} />} onClick={() => {}} />
                    <ContextRail.IconButton label="Import CSV" icon={<Upload size={14} />} onClick={() => {}} />
                    <ContextRail.IconButton label="Export all" icon={<Download size={14} />} onClick={() => {}} />
                </ContextRail>
            </div>
        );
    },
};

export const AvatarAndFooter: Story = {
    render: () => (
        <ContextRail>
            <ContextRail.Header eyebrow="USER" title="Jana Schmid" />
            <ContextRail.Avatar initials="JS" label="Jana Schmid · jana@knk.de" />
            <ContextRail.StatusIcon tone="green" icon={<Shield size={14} />} label="2FA: Active" />
            <ContextRail.ValueTile value={3} label="Sessions" />
            <ContextRail.Footer>
                <ContextRail.IconButton label="Open detail" icon={<ArrowRight size={14} />} onClick={() => {}} tone="primary" />
                <ContextRail.IconButton label="Close preview" icon={<X size={14} />} onClick={() => {}} tone="ghost" />
            </ContextRail.Footer>
        </ContextRail>
    ),
};
```

Adjust imports — add lucide-react icons used in the stories (`Shield`, `UserPlus`, `Upload`, `Download`, `ArrowRight`, `X`). Use whatever local naming convention you observed in step 1.

- [ ] **Step 3: Verify typecheck**

```
pnpm typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/context-rail/context-rail.stories.tsx
git commit -m "docs(stories): add atom stories for ContextRail"
```

---

## Task 10: Documentation updates

**Files:**
- Modify: `docs/page-patterns.md`
- Modify: `CLAUDE-ANKER.md`

- [ ] **Step 1: Update `docs/page-patterns.md` §ContextRail patterns**

Find the §4 "ContextRail patterns" section. Add a new H3 subsection "Compact atoms" between the existing "Collapsed state" subsection and the "Rail Root contract" subsection. Content:

```markdown
### Compact atoms

The rail's 44px collapsed column surfaces useful content via five
mode-aware atom subcomponents. Each renders an expanded form when the
rail is open and a compact 32×32 form (with a left-placed tooltip) when
collapsed.

| Atom | Purpose | Tones |
|------|---------|-------|
| `<ContextRail.IconButton>` | Clickable action with tooltip. | `default · primary · outline-red · outline-primary · ghost` |
| `<ContextRail.ValueTile>` | A number-with-tooltip. Hidden in collapsed mode when value is zero/empty unless `keepWhenEmpty`. | `default · muted` |
| `<ContextRail.StatusIcon>` | Semantic state indicator. | `green · amber · red · gray` |
| `<ContextRail.Avatar>` | Compact entity identity. | — |
| `<ContextRail.Divider>` | Visual grouping. Renders narrow in collapsed mode. | — |

Place atoms inside `<ContextRail.Section>` for expanded-mode grouping with
a labeled header, or at the top level of `<ContextRail>` (siblings of
`<Section>`) for simpler rails. In collapsed mode, section headers and
non-atom JSX inside sections are hidden — only atom-tagged children render.

**Tone guidance for StatusIcon:**
- `green` — healthy, no action needed.
- `amber` — low adoption or informational nudge.
- `red` — action required, broken state.
- `gray` — neutral / informational (rarely needed; ValueTile usually fits better).

**Example:**

\`\`\`tsx
<ContextRail storageKey="users-rail">
  <ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
  <ContextRail.Section id="users" label="Users">
    <ContextRail.ValueTile value={total} label="Total users" />
    <ContextRail.ValueTile value={active} label="Active users" muted />
  </ContextRail.Section>
  <ContextRail.StatusIcon tone="amber" icon={<Shield />} label="2FA: 0 of 100 enabled" />
  <ContextRail.Divider />
  <ContextRail.IconButton label="Invite user" icon={<UserPlus />} onClick={…} />
</ContextRail>
\`\`\`
```

- [ ] **Step 2: Update §"Collapsed state" in `docs/page-patterns.md`**

The existing "Collapsed state" subsection (added by the rail-position work) says only a 44px column with the toggle remains. Update it to reference the atoms:

```markdown
### Collapsed state

When the rail is collapsed, the column narrows to 44px. The floating
collapse toggle remains anchored at the leading edge (see the
"Rail Root contract" subsection). Atom subcomponents — `IconButton`,
`ValueTile`, `StatusIcon`, `Avatar`, `Divider` — render in their compact
form to surface useful content; see "Compact atoms" above. Section
headers and non-atom JSX inside `<ContextRail.Section>` are hidden in
collapsed mode.
```

- [ ] **Step 3: Update `CLAUDE-ANKER.md`**

Find the `<ContextRail>` table row. Replace with:

```markdown
| `<ContextRail>` | Right-rail container with sticky positioning, collapse toggle on the leading edge, and five mode-aware atom subcomponents for compact rendering at 44px: `IconButton`, `ValueTile`, `StatusIcon`, `Avatar`, `Divider`. Sections (`<ContextRail.Section>`) keep their expanded-mode chrome; in collapsed mode, only atom-tagged children render. See `docs/page-patterns.md` §ContextRail patterns. |
```

- [ ] **Step 4: Commit**

```bash
git add docs/page-patterns.md CLAUDE-ANKER.md
git commit -m "docs(page-patterns): document ContextRail compact atoms"
```

---

## Task 11: Full verification + PR + release v2.3.0

**Files:** none modified — verification only.

- [ ] **Step 1: Run the full test suite**

```
pnpm test
```

Expected: all tests pass.

- [ ] **Step 2: Run typecheck**

```
pnpm typecheck
```

Expected: clean.

- [ ] **Step 3: Run lint**

```
pnpm lint
```

Expected: no new errors. Pre-existing warnings are acceptable. If biome flags format drift on touched files, run `npx biome format --write` on those files and commit the formatting:

```bash
npx biome format --write src/components/context-rail/atoms.tsx src/components/context-rail/context-rail.tsx src/components/context-rail/context-rail.test.tsx src/components/context-rail/context-rail.stories.tsx
git add -u
git commit -m "style(context-rail): biome formatting"
```

- [ ] **Step 4: Build**

```
pnpm build
```

Expected: build succeeds. Verify new atoms appear in `dist/components/index.d.ts`:

```bash
grep -E "ContextRailIconButton|ContextRailValueTile|ContextRailStatusIcon|ContextRailAvatar|ContextRailDivider" dist/components/index.d.ts | head
```

- [ ] **Step 5: Push the branch**

```bash
git push -u origin feature/collapsed-rail-atoms
```

- [ ] **Step 6: Open the PR**

```bash
gh pr create --title "feat: compact atoms for collapsed ContextRail" --body "$(cat <<'EOF'
## Summary

- Add five mode-aware atoms to \`<ContextRail>\`: \`IconButton\`, \`ValueTile\`, \`StatusIcon\`, \`Avatar\`, \`Divider\`.
- Each atom renders an expanded form when the rail is open and a compact 32×32 form (with left-placed tooltip) when collapsed.
- \`<ContextRail.Section>\` filters children in collapsed mode: only atom-tagged children render; section header and non-atom JSX are hidden.
- \`<ContextRail.Footer>\` pins to the bottom in both modes.
- Docs and stories updated.

Spec: \`docs/superpowers/specs/2026-05-13-collapsed-rail-atoms-design.md\`
Plan: \`docs/superpowers/plans/2026-05-13-collapsed-rail-atoms.md\`

## Test plan

- [x] \`pnpm test\` green (all atom + integration tests)
- [x] \`pnpm typecheck\` clean
- [x] \`pnpm build\` succeeds
- [ ] CI green
- [ ] Cut v2.3.0 tag after merge
- [ ] Bump anker in odon, migrate the four rails, ship
EOF
)"
```

- [ ] **Step 7: Wait for CI, merge, sync main**

```bash
gh pr checks --watch
gh pr merge --squash --delete-branch
git checkout main && git fetch && git reset --hard origin/main
```

- [ ] **Step 8: Cut release v2.3.0**

```bash
git checkout -b release/v2.3.0
npm version 2.3.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): v2.3.0"
git push -u origin release/v2.3.0
gh pr create --title "chore(release): v2.3.0" --body "Release v2.3.0 for the collapsed ContextRail atoms feature."
gh pr checks --watch
gh pr merge --squash --delete-branch
git checkout main && git fetch && git reset --hard origin/main
git tag v2.3.0 && git push origin v2.3.0
```

Wait for the publish workflow:

```bash
sleep 10
PUBLISH_ID=$(gh run list --limit 5 2>&1 | awk '/Publish.*v2.3.0/{print $(NF-2); exit}')
gh run watch $PUBLISH_ID --exit-status
npm view @knkcs/anker version   # should print 2.3.0
```

---

## Task 12: Odon — migrate `TenantOverviewRail`

**Repo:** `/Users/jeskoiwanovski/repo/odon`

**Files:**
- Modify: `web/src/features/admin/users/rail/TenantOverviewRail.tsx`

- [ ] **Step 1: Create a feature branch**

```bash
cd /Users/jeskoiwanovski/repo/odon
git checkout main && git pull --ff-only
git checkout -b feature/anker-2.3-rail-atoms
```

- [ ] **Step 2: Bump anker to ^2.3.0**

```bash
sed -i '' 's|"@knkcs/anker": "[^"]*"|"@knkcs/anker": "^2.3.0"|g' \
  package.json web/package.json packages/odon-ui/package.json
```

Restore the peerDependencies entry in `packages/odon-ui/package.json` to `"*"` (the sed overwrites it). Use the Edit tool: open `packages/odon-ui/package.json` and ensure `peerDependencies."@knkcs/anker"` is `"*"`, NOT `"^2.3.0"`.

Clean install:

```bash
rm -rf node_modules web/node_modules packages/odon-ui/node_modules package-lock.json
npm install
grep '"version"' node_modules/@knkcs/anker/package.json
```

Expected: `"version": "2.3.0"`.

- [ ] **Step 3: Rewrite TenantOverviewRail**

Replace the contents of `web/src/features/admin/users/rail/TenantOverviewRail.tsx` with:

```tsx
import { ContextRail } from "@knkcs/anker/components";
import { Box, Stack, Text } from "@knkcs/anker/primitives";
import { Download, Mail, ShieldCheck, Upload, UserPlus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@knkcs/anker/atoms";
import type { AdminUser } from "@/gen/odon/v1/admin_pb";

export interface TenantOverviewRailProps {
    users: AdminUser[];
}

export function TenantOverviewRail({ users }: TenantOverviewRailProps) {
    const { t } = useTranslation();

    const total = users.length;
    const active = users.filter((u) => u.active && u.emailVerified).length;
    const invited = users.filter((u) => u.active && !u.emailVerified).length;
    const suspended = users.filter((u) => !u.active).length;
    const mfaEnabled = users.filter((u) => u.mfaDeviceCount > 0).length;

    const mfaTone: "green" | "amber" | "red" | "gray" =
        total === 0
            ? "gray"
            : mfaEnabled / total >= 0.8
                ? "green"
                : mfaEnabled / total >= 0.5
                    ? "amber"
                    : "red";

    const openInvitations = users
        .filter((u) => u.active && !u.emailVerified)
        .slice(0, 5);

    return (
        <ContextRail storageKey="rail-tenant-overview">
            <ContextRail.Header
                eyebrow={t("adminUsersRail.empty.header")}
                title={t("adminUsersRail.empty.title")}
            />

            <ContextRail.Section id="counts" icon={<Users size={14} />} label={t("adminUsersRail.empty.counts.label")}>
                <Stack direction="row" gap="2" wrap="wrap">
                    <ContextRail.ValueTile value={total} label={t("adminUsersRail.empty.counts.total")} />
                    <ContextRail.ValueTile value={active} label={t("adminUsersRail.empty.counts.active")} muted />
                </Stack>
                <Stack direction="row" gap="2" wrap="wrap" mt="2">
                    <ContextRail.ValueTile value={invited} label={t("adminUsersRail.empty.counts.invited")} muted />
                    <ContextRail.ValueTile value={suspended} label={t("adminUsersRail.empty.counts.suspended")} muted />
                </Stack>
            </ContextRail.Section>

            {/* 2FA — atom (visible in both modes) + expanded-only progress bar via a non-atom child of the Section */}
            <ContextRail.StatusIcon
                tone={mfaTone}
                icon={<ShieldCheck size={14} />}
                label={t("adminUsersRail.empty.twoFactor.summary", { enabled: mfaEnabled, total })}
            />

            {/* Pending invitations count: tile (visible in both modes; hidden when 0) */}
            <ContextRail.ValueTile
                value={openInvitations.length}
                label={t("adminUsersRail.empty.invitations.label")}
                muted
            />

            <ContextRail.Section id="invitations" icon={<Mail size={14} />} label={t("adminUsersRail.empty.invitations.label")}>
                {openInvitations.length === 0 ? (
                    <Text fontSize="xs" color="muted">
                        {t("adminUsersRail.empty.invitations.empty")}
                    </Text>
                ) : (
                    <Stack gap="2">
                        {openInvitations.map((user) => (
                            <Box key={user.id}>
                                <Text fontSize="xs" color="default" truncate>{user.email}</Text>
                                <Button variant="outline" size="xs">
                                    {t("adminUsersRail.empty.invitations.resend")}
                                </Button>
                            </Box>
                        ))}
                    </Stack>
                )}
            </ContextRail.Section>

            <ContextRail.IconButton label={t("adminUsersRail.empty.actions.invite")} icon={<UserPlus size={14} />} onClick={() => {/* TODO wire */}} />
            <ContextRail.IconButton label={t("adminUsersRail.empty.actions.import")} icon={<Upload size={14} />} onClick={() => {/* TODO wire */}} />
            <ContextRail.IconButton label={t("adminUsersRail.empty.actions.export")} icon={<Download size={14} />} onClick={() => {/* TODO wire */}} />
        </ContextRail>
    );
}
```

The action handlers in this rail are currently no-ops in the source (the buttons don't have `onClick` in the original file). Keep them as no-ops here too — wiring belongs to a separate change.

- [ ] **Step 4: Run frontend tests + build**

```
npm run --workspace=web test
npm run --workspace=web build
```

Expected: build clean. Tests pass (the pre-existing `SignedOutConfirmPage` flake is unrelated).

- [ ] **Step 5: Commit**

```bash
git add web/src/features/admin/users/rail/TenantOverviewRail.tsx package.json web/package.json packages/odon-ui/package.json package-lock.json
git commit -m "refactor(web): TenantOverviewRail uses anker 2.3 rail atoms"
```

---

## Task 13: Odon — migrate `BulkSelectionRail`

**Files:**
- Modify: `web/src/features/admin/users/rail/BulkSelectionRail.tsx`

- [ ] **Step 1: Rewrite the rail**

Replace `web/src/features/admin/users/rail/BulkSelectionRail.tsx` contents with:

```tsx
import { ContextRail } from "@knkcs/anker/components";
import { ShieldOff, UserCheck, UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AdminUser } from "@/gen/odon/v1/admin_pb";

export interface BulkSelectionRailProps {
    users: AdminUser[];
    clearSelection: () => void;
    onReload: () => void;
}

export function BulkSelectionRail({
    users,
    clearSelection: _clearSelection,
    onReload: _onReload,
}: BulkSelectionRailProps) {
    const { t } = useTranslation();

    const count = users.length;
    const active = users.filter((u) => u.active && u.emailVerified).length;
    const invited = users.filter((u) => u.active && !u.emailVerified).length;
    const suspended = users.filter((u) => !u.active).length;

    return (
        <ContextRail storageKey="rail-bulk-selection">
            <ContextRail.Header
                eyebrow={t("adminUsersRail.multi.eyebrow", { count })}
                title={t("adminUsersRail.multi.title")}
            />

            {/* Selection count tile (always visible at top of collapsed rail) */}
            <ContextRail.ValueTile value={count} label={t("adminUsersRail.multi.eyebrow", { count })} keepWhenEmpty />

            <ContextRail.Divider />

            <ContextRail.ValueTile value={active} label={t("adminUsersRail.empty.counts.active")} muted />
            <ContextRail.ValueTile value={invited} label={t("adminUsersRail.empty.counts.invited")} muted />
            <ContextRail.ValueTile value={suspended} label={t("adminUsersRail.empty.counts.suspended")} muted />

            <ContextRail.Divider />

            <ContextRail.IconButton label={t("adminUsersRail.multi.actions.deactivate")} icon={<UserMinus size={14} />} onClick={() => {/* TODO wire */}} />
            <ContextRail.IconButton label={t("adminUsersRail.multi.actions.reactivate")} icon={<UserCheck size={14} />} onClick={() => {/* TODO wire */}} />
            <ContextRail.IconButton label={t("adminUsersRail.multi.actions.resetMfa")} icon={<ShieldOff size={14} />} onClick={() => {/* TODO wire */}} />
        </ContextRail>
    );
}
```

The original `BulkSelectionRail` doesn't wire the bulk-action `onClick` handlers either — keep them no-op.

- [ ] **Step 2: Run tests + build**

```
npm run --workspace=web test
npm run --workspace=web build
```

- [ ] **Step 3: Commit**

```bash
git add web/src/features/admin/users/rail/BulkSelectionRail.tsx
git commit -m "refactor(web): BulkSelectionRail uses anker 2.3 rail atoms"
```

---

## Task 14: Odon — migrate `UserPreviewRail`

**Files:**
- Modify: `web/src/features/admin/users/rail/UserPreviewRail.tsx`

- [ ] **Step 1: Rewrite the rail**

Replace `web/src/features/admin/users/rail/UserPreviewRail.tsx` contents with:

```tsx
import { ContextRail } from "@knkcs/anker/components";
import { ArrowRight, Copy, Shield, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { AdminUser } from "@/gen/odon/v1/admin_pb";

export interface UserPreviewRailProps {
    user: AdminUser;
    onClose: () => void;
    onReload: () => void;
}

function initialsFor(user: AdminUser): string {
    const display = user.displayName || user.email || "?";
    const parts = display.split(/\s+|@|\./).filter(Boolean);
    return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export function UserPreviewRail({ user, onClose, onReload: _onReload }: UserPreviewRailProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const mfaActive = user.mfaDeviceCount > 0;
    const display = user.displayName || user.email;

    return (
        <ContextRail storageKey="rail-user-preview">
            <ContextRail.Header
                eyebrow={t("adminUsersRail.single.eyebrow")}
                title={display}
            />

            <ContextRail.Avatar
                initials={initialsFor(user)}
                label={`${display} · ${user.email}`}
            />

            <ContextRail.StatusIcon
                tone={mfaActive ? "green" : "red"}
                icon={<Shield size={14} />}
                label={
                    mfaActive
                        ? t("userDetail.rail.mfaActive")
                        : t("userDetail.rail.mfaInactive")
                }
            />

            <ContextRail.ValueTile
                value={user.sessionCount}
                label={t("adminUsersRail.single.details.sessions")}
                muted
            />

            <ContextRail.Divider />

            <ContextRail.IconButton
                label={t("adminUsersRail.single.actions.copyId")}
                icon={<Copy size={14} />}
                onClick={() => navigator.clipboard.writeText(user.id)}
            />

            <ContextRail.Footer>
                <ContextRail.IconButton
                    label={t("adminUsersRail.single.footer.openDetail")}
                    icon={<ArrowRight size={14} />}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    tone="primary"
                />
                <ContextRail.IconButton
                    label={t("adminUsersRail.single.footer.close")}
                    icon={<X size={14} />}
                    onClick={onClose}
                    tone="ghost"
                />
            </ContextRail.Footer>
        </ContextRail>
    );
}
```

- [ ] **Step 2: Run tests + build**

```
npm run --workspace=web test
npm run --workspace=web build
```

- [ ] **Step 3: Commit**

```bash
git add web/src/features/admin/users/rail/UserPreviewRail.tsx
git commit -m "refactor(web): UserPreviewRail uses anker 2.3 rail atoms"
```

---

## Task 15: Odon — migrate `ProfileStatusRail`

**Files:**
- Modify: `web/src/features/user-detail/profile-status-rail/ProfileStatusRail.tsx`

- [ ] **Step 1: Rewrite the rail**

Open the file and rewrite the `return (...)` block to use atoms. The existing hook logic (the `useSelfStatus`/`useAdminTargetStatus` switching, the action handlers, the `ChangePasswordModal` integration) stays unchanged — only the JSX changes.

Replace the entire `return (...)` block with:

```tsx
return (
    <>
        <ContextRail storageKey="rail-profile-status">
            <ContextRail.Header
                eyebrow={t("userDetail.rail.eyebrow")}
                title={t("userDetail.rail.title")}
            />

            <ContextRail.StatusIcon
                tone={status?.mfaActive == null ? "gray" : status.mfaActive ? "green" : "red"}
                icon={<Shield size={14} />}
                label={`${t("userDetail.rail.mfa")}: ${fmtMfa()}`}
            />

            <ContextRail.ValueTile
                value={status?.sessionCount ?? 0}
                label={t("userDetail.rail.sessions")}
            />
            <ContextRail.ValueTile
                value={status?.socialCount ?? 0}
                label={t("userDetail.rail.socialAccounts")}
                muted
            />
            <ContextRail.ValueTile
                value={status?.apiKeyActiveCount ?? 0}
                label={t("userDetail.rail.apiKeys")}
                muted
            />

            <ContextRail.Divider />

            {mode === "self" ? (
                <>
                    <ContextRail.IconButton
                        label={t("userDetail.rail.changePassword")}
                        icon={<Key size={14} />}
                        onClick={() => setPwOpen(true)}
                    />
                    <ContextRail.IconButton
                        label={t("userDetail.rail.createApiKey")}
                        icon={<KeyRound size={14} />}
                        onClick={() => navigate("/settings/api-keys?new=1")}
                    />
                    <ContextRail.IconButton
                        label={t("userDetail.rail.signOutAll")}
                        icon={<LogOut size={14} />}
                        onClick={onSignOutAllSelf}
                    />
                </>
            ) : (
                <>
                    <ContextRail.IconButton
                        label={t("userDetail.rail.resetPasswordEmail")}
                        icon={<Mail size={14} />}
                        onClick={onResetPasswordEmail}
                    />
                    <ContextRail.IconButton
                        label={t("userDetail.rail.resetMfa")}
                        icon={<ShieldOff size={14} />}
                        onClick={onResetMfa}
                    />
                    <ContextRail.IconButton
                        label={t("userDetail.rail.signOutAll")}
                        icon={<LogOut size={14} />}
                        onClick={onSignOutAllAdmin}
                    />
                    <ContextRail.IconButton
                        label={
                            target!.active
                                ? t("userDetail.rail.deactivateAccount")
                                : t("userDetail.rail.reactivateAccount")
                        }
                        icon={target!.active ? <UserMinus size={14} /> : <UserCheck size={14} />}
                        onClick={onToggleActivation}
                        tone={target!.active ? "outline-red" : "outline-primary"}
                    />
                </>
            )}
        </ContextRail>

        {mode === "self" && (
            <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
        )}
    </>
);
```

Update the imports at the top of the file: replace `import { Key, Link2, Monitor, Shield } from "lucide-react";` with:

```tsx
import {
    Key,
    KeyRound,
    LogOut,
    Mail,
    Shield,
    ShieldOff,
    UserCheck,
    UserMinus,
} from "lucide-react";
```

Remove the now-unused imports: `useConfirmModal` if no longer needed, `Stack`, `Link2`, `Monitor`, `StatusRow`. Keep `toaster`. Verify by grepping the file after edits for unused imports.

If `<StatusRow>` is still imported and the import goes to a file that's now unused, remove the import. (The file `./StatusRow.tsx` continues to exist and may be reused elsewhere; leave it on disk.)

- [ ] **Step 2: Run tests + build**

```
npm run --workspace=web test
npm run --workspace=web build
```

If a test fails because it asserts the old DOM (e.g., looks for "Off >" in a row that's now an icon), update the assertion to match the new shape (e.g., look for the icon, the tooltip text, or the action button by name).

- [ ] **Step 3: Commit**

```bash
git add web/src/features/user-detail/profile-status-rail/ProfileStatusRail.tsx
# also any updated test files
git status -sb
git commit -m "refactor(web): ProfileStatusRail uses anker 2.3 rail atoms"
```

---

## Task 16: Open PR, merge, ship, smoke check

**Files:** none modified directly.

- [ ] **Step 1: Push the branch**

```bash
cd /Users/jeskoiwanovski/repo/odon
git push -u origin feature/anker-2.3-rail-atoms
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat(web): adopt anker 2.3 collapsed rail atoms" --body "$(cat <<'EOF'
Bumps @knkcs/anker to ^2.3.0 and migrates the four rails (TenantOverview, BulkSelection, UserPreview, ProfileStatus) to use the new mode-aware atoms (\`IconButton\`, \`ValueTile\`, \`StatusIcon\`, \`Avatar\`, \`Divider\`). Collapsed rail now surfaces stats, status indicators, and quick actions instead of being empty.

## Test plan

- [x] \`npm run build\` clean
- [x] Frontend tests pass (pre-existing \`SignedOutConfirmPage\` flake unrelated)
- [ ] CI green (pre-existing odon-ui dist CI failure is unrelated and present on every recent main commit)
- [ ] After merge: ship to cluster and smoke-check all four rails in expanded and collapsed states
EOF
)"
```

- [ ] **Step 3: Wait for CI, merge**

```bash
gh pr checks --watch
# Merge despite the pre-existing odon-ui dist CI failure (it's unrelated to this work):
gh pr merge --squash --delete-branch --admin
git checkout main && git fetch && git reset --hard origin/main
```

- [ ] **Step 4: Ship**

```bash
cd /Users/jeskoiwanovski/repo/knkcms-deploy
make ship-odon
```

Wait for rollout to complete.

- [ ] **Step 5: Smoke check**

In a browser, hard-refresh:

1. `http://odon.localhost:8080/admin/users` (no selection) — collapse the rail and verify: two value tiles for Total + Active, status icon for 2FA, three icon buttons for invite/import/export. Hover each to confirm tooltips.
2. Same page, select 1+ rows — switches to BulkSelectionRail. Collapse and verify: count tile at top, divider, count tiles for selection breakdown, divider, three bulk action icons.
3. Same page, click a single row to open preview — switches to UserPreviewRail. Collapse and verify: avatar at top, status icon for MFA, value tile for sessions, divider, copy-id icon, footer with two pinned icons (Open detail primary, Close ghost).
4. `http://odon.localhost:8080/settings/profile` — ProfileStatusRail in self mode. Collapse and verify: MFA status icon, sessions tile, divider, three quick-action icons.
5. `http://odon.localhost:8080/admin/users/:id/profile` — ProfileStatusRail in admin mode. Collapse and verify: status icon + three value tiles, divider, four action icons (last is red Deactivate or blue Reactivate).

If anything looks broken, capture a screenshot and triage. Otherwise, the redesign is live.
