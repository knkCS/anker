# Changelog

All notable changes to `@knkcs/anker` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## 1.13.0 — 2026-05-08

### Added
- `<DescriptionList>` component with `<DescriptionList.Row>` children. Supports `orientation="horizontal"` (default) and `orientation="vertical"`. Replaces hand-rolled Flex/Box patterns for read-only metadata blocks.

## 1.12.0 — 2026-05-08

### Added
- `DetailPageTemplate.bodyTabs` and `SettingsPageTemplate.bodyTabs` —
  declarative owned-panel tabs. Template wraps `<Tabs.Root>` with
  `lazyMount unmountOnExit` so only the active tab mounts. Eliminates
  the stuck-header-actions footgun from consumer-owned Tabs.Root.
- `DetailPageTemplate.subheader` — ReactNode rendered between the
  PageHeader and tabs/body. Use for identity-card-style summaries.

### Changed
- `tabs` prop on Detail/SettingsPageTemplate now documented as
  nav-mode/filter-mode only (Tabs.List with no Tabs.Content). For
  owned-panel tabs, use `bodyTabs`. Passing both throws.

## [1.10.4] — 2026-05-05

### Fixed

- **Outline button hover now respects `colorPalette`.** Previously the `outline` variant hard-coded `gray.50`/`gray.700` for `_hover`, `_checked`, and `_active`, so a `<Button colorPalette="red" variant="outline">` showed a gray hover background instead of a red-tinted one. The variant now uses the `colorPalette.50`/`colorPalette.100` and `colorPalette.900/40`/`colorPalette.800` semantic tokens so the tint follows the active palette (red outline → light red hover, primary outline → light primary hover, gray outline → light gray hover — matching previous default behavior). The `secondary` variant is intentionally unchanged: it is meant to be a neutral gray outline regardless of the consumer's `colorPalette`.
- **AppShell sidebar and rail columns are now sticky.** `position: sticky` with `top: 0`, `align-self: start`, `max-height: 100vh`, and `overflow-y: auto` keeps the sidebar and rail in place while the main column scrolls. Previously the entire grid scrolled when the main content overflowed the viewport, so the navigation disappeared on long pages.

## [1.10.3] — 2026-05-05

### CI

