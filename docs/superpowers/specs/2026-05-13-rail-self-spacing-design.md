# ContextRail — self-spacing children

**Date:** 2026-05-13
**Scope:** `@knkcs/anker` (small change to `<ContextRail>` Root + `<ContextRail.Section>`) and `odon` (re-introduce Section wrappers in the four migrated rails).

## Problem

The recent atom migration (anker 2.3.x + odon `feature/anker-2.3-rail-atoms`) regressed expanded-mode rendering of odon's four rails:

1. Action groups lost their section header and collapse chevron.
2. Adjacent atoms (e.g., Sessions / Linked accounts / API keys tiles, Quick action buttons) render with no vertical gap.

Root cause: during migration the atoms were placed at the top level of `<ContextRail>` (siblings of `<Section>`) instead of inside Sections. In expanded mode the rail Root renders children directly inside a `<Box>` without flex `gap`; the Section also renders its children inside a `<Box pb="3">` without flex `gap`. Consumers used to wrap their inner content in `<Stack gap={...}>` for spacing, but the atom migration dropped those wrappers.

## Goals

1. Atoms (and any free-form JSX) placed inside a `<ContextRail.Section>` render with consistent vertical spacing automatically — no `<Stack>` boilerplate required.
2. Atoms placed at the top level of `<ContextRail>` (between Sections) also render with consistent vertical spacing.
3. Restore the original expanded-mode look of odon's four rails (section headers, collapsible groups, spaced children).
4. No API change. No new props. No breaking change for existing consumers (existing `<Stack>` wrappers continue to work, just become redundant).

## Non-goals

- Atom self-spacing via implicit `mb` props — rejected as a cascade-bug source. Spacing is the parent's responsibility, not the atom's.
- Collapsed-mode rendering — unchanged (already uses `<Flex gap="2">`).
- New atoms or new tones — out of scope.

## Design

### Anker — two surgical changes

**`<ContextRail.Section>` expanded content area.** Currently:

```tsx
{open && <Box pb="3">{children}</Box>}
```

Becomes:

```tsx
{open && (
    <Stack pb="3" gap="2">
        {children}
    </Stack>
)}
```

`Stack` is anker's vertical flex with `gap` — already imported and used throughout the codebase.

**`<ContextRail>` Root expanded body.** Currently:

```tsx
<Box h="full" overflowY="auto" px="4" pt="4" pb="4">
    {children}
</Box>
```

Becomes:

```tsx
<Stack h="full" overflowY="auto" px="4" pt="4" pb="4" gap="3">
    {children}
</Stack>
```

The wider gap at the rail Root level (3 vs 2 inside a Section) gives top-level atoms / Sections more breathing room than atoms inside a Section.

### Odon — restore Section wrappers

For each of the four rails, group related atoms into `<ContextRail.Section id label>` wrappers, mirroring the original (pre-migration) section structure:

- **`TenantOverviewRail`** — Keep the existing "Users" counts Section and "Pending invitations" Section. Move the standalone `<StatusIcon>` for 2FA into a "2FA" Section (with the `ShieldCheck` icon as `<Section icon>`). Wrap the three quick-action `<IconButton>` atoms in a "Quick actions" Section (with the `Zap` icon).
- **`BulkSelectionRail`** — Wrap the count + breakdown ValueTiles in an "Overview" Section. Wrap the three action IconButtons in a "Bulk actions" Section. Drop the explicit `<ContextRail.Divider>` calls (the Section borders provide visual separation in expanded mode).
- **`UserPreviewRail`** — Keep the Avatar at the top (it's the rail's identity, not part of a section). Wrap the StatusIcon + ValueTile in a "Details" Section. Wrap the Copy IconButton in a "Quick actions" Section. Keep the Footer with its two IconButtons (Open detail / Close).
- **`ProfileStatusRail`** — Wrap the StatusIcon + 3 ValueTiles in an "Overview" Section. Wrap the action IconButtons in a "Quick actions" Section. Drop the explicit `<ContextRail.Divider>`.

Remove redundant `<Stack>` wrappers inside Sections that the migration introduced — the Section now provides spacing.

## Documentation updates

- `docs/page-patterns.md` §ContextRail patterns → §"Compact atoms" subsection. Add a short note: "When placed inside a `<ContextRail.Section>` or at the top level of `<ContextRail>`, atoms get consistent vertical spacing automatically — no `<Stack>` wrapper required." Update the code example to drop any `<Stack>` boilerplate.

## Testing

- Existing tests cover atom rendering in both modes; they pass unchanged (spacing is visual, not assertable in jsdom tests without computed styles).
- Optional: one new visual-regression-style test asserting that a Section with multiple atom children renders a `<Stack>` wrapper (queryable via `data-testid` or by checking computed `display: flex`). Low priority — collapsed-mode tests already exercise the filter logic.

## Risks

- **Redundant nested `<Stack>`s in existing rails outside this work.** Some consumers may already wrap their Section's children in `<Stack>`. Nested Stacks render correctly (each is its own flex container). The only visible effect is that the inner Stack's `gap` overrides the outer one — usually fine. No breaking change.
- **Top-level rail Root spacing of `gap="3"`.** Slightly opinionated; if any consumer renders a tightly-packed top-level layout (rare — most use Sections), they'll see more vertical space than before. Mitigated by the fact that Sections are recommended for grouping anyway.

## Rollout

1. Implement and merge in anker; cut **v2.3.2** (patch — no API change).
2. Bump anker in odon to `^2.3.2`.
3. Migrate the four rail JSX returns: re-wrap atoms in Sections; remove the explicit Dividers between sections; remove redundant inner `<Stack>` wrappers.
4. Visual smoke check.
5. Ship.
