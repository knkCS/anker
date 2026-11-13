// DiffView with large files (#332), in a real browser: a file of more than
// `virtualizeAbove` rows renders in a pane of its own that draws only the
// code lines in view — line numbers, expanded folds, comments (always
// drawn) and the `n` / `p` jumps stay correct while it scrolls. Asked of Chromium (the `layout`
// project of `vitest.config.ts`), because a virtualiser needs real layout.
import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { DarkMode, LightMode } from "../../primitives/color-mode";
import { Provider } from "../../primitives/provider";
import {
	type ColorMode,
	resolveColor,
	toComputedRgb,
} from "../../test/color-tokens";
import system from "../../theme";
import { type DiffComment, DiffView } from ".";

let root: Root | undefined;
let host: HTMLDivElement | undefined;

async function mount(node: ReactNode): Promise<HTMLDivElement> {
	host = document.createElement("div");
	document.body.appendChild(host);
	root = createRoot(host);
	await act(async () => {
		root?.render(<Provider forcedTheme="light">{node}</Provider>);
	});
	await settle();
	return host;
}

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = undefined;
	host = undefined;
});

/** Lets the virtualiser measure and re-render after a scroll or a mount. */
async function settle() {
	for (let i = 0; i < 3; i++) {
		await act(
			() =>
				new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
		);
	}
}

/** A new file of `count` added lines. */
function addedFile(path: string, count: number) {
	return [
		`diff --git a/${path} b/${path}`,
		"new file mode 100644",
		"--- /dev/null",
		`+++ b/${path}`,
		`@@ -0,0 +1,${count} @@`,
		...Array.from({ length: count }, (_, i) => `+added ${i + 1}`),
	].join("\n");
}

/**
 * A modified file of `count` lines where every `every`th line changes: long
 * unchanged runs between the changes fold.
 */
function modifiedFile(path: string, count: number, every: number) {
	const lines: string[] = [];
	for (let i = 1; i <= count; i++) {
		if (i % every === 0) {
			lines.push(`-old ${i}`, `+new ${i}`);
		} else {
			lines.push(` same ${i}`);
		}
	}
	return [
		`diff --git a/${path} b/${path}`,
		"index 1111111..2222222 100644",
		`--- a/${path}`,
		`+++ b/${path}`,
		`@@ -1,${count} +1,${count} @@`,
		...lines,
	].join("\n");
}

const BIG = addedFile("big.ts", 5000);
const SMALL = addedFile("small.ts", 3);

const section = (el: HTMLElement, key: string) => {
	const found = el.querySelector<HTMLElement>(
		`section[data-diff-file='${key}']`,
	);
	if (!found) throw new Error(`no file ${key}`);
	return found;
};

const lineRows = (el: HTMLElement) => [
	...el.querySelectorAll<HTMLElement>("tr[data-diff-row='line']"),
];

const newNumbers = (el: HTMLElement) =>
	lineRows(el).map((row) => Number(row.dataset.newLine));

/** The scrolling pane a large file renders its rows in. */
const pane = (file: HTMLElement) => {
	const found = file.querySelector<HTMLElement>("[data-diff-virtual]");
	if (!found) throw new Error("no virtual pane");
	return found;
};

async function scrollPane(file: HTMLElement, top: number) {
	const p = pane(file);
	p.scrollTop = top;
	p.dispatchEvent(new Event("scroll"));
	await settle();
}

const isConsecutive = (numbers: number[]) =>
	numbers.every((n, i) => i === 0 || n === numbers[i - 1] + 1);

