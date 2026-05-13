# Page Header Three-Row Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape anker's `<PageHeader>` into a three-row band (breadcrumb · detail · tabs) and migrate `IndexPageTemplate`, `DetailPageTemplate`, `SettingsPageTemplate`, plus odon's `UserDetailLayout` and `UserIdentityCard` to the new shape. End state: every solution renders a single continuous header band, with the rail starting below it.

**Architecture:** `PageHeader` grows four optional props (`avatar`, `badges`, `meta`, `tabs`) and renders three vertically-stacked rows on its existing `bg="bg-surface"` band. Page templates stop rendering `subheader` / `tabs` as siblings below the header — both flow into `<PageHeader>` instead. Odon's `<UserIdentityCard>` is deleted; `UserDetailLayout` constructs the avatar / badges / meta nodes directly. `DetailPageTemplate.bodyTabs` is removed (it can't bridge the new slot/body split); consumers migrate to nav-link tabs (one `<Tabs.Root>` with only a `<Tabs.List>` inside).

**Tech Stack:** React 18 + TypeScript, Chakra UI v3, Vitest + Testing Library, Biome, tsup, Storybook MDX. Spec: `docs/superpowers/specs/2026-05-13-page-header-redesign-design.md`.

**Repos and branches:**
- Anker: `/Users/jeskoiwanovski/repo/anker`, branch `feature/page-header-redesign` (already checked out, spec commit `396f4e8` present).
- Odon: `/Users/jeskoiwanovski/repo/odon`, branch `feature/anker-2.2-header-band` (create when reaching Task 13).

---

## Task 1: PageHeader — `avatar` / `badges` / `meta` props (detail row)

**Files:**
- Modify: `src/components/page-header.tsx`
- Test: `src/components/page-header.test.tsx`

- [ ] **Step 1: Write the failing test**

Open `src/components/page-header.test.tsx`. Read the file to learn the existing render helper and assertion patterns. Add this block inside the existing `describe("PageHeader", () => { … })`:

```tsx
it("renders avatar to the left of the title when provided", () => {
    renderWithChakra(
        <PageHeader
            title="Jana Schmid"
            avatar={<div data-testid="avatar">JS</div>}
        />,
    );
    const avatar = screen.getByTestId("avatar");
    const title = screen.getByRole("heading", { name: "Jana Schmid" });
    expect(avatar).toBeInTheDocument();
    // Avatar appears before the title in document order.
    expect(
        avatar.compareDocumentPosition(title) &
            Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
});

it("renders badges inline with the title", () => {
    renderWithChakra(
        <PageHeader
            title="Jana Schmid"
            badges={
                <>
                    <span data-testid="b1">Aktiv</span>
                    <span data-testid="b2">Admin</span>
                </>
            }
        />,
    );
    expect(screen.getByTestId("b1")).toBeInTheDocument();
    expect(screen.getByTestId("b2")).toBeInTheDocument();
});

it("renders the meta line below the title", () => {
    renderWithChakra(
        <PageHeader
            title="Jana Schmid"
            meta={<span data-testid="meta">jana@example.test</span>}
        />,
    );
    const meta = screen.getByTestId("meta");
    const title = screen.getByRole("heading", { name: "Jana Schmid" });
    expect(meta).toBeInTheDocument();
    // Meta appears after the title in document order.
    expect(
        title.compareDocumentPosition(meta) &
            Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
});

it("does not render avatar/badges/meta containers when those props are absent", () => {
    renderWithChakra(<PageHeader title="Plain" />);
    expect(screen.queryByTestId("page-header-avatar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-header-badges")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-header-meta")).not.toBeInTheDocument();
});
```

If `renderWithChakra` doesn't exist in this file, copy it from `src/templates/app-shell.test.tsx` (the `ChakraProvider value={defaultSystem}` wrapper).

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/page-header.test.tsx`
Expected: FAIL — `PageHeader` rejects unknown props or doesn't render the new elements.

- [ ] **Step 3: Add the new props and render them**

In `src/components/page-header.tsx`, update the `PageHeaderProps` interface (currently lines 11–17):

```tsx
export interface PageHeaderProps {
    breadcrumbs?: PageHeaderBreadcrumb[];
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    eyebrow?: React.ReactNode;
    avatar?: React.ReactNode;
    badges?: React.ReactNode;
    meta?: React.ReactNode;
}
```

Then update the function signature and the return body. Replace the existing `<Flex align="center" justify="space-between" gap="4">…</Flex>` block (currently lines 91–118) with this detail-row structure:

```tsx
<Flex align="flex-start" justify="space-between" gap="4">
    {avatar ? (
        <Box data-testid="page-header-avatar" flexShrink={0}>
            {avatar}
        </Box>
    ) : null}
    <Box flex="1" minW="0">
        <Flex align="center" gap="2" wrap="wrap">
            <Heading
                as="h1"
                fontSize="2xl"
                fontWeight="semibold"
                color="default"
                letterSpacing="-0.02em"
            >
                {title}
            </Heading>
            {badges ? (
                <Flex data-testid="page-header-badges" align="center" gap="2">
                    {badges}
                </Flex>
            ) : null}
        </Flex>
        {subtitle && (
            <Text
                data-testid="page-header-subtitle"
                fontSize="sm"
                color="muted"
                mt="1"
            >
                {subtitle}
            </Text>
        )}
        {meta ? (
            <Box data-testid="page-header-meta" mt="2">
                {meta}
            </Box>
        ) : null}
    </Box>
    {hasActions && (
        <Flex align="center" gap="2" flexShrink={0}>
            {actions}
        </Flex>
    )}
