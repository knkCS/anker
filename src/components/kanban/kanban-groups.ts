// Column groups and column tones of a board (#784 in agent-control-plane):
// which run of columns each group spans, checked against the board's
// columns, and the tone each column is drawn in. Pure, so the rules are
// unit-tested without a browser.

/**
 * The status palettes a column (or a group of columns) can be drawn in — its
 * top edge and, with `emphasis`, its header and background. `neutral` is a
 * column with no status meaning.
 */
export const KANBAN_COLUMN_TONES = [
	"neutral",
	"info",
	"warning",
	"success",
	"danger",
] as const;

export type KanbanColumnTone = (typeof KANBAN_COLUMN_TONES)[number];

/** How a column stands out. Only `highlight` — and rarely. */
export type KanbanColumnEmphasis = "highlight";

export interface KanbanColumnGroup {
	/** Stable id of the group. */
	id: string;
	/** The group's title, shown over its columns; also names it for assistive tech. */
	title: string;
	/** The columns the group spans: consecutive columns of the board. */
	columnIds: readonly string[];
	/** The tone of the group's columns that set none of their own. */
	tone?: KanbanColumnTone;
}

/** A valid group, placed over the board's columns `start` to `end - 1`. */
export interface PlacedGroup {
	group: KanbanColumnGroup;
	start: number;
	end: number;
}

/** A run of the board: a group of columns, or one column outside any group. */
export type BoardSegment =
	| { kind: "group"; placed: PlacedGroup }
	| { kind: "column"; index: number };

export interface ResolvedGroups {
	/** The board in order; `null` when no group is valid (no group row). */
	segments: BoardSegment[] | null;
	/** The group each column sits in, by column index. */
	groupOf: (PlacedGroup | undefined)[];
	/** Why a group was ignored, one line each. */
	problems: string[];
}

/**
 * Places each group over the run of columns it names. A group is ignored —
 * and the reason reported — when it names no column, an unknown column, a
 * column twice or a column another group already holds, when its columns are
 * not consecutive, or when its id repeats another group's.
 */
export function resolveGroups(
	columnIds: readonly string[],
	groups: readonly KanbanColumnGroup[] | undefined,
): ResolvedGroups {
	const groupOf: (PlacedGroup | undefined)[] = columnIds.map(() => undefined);
	const problems: string[] = [];
	if (!groups || groups.length === 0) {
		return { segments: null, groupOf, problems };
	}
	const indexOf = new Map(columnIds.map((id, index) => [id, index]));
	const seenGroups = new Set<string>();
	const placed: PlacedGroup[] = [];
	for (const group of groups) {
		const name = `Kanban group "${group.id}"`;
		if (seenGroups.has(group.id)) {
			problems.push(`${name} repeats another group's id; it is ignored.`);
			continue;
		}
		seenGroups.add(group.id);
		if (group.columnIds.length === 0) {
			problems.push(`${name} names no column; it is ignored.`);
			continue;
		}
		const unknown = group.columnIds.filter((id) => !indexOf.has(id));
		if (unknown.length > 0) {
			problems.push(
				`${name} names unknown column(s) ${unknown.map((id) => `"${id}"`).join(", ")}; it is ignored.`,
			);
			continue;
		}
		const indices = group.columnIds.map((id) => indexOf.get(id) as number);
		if (new Set(indices).size !== indices.length) {
			problems.push(`${name} names a column twice; it is ignored.`);
			continue;
		}
		const taken = indices.filter((index) => groupOf[index] != null);
		if (taken.length > 0) {
			problems.push(
				`${name} names column(s) ${taken.map((index) => `"${columnIds[index]}"`).join(", ")} that another group holds; it is ignored.`,
			);
			continue;
		}
		const start = Math.min(...indices);
		const end = Math.max(...indices) + 1;
		if (end - start !== indices.length) {
			problems.push(
				`${name} names columns that are not consecutive on the board; it is ignored.`,
			);
			continue;
		}
		const entry = { group, start, end };
		placed.push(entry);
		for (let index = start; index < end; index++) groupOf[index] = entry;
	}
	if (placed.length === 0) return { segments: null, groupOf, problems };
	const segments: BoardSegment[] = [];
	for (let index = 0; index < columnIds.length; index++) {
		const entry = groupOf[index];
		if (!entry) segments.push({ kind: "column", index });
		else if (entry.start === index)
			segments.push({ kind: "group", placed: entry });
	}
	return { segments, groupOf, problems };
}

/** The tone a column is drawn in: its own, else its group's, else none. */
export function columnTone(
	tone: KanbanColumnTone | undefined,
	emphasis: KanbanColumnEmphasis | undefined,
	group: KanbanColumnGroup | undefined,
): KanbanColumnTone | undefined {
	return tone ?? group?.tone ?? (emphasis ? "warning" : undefined);
}
