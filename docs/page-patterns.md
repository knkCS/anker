# anker Page Patterns

**Version:** 1.x
**Status:** Active — source-of-truth contract for knkCMS solutions
**Last updated:** May 2026

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
┌────────────┬─────────────────────────────────────┬────────────┐
│            │                                     │            │
│  Sidebar   │            Main content             │ ContextRail│
│   240px    │              (fluid)                │   320px    │
│ ↔ 60px     │                                     │  ↔ 44px    │
│ collapsed  │                                     │ collapsed  │
│            │                                     │            │
└────────────┴─────────────────────────────────────┴────────────┘
```

### Dimensions

| Element       | Expanded width | Collapsed width | Collapse breakpoint |
|---------------|----------------|-----------------|---------------------|
| `<Sidebar>`   | 240px          | 60px (icon rail) | < 1440px viewport  |
| `<ContextRail>` | 320px        | 44px (icon-only) | < 1440px viewport  |
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

### Slot mechanism

`<AppShell>` installs a slot store on its descendants via React context.
Two named slots are exposed:

- **`actions`** — registered via `usePageActions(content)`. Surfaced by
  the active page template inside its `<PageHeader>` `actions` slot.
- **`rail`**    — registered via `usePageRail(content)`. Surfaced as the
  body of the right rail column.

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

## 3. Sidebar IA

The sidebar is the global navigation surface. It is the first thing users
see on every page and the only navigation surface that is always visible
in the chrome.

### Section anatomy

A sidebar is composed of:

1. **`<Sidebar.Header>`** — fixed-height header band. Contains
   `<Sidebar.Logo>` (wordmark + optional subtitle + collapse toggle).
2. **`<Sidebar.Body>`** — scrolling section list. Contains zero or more
   `<Sidebar.Section>`s, each of which contains zero or more
   `<Sidebar.Item>`s.
3. **`<Sidebar.Footer>`** — fixed-height footer band. Typically holds
   `<Sidebar.UserMenu>`.

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

### When sections appear vs. when they're empty

- **Show a section** when it has at least one item visible to the current
  user. Empty sections must not be rendered — a section header with no
  items is visual noise.
- **Show all sections** when none are user-context-dependent. If a
  section's visibility depends on permissions, render the whole section
  conditionally.

### Footer

The footer is reserved for `<Sidebar.UserMenu>` (account avatar +
dropdown with personal-settings, theme toggle, sign-out). Solutions may
add product-specific items above the user menu (e.g. a "Help" link) by
nesting them inside `<Sidebar.Footer>` above `<Sidebar.UserMenu>`.

The collapse-toggle lives **inside** `<Sidebar.Logo>`, not in the footer.
This was a deliberate move in 1.8.1 — putting the toggle in the header
keeps the footer pure user-action territory.

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

---

## 4. ContextRail patterns

The context rail is the **right column** of the app shell — a fixed-width
secondary surface for at-a-glance information that supports the main
content without being part of it.

### When to render

Render a rail when a page benefits from showing "what" or "how many" of
the things shown in the main content, without making the user scroll.
Indicators that a rail belongs:

- A list page with > 50 items (rail shows aggregate stats / filters).
- A detail page with related entities (rail shows links to siblings,
  parent records, audit summary).
- A page where bulk-selection is a primary action (rail substitutes for
  the bulk-action bar — see below).

### When to hide

- The page is one screen of content (no scroll). The rail would be empty
  air.
- The page is a form or settings tab. Rails compete with form fields for
  the user's attention; settings should be read top-to-bottom.
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

Used on detail pages. Shows the entity's relationships and metadata
(parent record, sibling records, audit-log shortcut).

```tsx
<ContextRail>
  <ContextRail.Header eyebrow="USER" title="Jana Schmid" />
  <ContextRail.Section id="meta" label="Metadata">
    <DataList items={[
      { label: "Created", value: <RelativeDateTime value={createdAt} /> },
      { label: "Last sign-in", value: <RelativeDateTime value={lastSignIn} /> },
    ]} />
  </ContextRail.Section>
  <ContextRail.Section id="related" label="Related">
    <Link href="/users/jana/sessions">Active sessions →</Link>
  </ContextRail.Section>
