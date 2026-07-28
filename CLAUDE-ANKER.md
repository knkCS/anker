# anker Design System — AI Rules

This file is designed to be `@`-imported into a consumer project's `CLAUDE.md` so Claude Code instances working on that project automatically follow the anker design system. Add this line to your root `CLAUDE.md`:

```
@node_modules/@knkcs/anker/CLAUDE-ANKER.md
```

The full human-facing spec lives at the anker GitHub Pages docs site (linked from the `@knkcs/anker` README).

---

## Peer dependencies

anker 4.0.0 requires **React >=19** (as of July 2026). The library's
ref-as-prop convention (used across atoms and form wrappers) depends on React
19's ref-as-prop semantics; on React 18 refs were silently stripped. All known
consumers run React 19. See `CHANGELOG.md` for migration notes if you're on 18.

---

## Five design principles

1. **Refined Minimalism.** Surfaces are calm. Brand colors are the crown, not the carpet — primary action only.
2. **Density over air.** Power users spend hours here. Compact rows, tight spacing, small UI sizes — never cramped.
3. **Consistency over creativity.** If a pattern exists (status pill, empty state, filter toolbar), use it as-is. No per-product variants.
4. **Clear hierarchy.** Page title, primary action, content — answerable in under a second.
5. **Keyboard-first where it matters.** Search (`/`), command palette (`⌘K`), navigation must be keyboard-operable. Show shortcuts in tooltips.

---

## Token quick reference

**Palette anchors** (the visually-load-bearing step in each scale):
- `primary.700` (`#134788`) — action color (buttons, links, focus rings, active states)
- `secondary.600` (`#e9580c`) — brand orange (use sparingly; not for standard CTAs)
- `gray.700` — body text
- `gray.900` — headings

**Brand colors** (`brand.*`) — exact knk Brand Guidelines values for logos, headers, about pages. Do **not** use for interactive UI.

**Semantic tokens** (prefer these over raw):
- `bg-canvas` (page frame), `bg-surface` (cards/modals), `bg-subtle` (toolbars), `bg-muted` (hover)
- `default` / `emphasized` / `muted` / `subtle` (text)
- `border` (standard 1px), `accent` (action), `success`, `error`

**Defaults:**
- Border radius: `md` = 6px (use this for buttons, inputs, small cards)
- Body font size: `md` = 14px
- Font stack assumes Inter Tight (UI) and JetBrains Mono (code) — consumer must load via Google Fonts
- Light + dark mode supported via `next-themes`

---

## Do

- **Use semantic tokens before raw tokens.** Reach for `accent` before `primary.700`. Why: semantic tokens are the contract, raw tokens are the implementation; raw use becomes a search-and-replace cost on the next visual update.
- **Use `<Button variant="solid">` (not `variant="primary"`).** The `primary` variant is deprecated in anker. Why: `solid` reads from `colorPalette` automatically, so the same component works for `colorPalette="primary"`, `colorPalette="secondary"`, `colorPalette="gray"`.
- **Use `brand.*` only for branding surfaces.** Logos, headers, about pages. Why: brand colors are print-aligned and not WCAG-tuned for interactive UI.
- **Use anker components instead of raw Chakra.** Import from `@knkcs/anker/{primitives,components,atoms,forms,feedback}`. Why: anker wraps Chakra with consistent defaults; consuming raw Chakra bypasses those defaults and creates visual drift.
- **Respect `prefers-reduced-motion`.** No per-component handling needed — anker's theme enforces this globally. Why: users who set this OS preference get a broken UI if components add their own motion.

---

## Don't