- **`verify-exports` script** asserts every source-side export of a tsup entry appears in the built `.d.ts`. Catches missing-bundle-export bugs (e.g. the 1.10.0 `IdentityCell`/`DeviceCell` incident where the cells barrel exported the symbols but `src/components/index.ts` didn't re-export them, so the published tarball had no declarations for them and consumers got "module has no exported member"). Walks each tsup entry's source via the TypeScript compiler API, recursively gathers the transitive named-export closure (treating `index.ts`/`index.tsx` files as barrels that widen, leaf `.tsx` files as strict named-list filters), then parses the corresponding `dist/<entry>/index.d.ts` and reports any missing symbols. Wired into `prepublishOnly`, the `CI` workflow, and the `Publish` workflow — every step that previously claimed "build is fine" now also proves the artifact contains what the source advertises. Run locally with `npm run verify-exports`; run the script's own unit tests with `npm run verify-exports:self-test`.

## [1.10.2] — 2026-05-05

`colorPalette` prop on `IdentityCell` (forwards to underlying Avatar); `icon` prop on `StatusBadgeCell` (renders before label inside the badge).

### Added

- **`IdentityCell` `colorPalette` prop** — optional `string` forwarded to the underlying `Avatar` primitive (e.g. `"primary"`, `"secondary"`). Tints the fallback initials circle with the chosen palette so consumers can match their app's accent color instead of the default neutral-gray. Backwards compatible: omitting the prop preserves the current look. Restores odon's pre-anker `UserAvatar` "dark blue circles" appearance.
- **`StatusBadgeCell` `icon` prop** — optional `React.ReactNode` rendered inline before the label inside the Badge with a small gap. Use a `lucide-react` glyph (or any icon component) to mark statuses like 2FA "On" / "Off". Backwards compatible: omitting `icon` keeps the current label-only badge. Composes with `detail` and `tooltip`. Restores odon's pre-anker `MfaBadge` icon affordance.

## [1.10.1] — 2026-05-06

### Fixed

- `IdentityCell`, `DeviceCell`, `parseUserAgent`, `formatUserAgent` are now actually exported from the `@knkcs/anker/components` bundle. The 1.10.0 release shipped them in the source tree but forgot to re-export them from `src/components/index.ts` (the tsup entry), so the published tarball was missing the new symbols. **Use 1.10.1 — 1.10.0 is broken.**

## [1.10.0] — 2026-05-05

Two new cells (`IdentityCell`, `DeviceCell`); `subText` prop on `TruncatedTextCell`; `tooltip` prop on `StatusBadgeCell`; cell library hoisted in docs.

### Added

- **`IdentityCell`** (`@knkcs/anker/components/data-table/cells`) — avatar + primary name + optional sub-text. The canonical "person" cell for users, members, requesters, and similar references in DataTables. Initials are auto-derived from `name` when `avatarFallback` is omitted; `size` defaults to `"sm"` to match table density. Null `name` falls back to `emptyCellValue` like every other cell. Closes #97.
- **`DeviceCell`** (`@knkcs/anker/components/data-table/cells`) — User-Agent string → "Chrome on macOS" label, with the raw UA shown muted below and reachable via hover tooltip. Optional `badge` slot to mark "Current" sessions or similar affordances. Internal `parseUserAgent` / `formatUserAgent` helpers cover Chrome, Safari, Firefox, Edge, and Opera on macOS, iOS, Windows, Android, and Linux; both are exported so solutions can reuse the same parser outside table contexts. Replaces odon's hand-rolled `web/src/utils/user-agent.ts` plus inline session-row JSX. Closes #98.
- **`TruncatedTextCell` `subText` prop** — optional secondary line rendered below the primary value in smaller muted text (`lineClamp={1}`). Primary value still respects `maxLength`. Backwards compatible; consumers that don't pass `subText` see no change. Replaces inline `<Stack><Text/><Text/></Stack>` compositions for "name + creation date" / "target + ID" patterns. Closes #99.
- **`StatusBadgeCell` `tooltip` prop** — optional `ReactNode` that wraps the rendered Badge in `<Tooltip>` from `@knkcs/anker/primitives`. Use for status descriptions, full metadata payloads, or any "expand on hover" affordance that doesn't fit on the badge label. Composes cleanly with the existing `detail` prop. Backwards compatible. Closes #100.

### Documentation

- **`docs/page-patterns.md` §11.13 — DataTable cells.** New section that surfaces the cell library: states the rule (cells are the contract; file an issue before hand-rolling), lists all 16 cells with one-line use cases, and gives a mapping guide for common column intents (status → `StatusBadgeCell`, timestamp → `DateCell`, mono ID → `SlugCell`/`CodeCell`, action button → `ActionCell`, person reference → `IdentityCell`, device/UA → `DeviceCell`, primary + sub text → `TruncatedTextCell` with `subText`). Links out to the full slot/prop tables in `docs/react-table-reference.md`.
- **`CLAUDE-ANKER.md` — DataTable cells.** New compact section right after "Page templates" that bakes the cells contract into the rules file consumers `@`-import. AI sessions working on solution code now see cells as a first-class option alongside templates and primitives. Includes the import path and pointers to the deeper docs.
- **`docs/react-table-reference.md` — Cell components.** Bumped from "11 cells" (stale; main was already at 14) to "16 cells" (14 existing + `IdentityCell` + `DeviceCell`). Cell table sorted alphabetically; new `subText` (TruncatedTextCell) and `tooltip` (StatusBadgeCell) props called out. The rule from §11.13 is repeated at the top of the cells section so this doc remains self-contained. File map updated with `device-cell.tsx`, `identity-cell.tsx`, and `user-agent.ts`.

### Discoverability

The first consumer (odon) used **zero** cells in its initial DataTable rollouts — every column file pulled `Badge`, `Box`, `Text`, `Tooltip` from primitives and hand-rolled cell content. The library existed but wasn't surfaced anywhere AI sessions or new contributors would see it. This release fixes the discoverability gap on three sides: the page-patterns spec, the AI rules file, and the React Table reference all now lead with cells.

## [1.9.4] — 2026-05-05

Doc clarification on `<ContextRail>` Root wrapper requirement; dev-mode warning when Header/Section is rendered outside Root; de-duped styling between AppShell rail column and ContextRail Root; removed dead `onClose` prop on Header.

### Documentation

- **`docs/page-patterns.md` §4 — Rail Root contract.** Adds an explicit "Rail Root contract (required)" subsection documenting that rail content MUST be wrapped in `<ContextRail>` (the Root) to get the column width, collapse toggle, inner padding, and persistence. Using `<ContextRail.Header>` / `<ContextRail.Section>` inside a fragment renders without errors but silently strips all of those features — a trap the first consumer (odon) fell into. The "Common rail mistakes" callout now leads with this as mistake #1.

### Changed

- **`<ContextRail>` Root no longer sets `bg="bg-surface"` / `borderLeftWidth="1px"` / `borderLeftColor="border"`.** That column-level styling now lives exclusively on `<AppShell>`'s rail column (added in 1.9.3), which is the source of truth and applies even when the rail content is something other than `<ContextRail>`. Eliminates the double-style. Visual contract unchanged for consumers using `<ContextRail>` inside `<AppShell>` — the surface and divider come from the column. Storybook stories now wrap `<ContextRail>` in an equivalent column wrapper so the visual still matches in isolation.
- **Dev-mode warning when `<ContextRail.Header>` / `<ContextRail.Section>` is rendered outside `<ContextRail>`.** A small private `RailRootContext` is provided by the Root; children consume it on mount and, in `process.env.NODE_ENV !== 'production'`, log a single `console.warn` per mount with a clear message pointing at `docs/page-patterns.md`. No throw, no behavior change in production. Pure DX nudge so future consumers don't repeat odon's silent-failure bug.

### Removed

- **`<ContextRail.Header>` `onClose?: () => void` prop.** Dead since the component was added — the implementation only destructured it as `_onClose` and never wired it up. The Root already provides a collapse toggle; a separate "close" button on the Header would be redundant. **Technically a breaking change to the type, but no consumer ever passed the prop** — removing rather than wiring it up keeps the API surface honest.

## [1.9.3] — 2026-05-05

### Fixed

- **`<AppShell>` main + rail columns now render on `bg-surface` (white) with 1px column dividers; page-template bodies no longer force `bg-canvas`. Restores the handoff visual design.** In 1.9.0–1.9.2 the main and rail columns inherited the grid's `bg-canvas` (gray), making them visually indistinguishable from the sidebar; the only structural separator was the PageHeader's bottom border, which left content in `<DetailHeader>` and the rail column appearing to overlap with no hard boundary. AppShell now sets `bg="bg-surface"` and a `borderLeftWidth="1px" borderColor="border"` divider on both the main column (`gridColumn="2"`) and the rail column (`gridColumn="3"`), matching odon's pre-anker hand-rolled `AppLayout`. The sidebar continues to inherit the grid's `bg-canvas` (gray) — the surface contrast is what produces the column separation.
- **Page-template bodies no longer force `bg-canvas`.** `<IndexPageTemplate>`, `<DetailPageTemplate>`, `<SettingsPageTemplate>`, and `<DashboardPageTemplate>` previously set `bg="bg-canvas"` on their outer `<Flex>`, which overrode any surface treatment AppShell applied to its main column. The templates now inherit their parent's surface — `bg-surface` when rendered inside `<AppShell>`, or whatever the surrounding wrapper provides in stories / standalone tests. Visual-only change; no public API impact.

### Documentation

- **`docs/page-patterns.md` §2 — "Column surfaces" subsection added.** Documents the anker visual contract: sidebar = `bg-canvas`, main + rail = `bg-surface`, with a 1px `border` divider between each column. Consumers should not override.

## [1.9.2] — 2026-05-05

### Changed

- **`<DetailPageTemplate>` now renders its body flush by default; the `flush` prop has been removed.** Previously the body wrapper applied `px="8" pt="6"` by default and accepted a `flush` opt-out — asymmetric with `<IndexPageTemplate>` (always flush) and a source of double-padding when children were `<Card>` (which has its own `p="6"`). Detail pages now match the index template's body shape: full-bleed by default, consumers add internal padding inside `children` (e.g. `<Box px="8" pt="6">`) when they need it. **Breaking change** for the small number of consumers passing `flush` explicitly — drop the prop. Consumers that previously relied on the implicit padded body should wrap their `children` in `<Box px="8" pt="6">`.

### Documentation

- **`docs/page-patterns.md` — rail-header contract.** Section 4 (ContextRail) now documents the rail-header contract: rail content MUST start with `<ContextRail.Header>` so the rail's top has a structural element matching the PageHeader's height. Without it the PageHeader's bottom border doesn't visually align with anything in the rail column. Adds a "Common rail mistakes" callout.
- **`docs/page-patterns.md` — body tabs vs. sidebar sub-sections.** Sections 3 (Sidebar IA) and 11.2 (DetailPageTemplate) now include a clear "When to use" callout: body tabs for multiple views of the same entity (one page header), sidebar sub-sections for distinct destinations (one page header per item). Don't mix the two in the same view.

## [1.9.1] — 2026-05-05

### Fixed

- **`<AppShell>` rail slot now shows descendant-registered content.** In 1.9.0, `<AppShell>` consumed its own slot store via `useSlotValue("rail")` at the same level it provided that store, so `useContext` resolved to the parent context (null) and any content registered through `usePageRail(...)` was dropped on the floor. AppShell is now split into an outer Provider and an inner Renderer so the Renderer's `useContext` resolves to the live store. The page-actions slot was unaffected (page templates that read it are descendants of AppShell, so their context lookup already worked).
- **Rail precedence is now defined and documented.** Content registered by a descendant via `usePageRail` wins over the static `rail` prop. The `rail` prop becomes a fallback for the column when no descendant has registered content. The rail column is reserved (third grid track added) when *either* a `rail` prop is supplied *or* a descendant has registered rail content; omit both to drop the column entirely. No breaking changes — solutions that only used the `rail` prop continue to work identically.

## [1.9.0] — 2026-05-05

### Added

- **`@knkcs/anker/templates`** — new entrypoint that ships the canonical page-level layouts every knkCMS solution should use:
  - `<AppShell>` — sidebar / main / rail composition with built-in slot store. Exposes `usePageActions(node)` and `usePageRail(node)` hooks that any descendant can call to register content into the page chrome. The slot store uses `useSyncExternalStore` so producers and consumers stay decoupled across React commit boundaries (no flicker on route changes).
  - `<IndexPageTemplate>` — list pages: PageHeader + optional Tabs + Toolbar + flush body.
  - `<DetailPageTemplate>` — single-entity pages: PageHeader + optional Tabs + padded body. `flush` prop available for full-bleed bodies.
  - `<SettingsPageTemplate>` — tabbed settings pages: PageHeader + Tabs (required) + readability-constrained body (`maxBodyWidth="3xl"` by default).
  - `<DashboardPageTemplate>` — widget-grid overview pages: PageHeader + 12-column responsive grid.
  - `<AuthPageTemplate>` — pre-auth screens: thin wrapper around `<AuthCard>`, surfaced under templates so consumers have one entry point.
  - `<MarketingPageTemplate>` — full-bleed landing-page chrome with hero + features + footer.
  - `<ErrorPage>` — 404 / 500 / 403 / generic failures.
  - `<LoadingPage>` — initial app-boot loading screen.
  - `<MaintenancePage>` — service-down screens with optional ETA.
- **`docs/page-patterns.md`** — comprehensive page-pattern specification (~1500 lines). Defines app-shell composition, sidebar IA, rail variants, PageHeader and Toolbar anatomy, modal patterns, form patterns, empty/loading/error states, the full template catalog (with composition diagrams, slot tables, escape hatches, authoring rules), and the slot-mechanism rationale. Source-of-truth contract for solution authors.
- **README "Setup for consumers"** — comprehensive section covering install, provider tree, fonts (Inter Tight + JetBrains Mono), theme customization via `createAnkerTheme(preset)`, the `@`-import for `CLAUDE-ANKER.md`, opt-out paths for sidebar / dark mode / confirm modal / i18n, and a hello-world example wiring AppShell + IndexPageTemplate.
- **`CLAUDE-ANKER.md` "Page templates" section** — lists the available templates and the rule "Use templates before composing primitives". Adds `@knkcs/anker/templates` to the Pointers list.
- **`docs/design-system.md` cross-reference** — references section now points to `page-patterns.md` for layout/template patterns.

### Build

- `tsup.config.ts` and `package.json` `exports` field gain a `./templates` entry. The `check-chakra-imports` script now scans `src/templates` to enforce the same Chakra-import discipline used elsewhere.

## [1.8.1] — 2026-05-04

### Fixed

- `<Sidebar>` collapse toggle now sits inline with `<Sidebar.Logo>` instead of in a separate row above it. Expanded: logo left, toggle right (same row). Collapsed: logo "O" top, toggle below (stacked). Cleaner header chrome.

## [1.8.0] — 2026-05-04

### Added

- `<Sidebar>` becomes collapsible. New props `storageKey?: string` and `defaultCollapsed?: boolean` mirror the `<ContextRail>` API. Toggle button in the top-right of the sidebar; viewport `< 1440px` collapses by default; localStorage persistence via `storageKey`. Collapsed width 64px (icon rail), expanded 240px.
- Subcomponents adapt automatically: `<Sidebar.Logo>` shows first-letter only, `<Sidebar.Section>` hides its label, `<Sidebar.Item>` becomes icon-only with hover tooltip (new optional `label?: string` prop overrides the tooltip text), `<Sidebar.UserMenu>` shows avatar-only.
- New `useSidebarContext()` hook (`{ collapsed, toggle }`) so consumer-rendered children inside `<Sidebar.Slot>` can render compact variants.

## [1.7.0] — 2026-05-04

### Changed

- **`<Button>` and `<IconButton>` now default `colorPalette="primary"`.** Previously, `<Button variant="solid">` without an explicit `colorPalette` rendered gray.900 (near-black) — a subtle source of bugs across consumers. Pass `colorPalette="gray"` (or another palette) to opt out. Visual change: any button using `variant="solid"` without an explicit `colorPalette` will now render in the brand primary color instead of gray.

### Fixed

- **`<DataTable>` `__select` column is now 40px wide** instead of TanStack Table's 150px default. The checkbox-only column no longer steals space from data columns.

## [1.6.0] — 2026-05-04

### Added

- `<ContextRail.Section>` is now collapsible. New `defaultOpen?: boolean` prop (default `true`) and `action?: ReactNode` slot rendered next to the title. Clicking the section header toggles open/closed; clicking inside the `action` slot does not toggle. Section root gains a 1px bottom border in `border-muted` to match the design handoff. Header is a real button with `aria-expanded`; the chevron icon rotates 90° when open.
- `<ContextRail.Header>` gains a 1px bottom border in `border` to visually separate it from the first section.

## [1.5.0] — 2026-05-04

### Fixed

- **`Sidebar.Header` and `Sidebar.Footer` separators now use `border` instead of `border-muted`**, matching the design handoff. Both bands previously rendered a `gray.100` (`#f1f5f9`) border that was barely distinguishable from the `bg-canvas` (`gray.50`) sidebar surface — the right column edge already used `border` (`gray.200`), so the contrast inside the sidebar was inconsistent with the column edge.

## [1.4.0] — 2026-05-01

### Fixed

- **`Sidebar.Item` active-state styling now actually applies under `asChild`.** Previously the styling object used Chakra prop shorthand (`bg="primary.50"`, `borderRadius="md"`, `color="primary.700"`, `px="3"` …) and was passed through `React.cloneElement(..., { style: ... })`. Browsers silently drop those properties — they only resolve through Chakra components, not as inline DOM CSS. Result: active and inactive nav items rendered visually identical, and inactive items lost their padding too. Style values are now plain CSS using Chakra's emitted CSS variables (`var(--chakra-colors-primary-700)`, `var(--chakra-spacing-3)`, `var(--chakra-radii-sm)`, …). Test added asserting the active link has primary.700 color, bg-surface background, and an inset border shadow as inline style.

### Changed

- **`Sidebar.Item` active appearance updated to match the design handoff.** Active background is now `bg-surface` (white) with an inset 1px border (`var(--chakra-colors-border)`) and a subtle drop shadow, replacing the previous flat `primary.50` chip. Adds a 3px × 14px rounded indicator pill in `primary.700` at the trailing edge of the row, matching the handoff spec.

## [1.3.0] — 2026-05-01

### Fixed

- **Semantic color tokens now resolve to CSS variables.** Every top-level token (`bg-canvas`, `bg-surface`, `bg-subtle`, `bg-muted`, `default`, `inverted`, `emphasized`, `muted`, `subtle`, `border`, `accent`, `success`, `error`, `bg-accent*`, `on-accent*`) was declared with bare scale strings like `"gray.50"`. Chakra v3 stored those verbatim into the emitted CSS variable, so `--chakra-colors-bg-canvas` evaluated to the literal text `gray.50` — invalid CSS. Consumer styles fell back to `transparent` (for `bg`) and `currentColor` (for `border`), making sidebars look white and borders look near-black. References are now wrapped as `{colors.gray.50}` so Chakra emits proper `var(--chakra-colors-gray-50)` references. Visual regression test added.
- **`Sidebar.Item` now renders the `icon` prop when used with `asChild`.** The previous implementation computed `iconEl` but did not pass it as a child to `React.cloneElement`, so every `<Sidebar.Item asChild>` link rendered without its icon. Fixed by injecting `iconEl` as the first child while preserving the original child content. Test added.

### Added

- `border-muted` semantic token (`gray.100` / `gray.800`) — referenced by `Sidebar.Header` / `Sidebar.Footer` separators since 1.2.0 but never defined; previously fell back to `currentColor` (near-black).

## [1.2.0] — 2026-04-30

### Added

- `<Sidebar>` — compound primitive for the app shell sidebar (240px). Subcomponents: `Header`, `Logo`, `Slot`, `Body`, `Section`, `Item` (with `asChild` and `active`), `Footer`, `UserMenu`, `UserMenuItem`. Cross-product nav surface; consumers slot their own logo, org-switcher, language switcher, etc.
- `<PageHeader>` — per-page imperative header with breadcrumbs, title, optional subtitle, optional eyebrow, and an actions slot.
- `<Toolbar>` — compound primitive for list-page toolbars. Subcomponents: `Search`, `Filters`, `FilterChip` (with `active`), `Right`, `Count`. Pages compose what they need; bulk-action mode is the existing `<BulkActionBar>` (no changes).
- `<ContextRail>` — collapsible right-rail chrome (44 ↔ 360px) with viewport-aware default and `localStorage` persistence via `storageKey`. Subcomponents `Header`, `Section`, `Footer` exported for consumer use.

## [1.1.0] — 2026-04-30

### Added

- `<AuthCard>` — a layout primitive for centered-card auth screens (Login, Register, LoggedOut, etc.). Provides slots for logo, topbar-right content, eyebrow, title, subtitle, footer, and body. Two width presets (`md` 440px, `lg` 480px). Optional dot-grid background and topbar can be hidden for embedded or printable contexts.

## [1.0.0] — 2026-04-30

First stable release. Adopts the refined design-system value set across all token layers.

### Changed (visual — breaking)

- **Primary blue shifted from `#2087d7` to `#134788`** (a darker, more legible navy). Every solid button, link, focus ring, and accent surface in every consumer will visibly change color on upgrade.
- **Primary action anchor moved from `primary.500` to `primary.700`.** The semantic tokens `accent`, `bg-accent`, and `primary.solid`/`focusRing`/`border` now point to step 700. The full primary palette was replaced position-by-position; consumers using `primary.500` directly as a "primary blue" reference will see a different shade — switch to the `accent` semantic token.
- **Brand orange anchor moved from `secondary.500` to `secondary.600`.** `#e9580c` (the brand-guideline orange) now lives at `secondary.600`. Consumers using `secondary.500` for the brand orange now get `#f25f1c` (a lighter shade).
- **All radii tightened by one step.** `md` is now 6px (was 8px); other steps shifted accordingly. Every rounded corner in every consumer becomes ~2px less round.
- **Font stack changed from `InterVariable` to `Inter Tight`.** Consumers must load Inter Tight from Google Fonts; the platform fallback differs slightly.
- **Shadows replaced with softer values.** Diffused, lower-alpha rgba values; the `focus-ring` shadow now uses the new primary tint (`rgba(19,71,136,0.18)`).

### Added

- `gray.950` (`#020617`) — closes the gray scale.
- `secondary.950` (`#411208`) — closes the secondary scale.
- Explicit `success`, `warning`, `danger`, `info` palettes (anker-owned, replacing reliance on Chakra defaults).
- `mono` font stack (`'JetBrains Mono', ui-monospace, …`) for code, IDs, and API keys.
- Named text styles: `bodyLg`, `body`, `bodySm`, `mono`, `monoSm`.
- `docs/design-system.md` — human-facing master spec (hosted on GitHub Pages).
- `CLAUDE-ANKER.md` — AI-consumable design-system rules, shipped in the npm tarball. Consumer projects using Claude Code can `@`-import via `@node_modules/@knkcs/anker/CLAUDE-ANKER.md`.

### Migration notes

Consumers using semantic tokens (`accent`, `bg-canvas`, `border`, `primary.solid`, etc.) get the new visual direction automatically. Consumers using raw tokens (`primary.500`, `secondary.500`) should grep for those references and replace with the corresponding semantic token where possible. The `<Button variant="primary">` variant remains deprecated; prefer `<Button variant="solid">`.