</Flex>
```

Make sure `avatar`, `badges`, `meta` are destructured at the top of the function alongside the existing props.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/components/page-header.test.tsx`
Expected: all tests pass (existing tests still pass; the four new ones pass).

If the existing `subtitle` test fails because `subtitle` now appears in a different position, leave it — it's still rendered, just inside the title block. Adjust the assertion only if it asserts a specific DOM sibling relationship.

- [ ] **Step 5: Commit**

```bash
git add src/components/page-header.tsx src/components/page-header.test.tsx
git commit -m "feat(page-header): add avatar, badges, and meta slots"
```

---

## Task 2: PageHeader — `tabs` prop (third row)

**Files:**
- Modify: `src/components/page-header.tsx`
- Test: `src/components/page-header.test.tsx`

- [ ] **Step 1: Write the failing test**

Add inside the existing `describe("PageHeader", …)` in `src/components/page-header.test.tsx`:

```tsx
it("renders a tabs row at the bottom of the band when tabs is provided", () => {
    renderWithChakra(
        <PageHeader
            title="Users"
            tabs={
                <div data-testid="tabs-strip">
                    <button type="button">All</button>
                    <button type="button">Active</button>
                </div>
            }
        />,
    );
    const tabsRow = screen.getByTestId("page-header-tabs");
    const tabsStrip = screen.getByTestId("tabs-strip");
    const title = screen.getByRole("heading", { name: "Users" });
    expect(tabsRow).toContainElement(tabsStrip);
    // Tabs row appears after the title in document order.
    expect(
        title.compareDocumentPosition(tabsRow) &
            Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
});

it("does not render a tabs row when tabs prop is absent", () => {
    renderWithChakra(<PageHeader title="Users" />);
    expect(screen.queryByTestId("page-header-tabs")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/page-header.test.tsx`
Expected: FAIL — `page-header-tabs` element missing; `tabs` prop unrecognized.

- [ ] **Step 3: Add the `tabs` prop and render the row**

In `src/components/page-header.tsx`, add `tabs?: React.ReactNode` to `PageHeaderProps`:

```tsx
export interface PageHeaderProps {
    breadcrumbs?: PageHeaderBreadcrumb[];
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    eyebrow?: React.ReactNode;
    avatar?: React.ReactNode;
    badges?: React.ReactNode;
    meta?: React.ReactNode;
    tabs?: React.ReactNode;
}
```

Destructure `tabs` in the function and append a tabs row immediately AFTER the closing `</Flex>` of the detail row (and before the outer `</Box>` close). The full inner structure of the return should now read:

```tsx
return (
    <Box
        py="4"
        px="8"
        borderBottomWidth="1px"
        borderBottomColor="border"
        bg="bg-surface"
    >
        {eyebrow && (
            <Text … />
        )}
        {hasCrumbs && (
            <Flex … />
        )}
        <Flex align="flex-start" justify="space-between" gap="4">
            … detail row from Task 1 …
        </Flex>
        {tabs ? (
            <Box data-testid="page-header-tabs" mt="4" mx="-8">
                {tabs}
            </Box>
        ) : null}
    </Box>
);
```

