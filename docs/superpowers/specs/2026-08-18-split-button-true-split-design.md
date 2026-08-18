# SplitButton — True Split Button — Design

**Issue:** knkCS/anker#192 · **Consumer driving it:** knkCS/taskhub (create-task control)
**Date:** 2026-08-18 · **Status:** approved (grilling session)
**Supersedes:** `2026-03-25-split-button-relocation-design.md`

That earlier spec moved `SelectActionField` to `atoms/SplitButton` and reproduced the
component verbatim in its "Component" section — `colorPalette="blue"`, `size="lg"`, a
hard-coded `<Plus/>`, `{...rest}` spread first. Approving the code as written is how those
values became the design. This spec replaces that section wholesale.

## Problem

`SplitButtonProps extends ButtonProps`, so the type promises every Button prop is accepted.
Three are not: `{...rest}` is spread **first** and then `colorPalette="blue"` / `size="lg"`
overwrite it, so `<SplitButton size="sm" colorPalette="gray" />` type-checks and does
nothing. `children` and `asChild` are swallowed the same way. The chevron trigger renders
icon-only with no accessible name (WCAG 4.1.2). `blue` is not an anker palette at all — only
`brand.blue` exists as a single token — so the control cannot be made to match the `solid`
buttons beside it. There are no tests.

The deeper problem is that the component has no settled identity: with both `onClick` and
`menuItems` optional it has four states, one of which (neither) renders an empty `<HStack>`,
and one of which (menu only) is exactly what `MenuButton` already does, better.

## Decisions

1. **SplitButton is a true split button.** Both halves are mandatory. Menu-only usage is
   `MenuButton`'s job; a lone action is `Button`. This removes the four-state matrix, the
   empty render, and the overlap with `MenuButton` in one move. It also makes the chevron
   *always* icon-only, so its accessible name can be unconditionally required rather than
   conditionally so.
2. **An explicit `Pick`, not `extends ButtonProps`** — the shape `MenuButton` already uses.
   The type stops promising props it discards, and the seam radii and `asChild` become
   unreachable. Recorded as ADR-0001, which applies to atoms generally.
3. **No visual defaults of its own.** `variant` / `size` / `colorPalette` forward through
   rest-spread; absent keys let `Button`'s own defaults apply. Nothing is duplicated here to
   drift, and all three discards die at once.
4. **`loading` belongs to the action half.** The spinner replaces the action label; the
   chevron half is merely disabled and keeps its chevron. Spreading `loading` to both would
   render two spinners and delete the chevron.
5. **No default icon.** "Default action plus alternatives" implies nothing about creation.
   `icon` is optional and absent unless passed; taskhub passes `<Plus size={16} />`.
6. **`menuAriaLabel` is required**, and deliberately *not* named `menuLabel`: MenuButton's
   `menuLabel` is visible face text, this one is invisible. A shared name for the two would
   be the kind of near-miss that gets copy-pasted wrong. No English default — a generic
   "More actions" passes an automated audit while telling a screen-reader user nothing, and
   this menu's contents differ per call site.

## Files & placement

| File | Action | Description |
|------|--------|-------------|
| `src/atoms/split-button/split-button.tsx` | Modify | New props contract, both halves, no baked-in values |
| `src/atoms/split-button/resolve-half-props.ts` | Create | Pure prop-splitting logic |
| `src/atoms/split-button/resolve-half-props.test.ts` | Create | TDD unit tests for the above |
| `src/atoms/split-button/split-button.test.tsx` | Create | RTL behaviour tests |
| `src/atoms/split-button/split-button.stories.tsx` | Rewrite | Old trio no longer type-checks |
| `src/atoms/split-button/split-button.mdx` | Create | Usage guide + which-control-do-I-want table |
| `src/atoms/split-button/index.ts` | Unchanged | `resolve-half-props` stays internal |
| `docs/adr/0001-atoms-pick-button-props.md` | Create | First ADR |
| `CONTEXT.md` | Modify | New "Actions" section: Split button, Menu button |
| `CLAUDE-ANKER.md` | Modify | New `## SplitButton` section |
| `CHANGELOG.md` | Modify | `## 5.0.0` with `### Breaking` + migration |
| `package.json` | Modify | `4.2.0` → `5.0.0` (no tag, no publish) |

Keeping `resolveHalfProps` out of `index.ts` follows `formatUnreadCount` and
`summarizeTypists`: pure logic gets its own file and its own test, and stays internal.

## API

