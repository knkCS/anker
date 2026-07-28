import { chakra, useSlotRecipe } from "@chakra-ui/react";
import { createContext, useContext } from "react";
import type { MessageGroupProps } from "./types";

interface MessageGroupContextValue {
	isSelf: boolean;
}

const MessageGroupContext = createContext<MessageGroupContextValue>({
	isSelf: false,
});

/**
 * Read by MessageBubble to inherit alignment/tint from the surrounding
 * group. A bubble outside any group falls back to `other` styling.
 */
export const useMessageGroup = () => useContext(MessageGroupContext);

/**
 * Groups a consecutive same-author run of MessageBubbles so avatar and
 * author render once.
 */
export const MessageGroup = (props: MessageGroupProps) => {
	const { author, avatar, isSelf = false, children } = props;
	const recipe = useSlotRecipe({ key: "message" });
	const styles = recipe({ variant: isSelf ? "self" : "other" });

	return (
		<MessageGroupContext.Provider value={{ isSelf }}>
			<chakra.div
				css={styles.group}
				className="message-group"
				data-testid="message-group"
			>
				{avatar ? (
					<chakra.div css={styles.avatar} className="message-group__avatar">
						{avatar}
					</chakra.div>
				) : null}
				<chakra.div css={styles.content} className="message-group__content">
					{author ? (
						<chakra.div css={styles.header} className="message-group__header">
							{author}
						</chakra.div>
					) : null}
					{children}
				</chakra.div>
			</chakra.div>
		</MessageGroupContext.Provider>
	);
};
MessageGroup.displayName = "MessageGroup";
