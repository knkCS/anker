// A board of columns and cards (#325, Spec #314): columns with a
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
//
// Drag and drop is opt-in (#327): passing `onMove` loads `kanban-dnd.tsx` —
// and dnd-kit with it — through a dynamic import, so a read-only board never
// loads either. Until the module arrives the board renders read-only; then
// the layer wraps the board, hands it the arrangement to show (the drag's
// preview while one runs) and adds its wiring to each card's slot.
import type React from "react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { EmptyState } from "../../atoms/empty-state";
import { Box, type BoxProps, HStack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { isDevMode } from "../../utils/dev-mode";
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
import type {
	KanbanCardDrag,
	KanbanDndApi,
	KanbanDragLabels,
	KanbanMove,
} from "./kanban-dnd-types";
import {
	columnTone,
	type KanbanColumnEmphasis,
	type KanbanColumnGroup,
	type KanbanColumnTone,
	resolveGroups,
} from "./kanban-groups";
import {
	type KanbanDirection,
	type KanbanPosition,
	nextPosition,
} from "./kanban-navigation";

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
	/**
	 * Draws the column's top edge (and its collapsed strip) in a status
	 * palette. Defaults to its group's `tone`.
	 */
	tone?: KanbanColumnTone;
	/**
	 * `highlight` fills the column's header and tints its background in its
	 * tone (`warning` when it has none). Rare, like an `attention` card: set it
	 * only while the column needs someone — e.g. while it holds items.
	 */
	emphasis?: KanbanColumnEmphasis;
}

/** Where a rendered card sits, handed to `renderCard`. */
export interface KanbanCardContext {
	columnId: string;
	/** The card's index within its column. */
	index: number;
}

export interface KanbanProps<T> {
	columns: readonly KanbanColumn<T>[];
	/**
	 * Groups of consecutive columns, each with a header over exactly its
	 * columns showing its title and the total of their counts. A column's
	 * `tone` defaults to its group's. Columns outside every group are fine; a
	 * group naming unknown or non-consecutive columns is ignored (with a
	 * console warning in development).
	 */
	groups?: readonly KanbanColumnGroup[];
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
	/**
	 * Makes the board editable: cards drag between and within columns, with
	 * the pointer or the keyboard (Space picks the focused card up, the arrow
	 * keys move it, Space or Enter drops it, Escape cancels). Called on drop
	 * with where the card was and where it goes; apply the move to your
	 * `columns`, or return `false` to veto it — the card snaps back. Without
	 * it the board is read-only and loads no drag-and-drop code.
	 */
	// biome-ignore lint/suspicious/noConfusingVoidType: a handler that applies the move returns nothing.
	onMove?: (move: KanbanMove<T>) => boolean | void;
	/** What screen readers hear while a card is dragged. English defaults. */
	dragLabels?: Partial<KanbanDragLabels>;
}

type DndModule = typeof import("./kanban-dnd");

// Loaded once per page, on the first editable board; later boards render
// editable from their first frame.
let dndModule: DndModule | null = null;
let dndLoading: Promise<DndModule> | null = null;

function loadDnd(): Promise<DndModule> {
	dndLoading ??= import("./kanban-dnd").then(
		(module) => {
			dndModule = module;
			return module;
		},
		(error: unknown) => {
			dndLoading = null;
			throw error;
		},
	);
	return dndLoading;
}

/** The drag-and-drop module once loaded, while `enabled`; else `null`. */
function useDndModule(enabled: boolean): DndModule | null {
	const [module, setModule] = useState(dndModule);
	useEffect(() => {
		if (!enabled || module) return;
		let live = true;
		loadDnd().then(
			(loaded) => {
				if (live) setModule(loaded);
			},
			// A failed load leaves the board read-only.
			() => {},
		);
		return () => {
			live = false;
		};
	}, [enabled, module]);
	return enabled ? module : null;
}