```tsx
export interface SplitButtonMenuItem {
	/** Menu item text. */
	label: string;
	onClick: () => void;
	/** Stable key + Ark value. Defaults to `label`; set it when labels collide. */
	value?: string;
	/** Optional leading node. */
	icon?: React.ReactNode;
	disabled?: boolean;
	/** Renders the item in the `error` token — deletes and other destructive choices. */
	destructive?: boolean;
}

export interface SplitButtonProps
	extends Pick<
		ButtonProps,
		"variant" | "size" | "colorPalette" | "loading" | "disabled"
	> {
	/** Action-half text. */
	label: string;
	/** The default action. Runs on the action half. */
	onClick: () => void;
	/** Alternatives to the default action, behind the chevron. */
	menuItems: SplitButtonMenuItem[];
	/** Accessible name for the icon-only chevron half, e.g. "Choose a task type". */
	menuAriaLabel: string;
	/** Leading icon on the action half. Absent by default. */
	icon?: React.ReactNode;
}
```

`SplitButtonMenuItem` mirrors `MenuButtonAction` field for field, plus `destructive`. The
two types stay separate so they can diverge; the glossary names the shared concept.

## Prop splitting

`resolveHalfProps` is the whole of the component's logic and the reason the regression is
testable at all — Chakra v3 emits nothing observable for `colorPalette`, so asserting
"the consumer's value survived" has to happen before render.

```ts
export interface HalfProps {
	action: ActionHalfProps;
	trigger: TriggerHalfProps;
}

export function resolveHalfProps(props: SplitButtonProps): HalfProps;
```

Rules it encodes:

- Forwarded styling props (`variant`, `size`, `colorPalette`) reach **both** halves
  untouched, and are absent from the result when absent from the input — never present as
  `undefined`. `Button` applies `size="md"` / `variant="secondary"` *before* its own spread,
  so an explicit `undefined` would clobber them and fall through to the recipe's
  `defaultVariants` (`size: "lg"`) — the same bug as #192, reversed.
- `loading` → action half only. The trigger gets `loading: false`.
- `disabled` → both halves; the trigger is additionally disabled while `loading`.
- Seam radii are structural and applied last: action `borderEndRadius: "none"`, trigger
  `borderStartRadius: "none"`.
- `aria-label` on the trigger is `menuAriaLabel`.

## Render

```tsx
<HStack gap={0.5}>
	<Button {...action}>
		{icon}
		{label}
	</Button>
	<MenuRoot>
		<MenuTrigger asChild>
			<Button {...trigger}>
				<ChevronDown size={16} />
			</Button>
		</MenuTrigger>
		<MenuContent>
			{menuItems.map((item) => (
				<MenuItem
					key={item.value ?? item.label}
					value={item.value ?? item.label}
					onClick={item.onClick}
					disabled={item.disabled}
					color={item.destructive ? "error" : undefined}
				>
					{item.icon}
					{item.label}
				</MenuItem>
			))}
		</MenuContent>
	</MenuRoot>
</HStack>
```

## Tests

**`resolve-half-props.test.ts`** (pure, no DOM):

- consumer `size` / `variant` / `colorPalette` reach both halves
- keys absent from input stay absent from output (never `undefined`)
- `loading` lands on the action half; trigger gets `loading: false` and `disabled: true`
- `disabled` reaches both halves
- seam radii are set on the correct sides and cannot be supplied by the consumer
- trigger carries `aria-label` from `menuAriaLabel`

**`split-button.test.tsx`** (RTL, `ChakraProvider` + `defaultSystem`, per `button.test.tsx`):

- renders exactly two buttons
- the chevron half is findable by its accessible name
- action half fires `onClick`; menu items render and fire theirs
- a `disabled` menu item does not fire
- items with colliding labels both render when given distinct `value`s
- no icon renders unless `icon` is passed

## Stories

`Default`, `WithIcon`, `Loading`, `WithDestructiveItem`, `SmallSolid`. `MenuOnly` and
`ButtonOnly` are deleted — no longer expressible. `SmallSolid` exists so the pass-through
fix is eyeball-checkable next to its neighbours, which was half of taskhub's complaint.

Note that `Default` renders in `Button`'s own default look (`variant="secondary"`, the gray
outline), not solid blue — SplitButton sets no variant. `SmallSolid` is the primary-action
appearance.

## Breaking change

Every one of these breaks compilation for a consumer on published 4.2.0, hence 5.0.0:

| Before | After |
|--------|-------|
| `onClick?` | `onClick` required |
| `menuItems?` | `menuItems` required |
| — | `menuAriaLabel` required |
| `SplitButtonMenuItem.color?: string` | `destructive?: boolean` |
| `extends ButtonProps` | `Pick<ButtonProps, …>` |
| leading `<Plus/>` always | `icon` optional, absent by default |
| `colorPalette="blue"`, `size="lg"` forced | consumer's values honoured |

Migration: menu-only call sites move to `MenuButton`; button-only call sites move to
`Button`; create-buttons add `icon={<Plus size={16} />}`; every call site adds
`menuAriaLabel`.

## Out of scope

- Auditing other atoms against ADR-0001 (`CommentAction extends ButtonProps`) — separate
  follow-up issue.
- Tagging or publishing 5.0.0. The version is written, the release is not cut.
