import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Box, Stack } from "../../primitives/layout";
import { Button } from "../button";
import { TypingIndicator } from "./typing-indicator";

const meta = {
	title: "Atoms/TypingIndicator",
	component: TypingIndicator,
	args: { names: ["Alice"] },
	argTypes: {
		names: { control: "object" },
		maxNames: { control: { type: "number" } },
		reserveSpace: { control: "boolean" },
		formatLabel: { control: false },
	},
} satisfies Meta<typeof TypingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One person typing — the singular verb, one name, no truncation. */
export const Default: Story = {};

/** Two names still fit within the default `maxNames`, so both are printed. */
export const TwoTypers: Story = {
	args: { names: ["Alice", "Bob"] },
};

/**
 * Past `maxNames` (default 2) the tail collapses into a count, so the row's
 * width stays predictable however many people are typing.
 */
export const Truncated: Story = {
	args: { names: ["Alice", "Bob", "Cara", "Dan"] },
};

/** One person over the cap reads "1 other" — `maxNames` is a hard cap. */
export const OneOverTheCap: Story = {
	args: { names: ["Alice", "Bob", "Cara"] },
};

/** Widen `maxNames` when the row has the space for it. */
export const WiderCap: Story = {
	args: { names: ["Alice", "Bob", "Cara", "Dan"], maxNames: 3 },
};

/**
 * The sentence is composed by `formatLabel` — pass your own to localise it,
 * plural rules included. The truncation stays with anker, so a translated
 * label caps identically to the English default.
 */
export const Localised: Story = {
	args: {
		names: ["Alice", "Bob", "Cara", "Dan"],
		formatLabel: ({ named, overflowCount, total }) =>
			[
				named.join(", "),
				overflowCount > 0 ? ` und ${overflowCount} weitere` : "",
				total === 1 ? " schreibt…" : " schreiben…",
			].join(""),
	},
};

/**
 * Appearing and disappearing, the two ways round.
 *
 * **Top row** is the default: the indicator unmounts when nobody is typing, so
 * the row's height goes with it and whatever sits above it moves down.
 *
 * **Bottom row** passes `reserveSpace`: the row keeps its height and fades
 * between the two states, so the message list above never nudges. It also
 * leaves the live region mounted, which is where screen readers announce the
 * first name most reliably.
 *
 * Toggle the button to watch both. Under `prefers-reduced-motion` the fade and
 * the dots' bounce both stop — the theme handles that globally.
 */
export const AppearingAndDisappearing: Story = {
	args: { names: ["Alice", "Bob", "Cara"] },
	render: (args) => {
		const [typing, setTyping] = useState(true);
		const names = typing ? args.names : [];

		return (
			<Stack gap="4" maxWidth="420px">
				<Button
					alignSelf="flex-start"
					variant="outline"
					size="sm"
					onClick={() => setTyping((on) => !on)}
				>
					{typing ? "Stop typing" : "Start typing"}
				</Button>

				<Stack gap="1">
					<Box fontSize="xs" color="muted" textTransform="uppercase">
						Default — unmounts, the row below moves up
					</Box>
					<Box borderWidth="1px" borderRadius="md" padding="2">
						<TypingIndicator {...args} names={names} />
						<Box fontSize="sm">…the next thing on the page</Box>
					</Box>
				</Stack>

				<Stack gap="1">
					<Box fontSize="xs" color="muted" textTransform="uppercase">
						reserveSpace — fades out, nothing moves
					</Box>
					<Box borderWidth="1px" borderRadius="md" padding="2">
						<TypingIndicator {...args} names={names} reserveSpace />
						<Box fontSize="sm">…the next thing on the page</Box>
					</Box>
				</Stack>
			</Stack>
		);
	},
};

/**
 * In place: the indicator's home is directly under the message history and
 * above the composer, where it belongs to the conversation rather than to any
 * one message.
 */
export const BelowAMessageList: Story = {
	args: { names: ["Alice", "Bob", "Cara"] },
	render: (args) => (
		<Stack gap="0" maxWidth="420px" borderWidth="1px" borderRadius="md">
			<Stack gap="2" padding="3" fontSize="sm">
				<Box>Grace: The new tokens are in the branch.</Box>
				<Box>Alice: Perfect, I'll pull it in this afternoon.</Box>
			</Stack>
			<Box paddingInline="2" paddingBottom="1">
				<TypingIndicator {...args} reserveSpace />
			</Box>
			<Box borderTopWidth="1px" padding="3" fontSize="sm" color="muted">
				Write a message…
			</Box>
		</Stack>
	),
};
