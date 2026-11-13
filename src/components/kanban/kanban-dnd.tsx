// Drag and drop for an editable Kanban board (#327). The board imports this
// module lazily (`import("./kanban-dnd")`) and only when `onMove` is passed,
// so a read-only board never loads it — nor dnd-kit, which only this file
// imports (`kanban-dnd.boundary.test.ts` pins both).
//
// - The drag is a preview: while a card moves, the board renders this
//   layer's arrangement of item keys instead of the consumer's columns. On
//   drop the layer calls `onMove`; whatever it answers, the preview ends and
//   the board shows the consumer's columns again — moved if the consumer
//   applied the move, snapped back if it vetoed (returned `false`) or left
//   its columns alone.
// - Pointer: dnd-kit's mouse and touch sensors (touch after a press, so a
//   swipe still scrolls). Cards are `useDraggable` + `useDroppable`, not
//   `@dnd-kit/sortable`: the preview re-renders the columns on every target
//   change, so no sortable transforms are needed — and none fight a
//   virtualised column's absolutely placed cards. The moving card follows the
//   pointer in a `DragOverlay`; the card left in the list marks its place.
// - Keyboard: the board's own model, not dnd-kit's keyboard sensor, which can
//   only aim at cards that are mounted. Space picks the focused card up, the
//   arrow keys / Home / End move it through the arrangement (into empty
//   columns, and to cards outside a virtualised column's window), Space or
//   Enter drops it, Escape — or focus leaving the board — cancels. The card
//   keeps focus and stays the board's one tab stop throughout.
// - Every step is announced in one live region, from `KanbanDragLabels`.
import {
	type CollisionDetection,
	DndContext,
	type DragEndEvent,
	type DragMoveEvent,
	DragOverlay,
	type DragStartEvent,
	MeasuringStrategy,
	MouseSensor,
	pointerWithin,
	TouchSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Box } from "../../primitives/layout";
import type {
	KanbanCardDrag,
	KanbanDndApi,
	KanbanDndBoardProps,
	KanbanDragLabels,
	KanbanDragPlace,
} from "./kanban-dnd-types";
import {
	type Arrangement,
	keyboardMoveTarget,
	locate,
	moveCard,
	type PointerOver,
	pointerTarget,
	reconcile,
	resolveMove,
} from "./kanban-move";
import type { KanbanPosition } from "./kanban-navigation";

const place = (p: KanbanDragPlace) =>
	`position ${p.position} of ${p.total} in ${p.columnTitle}`;

export const defaultDragLabels: KanbanDragLabels = {
	instructions:
		"Press space to pick up the card. While it is picked up, use the arrow " +
		"keys to move it, space or enter to drop it, or escape to cancel.",
	pickedUp: (p) =>
		`Picked up card at ${place(p)}. Use the arrow keys to move it, space to drop it, escape to cancel.`,
	moved: (p) => `Card moved to ${place(p)}.`,
	dropped: (p) => `Card dropped at ${place(p)}.`,
	cancelled: (p) => `Move cancelled. Card returned to ${place(p)}.`,
	vetoed: (p) => `Move not allowed. Card returned to ${place(p)}.`,
};

// dnd-kit's own announcements speak in ids; this layer announces itself.
const SILENT = {
	onDragStart: () => undefined,
	onDragOver: () => undefined,
	onDragEnd: () => undefined,
	onDragCancel: () => undefined,
};

const COLUMN_PREFIX = "\u0000kanban-column:";

interface Drag {
	key: string;
	/** "pointer" shows the overlay; "keyboard" lifts the card in place. */
	via: "pointer" | "keyboard";
	preview: Arrangement;
}

interface LayerState {
	drag: Drag | null;
	describedBy: string;
}

const LayerContext = createContext<LayerState>({ drag: null, describedBy: "" });

function DndColumn({
	columnId,
	children,
}: React.ComponentProps<KanbanDndApi["Column"]>) {
	const { drag } = useContext(LayerContext);
	const { setNodeRef } = useDroppable({
		id: COLUMN_PREFIX + columnId,
		data: { type: "column", columnId },
	});
	const target = useContext(TargetColumnContext) === columnId && drag != null;
	return children({ ref: setNodeRef, target });
}

const TargetColumnContext = createContext<string | null>(null);