The `mx="-8"` cancels the band's horizontal padding so the tab strip extends edge-to-edge and its bottom underline meets the band's bottom border. The tab strip itself supplies its own horizontal padding (Chakra's `Tabs.List` already provides this).

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/components/page-header.test.tsx`
Expected: PASS for all tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/page-header.tsx src/components/page-header.test.tsx
git commit -m "feat(page-header): add tabs slot for third-row tab strip"
```

---

## Task 3: PageHeader — Storybook stories for new slots

**Files:**
- Modify: `src/components/page-header.stories.tsx`

- [ ] **Step 1: Read the existing stories file**

Open `src/components/page-header.stories.tsx`. Note the `meta` / `default` exports and the story format (the file is small — under 60 lines). The existing stories likely include `Default`, `WithBreadcrumbs`, `WithActions`, or similar.

- [ ] **Step 2: Add new stories**

Append the following stories to the bottom of `src/components/page-header.stories.tsx`. Use whatever import conventions are already in the file (e.g., if existing stories use a `Template`, mirror it; otherwise use the `StoryObj` pattern shown here):

```tsx
import { Avatar, Badge } from "../atoms/avatar"; // adjust if your barrel path differs
import { Tabs } from "../primitives/tabs";
import { Box, Flex, Text } from "../primitives/layout";

export const WithDetailSlots: StoryObj = {
    render: () => (
        <PageHeader
            breadcrumbs={[
                { label: "Identity", to: "#" },
                { label: "Users", to: "#" },
                { label: "Jana Schmid" },
            ]}
            title="Jana Schmid"
            avatar={
                <Box
                    w="16"
                    h="16"
                    bg="bg-emphasis"
                    color="white"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                    fontSize="xl"
                >
                    JS
                </Box>
            }
            badges={
                <>
                    <Box
                        bg="green.50"
                        color="green.700"
                        px="2"
                        py="0.5"
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="medium"
                    >
                        Aktiv
                    </Box>
                    <Box
                        bg="blue.50"
                        color="blue.700"
                        px="2"
                        py="0.5"
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="medium"
                    >
                        Admin
                    </Box>
                </>
            }
            meta={
                <Flex gap="4" fontSize="sm" color="muted" wrap="wrap">
                    <Text>jana.schmid@knk.de</Text>
                    <Text>Produktmanagement</Text>
                    <Text fontFamily="mono">usr_8f3c2b9a4e7d</Text>
                </Flex>
            }
            actions={
                <>
                    <button type="button">Passwort zurücksetzen</button>
                    <button type="button">Bearbeiten</button>
                </>
            }
        />
    ),
};

export const WithTabs: StoryObj = {
    render: () => (
        <PageHeader
            breadcrumbs={[
                { label: "Identity", to: "#" },
                { label: "Users" },
            ]}
            title="Users"
            actions={
                <>
                    <button type="button">CSV importieren</button>
                    <button type="button">Nutzer einladen</button>
                </>
            }
            tabs={
                <Tabs.Root defaultValue="all">
                    <Tabs.List>
                        <Tabs.Trigger value="all">Alle</Tabs.Trigger>
                        <Tabs.Trigger value="active">Aktiv</Tabs.Trigger>
                        <Tabs.Trigger value="invited">Eingeladen</Tabs.Trigger>
                        <Tabs.Trigger value="suspended">Gesperrt</Tabs.Trigger>
                    </Tabs.List>
                </Tabs.Root>
            }
        />
    ),
};

export const FullBand: StoryObj = {
    render: () => (
        <PageHeader
            breadcrumbs={[
                { label: "Identity", to: "#" },
                { label: "Users", to: "#" },
                { label: "Jana Schmid" },
            ]}
            title="Jana Schmid"
            avatar={
                <Box
                    w="16"
                    h="16"
                    bg="bg-emphasis"
                    color="white"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                    fontSize="xl"
                >
                    JS
                </Box>
            }
            badges={
                <Box
                    bg="green.50"
                    color="green.700"
                    px="2"
                    py="0.5"
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="medium"
                >
                    Aktiv
                </Box>
            }
            meta={
                <Text fontSize="sm" color="muted">
                    jana.schmid@knk.de
                </Text>
            }
            actions={<button type="button">Bearbeiten</button>}
            tabs={
                <Tabs.Root defaultValue="overview">
                    <Tabs.List>
                        <Tabs.Trigger value="overview">Übersicht</Tabs.Trigger>
                        <Tabs.Trigger value="apps">Anwendungen</Tabs.Trigger>
                        <Tabs.Trigger value="sessions">Sitzungen</Tabs.Trigger>
                    </Tabs.List>
                </Tabs.Root>
            }
        />
    ),
};
```

If the existing stories file does not import `StoryObj`, follow the file's own typing convention. If imports of `Avatar`, `Tabs`, or `Box` don't match your codebase, replace them with the correct paths — `Tabs` is at `../primitives/tabs`, `Box`/`Flex`/`Text` at `../primitives/layout`, badges are inline div-based.

- [ ] **Step 3: Verify with typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/page-header.stories.tsx
git commit -m "docs(stories): add detail-slot and tabs stories for PageHeader"
```

---

## Task 4: IndexPageTemplate — pipe `tabs` into PageHeader

**Files:**
- Modify: `src/templates/index-page-template.tsx`

- [ ] **Step 1: Open the template**

Read `src/templates/index-page-template.tsx`. Today it constructs `<PageHeader breadcrumbs … title … actions={resolvedActions} />` and registers it via `usePageHeader`, then renders `tabs` and `toolbar` as siblings of the header inside the template body.

- [ ] **Step 2: Move `tabs` into PageHeader**

Update the `usePageHeader(...)` call to include `tabs`:

```tsx
usePageHeader(
    <PageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        subtitle={subtitle}
        eyebrow={eyebrow}
        actions={resolvedActions}
        tabs={tabs}
    />,
);
```

Then remove the inline `{tabs ? <Box>{tabs}</Box> : null}` rendering from the template's return tree. The body return should now contain only `toolbar` and `children`:

```tsx
return (
    <Flex
        data-testid="index-page-template"
        direction="column"
        flex="1"
        minH="0"
    >
        {toolbar ? <Box>{toolbar}</Box> : null}
        <Box flex="1" minH="0">
            {children}
        </Box>
    </Flex>
);
```

- [ ] **Step 3: Run the existing test suite for this file**

Run: `pnpm vitest run src/templates/index-page-template`
Expected: any test that asserted the tabs were a child of `index-page-template` Flex fails. Fix those tests: change the assertion to query inside `screen.getByTestId("app-shell-header")` (use `within` from `@testing-library/react`) and wrap the render in `<AppShell sidebar={…}>` if it wasn't already. Tests that don't reference tabs should still pass.

Example fix (if an existing test renders without AppShell and asserts a tab label appears anywhere):

```tsx
import { within } from "@testing-library/react";
import { AppShell } from "./app-shell";

it("renders tabs in the page header", () => {
    renderWithChakra(
        <AppShell sidebar={<div />}>
            <IndexPageTemplate
                title="Users"
                tabs={<button data-testid="tab-all">All</button>}
            >
                body
            </IndexPageTemplate>
        </AppShell>,
    );
    const header = screen.getByTestId("app-shell-header");
    expect(within(header).getByTestId("tab-all")).toBeInTheDocument();
});
```

- [ ] **Step 4: Verify all template tests pass**

Run: `pnpm vitest run src/templates/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/templates/index-page-template.tsx src/templates/index-page-template.test.tsx 2>/dev/null || git add src/templates/index-page-template.tsx
git commit -m "feat(index-page-template): pipe tabs into PageHeader"
```

(If no test file exists for index-page-template, omit it from `git add`.)

---

## Task 5: DetailPageTemplate — replace `subheader`, pipe `tabs`, remove `bodyTabs`

**Files:**
- Modify: `src/templates/detail-page-template.tsx`
- Test: `src/templates/detail-page-template.test.tsx`

- [ ] **Step 1: Read the file**

Open `src/templates/detail-page-template.tsx`. Note the current `DetailPageTemplateProps` interface, the `bodyTabs` branch, and the inline `<PageHeader>` usage (lifted to `usePageHeader` by an earlier migration).

- [ ] **Step 2: Update the props interface**

Replace the existing props that reference `subheader` and `bodyTabs`:

```tsx
export interface DetailPageTemplateProps
    extends Pick<
        PageHeaderProps,
        "breadcrumbs" | "title" | "subtitle" | "eyebrow"
    > {
    actions?: ReactNode;
    avatar?: ReactNode;
    badges?: ReactNode;
    meta?: ReactNode;
    tabs?: ReactNode;
    children?: ReactNode;
}
```

Delete the `bodyTabs` prop entry and any helper type for it (e.g., `DetailPageTemplateBodyTabs`).

- [ ] **Step 3: Update the function body**

The function should now have a single straight-through return (no `bodyTabs` branching). Replace the whole body with:

```tsx
export function DetailPageTemplate({
    breadcrumbs,
    title,
    subtitle,
    eyebrow,
    actions,
    avatar,
    badges,
    meta,
    tabs,
    children,
}: DetailPageTemplateProps) {
    const registered = useRegisteredPageActions();
    const resolvedActions = actions ?? registered;
    usePageHeader(
        <PageHeader
            breadcrumbs={breadcrumbs}
            title={title}
            subtitle={subtitle}
            eyebrow={eyebrow}
            actions={resolvedActions}
            avatar={avatar}
            badges={badges}
            meta={meta}
            tabs={tabs}
        />,
    );
    return (
        <Flex
            data-testid="detail-page-template"
            direction="column"
            flex="1"
            minH="0"
        >
            <Box flex="1" minH="0">
                {children}
            </Box>
        </Flex>
    );
}
```

Remove the `subheader` references and the entire `if (bodyTabs)` branch. The `if (tabs && bodyTabs) throw` guard is also gone (no more `bodyTabs`).

If `<Tabs.Root>` is no longer used anywhere in the file, remove its import.

- [ ] **Step 4: Update the test file**

Open `src/templates/detail-page-template.test.tsx`. Identify:
- Tests that pass `subheader={…}` → either delete them, or change them to assert that the same content reaches the header via `avatar` / `badges` / `meta` props.
- Tests that pass `bodyTabs={…}` → delete them entirely. Add a comment in the file's top describing the migration: `// bodyTabs was removed in the page-header-redesign change. See spec docs/superpowers/specs/2026-05-13-page-header-redesign-design.md.`
- Tests that pass `tabs={…}` and assert the tabs appear → wrap in `<AppShell>` and query inside `app-shell-header` (same pattern as Task 4).

For the remaining tests, add this case asserting the new props are forwarded:

```tsx
it("forwards avatar, badges, meta, and tabs into the registered PageHeader", () => {
    renderWithChakra(
        <AppShell sidebar={<div />}>
            <DetailPageTemplate
                title="Jana Schmid"
                avatar={<div data-testid="av">JS</div>}
                badges={<span data-testid="bd">Aktiv</span>}
                meta={<span data-testid="mt">jana@example.test</span>}
                tabs={<div data-testid="tb">tab list</div>}
            >
                body
            </DetailPageTemplate>
        </AppShell>,
    );
    const header = screen.getByTestId("app-shell-header");
    expect(within(header).getByTestId("av")).toBeInTheDocument();
    expect(within(header).getByTestId("bd")).toBeInTheDocument();
    expect(within(header).getByTestId("mt")).toBeInTheDocument();
    expect(within(header).getByTestId("tb")).toBeInTheDocument();
});
```

Add the `import { within } from "@testing-library/react";` and `import { AppShell } from "./app-shell";` lines if not already present.

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run src/templates/detail-page-template`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/templates/detail-page-template.tsx src/templates/detail-page-template.test.tsx
git commit -m "feat(detail-page-template)!: replace subheader/bodyTabs with avatar/badges/meta + tabs slot"
```

The `!` after the type marks this as a breaking change per Conventional Commits — `subheader` and `bodyTabs` are removed.

---

## Task 6: SettingsPageTemplate — same migration pattern

**Files:**
- Modify: `src/templates/settings-page-template.tsx`
- Test: `src/templates/settings-page-template.test.tsx`

- [ ] **Step 1: Read the file**

Open `src/templates/settings-page-template.tsx`. Inspect whether it has `subheader`, `bodyTabs`, or `tabs` props.

- [ ] **Step 2: Apply the same migration as Task 5**

For each prop the file already has:
- `subheader` → remove. Add `avatar`, `badges`, `meta` props and pipe them into `<PageHeader>`.
- `bodyTabs` → remove. Keep `tabs` (the page passes whatever it wants there).
- `tabs` → pipe into `<PageHeader tabs={tabs}>` (no longer rendered as a sibling).

If SettingsPageTemplate has no `subheader` / `bodyTabs` props to begin with, just add `tabs` piping into `<PageHeader>` (mirroring Task 4's IndexPageTemplate change).

The body return should render only `children` (plus whatever else is settings-template-specific, like tab panels managed by the page itself).

- [ ] **Step 3: Update the test file**

Same approach as Task 5: remove tests for removed props, update tab/header tests to query under `app-shell-header`.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/templates/settings-page-template`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/templates/settings-page-template.tsx src/templates/settings-page-template.test.tsx
git commit -m "feat(settings-page-template)!: align with three-row header redesign"
```

---

## Task 7: Update `app-shell.tsx` top-of-file comment

**Files:**
- Modify: `src/templates/app-shell.tsx`

- [ ] **Step 1: Update the ASCII diagram**

In `src/templates/app-shell.tsx`, find the ASCII diagram at the top of the file (added by the context-rail-position work). Update its inner depiction of the header band to indicate three rows. Replace the diagram block with:

```
//     ┌─────────┬───────────────────────────────────┐
//     │         │   page header band                │
//     │         │   ┌ breadcrumb ─────────────────┐ │
//     │         │   ┌ detail (avatar/title/etc.) ─┐ │
//     │         │   ┌ tabs (optional) ────────────┐ │
//     │         ├───────────────────────┬───────────┤
//     │ sidebar │       children        │   rail    │
//     │         │   (body / cards / …)  │           │
//     │         │                       │           │
//     └─────────┴───────────────────────┴───────────┘
```

The "Slot mechanism" comment section below the diagram doesn't need changes — the slot names (`actions` / `header` / `rail`) are unchanged.

- [ ] **Step 2: Commit**

```bash
git add src/templates/app-shell.tsx
git commit -m "docs(app-shell): update diagram for three-row header band"
```

---

## Task 8: Update `docs/page-patterns.md`

**Files:**
- Modify: `docs/page-patterns.md`

- [ ] **Step 1: Update the App-shell composition diagram**

Find the ASCII diagram of the app shell (around lines 48–55, last updated by the rail-position work). Update the "page header" portion to show three rows:

```
┌────────────┬────────────────────────────────────────────────────┐
│            │   page header band:                                │
│            │     [ breadcrumb ]                                 │
│            │     [ detail row (avatar · title · actions)      ] │
│            │     [ tabs (optional)                            ] │
│  Sidebar   ├────────────────────────────────────┬───────────────┤
│   240px    │         Main content               │ ContextRail   │
│ ↔ 60px     │            (fluid)                 │    320px      │
│ collapsed  │                                    │  ↔ 44px       │
│            │                                    │  collapsed    │
└────────────┴────────────────────────────────────┴───────────────┘
```

- [ ] **Step 2: Add a new "Page header anatomy" section**

Add a new H2 section titled `## Page header anatomy` AFTER the existing "App-shell composition" section and BEFORE the Sidebar section. Body:

```markdown
The page header band is one `<PageHeader>` instance, registered into the
header slot via `usePageHeader(...)` from a page template. It renders up
to three vertically-stacked rows on `bg-surface`, separated by spacing
(not borders). The bottom border of the band marks the transition to
the body and rail.

| Row | Purpose | Props |
|-----|---------|-------|
| 1 — Breadcrumb | Trail to the current page. Last crumb non-link. | `breadcrumbs` |
| 2 — Detail | Identity of the current page or entity: optional avatar (left), title + badges + meta (center), actions (right). | `avatar`, `title`, `badges`, `subtitle`, `meta`, `actions` |
| 3 — Tabs | In-page navigation or filter state. | `tabs` |

Each row is independently optional except for the title in row 2, which
is required.

**Detail page example** (anker imports omitted):

\`\`\`tsx
<DetailPageTemplate
  breadcrumbs={[{ label: "Identity", to: "/identity" }, { label: "Users", to: "/identity/users" }, { label: "Jana Schmid" }]}
  title="Jana Schmid"
  avatar={<Avatar name="Jana Schmid" size="lg" />}
  badges={<><Badge colorPalette="green">Aktiv</Badge><Badge colorPalette="blue">Admin</Badge></>}
  meta={<Flex gap="4" fontSize="sm"><span>jana.schmid@knk.de</span><span>Produkt</span></Flex>}
  actions={<Button>Bearbeiten</Button>}
  tabs={
    <Tabs.Root value={activeTab}>
      <Tabs.List>
        <Tabs.Trigger value="overview">Übersicht</Tabs.Trigger>
        <Tabs.Trigger value="apps">Anwendungen</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  }
>
  {/* body cards */}
</DetailPageTemplate>
\`\`\`

**Index page example**:

\`\`\`tsx
<IndexPageTemplate
  breadcrumbs={[{ label: "Identity" }, { label: "Users" }]}
  title="Users"
  actions={<Button>Nutzer einladen</Button>}
  tabs={
    <Tabs.Root value={filter}>
      <Tabs.List>
        <Tabs.Trigger value="all">Alle</Tabs.Trigger>
        <Tabs.Trigger value="active">Aktiv</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  }
  toolbar={<SearchBar />}
>
  <DataTable … />
</IndexPageTemplate>
\`\`\`

Index pages omit `avatar`, `badges`, and `meta` — the detail row collapses
to title + actions.
```

- [ ] **Step 3: Update the "Tabs vs sub-section nav" guidance**

Find the existing rule-of-thumb block (around lines 282–287, mentioning "page header" and "identity card"). Replace it with:

```markdown
> **Rule of thumb:** if the in-page navigation keeps the entity identity
> (breadcrumb, avatar, title, badges) constant across the destinations,
> they belong in `tabs` on the page header. If each destination is a
> distinct top-level page with its own breadcrumb and title, render them
> as separate index pages in the sidebar.
>
> Within a single page, prefer the `tabs` row over rendering a custom
> in-body tab strip — it keeps the navigation surface consistent across
> solutions.
```

- [ ] **Step 4: Update the ContextRail section**

Find the section that describes the rail's vertical origin (added by the rail-position work, around lines 94–97 or near §ContextRail patterns). Add this clarifying sentence:

```markdown
When the page header includes a tabs row, the rail's coordinate origin
sits **below the tabs row** — i.e. below the entire header band.
```

- [ ] **Step 5: Commit**

```bash
git add docs/page-patterns.md
git commit -m "docs(page-patterns): three-row page header band"
```

---

## Task 9: Update `CLAUDE-ANKER.md`

**Files:**
- Modify: `CLAUDE-ANKER.md`

- [ ] **Step 1: Update PageHeader and DetailPageTemplate entries**

Find the table row for `<PageHeader>`:

```markdown
| `<PageHeader>` | Top-of-page chrome: breadcrumb, title, subtitle, actions. |
```

Replace with:

```markdown
| `<PageHeader>` | Three-row page header band (breadcrumb · detail · tabs). Props: `breadcrumbs`, `title`, `subtitle`, `eyebrow`, `actions`, `avatar`, `badges`, `meta`, `tabs`. Each row is independently optional except title. See `docs/page-patterns.md` §Page header anatomy. |
```

Find the table row for `<DetailPageTemplate>`:

```markdown
| `<DetailPageTemplate>` | Single-entity pages — header + optional tabs + body |
```

Replace with:

```markdown
| `<DetailPageTemplate>` | Single-entity pages — registers a three-row header band via `usePageHeader`. New props: `avatar`, `badges`, `meta`, `tabs`. `subheader` and `bodyTabs` were removed in v2.2.0 — migrate to the slot props on PageHeader. |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE-ANKER.md
git commit -m "docs(claude-anker): document three-row PageHeader props"
```

---

## Task 10: Add `src/components/page-header.mdx`

**Files:**
- Create: `src/components/page-header.mdx`

- [ ] **Step 1: Read an existing MDX file to mirror its conventions**

Look at one of the existing component MDX files (e.g., `src/components/data-table/data-table.mdx` or `src/components/pagination.mdx`) to see the Storybook MDX format: how Meta, Story, ArgsTable, and prose blocks are used.

- [ ] **Step 2: Create the new MDX file**

Create `src/components/page-header.mdx` with the following content. Adjust the import paths and MDX directives to match the conventions you observed in step 1:

```mdx
import { Canvas, Meta, ArgTypes } from "@storybook/blocks";
import * as PageHeaderStories from "./page-header.stories";

<Meta of={PageHeaderStories} />

# PageHeader

The top-of-page chrome shared by every authenticated knkCMS page. Renders
a single white-bg band with up to three vertically-stacked rows:

1. **Breadcrumb** — trail to the current page. Last crumb is non-link.
2. **Detail** — identity of the page or entity: optional avatar (left),
   title with optional badges (center), optional meta line below the
   title, optional actions (right).
3. **Tabs** — in-page navigation or filter state. Sits flush with the
   band's bottom border.

Each row is independently optional except the title. Pages register the
component via `usePageHeader` from a page template (`IndexPageTemplate`,
`DetailPageTemplate`, `SettingsPageTemplate`) — see `app-shell.tsx` and
`docs/page-patterns.md` for the slot mechanism.

## Title-only

The minimum useful case — a single title in the detail row.

<Canvas of={PageHeaderStories.Default} />

## With breadcrumb and actions

<Canvas of={PageHeaderStories.WithBreadcrumbs} />

## Detail slots — avatar, badges, meta

When the page is about a specific entity (a user, an org, a workspace),
populate the detail row with the entity's identifying chrome.

<Canvas of={PageHeaderStories.WithDetailSlots} />

## Tabs

Tabs go in the third row of the band. Use them for in-page navigation
(detail pages) or filter state (index pages).

<Canvas of={PageHeaderStories.WithTabs} />

## All three rows together

A detail page with full identity and tabs.

<Canvas of={PageHeaderStories.FullBand} />

## Props

<ArgTypes of={PageHeaderStories} />

## When to use which row

- **Breadcrumb** — always, except on top-level dashboard pages.
- **Avatar / badges / meta** — only on entity detail pages. Index pages,
  settings pages, and dashboards skip these.
- **Tabs** — when the page has multiple views that share the same identity
  (the entity, the workspace, the filter). If each destination has its
  own page header / title, it's not a tab — it's a separate page.

See `docs/page-patterns.md` §Page header anatomy for the full design
reference.
```

If the stories you added in Task 3 (`WithDetailSlots`, `WithTabs`, `FullBand`) use different names, adjust the `<Canvas of={...}>` references accordingly. If `Default` / `WithBreadcrumbs` don't exist in `page-header.stories.tsx`, remove those Canvas blocks.

- [ ] **Step 3: Verify by running Storybook (optional, manual)**

Run: `pnpm storybook`
Manual check: navigate to "Components → PageHeader" — the MDX page renders with prose, canvas blocks, and the prop table. Stop Storybook.

This step is optional verification; no automated assertion. If you cannot run Storybook in the current environment, skip it.

- [ ] **Step 4: Commit**

```bash
git add src/components/page-header.mdx
git commit -m "docs(stories): add MDX docs page for PageHeader"
```

---

## Task 11: Full verification before release

**Files:** none modified — verification only.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: no new errors. Pre-existing warnings in `src/forms/` and `src/components/data-table/__tests__/` are acceptable as long as the count hasn't grown.

- [ ] **Step 4: Build the package**

Run: `pnpm build`
Expected: build succeeds. Inspect `dist/components/index.d.ts` and verify the new props (`avatar`, `badges`, `meta`, `tabs`) appear on `PageHeaderProps`.

- [ ] **Step 5: Sync the lockfile (if any change)**

If `package-lock.json` or `pnpm-lock.yaml` was incidentally modified, stage and commit:

```bash
git status -sb
# if lockfile changed:
git add package-lock.json   # or pnpm-lock.yaml
git commit -m "chore(deps): sync lockfile"
```

- [ ] **Step 6: Push the branch and open the PR**

```bash
git push -u origin feature/page-header-redesign
gh pr create --title "feat: three-row page header band (breadcrumb · detail · tabs)" \
  --body "$(cat <<'EOF'
## Summary

- `<PageHeader>` grows four optional slots: \`avatar\`, \`badges\`, \`meta\`, \`tabs\`.
- Page templates (\`IndexPageTemplate\`, \`DetailPageTemplate\`, \`SettingsPageTemplate\`) pipe their existing \`tabs\` prop into the header band instead of rendering it as a separate row in the body.
- \`DetailPageTemplate\`'s \`subheader\` and \`bodyTabs\` props removed (breaking).
- Design docs and Storybook MDX updated.

Spec: \`docs/superpowers/specs/2026-05-13-page-header-redesign-design.md\`
Plan: \`docs/superpowers/plans/2026-05-13-page-header-redesign.md\`

## Test plan

- [ ] CI green
- [ ] Storybook visual check: PageHeader / WithDetailSlots, WithTabs, FullBand
- [ ] After merge: cut v2.2.0, then bump anker in odon
EOF
)"
```

- [ ] **Step 7: Wait for CI, then merge and tag**

Wait for the PR check to pass:

```bash
gh pr checks --watch
```

Then squash-merge and tag:

```bash
gh pr merge --squash --delete-branch
git checkout main && git pull --ff-only
git tag v2.2.0 && git push origin v2.2.0
```

The CI publish workflow handles npm + GitHub Packages publication on the tag push. Wait for the publish workflow to complete:

```bash
gh run watch
```

Verify on npm:

```bash
npm view @knkcs/anker version   # should print 2.2.0
```

---

## Task 12: Odon — delete `UserIdentityCard`, rewrite `UserDetailLayout`

**Repo:** `/Users/jeskoiwanovski/repo/odon`

**Files:**
- Delete: `web/src/components/user/UserIdentityCard.tsx`
- Modify: `web/src/components/user/UserDetailLayout.tsx`
- Test: `web/src/__tests__/components/settings/*` (may need adjustments)

- [ ] **Step 1: Create a feature branch**

```bash
cd /Users/jeskoiwanovski/repo/odon
git checkout main && git pull --ff-only
git checkout -b feature/anker-2.2-header-band
```

- [ ] **Step 2: Rewrite `UserDetailLayout`**

Replace the entire contents of `web/src/components/user/UserDetailLayout.tsx` with:

```tsx
import { Badge, Box, Flex, Tabs, Text } from "@knkcs/anker/primitives";
import { DetailPageTemplate } from "@knkcs/anker/templates";
import { Hash, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "@/components/admin/UserAvatar";

const STATUS_COLORS = {
    active: "green",
    invited: "yellow",
    suspended: "red",
} as const;

type StatusKind = keyof typeof STATUS_COLORS;

export type IdentityCardUser = {
    id: string;
    email: string;
    displayName?: string;
    emailVerified: boolean;
    active: boolean;
};

function statusFromUser(u: IdentityCardUser): StatusKind {
    if (!u.active) return "suspended";
    if (!u.emailVerified) return "invited";
    return "active";
}

export interface UserDetailLayoutTab {
    value: string;
    label: string;
    to: string;
}

export interface UserDetailLayoutProps {
    user: IdentityCardUser;
    mode: "self" | "admin";
    pageHeader: { breadcrumbs: { label: string }[]; title: string };
    identityCardActions: { primary?: ReactNode; secondary?: ReactNode };
    tabs: UserDetailLayoutTab[];
    activeTab: string;
    children: ReactNode;
}

export function UserDetailLayout({
    user,
    mode: _mode,
    pageHeader,
    identityCardActions,
    tabs,
    activeTab,
    children,
}: UserDetailLayoutProps) {
    const { t } = useTranslation();
    const status = statusFromUser(user);
    const display = user.displayName || user.email || "";

    const avatar = <UserAvatar name={display} size="lg" />;

    const badges = (
        <Badge colorPalette={STATUS_COLORS[status]} size="sm">
            {t(`userDetail.status.${status}`)}
        </Badge>
    );

    const meta = (
        <Flex align="center" gap="4" flexWrap="wrap">
            <Flex align="center" gap="1">
                <Mail size={13} color="var(--chakra-colors-fg-muted)" />
                <Text fontFamily="mono" fontSize="xs" color="fg.muted">
                    {user.email}
                </Text>
            </Flex>
            <Flex align="center" gap="1">
                <Hash size={13} color="var(--chakra-colors-fg-muted)" />
                <Text fontFamily="mono" fontSize="xs" color="fg.muted">
                    {user.id}
                </Text>
            </Flex>
        </Flex>
    );

    const actions = (
        <Flex gap="2">
            {identityCardActions.secondary}
            {identityCardActions.primary}
        </Flex>
    );

    const tabsNode = (
        <Tabs.Root value={activeTab}>
            <Tabs.List>
                {tabs.map((tab) => (
                    <Tabs.Trigger key={tab.value} value={tab.value}>
                        <NavLink
                            to={tab.to}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            {tab.label}
                        </NavLink>
                    </Tabs.Trigger>
                ))}
            </Tabs.List>
        </Tabs.Root>
    );

    return (
        <DetailPageTemplate
            breadcrumbs={pageHeader.breadcrumbs}
            title={pageHeader.title}
            avatar={avatar}
            badges={badges}
            meta={meta}
            actions={actions}
            tabs={tabsNode}
        >
            {children}
        </DetailPageTemplate>
    );
}
```

The visual chrome that previously lived in `<UserIdentityCard>` (status badge, avatar, email/ID meta line, actions row) is now built inline as local nodes and passed as four discrete props.

- [ ] **Step 3: Delete `UserIdentityCard`**

```bash
rm web/src/components/user/UserIdentityCard.tsx
```

Then search for any remaining import of it and remove them:

```bash
grep -rn "UserIdentityCard" web/src/ 2>/dev/null
```

Expected: no matches (only the file we just deleted referenced it). If matches remain (e.g., in tests), edit those files to drop the import.

- [ ] **Step 4: Run frontend tests**

```bash
npm run --workspace=web test
```

Expected: PASS. Likely some tests in `web/src/__tests__/components/settings/` use `UserDetailLayout` or `<UserIdentityCard>` directly — update them to either render `<UserDetailLayout>` (with the new props) or query for the new DOM (the badge is now in the page header instead of an "identity card" container).

- [ ] **Step 5: Run typecheck and build**

```bash
npm run --workspace=web build
```

Expected: build succeeds. (`tsc -b` runs first; if it errors, fix the typing issues in step 2's code.)

- [ ] **Step 6: Commit**

```bash
git add web/src/components/user/UserDetailLayout.tsx
git rm web/src/components/user/UserIdentityCard.tsx
git add web/src/__tests__/components/settings/   # if any tests changed
git commit -m "refactor(web): inline UserDetailLayout identity slots, drop UserIdentityCard"
```

---

## Task 13: Odon — bump anker to ^2.2.0

**Files:**
- Modify: `package.json`, `web/package.json`, `packages/odon-ui/package.json`, `package-lock.json`

- [ ] **Step 1: Update version strings**

Edit all three package.json files to use `"@knkcs/anker": "^2.2.0"`:

```bash
sed -i '' 's/"@knkcs\/anker": "[^"]*"/"@knkcs\/anker": "^2.2.0"/g' \
  /Users/jeskoiwanovski/repo/odon/package.json \
  /Users/jeskoiwanovski/repo/odon/web/package.json \
  /Users/jeskoiwanovski/repo/odon/packages/odon-ui/package.json
```

For `packages/odon-ui/package.json`, the `peerDependencies` entry should remain `"@knkcs/anker": "*"` — the sed above overwrites it; restore it manually:

```bash
# Open packages/odon-ui/package.json and ensure peerDependencies has
# "@knkcs/anker": "*"  (not "^2.2.0").
```

Use the Edit tool to revert `peerDependencies.@knkcs/anker` to `"*"`.

- [ ] **Step 2: Nuke node_modules and reinstall fresh**

The previous bump (v2.0.10 → v2.1.0) revealed that npm leaves stale workspace-local copies behind. Do a clean install to avoid the bug:

```bash
cd /Users/jeskoiwanovski/repo/odon
rm -rf node_modules web/node_modules packages/odon-ui/node_modules package-lock.json
npm install
```

- [ ] **Step 3: Verify anker version**

```bash
grep '"version"' node_modules/@knkcs/anker/package.json
ls web/node_modules/@knkcs/anker 2>/dev/null && echo "STALE WORKSPACE COPY — investigate" || echo "OK — hoisted to root"
```

Expected: root version is 2.2.0; no workspace-local copy.

- [ ] **Step 4: Rebuild and run tests**

```bash
npm run --workspace=web build
npm run --workspace=web test
```

Expected: build succeeds; tests pass (pre-existing `SignedOutConfirmPage` failure is unrelated and can be ignored).

Spot-check the built bundle for the new symbols:

```bash
grep -oE "page-header-avatar|page-header-badges|page-header-meta|page-header-tabs" web/dist/assets/index-*.js | sort -u
```

Expected: all four data-testid strings appear.

- [ ] **Step 5: Commit**

```bash
git add package.json web/package.json packages/odon-ui/package.json package-lock.json
git commit -m "chore(deps): bump @knkcs/anker to ^2.2.0

Picks up the three-row page header band (breadcrumb · detail · tabs)
and removes the subheader / bodyTabs props on DetailPageTemplate."
```

- [ ] **Step 6: Push the branch and open the PR**

```bash
git push -u origin feature/anker-2.2-header-band
gh pr create --title "feat(web): adopt anker 2.2 three-row page header" \
  --body "Bumps anker to ^2.2.0 and migrates UserDetailLayout to the new slot-based PageHeader props. Deletes UserIdentityCard."
```

Wait for CI; merge when green:

```bash
gh pr checks --watch
gh pr merge --squash --delete-branch
git checkout main && git pull --ff-only
```

---

## Task 14: Ship odon to the cluster

**Repo:** `/Users/jeskoiwanovski/repo/knkcms-deploy`

- [ ] **Step 1: Ship**

```bash
cd /Users/jeskoiwanovski/repo/knkcms-deploy
make ship-odon
```

Expected: image builds, pushes, helm upgrade rolls out a new pod, rollout completes.

- [ ] **Step 2: Visual smoke check**

Hard-refresh `http://odon.localhost:8080/admin/users` and one user-detail page. Verify:
- Header band visually contains breadcrumb · entity-row · tabs (detail) or breadcrumb · title-row · tabs (index).
- Rail begins directly below the tabs row.
- No "two-headers" look on user detail.
- Tabs visually sit on the same white surface as the rest of the header.

If anything looks off, capture a screenshot and triage. If everything looks right, the redesign is live.

---

## Notes on subagent dispatch order

- **Tasks 1–11 are anker-only.** They can run sequentially; each task is small and independent enough that the implementer subagent can be dispatched per task.
- **Tasks 12–14 are odon (and deploy)**; they depend on the anker v2.2.0 release being published (Task 11 step 7).
- Within Tasks 4–6 (template migrations) and 7–10 (docs/stories), tasks are largely independent — but DO run them sequentially to keep the test suite green at each commit and to keep git history clean.
