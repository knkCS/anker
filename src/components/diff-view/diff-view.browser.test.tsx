// DiffView as a consumer sees it (#330), in a real browser.
//
// The rendered structure (one section per file, header, line numbers), the
// reader's controls (file collapse, fold expand) and their callbacks, the
// compact variant, and the line colours as resolved in light and dark mode —
// asked of Chromium (the `layout` project of `vitest.config.ts`), because
// jsdom resolves no CSS variables.
import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/button";
import { DarkMode, LightMode } from "../../primitives/color-mode";
import { Provider } from "../../primitives/provider";
import {
	AA_TEXT,
	type ColorMode,
	contrastRatio,
	resolveColor,
	toComputedRgb,
} from "../../test/color-tokens";
import system from "../../theme";
import { type DiffComment, type DiffFile, DiffView, parseUnifiedDiff } from ".";

let root: Root | undefined;
let host: HTMLDivElement | undefined;

async function mount(node: ReactNode): Promise<HTMLDivElement> {
	host = document.createElement("div");
	document.body.appendChild(host);
	root = createRoot(host);
	await act(async () => {
		root?.render(<Provider forcedTheme="light">{node}</Provider>);
	});
	return host;
}

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = undefined;
	host = undefined;
});

const unchanged = (from: number, count: number) =>
	Array.from({ length: count }, (_, i) => ` line ${from + i}`);

const DIFF = [
	"diff --git a/src/app.ts b/src/app.ts",
	"index 3b18e51..a3c5d2f 100644",
	"--- a/src/app.ts",
	"+++ b/src/app.ts",
	"@@ -10,15 +10,15 @@ export function main() {",
	" const a = 1;",
	"-const b = 2;",
	"+const b = 3;",
	...unchanged(12, 12),
	"-old end",
	"\\ No newline at end of file",
	"+new end",
	"diff --git a/docs/new.md b/docs/new.md",
	"new file mode 100644",
	"--- /dev/null",
	"+++ b/docs/new.md",
	"@@ -0,0 +1,2 @@",
	"+# New",
	"+text",
	"diff --git a/old.go b/old.go",
	"deleted file mode 100644",
	"--- a/old.go",
	"+++ /dev/null",
	"@@ -1 +0,0 @@",
	"-package old",
	"diff --git a/a.ts b/b.ts",
	"similarity index 100%",
	"rename from a.ts",
	"rename to b.ts",
	"diff --git a/logo.png b/logo.png",
	"index 1111111..2222222 100644",
	"Binary files a/logo.png and b/logo.png differ",
].join("\n");

const sections = (el: HTMLElement) => [
	...el.querySelectorAll<HTMLElement>("section[data-diff-file]"),
];

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

const cell = (row: HTMLElement, name: string) =>
	row.querySelector<HTMLElement>(`[data-diff-${name}]`)?.textContent ?? "";