describe("DiffView large files", () => {
	it("renders only the visible window of a 5,000-line file", async () => {
		const el = await mount(<DiffView diff={BIG} />);
		const big = section(el, "big.ts");
		const numbers = newNumbers(big);
		expect(numbers.length).toBeGreaterThan(10);
		expect(numbers.length).toBeLessThan(150);
		expect(numbers.slice(0, 3)).toEqual([1, 2, 3]);
		expect(isConsecutive(numbers)).toBe(true);
		// The pane is as tall as all its rows, so the scrollbar is true.
		const p = pane(big);
		expect(p.scrollHeight).toBeGreaterThan(5000 * 15);
		expect(p.clientHeight).toBeLessThan(900);
		// The header still counts every line.
		expect(big.querySelector("[data-diff-file-header]")?.textContent).toContain(
			"+5000 -0",
		);
	});

	it("draws the rows in view as the pane scrolls, numbered right", async () => {
		const el = await mount(<DiffView diff={BIG} />);
		const big = section(el, "big.ts");
		await scrollPane(big, pane(big).scrollHeight);
		let numbers = newNumbers(big);
		expect(numbers.at(-1)).toBe(5000);
		expect(numbers).not.toContain(1);
		expect(isConsecutive(numbers)).toBe(true);
		const last = lineRows(big).at(-1) as HTMLElement;
		expect(last.querySelector("[data-diff-content]")?.textContent).toContain(
			"added 5000",
		);

		await scrollPane(big, pane(big).scrollHeight / 2);
		numbers = newNumbers(big);
		expect(numbers.length).toBeLessThan(150);
		expect(numbers.some((n) => n > 2000 && n < 3000)).toBe(true);
		expect(isConsecutive(numbers)).toBe(true);
	});

	it("keeps the rendered rows in view inside the pane", async () => {
		const el = await mount(<DiffView diff={BIG} />);
		const big = section(el, "big.ts");
		await scrollPane(big, 40_000);
		const box = pane(big).getBoundingClientRect();
		const visible = lineRows(big).filter((row) => {
			const r = row.getBoundingClientRect();
			return r.bottom > box.top && r.top < box.bottom;
		});
		expect(visible.length).toBeGreaterThan(10);
	});

	it("renders small files whole, and every file whole with virtualizeAbove={Infinity}", async () => {
		const el = await mount(
			<>
				<DiffView diff={SMALL} />
				<DiffView diff={addedFile("mid.ts", 800)} virtualizeAbove={Infinity} />
				<DiffView diff={addedFile("low.ts", 40)} virtualizeAbove={20} />
			</>,
		);
		const small = section(el, "small.ts");
		expect(small.querySelector("[data-diff-virtual]")).toBeNull();
		expect(newNumbers(small)).toEqual([1, 2, 3]);
		const mid = section(el, "mid.ts");
		expect(mid.querySelector("[data-diff-virtual]")).toBeNull();
		expect(newNumbers(mid)).toHaveLength(800);
		expect(
			section(el, "low.ts").querySelector("[data-diff-virtual]"),
		).not.toBeNull();
	});

	it("virtualises the compact variant too", async () => {
		const el = await mount(<DiffView diff={BIG} variant="compact" />);
		const big = section(el, "big.ts");
		expect(newNumbers(big).length).toBeLessThan(150);
		await scrollPane(big, pane(big).scrollHeight);
		expect(newNumbers(big).at(-1)).toBe(5000);
	});
});

describe("DiffView large files: folds", () => {
	const FOLDED = modifiedFile("folded.ts", 3000, 100);

	it("folds long unchanged runs and keeps an expansion while scrolling", async () => {
		// About 270 rows as folded: past a threshold of 100.
		const el = await mount(<DiffView diff={FOLDED} virtualizeAbove={100} />);
		const file = section(el, "folded.ts");
		expect(file.querySelector("[data-diff-virtual]")).not.toBeNull();
		const fold = file.querySelector<HTMLElement>(
			"tr[data-diff-row='fold'] button",
		);
		expect(fold?.textContent).toBe("Expand 96 unchanged lines");
		await userEvent.click(fold as HTMLElement);
		await settle();
		// Lines 1–99 are all shown now, in order, before the first change.
		const shown = lineRows(file)
			.filter((row) => row.dataset.kind === "context")
			.map((row) => Number(row.dataset.newLine));
		expect(shown.slice(0, 20)).toEqual(
			Array.from({ length: 20 }, (_, i) => i + 1),
		);

		await scrollPane(file, pane(file).scrollHeight);
		expect(newNumbers(file).at(-1)).toBe(3000);
		await scrollPane(file, 0);
		expect(newNumbers(file).slice(0, 5)).toEqual([1, 2, 3, 4, 5]);
		expect(
			file.querySelector("tr[data-diff-row='fold'] button")?.textContent,
		).not.toBe("Expand 96 unchanged lines");
	});
});

