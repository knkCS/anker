/** "2026-07-28"-style key for a date's local calendar day. */
export function localDayKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/**
 * Default day-divider label: "Today"/"Yesterday" by local calendar day
 * (English defaults, overridable via the formatDayLabel prop), otherwise a
 * locale-formatted date.
 */
export function defaultFormatDayLabel(date: Date, now = new Date()): string {
	const day = localDayKey(date);
	if (day === localDayKey(now)) return "Today";
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	if (day === localDayKey(yesterday)) return "Yesterday";
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
