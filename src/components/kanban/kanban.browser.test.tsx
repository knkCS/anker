// Kanban as a consumer sees it (#325), in a real browser.
//
// The rendered structure (columns as labelled lists with counts, cards as
// links or buttons), the keyboard (arrow keys between cards and columns,
// Enter opens a card) and the card tones' resolved colours in light and dark
// mode — all asked of Chromium (the `layout` project of `vitest.config.ts`),
// because jsdom resolves neither CSS variables nor real key activation.
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
import { Kanban, type KanbanCardTone, type KanbanColumn } from ".";

interface Task {
	id: string;
	title: string;
	tone?: KanbanCardTone;
	href?: string;
}

let root: Root | undefined;
let host: HTMLDivElement | undefined;

// A link card that a test opens must not navigate the test page away.
const stayOnPage = (event: MouseEvent) => {
	if ((event.target as Element | null)?.closest("a")) event.preventDefault();
};

async function mount(node: ReactNode): Promise<HTMLDivElement> {
	host = document.createElement("div");
	host.addEventListener("click", stayOnPage);
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

const COLUMNS: KanbanColumn<Task>[] = [
	{
		id: "ready",
		title: "Ready",
		items: [
			{ id: "t1", title: "Write the parser", href: "/tasks/t1" },
			{ id: "t2", title: "Review the plan", tone: "attention" },
			{ id: "t3", title: "Ship it" },
		],
		action: <Button size="xs">Add</Button>,
	},
	{ id: "waiting", title: "Waiting", items: [] },
	{
		id: "review",
		title: "In review",
		items: [
			{ id: "t4", title: "Approve the spec", tone: "quiet" },
			{ id: "t5", title: "Check the docs" },
		],
	},
];

function Board({
	columns = COLUMNS,
	onOpen = () => {},
	...rest
}: {
	columns?: KanbanColumn<Task>[];
	onOpen?: (id: string) => void;
	collapseEmptyColumns?: boolean;
	emptyState?: ReactNode | false;
	virtualizeAbove?: number;
	columnMaxHeight?: string;
}) {
	return (
		<Kanban
			aria-label="Spec board"
			columns={columns}
			getItemKey={(task) => task.id}
			renderCard={(task) => (
				<Kanban.Card
					tone={task.tone}
					href={task.href}
					onClick={task.href ? undefined : () => onOpen(task.id)}
				>
					<Kanban.CardMeta>#{task.id}</Kanban.CardMeta>
					<Kanban.CardTitle>{task.title}</Kanban.CardTitle>
				</Kanban.Card>
			)}
			{...rest}
		/>
	);
}

const lists = (el: HTMLElement) => [
	...el.querySelectorAll<HTMLElement>("[role='list'], ul"),
];

const card = (el: HTMLElement, name: string) => {
	const found = [
		...el.querySelectorAll<HTMLElement>("[data-kanban-card]"),
	].find((c) => c.textContent?.includes(name));
	if (!found) throw new Error(`no card ${name}`);
	return found;
};

describe("Kanban structure", () => {
	it("renders one labelled list per column, announcing its count", async () => {
		const el = await mount(<Board />);
		const board = el.querySelector("[role='group']");
		expect(board?.getAttribute("aria-label")).toBe("Spec board");
		expect(lists(el).map((l) => l.getAttribute("aria-label"))).toEqual([
			"Ready, 3 cards",
			"Waiting, 0 cards",
			"In review, 2 cards",
		]);
		const items = lists(el)[0].querySelectorAll("li");
		expect(items).toHaveLength(3);
		expect(items[1].getAttribute("aria-posinset")).toBe("2");
		expect(items[1].getAttribute("aria-setsize")).toBe("3");
	});

	it("shows each column's title, visible count and action", async () => {
		const el = await mount(<Board />);
		const ready = el.querySelector<HTMLElement>("[data-kanban-column='ready']");
		expect(ready?.querySelector("h3")?.textContent).toBe("Ready");
		expect(ready?.textContent).toContain("3");
		expect(ready?.querySelector("button")?.textContent).toBe("Add");
	});

	it("a column's count can come from the consumer (a server total)", async () => {
		const el = await mount(
			<Board
				columns={[
					{
						id: "done",
						title: "Done",
						items: [{ id: "d1", title: "Old" }],
						count: 140,
					},
				]}
			/>,
		);
		expect(lists(el)[0].getAttribute("aria-label")).toBe("Done, 140 cards");
		expect(lists(el)[0].querySelector("li")?.getAttribute("aria-setsize")).toBe(
			"140",
		);
	});

	it("an empty column shows its empty state", async () => {
		const el = await mount(<Board />);
		const waiting = el.querySelector<HTMLElement>(
			"[data-kanban-column='waiting']",
		);
		expect(waiting?.textContent).toContain("No cards");
	});

	it("renders a card with href as a link and with onClick as a button", async () => {
		const el = await mount(<Board />);
		const link = card(el, "Write the parser");
		expect(link.tagName).toBe("A");
		expect(link.getAttribute("href")).toBe("/tasks/t1");
		const button = card(el, "Review the plan");
		expect(button.tagName).toBe("BUTTON");
		expect(button.getAttribute("type")).toBe("button");
	});

	it("renders a router link as the card with asChild, keeping board focus", async () => {
		const el = await mount(
			<Kanban
				columns={[{ id: "c", title: "C", items: ["a", "b"] }]}
				getItemKey={(item) => item}
				renderCard={(item) => (
					<Kanban.Card asChild>
						<a href={`/router/${item}`} data-router-link="">
							{item}
						</a>
					</Kanban.Card>
				)}
			/>,
		);
		const first = card(el, "a");
		expect(first.hasAttribute("data-router-link")).toBe(true);
		expect(first.tabIndex).toBe(0);
		first.focus();
		await userEvent.keyboard("{ArrowDown}");
		expect(document.activeElement).toBe(card(el, "b"));
	});

	it("collapses empty columns to a narrow strip on request", async () => {
		const el = await mount(<Board collapseEmptyColumns />);
		const waiting = el.querySelector<HTMLElement>(
			"[data-kanban-column='waiting']",
		);
		const ready = el.querySelector<HTMLElement>("[data-kanban-column='ready']");
		expect(waiting?.hasAttribute("data-collapsed")).toBe(true);
		expect(ready?.hasAttribute("data-collapsed")).toBe(false);
		expect(waiting?.textContent).not.toContain("No cards");
		expect(waiting?.getBoundingClientRect().width).toBeLessThan(
			(ready?.getBoundingClientRect().width ?? 0) / 2,
		);
		// The list stays, so assistive tech still hears the column.
		expect(lists(waiting as HTMLElement)[0].getAttribute("aria-label")).toBe(
			"Waiting, 0 cards",
		);
	});

	it("shows the empty-board state when no column has cards", async () => {
		const empty = COLUMNS.map((c) => ({ ...c, items: [] }));
		const el = await mount(<Board columns={empty} />);
		expect(el.textContent).toContain("Nothing on the board");
		expect(lists(el)).toHaveLength(0);
	});

	it("takes a custom empty-board state, or keeps the columns with false", async () => {
		const empty = COLUMNS.map((c) => ({ ...c, items: [] }));
		const el = await mount(
			<>
				<Board columns={empty} emptyState={<p>No Tasks yet</p>} />
				<Board columns={empty} emptyState={false} />
			</>,
		);
		expect(el.textContent).toContain("No Tasks yet");
		expect(lists(el)).toHaveLength(3);
	});

	it("scrolls horizontally instead of squeezing columns on a narrow screen", async () => {
		const el = await mount(
			<div style={{ width: 360 }}>
				<Board />
			</div>,
		);
		const board = el.querySelector<HTMLElement>("[role='group']");
		if (!board) throw new Error("no board");
		expect(getComputedStyle(board).overflowX).toBe("auto");
		expect(board.scrollWidth).toBeGreaterThan(board.clientWidth);
	});

	it("shows no drag affordance on a read-only board", async () => {
		const el = await mount(<Board />);
		expect(el.querySelector("[draggable='true']")).toBeNull();
		expect(el.querySelector("[aria-roledescription]")).toBeNull();
		expect(el.querySelector("[data-drag-handle]")).toBeNull();
		for (const c of el.querySelectorAll<HTMLElement>("[data-kanban-card]")) {
			expect(getComputedStyle(c).cursor).not.toMatch(/grab|move/);
		}
	});
});

describe("Kanban keyboard", () => {
	it("is one tab stop: only the first card is tabbable", async () => {
		const el = await mount(<Board />);
		const tabbable = [
			...el.querySelectorAll<HTMLElement>("[data-kanban-card]"),
		].filter((c) => c.tabIndex === 0);
		expect(tabbable.map((c) => c.textContent)).toEqual(["#t1Write the parser"]);
	});

	it("moves between cards with ArrowUp / ArrowDown, Home / End", async () => {
		const el = await mount(<Board />);
		card(el, "Write the parser").focus();
		await userEvent.keyboard("{ArrowDown}");
		expect(document.activeElement).toBe(card(el, "Review the plan"));
		await userEvent.keyboard("{End}");
		expect(document.activeElement).toBe(card(el, "Ship it"));
		await userEvent.keyboard("{ArrowUp}");
		expect(document.activeElement).toBe(card(el, "Review the plan"));
		await userEvent.keyboard("{Home}");
		expect(document.activeElement).toBe(card(el, "Write the parser"));
	});

	it("moves between columns with ArrowLeft / ArrowRight, skipping empty ones", async () => {
		const el = await mount(<Board />);
		card(el, "Review the plan").focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(document.activeElement).toBe(card(el, "Check the docs"));
		await userEvent.keyboard("{ArrowLeft}");
		expect(document.activeElement).toBe(card(el, "Review the plan"));
	});

	it("keeps the roving tab stop on the card last focused", async () => {
		const el = await mount(<Board />);
		card(el, "Write the parser").focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(card(el, "Approve the spec").tabIndex).toBe(0);
		expect(card(el, "Write the parser").tabIndex).toBe(-1);
	});

	it("opens a button card with Enter", async () => {
		const onOpen = vi.fn();
		const el = await mount(<Board onOpen={onOpen} />);
		card(el, "Write the parser").focus();
		await userEvent.keyboard("{ArrowDown}");
		await userEvent.keyboard("{Enter}");
		expect(onOpen).toHaveBeenCalledWith("t2");
	});

	it("opens a link card with Enter", async () => {
		const onNavigate = vi.fn();
		const el = await mount(<Board />);
		const link = card(el, "Write the parser");
		link.addEventListener("click", onNavigate);
		link.focus();
		await userEvent.keyboard("{Enter}");
		expect(onNavigate).toHaveBeenCalledTimes(1);
	});
});

describe.each<ColorMode>([
	"light",
	"dark",
])("Kanban card tones in %s mode", (mode) => {
	const token = (name: string) => resolveColor(system, name, mode);
	const rgb = (name: string) => toComputedRgb(token(name));

	async function tones() {
		const Wrap = mode === "dark" ? DarkMode : LightMode;
		const el = await mount(
			<Wrap>
				<Kanban.Card data-testid="default">Default</Kanban.Card>
				<Kanban.Card data-testid="quiet" tone="quiet">
					Quiet
				</Kanban.Card>
				<Kanban.Card data-testid="attention" tone="attention">
					Attention
				</Kanban.Card>
			</Wrap>,
		);
		const style = (id: string) => {
			const found = el.querySelector<HTMLElement>(`[data-testid='${id}']`);
			if (!found) throw new Error(`no ${id}`);
			return getComputedStyle(found);
		};
		return style;
	}

	it("default: the surface with the plain border", async () => {
		const s = (await tones())("default");
		expect(s.backgroundColor).toBe(rgb("bg-surface"));
		expect(s.borderTopStyle).toBe("solid");
		expect(s.borderTopColor).toBe(rgb("border"));
		expect(s.color).toBe(rgb("default"));
	});

	it("quiet: the sunken canvas surface behind a dashed border", async () => {
		const s = (await tones())("quiet");
		expect(s.backgroundColor).toBe(rgb("bg-canvas"));
		expect(s.borderTopStyle).toBe("dashed");
		expect(s.borderTopColor).toBe(rgb("border-emphasized"));
	});

	it("quiet stays legible: full-strength text at AA, a border that shows", async () => {
		const s = (await tones())("quiet");
		expect(s.color).toBe(rgb("default"));
		expect(s.opacity).toBe("1");
		expect(
			contrastRatio(token("default"), token("bg-canvas")),
		).toBeGreaterThanOrEqual(AA_TEXT);
		expect(
			contrastRatio(token("border-emphasized"), token("bg-canvas")),
		).toBeGreaterThan(1.4);
		// And it reads as a different surface from a default card.
		expect(token("bg-canvas")).not.toBe(token("bg-surface"));
	});

	it("attention: the surface with a warning edge on the inline start", async () => {
		const s = (await tones())("attention");
		expect(s.backgroundColor).toBe(rgb("bg-surface"));
		expect(s.borderLeftColor).toBe(rgb("warning.solid"));
		expect(s.borderLeftWidth).toBe("4px");
		expect(s.borderTopColor).toBe(rgb("border"));
	});
});

// A column with hundreds of cards (#326) renders only the cards in its
// scroll window; the arrow keys still reach every card.
const many = (prefix: string, n: number, tone?: KanbanCardTone): Task[] =>
	Array.from({ length: n }, (_, i) => ({
		id: `${prefix}${i + 1}`,
		title: `${prefix} card ${i + 1}`,
		tone,
	}));

const viewportOf = (list: HTMLElement) => {
	const viewport = list.parentElement;
	if (!viewport) throw new Error("no viewport");
	return viewport;
};

const focused = () =>
	(document.activeElement as HTMLElement | null)?.closest("li");

describe("Kanban long columns", () => {
	const LONG: KanbanColumn<Task>[] = [
		{ id: "short", title: "Short", items: many("s", 3) },
		{ id: "long", title: "Backlog", items: many("b", 1000) },
		{ id: "other", title: "Other", items: many("o", 1000) },
	];

	it("renders only the visible window of a 1,000-card column", async () => {
		const el = await mount(<Board columns={LONG} />);
		const list = lists(el)[1];
		expect(list.getAttribute("aria-label")).toBe("Backlog, 1000 cards");
		const items = list.querySelectorAll("li");
		expect(items.length).toBeGreaterThan(0);
		expect(items.length).toBeLessThan(60);
		expect(items[0].getAttribute("aria-posinset")).toBe("1");
		expect(items[0].getAttribute("aria-setsize")).toBe("1000");
		// The column scrolls within itself rather than growing the page.
		const viewport = viewportOf(list);
		expect(getComputedStyle(viewport).overflowY).toBe("auto");
		expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
		// A short column still renders every card.
		expect(lists(el)[0].querySelectorAll("li")).toHaveLength(3);
	});

	it("reveals the rest of the column on scroll", async () => {
		const el = await mount(<Board columns={LONG} />);
		const list = lists(el)[1];
		const viewport = viewportOf(list);
		viewport.scrollTop = viewport.scrollHeight;
		await vi.waitFor(() => {
			const last = [...list.querySelectorAll("li")].find(
				(li) => li.getAttribute("aria-posinset") === "1000",
			);
			expect(last?.textContent).toContain("b card 1000");
		});
		expect(list.querySelectorAll("li").length).toBeLessThan(60);
	});

	it("hands renderCard the card's index in the whole column", async () => {
		const renderCard = vi.fn((task: Task) => (
			<Kanban.Card>{task.title}</Kanban.Card>
		));
		const el = await mount(
			<Kanban
				columns={[LONG[1]]}
				getItemKey={(task) => task.id}
				renderCard={renderCard}
			/>,
		);
		const viewport = viewportOf(lists(el)[0]);
		viewport.scrollTop = viewport.scrollHeight;
		await vi.waitFor(() =>
			expect(renderCard).toHaveBeenCalledWith(
				expect.objectContaining({ id: "b1000" }),
				{ columnId: "long", index: 999 },
			),
		);
		expect(renderCard).not.toHaveBeenCalledWith(
			expect.objectContaining({ id: "b500" }),
			expect.anything(),
		);
	});

	it("End and Home reach the ends of the column outside the window", async () => {
		const el = await mount(<Board columns={LONG} />);
		card(el, "b card 1").focus();
		await userEvent.keyboard("{End}");
		await vi.waitFor(() =>
			expect(focused()?.getAttribute("aria-posinset")).toBe("1000"),
		);
		expect(document.activeElement?.textContent).toContain("b card 1000");
		await userEvent.keyboard("{Home}");
		await vi.waitFor(() =>
			expect(focused()?.getAttribute("aria-posinset")).toBe("1"),
		);
	});

	it("ArrowDown walks past the initial window", async () => {
		const el = await mount(<Board columns={LONG} />);
		const initial = lists(el)[1].querySelectorAll("li").length;
		card(el, "b card 1").focus();
		for (let i = 0; i < initial + 10; i++) {
			await userEvent.keyboard("{ArrowDown}");
		}
		await vi.waitFor(() =>
			expect(focused()?.getAttribute("aria-posinset")).toBe(
				String(initial + 11),
			),
		);
		expect(card(el, `b card ${initial + 11}`).tabIndex).toBe(0);
	});

	it("ArrowRight keeps the row between long columns, outside the window", async () => {
		const el = await mount(<Board columns={LONG} />);
		card(el, "b card 1").focus();
		await userEvent.keyboard("{End}");
		await vi.waitFor(() =>
			expect(focused()?.getAttribute("aria-posinset")).toBe("1000"),
		);
		await userEvent.keyboard("{ArrowRight}");
		await vi.waitFor(() =>
			expect(document.activeElement?.textContent).toContain("o card 1000"),
		);
		await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
		await vi.waitFor(() =>
			expect(document.activeElement?.textContent).toContain("s card 3"),
		);
	});

	it("keeps the focused card (the tab stop) when it scrolls out of view", async () => {
		const el = await mount(<Board columns={LONG} />);
		const first = card(el, "b card 1");
		first.focus();
		const viewport = viewportOf(lists(el)[1]);
		viewport.scrollTop = viewport.scrollHeight;
		await vi.waitFor(() =>
			expect(
				[...lists(el)[1].querySelectorAll("li")].some(
					(li) => li.getAttribute("aria-posinset") === "1000",
				),
			).toBe(true),
		);
		expect(first.isConnected).toBe(true);
		expect(document.activeElement).toBe(first);
		expect(first.tabIndex).toBe(0);
	});

	it("virtualises from virtualizeAbove cards", async () => {
		const el = await mount(
			<Board
				columns={[{ id: "few", title: "Few", items: many("f", 5) }]}
				virtualizeAbove={3}
				columnMaxHeight="10rem"
			/>,
		);
		const viewport = viewportOf(lists(el)[0]);
		expect(getComputedStyle(viewport).overflowY).toBe("auto");
		expect(viewport.getBoundingClientRect().height).toBeLessThanOrEqual(160);
	});
});

describe.each<ColorMode>([
	"light",
	"dark",
])("Kanban long column in %s mode", (mode) => {
	const rgb = (name: string) => toComputedRgb(resolveColor(system, name, mode));

	it("draws its cards with the tone tokens and no surface of its own", async () => {
		const Wrap = mode === "dark" ? DarkMode : LightMode;
		const el = await mount(
			<Wrap>
				<Board
					columns={[
						{ id: "a", title: "Alerts", items: many("a", 500, "attention") },
					]}
				/>
			</Wrap>,
		);
		const style = getComputedStyle(card(el, "a card 1"));
		expect(style.backgroundColor).toBe(rgb("bg-surface"));
		expect(style.borderLeftColor).toBe(rgb("warning.solid"));
		expect(style.color).toBe(rgb("default"));
		const viewport = viewportOf(lists(el)[0]);
		expect(getComputedStyle(viewport).backgroundColor).toBe("rgba(0, 0, 0, 0)");
	});
});