describe("DiffView large files: comments", () => {
	const COMMENTS: DiffComment[] = [
		{ id: "near", path: "big.ts", line: 2, body: "near the top" },
		{ id: "deep", path: "big.ts", line: 4000, body: "deep down" },
		{ id: "deeper", path: "big.ts", line: 4500, body: "deeper" },
		{ id: "after", path: "small.ts", line: 2, body: "next file" },
	];
	const DIFFS = `${BIG}\n${SMALL}`;
	const focused = () => document.activeElement as HTMLElement | null;
	/** The line a line comment sits under. */
	const lineAbove = (comment: HTMLElement) =>
		comment.closest("tr")?.previousElementSibling as HTMLElement | null;

	it("draws every comment under its line, in view or not", async () => {
		const el = await mount(<DiffView diff={DIFFS} comments={COMMENTS} />);
		const big = section(el, "big.ts");
		expect(newNumbers(big).length).toBeLessThan(150);
		// Off-screen comments are drawn with their line, the lines between not.
		const offscreen = big.querySelector<HTMLElement>(
			"[data-diff-comment='deeper']",
		);
		expect(lineAbove(offscreen as HTMLElement)?.dataset.newLine).toBe("4500");
		expect(newNumbers(big)).not.toContain(4499);
		expect(big.querySelector("[data-diff-comment-count]")?.textContent).toBe(
			"3 comments",
		);

		// Line 4000 sits about 80% down the pane; scroll there and look.
		const p = pane(big);
		await scrollPane(big, p.scrollHeight * 0.8 - p.clientHeight / 2);
		for (let i = 0; i < 20; i++) {
			if (big.querySelector("[data-diff-comment='deep']")) break;
			await scrollPane(big, p.scrollTop + p.clientHeight / 2);
		}
		const deep = big.querySelector<HTMLElement>("[data-diff-comment='deep']");
		expect(deep?.textContent).toContain("deep down");
		expect(lineAbove(deep as HTMLElement)?.dataset.newLine).toBe("4000");
		expect(newNumbers(big)).toContain(3999);
		expect(newNumbers(big)).not.toContain(5);
	});

	it("keeps a comment's own state while the pane scrolls", async () => {
		const el = await mount(
			<DiffView
				diff={DIFFS}
				comments={COMMENTS}
				renderComment={(c) => <textarea aria-label={`Reply ${c.id}`} />}
			/>,
		);
		const big = section(el, "big.ts");
		const reply = big.querySelector<HTMLTextAreaElement>(
			"[aria-label='Reply near']",
		);
		await userEvent.type(reply as HTMLElement, "half a reply");
		(reply as HTMLElement).blur();
		await scrollPane(big, pane(big).scrollHeight);
		await scrollPane(big, 0);
		expect(
			big.querySelector<HTMLTextAreaElement>("[aria-label='Reply near']"),
		).toBe(reply);
		expect(reply?.value).toBe("half a reply");
	});

	it("tells assistive tech how many rows the pane holds", async () => {
		const el = await mount(<DiffView diff={BIG} />);
		const big = section(el, "big.ts");
		expect(big.querySelector("table")?.getAttribute("aria-rowcount")).toBe(
			"5001",
		);
		await scrollPane(big, pane(big).scrollHeight);
		const last = lineRows(big).at(-1);
		expect(last?.getAttribute("aria-rowindex")).toBe("5001");
	});

	it("n and p reach comments the pane has not drawn, in reading order", async () => {
		const el = await mount(<DiffView diff={DIFFS} comments={COMMENTS} />);
		el.querySelector<HTMLElement>("section h3 button")?.focus();
		await userEvent.keyboard("n");
		expect(focused()?.dataset.diffComment).toBe("near");
		await userEvent.keyboard("n");
		await settle();
		expect(focused()?.dataset.diffComment).toBe("deep");
		const big = section(el, "big.ts");
		// Focus scrolled the pane to it, under its line.
		const box = pane(big).getBoundingClientRect();
		const at = focused()?.getBoundingClientRect() as DOMRect;
		expect(at.top).toBeGreaterThanOrEqual(box.top - 1);
		expect(at.top).toBeLessThan(box.bottom);
		expect(lineAbove(focused() as HTMLElement)?.dataset.newLine).toBe("4000");
		await userEvent.keyboard("n");
		await settle();
		expect(focused()?.dataset.diffComment).toBe("deeper");
		await userEvent.keyboard("n");
		expect(focused()?.dataset.diffComment).toBe("after");
		// Back into the pane from the next file, to its last comment.
		await userEvent.keyboard("p");
		await settle();
		expect(focused()?.dataset.diffComment).toBe("deeper");
		await userEvent.keyboard("pp");
		await settle();
		expect(focused()?.dataset.diffComment).toBe("near");
		// j from inside the pane goes on to the next file.
		await userEvent.keyboard("j");
		expect(focused()?.closest("section")?.dataset.diffFile).toBe("small.ts");
	});

	it("keeps a focused comment while the pane scrolls away from it", async () => {
		const el = await mount(<DiffView diff={DIFFS} comments={COMMENTS} />);
		const big = section(el, "big.ts");
		const near = big.querySelector<HTMLElement>("[data-diff-comment='near']");
		near?.focus();
		await scrollPane(big, pane(big).scrollHeight / 2);
		expect(focused()).toBe(near);
		expect(near?.isConnected).toBe(true);
		await userEvent.keyboard("n");
		await settle();
		expect(focused()?.dataset.diffComment).toBe("deep");
	});
});