describe("DiffView structure", () => {
	it("renders one section per file, named by its path heading", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		expect(sections(el).map((s) => s.dataset.diffFile)).toEqual([
			"src/app.ts",
			"docs/new.md",
			"old.go",
			"b.ts",
			"logo.png",
		]);
		const app = section(el, "src/app.ts");
		const heading = app.querySelector("h3");
		expect(heading?.textContent).toBe("src/app.ts");
		expect(app.getAttribute("aria-labelledby")).toBe(heading?.id);
	});

	it("shows each file's change type and line counts in its header", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		const header = (key: string) =>
			section(el, key).querySelector<HTMLElement>("[data-diff-file-header]")
				?.textContent ?? "";
		expect(header("src/app.ts")).toContain("Modified");
		expect(header("src/app.ts")).toContain("+2 -2");
		expect(header("src/app.ts")).toContain("2 additions, 2 deletions");
		expect(header("docs/new.md")).toContain("Added");
		expect(header("docs/new.md")).toContain("+2 -0");
		expect(header("old.go")).toContain("Deleted");
		expect(header("b.ts")).toContain("Renamed");
		expect(header("b.ts")).toMatch(/a\.ts.*b\.ts/);
		// A rename without content changes has no counts to show.
		expect(header("b.ts")).not.toContain("+0");
		expect(header("logo.png")).toContain("Binary");
		expect(header("logo.png")).not.toContain("additions");
	});

	it("explains files with nothing to show line by line", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		expect(section(el, "logo.png").textContent).toContain(
			"Binary file not shown",
		);
		expect(section(el, "b.ts").textContent).toContain(
			"File renamed without changes",
		);
	});

	it("numbers each line on the old and the new side", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		const rows = lineRows(section(el, "src/app.ts"));
		const numbers = rows
			.slice(0, 4)
			.map((r) => [
				r.dataset.kind,
				cell(r, "gutter='old'"),
				cell(r, "gutter='new'"),
				cell(r, "sign"),
			]);
		expect(numbers).toEqual([
			["context", "10", "10", " "],
			["removed", "11", "", "-"],
			["added", "", "11", "+"],
			["context", "12", "12", " "],
		]);
		// The anchors line comments (#331) will find a line by.
		expect(rows[2].dataset.newLine).toBe("11");
		expect(rows[1].dataset.oldLine).toBe("11");
		expect(rows[1].dataset.newLine).toBeUndefined();
	});

	it("announces added and removed lines without relying on colour", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		const rows = lineRows(section(el, "src/app.ts"));
		expect(cell(rows[1], "content")).toBe("Removed: const b = 2;");
		expect(cell(rows[2], "content")).toBe("Added: const b = 3;");
		expect(cell(rows[0], "content")).toBe("const a = 1;");
		// The sign glyph is visual only.
		expect(
			rows[1].querySelector("[data-diff-sign]")?.getAttribute("aria-hidden"),
		).toBe("true");
	});

	it("marks a line with no newline at end of file", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		const marked = section(el, "src/app.ts").querySelectorAll(
			"[data-diff-no-newline]",
		);
		expect(marked).toHaveLength(1);
		expect(marked[0].closest("tr")?.dataset.kind).toBe("removed");
		expect(marked[0].textContent).toBe("No newline at end of file");
	});

	it("starts each hunk with its header row", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		const hunk = section(el, "src/app.ts").querySelector(
			"tr[data-diff-row='hunk']",
		);
		expect(hunk?.textContent).toBe(
			"@@ -10,15 +10,15 @@ export function main() {",
		);
	});

	it("keeps code in monospace, preserving whitespace, with the tab size", async () => {
		const el = await mount(<DiffView diff={DIFF} tabSize={2} />);
		const content = section(el, "src/app.ts").querySelector<HTMLElement>(
			"[data-diff-content]",
		);
		if (!content) throw new Error("no content cell");
		const style = getComputedStyle(content);
		expect(style.fontFamily).toContain("JetBrains Mono");
		expect(style.whiteSpace).toBe("pre");
		expect(style.tabSize).toBe("2");
		const gutter = section(el, "src/app.ts").querySelector<HTMLElement>(
			"[data-diff-gutter]",
		);
		expect(getComputedStyle(gutter as HTMLElement).userSelect).toBe("none");
	});

	it("renders already parsed files and a file action slot", async () => {
		const files = parseUnifiedDiff(DIFF).filter((f) => !f.binary);
		const el = await mount(
			<DiffView
				files={files}
				renderFileActions={(file) => (
					<Button size="xs">View {file.path}</Button>
				)}
			/>,
		);
		expect(sections(el)).toHaveLength(4);
		const buttons = [
			...section(el, "old.go").querySelectorAll(
				"[data-diff-file-header] button",
			),
		].map((b) => b.textContent);
		expect(buttons).toContain("View old.go");
	});

	it("says so when the diff has no file", async () => {
		const el = await mount(
			<DiffView diff="" labels={{ empty: "Nothing changed" }} />,
		);
		expect(sections(el)).toHaveLength(0);
		expect(el.querySelector("[data-diff-view]")?.textContent).toBe(
			"Nothing changed",
		);
	});
});

