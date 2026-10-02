import type { IconEntry } from "./types";

export interface IconSearch {
	/** Free text. Words are ANDed; each must hit the name or a tag. */
	query: string;
	/** A lucide category id, or null/undefined for every category. */
	category?: string | null;
}

// Lower rank sorts first.
const EXACT = 0;
const NAME_PREFIX = 1;
const NAME_CONTAINS = 2;
const TAG = 3;

/**
 * Filters and ranks icons for the picker. An icon matches when every word of
 * the query hits its name (substring) or one of its tags (prefix); the icon's
 * rank is set by how the query as a whole hits its name, so typing a name
 * floats it to the top and tag-only hits trail. Ties keep the input order.
 */
export function searchIcons(
	entries: readonly IconEntry[],
	{ query, category }: IconSearch,
): string[] {
	const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
	const inCategory = (entry: IconEntry) =>
		!category || entry.categories.includes(category);

	if (words.length === 0) {
		return entries.filter(inCategory).map((entry) => entry.name);
	}

	// "file text" should find `file-text` exactly as "file-text" does.
	const joined = words.join("-");
	const ranked: Array<{ name: string; rank: number; order: number }> = [];
	entries.forEach((entry, order) => {
		if (!inCategory(entry)) return;
		const matches = words.every(
			(word) =>
				entry.name.includes(word) ||
				entry.tags.some((tag) => tag.startsWith(word)),
		);
		if (!matches) return;
		const rank =
			entry.name === joined
				? EXACT
				: entry.name.startsWith(joined)
					? NAME_PREFIX
					: entry.name.includes(joined)
						? NAME_CONTAINS
						: TAG;
		ranked.push({ name: entry.name, rank, order });
	});
	ranked.sort((a, b) => a.rank - b.rank || a.order - b.order);
	return ranked.map((hit) => hit.name);
}
