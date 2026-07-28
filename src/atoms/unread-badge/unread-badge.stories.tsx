import type { Meta, StoryObj } from "@storybook/react";
import { HStack, Stack } from "../../primitives/layout";
import { UnreadBadge } from "./unread-badge";

const meta = {
	title: "Atoms/UnreadBadge",
	component: UnreadBadge,
	args: { count: 3 },
	argTypes: {
		count: { control: { type: "number" } },
		max: { control: { type: "number" } },
		hasMention: { control: "boolean" },
		label: { control: "text" },
	},
} satisfies Meta<typeof UnreadBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The common case: a single digit, rendered as a circle. */
export const Default: Story = {};

/** Above `max` (default 99) the badge stops growing and reads `99+`. */
export const CappedCount: Story = {
	args: { count: 128 },
};

/** `max` is configurable — narrow list columns often cap lower. */
export const CustomMax: Story = {
	args: { count: 12, max: 9 },
};

/**
 * Mentions-of-you read differently from a plain unread count: the accent fill
 * plus an `@` glyph, so the distinction survives greyscale and colour-blindness.
 */
export const Mention: Story = {
	args: { count: 2, hasMention: true },
};

/**
 * At zero the badge renders nothing at all — callers can pass a count
 * unconditionally instead of guarding at every call site. The row below holds
 * a badge with `count={0}`; the empty space after the label is the story.
 */
export const HiddenAtZero: Story = {
	args: { count: 0 },
	render: (args) => (
		<Stack gap="3" fontSize="sm">
			<HStack gap="2">
				<span>Zero (renders nothing):</span>
				<UnreadBadge {...args} />
			</HStack>
			<HStack gap="2">
				<span>One (renders):</span>
				<UnreadBadge {...args} count={1} />
			</HStack>
		</Stack>
	),
};

/** Every state side by side — the quickest way to check the two variants read apart. */
export const AllStates: Story = {
	render: () => (
		<HStack gap="4">
			<UnreadBadge count={1} />
			<UnreadBadge count={12} />
			<UnreadBadge count={128} />
			<UnreadBadge count={1} hasMention />
			<UnreadBadge count={12} hasMention />
			<UnreadBadge count={128} hasMention />
		</HStack>
	),
};
