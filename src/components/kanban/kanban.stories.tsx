import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Plus } from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../atoms/button";
import { StatusBadge } from "../../atoms/status-badge";
import { Avatar } from "../../primitives/avatar";
import { DarkMode, LightMode } from "../../primitives/color-mode";
import { Box, Grid } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import type { KanbanColumn, KanbanProps } from "./kanban";
import { Kanban } from "./kanban";
import type { KanbanCardTone } from "./kanban-card";
import type { KanbanMove } from "./kanban-dnd-types";

/**
 * A board: columns with a title, a count and an action slot; cards rendered
 * with `Kanban.Card` and its building blocks. Click a card, then use the
 * arrow keys to move between cards and columns and Enter to open one.
 * Read-only unless `onMove` is passed — see "Editable" for drag and drop.
 * Toggle the toolbar theme, or open "Light and dark", to see the tones in
 * both modes.
 */
const meta = {
	title: "Components/Kanban",
	component: Kanban,
	parameters: { layout: "padded" },
} satisfies Meta<typeof Kanban>;

export default meta;
type Story = StoryObj<typeof meta>;

interface Task {
	id: string;
	title: string;
	owner: string;
	tone?: KanbanCardTone;
	badge?: { label: string; tone: "warning" | "info" | "success" | "neutral" };
}

const COLUMNS: KanbanColumn<Task>[] = [
	{
		id: "awaiting",
		title: "Awaiting approval",
		items: [
			{
				id: "41",
				title: "Approve the migration plan",
				owner: "Mara Lind",
				tone: "quiet",
			},
		],
	},
	{
		id: "ready",
		title: "Ready",
		items: [
			{ id: "42", title: "Write the parser for spec files", owner: "Ola Berg" },
			{ id: "43", title: "Add retry to the webhook sender", owner: "Kai Moe" },
		],
		action: (
			<IconButton aria-label="Add a task to Ready" size="xs" variant="ghost">
				<Plus />
			</IconButton>
		),
	},
	{
		id: "in-progress",
		title: "In progress",
		items: [
			{
				id: "44",
				title: "Render the board in the Spec view",
				owner: "Ola Berg",
			},
		],
	},
	{
		id: "needs-you",
		title: "Needs you",
		items: [
			{
				id: "45",
				title: "Answer the agent's question about auth scopes",
				owner: "Mara Lind",
				tone: "attention",
				badge: { label: "Needs you", tone: "warning" },
			},
		],
	},
	{ id: "review", title: "In review", items: [] },
	{
		id: "done",
		title: "Done",
		items: [
			{
				id: "40",
				title: "Scaffold the repository",
				owner: "Kai Moe",
				badge: { label: "Merged", tone: "success" },
			},
		],
	},
];

function TaskCard({ task }: { task: Task }) {
	return (
		<Kanban.Card tone={task.tone} href={`#task-${task.id}`}>
			<Kanban.CardMeta>
				<Text as="span" fontFamily="mono">
					#{task.id}
				</Text>
				<Kanban.CardAvatar>
					<Avatar name={task.owner} size="2xs" />
				</Kanban.CardAvatar>
			</Kanban.CardMeta>
			<Kanban.CardTitle>{task.title}</Kanban.CardTitle>
			{task.badge ? (
				<Kanban.CardBadges>
					<StatusBadge label={task.badge.label} tone={task.badge.tone} />
				</Kanban.CardBadges>
			) : null}
		</Kanban.Card>
	);
}

const boardArgs: KanbanProps<Task> = {
	"aria-label": "Spec board",
	columns: COLUMNS,
	getItemKey: (task) => task.id,
	renderCard: (task) => <TaskCard task={task} />,
};

// `Kanban` is generic; Storybook's args type is `KanbanProps<unknown>`.
const args = boardArgs as unknown as Story["args"];

export const Default: Story = { args };

/** Default, quiet (nobody needs to act) and attention (someone must act). */
export const Tones: Story = {
	args,
	render: () => (
		<Grid templateColumns="repeat(3, 16rem)" gap="3">
			<Kanban.Card>
				<Kanban.CardMeta>default</Kanban.CardMeta>
				<Kanban.CardTitle>Work that just happens</Kanban.CardTitle>
			</Kanban.Card>
			<Kanban.Card tone="quiet">
				<Kanban.CardMeta>quiet</Kanban.CardMeta>
				<Kanban.CardTitle>Waiting on nobody</Kanban.CardTitle>
			</Kanban.Card>
			<Kanban.Card tone="attention">
				<Kanban.CardMeta>attention</Kanban.CardMeta>
				<Kanban.CardTitle>Someone must act</Kanban.CardTitle>
			</Kanban.Card>
		</Grid>
	),
};

/** The board and its tones in light and dark mode side by side. */
export const LightAndDark: Story = {
	args,
	parameters: { layout: "fullscreen" },
	render: () => (
		<Grid templateColumns="1fr" gap="0">
			<LightMode>
				<Box bg="bg-canvas" p="6">
					<Kanban {...boardArgs} />
				</Box>
			</LightMode>
			<DarkMode>
				<Box bg="bg-canvas" p="6">
					<Kanban {...boardArgs} />
				</Box>
			</DarkMode>
		</Grid>
	),
};

const openTask = fn();

/** Cards as buttons: `onClick` instead of `href` (see the Actions panel). */
export const ButtonCards: Story = {
	args: {
		...boardArgs,
		renderCard: (task: Task) => (
			<Kanban.Card tone={task.tone} onClick={() => openTask(task.id)}>
				<Kanban.CardMeta>#{task.id}</Kanban.CardMeta>
				<Kanban.CardTitle>{task.title}</Kanban.CardTitle>
			</Kanban.Card>
		),
	} as unknown as Story["args"],
};

