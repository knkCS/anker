// A value wider than its column, laid out by a real browser (#361).
//
// A column's `size` fixes the cell's width, but a fixed width does not keep
// what the cell draws inside it: a value wider than the column painted on
// over the next column, and two values overlapped (seen in
// knkCS/agent-control-plane's tables). DataTable now clips every cell at its
// edge, whatever renders it, and TruncatedTextCell ends a value it cannot fit
// in "…" and shows the whole value on hover.
//
// jsdom lays nothing out and zag's tooltip never opens there, so this file
// runs in Chromium (the `layout` project of `vitest.config.ts`). It measures
// what is VISIBLE: an element's box cut by every ancestor that clips it.
import type { ColumnDef } from "@tanstack/react-table";
import { userEvent } from "@vitest/browser/context";
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Box } from "../../../primitives/layout";
import { Provider } from "../../../primitives/provider";
import { TruncatedTextCell } from "../cells/truncated-text-cell";
import { DataTable } from "../data-table";

type Row = { id: string; value: string; next: string };

const LONG =
	"agent-control-plane/packages/acp-ui/src/screens/a-very-long-path-that-cannot-fit.tsx";

/** The narrow column's content width, in px. */
const NARROW = 120;

let root: Root | undefined;
let host: HTMLDivElement | undefined;

const frame = () =>
	new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

/**
 * Mount a table whose first column is `NARROW` px and renders `cell`, and
 * whose second column shows `next`.
 */
