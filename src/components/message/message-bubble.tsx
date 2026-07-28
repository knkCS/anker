import { chakra, useSlotRecipe } from "@chakra-ui/react";
import { useMessageGroup } from "./message-group";
import type { MessageBubbleProps } from "./types";

/**
 * One rendered message: the bubble surface with the opaque segment slot,
 * a per-message timestamp, and presentation states (edited, deleted).
 */
export const MessageBubble = (props: MessageBubbleProps) => {
	const {
		timestamp,
		isEdited = false,
		editedLabel = "edited",
		isDeleted = false,
		deletedLabel = "Message deleted",
		actions,
		children,
	} = props;
	const { isSelf } = useMessageGroup();
	const recipe = useSlotRecipe({ key: "message" });
	const styles = recipe({ variant: isSelf ? "self" : "other" });

	const hasTimestamp = timestamp !== undefined && timestamp !== null;

	if (isDeleted) {
		return (
			<chakra.div
				css={styles.tombstone}
				className="message__tombstone"
				data-testid="message-tombstone"
			>
				{deletedLabel}
				{hasTimestamp ? " · " : null}
				{hasTimestamp ? timestamp : null}
			</chakra.div>
		);
	}

	const meta =
		hasTimestamp || isEdited ? (
			<chakra.span
				css={styles.timestamp}
				className="message__timestamp"
				data-testid="message-timestamp"
			>
				{hasTimestamp ? timestamp : null}
				{hasTimestamp && isEdited ? " · " : null}
				{isEdited ? editedLabel : null}
			</chakra.span>
		) : null;

	return (
		<chakra.div css={styles.bubbleRow} className="message__bubble-row">
			<chakra.div
				css={styles.bubble}
				className="message__bubble"
				data-testid="message-bubble"
			>
				{children}
				{actions ? (
					<chakra.div
						css={styles.toolbar}
						className="message__toolbar"
						data-testid="message-toolbar"
					>
						{actions}
					</chakra.div>
				) : null}
			</chakra.div>
			{meta}
		</chakra.div>
	);
};
MessageBubble.displayName = "MessageBubble";
