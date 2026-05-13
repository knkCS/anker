# Collapsed Context Rail — compact atoms

**Date:** 2026-05-13
**Scope:** `@knkcs/anker` (new rail subcomponents + collapsed rendering) and `odon` (migrate the four existing rails to the new API).

## Problem

When `<ContextRail>` is collapsed (44px wide), only the floating expand/collapse toggle is shown. The rest of the column is empty — ~600px of wasted vertical space on every authenticated page. Users with the rail collapsed lose at-a-glance access to the stats and quick actions that the rail surfaces, and have no way to invoke a quick action without expanding first.

## Goals

1. Surface the rail's most actionable / informational content in the 44px collapsed column as a vertical stack of compact "atoms".
2. Let each rail decide per-piece what to show: clickable icon buttons, value tiles with tooltips, status indicators, identity avatars, dividers.
3. Hide low-signal content (zero counts, empty lists, section headers) when collapsed so the column stays focused.
4. Tones match anker's existing `Button` variants so collapsed icons read as miniatures of their expanded counterparts.

## Non-goals

- Rail width — unchanged (320px expanded / 44px collapsed).
- Rail position, floating toggle, or sticky behavior — unchanged.
- New rail variants (e.g., wider collapsed mode) — out of scope.
- Auto-derivation of compact representations from existing JSX content — devs declare atoms explicitly.

## Design

### 1. Five new compact atoms

Each atom is a subcomponent of `<ContextRail>` (alongside the existing `Header`, `Section`, `Footer`). Each is **mode-aware**: it reads the rail's `collapsed` state from the rail context and renders appropriately.

```tsx
<ContextRail.IconButton tone="default" label="Invite user" icon={<UserPlus />} onClick={…} />
<ContextRail.ValueTile  value={100} label="Total users" muted />
<ContextRail.StatusIcon tone="amber" label="2FA: 0 of 100 enabled" icon={<Shield />} />
<ContextRail.Avatar     initials="JS" label="Jana Schmid · jana@knk.de" />
<ContextRail.Divider />
```

#### 1.1 `IconButton`

Props: `label: string` (required, becomes the tooltip), `icon: ReactNode` (required), `onClick: () => void`, `tone?: "default" | "primary" | "outline-red" | "outline-primary" | "ghost"` (default `"default"`).

Expanded rendering: a full-width `<Button>` from anker atoms, variant chosen by `tone`:
- `default` → `variant="outline"`
- `primary` → `variant="solid" colorPalette="primary"`
- `outline-red` → `variant="outline" colorPalette="red"`
- `outline-primary` → `variant="outline" colorPalette="primary"`
- `ghost` → `variant="ghost"`

