import type { ReactionSummary } from "./types";

/** Reactions split into the chips that render and the tail folded behind `+N`. */
export interface ReactionPartition {
	/** Chips rendered verbatim, in the order they were given. */
	visible: ReactionSummary[];
	/** How many chips are folded into the trailing `+N`. */
	hiddenCount: number;
}

/**
 * Splits the reaction list into the chips that render and the count behind the
 * overflow chip.
 *
 * @param reactions Aggregated reactions, in the consumer's own order.
 * @param maxVisible Highest number of chips rendered verbatim; the rest become
 *   `hiddenCount`.
 */
export function partitionReactions(
	reactions: readonly ReactionSummary[],
	maxVisible: number,
): ReactionPartition {
	// Dropped before the cap is applied, never after: a reaction nobody made
	// must not show up as part of a `+N` the consumer could never reveal.
	const present = reactions.filter(
		({ count }) => Number.isFinite(count) && Math.floor(count) >= 1,
	);

	// The list arrives aggregated, so a repeated emoji is malformed input —
	// but rendering it twice would both duplicate the React key and show the
	// same reaction as two chips. Summing is the one merge that stays true to
	// an aggregate; the first occurrence keeps its position.
	const merged = new Map<string, ReactionSummary>();
	for (const { emoji, count, reactedByMe, label } of present) {
		const seen = merged.get(emoji);
		merged.set(emoji, {
			emoji,
			count: Math.floor(count) + (seen?.count ?? 0),
			reactedByMe: (seen?.reactedByMe || reactedByMe) ?? false,
			label: seen?.label ?? label,
		});
	}
	const chips = Array.from(merged.values());

	// NaN needs its own branch: it survives both Math.floor and Math.max, and
	// a NaN cap slices to nothing while reporting NaN hidden. Showing every
	// chip is the safe reading of "no usable cap" — an infinite maxVisible
	// already means "never fold" for free.
	const cap = Number.isNaN(maxVisible)
		? Number.POSITIVE_INFINITY
		: Math.max(0, Math.floor(maxVisible));

	return {
		visible: chips.slice(0, cap),
		hiddenCount: Math.max(0, chips.length - cap),
	};
}
