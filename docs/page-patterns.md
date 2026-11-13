# anker Page Patterns

**Version:** 1.x
**Status:** Active — source-of-truth contract for knkCMS solutions
**Last updated:** October 2026

---

## 1. About this document

This document is the page-level companion to `docs/design-system.md`. Where
the design-system spec defines the visual language (tokens, typography,
shadows, motion), this spec defines the **page-level contract**: how a knkCMS
page is composed, where the chrome lives, what slots exist, and which template
to reach for in any given situation.

**Audience.** Developers building knkCMS solutions (Odon, Core, Template,
Aufgabenmanagement, Media Asset System, …). The patterns here are normative
— solutions that diverge will look out of place inside the platform shell,
especially once module federation lands and multiple solutions render side
by side in a single browser frame.

**Status.** The 1.x conventions are stable. Templates are additive — new
templates may be added as new page types are discovered, but existing
templates will not change their slot contract within a 1.x line. Major
contract changes ride a major version.

**Process.** Check this document — and `design-system.md` for the visual
language — before adding a new screen or component pattern, not only once
something already looks wrong. A component that exists and is used (e.g.
`Drawer`, §10) but isn't covered here yet is exactly the gap this document
exists to close; ask here first rather than shipping the divergence and
writing it down after the fact.

**Relationship to other docs.**

- [`docs/design-system.md`](./design-system.md) — token system, typography,
  spacing, motion. Read first.
- [`CLAUDE-ANKER.md`](../CLAUDE-ANKER.md) — design-system rules consumers
  `@`-import into their `CLAUDE.md`. Includes a short "Page templates"
  section that points back here.
- [`docs/react-table-reference.md`](./react-table-reference.md) —
  TanStack Table conventions used inside `<DataTable>`.
- [`README.md`](../README.md) — consumer-facing entry point with the
  "Setup for consumers" section.

---

## 2. App shell

The **app shell** is the outermost authenticated chrome of every knkCMS
solution. It is composed of three columns — sidebar, main, rail — assembled
by the `<AppShell>` template:

```
┌────────────┬────────────────────────────────────────────────────┐
│            │   page header band:                                │
│            │     [ breadcrumb ]                                 │
│            │     [ detail row (avatar · title · actions)      ] │
│            │     [ tabs (optional)                            ] │
│  Sidebar   ├────────────────────────────────────┬───────────────┤
│   240px    │         Main content               │ ContextRail   │
│ ↔ 60px     │            (fluid)                 │    360px      │
│ collapsed  │                                    │  ↔ 44px       │
│            │                                    │  collapsed    │
└────────────┴────────────────────────────────────┴───────────────┘
```

### Dimensions

| Element       | Expanded width | Collapsed width | Collapse breakpoint |
|---------------|----------------|-----------------|---------------------|
| `<Sidebar>`   | 240px          | 60px (icon rail) | < 1440px viewport  |
| `<ContextRail>` | 360px (opt-in resizable, §4) | 44px (icon-only) | < 1440px viewport  |
| Main column   | fluid (`1fr`) | —                | —                   |

Both side columns persist their collapsed state to `localStorage` via the
`storageKey` prop (e.g. `storageKey="odon-sidebar-collapsed"`). On first
visit at viewport width < 1440px both columns start collapsed; otherwise
they start expanded.

### Responsive behavior

The shell does **not** auto-rearrange below 768px (mobile is out of scope
for the 1.x knkCMS surface — these are power-user web tools). On tablet
viewports (768–1439px) both columns default to collapsed. On desktop
(≥ 1440px) both default to expanded.

### Host contract

`<AppShell>` is a **host** in the sense of `@knkcs/anker/host` (ADR 0003):
it mounts `<HostProvider>` itself and renders the page header band in grid
row 1 from the **page frame** the page templates report. A template does
not draw its header; it calls `usePageFrame({ title, subtitle, eyebrow,
breadcrumbs, avatar, badges, meta, tabs, actions, sticky })` — the same
fields as `<PageHeader>` — and the nearest provider decides how to render
that state. Under `<AppShell>` it becomes a `<PageHeader>`; under a host that
draws its own frame (core) it becomes that host's header, with no
`<AppShell>` anywhere on the page. The same contract carries each screen's
**side rail** on a channel of its own — `usePageRail(node)` reports to the
provider's `onRailChange`, and the host renders the node wherever its layout
puts rails (`<AppShell>`: the rail column) — and `HostIdentity` (user id,
workspace id, members) from the host to every screen through
`useHostIdentity()`. The rail is deliberately not a `PageFrame` field: the
frame mirrors `<PageHeader>`'s props exactly. A third channel carries the
screen's **actions** — `useScreenActions(actions)` — as plain data rather than
nodes, because the host draws them in controls of its own: `HostSidebar`
(`@knkcs/odon-ui`) shows them as "On this page" in its "+ New" menu.

```tsx
// A screen reports what can be done on it.
import { useScreenActions } from "@knkcs/anker/host";

function TaskList() {
  const can = usePermissions();
  useScreenActions([
    { id: "new-task", label: "New task", icon: <Plus size={16} />, shortcut: "N",
      onSelect: () => setCreating(true) },
    { id: "import", label: "Import tasks", icon: <Upload size={16} />,
      to: "/tasks/import", isAllowed: () => can("tasks:import") },
  ]);
  …
}

// The host's sidebar reads them, from anywhere under the same provider.
import { useReportedScreenActions } from "@knkcs/anker/host";

const onThisPage = useReportedScreenActions().filter((a) => a.isAllowed?.() ?? true);
```

A `ScreenAction` has an `id`, a `label`, an optional `icon` (a node, as
anker's other icon props), an optional `shortcut` (a display label — the
contract binds no key), an optional `isAllowed` predicate, and either an
`onSelect` handler or a `to` route (the host follows it with its router).
The host leaves out — never disables — an action whose `isAllowed()` returns
`false`. Fresh `onSelect` and `isAllowed` closures each render are fine: the
reported action always calls the screen's latest ones, and only a change in
the data (id, label, shortcut, route, icon) or in a predicate's answer
re-reports — so keep `isAllowed` pure and cheap, the hook calls it after each
render. `[]` is reported when the screen unmounts.

```tsx
// A host that is not AppShell: provide once, render the frame yourself.
import { HostProvider, type PageFrame } from "@knkcs/anker/host";

function CoreFrame({ identity, children }) {
  const [frame, setFrame] = useState<PageFrame | null>(null);
  const [rail, setRail] = useState<ReactNode>(null);
  return (
    <>
      <CoreHeader title={frame?.title} crumbs={frame?.breadcrumbs} actions={frame?.actions} />
      <HostProvider identity={identity} onFrameChange={setFrame} onRailChange={setRail}>
        {children /* screens built on the page templates */}
      </HostProvider>
      {rail ? <CoreRightColumn>{rail}</CoreRightColumn> : null}
    </>
  );
}
```

Rules that follow:

- **Keep the frame state in a component that receives the screens as
  `children`** (as above, and as `<AppShell>` does). A frame may carry a
  fresh element each render; a host whose re-render re-created the screen
  tree would loop.
- **Reported nodes render outside the screen's providers.** A host draws
  a reported frame's `actions` (and its other node fields) and a reported
  rail node where its layout puts them — outside the providers the screen
  mounts. Such a node must not read screen-local context (a form context,
  a provider the screen itself mounts); it closes over the state it needs
  or takes handlers instead. The case to avoid: `<DirtyCounter />` reads
  `useFormContext`, so reported as a toolbar action it counts only where a
  form provider happens to sit above the spot the host draws it, and under
  a host that draws it elsewhere silently renders nothing. Build the chip
  from the dirty state the screen already holds (`formState` read inside
  the screen) instead.
- **Without a provider `usePageFrame`, `usePageRail` and `useScreenActions`
  are no-ops**, `useHostIdentity()` returns `emptyHostIdentity` and
  `useReportedScreenActions()` returns `[]` — a template rendered in a story
  or an isolated test needs no wrapper.
- **A nested provider without an identity inherits its parent's**; frames
  and rails are captured by the nearest provider. So `<HostProvider identity=…>`
  above an `<AppShell>` supplies identity to everything inside the shell,
  while the shell keeps drawing the header and rail. The reverse does not
  hold: a provider mounted *inside* the shell captures (and, without sinks,
  drops) the frames and rails of the screens beneath it. Screen actions are
  captured by the nearest provider too, and `useReportedScreenActions()`
  reads that provider's — so a `HostSidebar` passed as `<AppShell sidebar>`
  sees the actions of the screens inside the shell.
- **Bespoke chrome wins.** A node registered through the opaque header slot
  below is rendered instead of the reported frame.
- **`usePageActions` is a slot, not part of the contract.** A template
  reports registered actions only under `<AppShell>`; under a foreign host
  pass `actions` to the template.
- **`<TestHost ref>`** (same subpath) captures the last reported frame,
  rail and actions (`host.current.frame`, `host.current.rail`,
  `host.current.actions`) and takes a settable
  identity for a package's render-smoke tests.

### Slot mechanism

`<AppShell>` also installs a slot store on its descendants via React
context, for bespoke chrome and rails. Three named slots are exposed
(`rail` is filled from the host contract):

- **`actions`** — registered via `usePageActions(content)`. Surfaced by
  the active page template as its reported frame's `actions` when the
  template was given none explicitly.
- **`header`**  — registered via `usePageHeader(content)`. Surfaced as the
  body of grid row 1, spanning the main column and the rail column — the
  same row the reported frame's `<PageHeader>` occupies, which it replaces.
  For header chrome a template cannot express; the templates themselves no
  longer use it.
- **`rail`**    — reported via `usePageRail(content)` (`@knkcs/anker/host`,
  also re-exported from `/templates`) to the nearest `HostProvider` — under
  `<AppShell>` the shell's own, whose rail sink fills this slot. Surfaced as
  the body of the right rail column. Under a host without `<AppShell>` the
  same call reaches that host's `onRailChange`.

`<AppShell>` is an **internal-scroll** shell: the grid is exactly `100vh` and
never scrolls the document (`overflow: hidden`). The header band is fixed in
grid row 1; the sidebar, main column, and rail each scroll **internally**. The
sidebar's account footer and the rail therefore stay pinned to the viewport
while their content scrolls. When the page header includes a tabs row, the rail
and main content begin **below the entire header band**.

