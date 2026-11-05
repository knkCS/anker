// DataTable's column widths, laid out by a real browser (#271).
//
// The table is `table-layout: fixed` at `width: 100%`: on its own it shares
// its container's width out equally, so a column narrower than what its cell
// draws lets the cell run into the next column. A column that carries a
// `size` keeps it, the table is never narrower than its columns, and in a
// container too narrow for it the table scrolls sideways inside it.
//
// jsdom lays nothing out, so this file runs in Chromium (vitest browser mode,
// the `layout` project of `vitest.config.ts`) and MEASURES.
import type { ColumnDef } from "@tanstack/react-table";
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Box } from "../../../primitives/layout";
import { Provider } from "../../../primitives/provider";
import { DataTable, type DataTableProps } from "../data-table";

type Row = { id: string; a: string; b: string; c: string };

const ROWS: Row[] = [
	{ id: "1", a: "first", b: "second", c: "third" },
	{ id: "2", a: "x", b: "y", c: "z" },
];

/** Content that is exactly `width` px wide, whatever the column gives it. */
function Fixed({ width, label }: { width: number; label: string }) {
	return (
		<Box data-testid="fixed" w={`${width}px`} overflow="hidden">
			{label}
		</Box>
	);
}

/** A data column whose cells draw `width` px of content, and say so in `size`. */
function sized(id: keyof Row, width: number): ColumnDef<Row, unknown> {
	return {
		id,
		accessorKey: id,
		header: id.toUpperCase(),
		size: width,
		cell: ({ getValue }) => <Fixed width={width} label={String(getValue())} />,
	};
}

/** A trailing actions column: at least `width` px, and the table's remainder. */
const actions = (width: number): ColumnDef<Row, unknown> => ({
	id: "_actions",
	header: "",
	minSize: width,
	cell: () => <Fixed width={width} label="actions" />,
});

const WIDTHS = { a: 220, b: 180, c: 110 } as const;

const SIZED = [
	sized("a", WIDTHS.a),
	sized("b", WIDTHS.b),
	sized("c", WIDTHS.c),
];

let root: Root | undefined;
let host: HTMLDivElement | undefined;

/** Mount the table in a container `containerWidth` px wide. */
async function mount(
	containerWidth: number,
	props: Partial<DataTableProps<Row>> & {
		columns: ColumnDef<Row, unknown>[];
	},
): Promise<HTMLElement> {
	host = document.createElement("div");
	host.style.width = `${containerWidth}px`;
	document.body.appendChild(host);
	root = createRoot(host);
	await act(async () => {
		root?.render(
			<StrictMode>
				<Provider>
					<DataTable data={ROWS} getRowId={(r) => r.id} {...props} />
				</Provider>
			</StrictMode>,
		);
	});
	await expect
		.poll(() => host?.querySelectorAll("tbody tr").length ?? 0)
		.toBe(ROWS.length);
	// Styles settle a frame after the rows mount.
	await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
	return host;
}

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = undefined;
	host = undefined;
});

/** Half a pixel of rounding either way: sub-pixel layout. */
const SLACK = 0.5;

/** The cell's padding, left and right together, as the browser applied it. */
function paddingX(cell: HTMLElement): number {
	const style = getComputedStyle(cell);
	return (
		Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
	);
}

/** The drag handle DataTable injects with `onRowReorder`. */
const DRAG_HANDLE = "button[aria-label^='Reorder row']";

/**
 * What a cell draws at a fixed width: a test's content, DataTable's selection
 * checkbox, and the drag handle, whose 44px touch target once reached past its
 * column (#273).
 */
const MEASURED = `[data-testid='fixed'], [data-scope='checkbox'][data-part='control'], ${DRAG_HANDLE}`;

/** Each fixed-width box drawn outside the cell it is in. */
function overflows(container: HTMLElement): string[] {
	const out: string[] = [];
	for (const cell of container.querySelectorAll<HTMLElement>("th, td")) {
		const box = cell.getBoundingClientRect();
		for (const el of cell.querySelectorAll<HTMLElement>(MEASURED)) {
			const r = el.getBoundingClientRect();
			if (r.left < box.left - SLACK || r.right > box.right + SLACK) {
				out.push(
					`${cell.tagName} "${cell.textContent ?? ""}": ${r.left.toFixed(0)}–${r.right.toFixed(0)} outside ${box.left.toFixed(0)}–${box.right.toFixed(0)}`,
				);
			}
		}
	}
	return out;
}

function headers(container: HTMLElement): HTMLElement[] {
	return [...container.querySelectorAll<HTMLElement>("thead th")];
}

function firstRow(container: HTMLElement): HTMLElement[] {
	return [
		...(container
			.querySelector("tbody tr")
			?.querySelectorAll<HTMLElement>("td") ?? []),
	];
}

