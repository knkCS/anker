// IconSearch laid out by a real browser (#638 in knkCS/contenthub).
//
// jsdom lays nothing out and zag's tooltip never opens there, so two things
// are asked of Chromium (the `layout` project of `vitest.config.ts`): that
// the search, placed at a label row's end, opens towards the inline start —
// its inline-end edge stays put while its inline-start edge moves — and that
// hovering the resting icon shows the tooltip passed in.
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Box, Flex } from "../primitives/layout";
import { Provider } from "../primitives/provider";
import { IconSearch } from "./icon-search";

let root: Root | undefined;
let host: HTMLDivElement | undefined;

const frame = () =>
	new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

async function mount(dir: "ltr" | "rtl"): Promise<HTMLElement> {
	host = document.createElement("div");
	document.body.appendChild(host);
	root = createRoot(host);
	await act(async () => {
		root?.render(
			<StrictMode>
				<Provider>
					<Flex dir={dir} width="600px" alignItems="center" data-testid="row">
						<Box>Parent</Box>
						<IconSearch
							label="Search the tree"
							tooltip="Find a node"
							onSearch={() => {}}
						/>
					</Flex>
				</Provider>
			</StrictMode>,
		);
	});
	await frame();
	return host;
}

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = undefined;
	host = undefined;
});

function search(container: HTMLElement): HTMLElement {
	const el = container.querySelector<HTMLElement>("[data-scope='icon-search']");
	if (!el) throw new Error("no icon-search");
	return el;
}

function rowRect(container: HTMLElement): DOMRect {
	const el = container.querySelector<HTMLElement>("[data-testid='row']");
	if (!el) throw new Error("no row");
	return el.getBoundingClientRect();
}

async function open(container: HTMLElement) {
	const button = container.querySelector<HTMLButtonElement>(
		"button[aria-label='Search the tree']",
	);
	if (!button) throw new Error("no button");
	await act(async () => button.click());
	await frame();
}

describe("IconSearch — layout", () => {
	it("opens leftwards from a left-to-right row's right end", async () => {
		const container = await mount("ltr");
		const row = rowRect(container);
		const closed = search(container).getBoundingClientRect();
		expect(Math.round(closed.right)).toBe(Math.round(row.right));

		await open(container);
		const opened = search(container).getBoundingClientRect();
		expect(Math.round(opened.right)).toBe(Math.round(row.right));
		expect(opened.left).toBeLessThan(closed.left);
		expect(opened.width).toBeGreaterThan(closed.width);
	});

	it("opens rightwards from a right-to-left row's left end", async () => {
		const container = await mount("rtl");
		const row = rowRect(container);
		const closed = search(container).getBoundingClientRect();
		expect(Math.round(closed.left)).toBe(Math.round(row.left));

		await open(container);
		const opened = search(container).getBoundingClientRect();
		expect(Math.round(opened.left)).toBe(Math.round(row.left));
		expect(opened.right).toBeGreaterThan(closed.right);
	});

	it("Escape returns focus to the icon button", async () => {
		const container = await mount("ltr");
		await open(container);
		const input = container.querySelector<HTMLInputElement>("input");
		if (!input) throw new Error("no input");
		expect(document.activeElement).toBe(input);
		await act(async () => {
			input.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
			);
		});
		expect(document.activeElement?.getAttribute("aria-label")).toBe(
			"Search the tree",
		);
	});

	it("shows the tooltip passed in on hover", async () => {
		const container = await mount("ltr");
		const button = container.querySelector<HTMLButtonElement>(
			"button[aria-label='Search the tree']",
		);
		if (!button) throw new Error("no button");
		await act(async () => {
			button.dispatchEvent(
				new PointerEvent("pointermove", {
					pointerType: "mouse",
					bubbles: true,
				}),
			);
		});
		await expect
			.poll(() => document.body.textContent?.includes("Find a node"), {
				timeout: 3000,
			})
			.toBe(true);
	});
});
