import type {
	Announcements,
	ScreenReaderInstructions,
	UniqueIdentifier,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ColumnDef } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import type React from "react";
import { createContext, useContext, useMemo } from "react";
import { IconButton } from "../../atoms/button";
import { Box } from "../../primitives/layout";
import { Table } from "../../primitives/table";

/** Column id of the drag-handle column injected when `onRowReorder` is set. */
export const REORDER_COLUMN_ID = "_reorder";

/** A rendered row, in visible order, paired with its index into `data`. */
export interface ReorderableRow {
	id: UniqueIdentifier;
	index: number;
}

/**
 * 1-based position of a row in the visible order — what a person sees and what
 * a screen reader is told. The single source for both the handle labels and the
 * live-region announcements, so the two can never disagree.
 */
export function rowPosition(
	rows: readonly { id: UniqueIdentifier }[],
	id: UniqueIdentifier,
): number {
	return rows.findIndex((row) => row.id === id) + 1;
}

/**
 * Translates a dnd-kit drag result into the `(fromIndex, toIndex)` pair that
 * `onRowReorder` reports. Both indices address the consumer's `data` array —
 * which is the visible order too, because a manually ordered table is not also
 * sorted (see the prop docs).
 *
 * Returns `null` when the drag is a no-op: no drop target, an unknown row, or
 * a row dropped on itself.
 */
export function resolveRowReorder(
	rows: ReorderableRow[],
	activeId: UniqueIdentifier,
	overId: UniqueIdentifier | null | undefined,
): { fromIndex: number; toIndex: number } | null {
	if (overId == null || activeId === overId) return null;

	const from = rows.find((row) => row.id === activeId);
	const to = rows.find((row) => row.id === overId);
	if (!from || !to) return null;

	return { fromIndex: from.index, toIndex: to.index };
}

/** Screen-reader instructions attached to every drag handle. */
export const reorderScreenReaderInstructions: ScreenReaderInstructions = {
	draggable:
		"To reorder a row, press space or enter on its drag handle. " +
		"While dragging, use the arrow keys to move the row. " +
		"Press space or enter again to drop it, or escape to cancel.",
};

/**
 * Live-region announcements for a row reorder, phrased in 1-based visible
 * positions because that is what a screen-reader user perceives.
 */
export function buildReorderAnnouncements(
	rows: readonly ReorderableRow[],
): Announcements {
	const total = String(rows.length);
	// A row that is no longer rendered has no position to announce; saying
	// nothing beats announcing "Row 0".
	const at = (id: UniqueIdentifier): string | undefined => {
		const position = rowPosition(rows, id);
		return position === 0 ? undefined : String(position);
	};
	const cancelled = (activeId: UniqueIdentifier) => {
		const from = at(activeId);
		return from === undefined
			? undefined
			: `Reordering cancelled. Row ${from} returned to its original position.`;
	};

	return {
		onDragStart: ({ active }) => {
			const from = at(active.id);
			return from === undefined
				? undefined
				: `Picked up row ${from} of ${total}. Use the arrow keys to move it, space to drop it, escape to cancel.`;
		},
		onDragOver: ({ active, over }) => {
			if (!over) return undefined;
			const from = at(active.id);
			const to = at(over.id);
			return from === undefined || to === undefined
				? undefined
				: `Row ${from} moved to position ${to} of ${total}.`;
		},
		onDragEnd: ({ active, over }) => {
			if (!over) return cancelled(active.id);
			const to = at(over.id);
			if (to === undefined) return undefined;
			// Dropped where it started — say so rather than imply a move.
			return active.id === over.id
				? `Row returned to position ${to} of ${total}.`
				: `Row dropped at position ${to} of ${total}.`;
		},
		onDragCancel: ({ active }) => cancelled(active.id),
	};
}

type Sortable = ReturnType<typeof useSortable>;

interface RowDragHandleValue {
	attributes: Sortable["attributes"];
	listeners: Sortable["listeners"];
	setActivatorNodeRef: Sortable["setActivatorNodeRef"];
}

const RowDragHandleContext = createContext<RowDragHandleValue | null>(null);

export interface RowDragHandleProps {
	/** Accessible name, e.g. `Reorder row 2`. */
	label: string;
}

/**
 * The grab affordance rendered in the injected handle column. It reads the
 * sortable wiring from the row it sits in, so it stays a plain button here.
 */
export const RowDragHandle: React.FC<RowDragHandleProps> = ({ label }) => {
	const sortable = useContext(RowDragHandleContext);

	return (
		<IconButton
			aria-label={label}
			size="sm"
			variant="ghost"
			colorPalette="gray"
			cursor="grab"
			// Touch-target minimum (CLAUDE.md accessibility conventions).
			minWidth="44px"
			minHeight="44px"
			ref={sortable?.setActivatorNodeRef}
			// A handle inside a clickable row must not also trigger onRowClick.
			onClick={(event) => {
				event.stopPropagation();
			}}
			{...sortable?.attributes}
			{...sortable?.listeners}
		>
			<GripVertical size={16} aria-hidden="true" />
		</IconButton>
	);
};
RowDragHandle.displayName = "RowDragHandle";

export interface SortableTableRowProps
	extends Omit<React.ComponentProps<typeof Table.Row>, "id"> {
	/** The TanStack row id; must match the ids given to `SortableContext`. */
	id: UniqueIdentifier;
}

/**
 * A `Table.Row` that participates in the sortable list. It publishes its drag
 * listeners on context so the handle cell — rendered by TanStack, several
 * levels down — can pick them up without prop drilling.
 */
export const SortableTableRow: React.FC<SortableTableRowProps> = ({
	id,
	children,
	...rowProps
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const value = useMemo<RowDragHandleValue>(
		() => ({ attributes, listeners, setActivatorNodeRef }),
		[attributes, listeners, setActivatorNodeRef],
	);

	return (
		<RowDragHandleContext.Provider value={value}>
			<Table.Row
				ref={setNodeRef}
				data-dragging={isDragging || undefined}
				style={{
					transform: CSS.Transform.toString(transform),
					transition,
					...(isDragging ? { position: "relative", zIndex: 1 } : {}),
				}}
				{...rowProps}
			>
				{children}
			</Table.Row>
		</RowDragHandleContext.Provider>
	);
};
SortableTableRow.displayName = "SortableTableRow";

/** The drag-handle column injected at the start of the table. */
export function createRowReorderColumn<
	T extends Record<string, unknown>,
>(): ColumnDef<T, unknown> {
	return {
		id: REORDER_COLUMN_ID,
		size: 52,
		minSize: 52,
		maxSize: 52,
		enableSorting: false,
		header: () => <Box srOnly>Reorder</Box>,
		cell: ({ row, table }) => (
			<RowDragHandle
				label={`Reorder row ${String(rowPosition(table.getRowModel().rows, row.id))}`}
			/>
		),
	};
}
