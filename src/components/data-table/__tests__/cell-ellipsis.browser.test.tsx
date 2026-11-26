// A cut value in SlugCell, CodeCell and TruncatedTextCell's subText (#369).
//
// #361 made TruncatedTextCell's main value end in "…" at its column's edge
// and show whole on hover. The other text anker's cells draw was still cut
// hard at the edge, with no sign that it was cut and no way to read it whole
// (found by knkCS/agent-control-plane's Spec Verification): a repository
// under a Spec title, an RPC's request type, a source slug. Each now behaves
// like the main value.
//
// jsdom lays nothing out and zag's tooltip never opens there, so this file
// runs in Chromium (the `layout` project of `vitest.config.ts`).
import type { ColumnDef } from "@tanstack/react-table";
import { userEvent } from "@vitest/browser/context";
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Provider } from "../../../primitives/provider";
import { CodeCell } from "../cells/code-cell";
import { SlugCell } from "../cells/slug-cell";
import { TruncatedTextCell } from "../cells/truncated-text-cell";
import { DataTable } from "../data-table";

type Row = { id: string; value: string };

const LONG_REPO = `acme/${"y".repeat(120)}`;
const LONG_TYPE = "acme.tokens.v1.ListTokensResponseWithAVeryLongName";
const LONG_SLUG = "docs/adr/0026-user-stories-are-repo-docs-written-on-pass.md";

/** The narrow column's content width, in px. */
const NARROW = 120;

let root: Root | undefined;
let host: HTMLDivElement | undefined;

const frame = () =>
	new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

/** Mount a table whose first column is `NARROW` px and renders `cell`. */
async function mount(
	cell: ColumnDef<Row, unknown>["cell"],
	rows: Row[],
): Promise<HTMLElement> {
	const columns: ColumnDef<Row, unknown>[] = [
		{ id: "value", accessorKey: "value", header: "Value", size: NARROW, cell },
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

function firstCell(container: HTMLElement, row = 0): HTMLElement {
	const td = container
		.querySelectorAll<HTMLElement>("tbody tr")
		[row]?.querySelector<HTMLElement>("td");
	if (!td) throw new Error("no cell");
	return td;
}

/** The innermost element of `cell` reading `text`. */
function textElement(cell: HTMLElement, text: string): HTMLElement {
	const el = [...cell.querySelectorAll<HTMLElement>("*")].find(
		(e) => e.childElementCount === 0 && e.textContent === text,
	);
	if (!el) throw new Error(`no element reading "${text}"`);
	return el;
}

/** `el` stays inside `cell`, holds more than it shows, and ends in "…". */
function expectEllipsisInside(el: HTMLElement, cell: HTMLElement) {
	const box = cell.getBoundingClientRect();
	const r = el.getBoundingClientRect();
	expect(r.left).toBeGreaterThanOrEqual(box.left - SLACK);
	expect(r.right).toBeLessThanOrEqual(box.right + SLACK);
	expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
	const style = getComputedStyle(el);
	expect(style.textOverflow).toBe("ellipsis");
	expect(style.whiteSpace).toBe("nowrap");
	expect(style.overflowX).toBe("hidden");
}

function tooltip(): HTMLElement | null {
	return document.querySelector<HTMLElement>(
		"[data-scope='tooltip'][data-part='content'][data-state='open']",
	);
}

async function expectTooltipOnHover(el: HTMLElement, whole: string) {
	await userEvent.hover(el);
	await expect
		.poll(() => tooltip()?.textContent, { timeout: 3000 })
		.toBe(whole);
}

async function expectNoOpenTooltip(text: string) {
	await new Promise((resolve) => setTimeout(resolve, 800));
	const open = [
		...document.querySelectorAll<HTMLElement>(
			"[data-scope='tooltip'][data-part='content']",
		),
	].filter((el) => el.getAttribute("data-state") === "open");
	expect(open.map((el) => el.textContent)).not.toContain(text);
}

describe("anker's cells end a cut value in an ellipsis and show it whole on hover", () => {
	it("TruncatedTextCell's subText wider than its column ends in an ellipsis and shows whole on hover", async () => {
		const container = await mount(
			() => <TruncatedTextCell value="Spec title" subText={LONG_REPO} />,
			[{ id: "1", value: "x" }],
		);
		const cell = firstCell(container);
		const sub = textElement(cell, LONG_REPO);

		expectEllipsisInside(sub, cell);
		await expectTooltipOnHover(sub, LONG_REPO);
	});

	it("TruncatedTextCell's subText that fits shows no tooltip", async () => {
		const container = await mount(
			() => <TruncatedTextCell value="Spec title" subText="acme/web" />,
			[{ id: "1", value: "x" }],
		);
		await userEvent.hover(textElement(firstCell(container), "acme/web"));
		await expectNoOpenTooltip("acme/web");
	});

	it("SlugCell wider than its column ends in an ellipsis and shows whole on hover", async () => {
		const container = await mount(
			({ getValue }) => <SlugCell value={String(getValue())} />,
			[{ id: "1", value: LONG_SLUG }],
		);
		const cell = firstCell(container);
		const slug = textElement(cell, LONG_SLUG);

		expectEllipsisInside(slug, cell);
		await expectTooltipOnHover(slug, LONG_SLUG);
	});

	it("SlugCell that fits shows no tooltip", async () => {
		const container = await mount(
			({ getValue }) => <SlugCell value={String(getValue())} />,
			[{ id: "1", value: "adr" }],
		);
		await userEvent.hover(textElement(firstCell(container), "adr"));
		await expectNoOpenTooltip("adr");
	});

	it("CodeCell wider than its column ends in an ellipsis and shows whole on hover, with no native title", async () => {
		const container = await mount(
			({ getValue }) => <CodeCell value={String(getValue())} />,
			[{ id: "1", value: LONG_TYPE }],
		);
		const cell = firstCell(container);
		const code = textElement(cell, LONG_TYPE);

		expectEllipsisInside(code, cell);
		expect(cell.querySelector("[title]")).toBeNull();
		await expectTooltipOnHover(code, LONG_TYPE);
	});

	it("CodeCell shows the whole value on hover when maxLength shortened it", async () => {
		const container = await mount(
			({ getValue }) => <CodeCell value={String(getValue())} maxLength={4} />,
			[{ id: "1", value: "abcdefghij" }],
		);
		await expectTooltipOnHover(
			textElement(firstCell(container), "abcd…"),
			"abcdefghij",
		);
	});

	it("CodeCell that fits shows no tooltip after one that is cut", async () => {
		const container = await mount(
			({ getValue }) => <CodeCell value={String(getValue())} />,
			[
				{ id: "1", value: LONG_TYPE },
				{ id: "2", value: "Ok" },
			],
		);
		await expectTooltipOnHover(
			textElement(firstCell(container, 0), LONG_TYPE),
			LONG_TYPE,
		);
		await userEvent.hover(textElement(firstCell(container, 1), "Ok"));
		await expectNoOpenTooltip("Ok");
	});
});