- **No hex codes inline in components.** Always use tokens. Why: hex codes don't update when the design system evolves; tokens do.
- **No Material-style large shadows.** Anker shadows are deliberately dezent. Why: heavy shadows read as Material/Bootstrap-4-era and clash with the refined direction.
- **No `secondary.500` for standard CTAs.** The brand orange now lives at `secondary.600`; `secondary.500` is a lighter shade. Why: standard CTAs use `primary.700`, not orange — orange is for branded moments only.
- **No mixing radii within one component group.** A card with `lg` can hold inputs with `md`, but not a mix of `md` and `lg` siblings. Why: visual rhythm breaks when adjacent elements have different roundness.
- **No animations over 300ms.** Outside marketing/onboarding. Why: long animations slow down power users; the design language values immediacy.
- **No Chakra v2 patterns.** No `extendTheme`, `colorScheme`, `useColorMode` from `@chakra-ui/react`. Use `createSystem`, `colorPalette`, `next-themes`. Why: anker is built on Chakra v3 throughout; v2 patterns either error at build time or silently no-op.
- **No new color introductions.** If a color isn't in `colors.ts`, it doesn't exist. Why: the palette is closed by design — adding ad-hoc colors fragments the system.
- **No `maxW` on a Card inside a settings/detail template body.** The template controls width; per-card overrides break visual rhythm and produce orphaned narrow cards on full-width pages. Why: the template is the contract for body width — cards are the contract for content surfacing.
- **No inline create-forms above a DataTable.** Use a header-action button (or `usePageActions` from a tab) that opens a `Modal`. Why: inline forms steal vertical space, drift from the master pattern, and split form state from the rest of the page.
- **Don't own `<Tabs.Root>` for an owned-panels tab page.** Use `SettingsPageTemplate.bodyTabs` or `DetailPageTemplate.bodyTabs`. Why: the template enforces `lazyMount unmountOnExit` so `usePageActions` registrations from inactive tabs can't collide with the active tab's. Consumer-owned `<Tabs.Root>` was the cause of the "stuck Add button" bug fixed in anker 1.12. The `tabs` prop on those templates is for nav-mode/filter-mode strips only (Tabs.List, no Tabs.Content).
- **Don't wrap Card children in `<Box p="N">`.** `<Card>` body has built-in padding via Chakra's CardBody (~24px). Wrapping in `<Box p>` doubles it. Pass content directly (use `<Stack>` for layout). Why: a uniform Card body padding is the visual contract; per-Card overrides break visual rhythm and make Cards look heavier than the rest of the design system.

---

## Page templates

anker ships canonical page-level templates under `@knkcs/anker/templates`. **Use templates before composing primitives manually.** They guarantee visual parity across knkCMS solutions — module federation will assemble multiple solutions into one browser frame, and inconsistent page chrome will look broken.

Available templates:

| Template | Use for |
|---|---|
| `<AppShell>` | Authenticated chrome (sidebar · main · rail). Provides `usePageActions(node)`, `usePageHeader(node)`, and `usePageRail(node)` hooks. Page templates register their `<PageHeader>` via `usePageHeader`, which renders it as a band spanning main + rail. |
| `<ContextRail>` | Right-rail container with sticky positioning, collapse toggle on the leading edge, and five mode-aware atom subcomponents for compact rendering at 44px: `IconButton`, `ValueTile`, `StatusIcon`, `Avatar`, `Divider`. Sections (`<ContextRail.Section>`) keep their expanded-mode chrome; in collapsed mode, only atom-tagged children render. See `docs/page-patterns.md` §ContextRail patterns. |
| `<PageHeader>` | Three-row page header band (breadcrumb · detail · tabs). Props: `breadcrumbs`, `title`, `subtitle`, `eyebrow`, `actions`, `avatar`, `badges`, `meta`, `tabs`. Each row is independently optional except title. See `docs/page-patterns.md` §Page header anatomy. |
| `<IndexPageTemplate>` | List pages — header + optional tabs + toolbar + DataTable |
| `<DetailPageTemplate>` | Single-entity pages — registers a three-row header band via `usePageHeader`. New props: `avatar`, `badges`, `meta`, `tabs`. `subheader` and `bodyTabs` were removed in v2.2.0 — migrate to the slot props on PageHeader. |
| `<SettingsPageTemplate>` | Tabbed settings pages with form Cards |
| `<DashboardPageTemplate>` | Widget-grid overview pages |
| `<AuthPageTemplate>` | Login, register, MFA, verify — centered card, no shell |
| `<MarketingPageTemplate>` | Unauthenticated landing pages |
| `<ErrorPage>` | 404 / 500 / 403 |
| `<LoadingPage>` | Initial app boot |
| `<MaintenancePage>` | Service-down screens |
| `<SubNavLayout>` | Multi-resource navigation inside a `<DetailPageTemplate>` tab body — grouped vertical nav (left) + detail pane (right) with collapse toggle and `localStorage` persistence. |