describe("DiffView file collapse", () => {
	const toggle = (el: HTMLElement, key: string) => {
		const button = section(el, key).querySelector<HTMLButtonElement>(
			"h3 button",
		);
		if (!button) throw new Error(`no toggle for ${key}`);
		return button;
	};

	it("collapses and expands a file from its header, reporting each change", async () => {
		const onChange = vi.fn();
		const el = await mount(
			<DiffView diff={DIFF} onFileCollapsedChange={onChange} />,
		);
		const button = toggle(el, "src/app.ts");
		expect(button.getAttribute("aria-expanded")).toBe("true");
		const body = document.getElementById(
			button.getAttribute("aria-controls") ?? "",
		);
		expect(body?.querySelector("table")).not.toBeNull();

		await userEvent.click(button);
		expect(button.getAttribute("aria-expanded")).toBe("false");
		expect(button.hasAttribute("aria-controls")).toBe(false);
		expect(section(el, "src/app.ts").hasAttribute("data-collapsed")).toBe(true);
		expect(lineRows(section(el, "src/app.ts"))).toHaveLength(0);
		expect(onChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ key: "src/app.ts" }),
			true,
		);

		await userEvent.click(button);
		expect(button.getAttribute("aria-expanded")).toBe("true");
		expect(lineRows(section(el, "src/app.ts")).length).toBeGreaterThan(0);
		expect(onChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ key: "src/app.ts" }),
			false,
		);
	});

	it("toggles from the keyboard", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		toggle(el, "docs/new.md").focus();
		await userEvent.keyboard("{Enter}");
		expect(toggle(el, "docs/new.md").getAttribute("aria-expanded")).toBe(
			"false",
		);
	});

	it("starts files collapsed by a predicate", async () => {
		const el = await mount(
			<DiffView
				diff={DIFF}
				defaultCollapsed={(file) => file.changeType === "deleted"}
			/>,
		);
		expect(toggle(el, "old.go").getAttribute("aria-expanded")).toBe("false");
		expect(toggle(el, "src/app.ts").getAttribute("aria-expanded")).toBe("true");
	});
});

describe("DiffView unchanged regions", () => {
	it("folds a long unchanged run behind an expand control", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		const app = section(el, "src/app.ts");
		const fold = app.querySelector<HTMLElement>("tr[data-diff-row='fold']");
		expect(fold?.textContent).toBe("Expand 6 unchanged lines");
		// 1 + 2 changed + 3 + 3 kept around the fold + 2 changed.
		expect(lineRows(app)).toHaveLength(11);
		const numbers = lineRows(app).map((r) => r.dataset.newLine);
		expect(numbers).not.toContain("17");
	});

	it("shows the folded lines when expanded, with their numbers", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		const app = section(el, "src/app.ts");
		const button = app.querySelector<HTMLButtonElement>(
			"tr[data-diff-row='fold'] button",
		);
		if (!button) throw new Error("no fold");
		await userEvent.click(button);
		expect(app.querySelector("tr[data-diff-row='fold']")).toBeNull();
		expect(lineRows(app)).toHaveLength(17);
		const line17 = lineRows(app).find((r) => r.dataset.newLine === "17");
		expect(line17 && cell(line17, "gutter='old'")).toBe("17");
		expect(line17 && cell(line17, "content")).toBe("line 17");
	});

	it("folds a new revision of the same file again", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		const app = () => section(el, "src/app.ts");
		const button = app().querySelector<HTMLButtonElement>(
			"tr[data-diff-row='fold'] button",
		);
		await userEvent.click(button as HTMLButtonElement);
		expect(app().querySelector("tr[data-diff-row='fold']")).toBeNull();
		await act(async () => {
			root?.render(
				<Provider forcedTheme="light">
					<DiffView diff={`${DIFF}\n`} />
				</Provider>,
			);
		});
		expect(app().querySelector("tr[data-diff-row='fold']")).not.toBeNull();
	});

	it("folds nothing with contextLines={Infinity}", async () => {
		const el = await mount(
			<DiffView diff={DIFF} contextLines={Number.POSITIVE_INFINITY} />,
		);
		expect(el.querySelector("tr[data-diff-row='fold']")).toBeNull();
	});
});

