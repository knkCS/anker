// A Kanban column's list of cards, virtualised (#326): the column scrolls
// within `maxHeight` and renders only the cards in its window, over the
// virtualiser `VirtualizedMessageList` already uses. The board decides which
// columns are long enough to need it and owns focus; this list only places
// the cards it is asked for.
//
// - `keepIndex` stays mounted even out of view: it is the board's tab stop,
//   so Tab still lands on it and a focused card never unmounts under focus.
// - `onScroller` hands the board a way to scroll a card into the window, for
//   a card the arrow keys reach outside it; the board focuses it on mount.
import {
	defaultRangeExtractor,
	type Range,
	useVirtualizer,
} from "@tanstack/react-virtual";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { Box } from "../../primitives/layout";

/** The space between cards, in pixels: the board's `gap="2"`. */
const CARD_GAP_PX = 8;
/**
 * Room around the cards for their focus ring, which the scrolling list would
 * otherwise clip, in pixels: spacing token `1`.
 */
const RING_ROOM_PX = 4;

type ItemProps = React.ComponentProps<typeof Box>;

export interface KanbanVirtualListProps {
	"aria-label": string;
	/** The keys of every card in the column, in display order. */
	itemKeys: readonly string[];
	/** Renders the list item for the card at `index`, with `itemProps` on it. */
	renderItem: (index: number, itemProps: ItemProps) => React.ReactNode;
	estimateSize: number;
	maxHeight: string;
	/** A card index to keep mounted out of view, or -1. */
	keepIndex: number;
	onScroller: (scroll: ((index: number) => void) | null) => void;
}

export function KanbanVirtualList(props: KanbanVirtualListProps) {
	const {
		"aria-label": ariaLabel,
		itemKeys,
		renderItem,
		estimateSize,
		maxHeight,
		keepIndex,
		onScroller,
	} = props;
	const viewportRef = useRef<HTMLDivElement | null>(null);

	const rangeExtractor = useCallback(
		(range: Range) => {
			const indexes = defaultRangeExtractor(range);
			if (keepIndex < 0 || indexes.includes(keepIndex)) return indexes;
			return [...indexes, keepIndex].sort((a, b) => a - b);
		},
		[keepIndex],
	);

	const virtualizer = useVirtualizer({
		count: itemKeys.length,
		getScrollElement: () => viewportRef.current,
		estimateSize: () => estimateSize,
		getItemKey: (index) => itemKeys[index] ?? index,
		gap: CARD_GAP_PX,
		paddingStart: RING_ROOM_PX,
		paddingEnd: RING_ROOM_PX,
		scrollPaddingStart: RING_ROOM_PX,
		scrollPaddingEnd: RING_ROOM_PX,
		overscan: 5,
		rangeExtractor,
	});

	const onScrollerRef = useRef(onScroller);
	onScrollerRef.current = onScroller;
	useEffect(() => {
		onScrollerRef.current((index) =>
			virtualizer.scrollToIndex(index, { align: "auto" }),
		);
		return () => onScrollerRef.current(null);
	}, [virtualizer]);

	return (
		<Box
			ref={viewportRef}
			data-kanban-viewport=""
			maxH={maxHeight}
			overflowY="auto"
			overscrollBehaviorY="contain"
			// Room for the focus ring, pulled back out so the cards line up with
			// those of a column that does not scroll.
			mx="-1"
		>
			<Box
				as="ul"
				aria-label={ariaLabel}
				listStyleType="none"
				m="0"
				p="0"
				position="relative"
				style={{ height: `${virtualizer.getTotalSize()}px` }}
			>
				{virtualizer.getVirtualItems().map((item) =>
					renderItem(item.index, {
						ref: virtualizer.measureElement,
						"data-index": item.index,
						position: "absolute",
						top: "0",
						insetInlineStart: "1",
						insetInlineEnd: "1",
						style: { transform: `translateY(${item.start}px)` },
					} as ItemProps),
				)}
			</Box>
		</Box>
	);
}
