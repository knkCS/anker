import type React from "react";

export interface MessageGroupProps {
	/** Author display name, rendered once in the group header. */
	author?: string;
	/** Avatar slot — e.g. <Persona hideDetails /> or <Avatar />. anker never fetches. */
	avatar?: React.ReactNode;
	/** Right-aligns the run and tints child bubbles. @default false */
	isSelf?: boolean;
	/** MessageBubble children. */
	children: React.ReactNode;
}

export interface MessageBubbleProps {
	/** Time display, e.g. "14:03" or a <DateTime /> element. Consumer formats. */
	timestamp?: React.ReactNode;
	/** Appends the edited marker after the timestamp. @default false */
	isEdited?: boolean;
	/** Label for the edited marker. @default "edited" */
	editedLabel?: string;
	/** Replaces the bubble with the tombstone line. @default false */
	isDeleted?: boolean;
	/** Tombstone text. @default "Message deleted" */
	deletedLabel?: string;
	/** Floating toolbar content (consumer-supplied buttons). */
	actions?: React.ReactNode;
	/** The segment slot — opaque; rendered inside the bubble surface untouched. */
	children: React.ReactNode;
}