describe("DiffView compact variant", () => {
	const SINGLE = [
		"--- a/src/app.ts",
		"+++ b/src/app.ts",
		"@@ -1,2 +1,2 @@",
		" keep",
		"-old",
		"+new",
	].join("\n");

	it("renders a slim header that does not collapse, in smaller type", async () => {
		const el = await mount(
			<>
				<DiffView diff={SINGLE} variant="compact" />
				<DiffView diff={SINGLE} />
			</>,
		);
		const [compact, normal] = [
			...el.querySelectorAll<HTMLElement>("[data-diff-view]"),
		];
		expect(compact.dataset.variant).toBe("compact");
		expect(compact.querySelector("h3 button")).toBeNull();
		expect(compact.querySelector("h3")?.textContent).toBe("src/app.ts");
		// A plain modification needs no badge in the slim header.
		expect(compact.textContent).not.toContain("Modified");
		const size = (root: HTMLElement) =>
			Number.parseFloat(
				getComputedStyle(root.querySelector("table") as HTMLElement).fontSize,
			);
		expect(size(compact)).toBeLessThan(size(normal));
		const headerHeight = (root: HTMLElement) =>
			(
				root.querySelector("[data-diff-file-header]") as HTMLElement
			).getBoundingClientRect().height;
		expect(headerHeight(compact)).toBeLessThan(headerHeight(normal));
		// Same lines, same numbers.
		expect(lineRows(compact).map((r) => cell(r, "gutter='new'"))).toEqual([
			"1",
			"",
			"2",
		]);
	});

	it("still names a file that changed in more than content", async () => {
		const el = await mount(
			<DiffView
				variant="compact"
				diff={"--- /dev/null\n+++ b/new.txt\n@@ -0,0 +1 @@\n+hi"}
			/>,
		);
		expect(el.textContent).toContain("Added");
	});

	it("titles bare hunks with the untitled label", async () => {
		const el = await mount(
			<DiffView
				variant="compact"
				diff={"@@ -1 +1 @@\n-a\n+b"}
				labels={{ untitledFile: "Change" }}
			/>,
		);
		expect(el.querySelector("h3")?.textContent).toBe("Change");
	});
});

