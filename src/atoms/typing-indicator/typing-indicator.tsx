import { chakra, useSlotRecipe } from "@chakra-ui/react";
import type { ReactNode } from "react";
import {
	defaultTypingLabel,
	summarizeTypists,
	type TypistSummary,
} from "./summarize-typists";

export interface TypingIndicatorProps {
	/**
	 * Display names of everyone currently typing, already resolved to strings.
	 * Blank entries are dropped. Expiry is the consumer's: a name shows for
	 * exactly as long as it is passed.
	 */
	names: readonly string[];
	/**
	 * Highest number of names printed verbatim; the rest collapse into
	 * "and N others". A hard cap — three names with `maxNames={2}` still read
	 * "Alice, Bob and 1 other".
	 * @default 2
	 */
	maxNames?: number;
	/**
	 * Composes the sentence from the truncated summary. Defaults to English
	 * (`"Alice, Bob and 2 others are typing…"`) — pass your own to localise,
	 * including its plural rules. The truncation itself stays here, so a
	 * translated label caps identically.
	 */
	formatLabel?: (summary: TypistSummary) => ReactNode;
	/**
	 * Keeps the row mounted and fades it out when nobody is typing, instead of
	 * unmounting. Costs a permanent row of vertical space and buys two things:
	 * the message list above never nudges as typing starts and stops, and the
	 * live region is already in the DOM when the first name arrives — which is
	 * where screen readers announce most reliably.
	 * @default false
	 */
	reserveSpace?: boolean;
}

const DOTS = [0, 1, 2];

/**
 * The "who is typing" row: three bouncing dots plus the names, truncated once
 * more than `maxNames` people are typing. Presentation-only — props in,
 * nothing out. TTL/expiry logic stays with the consumer; this renders whatever
 * list it is handed.
 *
 * Renders `null` when nobody is typing, so callers can pass the list
 * unconditionally instead of guarding at every call site. Pass `reserveSpace`
 * to hold the row's height across that transition.
 */
export const TypingIndicator = ({
	names,
	maxNames = 2,
	formatLabel = defaultTypingLabel,
	reserveSpace = false,
}: TypingIndicatorProps) => {
	const recipe = useSlotRecipe({ key: "typingIndicator" });
	const styles = recipe();
	const summary = summarizeTypists(names, maxNames);

	if (summary === null && !reserveSpace) return null;

	return (
		<chakra.div
			css={styles.root}
			className="typing-indicator"
			data-testid="typing-indicator"
			data-state={summary === null ? "closed" : "open"}
			// A polite live region, not an alert: typing is ambient news and must
			// never interrupt what a screen reader is already saying.
			role="status"
		>
			<chakra.span
				css={styles.dots}
				className="typing-indicator__dots"
				// Decorative: the sentence beside them already says "is typing".
				aria-hidden="true"
			>
				{DOTS.map((index) => (
					<chakra.span
						key={index}
						css={styles.dot}
						className="typing-indicator__dot"
					/>
				))}
			</chakra.span>
			{summary === null ? null : (
				<chakra.span css={styles.label} className="typing-indicator__label">
					{formatLabel(summary)}
				</chakra.span>
			)}
		</chakra.div>
	);
};
TypingIndicator.displayName = "TypingIndicator";
