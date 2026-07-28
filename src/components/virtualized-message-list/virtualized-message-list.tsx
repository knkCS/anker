import { chakra, useSlotRecipe } from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { buildMessageListRows } from "./build-rows";
import { defaultFormatDayLabel } from "./day";
import { initialLoadOlderGate, nextLoadOlderGate } from "./load-older-gate";
import type { VirtualizedMessageListProps } from "./types";

const DIVIDER_ESTIMATE_PX = 44;

/**
 * Virtualized message history: newest at the bottom, pinned there while the
 * user hasn't scrolled up (with a jump-to-latest pill once they have), day
 * dividers between local calendar days, and an onLoadOlder callback when the
 * top is approached. Presentation-only — the consumer owns all data.
 *
 * The root fills its container; give the parent a bounded height.
 */
export const VirtualizedMessageList = <T,>(
	props: VirtualizedMessageListProps<T>,
) => {
	const {
		items,
		getItemKey,
		getItemDate,
		renderItem,
		formatDayLabel = defaultFormatDayLabel,
		onLoadOlder,
		loadOlderThreshold = 240,
		pinThreshold = 48,
		estimateItemSize = 72,
		jumpToLatestLabel = "Jump to latest",
		"aria-label": ariaLabel = "Message history",
	} = props;

	const recipe = useSlotRecipe({ key: "messageList" });
	const styles = recipe();

	const rows = useMemo(
		() => buildMessageListRows(items, { getItemKey, getItemDate }),
		[items, getItemKey, getItemDate],
	);

	const viewportRef = useRef<HTMLDivElement>(null);
	const [isPinned, setIsPinned] = useState(true);
	const isPinnedRef = useRef(true);
	const setPinned = useCallback((pinned: boolean) => {
		isPinnedRef.current = pinned;
		setIsPinned(pinned);
	}, []);
	const gateRef = useRef(initialLoadOlderGate);
	const onLoadOlderRef = useRef(onLoadOlder);
	useEffect(() => {
		onLoadOlderRef.current = onLoadOlder;
	});

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => viewportRef.current,
		estimateSize: (index) =>
			rows[index]?.kind === "divider" ? DIVIDER_ESTIMATE_PX : estimateItemSize,
		getItemKey: (index) => rows[index]?.key ?? index,
		overscan: 6,
		// anchorTo keeps the viewport in place while items prepend (load-older)
		// or resize. Follow-on-append is implemented below from DOM-based pinned
		// state instead of the virtualizer's followOnAppend: widening its
		// scrollEndThreshold to pinThreshold would also make estimate→measure
		// deltas near the bottom re-anchor to the end, fighting upward scrolls.
		anchorTo: "end",
	});

	// Anchor at the newest message when content first arrives, and follow
	// appended items while pinned. Prepends leave the last key unchanged and
	// are position-preserved by the virtualizer's anchoring.
	//
	// Scrolls to the bottom by writing scrollTop directly: the virtualizer's
	// scroll methods (scrollToEnd/scrollToIndex) start a rAF reconcile loop
	// that keeps forcing the offset back to its target — with periodic appends
	// that loop swallows the user's upward scrolling entirely.
	const scrollToBottom = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		viewport.scrollTop = viewport.scrollHeight;
		// Programmatic scrolls don't reliably fire scroll events — set the
		// pinned state directly.
		setPinned(true);
	}, [setPinned]);
	const lastRowKeyRef = useRef<string | null>(null);
	useLayoutEffect(() => {
		const lastKey = rows.length > 0 ? rows[rows.length - 1].key : null;
		const prevLastKey = lastRowKeyRef.current;
		lastRowKeyRef.current = lastKey;
		if (lastKey === null || lastKey === prevLastKey) return;
		if (prevLastKey !== null && !isPinnedRef.current) return;
		scrollToBottom();
	}, [rows, scrollToBottom]);

	// Pinned state and the load-older gate both derive from real DOM scroll
	// metrics, so they stay correct regardless of measurement estimates.
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const distanceFromBottom = () =>
			viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
		setPinned(distanceFromBottom() <= pinThreshold);
		let lastScrollTop = viewport.scrollTop;
		const handleScroll = () => {
			const previousTop = lastScrollTop;
			const currentTop = viewport.scrollTop;
			lastScrollTop = currentTop;
			// Any upward movement is unpin intent, even within pinThreshold —
			// scroll events lag the gesture, and an append landing while pinned
			// state is stale would scroll the list back to the end.
			if (currentTop < previousTop) {
				setPinned(false);
			} else {
				setPinned(distanceFromBottom() <= pinThreshold);
			}
			const { gate, shouldFire } = nextLoadOlderGate(gateRef.current, {
				distanceFromTop: Math.max(0, currentTop),
				threshold: loadOlderThreshold,
			});
			gateRef.current = gate;
			if (shouldFire) onLoadOlderRef.current?.();
		};
		// A wheel-up is unpin intent the moment it happens: scroll events lag
		// behind the animated gesture, and an append landing in that window
		// would see stale pinned state and yank the list back to the end.
		const handleWheel = (event: WheelEvent) => {
			if (event.deltaY < 0 && viewport.scrollHeight > viewport.clientHeight) {
				setPinned(false);
			}
		};
		viewport.addEventListener("scroll", handleScroll, { passive: true });
		viewport.addEventListener("wheel", handleWheel, { passive: true });
		return () => {
			viewport.removeEventListener("scroll", handleScroll);
			viewport.removeEventListener("wheel", handleWheel);
		};
	}, [pinThreshold, loadOlderThreshold, setPinned]);

	return (
		<chakra.div
			css={styles.root}
			className="message-list"
			data-testid="message-list"
		>
			<chakra.div
				ref={viewportRef}
				css={styles.viewport}
				className="message-list__viewport"
				data-testid="message-list-viewport"
				role="log"
				aria-label={ariaLabel}
			>
				<chakra.div
					css={styles.inner}
					className="message-list__inner"
					style={{ height: `${virtualizer.getTotalSize()}px` }}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const row = rows[virtualItem.index];
						if (!row) return null;
						return (
							<chakra.div
								key={virtualItem.key}
								ref={virtualizer.measureElement}
								data-index={virtualItem.index}
								css={styles.item}
								className="message-list__item"
								style={{ transform: `translateY(${virtualItem.start}px)` }}
							>
								{row.kind === "divider" ? (
									<chakra.div
										css={styles.divider}
										className="message-list__divider"
										data-testid="message-list-divider"
									>
										<chakra.span
											css={styles.dividerLabel}
											className="message-list__divider-label"
										>
											{formatDayLabel(row.date)}
										</chakra.span>
									</chakra.div>
								) : (
									renderItem(row.item, row.index)
								)}
							</chakra.div>
						);
					})}
				</chakra.div>
			</chakra.div>
			{isPinned ? null : (
				<chakra.button
					type="button"
					css={styles.jump}
					className="message-list__jump"
					data-testid="message-list-jump"
					onClick={scrollToBottom}
				>
					{jumpToLatestLabel}
					<ChevronDown size={16} aria-hidden />
				</chakra.button>
			)}
		</chakra.div>
	);
};
(VirtualizedMessageList as { displayName?: string }).displayName =
	"VirtualizedMessageList";