function DndItem({
	itemKey,
	columnId,
	children,
}: React.ComponentProps<KanbanDndApi["Item"]>) {
	const { drag, describedBy } = useContext(LayerContext);
	const draggable = useDraggable({ id: itemKey, data: { type: "card" } });
	const droppable = useDroppable({
		id: itemKey,
		data: { type: "card", columnId },
	});
	const setDraggable = draggable.setNodeRef;
	const setDroppable = droppable.setNodeRef;
	const ref = useCallback(
		(element: HTMLElement | null) => {
			setDraggable(element);
			setDroppable(element);
		},
		[setDraggable, setDroppable],
	);
	const value: KanbanCardDrag = {
		ref,
		listeners: draggable.listeners as KanbanCardDrag["listeners"],
		grabbed: drag?.key === itemKey && drag.via === "keyboard",
		dragging: drag?.key === itemKey && drag.via === "pointer",
		describedBy,
	};
	return children(value);
}

// Prefer the card under the pointer; between and below cards, its column.
const collisionDetection: CollisionDetection = (args) => {
	const hits = pointerWithin(args);
	const cards = hits.filter(
		(hit) =>
			args.droppableContainers.find((c) => c.id === hit.id)?.data.current
				?.type === "card",
	);
	return cards.length > 0 ? cards : hits;
};

