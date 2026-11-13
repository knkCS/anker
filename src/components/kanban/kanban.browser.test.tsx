// Kanban as a consumer sees it (#325), in a real browser.
//
// The rendered structure (columns as labelled lists with counts, cards as
// links or buttons), the keyboard (arrow keys between cards and columns,
// Enter opens a card) and the card tones' resolved colours in light and dark
// mode — all asked of Chromium (the `layout` project of `vitest.config.ts`),
// because jsdom resolves neither CSS variables nor real key activation.
import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
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
import {
	Kanban,
	type KanbanCardTone,
	type KanbanColumn,
	type KanbanMove,
	type KanbanProps,
} from ".";

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
	onMove?: KanbanProps<Task>["onMove"];
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

	it("keeps the focused card when its column crosses virtualizeAbove", async () => {
		const few = (n: number) => [{ id: "c", title: "C", items: many("c", n) }];
		const el = await mount(<Board columns={few(3)} virtualizeAbove={3} />);
		const focusedCard = card(el, "c card 2");
		focusedCard.focus();
		await act(async () => {
			root?.render(
				<Provider forcedTheme="light">
					<Board columns={few(4)} virtualizeAbove={3} />
				</Provider>,
			);
		});
		expect(getComputedStyle(viewportOf(lists(el)[0])).overflowY).toBe("auto");
		expect(focusedCard.isConnected).toBe(true);
		expect(document.activeElement).toBe(focusedCard);
	});

	it("stays one tab stop with several long columns", async () => {
		const el = await mount(
			<>
				<Board columns={LONG} />
				<button type="button">After</button>
			</>,
		);
		card(el, "s card 1").focus();
		await userEvent.tab();
		expect(document.activeElement?.textContent).toBe("After");
	});

	it("measures cards of different heights so they never overlap", async () => {
		const el = await mount(
			<Kanban
				columns={[LONG[1]]}
				getItemKey={(task) => task.id}
				renderCard={(task, { index }) => (
					<Kanban.Card>
						<Kanban.CardTitle>{task.title}</Kanban.CardTitle>
						{index % 2 === 0 ? <div style={{ height: 120 }} /> : null}
					</Kanban.Card>
				)}
			/>,
		);
		await vi.waitFor(() => {
			const rects = [
				...lists(el)[0].querySelectorAll<HTMLElement>("[data-kanban-card]"),
			].map((c) => c.getBoundingClientRect());
			expect(rects.length).toBeGreaterThan(2);
			for (let i = 1; i < rects.length; i++) {
				expect(rects[i].top - rects[i - 1].bottom).toBeCloseTo(8, 0);
			}
		});
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

// An editable board (#327): `onMove` makes cards draggable with the pointer
// and the keyboard, and the consumer can veto a move.
type Move = KanbanMove<Task>;

function applyMove(columns: KanbanColumn<Task>[], move: Move) {
	const next = columns.map((c) => ({ ...c, items: [...c.items] }));
	const from = next.find((c) => c.id === move.from.columnId);
	const to = next.find((c) => c.id === move.to.columnId);
	if (!from || !to) return columns;
	const [item] = from.items.splice(move.from.index, 1);
	to.items.splice(move.to.index, 0, item);
	return next;
}

function EditableBoard({
	initial = COLUMNS,
	onMove,
	veto = false,
	onOpen = () => {},
	...rest
}: {
	initial?: KanbanColumn<Task>[];
	onMove: (move: Move) => void;
	veto?: boolean;
	onOpen?: (id: string) => void;
	columnMaxHeight?: string;
}) {
	const [columns, setColumns] = useState(initial);
	return (
		<Board
			columns={columns}
			onOpen={onOpen}
			onMove={(move) => {
				onMove(move);
				if (veto) return false;
				setColumns((current) => applyMove(current, move));
			}}
			{...rest}
		/>
	);
}

const titlesIn = (el: HTMLElement, columnId: string) =>
	[
		...el.querySelectorAll<HTMLElement>(
			`[data-kanban-column='${columnId}'] [data-kanban-card]`,
		),
	].map((c) => c.textContent?.replace(/^#t\d+/, ""));

const liveRegion = (el: HTMLElement) =>
	el.querySelector("[role='status'][aria-live]")?.textContent ?? "";

/** Waits for the lazily loaded drag-and-drop layer to wire the cards. */
async function editable(el: HTMLElement) {
	await vi.waitFor(() =>
		expect(el.querySelector("[data-draggable]")).not.toBeNull(),
	);
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const center = (element: Element) => {
	const r = element.getBoundingClientRect();
	return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Drags `source` to `target` with the mouse, in small steps as a hand would. */
async function mouseDrag(
	source: HTMLElement,
	target: { x: number; y: number },
) {
	const start = center(source);
	const fire = (type: string, on: EventTarget, at: { x: number; y: number }) =>
		on.dispatchEvent(
			new MouseEvent(type, {
				bubbles: true,
				cancelable: true,
				clientX: at.x,
				clientY: at.y,
				button: 0,
				buttons: 1,
			}),
		);
	fire("mousedown", source, start);
	const steps = 12;
	for (let i = 1; i <= steps; i++) {
		fire("mousemove", document, {
			x: start.x + ((target.x - start.x) * i) / steps,
			y: start.y + ((target.y - start.y) * i) / steps,
		});
		await frame();
	}
	await frame();
	fire("mouseup", document, target);
	await frame();
}

describe("Kanban drag and drop", () => {
	it("marks cards draggable once onMove is given", async () => {
		const el = await mount(<EditableBoard onMove={() => {}} />);
		await editable(el);
		for (const c of el.querySelectorAll<HTMLElement>("[data-kanban-card]")) {
			expect(c.hasAttribute("data-draggable")).toBe(true);
			expect(getComputedStyle(c).cursor).toBe("grab");
			// Each card points at the keyboard instructions.
			const id = c.getAttribute("aria-describedby") ?? "";
			expect(document.getElementById(id)?.textContent).toMatch(/space/i);
		}
	});

	it("moves a card to another column with the keyboard", async () => {
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} />);
		await editable(el);
		card(el, "Review the plan").focus();
		await userEvent.keyboard(" ");
		expect(card(el, "Review the plan").hasAttribute("data-grabbed")).toBe(true);
		expect(liveRegion(el)).toContain("Picked up card at position 2 of 3");
		// Into the empty column, then on to the next, then down a place.
		await userEvent.keyboard("{ArrowRight}");
		await vi.waitFor(() =>
			expect(titlesIn(el, "waiting")).toEqual(["Review the plan"]),
		);
		expect(document.activeElement).toBe(card(el, "Review the plan"));
		await userEvent.keyboard("{ArrowRight}");
		await vi.waitFor(() =>
			expect(titlesIn(el, "review")).toEqual([
				"Review the plan",
				"Approve the spec",
				"Check the docs",
			]),
		);
		await userEvent.keyboard("{ArrowDown}");
		await vi.waitFor(() =>
			expect(titlesIn(el, "review")[1]).toBe("Review the plan"),
		);
		expect(liveRegion(el)).toContain("position 2 of 3 in In review");
		expect(onMove).not.toHaveBeenCalled();
		await userEvent.keyboard(" ");
		expect(onMove).toHaveBeenCalledTimes(1);
		expect(onMove).toHaveBeenCalledWith(
			expect.objectContaining({
				itemKey: "t2",
				item: expect.objectContaining({ id: "t2" }),
				from: { columnId: "ready", index: 1 },
				to: { columnId: "review", index: 1 },
			}),
		);
		await vi.waitFor(() =>
			expect(titlesIn(el, "ready")).toEqual(["Write the parser", "Ship it"]),
		);
		expect(titlesIn(el, "review")).toEqual([
			"Approve the spec",
			"Review the plan",
			"Check the docs",
		]);
		expect(card(el, "Review the plan").hasAttribute("data-grabbed")).toBe(
			false,
		);
		expect(document.activeElement).toBe(card(el, "Review the plan"));
		expect(liveRegion(el)).toContain("Card dropped at position 2 of 3");
	});

	it("reorders within a column with the keyboard and drops with Enter", async () => {
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} />);
		await editable(el);
		card(el, "Write the parser").focus();
		await userEvent.keyboard(" ");
		await userEvent.keyboard("{End}");
		await vi.waitFor(() =>
			expect(titlesIn(el, "ready")).toEqual([
				"Review the plan",
				"Ship it",
				"Write the parser",
			]),
		);
		await userEvent.keyboard("{ArrowUp}");
		await userEvent.keyboard("{Enter}");
		expect(onMove).toHaveBeenCalledWith(
			expect.objectContaining({
				from: { columnId: "ready", index: 0 },
				to: { columnId: "ready", index: 1 },
			}),
		);
		await vi.waitFor(() =>
			expect(titlesIn(el, "ready")).toEqual([
				"Review the plan",
				"Write the parser",
				"Ship it",
			]),
		);
	});

	it("snaps a vetoed move back, keeping focus on the card", async () => {
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} veto />);
		await editable(el);
		card(el, "Ship it").focus();
		await userEvent.keyboard(" ");
		await userEvent.keyboard("{ArrowRight}{ArrowRight}");
		await vi.waitFor(() => expect(titlesIn(el, "review")).toHaveLength(3));
		await userEvent.keyboard(" ");
		expect(onMove).toHaveBeenCalledTimes(1);
		await vi.waitFor(() =>
			expect(titlesIn(el, "ready")).toEqual([
				"Write the parser",
				"Review the plan",
				"Ship it",
			]),
		);
		expect(titlesIn(el, "review")).toHaveLength(2);
		expect(document.activeElement).toBe(card(el, "Ship it"));
		expect(liveRegion(el)).toContain(
			"Move not allowed. Card returned to position 3 of 3 in Ready",
		);
	});

	it("cancels with Escape without calling onMove", async () => {
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} />);
		await editable(el);
		card(el, "Write the parser").focus();
		await userEvent.keyboard(" ");
		await userEvent.keyboard("{ArrowDown}");
		await vi.waitFor(() =>
			expect(titlesIn(el, "ready")[1]).toBe("Write the parser"),
		);
		await userEvent.keyboard("{Escape}");
		await vi.waitFor(() =>
			expect(titlesIn(el, "ready")[0]).toBe("Write the parser"),
		);
		expect(onMove).not.toHaveBeenCalled();
		expect(liveRegion(el)).toContain("Move cancelled");
		expect(document.activeElement).toBe(card(el, "Write the parser"));
	});

	it("does not call onMove when a card is dropped where it started", async () => {
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} />);
		await editable(el);
		card(el, "Write the parser").focus();
		await userEvent.keyboard(" ");
		await userEvent.keyboard("{ArrowDown}{ArrowUp}");
		await userEvent.keyboard(" ");
		expect(onMove).not.toHaveBeenCalled();
	});

	it("keeps Enter opening a card and the arrow keys moving focus when nothing is picked up", async () => {
		const onOpen = vi.fn();
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} onOpen={onOpen} />);
		await editable(el);
		card(el, "Write the parser").focus();
		await userEvent.keyboard("{ArrowDown}");
		expect(document.activeElement).toBe(card(el, "Review the plan"));
		await userEvent.keyboard("{Enter}");
		expect(onOpen).toHaveBeenCalledWith("t2");
		// Space picks a button card up rather than opening it.
		onOpen.mockClear();
		await userEvent.keyboard(" ");
		expect(card(el, "Review the plan").hasAttribute("data-grabbed")).toBe(true);
		expect(onOpen).not.toHaveBeenCalled();
		await userEvent.keyboard(" ");
		expect(onOpen).not.toHaveBeenCalled();
		expect(onMove).not.toHaveBeenCalled();
	});

	it("stays one tab stop, and Tab away cancels a keyboard drag", async () => {
		const onMove = vi.fn();
		const el = await mount(
			<>
				<EditableBoard onMove={onMove} />
				<button type="button">After</button>
			</>,
		);
		await editable(el);
		const tabbable = [
			...el.querySelectorAll<HTMLElement>("[data-kanban-card]"),
		].filter((c) => c.tabIndex === 0);
		expect(tabbable).toHaveLength(1);
		card(el, "Write the parser").focus();
		await userEvent.keyboard(" ");
		await userEvent.keyboard("{ArrowRight}");
		await vi.waitFor(() =>
			expect(titlesIn(el, "waiting")).toEqual(["Write the parser"]),
		);
		await userEvent.tab();
		expect(document.activeElement?.textContent).toBe("After");
		await vi.waitFor(() => expect(titlesIn(el, "waiting")).toEqual([]));
		expect(onMove).not.toHaveBeenCalled();
	});

	it("cancels a keyboard drag on a click outside the board", async () => {
		const onMove = vi.fn();
		const el = await mount(
			<>
				<EditableBoard onMove={onMove} />
				<p data-testid="outside">Elsewhere</p>
			</>,
		);
		await editable(el);
		card(el, "Write the parser").focus();
		await userEvent.keyboard(" ");
		await userEvent.keyboard("{ArrowRight}");
		await vi.waitFor(() =>
			expect(titlesIn(el, "waiting")).toEqual(["Write the parser"]),
		);
		const outside = el.querySelector("[data-testid='outside']");
		outside?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
		await vi.waitFor(() => expect(titlesIn(el, "waiting")).toEqual([]));
		expect(onMove).not.toHaveBeenCalled();
	});

	it("keeps the drag's keys from reaching handlers around the board", async () => {
		const outer = vi.fn();
		// Where a Drawer or Modal listens for Escape.
		const onDocumentKey = (event: KeyboardEvent) => outer(event.key);
		document.addEventListener("keydown", onDocumentKey);
		onTestFinished(() =>
			document.removeEventListener("keydown", onDocumentKey),
		);
		const el = await mount(<EditableBoard onMove={() => {}} />);
		await editable(el);
		card(el, "Write the parser").focus();
		await userEvent.keyboard(" ");
		await userEvent.keyboard("{ArrowDown}");
		await userEvent.keyboard("{Escape}");
		expect(outer).not.toHaveBeenCalledWith("Escape");
		expect(outer).not.toHaveBeenCalledWith("ArrowDown");
	});

	it("ends a keyboard drag when the card leaves the board", async () => {
		let remove: () => void = () => {};
		function Removable() {
			const [columns, setColumns] = useState(COLUMNS);
			remove = () =>
				setColumns((current) =>
					current.map((c) => ({
						...c,
						items: c.items.filter((t) => t.id !== "t1"),
					})),
				);
			return <Board columns={columns} onMove={() => {}} />;
		}
		const el = await mount(<Removable />);
		await editable(el);
		card(el, "Write the parser").focus();
		await userEvent.keyboard(" ");
		await act(async () => remove());
		// A new drag can start: the old one did not linger.
		card(el, "Ship it").focus();
		await userEvent.keyboard(" ");
		await vi.waitFor(() =>
			expect(card(el, "Ship it").hasAttribute("data-grabbed")).toBe(true),
		);
	});

	it("moves a card into a long column, past its window, with the keyboard", async () => {
		const onMove = vi.fn();
		const el = await mount(
			<EditableBoard
				onMove={onMove}
				initial={[
					{ id: "short", title: "Short", items: many("s", 3) },
					{ id: "long", title: "Backlog", items: many("b", 300) },
				]}
			/>,
		);
		await editable(el);
		card(el, "s card 1").focus();
		await userEvent.keyboard(" ");
		await userEvent.keyboard("{ArrowRight}");
		await userEvent.keyboard("{End}");
		await vi.waitFor(() => {
			expect(document.activeElement?.textContent).toContain("s card 1");
			expect(focused()?.getAttribute("aria-posinset")).toBe("301");
		});
		await userEvent.keyboard(" ");
		expect(onMove).toHaveBeenCalledWith(
			expect.objectContaining({
				itemKey: "s1",
				from: { columnId: "short", index: 0 },
				to: { columnId: "long", index: 300 },
			}),
		);
	});

	it("moves a card to another column with the mouse", async () => {
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} />);
		await editable(el);
		const waiting = el.querySelector("[data-kanban-column='waiting']");
		if (!waiting) throw new Error("no waiting column");
		await mouseDrag(card(el, "Ship it"), center(waiting));
		await vi.waitFor(() => expect(onMove).toHaveBeenCalledTimes(1));
		expect(onMove).toHaveBeenCalledWith(
			expect.objectContaining({
				itemKey: "t3",
				from: { columnId: "ready", index: 2 },
				to: { columnId: "waiting", index: 0 },
			}),
		);
		await vi.waitFor(() =>
			expect(titlesIn(el, "waiting")).toEqual(["Ship it"]),
		);
		expect(el.querySelector("[data-kanban-drag-overlay]")).toBeNull();
	});

	it("reorders with the mouse, before a card in another column", async () => {
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} />);
		await editable(el);
		const target = card(el, "Approve the spec").getBoundingClientRect();
		await mouseDrag(card(el, "Write the parser"), {
			x: target.left + target.width / 2,
			y: target.top + 4,
		});
		await vi.waitFor(() => expect(onMove).toHaveBeenCalledTimes(1));
		expect(onMove.mock.calls[0][0]).toMatchObject({
			from: { columnId: "ready", index: 0 },
			to: { columnId: "review", index: 0 },
		});
	});

	it("snaps a vetoed mouse move back", async () => {
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} veto />);
		await editable(el);
		const waiting = el.querySelector("[data-kanban-column='waiting']");
		if (!waiting) throw new Error("no waiting column");
		await mouseDrag(card(el, "Ship it"), center(waiting));
		await vi.waitFor(() => expect(onMove).toHaveBeenCalledTimes(1));
		await vi.waitFor(() => expect(titlesIn(el, "waiting")).toEqual([]));
		expect(titlesIn(el, "ready")).toEqual([
			"Write the parser",
			"Review the plan",
			"Ship it",
		]);
	});

	it("still opens a card on a click without a drag", async () => {
		const onOpen = vi.fn();
		const onMove = vi.fn();
		const el = await mount(<EditableBoard onMove={onMove} onOpen={onOpen} />);
		await editable(el);
		await userEvent.click(card(el, "Review the plan"));
		expect(onOpen).toHaveBeenCalledWith("t2");
		expect(onMove).not.toHaveBeenCalled();
	});
});

