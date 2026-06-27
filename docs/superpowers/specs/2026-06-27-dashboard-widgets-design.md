# Dashboard & Widget Framework — Design

**Date:** 2026-06-27
**Status:** Draft — awaiting review
**Services:** anker (additive, ~2.11.0), core (follow-up migration PR), other services (new adopters)

## 1. Problem

A dashboard exists today only in **knkCMS Core**
(`core/web/src/modules/knk-dashboard/`). It is a complete, well-architected
system: a widget contract, a singleton registry with permission-filtered
catalog, a `react-grid-layout` engine with view/edit modes, a catalog drawer, a
schema-driven config modal, and per-role persistence to the backend.

Other services (Odon, Template, Shell, and future services) will need their own
dashboards. Each service will define its **own** widgets, but they all need to
agree on **what a widget is** — its shape, sizing, settings, and availability —
and they should share the grid engine, the edit experience, and the chrome
rather than each re-implementing it (which guarantees drift).

The missing piece is a **domain-free dashboard framework in anker**: a published
widget contract plus the reusable engine and chrome, with every service-specific
concern (data, persistence, permissions, strings) left to the consuming app.

The existing `anker` `Widget` (`src/components/widget.tsx`) is only a
presentational card shell (`heading`, `subHeading`, `icon`, `children`). It has
no contract, registry, layout, or edit machinery. We keep it and build the
frame on top of it.

## 2. Decision

Anker ships a new `src/components/dashboard/` composite that provides the
**contract + headless grid engine + chrome**, wrapping the same
`react-grid-layout` Core uses (as an **optional peer dependency**). The
consuming app owns data fetching, persistence, the registry's definition list,
permission tokens, and all user-facing strings.

State is split by lifetime: the **saved/committed** widget state is *controlled*
(the app owns it); the **ephemeral edit-session** state (in-flight drag/resize,
add/remove, draft, discard-to-revert, dirty tracking) is *internal* to anker.
Anker emits `onCommit(next)` on save and reverts on discard, and exposes the
draft via `onDraftChange` + a derived dirty signal. This is the
"controlled committed state, internal interaction state, with escape hatches"
pattern used by mature headless libraries (TanStack Table, React Hook Form,
Radix).

Core is **not** migrated in this effort. We design the contract so Core can
migrate with little rework and validate it against Core's real widgets; the Core
PR is a fast-follow.

### 2.1 Decisions log

| # | Decision | Choice |
|---|----------|--------|
| 1 | Scope of anker | Contract + headless engine + chrome (not contract-only, not a full framework with store/persistence) |
| 2 | Grid engine | Wrap `react-grid-layout` as an **optional peer dependency** |
| 3 | Control model | App owns saved `widgets` + `mode`; anker owns the edit session; `onCommit` on save, revert on discard; `onDraftChange`/dirty as escape hatches |
| 4 | Availability | `requiredPermissions?: string[]` (opaque tokens) for the common case + optional `isAvailable?(ctx)` predicate escape hatch |
| 5 | Core migration | anker first; design + validate against Core; migrate Core in a separate PR |
| 6 | Frame header | anker owns the per-widget frame header (uniform look across apps); widget `Component` renders body only |
| 7 | Toolbar | anker ships an integrated, opt-out toolbar built from a reusable `DashboardToolbar` piece |

## 3. The contract (`src/components/dashboard/types.ts`)

This is the published answer to "what does a widget need". App authors write a
`WidgetDefinition` per widget type; anker renders and manages instances of them.

