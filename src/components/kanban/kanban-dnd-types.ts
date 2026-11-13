// The seam between the board (`kanban.tsx`, always loaded) and its drag and
// drop layer (`kanban-dnd.tsx`, loaded only when `onMove` is passed). Types
// only — nothing here pulls dnd-kit into a read-only board.
import type React from "react";
import type { KanbanPosition } from "./kanban-navigation";

/** A card's place in a move: its column and its index there. */
export interface KanbanMovePosition {
	columnId: string;
	index: number;
}

/** A move the user made, handed to `onMove`. */
export interface KanbanMove<T> {
	item: T;
	itemKey: string;
	/** Where the card was: its column and index in that column's `items`. */
	from: KanbanMovePosition;
	/**
	 * Where the card goes: the index it has in the target column once moved
	 * (counted without the card) — remove it from `from`, insert it here.
	 */
	to: KanbanMovePosition;
}

/** A card's place as a drag announcement reads it. */
export interface KanbanDragPlace {
	columnTitle: string;
	/** 1-based. */
	position: number;
	/** Cards in the column, the dragged one included. */
	total: number;
}

/** What screen readers hear while a card is dragged. English defaults. */
export interface KanbanDragLabels {
	/** How to drag with the keyboard; every card is described by it. */
	instructions: string;
	pickedUp: (place: KanbanDragPlace) => string;
	moved: (place: KanbanDragPlace) => string;
	dropped: (place: KanbanDragPlace) => string;
	/** The drag was cancelled (Escape, or dropped off the board). */
	cancelled: (place: KanbanDragPlace) => string;
	/** `onMove` vetoed the move. */
	vetoed: (place: KanbanDragPlace) => string;
}

/** What the drag layer hands a card, merged into its board slot. */
export interface KanbanCardDrag {
	ref: (element: HTMLElement | null) => void;
	/** Pointer and touch listeners that start a drag. */
	listeners: Record<string, (event: never) => void> | undefined;
	/** Picked up with the keyboard. */
	grabbed: boolean;
	/** Dragged with the pointer: the card left in place under the overlay. */
	dragging: boolean;
	/** The id of the keyboard instructions. */
	describedBy: string;
}

/** What the drag layer hands the board to render with. */
export interface KanbanDndApi {
	/** The item keys of each column to show — the drag's preview while one runs. */
	arrangement: readonly (readonly string[])[];
	/** Wraps a column, which is a drop target. */
	Column: React.ComponentType<{
		columnId: string;
		children: (column: {
			ref: (element: HTMLElement | null) => void;
			/** The card being moved is in this column. */
			target: boolean;
		}) => React.ReactNode;
	}>;
	/** Wraps a card, which drags and is a drop target. */
	Item: React.ComponentType<{
		itemKey: string;
		columnId: string;
		children: (drag: KanbanCardDrag) => React.ReactNode;
	}>;
	/** Handles a card's keydown; `true` when it was a drag key. */
	onCardKeyDown: (
		position: KanbanPosition,
		event: React.KeyboardEvent<HTMLElement>,
	) => boolean;
}

export interface KanbanDndBoardProps {
	columns: readonly { id: string; title: string }[];
	/** The arrangement the consumer's `columns` describe. */
	committed: readonly (readonly string[])[];
	/** Calls the consumer's `onMove`; `false` is a veto. */
	onMove: (
		itemKey: string,
		from: KanbanPosition,
		to: KanbanPosition,
	) => boolean | undefined;
	/** Moves focus to a card, scrolling a virtualised column to it. */
	focusCard: (position: KanbanPosition, itemKey: string) => void;
	getBoard: () => HTMLElement | null;
	getDirection: () => "ltr" | "rtl";
	labels?: Partial<KanbanDragLabels>;
	/** The card shown under the pointer while dragging. */
	renderOverlay: (itemKey: string) => React.ReactNode;
	children: (api: KanbanDndApi) => React.ReactNode;
}
