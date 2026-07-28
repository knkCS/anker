import { chakra, useSlotRecipe } from "@chakra-ui/react";
import type { ConversationListItemProps } from "./types";

/**
 * One row in a conversation list: title, preview/subtitle slot, timestamp,
 * avatar slot, and badge slot. Presentation-only — props in, callbacks out.
 */
export const ConversationListItem = (props: ConversationListItemProps) => {
	const { title, preview, timestamp, avatar, badge, isSelected, onSelect } =
		props;
	const recipe = useSlotRecipe({ key: "conversationListItem" });
	const styles = recipe({ selected: isSelected === true });

	return (
		<chakra.button
			type="button"
			css={styles.root}
			className="conversation-list-item"
			data-testid="conversation-list-item"
			aria-current={isSelected ? "true" : undefined}
			onClick={onSelect}
		>
			{avatar ? (
				<chakra.div
					css={styles.avatar}
					className="conversation-list-item__avatar"
				>
					{avatar}
				</chakra.div>
			) : null}
			<chakra.div
				css={styles.content}
				className="conversation-list-item__content"
			>
				<chakra.div
					css={styles.titleRow}
					className="conversation-list-item__title-row"
				>
					<chakra.div
						css={styles.title}
						className="conversation-list-item__title"
					>
						{title}
					</chakra.div>
					{timestamp ? (
						<chakra.div
							css={styles.timestamp}
							className="conversation-list-item__timestamp"
						>
							{timestamp}
						</chakra.div>
					) : null}
				</chakra.div>
				{preview || badge ? (
					<chakra.div
						css={styles.previewRow}
						className="conversation-list-item__preview-row"
					>
						<chakra.div
							css={styles.preview}
							className="conversation-list-item__preview"
						>
							{preview}
						</chakra.div>
						{badge ? (
							<chakra.div
								css={styles.badge}
								className="conversation-list-item__badge"
							>
								{badge}
							</chakra.div>
						) : null}
					</chakra.div>
				) : null}
			</chakra.div>
		</chakra.button>
	);
};
ConversationListItem.displayName = "ConversationListItem";