```ts
export type DashboardMode = "view" | "edit";

/** Settings field for the schema-driven config form. Mirrors Core's shape for
 *  easy migration; a discriminated union is a possible later refinement. */
export interface WidgetSettingField {
  key: string;
  label: string;                 // app passes a translated string (no i18n keys)
  type: "number" | "boolean" | "select" | "text";
  options?: Array<{ label: string; value: unknown }>; // for "select"
  defaultValue?: unknown;
}

/** Props anker hands a widget at render time. */
export interface WidgetRenderProps<TSettings = Record<string, unknown>> {
  id: string;                    // instance id
  settings: TSettings;           // resolved: defaultSettings merged with instance settings
  mode: DashboardMode;
}

/** Props for a custom settings editor (alternative to settingsSchema). */
export interface WidgetConfigEditorProps<TSettings = Record<string, unknown>> {
  settings: TSettings;
  onChange: (next: TSettings) => void;
}

/** What an app author writes to define ONE widget type. */
export interface WidgetDefinition<TSettings = Record<string, unknown>> {
  /** Stable identifier persisted in instances, e.g. "my-tasks". */
  type: string;
  /** Display name for the catalog + frame header. App-translated string. */
  name: string;
  description?: string;
  /** lucide node, matching anker's existing Widget icon convention. */
  icon?: React.ReactNode;
  /** Free-form grouping key for the catalog. App defines its own categories. */
  category?: string;
  /** Grid-unit sizing. */
  minSize: { w: number; h: number };
  defaultSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  /** Default settings, merged under instance settings at render time. */
  defaultSettings?: TSettings;
  /** Drives the generic config form. Omit for non-configurable widgets. */
  settingsSchema?: WidgetSettingField[];
  /** Opaque permission tokens; widget is offered only if all are granted. */
  requiredPermissions?: string[];
  /** Escape hatch for arbitrary availability logic (flags, license tiers). */
  isAvailable?: (ctx: unknown) => boolean;
  /** The widget body. Renders content only — anker owns the frame header. */
  Component: React.FC<WidgetRenderProps<TSettings>>;
  /** Optional custom settings editor; overrides settingsSchema when present. */
  ConfigEditor?: React.FC<WidgetConfigEditorProps<TSettings>>;
}

/** The serializable thing the APP persists — one entry per placed widget. */
export interface WidgetInstance {
  id: string;                    // unique instance id (app generates, e.g. nanoid)
  type: string;                  // references WidgetDefinition.type
  settings: Record<string, unknown>;
  layout: { x: number; y: number; w: number; h: number };
}

export interface GridConfig {
  cols?: number;                 // default 12
  rowHeight?: number;            // default 90
  margin?: [number, number];     // default [16, 16]
  containerPadding?: [number, number]; // default [0, 0]
}
```

**Three deliberate changes from Core**, all to remove domain coupling:

- `icon` is a `React.ReactNode` (lucide), not a FontAwesome `ComponentType`.
- `name`/`description` are plain strings the app translates itself (anker rule:
  props over i18n).
- `category` is a free-form `string`, not Core's `tasks | content | analytics |
  workflow | system` enum.

And availability generalizes Core's `Permission[]` enum to opaque
`requiredPermissions: string[]` plus an `isAvailable` predicate.

## 4. The registry (`src/components/dashboard/registry.ts`)

A **factory, not a singleton** — testable, supports multiple dashboards, no
global module state.

```ts
export interface WidgetRegistry {
  get(type: string): WidgetDefinition | undefined;
  getAll(): WidgetDefinition[];
  /** Definitions available to the user, for the catalog. A definition is
   *  available iff every requiredPermissions token is in grantedPermissions
   *  (or it has none) AND isAvailable(ctx) is not false. */
  getCatalog(grantedPermissions?: string[], ctx?: unknown): WidgetDefinition[];
}

export function createWidgetRegistry(
  definitions: WidgetDefinition[],
): WidgetRegistry;
```

Availability predicate (single source of truth, reused by catalog filtering and
by the Dashboard when deciding whether a saved instance may render):

```
available(def) =
  (!def.requiredPermissions?.length
     || def.requiredPermissions.every(t => grantedPermissions?.includes(t)))
  && (def.isAvailable?.(ctx) !== false)
```

## 5. The `<Dashboard>` component & data flow

```tsx
<Dashboard
  registry={registry}             // createWidgetRegistry(myDefs), memoized
  widgets={saved}                 // controlled saved truth (WidgetInstance[])
  mode={mode}                     // "view" | "edit", default "view"
  grantedPermissions={tokens}     // opaque string[] for catalog + render gating
  availabilityContext={ctx}       // optional, passed to isAvailable predicates
  grid={{ cols: 12, rowHeight: 90, margin: [16, 16] }} // defaults match Core
  onModeChange={setMode}
  onCommit={(next) => persist(next)}   // Save: app persists WidgetInstance[]
  onDiscard={() => {}}                 // optional notification
  onDraftChange={(draft) => {}}        // optional live observation / autosave
  toolbar                              // integrated toolbar; pass false to opt out
  labels={{ /* English-default a11y strings, all overridable */ }}
  emptyState={<CustomEmpty />}         // optional; defaults to anker EmptyState