const defaultColumnLabel = (title: string, count: number) =>
	`${title}, ${count} ${count === 1 ? "card" : "cards"}`;

// The column's top edge, per tone: the status palette's `solid` step, as on
// an `attention` card's edge; neutral, the border that shows on any surface.
const TONE_EDGE: Record<KanbanColumnTone, string> = {
	neutral: "border-emphasized",
	info: "info.solid",
	warning: "warning.solid",
	success: "success.solid",
	danger: "danger.solid",
};

// A highlighted column: the header filled in the tone, the column tinted.
const HIGHLIGHT_HEADER: Record<
	KanbanColumnTone,
	{ bg: string; color: string }
> = {
	neutral: { bg: "border-emphasized", color: "default" },
	info: { bg: "info.solid", color: "info.contrast" },
	warning: { bg: "warning.solid", color: "warning.contrast" },
	success: { bg: "success.solid", color: "success.contrast" },
	danger: { bg: "danger.solid", color: "danger.contrast" },
};
const HIGHLIGHT_BG: Record<KanbanColumnTone, string> = {
	neutral: "bg-muted",
	info: "info.subtle",
	warning: "warning.subtle",
	success: "success.subtle",
	danger: "danger.subtle",
};
// A group's title, in its tone.
const GROUP_TITLE: Record<KanbanColumnTone, string> = {
	neutral: "emphasized",
	info: "info.fg",
	warning: "warning.fg",
	success: "success.fg",
	danger: "danger.fg",
};
const EDGE_WIDTH = "3px";

const slotKey = (columnId: string, itemKey: string) =>
	`${columnId}\u0000${itemKey}`;

interface ActiveCard {
	columnId: string;
	itemKey: string;
}

/** What the root shares with the board it renders: focus state and refs. */
interface BoardShared<T> {
	/** The item keys of each column to show. */
	keys: readonly (readonly string[])[];
	itemByKey: Map<string, T>;
	api: KanbanDndApi | null;
	active: ActiveCard | null;
	setActive: (active: ActiveCard) => void;
	boardRef: React.RefObject<HTMLDivElement | null>;
	cards: React.RefObject<Map<string, HTMLElement>>;
	scrollers: React.RefObject<Map<string, (index: number) => void>>;
	pendingFocus: React.RefObject<string | null>;
	focusCard: (position: KanbanPosition, itemKey: string) => void;
}

