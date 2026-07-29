import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarGroup } from "./avatar";
import { HStack, Stack } from "./layout";

const meta = {
	title: "Primitives/Avatar",
	component: Avatar,
	argTypes: {
		presence: {
			control: "inline-radio",
			options: [undefined, "online", "offline"],
		},
		presenceLabel: { control: "text" },
	},
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const SIZES = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const;

export const Default: Story = {
	args: {
		name: "Jane Doe",
	},
};

export const WithImage: Story = {
	args: {
		name: "Jane Doe",
		src: "https://i.pravatar.cc/150?u=jane",
	},
};

export const Sizes: Story = {
	render() {
		return (
			<AvatarGroup>
				<Avatar name="A" size="xs" />
				<Avatar name="B" size="sm" />
				<Avatar name="C" size="md" />
				<Avatar name="D" size="lg" />
				<Avatar name="E" size="xl" />
			</AvatarGroup>
		);
	},
};

export const Fallback: Story = {
	args: {
		name: "John Smith",
	},
};

/**
 * The presence variant: `presence="online"` is a filled dot, `presence="offline"`
 * a hollow ring. Shape carries the distinction as well as hue, so the two states
 * still read apart in greyscale (WCAG 1.4.1). Each dot names itself for screen
 * readers ("Online" / "Offline") — override with `presenceLabel` to localise.
 */
export const Presence: Story = {
	args: {
		name: "Jane Doe",
		presence: "online",
	},
};

/**
 * Online, offline, and absent side by side. **Absent is not offline**: leaving
 * `presence` unset renders exactly today's Avatar, with no indicator and no
 * extra markup — which is why the prop is a two-value union that may be omitted
 * rather than a boolean.
 */
export const PresenceStates: Story = {
	render: () => (
		<HStack gap="6">
			<Stack align="center" gap="2" fontSize="sm">
				<Avatar name="Ada Online" presence="online" />
				<span>online</span>
			</Stack>
			<Stack align="center" gap="2" fontSize="sm">
				<Avatar name="Ola Offline" presence="offline" />
				<span>offline</span>
			</Stack>
			<Stack align="center" gap="2" fontSize="sm">
				<Avatar name="Una Unknown" />
				<span>absent (variant off)</span>
			</Stack>
		</HStack>
	),
};

/**
 * The dot is sized from Chakra's `--avatar-size` custom property, so one ratio
 * covers every size variant — from `2xs` up to `2xl`, with no per-size override.
 * The bottom row is the same sizes over a photo.
 */
export const PresenceAcrossSizes: Story = {
	render: () => (
		<Stack gap="6">
			<HStack gap="4" align="flex-end">
				{SIZES.map((size) => (
					<Avatar key={size} name="Jane Doe" size={size} presence="online" />
				))}
			</HStack>
			<HStack gap="4" align="flex-end">
				{SIZES.map((size) => (
					<Avatar key={size} name="Jane Doe" size={size} presence="offline" />
				))}
			</HStack>
			<HStack gap="4" align="flex-end">
				{SIZES.map((size) => (
					<Avatar
						key={size}
						name="Jane Doe"
						size={size}
						src="https://i.pravatar.cc/150?u=jane"
						presence="online"
					/>
				))}
			</HStack>
		</Stack>
	),
};

/**
 * Inside an `AvatarGroup` the avatars overlap, and each one covers the corner
 * its predecessor's dot sits in. The dot is lifted above that overlap, so
 * presence stays legible for every member of the stack — not just the last.
 * The second row mixes a presence-less avatar in, which is the common case for
 * a group where only some members have presence to report.
 */
export const PresenceInGroup: Story = {
	render: () => (
		<Stack gap="6">
			<AvatarGroup>
				<Avatar name="Ada Lovelace" presence="online" />
				<Avatar name="Alan Turing" presence="offline" />
				<Avatar name="Grace Hopper" presence="online" />
				<Avatar name="Edsger Dijkstra" presence="offline" />
			</AvatarGroup>
			<AvatarGroup size="sm">
				<Avatar name="Ada Lovelace" presence="online" />
				<Avatar name="Alan Turing" presence="online" />
				<Avatar name="Grace Hopper" />
			</AvatarGroup>
		</Stack>
	),
};

/**
 * On a photo the dot has to stay separable from whatever is behind it, so it
 * carries a ring in the surface colour — the same treatment Chakra gives
 * grouped avatars.
 */
export const PresenceOnPhoto: Story = {
	render: () => (
		<HStack gap="4">
			<Avatar
				name="Jane Doe"
				size="xl"
				src="https://i.pravatar.cc/150?u=jane"
				presence="online"
			/>
			<Avatar
				name="John Smith"
				size="xl"
				src="https://i.pravatar.cc/150?u=john"
				presence="offline"
			/>
		</HStack>
	),
};
