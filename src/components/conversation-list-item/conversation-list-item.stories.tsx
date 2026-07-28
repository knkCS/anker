import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, Badge } from "../../primitives";
import { Stack } from "../../primitives/layout";
import { ConversationListItem } from "./conversation-list-item";

const meta = {
	title: "Components/ConversationListItem",
	component: ConversationListItem,
} satisfies Meta<typeof ConversationListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const unreadBadge = (
	<Badge colorPalette="primary" variant="solid" borderRadius="full">
		3
	</Badge>
);

export const Default: Story = {
	args: {
		title: "Design weekly",
		preview: "Grace: The new tokens are in the branch.",
		timestamp: "14:03",
		avatar: <Avatar name="Design weekly" size="sm" />,
	},
	render(args) {
		return (
			<Stack gap="1" maxWidth="360px">
				<ConversationListItem {...args} />
			</Stack>
		);
	},
};

export const Selected: Story = {
	args: {
		...Default.args,
		title: "Release planning",
		isSelected: true,
	},
	render(args) {
		return (
			<Stack gap="1" maxWidth="360px">
				<ConversationListItem {...args} />
			</Stack>
		);
	},
};

export const WithBadge: Story = {
	args: {
		...Default.args,
		title: "Support inbox",
		preview: "Ada: Can someone take the escalation?",
		badge: unreadBadge,
	},
	render(args) {
		return (
			<Stack gap="1" maxWidth="360px">
				<ConversationListItem {...args} />
			</Stack>
		);
	},
};

export const Truncation: Story = {
	args: {
		title:
			"Quarterly planning for the northern region rollout with the extended partner group",
		preview:
			"Grace: Here is the very long summary of everything we discussed in the meeting this morning, including all follow-ups.",
		timestamp: "Mon",
		avatar: <Avatar name="Quarterly planning" size="sm" />,
		badge: unreadBadge,
	},
	render(args) {
		return (
			<Stack gap="1" maxWidth="280px">
				<ConversationListItem {...args} />
			</Stack>
		);
	},
};

export const WithAndWithoutAvatar: Story = {
	args: { title: "" },
	render() {
		return (
			<Stack gap="1" maxWidth="360px">
				<ConversationListItem
					title="Grace Hopper"
					preview="You: See you tomorrow!"
					timestamp="13:37"
					avatar={<Avatar name="Grace Hopper" size="sm" />}
				/>
				<ConversationListItem
					title="Ada Lovelace"
					preview="Ada: The proof holds."
					timestamp="Tue"
				/>
			</Stack>
		);
	},
};

/** A small list combining the states — closest to real consumer usage. */
export const ConversationList: Story = {
	args: { title: "" },
	render() {
		return (
			<Stack gap="1" maxWidth="320px">
				<ConversationListItem
					title="Design weekly"
					preview="Grace: The new tokens are in the branch."
					timestamp="14:03"
					avatar={<Avatar name="Design weekly" size="sm" />}
					isSelected
				/>
				<ConversationListItem
					title="Support inbox"
					preview="Ada: Can someone take the escalation?"
					timestamp="11:20"
					avatar={<Avatar name="Support inbox" size="sm" />}
					badge={unreadBadge}
				/>
				<ConversationListItem
					title="Grace Hopper"
					preview={<em>Grace is typing…</em>}
					timestamp="Mon"
					avatar={<Avatar name="Grace Hopper" size="sm" />}
				/>
			</Stack>
		);
	},
};
