# MessageBubble & MessageGroup — Design

**Issue:** knkCS/anker#157 · **Parent:** knkCS/messengerhub#27 · **Decision record:** messengerhub ADR-0009
**Date:** 2026-07-28 · **Status:** approved (brainstorm session with visual mockups)

Two presentation-only chat components for the anker components layer, consumed by
`@knkcs/messengerhub-ui`. Hard rule from ADR-0009: **presentation-only, data-agnostic** —
props in, callbacks out; no fetching, no state hooks, no messengerhub types. The message
body renders through an opaque segment slot; anker never knows what segment kinds exist.

## Visual direction (settled via mockups)

1. **Soft-tint bubbles.** Other-author messages: left-aligned, `bg-surface` fill with
   `border` outline. Self messages: right-aligned, `bg-accent-subtle` fill with default
   text color. No solid/inverted bubbles — arbitrary segment content must stay readable
   without inverted styling.
2. **Per-message timestamps, always visible.** Each bubble carries its own time beside
   it in muted small text. The group header shows the author name only.
3. **Edited marker** rides with the timestamp: `14:03 · edited`.
4. **Actions in a floating toolbar.** A raised pill overlapping the bubble's top-right
   corner, shown on row hover and on `focus-within`. Content is an opaque slot filled by
   the consumer.
5. **Tombstone is a plain text line.** When deleted, the bubble is replaced by a single
   muted italic line: `Message deleted · 14:03`. No bubble surface, no actions.

## Files & placement

```
src/components/message/
├── message-group.tsx
├── message-bubble.tsx
├── types.ts
├── index.ts
├── message.stories.tsx
└── message.mdx
src/theme/recipes/message.ts   ← slot recipe, registered as `message` in create-theme.ts
```

Exports (components + props interfaces) are added to `src/components/index.ts`. Both
components set `displayName`. Docs ship in the same change: the Storybook MDX page and a
CLAUDE-ANKER.md section (per repo convention for new components).

Per `CONTEXT.md`: these are **components** (anker-original composites), not Primitives —
the issue's phrase "message primitives" is domain shorthand, not a layer assignment.

## MessageGroup

Groups a consecutive same-author run so avatar and author render once.

```tsx
export interface MessageGroupProps {
  /** Author display name, rendered once in the group header. */
  author?: string;
  /** Avatar slot — e.g. <Persona hideDetails /> or <Avatar />. anker never fetches. */
  avatar?: React.ReactNode;
  /** Right-aligns the run and tints child bubbles. @default false */
  isSelf?: boolean;
  /** MessageBubble children. */
  children: React.ReactNode;
}
```

- Publishes `{ isSelf }` through a `MessageGroupContext`; bubbles read alignment/tint
  from it and never take an `isSelf` prop themselves.
- Self groups render no avatar column and no author header by default; if `author` or
  `avatar` are passed anyway, they render.
- A `MessageBubble` outside any group falls back to `other` styling, left-aligned.

## MessageBubble

One rendered message.

```tsx
export interface MessageBubbleProps {
  /** Time display, e.g. "14:03" or a <DateTime /> element. Consumer formats. */
  timestamp?: React.ReactNode;
  /** Appends the edited marker after the timestamp. @default false */
  isEdited?: boolean;
  /** Label for the edited marker. @default "edited" */
  editedLabel?: string;
  /** Replaces the bubble with the tombstone line. @default false */
  isDeleted?: boolean;
  /** Tombstone text. @default "Message deleted" */
  deletedLabel?: string;
  /** Floating toolbar content (consumer-supplied buttons). */
  actions?: React.ReactNode;
  /** The segment slot — opaque; rendered inside the bubble surface untouched. */
  children: React.ReactNode;
}
```

- The bubble surface wraps `children` in nothing else — no Prose, no typography reset,
  no content assumptions. The slot is opaque.
- `isDeleted` renders the tombstone line (`deletedLabel · timestamp`) instead of the
  row; `children` and `actions` are not rendered at all.
- When `timestamp` is absent, the edited marker and the tombstone line render their
  label alone (no dangling separator).
- The toolbar renders only when `actions` is provided.

## Theme recipe

One slot recipe, `message` (`defineSlotRecipe`), slots:
`group`, `header`, `avatar`, `bubbleRow`, `bubble`, `timestamp`, `toolbar`, `tombstone`.

- Variant `variant: self | other` — alignment (`justify-content`) and bubble fill
  (`bg-accent-subtle` vs `bg-surface` + `border`).
  - **Implementation correction (2026-07-28):** the self fill ships as
    `primary.subtle` (`primary.100` light / `primary.900` dark), not
    `bg-accent-subtle`. `bg-accent-subtle` resolves to `primary.700` in light
    mode — an inverted accent surface meant to pair with `on-accent-subtle`
    text — which would break this spec's own soft-tint / default-text-color
    requirement (§Visual direction 1).
- Semantic tokens only: `bg-surface`, `bg-accent-subtle`, `border`, `muted`/`subtle`
  text, `sm` shadow on the toolbar, `fast` duration + `fadeIn` keyframe for the toolbar
  entrance. No hardcoded colors.
- Per-corner radii and alignment use logical properties (`borderStartStartRadius`,
  `marginInlineStart`, …) so RTL flips correctly.
- Reduced motion is handled globally by the theme (`_motionReduce`) — no per-component
  media queries.

## Behavior & accessibility

- **Toolbar reveal is pure CSS**: visible on `bubbleRow` hover and on `:focus-within`,
  so consumer action buttons remain tabbable and keyboard users are not locked out.
  anker provides the slot and reveal; the buttons (and their `aria-label`s) are the
  consumer's responsibility — documented in the MDX page.
- Edited and deleted states are plain visible text (timestamp suffix / tombstone line),
  so screen readers announce them without extra ARIA.
- Touch: hover has no equivalent; `focus-within` covers external-keyboard use. A
  touch-native affordance (e.g. long-press) is the consumer's concern, noted in MDX.

## Stories (map 1:1 to acceptance criteria)

Title `Components/Message`: SelfVsOther, GroupedRun, EditedMarker, Tombstone,
WithActions, ArbitrarySegments (text + image chip + code block through the slot, proving
opacity). Meta uses `satisfies Meta<typeof MessageBubble>`.

## Tests (Vitest + RTL)

- Segment slot renders children untouched (arbitrary elements appear in the DOM as given).
- `isDeleted` shows `deletedLabel`, hides children and actions.
- `isEdited` renders `editedLabel` with the timestamp.
- Group renders author and avatar exactly once for a multi-bubble run.
- Both components expose `displayName`.
- Recipe consumption: the registered `message` slot recipe classes land in the DOM —
  the guard against the 4.0.1 dead-recipe mistake.

## Out of scope (v1, per ADR-0009)

VirtualizedMessageList, Composer, mentions, reactions (quick-set popover, ReactionChips),
ConversationListItem, UnreadBadge, TypingIndicator, presence Avatar variant, day
dividers. Ships in an anker **minor** release.