/** `collapseEmptyColumns` draws empty columns as a narrow strip. */
export const CollapsedEmptyColumns: Story = {
	args: {
		...boardArgs,
		collapseEmptyColumns: true,
	} as unknown as Story["args"],
};

/** On a narrow screen the board scrolls sideways instead of squeezing. */
export const NarrowScreen: Story = {
	args,
	render: () => (
		<Box maxW="360px" borderWidth="1px" borderColor="border" p="2">
			<Kanban {...boardArgs} />
		</Box>
	),
};

/** No column has a card: the empty-board state. */
export const EmptyBoard: Story = {
	args: {
		...boardArgs,
		columns: COLUMNS.map((column) => ({ ...column, items: [] })),
	} as unknown as Story["args"],
};

/** `emptyState={false}` keeps empty columns on screen, each with its state. */
export const EmptyColumns: Story = {
	args: {
		...boardArgs,
		columns: COLUMNS.map((column) => ({ ...column, items: [] })),
		emptyState: false,
	} as unknown as Story["args"],
};

const OWNERS = ["Ola Berg", "Kai Moe", "Mara Lind"];
const longColumn = (
	id: string,
	title: string,
	n: number,
): KanbanColumn<Task> => ({
	id,
	title,
	items: Array.from({ length: n }, (_, i) => ({
		id: `${id}-${i + 1}`,
		title:
			i % 3 === 0
				? `Backlog item ${i + 1} with a title long enough to wrap onto a second line`
				: `Backlog item ${i + 1}`,
		owner: OWNERS[i % OWNERS.length],
		tone: i % 17 === 0 ? "attention" : i % 5 === 0 ? "quiet" : undefined,
	})),
});

const LONG_COLUMNS: KanbanColumn<Task>[] = [
	COLUMNS[1],
	longColumn("backlog", "Backlog", 1000),
	longColumn("done-long", "Done", 400),
];

const longArgs: KanbanProps<Task> = {
	...boardArgs,
	columns: LONG_COLUMNS,
	columnMaxHeight: "32rem",
};

/**
 * Columns with more than `virtualizeAbove` cards (default 100) scroll within
 * `columnMaxHeight` and render only the cards in view. Focus a card and hold
 * ArrowDown, or press End, to reach card 1,000; ArrowLeft / ArrowRight keep
 * the row across long columns.
 */
export const LongColumns: Story = {
	args: longArgs as unknown as Story["args"],
};

/** Long, virtualised columns in light and dark mode side by side. */
export const LongColumnsLightAndDark: Story = {
	args: longArgs as unknown as Story["args"],
	parameters: { layout: "fullscreen" },
	render: () => (
		<Grid templateColumns="1fr" gap="0">
			<LightMode>
				<Box bg="bg-canvas" p="6">
					<Kanban {...longArgs} columnMaxHeight="20rem" />
				</Box>
			</LightMode>
			<DarkMode>
				<Box bg="bg-canvas" p="6">
					<Kanban {...longArgs} columnMaxHeight="20rem" />
				</Box>
			</DarkMode>
		</Grid>
	),
};

const moved = fn();

/** Applies a move to the columns: out of `from`, into `to` at its index. */
function applyMove<T>(columns: KanbanColumn<T>[], move: KanbanMove<T>) {
	const next = columns.map((column) => ({
		...column,
		items: [...column.items],
	}));
	const from = next.find((column) => column.id === move.from.columnId);
	const to = next.find((column) => column.id === move.to.columnId);
	if (!from || !to) return columns;
	const [item] = from.items.splice(move.from.index, 1);
	to.items.splice(move.to.index, 0, item);
	return next;
}

/**
 * The consumer's side of an editable board: it owns the columns, applies an
 * accepted move, and vetoes one by returning `false` — here, nothing leaves
 * Done, so a card dragged out of it snaps back.
 */
function EditableBoard({
	initial = COLUMNS,
	...rest
}: { initial?: KanbanColumn<Task>[] } & Partial<KanbanProps<Task>>) {
	const [columns, setColumns] = useState(initial);
	return (
		<Kanban
			{...boardArgs}
			{...rest}
			columns={columns}
			onMove={(move) => {
				moved(move);
				if (
					move.from.columnId.startsWith("done") &&
					move.to.columnId !== move.from.columnId
				) {
					return false;
				}
				setColumns((current) => applyMove(current, move));
			}}
		/>
	);
}

/**
 * `onMove` makes the board editable. Drag a card with the mouse (or press
 * and hold on touch) between and within columns. With the keyboard, focus a
 * card and press Space to pick it up, the arrow keys to move it, Space or
 * Enter to drop it, Escape to cancel. Dragging a card out of Done is vetoed
 * and snaps back (see the Actions panel for each `onMove`).
 */
export const Editable: Story = {
	args,
	render: () => <EditableBoard />,
};

/** An editable board in light and dark mode side by side. */
export const EditableLightAndDark: Story = {
	args,
	parameters: { layout: "fullscreen" },
	render: () => (
		<Grid templateColumns="1fr" gap="0">
			<LightMode>
				<Box bg="bg-canvas" p="6">
					<EditableBoard />
				</Box>
			</LightMode>
			<DarkMode>
				<Box bg="bg-canvas" p="6">
					<EditableBoard />
				</Box>
			</DarkMode>
		</Grid>
	),
};

/**
 * Drag and drop over long, virtualised columns: a column scrolls while a
 * card is dragged near its edge, and the keyboard reaches every place —
 * pick a card up and press End to move it to the bottom of the Backlog.
 */
export const EditableLongColumns: Story = {
	args: longArgs as unknown as Story["args"],
	render: () => (
		<EditableBoard initial={LONG_COLUMNS} columnMaxHeight="32rem" />
	),
};