Collapsed rendering: a 32×32 icon-only `<IconButton>` (anker's IconButton atom), same tone mapping, with a Chakra `Tooltip` showing `label`.

#### 1.2 `ValueTile`

Props: `value: number | string` (required), `label: string` (required, becomes the tooltip and the expanded-mode label), `muted?: boolean`, `keepWhenEmpty?: boolean`.

Expanded rendering: a small `<Box bg="bg-subtle" borderRadius="md" p="2">` with the label (small muted text) and the value (large semibold) — matches the existing `StatBlock` shape in `TenantOverviewRail`.

Collapsed rendering: a 32×32 rounded-rect tile with the value centered, tooltip carrying the label. When `muted` is true, the value renders in muted color. When `value` is `0` or empty string, the tile is **hidden** unless `keepWhenEmpty` is set.

#### 1.3 `StatusIcon`

Props: `icon: ReactNode` (required), `label: string` (required, tooltip), `tone: "green" | "amber" | "red" | "gray"` (required — no default; pick deliberately).

Expanded rendering: a row with a tinted icon on the left, the label as small muted text, optional value on the right (use a child `<ValueTile>` next to it instead if you need a value).

Collapsed rendering: a 32×32 rounded circle tinted by `tone`, with the icon centered, tooltip carrying the label.

Tone guidance:
- `green` — healthy state, no action needed (e.g., MFA active)
- `amber` — low adoption / informational nudge (e.g., 2FA tenant adoption < 50%)
- `red` — action required, broken state (e.g., MFA off for the current user)
- `gray` — neutral / informational (rarely needed; usually a ValueTile fits better)

#### 1.4 `Avatar`

Props: `initials: string` (required), `src?: string`, `label: string` (required, tooltip), `onClick?: () => void`.

Expanded rendering: a 40×40 `<UserAvatar>`-style circle in an identity row, with the label below or beside. (Pages that already render a custom identity card keep doing so — this atom is for rails where the entity identity is the rail's primary subject.)

Collapsed rendering: a 32×32 avatar circle, tooltip showing the label.

#### 1.5 `Divider`

No props.

Expanded rendering: a 1px horizontal rule with `my="3"` margin.

Collapsed rendering: a 22px-wide 1px line, centered.

### 2. Mode awareness

The atoms read the rail's collapsed state from a new `RailModeContext` provided by `<ContextRail>` itself (sibling to the existing `RailRootContext`). The value is a simple boolean derived from the same state that drives the column width.

Atoms used outside `<ContextRail>` (e.g., in stories or isolated tests) default to expanded rendering and emit a dev-mode warning, mirroring the existing `useWarnIfOutsideRailRoot` pattern.

### 3. `<ContextRail.Section>` interaction

Existing `<ContextRail.Section>` keeps its current API and expanded behavior unchanged.

In **collapsed** mode, sections render only their **atom descendants**, in source order, without the section header / eyebrow / `<Stack>` wrapping. Non-atom JSX inside a section (custom rows, free-form content) is hidden when collapsed. Section dividers are inferred — when one section is followed by another in collapsed mode, anker inserts a single `<Divider>` between their atoms automatically.

Devs can also place atoms at the **top level** of `<ContextRail>` (siblings of `<Section>`). This is the recommended pattern for new rails — section wrappers are then optional, used only when devs want expanded-mode grouping with a labeled header.

### 4. Hide-when-empty behavior

A `<ValueTile>` whose `value` is `0` (number), `"0"` (string), `""`, `null`, or `undefined` is hidden in collapsed mode by default. Pass `keepWhenEmpty` to override.

A `<StatusIcon>` is never auto-hidden — the dev picks the tone based on the underlying state. If "nothing to show" is the right outcome (e.g., feature not in use), don't render the StatusIcon at all in that branch.

A `<ContextRail.Section>` with no atom descendants renders nothing in collapsed mode (the section header is hidden in collapsed mode regardless).

### 5. Mapping for odon's four existing rails

The four current rails (`TenantOverviewRail`, `BulkSelectionRail`, `UserPreviewRail`, `ProfileStatusRail`) are refactored to use the new atoms. The mappings:

**`TenantOverviewRail`**
- 4-cell stat grid → 4× `<ValueTile>` (Total / Active visible; Invited / Suspended hidden when 0).
- "2FA: N of M enabled" progress bar → `<StatusIcon tone="amber">` (icon: Shield). The expanded rendering keeps the progress bar via a custom child of `<ContextRail.Section>`; collapsed mode shows only the StatusIcon.
- Pending invitations → `<ValueTile value={pendingCount} muted label="Pending invitations: N" />` (hidden when 0). Expanded section keeps the list + "Resend" buttons as a custom child.
- 3 quick actions → `<IconButton tone="default">` ×3 (Invite user / Import CSV / Export all). No primary tint (the primary "Invite user" lives in the page header).

**`BulkSelectionRail`**
- "N selected" eyebrow → `<ValueTile value={count} label="N selected">` at the top of the rail.
- Active / Invited / Suspended counts → `<ValueTile muted>` ×3 (each hidden when 0).
- 3 bulk actions → `<IconButton tone="default">` ×3 (Deactivate / Reactivate / Reset MFA). No danger tint (matches current `variant="outline"`).

**`UserPreviewRail`**
- Identity (name + email) → `<Avatar>` at the top, tooltip carries full name + email.
- 2FA active/inactive → `<StatusIcon tone="green" />` or `<StatusIcon tone="red" />` based on `user.mfaDeviceCount > 0`.
- Sessions count → `<ValueTile>`.
- User ID → not shown in collapsed mode (low frequency, available via Open detail).
- Copy user ID → `<IconButton tone="default">`.
- Footer (Open detail / Close) → `<IconButton tone="primary">` and `<IconButton tone="ghost">`, both rendered inside `<ContextRail.Footer>` which already pins to the bottom in expanded mode and gains a top-divider treatment in collapsed mode.

**`ProfileStatusRail`**
- MFA → `<StatusIcon tone="red" />` when off, `<StatusIcon tone="green" />` when on.
- Sessions → `<ValueTile>`.
- Linked accounts → `<ValueTile muted>` (hidden when 0).
- API keys → `<ValueTile muted>` (hidden when 0).
- Self mode actions (3) → `<IconButton tone="default">` ×3.
- Admin mode actions (4): first 3 → `<IconButton tone="default">`; the toggle action → `<IconButton tone="outline-red">` (Deactivate) or `<IconButton tone="outline-primary">` (Reactivate), matching the existing conditional `colorPalette`.

### 6. Footer in collapsed mode

`<ContextRail.Footer>` currently renders as a pinned-bottom block in expanded mode. In collapsed mode, it gains the same pinning behavior — atoms inside the footer stack at the bottom of the 44px column with a divider above them.

## Documentation updates

- `docs/page-patterns.md` §ContextRail patterns — add a new subsection "Compact atoms" describing the five atoms, when to use each, hide-when-empty behavior, and tone guidance. Add a short example showing a rail composed of atoms.
- `docs/page-patterns.md` §ContextRail "Collapsed state" — update to describe the new compact rendering (currently says "only a thin 44px column with the expand-toggle remains").
- `CLAUDE-ANKER.md` — update the `<ContextRail>` table row to mention the five atoms and `RailModeContext`.
- `src/components/context-rail/context-rail.mdx` (or `.tsx`-stories if no MDX yet) — add stories per atom and a "full rail in both modes" story showing every atom side by side.

## Testing

- `context-rail.test.tsx`:
  - One unit test per atom: renders expanded markup, renders collapsed markup, tooltip text correct, hide-when-empty for ValueTile, dev-warning when used outside the rail.
  - One integration test: a rail with all five atoms renders the expected DOM in both modes.
  - One test: a Section's non-atom children are hidden in collapsed mode but atom children appear.
- `context-rail.stories.tsx`: a `CollapsedAtoms` story showing every atom in the collapsed column, plus a `MixedSectionAndAtoms` story.

## Risks

- **Tooltip clipping at the rail's edge** — collapsed atoms sit on the leading edge of the rail; their tooltips need to render to the **left** (away from the column) to avoid being clipped by the rail's overflow boundary or covered by the main content. Use Chakra's `Tooltip` with `placement="left"`.
- **Atom proliferation** — five atoms is the floor; if a sixth comes up (sparkline, mini-progress), add deliberately, not reactively.
- **Migration churn** — four odon rails change at the same time. Mitigate by shipping anker first (atoms additive, no breaking changes), then odon piecewise per rail. Existing `<ContextRail.Section>` content keeps working unchanged.

## Rollout

1. Implement and merge in anker. Atoms are additive — existing rails (in odon and future consumers) continue to render as today, just with empty collapsed columns. Cut **v2.3.0** (minor — additive subcomponents, no breaking changes).
2. Bump anker in odon to `^2.3.0`.
3. Migrate the four odon rails to use the new atoms. Each rail is an independent migration.
4. Visual smoke check: hard-refresh `/admin/users` (collapse rail → see atoms), single-row preview, bulk selection, user detail.
5. Ship.