The store uses `useSyncExternalStore` so that producers (deep child
components rendered after the consumer) and consumers (AppShell, the page
templates) stay decoupled across React commit boundaries. See
[Section 12](#12-slot-mechanism) for full details and rationale.

### Composition example

```tsx
import { AppShell, usePageRail } from "@knkcs/anker/templates";
import { Sidebar, ContextRail } from "@knkcs/anker/components";

export default function Layout({ children }) {
  return (
    <AppShell sidebar={<MyAppSidebar />}>
      {children}
    </AppShell>
  );
}

// Inside any descendant of <AppShell>:
function UsersPage() {
  usePageRail(
    <ContextRail>
      <ContextRail.Header eyebrow="OVERVIEW" title="Users" />
      <ContextRail.Section id="stats" label="Stats">
        42 total users
      </ContextRail.Section>
    </ContextRail>,
  );
  return <IndexPageTemplate title="Users">…</IndexPageTemplate>;
}
```

### Column surfaces

Each column has a defined surface and a 1px divider separates them. This is
the anker visual contract — consumers should not override.

| Column   | Surface           | Token        | Left divider |
|----------|-------------------|--------------|--------------|
| Sidebar  | gray (page frame) | `bg-canvas`  | —            |
| Main     | gray (page frame) | `bg-canvas`  | 1px `border` against sidebar |
| Rail     | white (content)   | `bg-surface` | 1px `border` against main |

The sidebar and main columns share `bg-canvas` for a consistent calm
page background — Cards (with `bg-surface`/white) sit on the canvas and
stand out clearly. The rail column stays on `bg-surface` so detail-rail
content reads as a separate workspace, not a continuation of the main
content. The `borderLeftWidth="1px" borderColor="border"` between
columns provides structural separation independent of background.

Page templates (`<IndexPageTemplate>`, `<DetailPageTemplate>`,
`<SettingsPageTemplate>`, `<DashboardPageTemplate>`) inherit the main
column's `bg-canvas` — they do not set their own background. This means
a template rendered standalone (e.g. in a Storybook story without an
`<AppShell>` parent) inherits whatever surface its wrapper provides.

### Rail precedence

When both a `rail` prop *and* a descendant `usePageRail(content)` are
present, **registered slot content wins** and the `rail` prop acts as a
fallback. Rationale: a descendant explicitly registering content is
signaling "show this here", which should trump the static prop.

The rail column is reserved (the third grid track is added) when *either*
a `rail` prop is supplied *or* a descendant has registered rail content
via `usePageRail`. Omit both (or pass `rail={null}`) and AppShell drops
the third grid column entirely — the main column expands to fill the
freed space. This is the right shape for solutions that don't have a
contextual side panel.

---

## Page header anatomy

The page header band is one `<PageHeader>` instance, rendered by
`<AppShell>` from the page frame a page template reports through
`usePageFrame` (see §2 "Host contract"). It renders up
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

**Detail page example:**

```tsx
<DetailPageTemplate
  breadcrumbs={[{ label: "Identity", to: "/identity" }, { label: "Users", to: "/identity/users" }, { label: "Jana Schmid" }]}
  title="Jana Schmid"
  avatar={<Avatar name="Jana Schmid" size="lg" />}
  badges={<><Badge colorPalette="success">Aktiv</Badge><Badge colorPalette="blue">Admin</Badge></>}
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
```

**Index page example:**

```tsx
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
```

Index pages omit `avatar`, `badges`, and `meta` — the detail row collapses
to title + actions.

---

## 3. Sidebar IA

The sidebar is the global navigation surface. It is the first thing users
see on every page and the only navigation surface that is always visible
in the chrome.

**Every Host's sidebar is `HostSidebar` from `@knkcs/odon-ui`** — the
Workspace Picker in the header, the Account Popup in the footer, and the
Host's navigation between them, passed as data. A Host does not assemble
the header and footer itself. The decision, and why the component lives in
odon-ui rather than in anker, is
[odon ADR 0009](https://github.com/knkCS/odon/blob/main/docs/adr/0009-every-hosts-sidebar-comes-from-odon-ui-hostsidebar.md).
`HostSidebar` is built on anker's compound `<Sidebar>`; the anatomy and
item rules below describe that compound component and govern the
navigation a Host passes in. core keeps its own sidebar until its
redesign (same ADR).

### Section anatomy

A sidebar is composed of:

1. **`<Sidebar.Header>`** — fixed-height header band. Contains
   `<Sidebar.Logo>` (wordmark + optional subtitle + collapse toggle) and,
   in a Host, the Workspace Picker.
2. **`<Sidebar.Body>`** — scrolling section list. Contains zero or more
   `<Sidebar.Section>`s, each of which contains zero or more
   `<Sidebar.Item>`s.
3. **`<Sidebar.Footer>`** — fixed-height footer band. In a Host it holds
   the Account Popup (see "Footer" below).

### `<Sidebar.Section>` structure

Each section has a single `label` prop (uppercased, muted overline) plus
its children. Sections render their label only in the expanded state —
when collapsed, the label is hidden and items become icon-only with
hover tooltips.

```tsx
<Sidebar.Section label="Identity">
  <Sidebar.Item icon={<Users size={16} />} active>Users</Sidebar.Item>
  <Sidebar.Item icon={<Building2 size={16} />}>Organizations</Sidebar.Item>
</Sidebar.Section>
```

### `<Sidebar.Item>` structure

An item is a row with an optional leading icon, a label (its `children`),
and an active-state style. Items integrate with React Router via the
`asChild` prop:

```tsx
<Sidebar.Item asChild active={isActive} icon={<Users size={16} />}>
  <NavLink to="/users">Users</NavLink>
</Sidebar.Item>
```

The `active` state renders the row with a `bg-surface` background, a 1px
inset border, a subtle drop shadow, and a 3px × 14px `primary.700` pill
on the trailing edge. When the sidebar is collapsed, the active state
keeps the background and border but drops the trailing pill (no room).

Sidebar's section + item rendering is implemented via the shared `<NavList>` primitive in `@knkcs/anker/components`. The same primitive powers `<SubNavLayout>` (see § 8 Sub-nav layout). If you need the visual standalone — group label + icon row + count + active pill — import `<NavList>` directly.

### When sections appear vs. when they're empty

- **Show a section** when it has at least one item visible to the current
  user. Empty sections must not be rendered — a section header with no
  items is visual noise.
- **Show all sections** when none are user-context-dependent. If a
  section's visibility depends on permissions, render the whole section
  conditionally.

### Footer

The footer is reserved for the user's account block: the Account Popup,
which `HostSidebar` draws there. A Host does not use `<Sidebar.UserMenu>`
there — it lacks the organization switch and profile link every Host must
offer. It remains an anker component for sidebars that are not a Host's.

The collapse-toggle lives **inside** `<Sidebar.Logo>`, not in the footer.
This was a deliberate move in 1.8.1 — putting the toggle in the header
keeps the footer pure user-action territory.

### Sidebar header and account block

`HostSidebar` (in `@knkcs/odon-ui`) is the standard for both ends of a
Host's sidebar ([odon ADR 0009](https://github.com/knkCS/odon/blob/main/docs/adr/0009-every-hosts-sidebar-comes-from-odon-ui-hostsidebar.md)):

- **Header — Workspace Picker.** Shows the Workspace the user is acting in
  and switches to another. A switch goes through odon's `/switch` and
  returns the user to the same page, provided the Host's origin is allowed
  by odon and its `/auth/login` honours `target` (the round-trip contract
  in the ADR).
- **Footer — Account Popup.** Avatar, display name and active
  organization, opening a menu with the organization switch, the odon
  profile link and sign-out.

Do not wire `WorkspacePicker` and `AccountPopup` into a Host's sidebar by
hand, wrap them in local copies, or copy odon's organization and workspace
clients into the Host: mount `HostSidebar`, which composes them. Both
stay exported from odon-ui for core, which mounts them directly until its
redesign.

### Sub-section pattern: "Personal / Organization / Identity / Admin"

Larger solutions group their navigation into thematic sub-sections.
Odon's Settings sidebar uses this pattern:

```
PERSONAL
  Profile
  Password
  Sessions

ORGANIZATION
  Members
  Settings

IDENTITY
  OAuth Clients
  API Keys

ADMIN
  Users
  Audit Log
```

Each sub-section is a separate `<Sidebar.Section>` with its own `label`.
The order is: most-personal first, most-administrative last. This
matches the user's likely path of investigation when looking for a
setting.

### Body tabs vs. sidebar sub-sections — when to choose which

> **Body tabs vs sidebar sub-sections — when to choose which:**
>
> - Use **body tabs** (DetailPageTemplate `tabs` slot) when the page
>   presents *multiple views of the same entity* — e.g. a user with
>   Profile / Security / Sessions / API Keys tabs. The user is exploring
>   one record; the URL stays at `/users/123/<tab>` and the page chrome
>   stays the same.
>
> - Use **sidebar sub-sections** when the items are *distinct
>   destinations* — e.g. an Admin section with Users / OAuth Clients /
>   Webhooks / Audit Log as separate index pages. Each is a top-level
>   navigation target with its own page header.
>
> **Rule of thumb:** if the in-page navigation keeps the entity identity
> (breadcrumb, avatar, title, badges) constant across the destinations,
> they belong in `tabs` on the page header. If each destination is a
> distinct top-level page with its own breadcrumb and title, render them
> as separate index pages in the sidebar.
>
> Within a single page, prefer the `tabs` row over rendering a custom
> in-body tab strip — it keeps the navigation surface consistent across
> solutions.

---

## 4. ContextRail patterns

The context rail is the **right column** of the app shell — a fixed-width
(unless opted in to a resizable width, below) secondary surface for at-a-glance information that supports the main
content without being part of it, and on a detail page for the things you
do *to* the entity.

> **The header/rail rule (ADR 0004, required):** the `PageHeader` holds the
> page's **one primary action** — Save on an edit page. What you do **to**
> the entity as a whole — cut a release, duplicate, archive, delete, make
> default — goes in the rail's **Actions** section, and an **About** section
> may show at-a-glance facts. The rail never holds Save. See
> `docs/adr/0004-one-save-in-the-header-entity-actions-in-the-rail.md`.

### When to render

Render a rail when a page benefits from showing "what" or "how many" of
the things shown in the main content, without making the user scroll.
Indicators that a rail belongs:

- A list page with > 50 items (rail shows aggregate stats / filters).
- A detail page with related entities (rail shows links to siblings,
  parent records, audit summary).
- A detail page with verbs that act on the entity as a whole (rail's
  Actions section — see §4.2). This holds when the page's tabs are forms:
  such a page **keeps** its quick-actions rail, collapsible, with a
  `storageKey`.
- A page where bulk-selection is a primary action (rail substitutes for
  the bulk-action bar — see below).

### When to hide

- The page is one screen of content (no scroll). The rail would be empty
  air.
- The page is a settings page with nothing to show or do beyond its
  forms. A rail of padding competes with the fields for attention. (A
  detail page whose tabs are forms is *not* this case when its entity has
  actions — keep the rail; see above.)
- The page is a dashboard. Dashboards already aggregate — a rail is
  redundant.
- The page is unauthenticated (auth, marketing, error). These templates
  don't have a shell.

### The three rail variants

#### 4.1 Overview / stats rail (default)

Used on most index and detail pages. Renders a small set of
`<ContextRail.Section>`s with aggregate stats, recent activity, or
filter shortcuts.

```tsx
<ContextRail storageKey="users-rail">
  <ContextRail.Header eyebrow="OVERVIEW" title="Users" />
  <ContextRail.Section id="stats" label="Stats">
    <DataList items={[
      { label: "Total", value: "1,284" },
      { label: "Active (30d)", value: "1,108" },
    ]} />
  </ContextRail.Section>
</ContextRail>
```

#### 4.2 Detail-context rail

Used on detail pages. Two sections, in this order: **Actions** — the verbs
that act on the entity as a whole — and **About** — its at-a-glance facts
(created, owner, status, parent record, audit-log shortcut). Either may be
omitted; Save is never among the actions (it is the header's, §10).

```tsx
const [cutOpen, setCutOpen] = useState(false);
const [duplicateOpen, setDuplicateOpen] = useState(false);
const confirmDelete = useDeleteBlueprintConfirm(); // yours, e.g. built on useConfirmModal

usePageRail(
  <ContextRail storageKey="blueprint-rail">
    <ContextRail.Header eyebrow="BLUEPRINT" title={blueprint.name} />
    <ContextRail.Section id="actions" label="Actions">
      <ContextRail.IconButton label="Cut a release" icon={<Tag />} onClick={() => setCutOpen(true)} />
      <ContextRail.IconButton label="Duplicate" icon={<Copy />} onClick={() => setDuplicateOpen(true)} />
      <ContextRail.IconButton label="Delete" icon={<Trash2 />} tone="outline-red" onClick={confirmDelete} />
    </ContextRail.Section>
    <ContextRail.Section id="about" label="About">
      <DataList items={[
        { label: "Created", value: <RelativeDateTime value={createdAt} /> },
        { label: "Owner", value: owner.name },
      ]} />
    </ContextRail.Section>
  </ContextRail>,
);

// The dialog renders in the screen, not in the rail — see below.
return <CutReleaseModal open={cutOpen} onClose={() => setCutOpen(false)} />;
```

> **Rail actions that open dialogs keep the dialog in the screen.** The
> rail renders outside the screen's providers (§2 "Host contract"), so a
> dialog rendered *inside* the rail node loses the form, query and router
> context it needs. The rail button sets state the screen owns; the screen
> renders the dialog. (knkCS/anker#212 tracks a host rendering that would
> keep the screen's context.)

#### 4.3 Bulk-selection rail

When the user enters a bulk-selection mode (selects ≥ 1 row in a
`<DataTable>` with `selectable`), the rail is substituted for a
`<BulkActionBar>`-style summary: count + actions. The page swaps the
rail content via `usePageRail(<BulkActionBar … />)` for the duration of
the selection.

This is the canonical knkCMS pattern. It replaces the floating
bottom-of-screen action bar that is common in other UIs — pinning bulk
actions to the rail keeps them in a predictable place and avoids
covering the table.

### Collapsed state

When the rail is collapsed, the column narrows to 44px. The floating
collapse toggle remains anchored at the leading edge (see the
"Rail Root contract" subsection). Atom subcomponents — `IconButton`,
`ValueTile`, `StatusIcon`, `Avatar`, `Divider` — render in their compact
form to surface useful content; see "Compact atoms" above. Section
headers and non-atom JSX inside `<ContextRail.Section>` are hidden in
collapsed mode.

The collapse toggle is a small round outline button (28×28, `bg-surface`,
`border`, `shadow-sm`) anchored at `top: 6, left: -3.5` — it floats half-on
the rail's leading edge, mirroring the sidebar's trailing-edge toggle. It
is visually identical in expanded and collapsed states; only the icon
swaps (`PanelRightClose` ↔ `PanelRightOpen`).

### Opening the rail from the screen (`expandOn`)

When the rail holds what the user just acted on — selecting a step in
the workflow editor puts that step's form in the rail — a collapsed rail
would show nothing. Pass the selection as `expandOn` and **the rail opens
itself**:

```tsx
<ContextRail storageKey="workflow-editor-rail" expandOn={selectedStepId}>
  …
</ContextRail>
```

- **A change opens.** Whenever `expandOn` changes to anything but
  `null`, `undefined` or `false`, a collapsed rail expands. An already
  expanded rail stays as it is.
  Values compare by identity (`Object.is`), so pass a stable value — the
  item's id — not an object built on every render, which would re-open the
  rail on each render and override the user's collapse.
- **Like the user's own expand.** The expanded state is stored under
  `storageKey`, exactly as pressing the toggle would; with storage blocked
  or throwing it still expands. A resizable rail expands to its remembered
  width.
- **Not on mount.** The value the rail mounts with does not expand it, so a
  collapse remembered under `storageKey` survives a reload.
- **Deselecting does nothing.** A change to `null`/`undefined`/`false`
  leaves the rail alone. The user's collapse is respected until the value
  changes again — selecting another item (or the same one after a
  deselect) re-opens the rail.
- **Focus stays put.** Expanding does not move focus; it stays where the
  user acted (on the canvas, in the list).
- **Without `expandOn`** no rail changes.

### Tabs (`ContextRail.Tabs`)

A rail that holds two kinds of information at different rhythms — what
concerns the entity, and what concerns the cursor — splits its sections
into **tabs under the header** instead of one long list:

```tsx
const [tab, setTab] = useState("branch"); // the screen's state
const [inspectRequest, setInspectRequest] = useState(0);

usePageRail(
  <ContextRail storageKey="branch-rail" expandOn={inspectRequest || undefined}>
    <ContextRail.Header eyebrow="BRANCH" title={branch.name} />
    <ContextRail.Tabs label="Rail" value={tab} onValueChange={setTab}>
      <ContextRail.Tab
        value="branch"
        label="Branch"
        icon={<GitBranch size={14} />}
        indicator={{ kind: "badge", count: blockers, label: `${blockers} blockers` }}
      >
        <ContextRail.Section id="actions" label="Actions">…</ContextRail.Section>
        <ContextRail.Section id="about" label="About">…</ContextRail.Section>
      </ContextRail.Tab>
      <ContextRail.Tab
        value="field"
        label="Field"
        icon={<ScanSearch size={14} />}
        indicator={fieldFocused ? { kind: "dot", label: "A field has focus" } : undefined}
      >
        <ContextRail.Section id="inspector" label="Content · Rich Text">…</ContextRail.Section>
      </ContextRail.Tab>
    </ContextRail.Tabs>
  </ContextRail>,
);

// Asking to inspect selects the tab and opens the rail in one render.
const inspect = () => {
  setTab("field");
  setInspectRequest((n) => n + 1);
};
```

- **Controlled.** `value` is the selected tab, `onValueChange` reports the
  user's choice; nothing changes until the caller applies it. The tab is
  the screen's state, held **above** the rail: a reported rail is drawn
  outside the screen's providers, and the rail swaps its body when it
  collapses or expands, so state kept inside rail content does not survive.
  A `value` that names no tab selects the first.
- **One panel.** Each `<ContextRail.Tab>`'s children are its panel — its
  `ContextRail.Section`s. Only the selected tab's panel renders; switching
  tabs unmounts the other (a section's open/closed state starts afresh).
- **Indicator.** Optional, per tab: `{ kind: "badge", count, label }` shows
  the count, `{ kind: "dot", label }` a dot. `label` is added to the tab's
  accessible name ("Branch, 3 blockers"). A badge with a count of 0 or less
  shows nothing, so pass the count unconditionally; no indicator shows
  nothing.
- **Keyboard and screen readers.** A `role="tablist"` (named by `label`)
  of `role="tab"` buttons and one `role="tabpanel"`. ←/→ move between tabs
  (flipped under `dir="rtl"`) and wrap, Home/End jump to the first/last;
  selection follows focus, counted from the focused tab. Only the selected
  tab is in the tab order.
- **Collapsed (44px).** Each tab is a `ContextRail.IconButton` — its icon
  with the indicator on it, the label (and indicator label) as tooltip and
  accessible name; the selected tab is outlined. Activating one **expands
  the rail on that tab**, stored under `storageKey` like the toggle. Below
  the tab buttons the selected tab's compact atoms render as in any
  collapsed rail.
- **With `expandOn`.** Unchanged: a change expands a collapsed rail with
  tabs as it does without. To select a tab *and* open the rail — asking to
  inspect something — set `value` and change `expandOn` in the same update.

### Resizable width (opt-in)

A rail whose content needs room the user decides on — the workflow
editor's step form — passes `resizable` with a default, a minimum and a
maximum width in pixels. **Without `resizable` a rail keeps its fixed
360px**; no other rail changes.

```tsx
<ContextRail
  storageKey="workflow-editor-rail"
  resizable={{
    defaultWidth: 360,
    minWidth: 320,
    maxWidth: (space) => space / 2, // half of the main area
  }}
>
  …
</ContextRail>
```

- **Handle.** The rail's leading edge carries a drag handle (a thin strip,
  `col-resize` cursor, below the collapse toggle). Dragging left widens,
  dragging right narrows; a **double-click resets** to `defaultWidth`.
- **Keyboard and screen readers.** The handle is a focusable
  `role="separator"` (`aria-orientation="vertical"`, label "Resize context
  rail") announcing `aria-valuenow` with `aria-valuemin`/`aria-valuemax`.
  ← widens and → narrows by 16px, always within the bounds.
- **Bounds.** `maxWidth` is a number or a function of the **space** the
  rail shares with the main column — the rail's right edge minus the left
  edge of the element before the rail's column (AppShell's main column) —
  re-measured on window resize and when a resize starts. While it cannot be
  measured, the function form imposes no maximum. Choose `minWidth` so the
  main column keeps its own minimum beside it; when the maximum falls below
  the minimum the **maximum wins**, so the main column keeps its room, and
  the separator announces that maximum as its minimum too (a screen that
  needs the rail's minimum regardless opens it as an overlay).
- **Persistence.** The width is remembered under `${storageKey}:width`,
  beside the collapsed flag at `storageKey`. A stored width is clamped into
  the bounds; garbage, or storage that is blocked or throws, falls back to
  `defaultWidth`. Only the user's resizing stores a width: a window too
  narrow for the stored width shows it clamped without overwriting it.
- **Collapse is unchanged.** The toggle still collapses to the 44px column
  with its compact atoms (the handle is hidden there); expanding returns to
  the remembered width.

### Compact atoms

The rail's 44px collapsed column surfaces useful content via five
mode-aware atom subcomponents. Each renders an expanded form when the
rail is open and a compact 32×32 form (with a left-placed tooltip) when
collapsed.

| Atom | Purpose | Tones |
|------|---------|-------|
| `<ContextRail.IconButton>` | Clickable action with tooltip. | `default · primary · outline-red · outline-primary · ghost` |
| `<ContextRail.ValueTile>` | A number-with-tooltip. Hidden in collapsed mode when value is zero/empty unless `keepWhenEmpty`. | `default · muted` |
| `<ContextRail.StatusIcon>` | Semantic state indicator. | `success · warning · danger · info · neutral` (legacy aliases: `green · amber · red · gray`) |
| `<ContextRail.Avatar>` | Compact entity identity. | — |
| `<ContextRail.Divider>` | Visual grouping. Renders narrow in collapsed mode. | — |

Place atoms inside `<ContextRail.Section>` for expanded-mode grouping with
a labeled header, or at the top level of `<ContextRail>` (siblings of
`<Section>`) for simpler rails. In collapsed mode, section headers and
non-atom JSX inside sections are hidden — only atom-tagged children render.

**Tone guidance for StatusIcon:**

The tones are anker's status palettes (§11 Status palettes): the circle
paints the palette's `subtle` tint behind its `fg` colour, so it matches
the rest of the UI and follows light and dark mode.

- `success` — healthy, no action needed.
- `warning` — needs attention soon, low adoption, at risk.
- `danger` — action required, broken state.
- `info` — informational notice, in progress.
- `neutral` — no status meaning (the `gray` palette; rarely needed —
  ValueTile usually fits better).

`green`, `amber`, `red` and `gray` are legacy aliases of `success`,
`warning`, `danger` and `neutral`: they render identically and keep
existing screens working. Prefer the palette names in new code.

**Example:**

```tsx
<ContextRail storageKey="users-rail">
  <ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
  <ContextRail.Section id="users" label="Users">
    <ContextRail.ValueTile value={total} label="Total users" />
    <ContextRail.ValueTile value={active} label="Active users" muted />
  </ContextRail.Section>
  <ContextRail.StatusIcon tone="warning" icon={<Shield />} label="2FA: 0 of 100 enabled" />
  <ContextRail.Divider />
  <ContextRail.IconButton label="Invite user" icon={<UserPlus />} onClick={…} />
</ContextRail>
```

### Rail Root contract (required)

> **Rail Root contract (required):** rail content MUST be wrapped in
> `<ContextRail>` (the Root). The Root provides the column width
> (360px expanded — or resizable, see "Resizable width" — / 44px
> collapsed), the floating collapse toggle
> (mirrors `<Sidebar>` on the leading edge), inner padding, and
> persistence (`storageKey` prop). Using
> `<ContextRail.Header>` or `<ContextRail.Section>` inside a fragment
> renders without errors — but you'll be missing all of those features.
>
> **Correct:**
>
> ```tsx
> usePageRail(
>   <ContextRail storageKey="rail-users-overview">
>     <ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
>     <ContextRail.Section …>…</ContextRail.Section>
>   </ContextRail>
> );
> ```
>
> **Incorrect (silent failure mode):**
>
> ```tsx
> usePageRail(
>   <>
>     <ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
>     <ContextRail.Section …>…</ContextRail.Section>
>   </>
> );
> // ❌ no width, no collapse, no padding
> ```
>
> In development, anker logs a `console.warn` once per mount when
> `<ContextRail.Header>` or `<ContextRail.Section>` is rendered outside
> a `<ContextRail>` Root. The warning is silenced in production.

### Rail-header contract

> **Rail-header contract (required for alignment):** rail content MUST
> start with `<ContextRail.Header>` (eyebrow + title) so the rail's top
> has a structural element matching the PageHeader's height in the page
> column. Without it, the PageHeader's bottom border (which is inside
> the page-content column) doesn't visually align with anything in the
> rail column, and the rail appears to float above the page divider.
>
> Example:
>
> ```tsx
> usePageRail(
>   <ContextRail>
>     <ContextRail.Header eyebrow="WORKSPACE" title="Overview" />
>     <ContextRail.Section …>…</ContextRail.Section>
>   </ContextRail>,
> );
> ```

### Common rail mistakes

1. **Missing `<ContextRail>` Root wrapper.** Rendering
   `<ContextRail.Header>` / `<ContextRail.Section>` inside a fragment
   silently strips the column width, collapse toggle, padding, and
   persistence. See the Rail Root contract above. anker emits a
   dev-mode `console.warn` when this happens.
2. **Missing `<ContextRail.Header>`.** The #1 cause of misalignment
   between the PageHeader bottom border and the rail content. Always
   start a rail with `<ContextRail.Header>` — see the rail-header
   contract above.
3. **Rendering an empty-air rail on a settings page.** A rail with
   nothing to show or do beside the forms competes with them for
   attention. See "When to hide" above — and note the opposite mistake:
   dropping a detail page's quick-actions rail because its tabs are forms.
4. **Putting the primary action in the rail.** The page's one primary
   action — Save on an edit page — belongs in the PageHeader's `actions`
   (the template's `actions` prop). The rail never holds Save; it holds
   what you do *to* the entity (§4.2).

---

## 5. PageHeader anatomy

`<PageHeader>` is the **per-page header band** rendered at the top of
every authenticated content area. It is *not* part of the app shell —
each page renders its own.

### Anatomy

```
┌────────────────────────────────────────────────────────────┐
│ Identity › Users › Jana Schmid                             │ ← breadcrumbs (optional)
│                                                            │
│ Jana Schmid                              [Edit] [Delete]   │ ← title + actions
│ jana.schmid@knk.de                                         │ ← subtitle (optional)
└────────────────────────────────────────────────────────────┘
```

### Slots

| Slot          | Type           | Notes                                                    |
|---------------|----------------|----------------------------------------------------------|
| `eyebrow`     | `ReactNode`    | Optional uppercase overline above breadcrumbs            |
| `breadcrumbs` | `Crumb[]`      | Optional. Each crumb is `{ label, to? }`. Last is current |
| `title`       | `ReactNode`    | Required. Rendered as `<h1>` 24px semibold default       |
| `subtitle`    | `ReactNode`    | Optional. 14px muted, mt="1"                             |
| `actions`     | `ReactNode`    | Optional. Right-aligned button cluster                   |

### Sizing rules

The PageHeader is **always single-band** (one row of vertical space at
`py="4" px="8"`). When subtitle or breadcrumbs are present, they
compress into the same band — the row grows vertically but the band
boundaries don't change.

There is no "two-line" variant. If you need more than what the slots
support (e.g. an inline status pill next to the title), render it inside
the `actions` slot or wrap the title:

```tsx
<PageHeader
  title={
    <Flex align="center" gap="2">
      <span>Jana Schmid</span>
      <StatusBadge label="Active" tone="success" />
    </Flex>
  }
/>
```

### Breadcrumb max depth

The recommended max is **4 segments** (workspace › section › list ›
detail). Beyond that, fold intermediate crumbs into a single
"… (parent)" item — but most knkCMS hierarchies don't go that deep.

---

## 6. Toolbar anatomy

`<Toolbar>` is the per-page filter strip rendered between the
`<PageHeader>` (or `<Tabs.List>` if present) and the page body, on list
pages.

### Anatomy

```
┌────────────────────────────────────────────────────────────┐
│ [Search…]  [filter] [filter]            42 items   [Sort] │
└────────────────────────────────────────────────────────────┘
   ──Search──  ───Filters───            ─Right─    ─Right─
```

### Slots

| Subcomponent             | Position | Use                                             |
|--------------------------|----------|-------------------------------------------------|
| `<Toolbar.Search>`       | Left     | Free-text search                                |
| `<Toolbar.Filters>`      | Left     | Container for `<Toolbar.FilterChip>`s, selects  |
| `<Toolbar.FilterChip>`   | inside Filters | Single chip with active/inactive state    |
| `<Toolbar.Right>`        | Right    | Container for count + secondary actions         |
| `<Toolbar.Count>`        | inside Right | "{n} items" muted text                       |

The `<Toolbar>` root is fixed-height (48px) and uses `bg-subtle` so it
visually separates from the white page body.

### BulkActionBar substitution

When the user selects ≥ 1 row in the page's table, the toolbar should
**not** persist below the bulk action bar. Solutions can either:

1. Hide the toolbar and replace it with `<BulkActionBar>` in the same
   slot (what odon does), or
2. Keep the toolbar visible and float `<BulkActionBar>` at the bottom
   of the rail / viewport.

Option 1 is the canonical pattern. The page-level escape hatch:

```tsx
{selectedCount > 0
  ? <BulkActionBar selectedCount={selectedCount} onClear={…}>…</BulkActionBar>
  : <Toolbar>…</Toolbar>}
```

---

## 7. Tab patterns

Tabs are used as the primary navigation device **inside** a page (not as
the global navigation — that's the sidebar's job).

### Placement

Tabs are rendered:

- **Inside `IndexPageTemplate`**: under the PageHeader, above the
  Toolbar.
- **Inside `DetailPageTemplate`**: under the PageHeader, above the
  page body.
- **Inside `SettingsPageTemplate`**: under the PageHeader, above the
  page body. Required (settings pages without tabs use
  `DetailPageTemplate`).

The `tabs` slot accepts a full `<Tabs.Root>` (with `<Tabs.List>` and
`<Tabs.Content>`s). The template renders the root inside its layout —
it does **not** wrap the tabs in any other container.

### Value semantics

Tab values should be URL-friendly slugs (`profile`, `password`, `mfa`)
that map directly to a route segment. The recommended pattern is to
mirror the active tab into the URL (`?tab=profile` or
`/settings/profile`) so deep-links work and the browser back-button
behaves naturally.

### Content alignment: flush vs. padded

`SettingsPageTemplate` applies body padding by default (`px="8" pt="6"`)
to align Card-wrapped forms with the `<PageHeader>`'s horizontal inset.
`IndexPageTemplate` and `DetailPageTemplate` render the body flush (no
padding) — DataTables extend edge-to-edge without any consumer-side
workarounds.

When a `SettingsPageTemplate` tab body is a `<DataTable>` (or any other
component that must render flush to the page edges), pass
`bodyPadding="none"`:

```tsx
<SettingsPageTemplate
  title={...}
  tabs={...}
  bodyPadding="none"
  maxBodyWidth="full"
>
  <Tabs.Content value="general">
    {/* form-Card tabs still need padding — add your own */}
    <Box px="8" py="6">
      <Card>...</Card>
    </Box>
  </Tabs.Content>
  <Tabs.Content value="members">
    <DataTable ... />  {/* renders flush */}
  </Tabs.Content>
</SettingsPageTemplate>
```

When tabs in the same page mix flush and padded content, set
`bodyPadding="none"` at the template level and let each tab apply its
own `<Box px="8" py="6">` for the padded ones. Avoid negative margins
(`mx="-8"`) — they couple consumers to the template's exact spacing and
break silently if the template's padding ever changes.

### `<Tabs.Root>` wrapping conventions

The `<Tabs.List>` should always be wrapped in a `<Box px="8">` so the
tab list aligns with the PageHeader's `px="8"` padding:

```tsx
<Tabs.Root defaultValue="active" variant="line">
  <Box px="8">
    <Tabs.List>
      <Tabs.Trigger value="active">Active</Tabs.Trigger>
      <Tabs.Trigger value="invited">Invited</Tabs.Trigger>
    </Tabs.List>
  </Box>
  <Tabs.Content value="active">…</Tabs.Content>
  <Tabs.Content value="invited">…</Tabs.Content>
</Tabs.Root>
```

Use `variant="line"` for content tabs (anker default). Avoid
`variant="enclosed"` — it competes visually with Cards inside the body.

---

## 8. Sub-nav layout

`<SubNavLayout>` is the inner layout primitive for **multi-resource navigation inside a `<DetailPageTemplate>` tab body**: a grouped vertical nav on the left and a detail pane on the right, separated by a vertical divider with a collapse toggle.

It is distinct from:
- `<Sidebar>` (page-level chrome owned by `<AppShell>`)
- Tabs in `<PageHeader>` (page-level navigation between tab bodies)
- `<ContextRail>` (optional third column to the right)

### Composition

```
AppShell
├── Sidebar
├── DetailPageTemplate
│   └── tab body
│       └── SubNavLayout
│           ├── .Nav     (NavList.Group × N)
│           └── .Detail
│               ├── .Toolbar (optional)
│               └── children (DataTable, editor, …)
└── ContextRail   (optional)
```

`<SubNavLayout>` sits flush in the main column — no card wrapper, no padding, no border on the layout root. The divider between Nav and Detail is `border-left: 1px solid border` on `.Detail`.

### When to use

- A tab body has 2+ resource categories of different types (e.g. Catalogs = page geometries / fonts / glue / colors / master pages).
- Each category has its own table or editor.
- The active category benefits from URL deep-linking (e.g. `/catalogs/glue`).

### When not to use

- The tab body is one homogeneous list — use `<DataTable>` directly.
- The categories are filters of one underlying list — use filter chips in `<Toolbar>`.
- The categories are independent destinations with their own page chrome — those belong as siblings in `<Sidebar>`, not inside a sub-nav.

### Geometry

| Element | Expanded | Collapsed |
|---|---|---|
| `.Nav` width | `220px` | `56px` |
| `.Detail` width | `1fr` | `1fr` |
| Transition | `grid-template-columns 250ms ease-out` | — |

### Collapse behavior

`<SubNavLayout storageKey="…">` persists collapse state to `localStorage`. Item labels, group labels, counts, and the active pill hide when collapsed; the icon centers and a `<Tooltip>` shows the label on hover. The toggle button uses `PanelLeftClose` / `PanelLeftOpen` icons and floats centered on the divider.

**Storage-key convention:** `<feature>-subnav` (e.g. `catalogs-subnav`). Avoid colliding with `<Sidebar>` keys (`<feature>-sidebar`) and `<ContextRail>` keys (`<feature>-rail`).

### Three-column example

```tsx
<AppShell sidebar={<MySidebar />} rail={<MyContextRail />}>
  <DetailPageTemplate
    breadcrumbs={…}
    title="Boorberg Standard"
    badges={…}
    tabs={<CatalogsTabs />}
  >
    <SubNavLayout storageKey="catalogs-subnav">
      <SubNavLayout.Nav aria-label="Catalogs sub-navigation">
        <NavList.Group label="Page">…</NavList.Group>
        <NavList.Group label="Typography">…</NavList.Group>
        <NavList.Group label="Visual">…</NavList.Group>
      </SubNavLayout.Nav>

      <SubNavLayout.Detail>
        <SubNavLayout.Toolbar>
          <Input placeholder="Filter patterns…" />
          <Text fontSize="xs" color="muted">10 patterns · ordered by usage</Text>
          <Button colorPalette="primary" ml="auto">+ Add pattern</Button>
        </SubNavLayout.Toolbar>
        <DataTable … />
      </SubNavLayout.Detail>
    </SubNavLayout>
  </DetailPageTemplate>
</AppShell>
```

### Nested items (tree)

When the nav lists a tree — a table node with its row and cell, a list
with its item, an outline — the parent `<NavList.Item>` holds its children
in `subItems`. They render indented below it while it is expanded, and they
can hold children of their own.

```tsx
<NavList.Item
  asChild
  active={selected === "table"}
  expanded={open.has("table")}
  onExpandedChange={(next) => setOpen(toggle(open, "table", next))}
  indicator={hiddenChildDirty ? <DirtyDot /> : null}
  subItems={
    <NavList.Item asChild active={selected === "row"}>
      <button type="button" onClick={() => select("row")}>Row</button>
    </NavList.Item>
  }
>
  <button
    type="button"
    onClick={() => select("table")}
    aria-label={hiddenChildDirty ? "Table, unsaved changes" : undefined}
  >
    Table
  </button>
</NavList.Item>
```

| Prop | Meaning |
|---|---|
| `subItems` | The child `NavList.Item`s. Empty (every child filtered out) renders a plain item. |
| `expanded` / `onExpandedChange` | Controlled open state. The consumer owns it: persistence, auto-expanding the parents of the selected (or invalid, or dirty) item, search hits, Expand all / Collapse all in a toolbar. `defaultExpanded` for uncontrolled use. |
| `indicator` | The roll-up slot at the end of the row, visible open or closed — a closed parent shows its hidden child's status dot here. Visual only: say the same thing in the label's accessible name. |
| `toggleAriaLabel` | The chevron's name. Default `"Toggle {label}"`; its state is `aria-expanded`. |

Rules:

- **The chevron only toggles; the label keeps its own action.** The chevron
  is a separate button at the row start, over the label's start padding —
  never inside the label — so one click never both selects and toggles.
- **Keys:** with a parent's label or chevron focused, Arrow Right opens it
  (or, if open, moves to its first child) and Arrow Left closes it; Arrow
  Left on a child moves focus to its parent. Up / Down are not taken —
  Tab moves between rows, as in the rest of `NavList`.
- **Semantics:** the chevron carries `aria-expanded` and `aria-controls`;
  the children sit in a `role="group"` named after the parent. Collapsed
  children are not rendered.
- **Alignment:** once a level holds a parent, every label at that level
  leaves room for the chevron, so leaves and parents line up; each level
  indents by `spacing.5`. A flat list renders exactly as before.
- **On the collapsed rail** the chevron and indentation drop: the open
  items list as icons with tooltips, and the `indicator` overlays the icon
  (unless a `badge` already sits there). The keys still work.

### SubNavLayout sizing

`<SubNavLayout>` self-stretches to fill its parent's height. The only
requirement on the parent is that it have a definite height. Inside a
page template's main column this is automatic — page templates establish
the grid row that gives content its height.

Outside a page template (e.g. inside a tab body), wrap the SubNavLayout
in a container with a definite height:

```tsx
// in a tab body inside a fixed-height shell
<Box flex="1" minH="0">
  <SubNavLayout …>…</SubNavLayout>
</Box>
```

Or set `h="100%"` if the parent has explicit height. Without a definite
parent height, the rail collapses to its content height.

---

## 9. Modal patterns

Two modal types exist:

- **Form modal** — `<Modal>` with body fields and a save/cancel footer.
- **Confirm dialog** — `useConfirmModal()` for destructive actions.

### Form modal (`<Modal>`)

Use `<Modal>` for inline create/edit flows where opening a full-page
form is overkill (e.g. "Add API key", "Invite member").

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  header="Invite member"
  onSave={handleSave}
  saveLabel="Send invite"
  loading={pending}
>
  <FormField name="email" label="Email">
    <TextInput />
  </FormField>
</Modal>
```

| Slot          | Role                                              |
|---------------|---------------------------------------------------|
| `header`      | Title (string or ReactNode)                       |
| `children`    | Body — typically `<FormField>`s                   |
| `footer`      | Footer override. Default: Cancel + Save buttons.   |
| `onSave`      | Save handler. Required for default footer.         |
| `saveLabel`, `cancelLabel`, `closeLabel` | Strings, English defaults. |

Modals use `<Dialog.Root size="xl">` by default (~720px wide). Override
via the `size` prop (`"sm"`, `"md"`, `"lg"`, `"xl"`, `"full"`).

### Confirm dialog (`useConfirmModal`)

Use for destructive actions (delete user, revoke key, sign out
everywhere). The hook returns a `confirm({…})` function that resolves
`true`/`false`.

```tsx
const { confirm } = useConfirmModal();

async function onDelete() {
  const ok = await confirm({
    title: "Delete user?",
    message: "This will revoke their access immediately.",
    confirmLabel: "Delete",
    colorPalette: "red",
  });
  if (ok) deleteUser(id);
}
```

The default `colorPalette` is `"red"` — i.e. confirm dialogs default to
the destructive treatment. Pass `colorPalette="primary"` to render a
non-destructive confirmation (rarely needed — non-destructive
confirmations should usually be skipped).

### Save/cancel labels

- **Save labels**: prefer the action verb, not "Save". E.g. "Send
  invite", "Revoke key", "Suspend user". "Save" is acceptable for plain
  edit-modals.
- **Cancel labels**: always "Cancel" (not "Discard", "Close", "No").

### Destructive treatment

Destructive actions (delete, revoke, suspend) **must** use
`colorPalette="red"` on the confirm/save button. This is the only
place `colorPalette="red"` is allowed in the UI. A *status* that is
failed or broken uses `colorPalette="danger"` instead (§11 Status
palettes).

---

## 10. Form patterns

### Layout

A form field row is composed by `<FormField>`:

```
Label                                                       (required *)
┌──────────────────────────────────────────────────────────────┐
│ Input                                                        │
└──────────────────────────────────────────────────────────────┘
Help text                                                       Error text
```

Use `<InputField>`, `<TextareaField>`, `<DatePickerField>`, etc. from
`@knkcs/anker/forms` — they wrap React Hook Form's `Controller` and
attach `aria-describedby` automatically.

A select in a form is `<BaseSelectField>`, or `<LookupSelectField>` when the
options come from a server; both store the option's `id`. A native select is
only for toolbar filters (§ Toolbar). `<SelectField>` (native) is deprecated.

### Required vs. optional treatment

- **Required**: append a small `*` after the label, no extra text.
- **Optional**: append `(optional)` after the label in muted color.

Don't mark some fields required-with-asterisk and others
optional-with-text in the same form — pick one and stick with it. Forms
with mostly-required fields use `(optional)` markers; forms with
mostly-optional fields use `*` on the few that are required.

Implemented by `FormField`/`ControlledFormField`: `required` renders the
`*`, `optionalText` renders the muted marker, and `FormMarkersProvider`
sets the form-wide convention (pass
`{ showRequiredIndicator: false, optionalText: "(optional)" }` for
mostly-required forms).

### Save-button placement

> **One Save, in the header (ADR 0004, required):** the `PageHeader` Save
> is the one Save on a detail or settings page. A card footer never saves.

- **Tabs keep a draft each; Save persists every changed tab at once.**
  With nav-link tabs only the active panel is mounted (§12.2), so a draft
  held in the tab's own form state is lost on every switch. Hold the
  drafts above the router outlet, at the page's layout level, and let the
  header Save write every changed tab in one go (in blueprinthub: one
  Revision, not one per tab).
- **The Save shows there are unsaved changes.** It says how many tabs
  changed and is disabled when none did. Leaving with drafts asks first
  (`UnsavedChangesGuard`, with a `safePathPrefix` so moving between the
  page's own tabs does not).
- **Settings that genuinely save on their own get a tab of their own** —
  not a second Save on a shared tab.
- **The rail never holds Save** (§4). Modals keep their own Save/Cancel
  footer (§9) — a modal is its own scope, not a section of the page.
- **A drawer editing a nested child writes into the tab's draft.** Its
  footer button applies the edit ("Apply", "Done") and closes; the header
  Save persists it with the rest of the tab. A drawer that persisted on its
  own would be the second Save this rule removes.
- **A tab whose header carries Save moves its add into its own toolbar**
  (§12.1 "Index-in-Tab").

Wire it from the tab-dirty registry. The Save is reported as the
template's `actions`, which a host renders outside the screen's providers
(§2 "Host contract"), so it **closes over** the dirty state rather than
reading it from context: mount `TabDirtyProvider` *above* the component
that renders the template.

```tsx
import { TabDirtyProvider, UnsavedChangesGuard, useTabDirty } from "@knkcs/anker/navigation";

export function BlueprintDetail() {
  const { id } = useParams();
  // key={id}: a route change to another blueprint starts a clean registry
  // (and clean drafts) instead of carrying this one's dirty marks over.
  return (
    <TabDirtyProvider key={id}>
      <BlueprintDetailLayout />
    </TabDirtyProvider>
  );
}

function BlueprintDetailLayout() {
  const { dirtyTabs, isTabDirty } = useTabDirty(); // dirtyTabs: ["general", "schema"], in the order they became dirty
  const drafts = useBlueprintDrafts();   // yours: one draft per tab, held here, above the outlet
  const n = dirtyTabs.length;
  return (
    <DetailPageTemplate
      title={blueprint.name}
      tabs={/* nav-link tabs, each trigger with <DirtyDot active={isTabDirty(t.value)} /> */}
      actions={
        <Button disabled={n === 0} onClick={() => drafts.saveAll(dirtyTabs)}>
          {n === 0 ? "Save" : `Save · ${n} ${n === 1 ? "tab" : "tabs"} changed`}
        </Button>
      }
    >
      <UnsavedChangesGuard isDirty={n > 0} safePathPrefix={`/blueprints/${id}/`} />
      <Outlet />
    </DetailPageTemplate>
  );
}
```

A tab publishes `setTabDirty(key, isDirty)` from its draft and does **not**
clear it on unmount — the draft outlives the tab. It clears when the draft
is saved or discarded. No new template or `PageFrame` field is involved:
`actions` is an ordinary node, and a fresh one re-notifies the host.

### Inline edit vs. drawer edit vs. full-page edit

- **Inline edit (modal)**: small forms, ≤ 6 fields, no nested data.
  Use `<Modal>`.
- **Drawer edit (`DrawerRoot`)**: editing a *child item that has no route
  of its own* — something that only ever exists nested inside a parent's
  detail page (a field on a spec, a step inside a template). Use
  `DrawerRoot` from `@knkcs/anker/components`.
- **Full-page edit (DetailPageTemplate)**: large forms, nested data,
  dependent fields — or the thing being edited is itself an independently
  addressable entity (see the rule below). Use a separate page rendered by
  `DetailPageTemplate` with the form Card-wrapped in the body.

> **The index/detail rule (required):** an index page whose rows are
> independently addressable entities — each has its own identity and
> belongs in its own breadcrumb — gets `onRowClick` wired to a
> `DetailPageTemplate` route (see §12.1's contract line: *"`onRowClick` —
> when a detail page exists"*). It never gets a drawer for the primary edit
> action. A drawer is for the other case: editing something with **no
> route of its own**, nested inside a parent's detail page.
>
> The evidence already in the codebase: taskhub-ui's Task Types, Groups
> and Calendars index screens all wire `DataTable onRowClick` to a
> `DetailPageTemplate` route rather than a drawer, and each detail page
> reports a `ContextRail` (via `usePageRail`) for its quick actions —
> `Delete`, plus `Set-default` where the entity has one — which is the
> header/rail rule of §4 (ADR 0004). Save follows the one-header-Save rule
> above: `group-detail.tsx` and `calendar-detail.tsx` save from the
> `PageHeader`'s `actions`; `task-type-detail.tsx` still saves from a Card
> footer, which predates ADR 0004 and is out of compliance. What's
> constant across all three, and the point of this rule: none of their index screens ever
> offers `Edit` in the "…" row menu — only secondary actions do (`Delete`
> on all three, plus `Set-default` on Calendars) — and opening/editing is
> the row click's job.
>
> Getting this backwards doesn't fail to compile or to render — a drawer
> mounted over an index of independently addressable rows works fine on
> its own. What it costs is exactly what §1 warns about: the record has no
> address of its own, so it can't be deep-linked or breadcrumbed the way
> every other top-level entity in the shell is, and it will look out of
> place once module federation renders solutions side by side.

---

## 11. Empty / loading / error states

### DataTable empty state

The `<DataTable emptyState={…}>` prop accepts a ReactNode rendered when
`data.length === 0`. The canonical empty state uses `<EmptyState>`:

```tsx
<DataTable
  data={users}
  columns={columns}
  emptyState={
    <EmptyState
      icon={<Users size={32} />}
      header="No users yet"
      description="Invite your first team member to get started."
      actions={<Button colorPalette="primary">Invite member</Button>}
    />
  }
/>
```

### Status palettes

Status is shown with anker's four status palettes, passed as
`colorPalette` to any palette-aware component (`Badge`, `Button`,
`Alert`, `Progress`, `Tag`, …). Each works in light and dark mode and in
the `solid`, `subtle` and `outline` variants (`Progress`: `subtle`,
`outline`):

| Palette | Means | Typical use |
|---|---|---|
| `success` | Done, healthy, passed | "Active", "Merged", "Passed", a completed run |
| `warning` | Needs attention soon, degraded, at risk | "Expiring", "Waiting for input", "Stale", a slow run |
| `danger` | Failed, error, broken | "Failed", "Error", "Offline", a crashed run |
| `info` | Neutral notice, in progress | "Running", "Queued", "New", an informational banner |

Pick the variant by how loud the status should be: `subtle` is the
default for a status pill in a list or a card; `solid` is for the one
status that must win the user's eye (a failed run at the top of a board);
`outline` is the quiet form for dense rows where many statuses sit side by
side. A status with no meaning beyond "it exists" stays neutral
(`colorPalette="gray"`).

```tsx
<Badge colorPalette="success" variant="subtle">Passed</Badge>
<Badge colorPalette="danger" variant="solid">Failed</Badge>
<Progress colorPalette="warning" value={80} />
```

A status badge written in code is `<StatusBadge tone="success" label="Passed" />`
— the four palettes plus `neutral` and `accent` — and a status column is
`<StatusBadgeCell toneMap={{ failed: "danger" }} />`. `StatusBadge`'s `color`
(and the cell's `colorMap`) is only for a colour that arrives as data, such
as a user-picked status colour from the backend.

> **`danger` is a status, `red` is an action (required).** `danger` says
> something *is* failed or broken. A destructive *action* — delete,
> revoke, suspend — keeps `colorPalette="red"` (§9 Destructive
> treatment), even though both are red-hued. Never put `danger` on a
> delete button, and never put `red` on a "Failed" badge.

Chakra's `Alert` `status` prop picks Chakra's own palettes (`warning` →
orange, `error` → red), not anker's. Keep `status` for the icon and pass
the anker palette explicitly — the explicit `colorPalette` wins.

### Boards (`Kanban`)

Work shown by status — Tasks of a Spec, items of a content workflow — is a
`Kanban` board, not columns hand-built from `Stack`s and `Box`es. One
column per status, a card per item:

```tsx
<Kanban
  aria-label="Spec board"
  columns={STATUSES.map((s) => ({
    id: s,
    title: LABEL[s],
    items: tasks.filter((t) => t.status === s),
  }))}
  getItemKey={(t) => t.id}
  renderCard={(t) => (
    <Kanban.Card tone={toneOf(t)} href={t.url}>
      <Kanban.CardMeta>
        <Text as="span" fontFamily="mono">#{t.number}</Text>
        <Kanban.CardAvatar><Avatar name={t.owner} size="2xs" /></Kanban.CardAvatar>
      </Kanban.CardMeta>
      <Kanban.CardTitle>{t.title}</Kanban.CardTitle>
      <Kanban.CardBadges><StatusBadge tone="warning" label="Needs you" /></Kanban.CardBadges>
    </Kanban.Card>
  )}
/>
```

- **When to use it**: the item's status is the main thing the screen
  shows, and there are few enough statuses to sit side by side (up to
  about seven). A long list sorted or filtered by status is a
  `DataTable` with a `StatusBadgeCell`; a single item's progress is a
  `Stepper` or `Timeline`.
- **Card tones** say whether anyone must act, on the status palettes:
  `default` for ordinary work, `quiet` (sunken surface, dashed border,
  full-strength text) for an item that waits on nobody, `attention` (a
  `warning` edge) for one someone must act on. Keep `attention` rare —
  a board where every card is loud has no loud card. The tone is the
  card's surface; what the status *is* still goes in a `StatusBadge`.
- **A card opens the item**: give it `href` (a link), `onClick` (a
  button) or `asChild` with a router `<Link>` inside. Always render
  cards with `Kanban.Card` — the board steers keyboard focus through it.
- **Read-only is the default.** A board over derived status (nobody
  sets it by hand) shows no drag affordance and suggests no editing.
- **Editable boards** pass `onMove` — and only those: it is what makes
  cards draggable and what loads the drag-and-drop code (a lazily
  imported module over dnd-kit; a read-only board never loads it).
  The board stays controlled: `onMove({ item, itemKey, from, to })`
  reports a drop with `{ columnId, index }` positions, where `to.index`
  is the card's index in the target column once moved (remove it from
  `from`, insert it at `to`). Apply it to your `columns`, or return
  `false` to veto — the card snaps back. Validate where the rule lives
  (a card that may not leave "Done"), not after the fact:

  ```tsx
  onMove={(move) => {
    if (!canTransition(move.from.columnId, move.to.columnId)) return false;
    setTasks((tasks) => applyMove(tasks, move));
  }}
  ```

  A move that needs the server: apply it optimistically and revert on
  failure — `onMove` answers synchronously.
- **Dragging**: the whole card is the handle. With a pointer it drags
  after a few pixels (on touch after a press, so a swipe still
  scrolls), so a click still opens the card. With the keyboard, Space
  picks the focused card up (Enter still opens it), the arrow keys
  move it — into empty columns too — Home/End to the column's ends,
  Space or Enter drops it and Escape cancels; Tab away cancels as well.
  The board stays one tab stop and the card keeps focus. The picked-up
  card is outlined in `accent`, its column tinted `bg-muted`, and each
  step is announced (`dragLabels`, English defaults).
- **Columns**: `title` (also names the column's list for screen
  readers, with its count), optional `count` when only a page of the
  column is loaded, optional `action` in the header. Narrow screens
  scroll the board sideways (`columnMinWidth`, default `16rem`);
  `collapseEmptyColumns` draws empty columns as a narrow strip.
- **Empty states**: an empty column says `emptyColumnLabel` ("No
  cards") or its own `emptyState`; a board with no card at all shows
  `emptyState` (an `EmptyState` by default) — pass `emptyState={false}`
  to keep the empty columns on screen instead.
- **Keyboard**: the board is one tab stop. Arrow keys move between
  cards (↑/↓, Home/End) and columns (←/→, flipped in RTL, skipping
  empty columns); Enter opens the focused card.
- **Long columns virtualise**: a column with more than
  `virtualizeAbove` cards (default 100) scrolls within `columnMaxHeight`
  (default `70vh`) and renders only the cards in view; cards are
  measured, so their heights may differ (`estimateCardHeight`, default
  88, is only the first guess). The arrow keys still reach every card —
  the board scrolls the column to it — and the focused card stays
  mounted. `renderCard` runs only for mounted cards, so keep it free of
  side effects; pass the full column in `items` (or a server total in
  `count`) so `aria-setsize` stays honest.

### Diffs (`DiffView`)

What changed in code — a Change Request, a tool call's patch, a history
entry — is a `DiffView`, not a monospace block coloured by hand. Pass the
unified diff text exactly as `git diff` prints it:

```tsx
<DiffView diff={changeRequest.diff} />

// One file in a detail pane or an inspector:
<DiffView diff={event.patch} variant="compact" />

// Parse once to filter or count, then hand the files over:
const files = parseUnifiedDiff(text).filter((f) => !f.path.endsWith(".lock"));
<DiffView files={files} defaultCollapsed={(f) => f.path.startsWith("gen/")} />
```

- **One section per file**: a header with the path (`old → new` for a
  rename), the change type as a `StatusBadge` (`Added` on `success`,
  `Deleted` on `danger`, `Renamed` on `info`, `Modified` neutral, plus
  `Binary`) and the line counts; then old and new line numbers and the
  lines. Binary files, pure renames and mode-only changes say so instead
  of showing lines.
- **Colours are fixed**: added lines on `success.subtle`, removed lines on
  `danger.subtle` (numbers and sign in the palette's `fg`, code in
  `default`), unchanged lines on `bg-surface`, hunk headers on `info`.
  Each changed line also carries a `+`/`-` sign and a screen-reader label,
  so the change never rests on hue alone. Never recolour lines.
- **Folding**: a run of unchanged lines longer than `contextLines` (default
  3) on each side of a change folds behind "Expand N unchanged lines".
  `contextLines={Infinity}` shows everything. Lines outside the diff's
  hunks are not in the text, so they cannot be expanded.
- **Collapsing files** (`default` variant): the path in each header is a
  toggle; `defaultCollapsed` (`true` or a predicate) starts files closed
  — lockfiles, generated code — and `onFileCollapsedChange(file,
  collapsed)` reports each toggle. `renderFileActions(file)` adds a link
  or a menu to the header.
- **`variant="compact"`** is for one file inside a narrow pane: smaller
  type, a slim header that does not collapse and shows a change badge only
  when the file is not a plain modification.
- **Comments** (`comments`): each `DiffComment` names a `path` (a file's
  path or `key`), optionally a `line` and a `side` (`"new"`, the default,
  or `"old"`), and carries `author`, `avatar`, `timestamp`, `tone`, `label`
  and `body`. It renders under its line — a commented line is never folded
  — as a `MessageGroup` + `MessageBubble` edged in its tone (`label` is a
  `StatusBadge` in that tone; give one whenever the tone means something).
  A comment without a line, or on a line outside the hunks (lines between
  hunks are not in the diff text), shows at the top of its file with
  "Line N"; one on a file the diff does not contain shows after the files.
  None is dropped. `renderComment(comment, file)` replaces the content
  while anker keeps the frame. The header counts each file's comments, so
  a collapsed file still says it has some. Memoise the `comments` array:
  a new one re-places every comment.

  ```tsx
  <DiffView
    diff={changeRequest.diff}
    comments={round.findings.map((f) => ({
      id: f.id, path: f.path, line: f.line, author: "Reviewer",
      tone: f.blocking ? "danger" : "warning",
      label: f.blocking ? "Blocking" : "Suggestion",
      timestamp: <RelativeDateTime date={f.createdAt} />, body: f.body,
    }))}
  />
  ```
- **Keyboard**: with focus inside the diff, `j` / `k` jump to the next /
  previous file (its toggle, or its heading in `compact`) and `n` / `p` to
  the next / previous comment (each comment is a focusable `article`).
  Ignored in text fields, menus and listboxes, and with a modifier key; a
  collapsed file's comments are skipped. `keyboardNavigation={false}` turns the jumps off
  where the page already binds these keys.
- **Large files**: a file of more than `virtualizeAbove` rows as first
  shown (hunk headers, lines, folds and comment rows; default 500) renders
  in a scrolling pane of its own, at most 70% of the viewport tall, that
  draws only the code lines in view (`@tanstack/react-virtual`) — a
  5,000-line file costs about what a 50-line one does. Comment rows, with
  their lines, stay drawn wherever they are, so a comment keeps its state
  (a half-typed reply) and `n` / `p` scroll the pane to it; the row holding
  focus stays drawn too. Line numbers and expanded folds stay correct while
  it scrolls. The decision is per file and made with the folds closed, so
  expanding a fold never swaps the pane in or out; many small files are
  each rendered whole. Both variants virtualise. `virtualizeAbove={Infinity}`
  renders every file whole.
- **Typography**: anker's `mono` font, whitespace kept, `tabSize` (default
  4). Long lines scroll the file sideways rather than wrap; line numbers
  and signs are not selected when the reader copies code.
- Strings are props with English defaults (`labels`). Syntax
  highlighting, a side-by-side view and writing or editing comments are
  out of scope.

### Charts (`LineChart`, `AreaChart`, `BarChart`)

A value over time — machine load, spend, throughput — is a chart from
`@knkcs/anker/charts`, never a chart library coloured by hand. You pass
data and series definitions; anker picks every colour:

```tsx
import { AreaChart, BarChart, LineChart, numberFormatter, timeFormatter } from "@knkcs/anker/charts";

<LineChart
  aria-label="Load over time"
  data={readings}            // [{ at: 1763024400000, load: 2.1, limit: 4 }, …]
  xKey="at"
  xType="time"
  series={[
    { key: "load", label: "1-minute load" },
    { key: "limit", label: "Admission limit", tone: "warning" },
  ]}
  formatX={timeFormatter({ hour: "2-digit", minute: "2-digit" })}
  formatValue={numberFormatter({ maximumFractionDigits: 1 })}
/>
```

- **Which chart**: `LineChart` compares how a few series *move* — lines
  may cross and overlap without hiding each other. `AreaChart` shows
  *volume* (load, spend) where the area under the line means something;
  `stacked` when the series add up to a whole (spend per project), so
  the top edge is the total. `BarChart` compares *amounts per category*
  (a day, a project, a service): series grouped side by side, or
  `stacked` so the bar is the total. On a `time` axis each reading gets
  its own bar. One headline number is a stat tile, not a chart.
- **Colours come from the series palette**, never from you: a series
  takes the slot of its position in `series` (`chart.series.1` …
  `chart.series.6`, selected per mode and validated for contrast and
  colour-blind separation on `bg-surface`). Give a series a `tone`
  (`accent`, `success`, `warning`, `danger`, `info`, `neutral`) only
  when its meaning matters — a limit, a failure rate. Status hues never
  appear as an ordinary series. `accent` and `info` share the action
  blue (as on `StatusBadge`), close to the first palette slot — beside
  palette series, prefer a status tone or `neutral`.
- **Colour follows the series, not its rank.** To filter, mark a series
  `hidden` rather than removing it: the others keep their colours. More
  than six series is too many to tell apart — fold the rest into an
  "Other" series or split the chart (series past six paint neutral, with
  a console warning).
- **One y axis.** Two measures of different scale (load and a
  percentage) are two charts side by side, not one chart with a second
  axis.
- **Formatters** apply to the axis ticks and the tooltip alike:
  `formatX` for x values, `formatValue` for y values.
  `numberFormatter(Intl.NumberFormatOptions)` (currency, percent — 0.42
  reads 42 %) and `timeFormatter(Intl.DateTimeFormatOptions)` write in
  the UI language, like every value anker formats. A `time` x axis reads
  epoch milliseconds, `Date`s and ISO strings.
- **Sizing**: the chart fills its container's width, and its height
  unless you give `height`. In a dashboard widget (`Widget`,
  `<Dashboard>` cells) give it nothing — it takes the widget's body.
  Outside one, give a `height`; `minHeight` (160px) keeps it from
  collapsing.
- **States**: `loading` shows a placeholder the chart's size, marked
  busy; no rows (or every series hidden) shows `emptyLabel` ("No data")
  in the same footprint, so the layout never jumps.
- **Legend** for two or more series, none for one (the title names it);
  `legend` overrides. Legend and tooltip text stay in text tokens — the
  swatch beside a name carries the colour.
- **Thresholds**: `thresholds={[{ value: 40, label: "Daily budget" }]}`
  draws a dashed line across the plot; add `to` for a band (a target
  range: `{ value: 2, to: 3, label: "Target", tone: "success" }`). A
  threshold reads in its `tone` (`warning` by default) with its label on
  the plot; the y axis grows to show it, so a limit not yet reached is
  still there. Use a threshold, not a constant series, for a limit.
- **Text alternative**: `aria-label` is required — it names the figure.
  Every chart holds its data as a visually hidden table (rows in the
  axis formats; head the x column with `xLabel`, e.g. "Day"), which
  screen readers read instead of the plot. Add `summary` — one sentence
  on what the chart shows ("Spend passed the budget on Sunday") — to
  describe the figure; the thresholds are read with it.
- **Live data**: pass the new rows; the chart draws the new point in
  place and nothing else moves. `animate` animates the first draw only —
  later updates never re-animate the whole chart.

### Error Alert placement

Inline errors on flush `bg-canvas` pages use `<Alert>` with explicit
horizontal margin so they don't sit flush against the page edge:

```tsx
<Alert
  status="error"
  colorPalette="danger"
  title="Failed to load users"
  mx="8"
  mt="4"
>
  Couldn't reach the server. Try again in a moment.
</Alert>
```

For padded pages (settings, dashboard), the alert lives inside the
already-padded body and doesn't need `mx`.

### Spinner placement

For full-page loading (between tab switches, initial data fetch), use a
centered spinner inside a `bg-canvas` wrapper:

```tsx
<Flex align="center" justify="center" minH="40vh" bg="bg-canvas">
  <Spinner size="lg" color="accent" />
</Flex>
```

For initial-app-boot loading (before the AppShell has rendered), use
the `<LoadingPage>` template.

### 404 / 500 / 403 page layouts

Always use the `<ErrorPage>` template for these. Don't compose
404/500/403 ad-hoc — the template ensures visual parity across
solutions and federated views.

---

## 12. Page templates

This section defines every supported page template. Each template
includes a composition diagram, when-to-use guidance, and escape
hatches (the deviation rules — when it's acceptable to *not* use the
template).

The **one rule** every template enforces: **slots accept ReactNode,
not config objects**. This is deliberate. Slots are escape hatches —
if the template doesn't fit, you can pass arbitrary content into the
slot. Config objects would force every variant to be expressible as
data, and we don't have that crystal ball.

### 12.1 IndexPageTemplate

**When to use.** Any "browse a list" page: users, OAuth clients, audit
events, API keys, webhooks. The page's main content is a `<DataTable>`
or list, optionally filtered.

**Composition.**

```
┌───────────────────────────────────────┐
│ PageHeader  (breadcrumbs · title)     │
├───────────────────────────────────────┤
│ Tabs (optional)                       │
├───────────────────────────────────────┤
│ Toolbar  (search · filters · count)   │
├───────────────────────────────────────┤
│ children  (DataTable, flush)          │
└───────────────────────────────────────┘
```

**Slots.**

| Prop          | Type        | Default | Notes                                                |
|---------------|-------------|---------|------------------------------------------------------|
| `breadcrumbs` | `Crumb[]`   | —       | Forwarded to `<PageHeader>`                          |
| `title`       | `ReactNode` | —       | Required                                             |
| `subtitle`    | `ReactNode` | —       |                                                      |
| `eyebrow`     | `ReactNode` | —       | Uppercase overline                                   |
| `actions`     | `ReactNode` | reads `usePageActions` | Right-aligned in PageHeader               |
| `tabs`        | `ReactNode` | —       | Optional `<Tabs.Root>` rendered under PageHeader     |
| `toolbar`     | `ReactNode` | —       | Optional `<Toolbar>` rendered under tabs             |
| `children`    | `ReactNode` | —       | Page body — DataTable, list, empty/error states      |

**Escape hatches.**

- The body is rendered flush (no padding). If you need a padded body
  (e.g. a single Card instead of a DataTable), wrap children in
  `<Box px="8" py="6">`.
- The toolbar can be omitted entirely — pass `toolbar={null}` (or just
  omit the prop). Don't fake a toolbar with a `<Box>`.

#### Contract

Every index page composes these slots, in this order:

1. **Header** (`IndexPageTemplate` props):
   - `breadcrumbs`, `title` — required.
   - `actions` slot — dedicated to the **primary-add** trigger (a `Button` that opens a `Modal`). Secondary actions (Export, Import) follow.
   - `tabs` — optional. When present, lives between header and toolbar.
2. **Toolbar** (in this order, left → right):
   - `Toolbar.Search` — typeahead input. Always present unless the dataset is bounded (≤ ~5 rows).
   - `Toolbar.Filters` — `FilterChip` for boolean toggles (zero-or-more), `NativeSelect` for exclusive enums with > 3 values, omit otherwise.
   - `Toolbar.Right` — optional secondary actions, then `Toolbar.Count`.
3. **DataTable**:
   - `selectable` + `rowSelection` / `onRowSelectionChange` / `getRowId` — when the entity has bulk verbs.
   - `onRowClick` — when a detail page exists.
4. **BulkActionBar swap-in** — when `selectedIds.length > 0`, the *toolbar element* is replaced (not appended) by a `BulkActionBar` carrying the bulk verbs. Render a single ternary:

   ```tsx
   const toolbar = selectedIds.length > 0
     ? <BulkActionBar ...>{actions}</BulkActionBar>
     : <Toolbar>...</Toolbar>;
   ```

5. **Create flow** — header-actions button → `Modal`. Inline forms above the toolbar are an anti-pattern: they steal vertical space, are easy to miss, and split form state from the rest of the page.

#### Index-in-Tab sub-pattern

For index-style content rendered inside a tab body of `SettingsPageTemplate` or `DetailPageTemplate`, use **nav-link tabs**: pass a `<Tabs.Root value={current}>` containing only a `<Tabs.List>` to the parent template's `tabs` prop, and let the router render the active panel as `children`. Only the active panel is mounted, so `usePageActions` from inside a tab body registers exactly when that tab is active and clears on unmount.

- The same Toolbar / DataTable / BulkActionBar contract applies inside the tab body.
- Tab-scoped primary-add lifts to the parent template's header-actions slot via `usePageActions(<AddButton/>)`. Because only the active panel is mounted, only its registration is alive — no collisions, no stale buttons.
- **Except when the page's header carries the Save (ADR 0004).** A template's explicit `actions` prop wins over `usePageActions` registrations, so the tab's add would silently disappear — and the header already holds the page's one primary action. On such a page the tab's add goes in the tab body's `<Toolbar>` instead. (Under a foreign host `usePageActions` reaches nothing anyway — §2.)
- No second `<PageHeader>` inside the tab.
- The tab does not own breadcrumbs; the parent page does.
- **Don't** leave two panels mounted at once. Nothing in the template prevents it: the header-actions slot holds a single unkeyed registration, so a second mounted panel's `usePageActions` overwrites the active tab's. If you render panels from a `<Tabs.Root>` you own in the body rather than from the router, set `lazyMount unmountOnExit` so only the active one mounts.

### 12.2 DetailPageTemplate

**When to use.** Any "single entity" page: a single user, a single
OAuth client, a single audit event detail, a single webhook config.

> **Body tabs vs sidebar sub-sections — when to choose which:**
>
> - Use **body tabs** (DetailPageTemplate `tabs` slot) when the page
>   presents *multiple views of the same entity* — e.g. a user with
>   Profile / Security / Sessions / API Keys tabs. The user is exploring
>   one record; the URL stays at `/users/123/<tab>` and the page chrome
>   stays the same.
>
> - Use **sidebar sub-sections** when the items are *distinct
>   destinations* — e.g. an Admin section with Users / OAuth Clients /
>   Webhooks / Audit Log as separate index pages. Each is a top-level
>   navigation target with its own page header.
>
> **Rule of thumb:** if the in-page navigation keeps the entity identity
> (breadcrumb, avatar, title, badges) constant across the destinations,
> they belong in `tabs` on the page header. If each destination is a
> distinct top-level page with its own breadcrumb and title, render them
> as separate index pages in the sidebar.
>
> Within a single page, prefer the `tabs` row over rendering a custom
> in-body tab strip — it keeps the navigation surface consistent across
> solutions.

**Composition.**

```
┌───────────────────────────────────────┐
│ PageHeader  (breadcrumbs · title)     │
├───────────────────────────────────────┤
│ Tabs (optional)                       │
├───────────────────────────────────────┤
│ children  (identity Card · panes …)   │
│   flush — add internal padding in     │
│   children if you need it             │
└───────────────────────────────────────┘
```

**Slots.**

| Prop          | Type        | Default | Notes                                                |
|---------------|-------------|---------|------------------------------------------------------|
| `breadcrumbs`, `title`, `subtitle`, `eyebrow` | … | … | Same as IndexPageTemplate            |
| `actions`     | `ReactNode` | reads `usePageActions` | —                                         |
| `tabs`        | `ReactNode` | —       | Recommended for entities with multiple aspects       |
| `children`    | `ReactNode` | —       | Body, flush. Add internal padding in `children`.     |

**Escape hatches.**

- The body is rendered flush (no padding). If you need a padded body
  (e.g. cards that shouldn't sit against the page edges), wrap children
  in `<Box px="8" pt="6">`. This matches `IndexPageTemplate`.
- The identity-Card-then-tabs pattern is a convention, not a
  requirement. A detail page without tabs is fine — render the body
  however the entity demands.

#### `tabs` — nav-link tabs

`tabs` takes a `<Tabs.Root>` containing only a `<Tabs.List>` — no `<Tabs.Content>`. The tab list renders as the third row of the header band; the active panel arrives separately as `children`, normally from the router. Use this any time each tab has its own body component.

```tsx
<DetailPageTemplate
  breadcrumbs={[...]}
  title={user.displayName}
  tabs={
    <Tabs.Root value={currentTab} variant="line">
      <Tabs.List>
        <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
        <Tabs.Trigger value="security">Security</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  }
>
  <Outlet />
</DetailPageTemplate>
```

Derive `currentTab` from the URL and let the route render the matching panel. The tab list and the panels end up in different parts of the React tree — the list is registered into the header band through the slot store, the panels render in the template body — so one `<Tabs.Root>` cannot wrap both, and `<Tabs.Content>` inside `tabs` would never receive a body.

> **Removed in v2.2.0 — `bodyTabs` and `subheader`.**
> Migrate `bodyTabs` to the nav-link tabs above. Migrate `subheader` to
> the `avatar` / `badges` / `meta` slots, which render on the header's
> detail row. Note the guarantee moved with the prop: `bodyTabs` owned a
> `<Tabs.Root>` with `lazyMount unmountOnExit`, so the template kept a
> single panel mounted for you. Now only the router does — see the
> `usePageActions` rule in `CLAUDE-ANKER.md`.

### 12.3 SettingsPageTemplate

**When to use.** Any "preferences / configuration" page composed of
multiple tabbed sections: personal settings (Profile, Password, MFA),
organization settings, IDP settings, admin → general.

**Composition.**

```
┌───────────────────────────────────────┐
│ PageHeader  (breadcrumbs · title)     │
├───────────────────────────────────────┤
│ Tabs (required)                       │
├───────────────────────────────────────┤
│ children  (Card-wrapped forms · …)    │
│   max-width 720px (3xl), centered     │
└───────────────────────────────────────┘
```

**Slots.**

| Prop          | Type        | Default | Notes                                                |
|---------------|-------------|---------|------------------------------------------------------|
| `breadcrumbs`, `title`, `subtitle`, `eyebrow` | … | … |                                          |
| `actions`     | `ReactNode` | reads `usePageActions` |                                            |
| `tabs`        | `ReactNode` | —       | **Required**                                         |
| `children`    | `ReactNode` | —       | Body — typically Card-wrapped forms or DataLists     |
| `maxBodyWidth` | `string`   | `"3xl"` | `"full"` to disable the constraint                   |
| `bodyPadding` | `"default" \| "none"` | `"default"` | Pass `"none"` to render the body flush — for tabs whose content is a DataTable. See §7 "Content alignment: flush vs. padded". |

**Escape hatches.**

- `maxBodyWidth="full"` disables the readability constraint.
- `bodyPadding="none"` removes the template's `px="8" pt="6"` so
  DataTable tabs render edge-to-edge. Combine with `maxBodyWidth="full"`
  for a true full-bleed table. Tabs that still need padding should wrap
  their content in `<Box px="8" py="6">` directly.
- A single-tab settings page is a sign you should be using
  DetailPageTemplate instead. Use SettingsPageTemplate only when there
  are ≥ 2 tabs.

#### `tabs` — nav-link tabs

Same shape as `DetailPageTemplate.tabs`: a `<Tabs.Root>` holding only a `<Tabs.List>`, with the active panel supplied as `children`.

```tsx
<SettingsPageTemplate
  breadcrumbs={[...]}
  title={org.name}
  bodyPadding="none"
  maxBodyWidth="full"
  tabs={
    <Tabs.Root value={currentTab} variant="line">
      <Tabs.List>
        <Tabs.Trigger value="general">General</Tabs.Trigger>
        <Tabs.Trigger value="members">Members</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  }
>
  <Outlet />
</SettingsPageTemplate>
```

`bodyTabs` was removed in v2.2.0; the same migration and the same
`usePageActions` caveat as `DetailPageTemplate` apply.

### 12.4 DashboardPageTemplate

**When to use.** Overview pages composed of a grid of widgets — small
stat tiles, mini-charts, recent-activity panes. Inspired by Linear's
"All issues" overview and GitHub's repo insights — calm surfaces,
dense info, clear hierarchy.

**Composition.**

```
┌───────────────────────────────────────┐
│ PageHeader (greeting · range picker)  │
├───────────────────────────────────────┤
│ ┌────┬────┬────┬────┐                 │
│ │stat│stat│stat│stat│                 │
│ ├────┴────┼────┴────┤                 │
│ │ widget  │ widget  │                 │
│ ├─────────┴─────────┤                 │
│ │   wide widget     │                 │
│ └───────────────────┘                 │
└───────────────────────────────────────┘
```

**Slots.**

| Prop          | Type        | Default | Notes                                                |
|---------------|-------------|---------|------------------------------------------------------|
| `breadcrumbs`, `title`, `subtitle`, `eyebrow` | … | … |                                          |
| `actions`     | `ReactNode` | reads `usePageActions` | Range picker, refresh button              |
| `children`    | `ReactNode` | —       | Widgets — set `gridColumn` on each child            |
| `gap`         | `string`    | `"4"`   | Grid gap between widgets                             |

**Escape hatches.**

- The grid is 12 columns. Default per-child span is 12 (full-width).
  Set `gridColumn="span 3"` for quarter-width tiles, `"span 6"` for
  half, etc.
- For non-grid dashboards (e.g. a single timeline), use
  `DetailPageTemplate` instead — the dashboard chrome implies a grid.

**Authoring rules (dashboards specifically).**

- Stat tiles go on the top row. They answer "is the system healthy?".
- Charts go in the middle. They answer "how is it trending?".
- Lists / activity feeds go at the bottom. They answer "what just
  happened?".
- Don't mix densities — all top-row stats should be the same column
  span. Refined minimalism applies more strictly to dashboards because
  the screen is busy by definition.

### 12.5 AuthPageTemplate

**When to use.** Pre-authentication screens: login, register, MFA
challenge, forgot/reset password. The user is not signed in, the app
shell isn't loaded.

**Composition.** Full-bleed centered card on a dot-grid canvas, with
an optional topbar (logo + locale switcher) and optional footer slot.
Internally a thin wrapper around the existing `<AuthCard>`.

**Slots.** All the same as `<AuthCard>`:

| Prop            | Type        | Notes                                       |
|-----------------|-------------|---------------------------------------------|
| `logo`          | `ReactNode` | Top-left of the topbar                      |
| `topBarRight`   | `ReactNode` | Top-right (locale switcher, help link)      |
| `hideTopBar`    | `boolean`   | Hide topbar entirely (rare)                 |
| `hideBackground`| `boolean`   | Hide dot-grid (printable)                   |
| `eyebrow`       | `ReactNode` | Small uppercase eyebrow above title         |
| `title`         | `ReactNode` | Card title                                  |
| `subtitle`      | `ReactNode` | Subtitle below title                        |
| `size`          | `"md" \| "lg"` | Card width preset (440px / 480px)        |
| `footer`        | `ReactNode` | Bottom-bordered footer inside the card      |
| `children`      | `ReactNode` | Page body                                   |

**Escape hatches.**

- For OAuth consent screens, prefer `<AuthPageTemplate size="lg">`
  with a denser layout — see 11.7.
- For email-verification "we sent a link" screens, use the same
  template with a single action button as `children`.

### 12.6 Verify / Confirm page

**When to use.** Email verification, account-deletion confirmation,
"check your inbox" callouts. These pages have copy + a single CTA, no
form.

**Composition.** Use `AuthPageTemplate`:

```tsx
<AuthPageTemplate
  logo={<Logo />}
  eyebrow="VERIFY EMAIL"
  title="Check your inbox"
  subtitle="We sent a verification link to jana@knk.de."
>
  <Button colorPalette="primary" variant="outline" w="full">
    Resend email
  </Button>
</AuthPageTemplate>
```

There is no separate `<VerifyPageTemplate>` — verify is just a special
case of auth.

### 12.7 OAuth consent page

**When to use.** Relying-party authorization prompt — "App X wants
access to your account".

**Composition.** Use `AuthPageTemplate size="lg"` with denser body
content (no large hero text, just an app-card + scope-list +
allow/deny buttons).

```tsx
<AuthPageTemplate size="lg" title="Authorize MyApp">
  <Persona name="MyApp" /* … */ />
  <Box my="4">
    <Text fontSize="sm" fontWeight="medium" mb="2">MyApp will be able to:</Text>
    <List items={[…scopes]} />
  </Box>
  <Flex gap="3" justify="flex-end">
    <Button variant="outline">Deny</Button>
    <Button colorPalette="primary">Allow</Button>
  </Flex>
</AuthPageTemplate>
```

The denser `lg` width gives room for the scope list without forcing the
user to scroll.

### 12.8 Logout / signed-out page

**When to use.** Post-logout landing — confirms sign-out and offers a
sign-back-in CTA.

**Composition.** `AuthPageTemplate`:

```tsx
<AuthPageTemplate
  logo={<Logo />}
  eyebrow="SIGNED OUT"
  title="See you next time"
  subtitle="You've been signed out of all devices."
>
  <Button colorPalette="primary" variant="solid" w="full" asChild>
    <a href="/login">Sign in again</a>
  </Button>
</AuthPageTemplate>
```

### 12.9 MarketingPageTemplate

**When to use.** Unauthenticated marketing surfaces — product
landing, "about us", coming-soon teasers. Full-bleed, no app shell.

**Composition.**

```
┌──────────────────────────────────────────┐
│ topbar (logo · nav · CTA)                │
├──────────────────────────────────────────┤
│ hero (eyebrow · title · subtitle · CTAs) │
├──────────────────────────────────────────┤
│ children (feature sections, …)           │
├──────────────────────────────────────────┤
│ footer (copyright, links)                │
└──────────────────────────────────────────┘
```

**Slots.**

| Prop          | Type        | Notes                                                |
|---------------|-------------|------------------------------------------------------|
| `logo`        | `ReactNode` | Topbar left                                          |
| `topBarRight` | `ReactNode` | Topbar right (nav + sign-in CTA)                     |
| `hideTopBar`  | `boolean`   | Rare                                                 |
| `heroEyebrow` | `ReactNode` | Uppercase overline above hero title                  |
| `heroTitle`   | `ReactNode` | Hero headline (large display text)                   |
| `heroSubtitle`| `ReactNode` | One-paragraph value statement                        |
| `heroActions` | `ReactNode` | Hero CTAs (typically 1 solid + 1 ghost)              |
| `heroVisual`  | `ReactNode` | Optional hero illustration on wide viewports         |
| `children`    | `ReactNode` | Body — feature sections, testimonials, etc.          |
| `footer`      | `ReactNode` | Footer band                                          |

**Authoring rules (marketing specifically).**

- Anker's principles still apply. Refined minimalism, calm surfaces,
  brand colors as accents (not full backgrounds). Don't import a
  Bootstrap-y "hero with gradient overlay" — it will look out of place
  next to the rest of the platform.
- One hero per page. No alternating-band designs unless absolutely
  necessary.
- Use `secondary.600` (brand orange) at most once on the page (e.g. on
  the hero CTA, never on body links).

### 12.10 ErrorPage

**When to use.** 404, 500, 403, generic failures.
Full-bleed, no app shell.

**Composition.** Centered status code + title + description + actions.
Optional logo top-left, optional illustration above the status code.

**Slots.**

| Prop          | Type        | Notes                                                |
|---------------|-------------|------------------------------------------------------|
| `logo`        | `ReactNode` | Top-left brand mark                                  |
| `statusCode`  | `ReactNode` | Required. "404", "500", "OOPS"                       |
| `title`       | `ReactNode` | Required. Short headline                             |
| `description` | `ReactNode` | One-paragraph explanation                            |
| `actions`     | `ReactNode` | Buttons — back home, retry, contact support          |
| `illustration`| `ReactNode` | Rendered above the status code. Use sparingly.       |

**Authoring rules.**

- Keep description ≤ 2 sentences. The user is frustrated.
- Always offer at least one action — "back to dashboard" is the
  universal default.
- Don't tell the user "an error has occurred" in the description.
  Give them a useful next step instead.

### 12.11 LoadingPage

**When to use.** Initial app boot — before the authenticated app
shell has hydrated. For in-page loading (tab switch, data refresh)
use a centered `<Spinner>` inside the page body.

**Slots.**

| Prop      | Type        | Notes                                                |
|-----------|-------------|------------------------------------------------------|
| `logo`    | `ReactNode` | Optional. Rendered above the spinner.                |
| `message` | `ReactNode` | Optional. "Loading your workspace…". Keep it short.  |

**Authoring rules.**

- Don't add progress bars unless you can actually report progress.
  Indeterminate spinners > fake progress.
- The message is optional and should be omitted if the load is fast
  (< 500ms). The flash of "Loading…" is worse than the flash of
  blank.

### 12.12 MaintenancePage

**When to use.** The service is down for upgrade or maintenance.
Operators serve this from a static asset or fallback handler.

**Slots.**

| Prop          | Type        | Notes                                                |
|---------------|-------------|------------------------------------------------------|
| `logo`        | `ReactNode` | Top-left brand mark                                  |
| `title`       | `ReactNode` | Default: "We'll be right back"                       |
| `description` | `ReactNode` | Default: "We're upgrading the service. Please refresh in a few minutes." |
| `eta`         | `ReactNode` | Optional ETA banner ("Estimated back online: 14:30 UTC") |
| `statusLink`  | `ReactNode` | Link to status page                                  |

**Authoring rules.**

- Always provide an ETA if you have one. Users tolerate downtime
  much better when they know how long.
- Never suggest the user "try again later" without giving them a
  link to a status page or way to check.

---

### 12.13 DataTable cells

**Rule.** Cells from `@knkcs/anker/components` are the contract — **never
inline cell JSX from primitives unless no cell fits**. If no cell fits, file an issue and propose a new cell. Inline
`<Badge>`, `<Box>`, `<Text>`, `<Tooltip>` compositions in column
files are the kind of drift the cells library was built to prevent;
they fragment the visual language across solutions and silently miss
later improvements (a11y fixes, dark-mode tweaks, density updates).

**Why it matters.** Module federation will assemble multiple knkCMS
solutions (Odon, Core, Template, MAS, Aufgabenmanagement, …) into a
single browser frame. Tables are the single most common surface in
the platform. Visually divergent rows — even by 1–2px of padding or
a slightly different muted color — read as broken to operators.

**Available cells.** Anker ships 16 cells today. All exported from the
same path as `DataTable` itself (`Card`, `Modal`, etc. — one path for
every component-level export):

```tsx
import {
  ActionCell, BooleanCell, CodeCell, ColorSwatchCell, CountCell,
  DateCell, DeviceCell, IdentityCell, LinkCell, MenuCell, NumberCell,
  SlugCell, StatusBadgeCell, SwitchCell, TruncatedTextCell, UrlCell,
} from "@knkcs/anker/components";
```

| Cell | Use case |
|---|---|
| `ActionCell` | Row action icon buttons (edit / delete / download) |
| `BooleanCell` | Yes/No labels with configurable strings |
| `CodeCell` | Monospace inline code (SQL, JSON snippets) |
| `ColorSwatchCell` | Color circle + hex value |
| `CountCell` | "N items" / "1 item" with pluralization |
| `DateCell` | Formatted date with optional relative-time tooltip |
| `DeviceCell` | User-Agent → "Chrome on macOS" + UA tooltip + optional badge |
| `IdentityCell` | Avatar + primary name + optional sub-text (person reference) |
| `LinkCell` | Internal Link via the anker `Link` primitive |
| `MenuCell` | Row overflow menu (`⋯`) |
| `NumberCell` | Locale-aware number formatting |
| `SlugCell` | Monospace identifiers (KSUID, slug, handle) |
| `StatusBadgeCell` | Status badge; `toneMap` / `fallbackTone` map a value to a tone (`colorMap` only for data-driven colours); supports `detail` and `tooltip` |
| `SwitchCell` | Inline toggle bound to a row value |
| `TruncatedTextCell` | General text with optional truncation; supports `subText` |
| `UrlCell` | External clickable link |

**Mapping examples.** Common column patterns and the cell to reach
for:

| Column intent | Reach for |
|---|---|
| Status / state pill | `StatusBadgeCell` with `toneMap` (use `tooltip` for descriptions; `detail` for error-line under the badge) |
| Timestamp | `DateCell` |
| Mono ID / KSUID | `SlugCell` (small / inline) or `CodeCell` (block-y) |
| Per-row actions | `ActionCell` (small set) or `MenuCell` (overflow) |
| Person reference (user, member, requester, author) | `IdentityCell` |
| Device / User-Agent | `DeviceCell` |
| Primary value with creation date / context line | `TruncatedTextCell` with `subText` |
| Yes/No flag | `BooleanCell` |
| Numeric quantity | `NumberCell` |
| Colored swatch (theme color, brand color) | `ColorSwatchCell` |
| "N rows / N items" | `CountCell` |
| Internal navigation link | `LinkCell` |
| External URL | `UrlCell` |
| Inline toggle | `SwitchCell` |
| Long free text | `TruncatedTextCell` (set `maxLength`) |

All cells share the same null-handling contract: a null / undefined
value renders the `emptyCellValue` em-dash (`"—"`).

**Full slot / prop tables.** See [`docs/react-table-reference.md`](./react-table-reference.md)
for prop tables, value-type signatures, and the file map.

#### Card composition

`<Card>` wraps `children` in a `<ChakraCard.Body>` which has built-in padding (~24px on all sides). Pass content directly — do **not** wrap in your own `<Box p="N">`, which doubles the padding.

```tsx
// ✓ Correct
<Card title="General">
  <Stack gap="4">
    <FormField .../>
    <FormField .../>
  </Stack>
</Card>

// ✗ Wrong — doubles the padding
<Card title="General">
  <Box p="6">
    <Stack gap="4">...</Stack>
  </Box>
</Card>
```

If you need a flush body (e.g. a `<DataTable>` inside a Card), file an issue — anker should add a `bodyPadding="none"` prop rather than having every consumer hand-roll the workaround.

---

## 13. Slot mechanism

`<AppShell>` exposes two write-side hooks for descendant components to
register content into the shell:

- `usePageActions(content: ReactNode)` — registers content into the
  page-actions slot, surfaced inside the active page template's
  `<PageHeader actions={…}>`.
- `usePageRail(content: ReactNode)` — reports content through the host
  contract; `<AppShell>`'s provider writes it into the rail slot, surfaced
  as the body of the right rail column (§2 Host contract).

### How it works

`<AppShell>` creates a slot store on mount and provides it via React
context. The store keeps the latest registered ReactNode for each
named slot plus a set of subscriber callbacks. Producers register
content in a `useEffect`; consumers read content via
`useSyncExternalStore`. This decouples render-time across React commit
boundaries.

```tsx
// Producer (a tab pane component, deep in the tree)
function UsersListPane() {
  usePageActions(
    <Button colorPalette="primary" onClick={openInviteModal}>
      Invite member
    </Button>
  );
  return <DataTable …/>;
}

// Consumer (the page template, also deep in the tree)
function IndexPageTemplate({ actions, …rest }) {
  const registered = useRegisteredPageActions();
  const resolvedActions = actions ?? registered;
  return <PageHeader actions={resolvedActions} {…} />;
}
```

### Why an external store (not plain context)

A naive `useState`-based context would force the consumer to render in
the same React commit as the producer. Because the producer is rendered
*after* the consumer (the page header is at the top of the tree, the
button-registering component is deep inside it), the consumer's first
paint sees `null` and the second paint shows the registered content —
causing a one-frame flicker on every route change.

The fix (originally shipped in odon as PR #115) is to use an external
store: the producer pushes the value via a `useEffect`, the store
notifies subscribers, and the consumer re-reads on the next browser
frame via `useSyncExternalStore`. React's concurrent renderer is happy,
the producer and consumer don't need to be in the same commit, and the
flicker disappears.

This is the **canonical** way to wire cross-cutting page chrome in
anker. Don't reach for state-management libraries (zustand, jotai) for
this — the slot store is local to the AppShell instance and doesn't
need a global namespace.

### When to use slot hooks vs. prop-drilling

Use slot hooks when:

- The content is rendered by a deep descendant (a tab pane, a
  selection-aware component) and needs to surface in the page chrome.
- The content depends on per-pane state (e.g. selection count).

Use prop-drilling (the `actions={…}` prop on the template) when:

- The content is rendered by the page-level component itself and is
  static across the page.
- The content is conditional on URL params that the page already
  knows about.

The two approaches are not exclusive — pass `actions={…}` for the
page-level default and let descendants override via `usePageActions`.
The template merges them: prop wins over registered, registered wins
over nothing.

---

## 14. Template components

This section enumerates the `@knkcs/anker/templates` exports.

### 14.1 `<AppShell>`

| Prop      | Type        | Required | Notes                                          |
|-----------|-------------|----------|------------------------------------------------|
| `sidebar` | `ReactNode` | yes      | Typically `<Sidebar>` from `/components`       |
| `rail`    | `ReactNode` | no       | Fallback for the rail column. `usePageRail` registration wins. |
| `children`| `ReactNode` | yes      | Page content                                   |

Exposes hooks: `usePageActions(node)`, `usePageRail(node)`.

Rail precedence: descendant `usePageRail(content)` wins over the `rail`
prop. The column is reserved when *either* a prop is supplied *or* a
descendant registers content; omit both to drop the third grid track.

### 14.2 `<IndexPageTemplate>`

| Prop          | Type        | Required | Notes                                          |
|---------------|-------------|----------|------------------------------------------------|
| `title`       | `ReactNode` | yes      |                                                |
| `breadcrumbs` | `Crumb[]`   | no       |                                                |
| `subtitle`    | `ReactNode` | no       |                                                |
| `eyebrow`     | `ReactNode` | no       |                                                |
| `actions`     | `ReactNode` | no       | Falls back to `usePageActions` registration    |
| `tabs`        | `ReactNode` | no       | `<Tabs.Root>`                                  |
| `toolbar`     | `ReactNode` | no       | `<Toolbar>`                                    |
| `children`    | `ReactNode` | yes      | Body, flush                                    |

### 14.3 `<DetailPageTemplate>`

| Prop          | Type        | Required | Notes                                          |
|---------------|-------------|----------|------------------------------------------------|
| `title`       | `ReactNode` | yes      |                                                |
| `breadcrumbs`, `subtitle`, `eyebrow`, `actions` | … | no |                                |
| `tabs`        | `ReactNode` | no       |                                                |
| `children`    | `ReactNode` | yes      | Body, flush                                    |

### 14.4 `<SettingsPageTemplate>`

| Prop           | Type        | Required | Notes                                          |
|----------------|-------------|----------|------------------------------------------------|
| `title`        | `ReactNode` | yes      |                                                |
| `tabs`         | `ReactNode` | yes      | Required                                       |
| `breadcrumbs`, `subtitle`, `eyebrow`, `actions` | … | no |                                |
| `maxBodyWidth` | `string`    | no       | Default `"3xl"`. Pass `"full"` to disable.     |
| `children`     | `ReactNode` | yes      | Body                                           |

### 14.5 `<DashboardPageTemplate>`

| Prop          | Type        | Required | Notes                                          |
|---------------|-------------|----------|------------------------------------------------|
| `title`       | `ReactNode` | yes      |                                                |
| `breadcrumbs`, `subtitle`, `eyebrow`, `actions` | … | no |                                |
| `gap`         | `string`    | no       | Default `"4"` (= 16px)                         |
| `children`    | `ReactNode` | yes      | Widgets in 12-col grid                         |

### 14.6 `<AuthPageTemplate>`

Slots inherited from `<AuthCard>`. See 11.5.

### 14.7 `<MarketingPageTemplate>`

See 11.9 for the full slot table.

### 14.8 `<ErrorPage>`

| Prop          | Type        | Required | Notes                                          |
|---------------|-------------|----------|------------------------------------------------|
| `statusCode`  | `ReactNode` | yes      | "404", "500", …                                |
| `title`       | `ReactNode` | yes      |                                                |
| `description` | `ReactNode` | no       |                                                |
| `actions`     | `ReactNode` | no       |                                                |
| `illustration`| `ReactNode` | no       |                                                |
| `logo`        | `ReactNode` | no       |                                                |

### 14.9 `<LoadingPage>`

| Prop      | Type        | Required | Notes                                          |
|-----------|-------------|----------|------------------------------------------------|
| `logo`    | `ReactNode` | no       |                                                |
| `message` | `ReactNode` | no       |                                                |

### 14.10 `<MaintenancePage>`

| Prop          | Type        | Required | Notes                                          |
|---------------|-------------|----------|------------------------------------------------|
| `logo`        | `ReactNode` | no       |                                                |
| `title`       | `ReactNode` | no       | Default: "We'll be right back"                 |
| `description` | `ReactNode` | no       | Default: "We're upgrading the service…"        |
| `eta`         | `ReactNode` | no       | Estimated time-of-restoration banner           |
| `statusLink`  | `ReactNode` | no       | Link to status page                            |

---

## 15. Authoring rules

These rules are the contract for solution authors.

1. **Use templates before composing primitives manually.** Reach for
   `<IndexPageTemplate>` before composing `<PageHeader>` + `<Toolbar>`
   + `<DataTable>` by hand. Templates exist so the composition is
   guaranteed correct.

2. **Templates are the contract. If a template doesn't fit, file an
   issue — don't reinvent the layout.** A new page type emerging in
   solution X should become a new template in anker, not a one-off.
   This is how visual parity stays guaranteed across solutions.

3. **Slots accept ReactNode. Don't pass styled raw elements that fight
   the template's spacing.** If you find yourself wrapping a slot's
   content in `<Box mt="-4" px="0">…</Box>` to undo the template's
   defaults, the template is wrong — file an issue.

4. **Don't bypass the host contract for cross-cutting chrome.**
   Page actions go through the template's `actions` (or `usePageActions`
   under `<AppShell>`), and rail content through `usePageRail` — not a
   Redux store, not a React context you set up yourself, not a portal.

5. **One template per page.** Pages don't nest templates. If a tab
   pane needs its own header, render it inside the parent template's
   body — don't put a `<DetailPageTemplate>` inside a
   `<DetailPageTemplate>`'s tabs.

6. **Keep i18n at the consumer level.** Templates speak English by
   default. Consumers wrap them with i18n strings (the same way they
   wrap `<Modal saveLabel={t("…")}>`).

7. **No domain-specific behavior in template props.** If a template
   prop name reads like a feature flag (`enableMfaCheck`,
   `oauthClientId`), it's wrong — domain logic belongs in consumer
   code, not in anker.

8. **Templates are pure layout.** They never import from a service
   codebase, never call APIs, never read i18n catalogues. The only
   imports allowed are anker primitives, anker components, and
   `lucide-react`.

9. **Visual changes ride a minor version.** Templates that change
   visually within a 1.x line must follow the same rule as the rest of
   anker — minor bump, deprecation note, migration guide.

10. **Test parity in storybook.** Every template has at least one
    canonical story and one variant story. If you find yourself
    visually tweaking a template's CSS, add a story that captures the
    change.

---

## 16. Primitives

#### DescriptionList

For label/value lists (read-only metadata blocks, identity summaries, etc.) use `<DescriptionList>` rather than hand-rolling `<Flex justify="space-between">` rows. Two orientations:

- `horizontal` (default) — label muted on left, value on right. Single-line per row. Use inside a Card body or under a settings form.
- `vertical` — label above value. Use as building block inside a `<Grid>` for stat-tile layouts.

```tsx
<DescriptionList>
  <DescriptionList.Row label="Email">{user.email}</DescriptionList.Row>
  <DescriptionList.Row label="ID" mono>{user.id}</DescriptionList.Row>
</DescriptionList>

<Grid templateColumns="repeat(3, 1fr)" gap="6">
  <DescriptionList orientation="vertical">
    <DescriptionList.Row label="Status">Active</DescriptionList.Row>
  </DescriptionList>
  ...
</Grid>
```

Don't use `<DescriptionList>` for editable form fields — pair `<TextInput>` with explicit labels instead.

---

## 17. References

- [`docs/design-system.md`](./design-system.md) — token system and
  visual language. Read first.
- [`CLAUDE-ANKER.md`](../CLAUDE-ANKER.md) — design-system rules
  consumers `@`-import into their `CLAUDE.md`. Includes a "Page
  templates" section that points back here.
- [`docs/react-table-reference.md`](./react-table-reference.md) —
  TanStack Table conventions used inside `<DataTable>`.
- [`docs/chakra-v3-reference.md`](./chakra-v3-reference.md) — Chakra
  v3 patterns this repo enforces.
- [`README.md`](../README.md) — consumer-facing entry point with the
  "Setup for consumers" section.