</ContextRail>
```

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

When the rail is collapsed, only a thin 44px column with the
expand-toggle remains. Section content is hidden. Tooltips on the
toggle hint at what's hidden.

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
      <StatusBadge status="success">Active</StatusBadge>
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

Tab content can be either:

- **Flush** — content extends edge-to-edge of the page body. Use for
  index-page tabs whose body is a `<DataTable>` (the tables already
  span full-width).
- **Padded** — content is wrapped in `<Box px="8" py="6">`. Use for
  settings-page tabs whose body is form Cards.

The page templates do not apply padding inside the `tabs` slot. The tab
content's own children determine the padding strategy.

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

## 8. Modal patterns

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
place red is allowed in the UI.

---

## 9. Form patterns

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

### Required vs. optional treatment

- **Required**: append a small `*` after the label, no extra text.
- **Optional**: append `(optional)` after the label in muted color.

Don't mark some fields required-with-asterisk and others
optional-with-text in the same form — pick one and stick with it. Forms
with mostly-required fields use `(optional)` markers; forms with
mostly-optional fields use `*` on the few that are required.

### Save-button placement

Two patterns:

1. **Card-internal save** — settings tab cards have their save button
   inside the card footer (`<Card footer={…}>`). Use when the form is
   one of several independent sections on the page.
2. **PageHeader actions save** — full-page edit forms have their save
   button in the PageHeader's `actions` slot. Use when the form is the
   entire page.

Never both. A PageHeader save + a Card save on the same screen is a UX
trap (which one persists?).

### Inline edit vs. full-page edit

- **Inline edit (modal)**: small forms, ≤ 6 fields, no nested data.
  Use `<Modal>`.
- **Full-page edit (DetailPageTemplate)**: large forms, nested data,
  dependent fields. Use a separate page rendered by
  `DetailPageTemplate` with the form Card-wrapped in the body.

---

## 10. Empty / loading / error states

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

### Error Alert placement

Inline errors on flush `bg-canvas` pages use `<Alert>` with explicit
horizontal margin so they don't sit flush against the page edge:

```tsx
<Alert
  status="error"
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

## 11. Page templates

This section defines every supported page template. Each template
includes a composition diagram, when-to-use guidance, and escape
hatches (the deviation rules — when it's acceptable to *not* use the
template).

The **one rule** every template enforces: **slots accept ReactNode,
not config objects**. This is deliberate. Slots are escape hatches —
if the template doesn't fit, you can pass arbitrary content into the
slot. Config objects would force every variant to be expressible as
data, and we don't have that crystal ball.

### 11.1 IndexPageTemplate

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

### 11.2 DetailPageTemplate

**When to use.** Any "single entity" page: a single user, a single
OAuth client, a single audit event detail, a single webhook config.

**Composition.**

```
┌───────────────────────────────────────┐
│ PageHeader  (breadcrumbs · title)     │
├───────────────────────────────────────┤
│ Tabs (optional)                       │
├───────────────────────────────────────┤
│ children  (identity Card · panes …)   │
│   px="8" pt="6" by default            │
└───────────────────────────────────────┘
```

**Slots.**

| Prop          | Type        | Default | Notes                                                |
|---------------|-------------|---------|------------------------------------------------------|
| `breadcrumbs`, `title`, `subtitle`, `eyebrow` | … | … | Same as IndexPageTemplate            |
| `actions`     | `ReactNode` | reads `usePageActions` | —                                         |
| `tabs`        | `ReactNode` | —       | Recommended for entities with multiple aspects       |
| `children`    | `ReactNode` | —       | Body — typically an identity Card + tab content      |
| `flush`       | `boolean`   | `false` | When `true`, removes the default `px="8" pt="6"`     |

**Escape hatches.**

- `flush={true}` removes the default body padding. Use for code-editor
  pages or full-bleed media viewers.
- The identity-Card-then-tabs pattern is a convention, not a
  requirement. A detail page without tabs is fine — render the body
  however the entity demands.

### 11.3 SettingsPageTemplate

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

**Escape hatches.**

- `maxBodyWidth="full"` disables the readability constraint. Use when a
  settings tab needs a full-width DataTable (rare — that's an index
  page in disguise).
- A single-tab settings page is a sign you should be using
  DetailPageTemplate instead. Use SettingsPageTemplate only when there
  are ≥ 2 tabs.

### 11.4 DashboardPageTemplate

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

### 11.5 AuthPageTemplate

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

### 11.6 Verify / Confirm page

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

### 11.7 OAuth consent page

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

### 11.8 Logout / signed-out page

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

### 11.9 MarketingPageTemplate

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

### 11.10 ErrorPage

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

### 11.11 LoadingPage

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

### 11.12 MaintenancePage

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

## 12. Slot mechanism