async function mount(
	cell: ColumnDef<Row, unknown>["cell"],
	rows: Row[] = [{ id: "1", value: LONG, next: "next" }],
	header: ColumnDef<Row, unknown>["header"] = "Value",
): Promise<HTMLElement> {
	const columns: ColumnDef<Row, unknown>[] = [
		{ id: "value", accessorKey: "value", header, size: NARROW, cell },
		{ id: "next", accessorKey: "next", header: "Next", size: 120 },
		// A `minSize` column takes the table's remainder, so the sized columns
		// keep exactly their sizes in the wide container: without it
		// `table-layout: fixed` shares the spare width out over them.
		{ id: "rest", header: "", minSize: 40, cell: () => null },
	];
	host = document.createElement("div");
	host.style.width = "800px";
	document.body.appendChild(host);
	root = createRoot(host);
	await act(async () => {
		root?.render(
			<StrictMode>
				<Provider>
					<DataTable columns={columns} data={rows} getRowId={(r) => r.id} />
				</Provider>
			</StrictMode>,
		);
	});
	await expect
		.poll(() => host?.querySelectorAll("tbody tr").length ?? 0)
		.toBe(rows.length);
	await frame();
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

/** The part of `el`'s box left visible by every ancestor that clips it. */
function visibleRect(el: HTMLElement): { left: number; right: number } {
	const r = el.getBoundingClientRect();
	let left = r.left;
	let right = r.right;
	for (let a = el.parentElement; a; a = a.parentElement) {
		if (getComputedStyle(a).overflowX === "visible") continue;
		const box = a.getBoundingClientRect();
		left = Math.max(left, box.left);
		right = Math.min(right, box.right);
	}
	return { left, right };
}

function cells(container: HTMLElement): HTMLElement[] {
	return [
		...(container
			.querySelector("tbody tr")
			?.querySelectorAll<HTMLElement>("td") ?? []),
	];
}

function paddingX(cell: HTMLElement): number {
	const style = getComputedStyle(cell);
	return (
		Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
	);
}

/** `el` is drawn wider than `cell`, and nothing of it shows outside `cell`. */
function expectClippedTo(el: HTMLElement, cell: HTMLElement) {
	const box = cell.getBoundingClientRect();
	expect(el.getBoundingClientRect().right).toBeGreaterThan(box.right);
	const seen = visibleRect(el);
	expect(seen.left).toBeGreaterThanOrEqual(box.left - SLACK);
	expect(seen.right).toBeLessThanOrEqual(box.right + SLACK);
}

/** The column is its `size` plus the padding: the content did not widen it. */
function expectColumnWidth(cell: HTMLElement) {
	expect(cell.getBoundingClientRect().width).toBeCloseTo(
		NARROW + paddingX(cell),
		0,
	);
}

/** The value's text element a TruncatedTextCell renders. */
function valueText(cell: HTMLElement, text: string): HTMLElement {
	const el = [...cell.querySelectorAll<HTMLElement>("*")].find(
		(e) => e.childElementCount === 0 && e.textContent === text,
	);
	if (!el) throw new Error(`no element reading "${text}"`);
	return el;
}

/** The tooltip's content, wherever the portal put it, or `null`. */
function tooltip(): HTMLElement | null {
	return document.querySelector<HTMLElement>(
		"[data-scope='tooltip'][data-part='content']",
	);
}

/** Hovering `el` opens anker's tooltip reading `whole`. */
async function expectTooltipOnHover(el: HTMLElement, whole: string) {
	await userEvent.hover(el);
	await expect
		.poll(() => tooltip()?.textContent, { timeout: 3000 })
		.toBe(whole);
}

/** After zag's open and close delays, no open tooltip reads `text`. */
async function expectNoOpenTooltip(text: string) {
	await new Promise((resolve) => setTimeout(resolve, 800));
	const open = [
		...document.querySelectorAll<HTMLElement>(
			"[data-scope='tooltip'][data-part='content']",
		),
	].filter((el) => el.getAttribute("data-state") === "open");
	expect(open.map((el) => el.textContent)).not.toContain(text);
}

describe("DataTable keeps a cell's content inside its column, in a real browser", () => {
	it("clips custom content wider than its column at the column's edge", async () => {
		const container = await mount(({ getValue }) => (
			// A box that knows nothing of its column and does not clip itself.
			<Box data-testid="custom" w="400px" bg="bg-muted">
				{String(getValue())}
			</Box>
		));
		const [cell, next] = cells(container);
		const custom = container.querySelector<HTMLElement>(
			"[data-testid='custom']",
		);
		if (!custom) throw new Error("no custom content");

		expectColumnWidth(cell);
		expectClippedTo(custom, cell);
		expect(visibleRect(custom).right).toBeLessThanOrEqual(
			next.getBoundingClientRect().left + SLACK,
		);
	});

	it("clips raw text wider than its column", async () => {
		const container = await mount(({ getValue }) => (
			<span data-testid="raw">{String(getValue())}</span>
		));
		const [cell] = cells(container);
		const raw = container.querySelector<HTMLElement>("[data-testid='raw']");
		if (!raw) throw new Error("no raw text");

		expectColumnWidth(cell);
		expectClippedTo(raw, cell);
	});

	it("clips a header wider than its column at the column's edge", async () => {
		const container = await mount(
			() => "x",
			undefined,
			() => (
				<Box data-testid="header" w="400px">
					{LONG}
				</Box>
			),
		);
		const th = container.querySelector<HTMLElement>("thead th");
		const header = container.querySelector<HTMLElement>(
			"[data-testid='header']",
		);
		if (!th || !header) throw new Error("no header");

		expectClippedTo(header, th);
		// The label gives way to the sort arrow, which stays whole in the column.
		const arrow = th.querySelector<SVGElement>("svg");
		if (!arrow) throw new Error("no sort arrow");
		const a = arrow.getBoundingClientRect();
		const box = th.getBoundingClientRect();
		expect(a.width).toBeGreaterThan(0);
		expect(a.left).toBeGreaterThanOrEqual(box.left - SLACK);
		expect(a.right).toBeLessThanOrEqual(box.right + SLACK);
	});

	it("TruncatedTextCell ends a value wider than its column in an ellipsis, inside the column", async () => {
		const container = await mount(({ getValue }) => (
			<TruncatedTextCell value={String(getValue())} />
		));
		const [cell] = cells(container);
		const text = valueText(cell, LONG);

		expectColumnWidth(cell);
		// The text box itself fits the cell's content box and shortens what it
		// cannot show with "…".
		const box = cell.getBoundingClientRect();
		const r = text.getBoundingClientRect();
		expect(r.left).toBeGreaterThanOrEqual(box.left - SLACK);
		expect(r.right).toBeLessThanOrEqual(box.right + SLACK);
		expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
		expect(getComputedStyle(text).textOverflow).toBe("ellipsis");
		expect(getComputedStyle(text).whiteSpace).toBe("nowrap");
	});

	it("TruncatedTextCell shows the whole value on hover when it is shortened", async () => {
		const container = await mount(({ getValue }) => (
			<TruncatedTextCell value={String(getValue())} />
		));
		const text = valueText(cells(container)[0], LONG);

		await expectTooltipOnHover(text, LONG);
	});

	it("TruncatedTextCell with subText ends its value in an ellipsis and shows it whole on hover", async () => {
		const container = await mount(({ getValue }) => (
			<TruncatedTextCell value={String(getValue())} subText="Created today" />
		));
		const [cell] = cells(container);
		const text = valueText(cell, LONG);

		expectColumnWidth(cell);
		expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(
			cell.getBoundingClientRect().right + SLACK,
		);
		expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
		expect(getComputedStyle(text).textOverflow).toBe("ellipsis");

		await expectTooltipOnHover(text, LONG);
	});

	it("TruncatedTextCell shows the whole value on hover when maxLength shortened it", async () => {
		const container = await mount(() => (
			<TruncatedTextCell value="abcdefghij" maxLength={4} />
		));
		const text = valueText(cells(container)[0], "abcd…");

		await expectTooltipOnHover(text, "abcdefghij");
	});

	it("TruncatedTextCell shows no tooltip for a value that fits", async () => {
		const container = await mount(() => <TruncatedTextCell value="short" />);
		const text = valueText(cells(container)[0], "short");

		await userEvent.hover(text);
		await expectNoOpenTooltip("short");
	});

	it("TruncatedTextCell shows no tooltip for a value that fits right after one that is cut", async () => {
		// zag opens a tooltip at once, with no delay and past a controlled
		// `open`, while another one is still visible: the path a pointer takes
		// down a column of long and short values.
		const container = await mount(
			({ getValue }) => <TruncatedTextCell value={String(getValue())} />,
			[
				{ id: "1", value: LONG, next: "next" },
				{ id: "2", value: "short", next: "next" },
			],
		);
		const rows = container.querySelectorAll<HTMLElement>("tbody tr");
		const cut = valueText(rows[0].querySelector("td") as HTMLElement, LONG);
		const fits = valueText(rows[1].querySelector("td") as HTMLElement, "short");

		await expectTooltipOnHover(cut, LONG);
		await userEvent.hover(fits);
		await expectNoOpenTooltip("short");
	});
});
