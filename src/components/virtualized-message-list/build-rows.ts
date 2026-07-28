import { localDayKey } from "./day";

export type MessageListRow<T> =
	| { kind: "divider"; key: string; date: Date }
	| { kind: "message"; key: string; item: T; index: number };

export interface BuildMessageListRowsOptions<T> {
	/** Stable unique key per item. */
	getItemKey: (item: T) => string;
	/** Date used for day-divider boundaries. Omit to disable dividers. */
	getItemDate?: (item: T) => Date;
}

/**
 * Flattens messages into the virtualized row list, inserting a divider row
 * whenever the local calendar day changes between consecutive messages.
 */
export function buildMessageListRows<T>(
	items: readonly T[],
	options: BuildMessageListRowsOptions<T>,
): MessageListRow<T>[] {
	const { getItemKey, getItemDate } = options;
	const rows: MessageListRow<T>[] = [];
	let currentDay: string | null = null;
	// Non-chronological input can revisit a day; suffix repeats to keep
	// virtualizer keys unique.
	const dayOccurrences = new Map<string, number>();
	items.forEach((item, index) => {
		if (getItemDate) {
			const date = getItemDate(item);
			// An invalid date is treated as dateless: no divider, day run unchanged.
			if (!Number.isNaN(date.getTime())) {
				const day = localDayKey(date);
				if (day !== currentDay) {
					currentDay = day;
					const seen = dayOccurrences.get(day) ?? 0;
					dayOccurrences.set(day, seen + 1);
					const key = seen === 0 ? `d:${day}` : `d:${day}:${seen + 1}`;
					rows.push({ kind: "divider", key, date });
				}
			}
		}
		rows.push({ kind: "message", key: `m:${getItemKey(item)}`, item, index });
	});
	return rows;
}
