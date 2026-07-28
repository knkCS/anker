import type React from "react";

export interface VirtualizedMessageListProps<T> {
	/**
	 * Messages ordered oldest → newest; the last item renders at the bottom.
	 * Append new messages at the end, prepend older pages at the start — the
	 * list preserves scroll position in both cases. anker never inspects items.
	 */
	items: readonly T[];
	/** Stable unique key per item. */
	getItemKey: (item: T) => string;
	/** Date accessor for day-divider boundaries. Omit to disable dividers. */
	getItemDate?: (item: T) => Date;
	/** Renders one message row — the opaque item slot. */
	renderItem: (item: T, index: number) => React.ReactNode;
	/**
	 * Formats a day-divider label.
	 * @default "Today"/"Yesterday"/locale-formatted date
	 */
	formatDayLabel?: (date: Date) => React.ReactNode;
	/**
	 * Called once each time scrolling approaches the top. The consumer loads
	 * and prepends the older page — the list never fetches.
	 */
	onLoadOlder?: () => void;
	/** Distance from the top (px) that counts as approaching. @default 240 */
	loadOlderThreshold?: number;
	/**
	 * Distance from the bottom (px) within which the list counts as pinned:
	 * appended items keep it at the bottom and no jump affordance shows.
	 * @default 48
	 */
	pinThreshold?: number;
	/** Estimated message row height (px) before measurement. @default 72 */
	estimateItemSize?: number;
	/** Label for the jump-to-latest pill. @default "Jump to latest" */
	jumpToLatestLabel?: string;
	/** Accessible label for the log region. @default "Message history" */
	"aria-label"?: string;
}