function KanbanRoot<T>(props: KanbanProps<T>) {
	const { columns, getItemKey, renderCard, onMove, dragLabels } = props;
	const dnd = useDndModule(onMove != null);
	const boardRef = useRef<HTMLDivElement | null>(null);
	const cards = useRef(new Map<string, HTMLElement>());
	// Virtualised columns register how to scroll one of their cards into
	// their window; a card the keys reach outside it is focused on mount.
	const scrollers = useRef(new Map<string, (index: number) => void>());
	const pendingFocus = useRef<string | null>(null);
	const [active, setActive] = useState<ActiveCard | null>(null);

	const committed = useMemo(
		() => columns.map((column) => column.items.map(getItemKey)),
		[columns, getItemKey],
	);
	const itemByKey = useMemo(() => {
		const map = new Map<string, T>();
		columns.forEach((column, c) => {
			column.items.forEach((item, i) => {
				map.set(committed[c][i], item);
			});
		});
		return map;
	}, [columns, committed]);

	const getBoard = useCallback(() => boardRef.current, []);
	const getDirection = useCallback(
		(): KanbanDirection =>
			boardRef.current && getComputedStyle(boardRef.current).direction === "rtl"
				? "rtl"
				: "ltr",
		[],
	);

	// Focuses a card. One outside a virtualised column's window is scrolled
	// into it and takes focus when it mounts, without a native scroll of its
	// own that would fight the virtualiser's.
	const focusCard = useCallback(
		(position: KanbanPosition, itemKey: string) => {
			const columnId = columns[position.column]?.id;
			if (columnId == null) return;
			const key = slotKey(columnId, itemKey);
			const element = cards.current.get(key);
			if (element) {
				pendingFocus.current = null;
				if (document.activeElement !== element) element.focus();
			} else {
				pendingFocus.current = key;
				scrollers.current.get(columnId)?.(position.index);
			}
			setActive({ columnId, itemKey });
		},
		[columns],
	);

	const onMoveCard = useCallback(
		(itemKey: string, from: KanbanPosition, to: KanbanPosition) =>
			onMove?.({
				item: itemByKey.get(itemKey) as T,
				itemKey,
				from: { columnId: columns[from.column].id, index: from.index },
				to: { columnId: columns[to.column].id, index: to.index },
			}) !== false,
		[columns, itemByKey, onMove],
	);

	const shared = {
		itemByKey,
		active,
		setActive,
		boardRef,
		cards,
		scrollers,
		pendingFocus,
		focusCard,
	};

	// The board renders once more inside the drag layer when it arrives (a
	// remount, before any drag can have started); later boards on the page
	// find the module loaded and render editable from their first frame.
	if (!dnd) {
		return <KanbanBoard {...props} {...shared} keys={committed} api={null} />;
	}
	const DndBoard = dnd.default;
	return (
		<DndBoard
			columns={columns}
			committed={committed}
			onMove={onMoveCard}
			focusCard={focusCard}
			getBoard={getBoard}
			getDirection={getDirection}
			labels={dragLabels}
			renderOverlay={(itemKey) => {
				const item = itemByKey.get(itemKey);
				const c = committed.findIndex((k) => k.includes(itemKey));
				if (item === undefined || c < 0) return null;
				return renderCard(item, {
					columnId: columns[c].id,
					index: committed[c].indexOf(itemKey),
				});
			}}
		>
			{(api) => (
				<KanbanBoard {...props} {...shared} keys={api.arrangement} api={api} />
			)}
		</DndBoard>
	);
}
KanbanRoot.displayName = "Kanban";