describe.each<ColorMode>([
	"light",
	"dark",
])("DiffView line colours in %s mode", (mode) => {
	const token = (name: string) => resolveColor(system, name, mode);
	const rgb = (name: string) => toComputedRgb(token(name));

	async function rows() {
		const Wrap = mode === "dark" ? DarkMode : LightMode;
		const el = await mount(
			<Wrap>
				<DiffView diff={DIFF} />
			</Wrap>,
		);
		const app = section(el, "src/app.ts");
		const [context, removed, added] = lineRows(app);
		const part = (row: HTMLElement, name: string) =>
			getComputedStyle(row.querySelector(`[data-diff-${name}]`) as HTMLElement);
		return { app, context, removed, added, part };
	}

	it("added lines sit on the success palette", async () => {
		const { added, part } = await rows();
		expect(getComputedStyle(added).backgroundColor).toBe(rgb("success.subtle"));
		expect(part(added, "gutter='new'").color).toBe(rgb("success.fg"));
		expect(part(added, "sign").color).toBe(rgb("success.fg"));
		expect(part(added, "content").color).toBe(rgb("default"));
	});

	it("removed lines sit on the danger palette", async () => {
		const { removed, part } = await rows();
		expect(getComputedStyle(removed).backgroundColor).toBe(
			rgb("danger.subtle"),
		);
		expect(part(removed, "gutter='old'").color).toBe(rgb("danger.fg"));
		expect(part(removed, "sign").color).toBe(rgb("danger.fg"));
		expect(part(removed, "content").color).toBe(rgb("default"));
	});

	it("unchanged lines sit on the surface with muted numbers", async () => {
		const { context, part } = await rows();
		expect(getComputedStyle(context).backgroundColor).toBe(rgb("bg-surface"));
		expect(part(context, "gutter='old'").color).toBe(rgb("muted"));
	});

	it("hunk headers sit on the info palette", async () => {
		const { app } = await rows();
		const td = app.querySelector<HTMLElement>("tr[data-diff-row='hunk'] td");
		const style = getComputedStyle(td as HTMLElement);
		expect(style.backgroundColor).toBe(rgb("info.subtle"));
		expect(style.color).toBe(rgb("info.fg"));
	});

	it("every text it paints is legible at AA on its line", () => {
		for (const palette of ["success", "danger"]) {
			const surface = token(`${palette}.subtle`);
			expect(contrastRatio(token("default"), surface)).toBeGreaterThanOrEqual(
				AA_TEXT,
			);
			expect(
				contrastRatio(token(`${palette}.fg`), surface),
			).toBeGreaterThanOrEqual(AA_TEXT);
		}
		expect(
			contrastRatio(token("muted"), token("bg-surface")),
		).toBeGreaterThanOrEqual(AA_TEXT);
		expect(
			contrastRatio(token("info.fg"), token("info.subtle")),
		).toBeGreaterThanOrEqual(AA_TEXT);
		// Added, removed and unchanged lines are three different surfaces.
		expect(
			new Set([
				token("success.subtle"),
				token("danger.subtle"),
				token("bg-surface"),
			]).size,
		).toBe(3);
	});
});

