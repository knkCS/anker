# Changelog

All notable changes to `@knkcs/anker` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## 5.0.1 — 2026-08-18

### Fixed

- **Slot components merge your `css` instead of dropping or replacing it**
  (#194, #195). Nine slots across `Stepper` and `ColorModeButton` declared a
  `css` prop and then failed to honour it, in two mirrored ways: those
  applying `css` after `{...rest}` discarded the consumer's value outright,
  and those applying it before let the consumer's value replace the slot's
  own recipe styling. All nine now merge — `css={[styles.slot, props.css]}` —
  which puts your declarations outside `@layer recipes`, so they win on
  conflict while the slot keeps everything you don't touch.

  Note the behaviour change if you were working around the old behaviour: a
  `css` passed to a `Stepper` slot no longer wipes that slot's styling. That
  was never the intent, and `<Stepper css={undefined} />` used to blank the
  root slot entirely — a value set before a spread is clobbered by an
  explicit `undefined` inside it.

  Affected: `Stepper` (root), `StepperSteps`, `StepperContent`,
  `StepperIcon`, `StepperStep`, `StepperSeparator`, `StepperStepTitle`,
  `StepperCompleted`, `ColorModeButton`.

### Changed

- **ADR-0001 scoped to props that are actually discarded** (#194, #196). The
  rule read as an absolute — atoms `Pick` rather than `extends` — while its
  rationale was about types that promise what they discard. `extends
  ButtonProps` is now explicitly legal where a component genuinely forwards
  everything, as `CommentAction` does. The ADR also records the general rule
  the `Pick` was one instance of: declare a prop and you must honour it, by
  forwarding it, by merging it, or by not declaring it. Docs only — no atom
  changed.

## 5.0.0 — 2026-08-18

### Breaking

- **`SplitButton` is a true split button** (#192). It had four states, one of
  which rendered nothing and one of which duplicated `MenuButton`. Both halves
  are now required: `onClick` and `menuItems` are mandatory, so a control with
  only a menu is `MenuButton`'s job and a control with only an action is
  `Button`'s.

  It also declared `extends ButtonProps` while discarding three of them —
  `{...rest}` was spread *first*, then overwritten with `colorPalette="blue"`
  and `size="lg"`, so `<SplitButton size="sm" colorPalette="gray" />`
  type-checked and did nothing. `blue` is not an anker palette at all (only
  `brand.blue` exists, as a single token), so the control could not be made to
  match the buttons beside it, and `size="lg"` fought the density principle.
  The props contract is now an explicit `Pick` of the props it forwards, and it
  sets no visual defaults of its own — `variant` / `size` / `colorPalette` reach
  both halves, and whatever you leave out falls back to `Button`'s defaults. See
  ADR-0001.

  The chevron half rendered icon-only with no accessible name (WCAG 4.1.2). It
  now takes a required `menuAriaLabel`. It is deliberately not called
  `menuLabel`: `MenuButton`'s prop of that name is *visible* face text.

  | Before | After |
  |--------|-------|
  | `onClick?` | required |
  | `menuItems?` | required |
  | — | `menuAriaLabel` required |
  | `SplitButtonMenuItem.color?: string` | `destructive?: boolean` (`error` token) |
  | `extends ButtonProps` | `Pick<ButtonProps, "variant" \| "size" \| "colorPalette" \| "loading" \| "disabled">` |
  | leading `<Plus/>` always | `icon?` — absent unless passed |
  | `colorPalette="blue"`, `size="lg"` forced | consumer's values honoured |

  Migration: move menu-only call sites to `MenuButton` and action-only call
  sites to `Button`; add `menuAriaLabel` naming the choice the menu offers
  ("Choose a task type", not "More actions"); pass `icon={<Plus size={16} />}`
  where the plus was wanted; replace `color: "red"` with `destructive: true`.

### Fixed

- **Disabled menu items are inert** (#192, #194). A menu item renders as a
  `div`, so `disabled` is not enforced by the platform the way it is on a
  `<button>`, and the menu recipe's `_disabled` is visual only (opacity +
  cursor). Ark already guarded the keyboard path, but a *pointer* click reached
  the element and fired any `onClick` attached to it — so clicking a greyed-out
  item ran its action. The `MenuItem` primitive now withholds the handler when
  the item is disabled, which fixes every call site at once: `MenuButton`,
  `SplitButton`, and `MenuCell`'s row actions.

### Added

- `SplitButton` menu items take `value` (stable key and Ark value, defaults to
  `label`) and `disabled`, matching `MenuButtonAction`. Two items sharing a
  label no longer collide.
- Docs: `split-button.mdx` usage guide with a which-control-do-I-want table, a
  `CLAUDE-ANKER.md` section, `CONTEXT.md` glossary entries for **Split button**
  and **Menu button**, and `docs/adr/0001-atoms-pick-button-props.md` — the
  repo's first ADR.

## 4.2.0 — 2026-07-29

Completes the anker half of the messengerhub chat set (knkCS/messengerhub#27,
messengerhub ADR-0009). Every component below is **presentation-only and
data-agnostic** — props in, callbacks out; no fetching, no service types, and
no state anker holds on your behalf. All are additive.

### Added

- **`VirtualizedMessageList`** (#158) in `@knkcs/anker/components`: virtualized
  message history on `@tanstack/react-virtual` (a regular dependency — its API
  is never exposed). Newest at the bottom via the virtualizer's
  `anchorTo: "end"` plus component-owned follow-on-append driven by DOM-based
  pinned state — deliberately *not* the virtualizer's
  `followOnAppend`/`scrollEndThreshold`, because widening that threshold makes
  measurement deltas re-anchor to the end and fight upward scrolls. Day
  dividers come from a `getItemDate` accessor, plus a jump-to-latest pill and
  an edge-triggered `onLoadOlder` (fires once per approach to the top; the
  consumer prepends and scroll position is preserved). Items stay opaque:
  `getItemKey` + a `renderItem` render prop. Styled by the new `messageList`
  slot recipe.

- **`Composer`** (#159): the chat message input — auto-growing textarea, send
  button with submit-on-enter (IME-safe, `Shift+Enter` inserts a newline, blank
  never submits, uncontrolled clears after submit), `disabled` for archived
  conversations, and an `onInputActivity` keystroke callback so consumers can
  throttle and wire their own typing signals. Mention autocomplete is
  *injected*: `mention.getSuggestions(query)` supplies opaque items rendered
  via `renderSuggestion`/`getSuggestionKey`, and `onSelect` returns the
  replacement text for the `@query` token — or nothing, since insertion
  semantics belong to the consumer. Trigger detection, insertion and highlight
  movement are pure, TDD-tested functions. Styled by the new `composer` slot
  recipe; the dropdown opens upward, because composers sit at the bottom.

- **`ConversationListItem`** (#160): one row in a conversation list — title,
  preview/subtitle slot, timestamp, avatar slot and badge slot, all opaque
  `ReactNode`s with no data assumptions. The row is a native `<button>`
  (`onSelect`, keyboard activation for free); `isSelected` sets
  `aria-current="true"` and the soft `primary.subtle` tint — **not**
  `bg-accent-subtle`, which is an inverted accent surface. Title and preview
  truncate to one line via the new `conversationListItem` slot recipe.

- **`UnreadBadge`** (#161) in `@knkcs/anker/atoms`: the count pill that
  normally fills `ConversationListItem`'s badge slot. `max` caps the label at
  `99+`; `hasMention` gives mentions-of-you the accent fill *plus* an `@`
  glyph, so the two states never rely on hue alone. Renders `null` at zero —
  and for negative, fractional-below-one and non-finite counts — so call sites
  pass a count unconditionally instead of guarding. Plain counts stay on the
  neutral `gray.solid` fill: an unread count is information, not an action.
  Carries an overridable accessible name, since bare digits say nothing to a
  screen reader. New single-part `unreadBadge` recipe.

- **`TypingIndicator`** (#162) in `@knkcs/anker/atoms`: the "who is typing" row
  — three staggered bouncing dots plus the names, truncated past `maxNames`
  (default 2) with the tail folded into "and N others". The cap is hard, so
  three names at `maxNames={2}` read "Alice, Bob and 1 other" rather than
  widening unpredictably. anker holds no timers: a name shows for exactly as
  long as you pass it, so TTL and expiry stay with you. The sentence is
  composed by `formatLabel(summary)` — a callback, not a string, so a localised
  label truncates identically to the English default. Renders `null` when
  nobody is typing; `reserveSpace` instead keeps the row mounted and fades it,
  which holds the message list still and leaves the `role="status"` live region
  in the DOM before the first name arrives. New `typingIndicator` slot recipe
  and a global `typingBounce` keyframe.

- **`Avatar` presence variant** (#163) in `@knkcs/anker/primitives`: an
  optional `presence` prop — a binary online/offline dot anchored to the
  bottom-inline-end corner. It is `"online" | "offline"` and omittable rather
  than a boolean, because **absent is not offline**: an avatar with no presence
  to report renders exactly the markup it did before (a test compares the two
  renders byte-for-byte, so the variant stays additive for every existing
  consumer). Online is a filled `success` dot, offline a hollow ring, so the
  states never differ by hue alone. The dot sizes itself from Chakra's
  `--avatar-size`, covering `2xs` through `2xl` without per-size overrides. New
  single-part `avatarPresence` recipe. **Known limitation:** the dot's lift
  clears `AvatarGroup`'s overlap under default stacking but not under
  `<AvatarGroup stacking="…">`, which traps it in a local stacking context.

- **`ReactionChips` + `ReactionQuickSetPopover`** (#164) in
  `@knkcs/anker/components`: `ReactionChips` renders a message's aggregated
  reactions — emoji, count, and whether the viewer is one of them. Each chip is
  a toggle button, so reacted-by-me rides on `aria-pressed`, with the
  `primary.subtle` tint and a bolder count as the sighted half. `onToggle`
  reports the emoji only — add-or-remove is your decision, and an
  already-reacted chip reports exactly like a fresh one. `maxVisible`
  (default 8) is a hard cap; the tail folds into one `+N` chip, which is a real
  button when `onShowAll` is supplied and an inert readout otherwise.
  `ReactionQuickSetPopover` offers a curated **sixteen** hand-written emoji in
  two rows of eight, closes itself on pick, and mounts its grid only while open
  — one of these hangs off every message. **No emoji-data dependency reaches
  your bundle**, and a test pins that; the full searchable picker remains v2
  behind an optional subpath. The two are joined by an `addAction` slot rather
  than welded, so either works alone. New `reactionChips` and
  `reactionQuickSet` slot recipes.

### Docs

- **`CLAUDE-ANKER.md` grows a consumer-facing section per component** (#158–#164)
  — ConversationListItem, UnreadBadge, TypingIndicator, Avatar presence,
  VirtualizedMessageList, Composer and Reactions — plus `.mdx` usage guides
  beside each component in Storybook.
- **The owned-panels tab rule was rewritten around the current API** (#175):
  it still pointed at removed `bodyTabs` props and forbade the very pattern the
  page templates now prescribe.
- **The peer-dependency list is pinned to `package.json`** (#174) by a test.
  It still advertised React >= 18 long after 4.0.0 raised the floor to >= 19,
  so anyone reading it would have treated React 18 as supported.

### Note on 4.1.0

**4.1.0 was never published.** Its version bump and changelog entry landed on
`main` on 2026-07-28, but no `v4.1.0` tag was ever pushed and the publish
workflow triggers only on `v*` tags — so npm went from 4.0.1 straight to this
release. Everything listed under 4.1.0 below (the `MessageGroup`/`MessageBubble`
primitives, the live input-recipe fix, and the dead-registration sweep) reaches
consumers for the first time in **4.2.0**. If you are upgrading from 4.0.1, read
both sections.

## 4.1.0 — 2026-07-28 (never published — see the note above)

### Added

- **Chat message primitives** (#157): `MessageGroup` + `MessageBubble` in
  `@knkcs/anker/components`, consumed by `@knkcs/messengerhub-ui`
  (messengerhub ADR-0009). Presentation-only and data-agnostic: the message
  body is an opaque segment slot (children render untouched — anker never
  knows what segment kinds exist), timestamps are pre-formatted ReactNodes,
  and the floating `actions` toolbar (revealed on row hover /
  `focus-within`) is a consumer-filled slot. `MessageGroup` renders a
  consecutive same-author run — author/avatar once, `isSelf`
  alignment/tint published to child bubbles via context. States:
  `isEdited` marker (`14:03 · edited`), `isDeleted` tombstone line
  replacing the bubble. Styled by the new `message` slot recipe
  (semantic tokens, logical properties, RTL-ready). Self bubbles use
  `primary.subtle` — a soft tint that keeps default-color text readable —
  not the inverted `bg-accent-subtle` surface.

### Fixed

- **Text inputs render their intended background again** (#153): the input
  recipe was a v2-style slot recipe registered under `slotRecipes.input`,
  which Chakra v3's single-part `Input` never reads — Chakra's default
  (`outline` with `bg: transparent`) applied and inputs rendered
  transparent on any non-white surface. The same styles are now registered
  where v3 looks: plain `recipes.input` (all four variants + size `lg`) and
  `recipes.inputAddon`. No styling was designed or changed — only where it
  is registered. A registration pin test now guards the composed system.
  Note the reach: select controls pick up the same background/hover/focus
  styling, because chakra-react-select derives its Control styles from the
  `input` recipe — every `Select`/`SelectField` changes alongside text
  inputs (same "already-written styles now apply" class, no new design).
- **Dead v2 slot-recipe registrations removed** (#153 sweep): `modal`,
  `persona`, `comment`, `tsProperty`, `treeItem` were registered under
  `slotRecipes` but consumed by nothing (not v3 slot keys; no
  `useSlotRecipe` consumer). The one documented style among them — a
  frosted-glass overlay — is ported to the `dialog` slot recipe
  (`backdrop.backdropFilter: blur(4px)`), which Chakra's `Dialog.Backdrop`
  consumes for all dialog surfaces (Modal, ConfirmModal,
  LeavePageConfirmation).

### Docs

- **CLAUDE-ANKER.md gains a "Modal mount pattern" section** (#152, docs
  half): mandatory `lazyMount unmountOnExit`; the open-transition
  fallback-reset idiom (`onExitComplete` is skipped on interrupted
  reopens); the two blessed dialog shapes with mediahub exemplar paths;
  the uncontrolled-inputs-inside-Modal warning; the nested-dialog
  scroll-lock rule. The API half (a guaranteed session-end callback) stays
  open on #152.

## 4.0.0 — 2026-07-07

### Breaking

- **React peer floor is now `>=19`** (#150). The library's ref-as-prop
  convention (used across atoms and form wrappers) requires React 19's
  ref-as-prop semantics; on React 18 those refs were silently stripped.
  All known consumers already run React 19 — upgrade React before
  taking 4.x if you are on 18.

### Fixed

- **Form inputs carry the `name` attribute again** (#151): `TextInput`
  passed `name` only as `id`; the DOM input now gets both. Restores
  autofill/form semantics and `[name=…]` selector targeting.
- **react-hook-form element registration restored**: form wrappers
  spread RHF's `field` props and then OVERRODE `field.ref` with the
  consumer ref, leaving RHF unregistered — `setFocus` and
  focus-on-first-error were silently dead. Refs are now merged
  (`mergeRefs(field.ref, ref)`); failed submits focus the first errored
  field again, and consumer refs keep working.

## 3.2.0 — 2026-07-06

### Added

- **Configurable per-field dirty-dot label** (#149): `FormField` gains
  `dirtyLabel?: string` (forwarded by all field wrappers), and
  `FormMarkersProvider`'s `FormMarkers` gains `dirtyLabel` as the
  form-level default — resolution: prop → provider → default.
- **`SearchInputHandle`**: `SearchInput` accepts a `ref` exposing
  `clear()` (empties the input, cancels the pending debounce, emits
  `onSearch("")`) and `focus()`.

### Changed

- **Dirty-state announcement defaults are now English**: the FormField
  per-field dot says `"Unsaved changes"` (was hardcoded German),
  `DirtyDot` defaults to `"Unsaved changes"`, `DirtyCounter` to
  `"{count} unsaved changes"`. Apps wanting German pass `label`/
  `dirtyLabel` or the `FormMarkersProvider` default.

## 3.1.1 — 2026-07-06

### Fixed

- **`Toaster` self-deduplicates.** Multiple mounted `<Toaster />`
  instances of the same pair (e.g. a host app's global one plus one
  embedded in a library component such as fieldkit's `SpecEditor`) now
  render exactly one toast region — previously every region rendered
  every toast, duplicating them. First live mount owns the region;
  when it unmounts the next takes over. Custom `createAnkerToaster()`
  pairs dedupe independently.

## 3.1.0 — 2026-07-06

### Added

- **Required/optional label markers** on `FormField` and
  `ControlledFormField` (#146): `required` now renders the `*`
  indicator after string labels; new `optionalText` prop renders a
  muted marker (e.g. `(optional)`) after non-required labels; new
  `showRequiredIndicator` prop (default `true`) suppresses the
  asterisk. New `FormMarkersProvider` sets form-level defaults for
  both, enabling the one-convention-per-form rule from
  `docs/page-patterns.md` §10. Markers apply to string labels only
  (ReactNode labels bypass `Field.Label`, as with the dirty dot).

### Changed

- **Visual change:** required fields now show `*` by default.
  Suppress per field (`showRequiredIndicator={false}`) or per form
  (`FormMarkersProvider`).

## 3.0.0 — 2026-07-05

### Breaking

- **Dashboard moved to its own subpath.** All Dashboard/Widget exports
  (`Dashboard`, `DashboardToolbar`, `createWidgetRegistry`,
  `useDashboardDraft`, `WidgetCatalog`, `WidgetConfigForm`,
  `WidgetFrame`, `resolveWidgetSettings`, `isWidgetAvailable`,
  `defaultDashboardLabels`, and the `Dashboard*`/`Widget*`/`GridConfig`
  types) now live at `@knkcs/anker/dashboard` instead of
  `@knkcs/anker/components`. Migration: change the import specifier —
  symbol names are unchanged. Why: `react-grid-layout` is an optional
  peer, but the `/components` barrel's static import forced EVERY barrel
  consumer to install it (#147). The module graph now enforces the
  optionality: only `/dashboard` importers resolve it. A
  `check-optional-deps` dist check guards the boundary in CI.

## 2.11.0 — 2026-06-28

### Added
- **Dashboard & widget framework** (`@knkcs/anker/components`): a domain-free
  framework for building configurable, drag-and-resize widget dashboards. Define
  widgets as `WidgetDefinition` objects, build a registry with
  `createWidgetRegistry`, and render `<Dashboard>` — a `react-grid-layout`
  engine with view/edit modes, a widget catalog, a schema-driven config form, a
  toolbar, unknown-widget safety, and render-time permission gating. The app
  owns the saved `widgets` + `mode` (controlled); anker owns the edit-session
  draft and emits `onCommit(draft)` on Save. Widgets self-fetch their own data,
  user strings are props, and permissions are opaque `requiredPermissions`
  tokens plus an optional `isAvailable` predicate. Exports include `Dashboard`,
  `WidgetCatalog`, `WidgetConfigForm`, `DashboardToolbar`, `WidgetFrame`,
  `createWidgetRegistry`, the `useDashboardDraft` hook, and the full contract
  types. Documented in the `Components/Dashboard` Storybook page
  (`dashboard.mdx`) and in `CLAUDE-ANKER.md`.

### Peer dependencies
- `react-grid-layout` (`^2.2.3`) is a new **optional** peer dependency, required
  only by services that render `<Dashboard>`. anker ships the grid styles
  itself via its Chakra layer — no `react-grid-layout` stylesheet import is
  needed.

## 2.10.2 — 2026-06-27

### Fixed
- `AppShell`: the context rail's collapse/expand toggle was clipped in half.
  The 2.10.1 internal-scroll change gave the rail column `overflow-y: auto`,
  which forces `overflow-x` to clip — cutting off the toggle that is positioned
  `left: -3.5` to protrude into the main column. The rail column no longer
  scrolls itself; like the sidebar, scrolling is handled by the inner component
  (`ContextRail`'s own `Stack`), so the protruding toggle renders fully.

## 2.10.1 — 2026-06-27

### Fixed
- `AppShell`, `Sidebar`, `ContextRail`: the sidebar account footer and the
  context rail no longer scroll out of view when the main column or rail is
  taller than the viewport. `AppShell` now uses an internal-scroll model — the
  grid is a fixed `100vh` that does not scroll the document; the header band is
  fixed, and the sidebar, main, and rail scroll internally. Root cause: the
  three components used `min-height: 100vh` (an unbounded floor) where a bounded
  height is required for internal `overflow: auto` to engage.

## 2.10.0 — 2026-06-04

### Added
- `MenuButton` atom: a neutral action button driven by an `actions[]` array. One
  action renders a plain `Button`; two or more collapse behind a `menuLabel`
  trigger that opens a menu of the actions. Respects `variant`/`size`/`colorPalette`
  (no hardcoded styling) and supports per-action `icon`, `disabled`, and an
  optional `value` for stable identity.

## 2.9.3 — 2026-06-03

### Fixed
- `Popover`, `Menu`, `HoverCard`: positioner z-index bumped to `zIndex.tooltip` (1800) so popovers reliably render above drawers/modals. The 2.9.2 layer-aware calc resolved to 1500+0 on the positioner because Chakra's `--layer-index` is set on Content (not Positioner) and doesn't inherit upward; the positioner's `isolation: isolate` traps Content's z-index inside its own stacking context, so the body-level comparison was Positioner(1500) vs Drawer(1500), with drawer winning by DOM order.

## 2.9.2 — 2026-06-03

### Fixed
- `Popover`, `Menu`, `HoverCard`: positioner z-index now participates in
  Chakra v3's `--layer-index` mechanism. Popovers/menus/hover-cards
  opened inside a drawer or modal now stack correctly above the parent
  overlay (previously the hardcoded `zIndex: 1500` left them at the same
  z-index as drawers, causing visual clipping in nested cases).

## 2.9.1 — 2026-06-03

### Changed
- `NavList.Group`: bumped item gap from 4px to 8px (was tight in 2.9.0).
- `NavList.Item`: bumped vertical padding from 8px to 12px each side (item height rises from ~32px to ~40px — standard nav row size).

## 2.9.0 — 2026-06-03

### Changed
- `NavList.Group`: increased default gap between items from 2px to 4px.
  Visual change for all consumers; no API change.
- `SubNavLayout`: now wraps its inner Grid in a flex column so it
  self-stretches inside any parent with a definite height. Consumers
  no longer need to wrap SubNavLayout in their own flex container.

### Docs
- Added "SubNavLayout sizing" section to `docs/page-patterns.md`.

## 2.8.0 — 2026-05-29

### Added
- New `@knkcs/anker/navigation` namespace:
  - `useUnsavedChangesBlocker(isDirty, opts)` — primitive hook returning a
    react-router `Blocker`. Supports `safePathPrefix` to exempt sibling
    paths (e.g. tabs of the same detail page) and `shouldBlock` for
    arbitrary predicates.
  - `<UnsavedChangesGuard isDirty={…} …/>` — non-form-aware leave-page
    guard composing the hook with `<LeavePageConfirmation/>`.
  - `<TabDirtyProvider/>` + `useTabDirty()` — multi-key registry of
    per-tab dirty state. Use with `<DirtyDot/>` to surface unsaved work
    on tab triggers.
- `<DirtyFormGuard/>` now accepts `safePathPrefix` and `shouldBlock`.
  Existing callers without these props behave identically.

### Changed
- `<DirtyFormGuard/>` internally delegates to `<UnsavedChangesGuard/>`
  (transparent refactor; no API break).
- `Forms/Dirty surfaces` storybook page expanded to cover all five
  dirty surfaces (field visual, counter chip, tab dot, form guard,
  generic guard).

### Requirements
- The leave-page guards require a react-router-dom **data router**
  (`createBrowserRouter` / `createMemoryRouter` + `<RouterProvider/>`).

## 2.7.0 — 2026-05-29

### Added
- `DirtyDot` atom — a 6px yellow dot for tab-trigger unsaved-changes signalling.
- `Forms/Dirty surfaces` Storybook page documenting the three dirty surfaces
  (field visual, `DirtyCounter` chip, `DirtyDot` tab indicator).

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
