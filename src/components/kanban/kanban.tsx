// A board of columns and cards (#325, Spec #314). Read-only: columns with a
// title, a count and an action slot; cards the consumer renders with
// `Kanban.Card` and its building blocks. Items in, presentation out — the
// consumer owns the items and which column each sits in.
//
// The board is data-driven (`columns` with `items`, `getItemKey`,
// `renderCard`), like `VirtualizedMessageList`, so the board knows every
// card: that is what lets it move focus across columns, and what a
// virtualised column (#326) and drag and drop (#327) plug into.
//
// A column with more than `virtualizeAbove` cards scrolls within itself and
// renders only the cards in its window (`KanbanCardList`). The board keeps
// the focused card mounted and scrolls a column to a card the arrow keys
// reach outside the window, so keyboard navigation spans the whole column.
import type React from "react";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { EmptyState } from "../../atoms/empty-state";
import { Box, HStack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import {
	KanbanCard,
	KanbanCardAvatar,
	KanbanCardBadges,
	KanbanCardMeta,
	type KanbanCardSlot,
	KanbanCardSlotContext,
	KanbanCardTitle,
} from "./kanban-card";
import { KanbanCardList } from "./kanban-card-list";
import { type KanbanDirection, nextPosition } from "./kanban-navigation";

export interface KanbanColumn<T> {
	/** Stable id of the column. */
	id: string;
	/** The column's title; also names its list for assistive tech. */
	title: string;
	/** The column's cards, in display order. */
	items: readonly T[];
	/**
	 * The count to show and announce, when it is not `items.length` — e.g. a
	 * server total when only a page of the column is loaded.
	 */
	count?: number;
	/** An optional action in the column header (a button, a menu). */
	action?: React.ReactNode;
	/** Replaces the board's `emptyColumnLabel` for this column. */
	emptyState?: React.ReactNode;
}

/** Where a rendered card sits, handed to `renderCard`. */
export interface KanbanCardContext {
	columnId: string;
	/** The card's index within its column. */
	index: number;
}

export interface KanbanProps<T> {
	columns: readonly KanbanColumn<T>[];
	/** A stable key for an item, unique on the board. */
	getItemKey: (item: T) => string;
	/** Renders one card — a `Kanban.Card`, so the board can steer its focus. */
	renderCard: (item: T, context: KanbanCardContext) => React.ReactNode;
	/** Names the board for assistive tech. @default "Board" */
	"aria-label"?: string;
	/** Draw empty columns as a narrow strip. @default false */
	collapseEmptyColumns?: boolean;
	/**
	 * Shown instead of the columns when no column has a card. Pass `false` to
	 * keep the empty columns on screen. Defaults to an `EmptyState` reading
	 * `emptyBoardLabel`.
	 */
	emptyState?: React.ReactNode | false;
	/** @default "Nothing on the board yet" */
	emptyBoardLabel?: string;
	/** Shown in an empty column. @default "No cards" */
	emptyColumnLabel?: string;
	/**
	 * The accessible name of a column's list.
	 * @default (title, count) => `${title}, ${count} card(s)`
	 */
	formatColumnLabel?: (title: string, count: number) => string;
	/** The heading level of column titles. @default 3 */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
	/** A column's minimum width; narrower boards scroll. @default "16rem" */
	columnMinWidth?: string;
	/**
	 * A column with more cards than this scrolls within itself and renders
	 * only the cards in view, so columns with hundreds of cards stay fast.
	 * @default 100
	 */
	virtualizeAbove?: number;
	/** The height a virtualised column scrolls within. @default "70vh" */
	columnMaxHeight?: string;
	/**
	 * A card's expected height in pixels before it is measured, for a
	 * virtualised column. @default 88
	 */
	estimateCardHeight?: number;
}

const defaultColumnLabel = (title: string, count: number) =>
	`${title}, ${count} ${count === 1 ? "card" : "cards"}`;

const slotKey = (columnId: string, itemKey: string) =>
	`${columnId}\u0000${itemKey}`;

interface ActiveCard {
	columnId: string;
	itemKey: string;
}

function KanbanRoot<T>(props: KanbanProps<T>) {
	const {
		columns,
		getItemKey,
		renderCard,
		"aria-label": ariaLabel = "Board",
		collapseEmptyColumns = false,
		emptyState,
		emptyBoardLabel = "Nothing on the board yet",
		emptyColumnLabel = "No cards",
		formatColumnLabel = defaultColumnLabel,
		headingLevel = 3,
		columnMinWidth = "16rem",
		virtualizeAbove = 100,
		columnMaxHeight = "70vh",
		estimateCardHeight = 88,
	} = props;
	const baseId = useId();
	const boardRef = useRef<HTMLDivElement | null>(null);
	const cards = useRef(new Map<string, HTMLElement>());
	// Virtualised columns register how to scroll one of their cards into
	// their window; a card the keys reach outside it is focused on mount.
	const scrollers = useRef(new Map<string, (index: number) => void>());
	const pendingFocus = useRef<string | null>(null);
	const [active, setActive] = useState<ActiveCard | null>(null);

	const keys = useMemo(
		() => columns.map((column) => column.items.map(getItemKey)),
		[columns, getItemKey],
	);

	// The one card in the tab order: the last one focused while it is still on
	// the board, else the first card of the first column that has one.
	const tabStop = useMemo((): ActiveCard | null => {
		if (active) {
			const c = columns.findIndex((column) => column.id === active.columnId);
			if (c >= 0 && keys[c].includes(active.itemKey)) return active;
		}
		const c = keys.findIndex((column) => column.length > 0);
		return c >= 0 ? { columnId: columns[c].id, itemKey: keys[c][0] } : null;
	}, [active, columns, keys]);

	const onCardKeyDown = useCallback(
		(
			column: number,
			index: number,
			event: React.KeyboardEvent<HTMLElement>,
		) => {
			if (event.target !== event.currentTarget) return;
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
				return;
			}
			const direction: KanbanDirection =
				boardRef.current &&
				getComputedStyle(boardRef.current).direction === "rtl"
					? "rtl"
					: "ltr";
			const to = nextPosition(
				keys.map((k) => k.length),
				{ column, index },
				event.key,
				direction,
			);
			if (!to) return;
			event.preventDefault();
			const target = {
				columnId: columns[to.column].id,
				itemKey: keys[to.column][to.index],
			};
			const key = slotKey(target.columnId, target.itemKey);
			const element = cards.current.get(key);
			if (element) {
				pendingFocus.current = null;
				element.focus();
			} else {
				// The column scrolls the card into its window; the card takes focus
				// when it mounts, without a native scroll of its own that would
				// fight the virtualiser's.
				pendingFocus.current = key;
				scrollers.current.get(target.columnId)?.(to.index);
			}
			setActive(target);
		},
		[columns, keys],
	);

	const isEmpty = keys.every((column) => column.length === 0);
	if (isEmpty && emptyState !== false) {
		return (
			<Box role="group" aria-label={ariaLabel}>
				{emptyState ?? <EmptyState header={emptyBoardLabel} />}
			</Box>
		);
	}

	const heading = `h${headingLevel}` as const;

	return (
		<Box
			ref={boardRef}
			role="group"
			aria-label={ariaLabel}
			onBlur={(event: React.FocusEvent<HTMLElement>) => {
				// Focus left the board: a card the keys asked for must not take
				// focus back when it mounts later.
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					pendingFocus.current = null;
				}
			}}
			display="flex"
			alignItems="flex-start"
			gap="3"
			overflowX="auto"
			maxW="full"
			minW="0"
			pb="2"
		>
			{columns.map((column, c) => {
				const count = column.count ?? column.items.length;
				const collapsed = collapseEmptyColumns && column.items.length === 0;
				const titleId = `${baseId}-${column.id}`;
				const listLabel = formatColumnLabel(column.title, count);
				const virtualized = column.items.length > virtualizeAbove;
				const keepIndex =
					virtualized && tabStop?.columnId === column.id
						? keys[c].indexOf(tabStop.itemKey)
						: -1;
				// One card, wrapped in its list item and handed the board's slot.
				// A virtualised list adds its positioning props to the item.
				const renderItem = (
					index: number,
					itemProps?: React.ComponentProps<typeof Box>,
				) => {
					const item = column.items[index];
					const itemKey = keys[c][index];
					const key = slotKey(column.id, itemKey);
					const slot: KanbanCardSlot = {
						tabIndex:
							tabStop?.columnId === column.id && tabStop.itemKey === itemKey
								? 0
								: -1,
						ref: (element) => {
							if (element) {
								cards.current.set(key, element);
								if (pendingFocus.current === key) {
									pendingFocus.current = null;
									element.focus({ preventScroll: true });
								}
							} else cards.current.delete(key);
						},
						onFocus: () => {
							if (pendingFocus.current !== key) pendingFocus.current = null;
							setActive({ columnId: column.id, itemKey });
						},
						onKeyDown: (event) => onCardKeyDown(c, index, event),
					};
					return (
						<Box
							as="li"
							key={itemKey}
							aria-posinset={index + 1}
							aria-setsize={count}
							{...itemProps}
						>
							<KanbanCardSlotContext.Provider value={slot}>
								{renderCard(item, { columnId: column.id, index })}
							</KanbanCardSlotContext.Provider>
						</Box>
					);
				};
				return (
					<Box
						key={column.id}
						data-kanban-column={column.id}
						data-collapsed={collapsed ? "" : undefined}
						display="flex"
						flexDirection="column"
						gap="2"
						flex={collapsed ? "0 0 auto" : `1 0 ${columnMinWidth}`}
						minW={collapsed ? undefined : columnMinWidth}
					>
						<HStack
							gap="2"
							px="2"
							color="muted"
							minH="8"
							{...(collapsed
								? {
										flexDirection: "column",
										alignItems: "center",
										py: "2",
									}
								: { justify: "space-between", py: "1.5" })}
						>
							<HStack
								gap="2"
								minW="0"
								{...(collapsed
									? { flexDirection: "column", alignItems: "center" }
									: undefined)}
							>
								<Text
									as={heading}
									id={titleId}
									fontSize="xs"
									fontWeight="semibold"
									textTransform="uppercase"
									letterSpacing="wide"
									truncate={!collapsed}
									writingMode={collapsed ? "vertical-rl" : undefined}
								>
									{column.title}
								</Text>
								<Text as="span" fontSize="xs" fontWeight="semibold" aria-hidden>
									{count}
								</Text>
							</HStack>
							{column.action}
						</HStack>
						<KanbanCardList
							aria-label={listLabel}
							itemKeys={keys[c]}
							virtualized={virtualized}
							estimateSize={estimateCardHeight}
							maxHeight={columnMaxHeight}
							keepIndex={keepIndex}
							onScroller={(scroll) => {
								if (scroll) scrollers.current.set(column.id, scroll);
								else scrollers.current.delete(column.id);
							}}
							renderItem={renderItem}
						/>
						{column.items.length === 0 && !collapsed
							? (column.emptyState ?? (
									<Text fontSize="xs" color="subtle" px="2">
										{emptyColumnLabel}
									</Text>
								))
							: null}
					</Box>
				);
			})}
		</Box>
	);
}
KanbanRoot.displayName = "Kanban";

/**
 * A read-only board: columns with a title, a count and an action slot, and
 * the cards the consumer renders with `Kanban.Card`. Arrow keys move between
 * cards and columns; Enter opens a link or button card. See
 * `docs/page-patterns.md` §11 "Boards".
 */
export const Kanban = Object.assign(KanbanRoot, {
	Card: KanbanCard,
	CardTitle: KanbanCardTitle,
	CardMeta: KanbanCardMeta,
	CardBadges: KanbanCardBadges,
	CardAvatar: KanbanCardAvatar,
});
