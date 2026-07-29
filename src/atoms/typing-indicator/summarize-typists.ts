/**
 * Who is typing, reduced to the shape a label needs: the names to print and
 * how many are folded away behind them.
 */
export interface TypistSummary {
	/** Names printed verbatim, in the order they were given. */
	named: string[];
	/** How many typists are folded into the trailing "and N others". */
	overflowCount: number;
	/** Typists in total, after blank names are dropped. */
	total: number;
}

/**
 * Reduces the list of people typing to the names worth printing, or `null`
 * when there is nothing to show.
 *
 * `null` — rather than an empty summary — is the single "nothing to show"
 * signal, so the caller has exactly one branch to handle: an empty list and a
 * list of nothing but blanks collapse to it.
 *
 * @param names Display names, already resolved to strings by the consumer.
 *   Blank entries are dropped; surrounding whitespace is trimmed.
 * @param maxNames Highest number of names printed verbatim; the rest become
 *   `overflowCount`. Clamped to at least 1 so the sentence keeps a subject.
 */
export function summarizeTypists(
	names: readonly string[],
	maxNames: number,
): TypistSummary | null {
	const present = names.map((name) => name.trim()).filter(Boolean);
	if (present.length === 0) return null;

	// Clamping to a whole number >= 1 keeps the label sane for nonsense input,
	// and leaves an infinite maxNames meaning "never cap" for free.
	const cap = Math.max(1, Math.floor(maxNames));

	return {
		named: present.slice(0, cap),
		overflowCount: Math.max(0, present.length - cap),
		total: present.length,
	};
}

/** Joins parts as `A`, `A and B`, `A, B and C` — the last pair takes `and`. */
function joinWithAnd(parts: string[]) {
	if (parts.length <= 1) return parts.join("");
	return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * The English sentence TypingIndicator shows unless the consumer passes its
 * own `formatLabel`: `"Alice is typing…"`,
 * `"Alice, Bob and 2 others are typing…"`.
 *
 * Exported so a localised formatter can fall back to it, and so the sentence
 * shape is testable without rendering.
 */
export function defaultTypingLabel({
	named,
	overflowCount,
	total,
}: TypistSummary): string {
	const overflow =
		overflowCount > 0
			? [`${overflowCount} ${overflowCount === 1 ? "other" : "others"}`]
			: [];
	const verb = total === 1 ? "is" : "are";

	return `${joinWithAnd([...named, ...overflow])} ${verb} typing…`;
}