describe.each<ColorMode>([
	"light",
	"dark",
])("Kanban drag and drop in %s mode", (mode) => {
	const rgb = (name: string) => toComputedRgb(resolveColor(system, name, mode));

	it("outlines the picked-up card in the accent colour and tints its column", async () => {
		const Wrap = mode === "dark" ? DarkMode : LightMode;
		const el = await mount(
			<Wrap>
				<EditableBoard onMove={() => {}} />
			</Wrap>,
		);
		await editable(el);
		const ready = el.querySelector<HTMLElement>("[data-kanban-column='ready']");
		if (!ready) throw new Error("no ready column");
		expect(getComputedStyle(ready).backgroundColor).toBe("rgba(0, 0, 0, 0)");
		card(el, "Approve the spec").focus();
		await userEvent.keyboard(" ");
		// Read once the card's colour transition has settled.
		await vi.waitFor(() => {
			const grabbed = getComputedStyle(card(el, "Approve the spec"));
			expect(grabbed.borderTopColor).toBe(rgb("accent"));
			expect(grabbed.borderTopStyle).toBe("solid");
		});
		await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
		await vi.waitFor(() =>
			expect(titlesIn(el, "ready")).toContain("Approve the spec"),
		);
		expect(ready.hasAttribute("data-drop-target")).toBe(true);
		await vi.waitFor(() =>
			expect(getComputedStyle(ready).backgroundColor).toBe(rgb("bg-muted")),
		);
		await userEvent.keyboard("{Escape}");
		await vi.waitFor(() =>
			expect(ready.hasAttribute("data-drop-target")).toBe(false),
		);
	});
});
