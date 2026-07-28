/**
 * Resolves an unread count to the string the badge shows, or `null` when the
 * badge should not render at all.
 *
 * `null` — rather than an empty string — is the single "nothing to show"
 * signal, so the caller has exactly one branch to handle: zero, negative,
 * fractional-below-one, and non-finite counts all collapse to it.
 *
 * @param count Unread items. Fractions are floored; anything below 1 hides.
 * @param max Highest count rendered verbatim; above it the label reads
 *   `{max}+`. Clamped to at least 1 so the cap label stays meaningful.
 */
export function formatUnreadCount(count: number, max: number): string | null {
	if (!Number.isFinite(count)) return null;

	const total = Math.floor(count);
	if (total < 1) return null;

	// A non-finite max means "never cap" — comparing against the count itself
	// keeps the branch below uniform.
	const cap = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : total;

	return total > cap ? `${cap}+` : String(total);
}