describe.each<ColorMode>([
	"light",
	"dark",
])("DiffView large file colours in %s mode", (mode) => {
	const rgb = (name: string) => toComputedRgb(resolveColor(system, name, mode));

	it("paints drawn rows like any other line", async () => {
		const Wrap = mode === "dark" ? DarkMode : LightMode;
		const el = await mount(
			<Wrap>
				<DiffView
					diff={modifiedFile("big.ts", 3000, 2)}
					comments={[{ id: "c", path: "big.ts", line: 3, body: "x" }]}
				/>
			</Wrap>,
		);
		const big = section(el, "big.ts");
		expect(big.querySelector("[data-diff-virtual]")).not.toBeNull();
		const of = (kind: string) =>
			big.querySelector<HTMLElement>(
				`tr[data-diff-row='line'][data-kind='${kind}']`,
			) as HTMLElement;
		expect(getComputedStyle(of("added")).backgroundColor).toBe(
			rgb("success.subtle"),
		);
		expect(getComputedStyle(of("removed")).backgroundColor).toBe(
			rgb("danger.subtle"),
		);
		expect(getComputedStyle(of("context")).backgroundColor).toBe(
			rgb("bg-surface"),
		);
		const hunk = big.querySelector<HTMLElement>("tr[data-diff-row='hunk'] td");
		expect(getComputedStyle(hunk as HTMLElement).backgroundColor).toBe(
			rgb("info.subtle"),
		);
		const comments = big.querySelector<HTMLElement>(
			"tr[data-diff-row='comments'] td",
		);
		expect(getComputedStyle(comments as HTMLElement).backgroundColor).toBe(
			rgb("bg-subtle"),
		);
	});
});