`<AppShell>` exposes two write-side hooks for descendant components to
register content into the shell:

- `usePageActions(content: ReactNode)` — registers content into the
  page-actions slot, surfaced inside the active page template's
  `<PageHeader actions={…}>`.
- `usePageRail(content: ReactNode)` — registers content into the rail
  slot, surfaced as the body of the right rail column.

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

## 13. Template components

This section enumerates the `@knkcs/anker/templates` exports.

### 13.1 `<AppShell>`

| Prop      | Type        | Required | Notes                                          |
|-----------|-------------|----------|------------------------------------------------|
| `sidebar` | `ReactNode` | yes      | Typically `<Sidebar>` from `/components`       |
| `rail`    | `ReactNode` | no       | Fallback for the rail column. `usePageRail` registration wins. |
| `children`| `ReactNode` | yes      | Page content                                   |

Exposes hooks: `usePageActions(node)`, `usePageRail(node)`.

Rail precedence: descendant `usePageRail(content)` wins over the `rail`
prop. The column is reserved when *either* a prop is supplied *or* a
descendant registers content; omit both to drop the third grid track.

### 13.2 `<IndexPageTemplate>`

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

### 13.3 `<DetailPageTemplate>`

| Prop          | Type        | Required | Notes                                          |
|---------------|-------------|----------|------------------------------------------------|
| `title`       | `ReactNode` | yes      |                                                |
| `breadcrumbs`, `subtitle`, `eyebrow`, `actions` | … | no |                                |
| `tabs`        | `ReactNode` | no       |                                                |
| `flush`       | `boolean`   | no       | `true` removes default body padding            |
| `children`    | `ReactNode` | yes      | Body, padded by default                        |

### 13.4 `<SettingsPageTemplate>`

| Prop           | Type        | Required | Notes                                          |
|----------------|-------------|----------|------------------------------------------------|
| `title`        | `ReactNode` | yes      |                                                |
| `tabs`         | `ReactNode` | yes      | Required                                       |
| `breadcrumbs`, `subtitle`, `eyebrow`, `actions` | … | no |                                |
| `maxBodyWidth` | `string`    | no       | Default `"3xl"`. Pass `"full"` to disable.     |
| `children`     | `ReactNode` | yes      | Body                                           |

### 13.5 `<DashboardPageTemplate>`

| Prop          | Type        | Required | Notes                                          |
|---------------|-------------|----------|------------------------------------------------|
| `title`       | `ReactNode` | yes      |                                                |
| `breadcrumbs`, `subtitle`, `eyebrow`, `actions` | … | no |                                |
| `gap`         | `string`    | no       | Default `"4"` (= 16px)                         |
| `children`    | `ReactNode` | yes      | Widgets in 12-col grid                         |

### 13.6 `<AuthPageTemplate>`

Slots inherited from `<AuthCard>`. See 11.5.

### 13.7 `<MarketingPageTemplate>`

See 11.9 for the full slot table.

### 13.8 `<ErrorPage>`

| Prop          | Type        | Required | Notes                                          |
|---------------|-------------|----------|------------------------------------------------|
| `statusCode`  | `ReactNode` | yes      | "404", "500", …                                |
| `title`       | `ReactNode` | yes      |                                                |
| `description` | `ReactNode` | no       |                                                |
| `actions`     | `ReactNode` | no       |                                                |
| `illustration`| `ReactNode` | no       |                                                |
| `logo`        | `ReactNode` | no       |                                                |

### 13.9 `<LoadingPage>`

| Prop      | Type        | Required | Notes                                          |
|-----------|-------------|----------|------------------------------------------------|
| `logo`    | `ReactNode` | no       |                                                |
| `message` | `ReactNode` | no       |                                                |

### 13.10 `<MaintenancePage>`

| Prop          | Type        | Required | Notes                                          |
|---------------|-------------|----------|------------------------------------------------|
| `logo`        | `ReactNode` | no       |                                                |
| `title`       | `ReactNode` | no       | Default: "We'll be right back"                 |
| `description` | `ReactNode` | no       | Default: "We're upgrading the service…"        |
| `eta`         | `ReactNode` | no       | Estimated time-of-restoration banner           |
| `statusLink`  | `ReactNode` | no       | Link to status page                            |

---

## 14. Authoring rules

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

4. **Don't bypass the slot mechanism for cross-cutting chrome.**
   Page-actions and rail content belong in the AppShell slot store,
   not in a Redux store, not in a React context you set up yourself,
   not in a portal.

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

## 15. References

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
