import type { Meta, StoryObj } from "@storybook/react";
import { UnreadBadge } from "../../atoms/unread-badge";
import { Avatar } from "../../primitives";
import { Stack } from "../../primitives/layout";
import { ConversationListItem } from "./conversation-list-item";

const meta = {
	title: "Components/ConversationListItem",
	component: ConversationListItem,
	// Rows fill their container — every story renders inside a sized list
	// column. Override the width per story via parameters.listWidth.
	decorators: [
		(Story, context) => (
			<Stack gap="1" maxWidth={context.parameters.listWidth ?? "360px"}>
				<Story />
			</Stack>
		),
	],
} satisfies Meta<typeof ConversationListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const unreadBadge = <UnreadBadge count={3} />;
const mentionBadge = <UnreadBadge count={2} hasMention />;

export const Default: Story = {
	args: {
		title: "Design weekly",
		preview: "Grace: The new tokens are in the branch.",
		timestamp: "14:03",
		avatar: <Avatar name="Design weekly" size="sm" />,
	},
};

export const Selected: Story = {
	args: {
		...Default.args,
		title: "Release planning",
		isSelected: true,
	},
};

export const WithBadge: Story = {
	args: {
		...Default.args,
		title: "Support inbox",
		preview: "Ada: Can someone take the escalation?",
		badge: unreadBadge,
	},
};

export const Truncation: Story = {
	parameters: { listWidth: "280px" },
	args: {
		title:
			"Quarterly planning for the northern region rollout with the extended partner group",
		preview:
			"Grace: Here is the very long summary of everything we discussed in the meeting this morning, including all follow-ups.",
		timestamp: "Mon",
		avatar: <Avatar name="Quarterly planning" size="sm" />,
		badge: unreadBadge,
	},
};

export const WithAndWithoutAvatar: Story = {
	render() {
		return (
			<>
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
			</>
		);
	},
};

/** A small list combining the states — closest to real consumer usage. */
export const ConversationList: Story = {
	parameters: { listWidth: "320px" },
	render() {
		return (
			<>
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
				<ConversationListItem
					title="Platform team"
					preview="Ada: @you can you review the token PR?"
					timestamp="Mon"
					avatar={<Avatar name="Platform team" size="sm" />}
					badge={mentionBadge}
				/>
			</>
		);
	},
};
