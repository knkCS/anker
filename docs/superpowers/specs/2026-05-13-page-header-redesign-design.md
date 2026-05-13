# Page Header Redesign — three-row band with detail + tabs

**Date:** 2026-05-13
**Scope:** `@knkcs/anker` (design system) + `odon` (consumer). Other solutions consume the new shape automatically when they bump anker.
**Predecessor:** builds on `2026-05-13-context-rail-position-design.md` (header band spans main + rail; rail starts under it). This change replaces the inner shape of that band with a richer, three-row structure.

## Problem

The current page header band displays only breadcrumb + title + actions. On detail pages, page authors render an "entity identity card" (avatar / name / badges / contact line) **below** the band as a separate visual block, plus a tab strip rendered **further below** as a third visually-distinct row. The result is three unrelated horizontal strips stacked on different background surfaces — visually it reads as "nearly two page headers plus disconnected tabs". On index pages, filter chips (e.g., `Alle / Aktiv / Eingeladen / Gesperrt`) appear inside the body as a fourth visual layer rather than being part of the page header.

The goal: collapse all of that into one continuous white-bg band with three intentional rows — breadcrumb, detail, tabs — that spans the main + rail columns, with the rail starting below the entire band.

## Reference design

Three stacked rows on `bg-surface`, separated by spacing, in order:

1. **Breadcrumb** — small muted text (`Identity › Users › Jana Schmid`).
2. **Detail** — flex row containing optional avatar (left), title block with badges and a meta line (center, flex-1), and actions (right). On index pages the avatar/badges/meta are omitted; only title + actions are present.
3. **Tabs** — text-only tab strip with an underline on the active tab and small count pills. Omitted entirely when a page has no tabs.

All three rows live inside the same `<PageHeader>` Box (the existing `bg="bg-surface"` band). Spacing — not borders — separates the rows. The band's bottom border (already present) marks the transition to the body / rail.

## Goals

1. Update `<PageHeader>` to render the three-row structure when its new optional props are provided.
2. Migrate `IndexPageTemplate` and `DetailPageTemplate` so the existing `tabs` prop and (Detail's) `subheader` content reach `<PageHeader>` via the new props instead of being rendered as separate rows in the template body.
3. Update odon's `UserDetailLayout` to consume the new props directly, retiring the `<UserIdentityCard>` abstraction.
4. Update odon's index pages (e.g., `AdminUsersPage`) to pass their filter chips to `tabs`.

## Non-goals

- AppShell grid / slot mechanism — unchanged. The header band still spans main + rail via the existing `usePageHeader` slot.
- ContextRail — unchanged.
- Tab body components in odon (`features/user-detail/tabs/*`) — unchanged; only the shell that hosts them moves.
- Pages that don't use page templates — unchanged.
- A new "rich-detail" widget on the index page (avatar/meta on index) — out of scope; index header only carries title + actions + tabs.

## Design

### 1. `<PageHeader>` — new shape

Props (changes marked `NEW`; existing props unchanged):

```ts
export interface PageHeaderProps {
  breadcrumbs?: PageHeaderBreadcrumb[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  avatar?: React.ReactNode;   // NEW — rendered left of the title in the detail row
  badges?: React.ReactNode;   // NEW — inline next to the title
  meta?: React.ReactNode;     // NEW — secondary line below the title (email · dept · id, …)
  tabs?: React.ReactNode;     // NEW — tab-strip row at the bottom of the band
}
```

Internal layout (one `<Box bg="bg-surface" borderBottomWidth=1px borderBottomColor=border>`):

- **Row 1 (breadcrumb)** — rendered only when `breadcrumbs?.length > 0`. Existing styling.
- **Row 2 (detail)** — always rendered (the page has a title). A `<Flex align="flex-start" gap="4">` containing:
  - `avatar` slot (omitted if not provided),
  - title block: `<Heading>` + `badges` (inline, gap=2) on one line; `meta` on the line below; existing `subtitle` if provided sits between heading and meta,
  - `actions` slot (right, `flexShrink=0`), aligned to top of the row.
- **Row 3 (tabs)** — rendered only when `tabs` is provided. Sits flush at the bottom of the band; the underline on the active tab visually meets the bottom border of the band.

Spacing tokens used: `py` on the outer box (existing), `mb` between rows. `eyebrow` (rare) stays in its existing position above the breadcrumb.

### 2. Page-template migration

**`IndexPageTemplate`**
- `tabs` prop's render location moves: instead of rendering `{tabs ? <Box>{tabs}</Box> : null}` between PageHeader and toolbar, the template passes `tabs` into the registered `<PageHeader tabs={tabs}>`.
- `toolbar` prop unchanged — still rendered in the body, below the header band, on the canvas.
- The template body now renders only `toolbar` + `children`.

**`DetailPageTemplate`**
- Remove the `subheader` prop. Add `avatar`, `badges`, `meta` props that pipe directly into `<PageHeader>`.
- `tabs` prop: flows into `<PageHeader tabs={tabs}>` (was: rendered as a separate row in the template body).
- `bodyTabs` prop: **removed.** It conflicts with the new design — `bodyTabs` worked by owning a single `<Tabs.Root>` whose `<Tabs.List>` and `<Tabs.Content>` were sibling descendants of the template. Under the new design, the tab list renders inside the header band (registered via the slot store, rendered by AppShell in a different part of the React tree) and the panels render in the template body; one `Tabs.Root` ancestor cannot wrap both, so context-based tab state can't bridge them. Pages that previously used `bodyTabs` migrate to nav-link tabs (the pattern odon's `UserDetailLayout` already uses): build a `<Tabs.Root value={activeTabFromUrl}>` with only `<Tabs.List>` inside, pass it to `tabs`, and let the router (or local state) render the active panel as `children`. This is structurally simpler and matches how every existing `bodyTabs` consumer actually uses it.