**Rule:** if a template doesn't fit your page, file an issue — don't reinvent the layout.

- For multi-resource navigation inside a tab body, use `<SubNavLayout>` rather than rolling your own master-detail. It owns collapse state, persistence, and the divider — wire `<NavList.Item asChild>` to `<NavLink>` for URL deep-linking.

Full spec with composition diagrams, slot tables, and authoring rules: `docs/page-patterns.md` in the anker repo (linked from the GitHub Pages docs site).

---

## DataTable cells

anker ships 16 reusable cell components for `<DataTable>` columns. They are exported from `@knkcs/anker/components` (the same import path as `DataTable`, `Card`, `Modal`, etc.). **Use cells before composing primitives.** Inline `<Badge>` / `<Box>` / `<Text>` / `<Tooltip>` cell content fragments the visual language and silently misses later improvements (a11y, dark mode, density).

**Rule:** cells are the contract — if no cell fits, file an issue and propose a new cell. Don't hand-roll.

| Cell | Use for |
|---|---|
| `ActionCell` | row action icons |
| `BooleanCell` | yes/no |
| `CodeCell` | monospace code |
| `ColorSwatchCell` | color swatch |
| `CountCell` | "N items" |
| `DateCell` | timestamps |
| `DeviceCell` | User-Agent → browser/OS + tooltip |
| `IdentityCell` | avatar + name (+ subText) |
| `LinkCell` | internal link |
| `MenuCell` | row overflow menu |
| `NumberCell` | numbers |
| `SlugCell` | mono IDs |
| `StatusBadgeCell` | status pill (+ optional `tooltip`) |
| `SwitchCell` | inline toggle |
| `TruncatedTextCell` | text (+ optional `subText`, `maxLength`) |
| `UrlCell` | external URL |

Import path: `@knkcs/anker/components`.

```ts
import { IdentityCell, StatusBadgeCell, DateCell } from "@knkcs/anker/components";
```

Full slot/prop tables: `docs/react-table-reference.md`. Mapping guide for common column intents: `docs/page-patterns.md` §11.13.

---

## Form fields

- `FormField`/`ControlledFormField` render §10 label markers: `required`
  shows `*` (suppress with `showRequiredIndicator={false}`);
  `optionalText` renders a muted marker after non-required labels.
  `FormMarkersProvider` (from `@knkcs/anker/forms`) sets form-level
  defaults — mostly-required forms use
  `{ showRequiredIndicator: false, optionalText: "(optional)" }`.
  String labels only.
- `FormMarkersProvider` also carries `dirtyLabel` for customizing the
  per-field dirty-dot aria-label (default "Unsaved changes"); per-field
  `FormField` `dirtyLabel` prop overrides the provider default.
- **react-hook-form integration (restored in 4.0.0):** Form wrappers merge
  RHF's `field.ref` with consumer refs (via `mergeRefs()`), so element
  registration is active — `setFocus()` and form-level focus-on-first-error
  now work correctly. Inputs carry the `name` attribute (not just `id`) for
  autofill and `[name=…]` selector targeting.
- `SearchInput` accepts a `ref` exposing `clear()` (empties the input,
  cancels pending debounce, emits `onSearch("")`) and `focus()`
  methods via `SearchInputHandle`.

---

## Feedback

- `toaster` / `Toaster` (`@knkcs/anker/primitives`): module-singleton
  toast store + region. Mount `<Toaster />` once per app; extra mounts
  of the same pair are deduped automatically (first live mount wins),
  so embedding components that bring their own `Toaster` is safe.

---

## Modal mount pattern

- **Always keep `Modal` mounted; drive it with `open` and set
  `lazyMount unmountOnExit`.** Never `{open ? <Modal open … /> : null}` and
  never `if (!open) return null` inside a dialog component. A dialog machine
  that mounts already-open or unmounts while open orphans zag's cleanup under
  React StrictMode (dev): the body scroll lock leaks (`overflow: hidden` +
  `pointer-events: none` on `<body>`, `aria-hidden` on `#root`) and the whole
  app is unclickable until reload — and one leaked lock poisons every later
  dialog. `lazyMount unmountOnExit` still gives you fresh content per open.