/>
```

### 5.1 `DashboardProps`

```ts
export interface DashboardProps {
  registry: WidgetRegistry;
  widgets: WidgetInstance[];
  mode?: DashboardMode;                          // default "view"
  grantedPermissions?: string[];
  availabilityContext?: unknown;
  grid?: GridConfig;
  onModeChange?: (mode: DashboardMode) => void;
  onCommit?: (widgets: WidgetInstance[]) => void;
  onDiscard?: () => void;
  onDraftChange?: (draft: WidgetInstance[]) => void;
  /** true (default) renders the integrated toolbar; false opts out. */
  toolbar?: boolean;
  labels?: Partial<DashboardLabels>;
  emptyState?: React.ReactNode;
  /** New-instance id factory; defaults to a small internal uid generator. */
  generateId?: () => string;
}
```

### 5.2 Flow

1. App loads `saved` (`WidgetInstance[]`) from its backend and builds a
   memoized `registry` from its `WidgetDefinition[]`.
2. **View mode** — the grid is static. Each cell is a **WidgetFrame** (header =
   `def.name` + `def.icon`) wrapping
   `def.Component({ id, settings, mode: "view" })`. Widgets fetch their own data
   inside `Component` (anker never fetches).
3. **Edit mode** — anker seeds an internal **draft** = clone of `widgets`,
   enables `react-grid-layout` drag (via a drag-handle bar) + SE-resize, and
   adds per-frame config-gear and remove-X controls. The **Add** action opens
   `<WidgetCatalog>`; choosing a definition appends an instance at a free slot
   using `defaultSize`/`defaultSettings`. The gear opens the settings editor for
   that draft instance.
4. **Dirty** = draft differs from `widgets`. **Save** → `onCommit(draft)`;
   **Discard** → drop the draft, revert to `widgets`. `onDraftChange(draft)`
   fires on every edit. All of this lives in an internal `useDashboardDraft`
   hook — the fiddly logic apps must never re-implement.

The app's entire job: load → pass `widgets` → handle `onCommit` → toggle `mode`.

## 6. Chrome pieces

- **WidgetFrame** (`widget-frame.tsx`) — composes the existing `Widget` card so
  the header (name + icon) and card styling are identical across every app
  (uniform look is the point of sharing). In edit mode it overlays a drag-handle
  bar, a config gear (only when the definition is configurable), and a remove X.
  The widget `Component` renders body only.
- **WidgetCatalog** (`widget-catalog.tsx`) — built on anker `Drawer`. Renders
  `registry.getCatalog(grantedPermissions, ctx)` grouped by `category`, each
  entry showing icon / name / description. Selecting one adds it to the draft.
  Proper focus management via the Drawer primitive.
- **WidgetConfigForm** (`widget-config-form.tsx`) — maps `settingsSchema`
  (`number | boolean | select | text`) onto anker `forms` controls and emits
  changed settings into the draft. When a definition supplies `ConfigEditor`,
  it is rendered instead.
- **DashboardToolbar** (`dashboard-toolbar.tsx`) — presentational Add / Save /
  Discard / Edit bar. `<Dashboard>` renders it by default (it owns the draft,
  catalog-open state, and dirty signal it needs); `toolbar={false}` opts out for
  apps that drive `mode` themselves via `onModeChange` and read dirty via
  `onDraftChange`.

### 6.1 Module layout

```
src/components/dashboard/
  types.ts                 # the contract (section 3)
  registry.ts              # createWidgetRegistry (section 4)
  dashboard.tsx            # <Dashboard> grid engine + modes
  use-dashboard-draft.ts   # internal edit-session state (draft/dirty/add/remove)
  widget-frame.tsx         # per-cell chrome, composes existing Widget
  widget-catalog.tsx       # <WidgetCatalog> picker (anker Drawer)
  widget-config-form.tsx   # <WidgetConfigForm> schema-driven settings
  dashboard-toolbar.tsx    # <DashboardToolbar> Add/Save/Discard/Edit
  labels.ts                # DashboardLabels + English defaults
  index.ts                 # re-exports
  dashboard.stories.tsx    # stories + 2 domain-free demo widgets
