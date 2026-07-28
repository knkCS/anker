import type { Meta, StoryObj } from "@storybook/react";
import { Pencil, Reply, SmilePlus } from "lucide-react";
import { IconButton } from "../../atoms";
import { Avatar } from "../../primitives";
import { Stack } from "../../primitives/layout";
import { MessageBubble } from "./message-bubble";
import { MessageGroup } from "./message-group";

const meta = {
	title: "Components/Message",
	component: MessageBubble,
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleActions = (
	<>
		<IconButton variant="ghost" size="xs" aria-label="Reply">
			<Reply />
		</IconButton>
		<IconButton variant="ghost" size="xs" aria-label="Add reaction">
			<SmilePlus />
		</IconButton>
		<IconButton variant="ghost" size="xs" aria-label="Edit">
			<Pencil />
		</IconButton>
	</>
);

export const SelfVsOther: Story = {
	render() {
		return (
			<Stack gap="4">
				<MessageGroup
					author="Ada Lovelace"
					avatar={<Avatar name="Ada Lovelace" size="sm" />}
				>
					<MessageBubble timestamp="14:02">
						Left-aligned with a surface fill — that's a message from someone
						else.
					</MessageBubble>
				</MessageGroup>
				<MessageGroup isSelf>
					<MessageBubble timestamp="14:03">
						Right-aligned with a soft tint — that's you.
					</MessageBubble>
				</MessageGroup>
			</Stack>
		);
	},
};

export const GroupedRun: Story = {
	render() {
		return (
			<MessageGroup
				author="Ada Lovelace"
				avatar={<Avatar name="Ada Lovelace" size="sm" />}
			>
				<MessageBubble timestamp="14:01">
					A consecutive run of messages from the same author…
				</MessageBubble>
				<MessageBubble timestamp="14:02">
					…renders the avatar and author name exactly once.
				</MessageBubble>
				<MessageBubble timestamp="14:03">
					Each bubble still carries its own timestamp.
				</MessageBubble>
			</MessageGroup>
		);
	},
};

export const EditedMarker: Story = {
	render() {
		return (
			<MessageGroup
				author="Ada Lovelace"
				avatar={<Avatar name="Ada Lovelace" size="sm" />}
			>
				<MessageBubble timestamp="14:03" isEdited>
					This message was corrected after sending.
				</MessageBubble>
			</MessageGroup>
		);
	},
};

export const Tombstone: Story = {
	render() {
		return (
			<MessageGroup
				author="Ada Lovelace"
				avatar={<Avatar name="Ada Lovelace" size="sm" />}
			>
				<MessageBubble timestamp="14:02">Still here.</MessageBubble>
				<MessageBubble timestamp="14:03" isDeleted actions={sampleActions}>
					This content is never rendered.
				</MessageBubble>
			</MessageGroup>
		);
	},
};

export const WithActions: Story = {
	render() {
		return (
			<MessageGroup
				author="Ada Lovelace"
				avatar={<Avatar name="Ada Lovelace" size="sm" />}
			>
				<MessageBubble timestamp="14:03" actions={sampleActions}>
					Hover this row (or tab into it) to reveal the floating toolbar.
				</MessageBubble>
			</MessageGroup>
		);
	},
};

export const ArbitrarySegments: Story = {
	render() {
		return (
			<MessageGroup
				author="Ada Lovelace"
				avatar={<Avatar name="Ada Lovelace" size="sm" />}
			>
				<MessageBubble timestamp="14:03">
					<p>
						The segment slot is opaque — anker renders whatever it is given:
					</p>
					<img
						src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Crect width='120' height='60' fill='%236fa7d1'/%3E%3C/svg%3E"
						alt="Attached graphic"
						width={120}
						height={60}
					/>
					<pre>
						<code>{"const answer = 42;"}</code>
					</pre>
				</MessageBubble>
			</MessageGroup>
		);
	},
};