- **`onExitComplete` is NOT a reliable session-end hook.** zag's presence
  machine fires it only on the unmount transition; a reopen that interrupts
  the exit animation — or a same-tick close+reopen — skips it silently. Pair
  it with the open-transition fallback-reset idiom: when `open` flips to
  true, re-seed the dialog's per-session state in case the exit callback
  never ran.
- **Two blessed dialog shapes** (copyable exemplars in mediahub):
  single-component dialog → `web/src/components/asset-type/asset-type-form-dialog.tsx`;
  create/edit wrapper → `web/src/components/status/status-form-dialog.tsx`
  (both inner dialogs stay mounted with complementary `open` booleans + a
  render-top entity latch). Dedicated create-only/edit-only call sites pair
  naturally with a latched-branch shape (both-mounted leaves
  permanently-inert off-branches).
- **Avoid uncontrolled inputs inside Modal content.** On an interrupted
  reopen the content never unmounts, so `defaultValue`-style inputs (e.g. a
  bare `SearchInput`) keep stale DOM text while your state resets. Use
  controlled inputs or a per-session `key`.
- **Nested dialogs:** an inner dialog's `preventBodyScroll` no-ops when the
  body is already locked — safe only for machines that mount closed, which
  the rules above guarantee.

---

## Chat message primitives

`MessageGroup` + `MessageBubble` (`@knkcs/anker/components`) render chat
message runs. Presentation-only: props in, callbacks out — your service owns
fetching, segment rendering, and time formatting.

- **Group per consecutive same-author run**: `<MessageGroup author avatar>`
  renders the author header and avatar once; child bubbles inherit
  alignment/tint from the group. `isSelf` right-aligns the run with a soft
  primary tint — bubbles never take an `isSelf` prop themselves. Self groups
  typically omit `author`/`avatar`.
- **The bubble body is an opaque segment slot**: `<MessageBubble>` renders
  its `children` untouched (no typography reset, no content assumptions) —
  pass your service's rendered segments.
- **States are props**: `timestamp` (pre-formatted ReactNode), `isEdited` +
  `editedLabel`, `isDeleted` + `deletedLabel` (tombstone line replaces the
  bubble; children/actions not rendered).
- **`actions` is a slot**: a floating pill toolbar shown on row hover /
  `focus-within`. Supply your own buttons; icon-only buttons must carry an
  `aria-label`. Touch has no hover — provide a touch affordance (e.g.
  long-press) in your service if you target touch.

---

## VirtualizedMessageList

`VirtualizedMessageList` (`@knkcs/anker/components`) renders virtualized
message history: newest at the bottom, scroll anchoring, day dividers, a
load-older callback. Presentation-only: your service owns the messages, their
order, and all fetching.

- **Give the parent a bounded height** — the list fills its container.
- **`items` are oldest → newest** and opaque to anker: supply `getItemKey`
  (stable unique key) and render each row via `renderItem` (typically
  `MessageGroup`/`MessageBubble`). Append new messages at the end, prepend
  older pages at the start — scroll position is preserved in both cases.
- **Pinning**: at the bottom the list follows appended items; once the user
  scrolls up it holds position and shows a jump-to-latest pill
  (`jumpToLatestLabel`). Tune with `pinThreshold` (default 48px).
- **`onLoadOlder` fires once per approach** to the top (within
  `loadOlderThreshold`, default 240px) and re-arms when the user scrolls
  away. Load the previous page and prepend it; the component never fetches.
  A list too short to scroll never fires.
- **Day dividers** come from `getItemDate` (local calendar days); label via
  `formatDayLabel` (default "Today"/"Yesterday"/locale date). Omit
  `getItemDate` to disable.
- The scroll region is a `role="log"` landmark — set `aria-label` (default
  "Message history").

---

## Composer

