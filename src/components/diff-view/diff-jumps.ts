// The `j` / `k` / `n` / `p` jumps of a DiffView (#331), over rendered files
// and virtualised panes (#332).
//
// Files are always rendered, so a file jump reads the DOM. A comment may sit
// in a virtualised pane's rows outside the drawn window: such a pane
// registers a handle listing every comment it holds by row index, and the
// comment jump treats those as targets in reading order — revealing one
// draws its row, then focuses it.

/** Marks the element a file jump focuses: its toggle, or its heading. */
export const FILE_TARGET = "[data-diff-file-focus]";
export const COMMENT_TARGET = "[data-diff-comment]";
/** Marks a virtualised pane. */
export const VIRTUAL_PANE = "[data-diff-virtual]";
/** A drawn row's index in its pane's rows. */
export const ROW_INDEX_ATTR = "data-diff-row-index";

/** A comment in a pane: its row, and its place among the row's comments. */
export interface PaneComment {
	row: number;
	nth: number;
}

export interface VirtualPaneHandle {
	/** Every comment the pane holds, drawn or not, in reading order. */
	comments: () => readonly PaneComment[];
	/** Draws the comment's row if needed, then focuses the comment. */
	reveal: (comment: PaneComment) => void;
}

const panes = new WeakMap<Element, VirtualPaneHandle>();

/** Registers a pane's handle; returns the unregister. */
export function registerVirtualPane(
	pane: Element,
	handle: VirtualPaneHandle,
): () => void {
	panes.set(pane, handle);
	return () => {
		if (panes.get(pane) === handle) panes.delete(pane);
	};
}

const AROUND =
	Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_CONTAINED_BY;

/** 1 when `target` follows `from`, -1 when it precedes, 0 when it is `from`'s own. */
function order(from: Element, target: Element): -1 | 0 | 1 {
	if (target === from) return 0;
	const position = from.compareDocumentPosition(target);
	if ((position & AROUND) !== 0) return 0;
	return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 ? 1 : -1;
}

/**
 * The next (or previous) file target from `from`, skipping the file `from`
 * sits in.
 */
export function findFileTarget(
	root: HTMLElement,
	from: Element,
	direction: 1 | -1,
): HTMLElement | undefined {
	// A file jump counts from the file focus is in, not from its header.
	const origin = from.closest("[data-diff-file]") ?? from;
	const candidates = [
		...root.querySelectorAll<HTMLElement>(FILE_TARGET),
	].filter((target) => order(origin, target) === direction);
	return direction === 1 ? candidates[0] : candidates.at(-1);
}

type CommentTarget =
	| { kind: "dom"; element: HTMLElement }
	| {
			kind: "pane";
			pane: Element;
			handle: VirtualPaneHandle;
			comment: PaneComment;
	  };

/** Where `target` lies relative to `from`, as `order` says. */
function placeOf(from: Element, target: CommentTarget): -1 | 0 | 1 {
	if (target.kind === "dom") {
		return target.element.contains(from) ? 0 : order(from, target.element);
	}
	const { pane, comment } = target;
	if (!pane.contains(from) || pane === from) {
		return pane === from ? 1 : order(from, pane);
	}
	const rowEl = from.closest(`[${ROW_INDEX_ATTR}]`);
	if (!rowEl || !pane.contains(rowEl)) return 1;
	const row = Number(rowEl.getAttribute(ROW_INDEX_ATTR));
	if (comment.row !== row) return comment.row > row ? 1 : -1;
	const own = from.closest(COMMENT_TARGET);
	const nth = own
		? [...rowEl.querySelectorAll(COMMENT_TARGET)].indexOf(own)
		: -1;
	if (comment.nth === nth) return 0;
	return comment.nth > nth ? 1 : -1;
}

/**
 * The next (or previous) comment from `from` in reading order, drawn or
 * not, as a function that focuses it. A collapsed file's comments are not
 * rendered, so a jump passes over them.
 */
export function findCommentJump(
	root: HTMLElement,
	from: Element,
	direction: 1 | -1,
): (() => void) | undefined {
	const targets: CommentTarget[] = [];
	const inPane = (element: Element) => {
		const pane = element.parentElement?.closest(VIRTUAL_PANE);
		return pane != null && panes.has(pane);
	};
	for (const element of root.querySelectorAll<HTMLElement>(
		`${COMMENT_TARGET}, ${VIRTUAL_PANE}`,
	)) {
		const handle = panes.get(element);
		if (handle) {
			for (const comment of handle.comments()) {
				targets.push({ kind: "pane", pane: element, handle, comment });
			}
		} else if (element.matches(COMMENT_TARGET) && !inPane(element)) {
			targets.push({ kind: "dom", element });
		}
	}
	const candidates = targets.filter((t) => placeOf(from, t) === direction);
	const next = direction === 1 ? candidates[0] : candidates.at(-1);
	if (!next) return undefined;
	return next.kind === "dom"
		? () => next.element.focus()
		: () => next.handle.reveal(next.comment);
}
