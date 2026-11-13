// A Kanban column's list of cards (#326). A short column renders every card;
// a long one (`virtualized`) scrolls within `maxHeight` and renders only the
// cards in its window, over the virtualiser `VirtualizedMessageList` already
// uses. The board decides which columns are long enough and owns focus; this
// list only places the cards it is asked for.
//
// - Both modes render the same tree (viewport > ul > li keyed by card), so a
//   column crossing the threshold keeps its cards mounted — and focus on the
//   focused one.
// - `keepIndex` stays mounted even out of view: it is the board's tab stop,
//   so Tab still lands on it and a focused card never unmounts under focus.
// - `onScroller` hands the board a way to scroll a card into the window, for
//   a card the arrow keys reach outside it; the board focuses it on mount.
// - Spacing stays on tokens: each item pads its card by `1` all round, which
//   makes the `2` gap between cards and leaves room for the focus ring that
//   the scrolling viewport would otherwise clip; the viewport's `-1` margin
//   lines the cards up with a short column's.
import {
	defaultRangeExtractor,
	type Range,
	useVirtualizer,
} from "@tanstack/react-virtual";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { Box } from "../../primitives/layout";

type ItemProps = React.ComponentProps<typeof Box>;

/** How many cards the window is guessed to hold before it is measured. */
const INITIAL_WINDOW_CARDS = 8;

export interface KanbanCardListProps {
	"aria-label": string;
	/** The keys of every card in the column, in display order. */
	itemKeys: readonly string[];
	/** Renders the list item for the card at `index`, with `itemProps` on it. */
	renderItem: (index: number, itemProps?: ItemProps) => React.ReactNode;
	/** Render only the cards in the window. */
	virtualized: boolean;
	estimateSize: number;
	maxHeight: string;
	/** A card index to keep mounted out of view, or -1. */
	keepIndex: number;
	onScroller: (scroll: ((index: number) => void) | null) => void;
}

export function KanbanCardList(props: KanbanCardListProps) {
	const {
		"aria-label": ariaLabel,
		itemKeys,
		renderItem,
		virtualized,
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
		enabled: virtualized,
		count: itemKeys.length,
		getScrollElement: () => viewportRef.current,
		estimateSize: () => estimateSize,
		getItemKey: (index) => itemKeys[index] ?? index,
		overscan: 5,
		rangeExtractor,
		// A first guess at the window until the viewport is measured: without
		// one the first render holds no card, and a column crossing the
		// threshold would drop its focused card for a frame.
		initialRect: { width: 0, height: estimateSize * INITIAL_WINDOW_CARDS },
	});

	const onScrollerRef = useRef(onScroller);
	onScrollerRef.current = onScroller;
	useEffect(() => {
		if (!virtualized) return;
		onScrollerRef.current((index) =>
			virtualizer.scrollToIndex(index, { align: "auto" }),
		);
		return () => onScrollerRef.current(null);
	}, [virtualizer, virtualized]);

	if (!virtualized) {
		return (
			<Box ref={viewportRef}>
				<Box
					as="ul"
					aria-label={ariaLabel}
					listStyleType="none"
					m="0"
					p="0"
					display="flex"
					flexDirection="column"
					gap="2"
				>
					{itemKeys.map((_, index) => renderItem(index))}
				</Box>
			</Box>
		);
	}

	return (
		<Box
			ref={viewportRef}
			// Out of the tab order: the board is one tab stop, and Chromium
			// otherwise makes a scroller whose cards all have tabIndex -1 one.
			tabIndex={-1}
			maxH={maxHeight}
			overflowY="auto"
			overscrollBehaviorY="contain"
			m="-1"
			_focusVisible={{ outline: "none" }}
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
						// `measureElement` reads `data-index` to map the node to its
						// card; the browser tests check the cards never overlap.
						ref: virtualizer.measureElement,
						"data-index": item.index,
						position: "absolute",
						top: "0",
						insetInline: "0",
						p: "1",
						style: { transform: `translateY(${item.start}px)` },
					} as ItemProps),
				)}
			</Box>
		</Box>
	);
}