`Composer` (`@knkcs/anker/components`) is the chat message input: auto-growing
multiline textarea, send button, submit-on-enter, optional mention
autocomplete. Presentation-only: your service owns sending, typing signals,
and all suggestion data.

- **Submit**: `onSubmit(text)` fires on Enter (Shift+Enter = newline;
  disable with `submitOnEnter={false}`) or the send button — never with blank
  text. Uncontrolled composers clear afterwards; with a controlled
  `value`/`onValueChange` pair the reset is yours.
- **`onInputActivity` fires per keystroke** — throttle it yourself and wire
  your typing signal; anker never emits one.
- **`disabled`** is for archived/read-only conversations (input + send off).
- **Mentions are injected**: `mention.getSuggestions(query)` (sync or async)
  supplies the items — the dropdown renders whatever it is given via
  `renderSuggestion` + `getSuggestionKey`; empty results close it. The
  trigger (default `@`) only counts at a word boundary, so emails never open
  it.
- **Insertion semantics are yours**: `onSelect(item, { query })` returns the
  text that replaces the `@query` token verbatim (include trigger + trailing
  space), or nothing to leave the input unchanged and rewrite a controlled
  `value` yourself.
- Keyboard: arrows move the highlight (wrapping), Enter/Tab select, Escape
  dismisses for the rest of that token. Full combobox ARIA is wired in;
  label via `submitLabel`, `aria-label`, `mention["aria-label"]`.

---

## Pointers

- Full spec: anker GitHub Pages docs site (`/design-system`, `/page-patterns`)
- Components: `node_modules/@knkcs/anker/dist/{primitives,components,atoms,forms,feedback}`
- Templates: `import { AppShell, IndexPageTemplate, … } from "@knkcs/anker/templates"`
- Theme entry: `import system from "@knkcs/anker/theme"`
- Provider entry: `import { Provider } from "@knkcs/anker/primitives"`
- Anker development rules (for working *on* anker, not consuming it): `node_modules/@knkcs/anker/CLAUDE.md` is **not** included in the package; see the anker GitHub repo

## Dashboard & Widgets

Build configurable widget dashboards with the `Dashboard` framework from
`@knkcs/anker/dashboard`. anker owns the grid, edit UX, and chrome; your
service owns the widgets, their data, and persistence.

**The contract.** A widget is a `WidgetDefinition` (`type`, `name`, `icon?`,
`category?`, `minSize` / `defaultSize` / `maxSize?` in grid units,
`defaultSettings?`, `settingsSchema?`, `requiredPermissions?`, `isAvailable?`,
`Component`, `ConfigEditor?`). Build a registry with
`createWidgetRegistry(defs)`. Render
`<Dashboard registry widgets mode onModeChange onCommit grantedPermissions />`.

**Controlled model.** Your app owns the saved `widgets: WidgetInstance[]` and
`mode`; anker owns the edit-session draft. Integration is: load → pass
`widgets` → persist on `onCommit` → toggle `mode`. Save calls `onCommit(draft)`;
Discard reverts.

### Do
- **Let each widget fetch its own data** inside its `Component`. Why: anker is
  domain-free and never fetches — centralizing data would couple the library to
  your backend.
- **Memoize the registry and `widgets`.** Why: a new registry/array reference
  each render churns the grid.
- **Pass already-translated strings** for `name` / `description` / `labels`.
  Why: anker uses props, not i18n keys.
- **Map your permission model to `requiredPermissions`** (opaque string tokens)
  and pass `grantedPermissions`; use `isAvailable(ctx)` for feature
  flags / license tiers.
- **Persist the `WidgetInstance[]` from `onCommit`** and pass it back as
  `widgets` to restore.

### Don't
- **Don't mutate the `widgets` array** you pass in — treat it as immutable and
  apply `onCommit`'s result. Why: it's the controlled source of truth.
- **Don't import any `react-grid-layout` CSS** — anker ships the grid styles. Just `npm i react-grid-layout@^2.2.3` (optional peer dep, required only by services that import `@knkcs/anker/dashboard`).
- **Don't rebuild draft / discard / dirty logic** — anker owns the edit
  session; read `onDraftChange` if you need an unsaved-changes indicator.
