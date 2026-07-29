import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { MessageBubble } from "../message/message-bubble";
import { MessageGroup } from "../message/message-group";
import { DEFAULT_REACTION_QUICK_SET } from "./quick-set";
import { ReactionChips } from "./reaction-chips";
import { ReactionQuickSetPopover } from "./reaction-quick-set-popover";
import type { ReactionSummary } from "./types";

const meta = {
	title: "Components/Reactions",
	component: ReactionChips,
	// Every story below drives its own props through `render`, but the required
	// props still have to be declared once here — without them `StoryObj<typeof
	// meta>` demands `args` on each story. `tsconfig.json` excludes
	// `**/*.stories.tsx`, so `npm run typecheck` would not have caught it
	// (anker#187); the unread-badge stories draw the same line.
	args: { reactions: [], onToggle: () => {} },
} satisfies Meta<typeof ReactionChips>;

export default meta;
type Story = StoryObj<typeof meta>;

const sample: ReactionSummary[] = [
	{ emoji: "👍", count: 4, label: "thumbs up" },
	{ emoji: "🎉", count: 2, label: "party popper" },
	{ emoji: "🚀", count: 1, label: "shipped" },
];

// Counts descend but never reach zero: anything below 1 is dropped outright,
// so a fixture that ran negative would quietly render fewer chips than the
// caption claims.
const crowded: ReactionSummary[] = DEFAULT_REACTION_QUICK_SET.map(
	({ emoji, label }, index) => ({
		emoji,
		label,
		count: DEFAULT_REACTION_QUICK_SET.length - index,
		reactedByMe: index === 0,
	}),
);

const noop = () => {};

/** The common case: a few reactions, none of them the viewer's. */
export const Default: Story = {
	render: () => <ReactionChips reactions={sample} onToggle={noop} />,
};

/**
 * The viewer's own reactions are pressed toggle buttons — accent tint for the
 * eye, `aria-pressed` for assistive tech, and a bolder count so the state
 * survives greyscale and colour-blindness.
 */
export const ReactedByMe: Story = {
	render: () => (
		<ReactionChips
			reactions={sample.map((r, i) => ({ ...r, reactedByMe: i === 0 }))}
			onToggle={noop}
		/>
	),
};

/**
 * Past `maxVisible` the tail folds into one `+N` chip. Without `onShowAll` it
 * is an inert readout; with it, a real button — a chip that promises an action
 * it cannot perform is worse than no chip.
 */
export const ManyReactions: Story = {
	render: () => (
		<Stack gap="4">
			<Stack gap="1">
				<Text fontSize="xs" color="muted">
					Sixteen reactions, default cap of 8 — inert `+8` readout
				</Text>
				<ReactionChips reactions={crowded} onToggle={noop} />
			</Stack>
			<Stack gap="1">
				<Text fontSize="xs" color="muted">
					Same list at `maxVisible={4}` — `+12`, expandable
				</Text>
				<ReactionChips
					reactions={crowded}
					onToggle={noop}
					maxVisible={4}
					onShowAll={noop}
				/>
			</Stack>
		</Stack>
	),
};

/**
 * The quick set, rendered open. Sixteen emoji in two rows of eight — a set to
 * be scanned, not searched. The searchable picker is v2 behind an optional
 * subpath, so that nothing here pulls an emoji catalogue into every bundle.
 */
export const QuickSetOpen: Story = {
	render: () => (
		<Stack minHeight="24rem" justify="flex-end">
			<ReactionQuickSetPopover onSelect={noop} open />
		</Stack>
	),
};

/** A caller-supplied set — anything from three shortcuts to a different sixteen. */
export const CustomQuickSet: Story = {
	render: () => (
		<Stack minHeight="16rem" justify="flex-end">
			<ReactionQuickSetPopover
				onSelect={noop}
				open
				options={[
					{ emoji: "👍", label: "thumbs up" },
					{ emoji: "👎", label: "thumbs down" },
					{ emoji: "🤷", label: "no opinion" },
				]}
			/>
		</Stack>
	),
};

/**
 * The two together: the popover fills ReactionChips' `addAction` slot. Live —
 * click the chips and the picker to see the callbacks drive real state. The
 * state lives in the story, never in anker.
 */
export const Interactive: Story = {
	render: function InteractiveStory() {
		const [reactions, setReactions] = useState<ReactionSummary[]>(sample);

		const toggle = (emoji: string) =>
			setReactions((current) => {
				const existing = current.find((r) => r.emoji === emoji);
				if (!existing) {
					const named = DEFAULT_REACTION_QUICK_SET.find(
						(o) => o.emoji === emoji,
					);
					return [
						...current,
						{ emoji, count: 1, reactedByMe: true, label: named?.label },
					];
				}
				const delta = existing.reactedByMe ? -1 : 1;
				return current.map((r) =>
					r.emoji === emoji
						? { ...r, count: r.count + delta, reactedByMe: !r.reactedByMe }
						: r,
				);
			});

		return (
			<ReactionChips
				reactions={reactions}
				onToggle={toggle}
				addAction={<ReactionQuickSetPopover onSelect={toggle} />}
			/>
		);
	},
};

/**
 * Where these actually sit: under the message they belong to. An unreacted
 * message still renders the row, because the `addAction` slot is how the first
 * reaction gets added.
 */
export const UnderAMessage: Story = {
	render: () => (
		<Stack gap="4" maxWidth="30rem">
			<MessageGroup author="Jane Doe">
				<MessageBubble timestamp="14:03">
					<Text>Shipping the reactions branch now.</Text>
				</MessageBubble>
			</MessageGroup>
			<ReactionChips
				reactions={sample.map((r, i) => ({ ...r, reactedByMe: i === 0 }))}
				onToggle={noop}
				addAction={<ReactionQuickSetPopover onSelect={noop} />}
			/>
			<MessageGroup author="Sam Patel">
				<MessageBubble timestamp="14:05">
					<Text>No reactions yet — the row is just the add button.</Text>
				</MessageBubble>
			</MessageGroup>
			<ReactionChips
				reactions={[]}
				onToggle={noop}
				addAction={<ReactionQuickSetPopover onSelect={noop} />}
			/>
		</Stack>
	),
};

/**
 * Every announced string is a prop with an English default — the emoji names,
 * the chip sentence, the overflow sentence, and the trigger.
 */
export const Localised: Story = {
	render: () => (
		<ReactionChips
			reactions={[
				{ emoji: "👍", count: 4, label: "Daumen hoch" },
				{ emoji: "🎉", count: 2, label: "Konfetti" },
				{ emoji: "🚀", count: 1, label: "Rakete" },
			]}
			onToggle={noop}
			maxVisible={2}
			label="Reaktionen"
			formatChipLabel={({ label, count }) =>
				`${label}, ${count} ${count === 1 ? "Reaktion" : "Reaktionen"}`
			}
			formatOverflowLabel={(hidden) => `${hidden} weitere Reaktionen`}
			addAction={
				<ReactionQuickSetPopover
					onSelect={noop}
					label="Reaktion hinzufügen"
					options={[
						{ emoji: "👍", label: "Daumen hoch" },
						{ emoji: "🎉", label: "Konfetti" },
					]}
				/>
			}
		/>
	),
};

/** An archived conversation: the chips it owns go disabled, and so does the trigger. */
export const Disabled: Story = {
	render: () => (
		<ReactionChips
			reactions={sample.map((r, i) => ({ ...r, reactedByMe: i === 0 }))}
			onToggle={noop}
			disabled
			addAction={<ReactionQuickSetPopover onSelect={noop} disabled />}
		/>
	),
};
