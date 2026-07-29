import { chakra, useSlotRecipe } from "@chakra-ui/react";
import { partitionReactions } from "./partition-reactions";
import type { ReactionChipsProps, ReactionSummary } from "./types";

/**
 * The English name ReactionChips announces per chip: `"thumbs up, 3
 * reactions"`, falling back to the glyph when the consumer supplied no name
 * for the emoji.
 */
function defaultChipLabel({ emoji, count, label }: ReactionSummary): string {
	return `${label ?? emoji}, ${count} ${count === 1 ? "reaction" : "reactions"}`;
}

/** The English name for the `+N` chip: `"2 more reactions"`. */
function defaultOverflowLabel(hiddenCount: number): string {
	return `${hiddenCount} more ${hiddenCount === 1 ? "reaction" : "reactions"}`;
}

/**
 * The aggregated reactions under a message: one chip per emoji with its count,
 * the viewer's own reactions marked, and the tail folded into a `+N` chip.
 * Presentation-only — reactions in, an emoji out of `onToggle`.
 *
 * Renders `null` when there is nothing to show and no `addAction`, so callers
 * can pass a message's reactions unconditionally instead of guarding at every
 * call site.
 */
export const ReactionChips = ({
	reactions,
	onToggle,
	maxVisible = 8,
	formatChipLabel = defaultChipLabel,
	formatOverflowLabel = defaultOverflowLabel,
	onShowAll,
	addAction,
	disabled = false,
	label = "Reactions",
}: ReactionChipsProps) => {
	const recipe = useSlotRecipe({ key: "reactionChips" });
	// Both variants are resolved once rather than per chip: only the `chip` and
	// `count` slots differ between them.
	const styles = recipe({ reacted: false });
	const reactedStyles = recipe({ reacted: true });
	const { visible, hiddenCount } = partitionReactions(reactions, maxVisible);

	// The addAction slot is the one reason to keep an otherwise empty row: it
	// is how the first reaction on a message gets added.
	if (visible.length === 0 && !addAction) return null;

	const overflowLabel = formatOverflowLabel(hiddenCount);

	return (
		<chakra.div
			css={styles.root}
			className="reaction-chips"
			data-testid="reaction-chips"
			role="group"
			aria-label={label}
		>
			{visible.map((reaction) => {
				const reacted = reaction.reactedByMe ?? false;
				return (
					<chakra.button
						key={reaction.emoji}
						type="button"
						css={reacted ? reactedStyles.chip : styles.chip}
						className="reaction-chips__chip"
						data-testid="reaction-chip"
						data-emoji={reaction.emoji}
						// A toggle button, so the reacted state is `aria-pressed`
						// rather than something baked into the accessible name.
						aria-pressed={reacted}
						aria-label={formatChipLabel(reaction)}
						disabled={disabled}
						onClick={() => onToggle(reaction.emoji)}
					>
						<chakra.span
							css={styles.emoji}
							className="reaction-chips__emoji"
							// The accessible name already carries the emoji's name;
							// letting the glyph through too announces it twice.
							aria-hidden="true"
						>
							{reaction.emoji}
						</chakra.span>
						<chakra.span
							css={reacted ? reactedStyles.count : styles.count}
							className="reaction-chips__count"
							aria-hidden="true"
						>
							{reaction.count}
						</chakra.span>
					</chakra.button>
				);
			})}

			{hiddenCount > 0 ? (
				onShowAll ? (
					<chakra.button
						type="button"
						css={styles.chip}
						className="reaction-chips__overflow"
						data-testid="reaction-chip-overflow"
						aria-label={overflowLabel}
						disabled={disabled}
						onClick={onShowAll}
					>
						<chakra.span css={styles.count} aria-hidden="true">
							{`+${hiddenCount}`}
						</chakra.span>
					</chakra.button>
				) : (
					<chakra.span
						css={styles.chip}
						className="reaction-chips__overflow"
						data-testid="reaction-chip-overflow"
						// role="img" makes the label the whole accessible name: "+2"
						// alone says nothing, and a bare span with aria-label is not
						// reliably exposed. Same treatment as UnreadBadge.
						role="img"
						aria-label={overflowLabel}
						// Inert: it is a readout, not a control.
						cursor="default"
					>
						<chakra.span css={styles.count} aria-hidden="true">
							{`+${hiddenCount}`}
						</chakra.span>
					</chakra.span>
				)
			) : null}

			{addAction}
		</chakra.div>
	);
};
ReactionChips.displayName = "ReactionChips";