describe("DiffView comments", () => {
	const commentEl = (el: HTMLElement, id: string) => {
		const found = el.querySelector<HTMLElement>(`[data-diff-comment='${id}']`);
		if (!found) throw new Error(`no comment ${id}`);
		return found;
	};
	/** The line row a line comment sits under. */
	const lineAbove = (comment: HTMLElement) =>
		comment.closest("tr")?.previousElementSibling as HTMLElement | null;

	const COMMENTS: DiffComment[] = [
		{
			id: "on-added",
			path: "src/app.ts",
			line: 11,
			author: "Reviewer",
			timestamp: "14:03",
			tone: "danger",
			label: "Blocking",
			body: "b must stay 2",
		},
		{
			id: "on-removed",
			path: "src/app.ts",
			line: 11,
			side: "old",
			body: "Why?",
		},
		{ id: "on-context", path: "src/app.ts", line: 10, body: "Fine" },
		{ id: "between-hunks", path: "src/app.ts", line: 200, body: "Far away" },
		{ id: "on-file", path: "docs/new.md", body: "Whole file" },
		{ id: "on-binary", path: "logo.png", line: 1, body: "Too big" },
		{ id: "elsewhere", path: "README.md", line: 3, body: "Not in the diff" },
	];

	it("renders each comment under its line on its side, with author, label, timestamp and body", async () => {
		const el = await mount(<DiffView diff={DIFF} comments={COMMENTS} />);
		const added = lineAbove(commentEl(el, "on-added"));
		expect(added?.dataset.kind).toBe("added");
		expect(added?.dataset.newLine).toBe("11");
		const removed = lineAbove(commentEl(el, "on-removed"));
		expect(removed?.dataset.kind).toBe("removed");
		expect(removed?.dataset.oldLine).toBe("11");
		expect(lineAbove(commentEl(el, "on-context"))?.dataset.newLine).toBe("10");

		const comment = commentEl(el, "on-added");
		expect(comment.closest("section")?.dataset.diffFile).toBe("src/app.ts");
		expect(comment.getAttribute("role")).toBe("article");
		expect(comment.getAttribute("aria-label")).toBe(
			"Comment by Reviewer on src/app.ts, line 11",
		);
		expect(comment.dataset.side).toBe("new");
		expect(commentEl(el, "on-removed").dataset.side).toBe("old");
		for (const text of ["Reviewer", "Blocking", "14:03", "b must stay 2"]) {
			expect(comment.textContent).toContain(text);
		}
	});

	it("shows comments outside the hunks at the file level, and drops none", async () => {
		const el = await mount(<DiffView diff={DIFF} comments={COMMENTS} />);
		const fileLevel = (key: string) =>
			section(el, key).querySelector<HTMLElement>("[data-diff-file-comments]");

		const far = commentEl(el, "between-hunks");
		expect(fileLevel("src/app.ts")?.contains(far)).toBe(true);
		expect(far.closest("table")).toBeNull();
		expect(far.textContent).toContain("Line 200");
		expect(fileLevel("docs/new.md")?.contains(commentEl(el, "on-file"))).toBe(
			true,
		);
		expect(fileLevel("logo.png")?.contains(commentEl(el, "on-binary"))).toBe(
			true,
		);
		const other = el.querySelector<HTMLElement>("[data-diff-other-comments]");
		expect(other?.textContent).toContain("Comments on files not in this diff");
		expect(other?.contains(commentEl(el, "elsewhere"))).toBe(true);
		expect(commentEl(el, "elsewhere").textContent).toContain(
			"README.md · Line 3",
		);

		const rendered = [
			...el.querySelectorAll<HTMLElement>("[data-diff-comment]"),
		].map((c) => c.dataset.diffComment);
		expect(rendered.sort()).toEqual(COMMENTS.map((c) => c.id).sort());
	});

	it("keeps comments on files when the diff is empty", async () => {
		const el = await mount(
			<DiffView diff="" comments={[{ id: "x", path: "a.ts", body: "Hi" }]} />,
		);
		expect(el.textContent).toContain("No changes");
		expect(el.querySelector("[data-diff-comment='x']")).not.toBeNull();
	});

	it("never folds a commented line", async () => {
		const el = await mount(
			<DiffView
				diff={DIFF}
				comments={[{ id: "deep", path: "src/app.ts", line: 17, body: "Here" }]}
			/>,
		);
		const line = lineAbove(commentEl(el, "deep"));
		expect(line?.dataset.newLine).toBe("17");
	});

	it("counts each file's comments in its header", async () => {
		const el = await mount(<DiffView diff={DIFF} comments={COMMENTS} />);
		const count = (key: string) =>
			section(el, key).querySelector("[data-diff-comment-count]")?.textContent;
		expect(count("src/app.ts")).toBe("4 comments");
		expect(count("docs/new.md")).toBe("1 comment");
		expect(count("old.go")).toBeUndefined();
	});

	it("renders the consumer's content inside anker's frame", async () => {
		const renderComment = vi.fn(
			(comment: DiffComment, file: DiffFile | null) => (
				<span data-testid="own">
					{comment.id} in {file?.path ?? "nowhere"}
				</span>
			),
		);
		const el = await mount(
			<DiffView
				diff={DIFF}
				comments={COMMENTS}
				renderComment={renderComment}
			/>,
		);
		expect(commentEl(el, "on-added").textContent).toBe(
			"on-added in src/app.ts",
		);
		expect(commentEl(el, "elsewhere").textContent).toContain(
			"elsewhere in nowhere",
		);
		// The frame stays anker's: focusable, named, toned.
		expect(commentEl(el, "on-added").tabIndex).toBe(0);
		expect(commentEl(el, "on-added").dataset.tone).toBe("danger");
		expect(renderComment).toHaveBeenCalledWith(
			expect.objectContaining({ id: "on-file" }),
			expect.objectContaining({ key: "docs/new.md" }),
		);
	});

	it("hides a collapsed file's comments with its lines", async () => {
		const el = await mount(
			<DiffView diff={DIFF} comments={COMMENTS} defaultCollapsed />,
		);
		expect(
			el.querySelector("section[data-diff-file] [data-diff-comment]"),
		).toBeNull();
		// The comment on a file outside the diff stays.
		expect(el.querySelector("[data-diff-comment='elsewhere']")).not.toBeNull();
		expect(
			section(el, "src/app.ts").querySelector("[data-diff-comment-count]")
				?.textContent,
		).toBe("4 comments");
	});
});