function table(container: HTMLElement): HTMLElement {
	const el = container.querySelector("table");
	if (!el) throw new Error("no table");
	return el;
}

/** The box DataTable scrolls the table in. */
function scroller(container: HTMLElement): HTMLElement {
	const el = table(container).parentElement;
	if (!el) throw new Error("no scroller");
	return el;
}

const scrolls = (el: HTMLElement) => el.scrollWidth > el.clientWidth;

describe("DataTable column widths, in a real browser", () => {
	it("keeps every cell inside its column, and scrolls in a container too narrow for it", async () => {
		const container = await mount(320, { columns: SIZED });

		expect(overflows(container)).toEqual([]);
		expect(scrolls(scroller(container))).toBe(true);
		expect(table(container).getBoundingClientRect().width).toBeGreaterThan(320);
	});

	it("gives a header and every cell below it the column's size plus the cell's padding", async () => {
		const container = await mount(320, { columns: SIZED });
		const ths = headers(container);
		const tds = firstRow(container);
		expect(ths.map((th) => th.textContent)).toEqual(["A", "B", "C"]);

		[WIDTHS.a, WIDTHS.b, WIDTHS.c].forEach((width, i) => {
			const th = ths[i];
			const td = tds[i];
			expect(paddingX(td)).toBeGreaterThan(0);
			expect(th.getBoundingClientRect().width).toBeCloseTo(
				width + paddingX(th),
				0,
			);
			expect(td.getBoundingClientRect().width).toBeCloseTo(
				th.getBoundingClientRect().width,
				0,
			);
		});
	});

	it("counts the drag handle and the selection column into the minimum width", async () => {
		const container = await mount(320, {
			columns: SIZED,
			selectable: true,
			onRowReorder: () => {},
		});

		expect(overflows(container)).toEqual([]);
		// The drag-handle column is its handle plus the cell's padding.
		const handleCell = firstRow(container)[0];
		const handle = handleCell.querySelector<HTMLElement>(DRAG_HANDLE);
		if (!handle) throw new Error("no drag handle");
		expect(handleCell.getBoundingClientRect().width).toBeCloseTo(
			handle.getBoundingClientRect().width + paddingX(handleCell),
			0,
		);
		const ths = headers(container);
		// Drag handle, checkbox, then the data columns at their sizes.
		[WIDTHS.a, WIDTHS.b, WIDTHS.c].forEach((width, i) => {
			const th = ths[i + 2];
			expect(th.getBoundingClientRect().width).toBeCloseTo(
				width + paddingX(th),
				0,
			);
		});
		expect(scrolls(scroller(container))).toBe(true);
	});

	it("gives a minSize column at least its minimum in a narrow container, and the remainder in a wide one", async () => {
		const narrow = await mount(320, { columns: [...SIZED, actions(140)] });
		expect(overflows(narrow)).toEqual([]);
		const last = headers(narrow).at(-1) as HTMLElement;
		expect(last.getBoundingClientRect().width).toBeGreaterThanOrEqual(
			140 + paddingX(last) - SLACK,
		);
		act(() => root?.unmount());
		host?.remove();

		const wide = await mount(1200, { columns: [...SIZED, actions(140)] });
		expect(overflows(wide)).toEqual([]);
		expect(scrolls(scroller(wide))).toBe(false);
		const ths = headers(wide);
		// The sized columns keep their widths; the actions column takes the rest.
		[WIDTHS.a, WIDTHS.b, WIDTHS.c].forEach((width, i) => {
			const th = ths[i];
			expect(th.getBoundingClientRect().width).toBeCloseTo(
				width + paddingX(th),
				0,
			);
		});
		expect(table(wide).getBoundingClientRect().width).toBeCloseTo(1200, 0);
	});

	it("does not scroll in a container wide enough for the table", async () => {
		const container = await mount(1200, { columns: SIZED });

		expect(overflows(container)).toEqual([]);
		expect(scrolls(scroller(container))).toBe(false);
		expect(table(container).getBoundingClientRect().width).toBeCloseTo(1200, 0);
	});

	it("leaves a table whose columns carry no width as it was: the container's width, no minimum", async () => {
		const container = await mount(320, {
			columns: [
				{ accessorKey: "a", header: "A" },
				{ accessorKey: "b", header: "B" },
				{ accessorKey: "c", header: "C" },
			],
		});

		expect(getComputedStyle(table(container)).minWidth).toMatch(/^(0px|auto)$/);
		expect(table(container).getBoundingClientRect().width).toBeCloseTo(320, 0);
		expect(scrolls(scroller(container))).toBe(false);
	});
});