```

Exports are added to `src/components/index.ts`. The existing
`src/components/widget.tsx` stays put and is reused by `widget-frame.tsx`.

## 7. Error & edge handling

- **Unknown widget type** in saved data (a `type` with no matching definition —
  version skew): render a removable "Unknown widget" placeholder in edit mode
  and a quiet placeholder in view mode. **Never crash**; never drop the instance
  silently (so saving round-trips it).
- **Missing / extra settings keys**: resolved settings = `defaultSettings`
  merged under instance `settings`; unknown keys are ignored (forward-compat).
- **Permission-hidden instance**: a saved instance whose definition is no longer
  available to the user renders nothing (or a "no access" placeholder); the
  catalog never offers unavailable definitions.
- **Empty dashboard**: anker renders the existing `EmptyState` atom prompting
  the user to enter edit mode and add widgets, unless `emptyState` overrides it.
- **react-grid-layout plumbing**: anker provides the minimal grid styles rgl
  needs (item positioning, placeholder, resize handle) through its own Chakra
  styling layer — a scoped wrapper / global block on the `<Dashboard>` root —
  so consumers never import `react-grid-layout/css/styles.css` and the styling
  stays token-driven, consistent with anker conventions. Width is measured via
  rgl's width provider. Reduced motion stays global (theme `_motionReduce`) —
  no per-component media queries.

## 8. Accessibility

- All icon-only controls (drag handle, config gear, remove, catalog add) have
  configurable `aria-label`s with English defaults via `labels`, and meet the
  44×44px touch-target minimum.
- The catalog is an anker `Drawer` (focus trap + restore handled by the
  primitive).
- The drag handle is a real focusable control with an `aria-label`; keyboard
  reordering is a later enhancement (rgl is pointer-first) — noted, not built.
- Logical CSS properties throughout (RTL-ready), per anker conventions.

## 9. Dependencies & packaging

- `react-grid-layout` added as an **optional `peerDependency`** (mark
  `peerDependenciesMeta.optional = true`) at `^2.2.3` — the current stable
  release (verified 2026-06-27; one patch ahead of Core's `^2.2.2`, which the
  caret range already permits, so this is non-breaking for Core). Its own peer
  deps (`react`/`react-dom >= 16.3.0`) are satisfied by anker's `react >= 18`.
  Apps that don't render a grid don't install it; importing `<Dashboard>`
  without it is a clear runtime/build error documented in the README. The
  required rgl styles are injected by anker (see §7), not via a consumer CSS
  import.
- A new subpath is **not** required — these are `components`, exported from
  `@knkcs/anker/components`.
- `CLAUDE-ANKER.md` (shipped to consumers) and `docs/design-system.md` get a
  short Dashboard section. The peer dependency is documented in the README and
  `CLAUDE.md` "Peer Dependencies" list.

## 10. Testing & stories

- **Unit**: registry (`getCatalog` token-subset filter; `isAvailable`
  predicate; `get`/`getAll`); `useDashboardDraft` (add / remove / resize /
  move / discard / dirty); settings-merge resolution; unknown-type handling.
- **Component**: view vs edit render; catalog grouping + availability filtering;
  each config field type renders and emits; `onCommit` / `onDiscard` payloads;
  add/remove updates the draft and fires `onDraftChange`.
- **Stories** (`Components/Dashboard`), driven by **2 domain-free demo widgets**
  (a Stat tile + a Notes widget): Default (view), Edit mode, Catalog open,
  Config form, Empty, Unknown-widget, Permission-filtered. `satisfies
  Meta<typeof Dashboard>`; every export has `displayName`.

## 11. Core migration (follow-up, out of scope here)

A separate PR in `core` will: swap `core/web/src/modules/knk-dashboard`'s
engine, registry, catalog, and config modal for the anker exports; delete the
duplicated machinery; map Core's `Permission` enum values to
`requiredPermissions` token strings; map Core's i18n calls to pre-translated
`name`/`description` strings; keep the zustand store + react-query persistence
(those stay app-side). Core's existing widget `Component`s should move largely
unchanged. Validating that mapping against Core's real widgets is an acceptance
criterion of *this* anker work.

## 12. Out of scope

- The Core migration PR itself (validated against, not performed here).
- Multi-profile / role-assignment management UI (app concern).
- Backend, persistence, and data fetching (app concern).
- Multi-breakpoint responsive layouts — start with a single configurable grid;
  rgl responsive layouts are a later enhancement (YAGNI now).
- Keyboard drag-and-drop reordering (later enhancement).

## 13. Acceptance criteria

1. `@knkcs/anker/components` exports `WidgetDefinition`, `WidgetInstance`,
   `WidgetRenderProps`, `WidgetConfigEditorProps`, `WidgetSettingField`,
   `GridConfig`, `DashboardMode`, `DashboardProps`, `createWidgetRegistry`,
   `Dashboard`, `WidgetCatalog`, `WidgetConfigForm`, `DashboardToolbar`.
2. `<Dashboard>` renders a controlled `widgets` array in view mode and supports
   drag, resize, add, remove, configure, save (`onCommit`), and discard in edit
   mode, with the draft/dirty logic internal.
3. Catalog and render gating respect `requiredPermissions` + `isAvailable`.
4. Unknown widget types and missing settings keys never crash and round-trip on
   save.
5. `react-grid-layout` is an optional peer dependency; the grid CSS is shipped
   by anker.
6. Storybook covers the seven scenarios in §10 with domain-free demo widgets.
7. The contract is demonstrably sufficient to express Core's existing widgets
   (validated on paper against `core/web/src/modules/knk-dashboard/widgets/`).
8. Lint, typecheck, and tests pass; all exports have `displayName`.
