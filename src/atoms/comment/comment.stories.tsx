import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "../../primitives/avatar";
import { Box } from "../../primitives/layout";
import { Comment, CommentAction } from "./comment";
import { CommentReplyBox } from "./comment-reply-box";

const meta = {
	title: "Atoms/Comment",
	component: Comment,
} satisfies Meta<typeof Comment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		avatar: <Avatar name="John Doe" size="sm" />,
		author: { id: "1", name: "John Doe", email: "john@example.com" },
		commentedAt: new Date(Date.now() - 1000 * 60 * 30),
		content: <p>This is a comment with some content.</p>,
		actions: [
			<CommentAction key="reply">Reply</CommentAction>,
			<CommentAction key="edit">Edit</CommentAction>,
		],
	},
};

export const Deleted: Story = {
	args: {
		avatar: <Avatar name="Jane Doe" size="sm" />,
		author: { id: "2", name: "Jane Doe", email: "jane@example.com" },
		commentedAt: new Date(Date.now() - 1000 * 60 * 60),
		isDeleted: true,
	},
};

export const ReplyBox: Story = {
	args: {
		avatar: <Avatar name="John Doe" size="sm" />,
		content: <p>A comment</p>,
	},
	render(args) {
		return (
			<Box maxW="600px">
				<Comment {...args} />
				<Box mt={4}>
					<CommentReplyBox
						onReply={async (value) => {
							console.log("Reply:", value);
						}}
					/>
				</Box>
			</Box>
		);
	},
};
