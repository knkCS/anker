import { chakra, useRecipe } from "@chakra-ui/react";
import { AtSign } from "lucide-react";
import { formatUnreadCount } from "./format-count";

export interface UnreadBadgeProps {
	/** Number of unread items. Zero, negative, and non-finite counts render nothing. */
	count: number;
	/**
	 * Highest count rendered verbatim; above it the badge reads `{max}+`.
	 * @default 99
	 */
	max?: number;
	/**
	 * Renders the mention variant — a conversation with mentions-of-you reads
	 * differently from a plain unread count (accent fill plus an `@` glyph).
	 * @default false
	 */
	hasMention?: boolean;
	/**
	 * Accessible label, replacing the count for screen readers. Defaults to
	 * `"{count} unread"` / `"{count} unread, mentions you"` — pass a
	 * translated string to localise.
	 */
	label?: string;
}

function defaultLabel(formatted: string, hasMention: boolean) {
	return hasMention
		? `${formatted} unread, mentions you`
		: `${formatted} unread`;
}

/**
 * The unread-count badge: a count pill with a cap (`99+`) and a distinct
 * mention variant. Presentation-only — props in, nothing out.
 *
 * Renders `null` when there is nothing to show, so callers can pass a count
 * unconditionally instead of guarding at every call site.
 */
export const UnreadBadge = ({
	count,
	max = 99,
	hasMention = false,
	label,
}: UnreadBadgeProps) => {
	const recipe = useRecipe({ key: "unreadBadge" });
	const styles = recipe({ mention: hasMention });
	const formatted = formatUnreadCount(count, max);

	if (formatted === null) return null;

	return (
		<chakra.span
			css={styles}
			className="unread-badge"
			data-testid="unread-badge"
			data-mention={hasMention ? "true" : undefined}
			// role="img" makes the label the whole accessible name: the digits
			// alone ("3") say nothing on their own, and a bare span with
			// aria-label is not reliably exposed.
			role="img"
			aria-label={label ?? defaultLabel(formatted, hasMention)}
		>
			{hasMention ? <AtSign size={12} aria-hidden="true" /> : null}
			{formatted}
		</chakra.span>
	);
};
UnreadBadge.displayName = "UnreadBadge";
