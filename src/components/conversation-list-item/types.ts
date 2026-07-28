import type React from "react";

export interface ConversationListItemProps {
	/** Conversation title. Truncates to one line when too long. */
	title: React.ReactNode;
	/** Preview/subtitle slot — last message, typing hint, … Consumer-supplied; anker never knows what it is. */
	preview?: React.ReactNode;
	/** Time display, e.g. "14:03" or a <DateTime /> element. Consumer formats. */
	timestamp?: React.ReactNode;
	/** Avatar slot — e.g. <Avatar /> or <Persona hideDetails />. anker never fetches. */
	avatar?: React.ReactNode;
	/** Badge slot — e.g. an UnreadBadge. Rendered at the end of the preview row. */
	badge?: React.ReactNode;
	/** Marks this row as the selected/active conversation. @default false */
	isSelected?: boolean;
	/** Called when the row is clicked or keyboard-activated. */
	onSelect?: () => void;
}