function KanbanDndBoard(props: KanbanDndBoardProps) {
	const {
		columns,
		committed,
		onMove,
		focusCard,
		getBoard,
		getDirection,
		labels: labelOverrides,
		renderOverlay,
		children,
	} = props;
	const labels = useMemo(
		() => ({ ...defaultDragLabels, ...labelOverrides }),
		[labelOverrides],
	);
	const describedBy = useId();
	const [drag, setDrag] = useState<Drag | null>(null);
	const [announcement, setAnnouncement] = useState("");
	// A card to focus once the arrangement it moved in has rendered.
	const focusKey = useRef<string | null>(null);

	const preview = drag ? reconcile(drag.preview, committed) : null;
	const arrangement = preview ?? committed;

	const placeOf = useCallback(
		(of: Arrangement, key: string): KanbanDragPlace | null => {
			const at = locate(of, key);
			if (!at) return null;
			return {
				columnTitle: columns[at.column]?.title ?? "",
				position: at.index + 1,
				total: of[at.column].length,
			};
		},
		[columns],
	);

	const announce = useCallback(
		(
			label: keyof Omit<KanbanDragLabels, "instructions">,
			of: Arrangement,
			key: string,
		) => {
			const at = placeOf(of, key);
			if (at) setAnnouncement(labels[label](at));
		},
		[labels, placeOf],
	);

	useLayoutEffect(() => {
		const key = focusKey.current;
		if (key == null) return;
		focusKey.current = null;
		const at = locate(arrangement, key);
		if (at) focusCard(at, key);
	});

	const start = useCallback(
		(key: string, via: Drag["via"]) => {
			setDrag({ key, via, preview: committed });
			announce("pickedUp", committed, key);
		},
		[announce, committed],
	);

	const retarget = useCallback(
		(to: KanbanPosition | null) => {
			if (!drag || !preview || !to) return;
			const from = locate(preview, drag.key);
			if (!from || (from.column === to.column && from.index === to.index)) {
				return;
			}
			const next = moveCard(preview, drag.key, to);
			setDrag({ ...drag, preview: next });
			announce("moved", next, drag.key);
			if (drag.via === "keyboard") focusKey.current = drag.key;
		},
		[announce, drag, preview],
	);

	// `refocus: false` when focus already left the board: the card must not
	// take it back.
	const cancel = useCallback(
		(refocus = true) => {
			if (!drag) return;
			setDrag(null);
			announce("cancelled", committed, drag.key);
			if (drag.via === "keyboard" && refocus) focusKey.current = drag.key;
		},
		[announce, committed, drag],
	);

	const drop = useCallback(() => {
		if (!drag || !preview) return;
		setDrag(null);
		if (drag.via === "keyboard") focusKey.current = drag.key;
		const move = resolveMove(committed, preview, drag.key);
		if (!move) {
			announce("dropped", committed, drag.key);
			return;
		}
		if (onMove(drag.key, move.from, move.to) === false) {
			announce("vetoed", committed, drag.key);
		} else {
			announce("dropped", preview, drag.key);
		}
	}, [announce, committed, drag, onMove, preview]);

	// A keyboard drag ends when focus leaves the board (Tab, a click away).
	const grabbedKey = drag?.via === "keyboard" ? drag.key : null;
	const cancelRef = useRef(cancel);
	cancelRef.current = cancel;
	useEffect(() => {
		if (grabbedKey == null) return;
		const onFocusIn = (event: FocusEvent) => {
			const board = getBoard();
			if (board && !board.contains(event.target as Node)) {
				cancelRef.current(false);
			}
		};
		document.addEventListener("focusin", onFocusIn);
		return () => document.removeEventListener("focusin", onFocusIn);
	}, [grabbedKey, getBoard]);

	const onCardKeyDown = useCallback<KanbanDndApi["onCardKeyDown"]>(
		(position, event) => {
			if (event.target !== event.currentTarget) return false;
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
				return false;
			}
			const key = arrangement[position.column]?.[position.index];
			if (key == null) return false;
			if (!drag) {
				if (event.key !== " ") return false;
				event.preventDefault();
				if (!event.repeat) start(key, "keyboard");
				return true;
			}
			if (drag.via !== "keyboard" || drag.key !== key) return false;
			switch (event.key) {
				case " ":
				case "Enter":
					event.preventDefault();
					if (!event.repeat) drop();
					return true;
				case "Escape":
					event.preventDefault();
					cancel();
					return true;
				default: {
					const to = keyboardMoveTarget(
						arrangement,
						key,
						event.key,
						getDirection(),
					);
					if (!to) return false;
					event.preventDefault();
					retarget(to);
					return true;
				}
			}
		},
		[arrangement, cancel, drag, drop, getDirection, retarget, start],
	);

	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 250, tolerance: 5 },
		}),
	);

	const overFromEvent = (event: DragMoveEvent): PointerOver | null => {
		const { over, activatorEvent, delta } = event;
		if (!over) return null;
		const data = over.data.current as
			| { type: "card" | "column"; columnId?: string }
			| undefined;
		if (data?.type === "column") {
			const column = columns.findIndex((c) => c.id === data.columnId);
			return column >= 0 ? { kind: "column", column } : null;
		}
		const pointer = getEventCoordinates(activatorEvent);
		const y = (pointer?.y ?? 0) + delta.y;
		return {
			kind: "card",
			key: String(over.id),
			after: y > over.rect.top + over.rect.height / 2,
		};
	};

	const onDragMove = (event: DragMoveEvent) => {
		if (!drag || !preview) return;
		const over = overFromEvent(event);
		if (over) retarget(pointerTarget(preview, drag.key, over));
	};

	const targetColumn = useMemo(() => {
		if (!drag || !preview) return null;
		const at = locate(preview, drag.key);
		return at ? (columns[at.column]?.id ?? null) : null;
	}, [columns, drag, preview]);

	const layer = useMemo<LayerState>(
		() => ({ drag, describedBy }),
		[drag, describedBy],
	);

	const api = useMemo<KanbanDndApi>(
		() => ({ arrangement, Column: DndColumn, Item: DndItem, onCardKeyDown }),
		[arrangement, onCardKeyDown],
	);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={collisionDetection}
			measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
			accessibility={{
				announcements: SILENT,
				screenReaderInstructions: { draggable: labels.instructions },
			}}
			onDragStart={(event: DragStartEvent) => {
				if (drag) return;
				start(String(event.active.id), "pointer");
			}}
			onDragMove={onDragMove}
			onDragOver={onDragMove}
			onDragEnd={(event: DragEndEvent) => {
				if (event.over) drop();
				else cancel(false);
			}}
			onDragCancel={() => cancel()}
		>
			<LayerContext.Provider value={layer}>
				<TargetColumnContext.Provider value={targetColumn}>
					{children(api)}
				</TargetColumnContext.Provider>
			</LayerContext.Provider>
			{/* No drop animation: on drop the card is already in its place. */}
			<DragOverlay dropAnimation={null}>
				{drag?.via === "pointer" ? (
					<Box
						aria-hidden
						inert
						data-kanban-drag-overlay=""
						borderRadius="md"
						boxShadow="lg"
						cursor="grabbing"
					>
						{renderOverlay(drag.key)}
					</Box>
				) : null}
			</DragOverlay>
			<Box id={describedBy} srOnly>
				{labels.instructions}
			</Box>
			<Box srOnly role="status" aria-live="assertive" aria-atomic>
				{announcement}
			</Box>
		</DndContext>
	);
}
KanbanDndBoard.displayName = "KanbanDndBoard";

export default KanbanDndBoard;
