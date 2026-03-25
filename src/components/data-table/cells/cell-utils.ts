/** Dash shown for null/undefined cell values. */
export const emptyCellValue = "—";

/** Truncate text to maxLength, appending "…" if exceeded. */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}…`;
}

/** Return singular or plural form based on count. */
export function pluralize(
	count: number,
	singular: string,
	plural: string,
): string {
	return count === 1 ? singular : plural;
}