describe("DiffView keyboard jumps", () => {
	const COMMENTS: DiffComment[] = [
		{ id: "c1", path: "src/app.ts", line: 11, body: "one" },
		{ id: "c0", path: "src/app.ts", line: 999, body: "file level" },
		{ id: "c2", path: "old.go", line: 1, side: "old", body: "two" },
		{ id: "c3", path: "elsewhere.ts", body: "three" },
	];
	const focused = () => document.activeElement as HTMLElement | null;
	const focusedFile = () => focused()?.closest("section")?.dataset.diffFile;

	it("j and k move between files", async () => {
		const el = await mount(<DiffView diff={DIFF} />);
		const first = el.querySelector<HTMLElement>("section h3 button");
		first?.focus();
		await userEvent.keyboard("j");
		expect(focusedFile()).toBe("docs/new.md");
		expect(focused()?.tagName).toBe("BUTTON");
		await userEvent.keyboard("jj");
		expect(focusedFile()).toBe("b.ts");
		await userEvent.keyboard("k");
		expect(focusedFile()).toBe("old.go");
		// At the last file, j stays put.
		await userEvent.keyboard("jjjj");
		expect(focusedFile()).toBe("logo.png");
	});

	it("n and p move between comments in reading order, file level first", async () => {
		const el = await mount(<DiffView diff={DIFF} comments={COMMENTS} />);
		el.querySelector<HTMLElement>("section h3 button")?.focus();
		await userEvent.keyboard("n");
		expect(focused()?.dataset.diffComment).toBe("c0");
		await userEvent.keyboard("n");
		expect(focused()?.dataset.diffComment).toBe("c1");
		await userEvent.keyboard("n");
		expect(focused()?.dataset.diffComment).toBe("c2");
		await userEvent.keyboard("n");
		expect(focused()?.dataset.diffComment).toBe("c3");
		await userEvent.keyboard("pp");
		expect(focused()?.dataset.diffComment).toBe("c1");
		// From a comment, j goes on to the next file.
		await userEvent.keyboard("j");
		expect(focusedFile()).toBe("docs/new.md");
	});

	it("k from inside a file goes to the previous file, not its own header", async () => {
		const el = await mount(<DiffView diff={DIFF} comments={COMMENTS} />);
		el.querySelector<HTMLElement>("[data-diff-comment='c2']")?.focus();
		expect(focusedFile()).toBe("old.go");
		await userEvent.keyboard("k");
		expect(focusedFile()).toBe("docs/new.md");
	});

	it("leaves keys to a menu or listbox inside a comment", async () => {
		const el = await mount(
			<DiffView
				diff={DIFF}
				comments={COMMENTS}
				renderComment={(c) => (
					<div role="menu" aria-label={`Actions ${c.id}`}>
						<button type="button" role="menuitem">
							New for {c.id}
						</button>
					</div>
				)}
			/>,
		);
		const item = el.querySelector<HTMLElement>("[role='menuitem']");
		item?.focus();
		await userEvent.keyboard("nj");
		expect(focused()).toBe(item);
	});

	it("jumps from focus inside a comment's own content", async () => {
		const el = await mount(
			<DiffView
				diff={DIFF}
				comments={COMMENTS}
				renderComment={(c) => <button type="button">Reply to {c.id}</button>}
			/>,
		);
		const reply = [...el.querySelectorAll("button")].find(
			(b) => b.textContent === "Reply to c1",
		);
		reply?.focus();
		await userEvent.keyboard("n");
		expect(focused()?.dataset.diffComment).toBe("c2");
		reply?.focus();
		await userEvent.keyboard("p");
		expect(focused()?.dataset.diffComment).toBe("c0");
	});

	it("leaves typing alone, and does nothing when turned off", async () => {
		const el = await mount(
			<>
				<DiffView
					diff={DIFF}
					comments={COMMENTS}
					renderComment={(c) => <input aria-label={`Reply ${c.id}`} />}
				/>
				<DiffView diff={DIFF} keyboardNavigation={false} />
			</>,
		);
		const input = el.querySelector<HTMLInputElement>("input");
		input?.focus();
		await userEvent.keyboard("nj");
		expect(focused()).toBe(input);
		expect(input?.value).toBe("nj");

		const off = el.querySelectorAll<HTMLElement>("[data-diff-view]")[1];
		const toggle = off.querySelector<HTMLElement>("section h3 button");
		toggle?.focus();
		await userEvent.keyboard("jn");
		expect(focused()).toBe(toggle);
	});

	it("focuses the file heading in the compact variant", async () => {
		const el = await mount(<DiffView diff={DIFF} variant="compact" />);
		const headings = el.querySelectorAll<HTMLElement>("section h3");
		headings[0].focus();
		await userEvent.keyboard("j");
		expect(focused()).toBe(headings[1]);
	});
});