**`SettingsPageTemplate`**
- Same treatment as `DetailPageTemplate` if it currently uses a `subheader` or renders tabs separately. (Most settings pages won't carry avatars/badges, so the new props default to `undefined` and the detail row collapses to title-only.)

### 3. odon migration

**`web/src/components/user/UserDetailLayout.tsx`**
- Delete the `<UserIdentityCard>` import and usage.
- Build the avatar / badges / meta nodes inline (or extract into local helpers if useful) and pass them as `avatar`, `badges`, `meta` props on `DetailPageTemplate`.
- The existing `tabs` prop continues to be passed as before — only the rendering location changes (handled by anker).

**`web/src/components/user/UserIdentityCard.tsx`**
- Delete. Any logic worth keeping (admin-mode vs self-mode visual differences, fallbacks for missing data) moves into the helpers in `UserDetailLayout`.

**`web/src/pages/AdminUsersPage.tsx` and other index pages with filter chips**
- Move the filter-chip strip from the body / toolbar into the `tabs` prop on `IndexPageTemplate`.
- Search bar + filter buttons remain in the body (passed as `toolbar` or as children, matching current usage).

### 4. Empty / edge cases

- **Pages with no avatar/badges/meta** (most index pages, simple detail pages): detail row collapses to title + actions. Row 1 (breadcrumb) and row 3 (tabs) are independently optional.
- **Pages with no tabs**: row 3 is omitted; the band has just breadcrumb + detail.
- **Personal area pages in odon** (`/settings/profile`, `/settings/security`, etc.): no `tabs` prop — these pages stand alone, the sidebar provides navigation between them. No special-casing needed in anker.
- **`bodyTabs` flow**: `<Tabs.Root>` must wrap both the tab list (in the header) and the tab panels (in the body). The template renders one `Tabs.Root` that spans both regions. The `tabs` slot on `PageHeader` receives a `<Tabs.List>` element; the body receives `<Tabs.Content>` panels. This works because `Tabs.Root` reads its state from React context, not from DOM proximity.

## Documentation updates

Anker's docs are the authoritative description of the shell shape used by every knkCMS solution. The new three-row band needs to be reflected in every place a solution author looks for "what does a page header look like":

- **`docs/page-patterns.md` § App-shell composition** — update the ASCII diagram of the header band to show three rows (breadcrumb · detail · tabs).
- **`docs/page-patterns.md` — new section "Page header anatomy"** placed between the App-shell composition section and the Sidebar section. Describes the three optional rows, what each `PageHeader` prop renders, and which rows collapse when their props are absent. Includes one snippet for a typical detail page (avatar/badges/meta/tabs) and one for an index page (title + tabs).
- **`docs/page-patterns.md` § Tabs vs sub-section nav** (currently around lines 282–287) — update the rule of thumb: the new design makes tabs a first-class slot on `PageHeader`, so the "if each item has its own page header, they're sub-section nav" guidance needs a refresh. Specifically: tabs are now part of the page header band; pages whose top-level identity differs should still be separate index pages, but within a single index/detail page the tab row is the right tool for in-page navigation.
- **`docs/page-patterns.md` § ContextRail patterns** — clarify that the rail's vertical origin is "below the entire header band (including the tabs row when present)". The earlier `2026-05-13-context-rail-position-design.md` spec said "below the header"; that wording stays correct but the rail-below-tabs implication is worth calling out explicitly.
- **`CLAUDE-ANKER.md`** — update the `<PageHeader>` summary (the one-line table entry) to mention the new `avatar` / `badges` / `meta` / `tabs` props. Update the `<DetailPageTemplate>` entry to remove `subheader` and mention `avatar` / `badges` / `meta`.
- **`src/components/page-header.mdx` (new file)** — `PageHeader` currently has no MDX docs page (only `.tsx` stories). Add an MDX page that documents the three rows, prop reference, and provides MDX-embedded stories for each combination. This gives Storybook readers a Cmd-K-searchable "PageHeader" entry alongside the other component docs.
- **`src/templates/app-shell.tsx` header comment** — the ASCII diagram at the top of the file (last updated by the rail-position work) needs a small refresh: the header band's interior is now three rows instead of one.

We intentionally do NOT update `docs/design-system.md` — that file covers tokens / primitives, not page-level patterns, and currently doesn't mention `PageHeader`. Adding `PageHeader` there would duplicate `page-patterns.md`'s coverage.

## Testing

- `page-header.test.tsx` — add cases:
  - renders avatar / badges / meta when provided
  - omits the detail row's secondary line when `meta` is absent
  - renders the tabs row when `tabs` is provided
  - omits the tabs row when `tabs` is absent
  - renders all three rows together
- `index-page-template.test.tsx` — assert that a `tabs` prop is registered into the header (under `app-shell-header`) and is NOT a sibling of the template body.
- `detail-page-template.test.tsx` — same, plus `avatar` / `badges` / `meta` reach the header.
- `app-shell.stories.tsx` — extend the `WithHeaderAndRail` story to show the new three-row band.
- `page-header.stories.tsx` — add a story per row combination (breadcrumb-only, breadcrumb + detail, breadcrumb + detail + tabs).

## Risks

- **Visual regression for consumers that haven't updated their detail/index pages.** Mitigated by SemVer minor bump: new props are additive; old props (`title`, `breadcrumbs`, `actions`) continue to work. Existing pages that DON'T pass `avatar`/`badges`/`meta`/`tabs` render exactly as they do today.
- **`subheader` removal is a breaking change for `DetailPageTemplate`.** Mitigated by keeping `subheader` as a deprecated alias for one release (renders the same content below the title row, with a `console.warn` in dev mode). The deprecation is removed in the next minor.
- **`bodyTabs` split-rendering** (tab list in header, panels in body) is a structural change. Mitigated by tests asserting the tab list reaches the header slot and panels reach the body.

## Rollout

1. Implement and merge in anker; cut `v2.2.0` (minor — additive props, plus deprecated `subheader`).
2. Bump anker in odon to `^2.2.0`.
3. Migrate `UserDetailLayout` (delete `UserIdentityCard`, pass new props).
4. Migrate `AdminUsersPage` (move filter chips into `tabs`).
5. Visual smoke-check the user index and user detail pages.
6. Optionally migrate other admin index pages (audit log, OAuth clients, webhooks) to use `tabs` for any existing filter strips.