function KanbanBoard<T>(props: KanbanProps<T> & BoardShared<T>) {
	const {
		columns,
		groups,
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
		keys,
		itemByKey,
		api,
		active,
		setActive,
		boardRef,
		cards,
		scrollers,
		pendingFocus,
		focusCard,
	} = props;
	const baseId = useId();

	const columnIds = useMemo(
		() => columns.map((column) => column.id),
		[columns],
	);
	const resolved = useMemo(
		() => resolveGroups(columnIds, groups),
		[columnIds, groups],
	);
	const problems = resolved.problems.join("\n");
	useEffect(() => {
		if (problems && isDevMode()) console.warn(problems);
	}, [problems]);
	const tones = columns.map((column, c) =>
		columnTone(column.tone, column.emphasis, resolved.groupOf[c]?.group),
	);
	// Toned or not, every column keeps the edge's room once one has an edge,
	// so the column headers stay in line.
	const anyTone = tones.some((tone) => tone != null);
	// While a drag previews a card in or out of a column, its count follows —
	// a server total by the same difference.
	const counts = columns.map(
		(column, c) =>
			(column.count ?? column.items.length) +
			(keys[c]?.length ?? 0) -
			column.items.length,
	);
	// Collapsed only while empty both on the board and in a drag's preview: a
	// column a card is dragged out of keeps its width, so the columns don't
	// shift under the pointer, and one a card is dragged into opens up.
	const collapsedAt = columns.map(
		(column, c) =>
			collapseEmptyColumns &&
			column.items.length === 0 &&
			(keys[c]?.length ?? 0) === 0,
	);

	// The one card in the tab order: the last one focused while it is still on
	// the board, else the first card of the first column that has one.
	const tabStop = useMemo((): ActiveCard | null => {
		if (active) {
			const c = columns.findIndex((column) => column.id === active.columnId);
			if (c >= 0 && keys[c]?.includes(active.itemKey)) return active;
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
			focusCard(to, keys[to.column][to.index]);
		},
		[boardRef, focusCard, keys],
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
	const { segments } = resolved;

	// Grouped, the board is a grid of one track per column under a row of
	// group headers; each group is a subgrid spanning its columns' tracks, so
	// its header is exactly as wide as they are, collapsed ones included.
	// Ungrouped, the board stays the row of flexible columns it always was.
	const renderColumnAt = (c: number, place?: BoxProps) => {
		const column = columns[c];
		const columnKeys = keys[c] ?? [];
		const count = counts[c];
		const collapsed = collapsedAt[c];
		const tone = tones[c];
		const highlighted = column.emphasis === "highlight" && tone != null;
		const titleId = `${baseId}-${column.id}`;
		const listLabel = formatColumnLabel(column.title, count);
		const virtualized = columnKeys.length > virtualizeAbove;
		const keepIndex =
			virtualized && tabStop?.columnId === column.id
				? columnKeys.indexOf(tabStop.itemKey)
				: -1;
		// One card, wrapped in its list item and handed the board's slot.
		// A virtualised list adds its positioning props to the item; an
		// editable board wraps it in the drag layer's item.
		const renderItem = (
			index: number,
			itemProps?: React.ComponentProps<typeof Box>,
		) => {
			const itemKey = columnKeys[index];
			const item = itemByKey.get(itemKey) as T;
			const key = slotKey(column.id, itemKey);
			const slotRef = (element: HTMLElement | null) => {
				if (element) {
					cards.current.set(key, element);
					if (pendingFocus.current === key) {
						pendingFocus.current = null;
						element.focus({ preventScroll: true });
					}
				} else cards.current.delete(key);
			};
			const listItem = (drag?: KanbanCardDrag) => {
				const slot: KanbanCardSlot = {
					tabIndex:
						tabStop?.columnId === column.id && tabStop.itemKey === itemKey
							? 0
							: -1,
					ref: drag
						? (element) => {
								slotRef(element);
								drag.ref(element);
							}
						: slotRef,
					onFocus: () => {
						if (pendingFocus.current !== key) pendingFocus.current = null;
						setActive({ columnId: column.id, itemKey });
					},
					onKeyDown: (event) => {
						if (api?.onCardKeyDown({ column: c, index }, event)) return;
						onCardKeyDown(c, index, event);
					},
					drag,
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
			return api ? (
				<api.Item key={itemKey} itemKey={itemKey} columnId={column.id}>
					{listItem}
				</api.Item>
			) : (
				listItem()
			);
		};
		const renderColumn = (drop?: {
			ref: (element: HTMLElement | null) => void;
			target: boolean;
		}) => (
			<Box
				key={column.id}
				ref={drop?.ref}
				data-kanban-column={column.id}
				data-collapsed={collapsed ? "" : undefined}
				data-drop-target={drop?.target ? "" : undefined}
				data-tone={tone}
				data-emphasis={highlighted ? column.emphasis : undefined}
				display="flex"
				flexDirection="column"
				gap="2"
				flex={collapsed ? "0 0 auto" : `1 0 ${columnMinWidth}`}
				minW={collapsed ? undefined : columnMinWidth}
				borderRadius="md"
				transitionProperty="background"
				transitionDuration="fast"
				bg={
					drop?.target
						? "bg-muted"
						: highlighted
							? HIGHLIGHT_BG[tone]
							: undefined
				}
				{...(anyTone
					? {
							borderTopWidth: EDGE_WIDTH,
							borderTopStyle: "solid",
							borderTopColor: tone ? TONE_EDGE[tone] : "transparent",
						}
					: undefined)}
				{...(highlighted ? { px: "1.5", pb: "1.5" } : undefined)}
				{...place}
			>
				<HStack
					gap="2"
					px="2"
					color="muted"
					minH="8"
					{...(highlighted
						? {
								...HIGHLIGHT_HEADER[tone],
								borderRadius: "sm",
								mt: "1.5",
							}
						: undefined)}
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
					itemKeys={columnKeys}
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
				{columnKeys.length === 0 && !collapsed
					? (column.emptyState ?? (
							<Text fontSize="xs" color="subtle" px="2">
								{emptyColumnLabel}
							</Text>
						))
					: null}
			</Box>
		);
		return api ? (
			<api.Column key={column.id} columnId={column.id}>
				{renderColumn}
			</api.Column>
		) : (
			renderColumn()
		);
	};

	const boardProps = {
		ref: boardRef,
		role: "group",
		"aria-label": ariaLabel,
		onBlur: (event: React.FocusEvent<HTMLElement>) => {
			// Focus left the board: a card the keys asked for must not take
			// focus back when it mounts later.
			if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
				pendingFocus.current = null;
			}
		},
		overflowX: "auto",
		maxW: "full",
		minW: "0",
		pb: "2",
	} as const;

	if (!segments) {
		return (
			<Box {...boardProps} display="flex" alignItems="flex-start" gap="3">
				{columns.map((_, c) => renderColumnAt(c))}
			</Box>
		);
	}

	return (
		<Box
			{...boardProps}
			display="grid"
			gridTemplateColumns={collapsedAt
				.map((collapsed) =>
					collapsed ? "min-content" : `minmax(${columnMinWidth}, 1fr)`,
				)
				.join(" ")}
			gridTemplateRows="auto auto"
			alignItems="start"
			columnGap="3"
			rowGap="2"
		>
			{segments.map((segment) => {
				if (segment.kind === "column") {
					return renderColumnAt(segment.index, {
						gridColumn: `${segment.index + 1}`,
						gridRow: "2",
					});
				}
				const { group, start, end } = segment.placed;
				const titleId = `${baseId}-group-${group.id}`;
				let total = 0;
				for (let c = start; c < end; c++) total += counts[c];
				return (
					<Box
						key={`group-${group.id}`}
						role="group"
						aria-labelledby={titleId}
						data-kanban-group={group.id}
						data-tone={group.tone}
						gridColumn={`${start + 1} / span ${end - start}`}
						gridRow="1 / span 2"
						display="grid"
						gridTemplateColumns="subgrid"
						gridTemplateRows="subgrid"
						minW="0"
					>
						<HStack
							data-kanban-group-header=""
							gridColumn="1 / -1"
							gridRow="1"
							gap="2"
							px="2"
							minH="8"
							minW="0"
							overflow="hidden"
							borderBottomWidth="1px"
							borderColor="border"
						>
							<Text
								as="span"
								id={titleId}
								fontSize="xs"
								fontWeight="semibold"
								textTransform="uppercase"
								letterSpacing="wide"
								color={group.tone ? GROUP_TITLE[group.tone] : "emphasized"}
								truncate
							>
								{group.title}
							</Text>
							<Text
								as="span"
								data-kanban-group-count=""
								fontSize="xs"
								fontWeight="semibold"
								color="muted"
								flexShrink={0}
								aria-hidden
							>
								{total}
							</Text>
						</HStack>
						{Array.from({ length: end - start }, (_, i) =>
							renderColumnAt(start + i, {
								gridColumn: `${i + 1}`,
								gridRow: "2",
							}),
						)}
					</Box>
				);
			})}
		</Box>
	);
}

/**
 * A board: columns with a title, a count and an action slot, and the cards
 * the consumer renders with `Kanban.Card`. Arrow keys move between cards and
 * columns; Enter opens a link or button card. Read-only unless `onMove` is
 * passed, which makes cards draggable — with the pointer or the keyboard. See
 * `docs/page-patterns.md` §11 "Boards".
 */
export const Kanban = Object.assign(KanbanRoot, {
	Card: KanbanCard,
	CardTitle: KanbanCardTitle,
	CardMeta: KanbanCardMeta,
	CardBadges: KanbanCardBadges,
	CardAvatar: KanbanCardAvatar,
});
