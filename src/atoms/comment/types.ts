import type { ReactNode } from "react";
import type { DateType } from "../datetime/types";

export interface CommentProps
	extends Pick<CommentHeaderProps, "author" | "commentedAt">,
		CommentFooterProps {
	id?: string;
	/**
	 * The element to display as the avatar - generally an Avatar component.
	 */
	avatar: ReactNode;

	/**
	 * The main content on the comment.
	 */
	content?: ReactNode;
	/**
	 * Nested comments are to be provided as children.
	 */
	children?: ReactNode;

	/**
	 * If `true`, the comment will be rendered with a strikethrough.
	 */
	isDeleted?: boolean;

	/** Label shown when the comment has been deleted */
	deletedLabel?: string;
}

export interface CommentHeaderProps {
	author?: {
		id: string;
		name: string;
		email: string;
	};
	/**
	 * The datetime the comment was created.
	 */
	commentedAt?: DateType;
}

export interface CommentFooterProps {
	/**
	 * A list of `CommentAction` items rendered as a row of buttons below the content.
	 */
	actions?: Array<ReactNode>;
}