describe.each<ColorMode>([
	"light",
	"dark",
])("DiffView comment colours in %s mode", (mode) => {
	const rgb = (name: string) => toComputedRgb(resolveColor(system, name, mode));

	async function mountToned() {
		const Wrap = mode === "dark" ? DarkMode : LightMode;
		const tones = ["danger", "warning", "success", "info", "neutral"] as const;
		return mount(
			<Wrap>
				<DiffView
					diff={DIFF}
					comments={[
						...tones.map((tone) => ({
							id: tone,
							path: "src/app.ts",
							line: 11,
							tone,
							label: tone,
							body: tone,
						})),
						{ id: "untoned", path: "src/app.ts", line: 12, body: "x" },
					]}
				/>
			</Wrap>,
		);
	}

	it("edges each comment in its tone's border colour", async () => {
		const el = await mountToned();
		const edge = (id: string) =>
			getComputedStyle(
				el.querySelector(`[data-diff-comment='${id}']`) as HTMLElement,
			).borderInlineStartColor;
		for (const tone of ["danger", "warning", "success", "info"]) {
			expect(edge(tone)).toBe(rgb(`${tone}.border`));
		}
		expect(edge("neutral")).toBe(rgb("border-emphasized"));
		expect(edge("untoned")).toBe(rgb("border-emphasized"));
	});

	it("sets comment rows apart from code on the subtle surface", async () => {
		const el = await mountToned();
		const td = el.querySelector<HTMLElement>("tr[data-diff-row='comments'] td");
		expect(getComputedStyle(td as HTMLElement).backgroundColor).toBe(
			rgb("bg-subtle"),
		);
		const comment = el.querySelector<HTMLElement>(
			"[data-diff-comment='danger']",
		);
		expect(getComputedStyle(comment as HTMLElement).color).toBe(rgb("default"));
	});

	it("keeps every tone edge visible against the comment surface", () => {
		for (const name of [
			"danger.border",
			"warning.border",
			"success.border",
			"info.border",
			"border-emphasized",
		]) {
			expect(
				contrastRatio(
					resolveColor(system, name, mode),
					resolveColor(system, "bg-subtle", mode),
				),
			).toBeGreaterThan(1.2);
		}
	});
});
