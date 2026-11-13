// LineChart, AreaChart and BarChart as a consumer sees them (#328, #329), in
// a real browser.
//
// The rendered structure (a named figure, one mark per visible series, the
// legend), the series colours resolved to their tokens in light and dark mode,
// the formatters on axes and tooltip, the sizing, and the empty and loading
// states — asked of Chromium (the `layout` project of `vitest.config.ts`),
// because jsdom neither lays out the SVG Recharts measures nor resolves CSS
// variables.
import i18next from "i18next";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Widget } from "../components/widget";
import { DarkMode, LightMode } from "../primitives/color-mode";
import { Provider } from "../primitives/provider";
import {
	type ColorMode,
	resolveColor,
	toComputedRgb,
} from "../test/color-tokens";
import system from "../theme";
import {
	AreaChart,
	BarChart,
	CHART_SERIES_PALETTE_SIZE,
	type ChartSeries,
	LineChart,
	numberFormatter,
	timeFormatter,
} from ".";

// Tell React these tests drive it through act(), so it neither warns that the
// environment lacks act support nor lets updates escape it.
(
	globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

interface Reading {
	at: number;
	cpu: number;
	memory: number;
	load: number;
	limit: number;
}

const START = Date.UTC(2026, 10, 13, 9, 0);
const MINUTE = 60_000;

const DATA: Reading[] = Array.from({ length: 6 }, (_, i) => ({
	at: START + i * 10 * MINUTE,
	cpu: 0.2 + i * 0.1,
	memory: 0.5,
	load: 1 + i,
	limit: 4,
}));

const SERIES: ChartSeries<Reading>[] = [
	{ key: "cpu", label: "CPU" },
	{ key: "memory", label: "Memory" },
	{ key: "load", label: "Load" },
];

let root: Root | undefined;
let host: HTMLDivElement | undefined;

const frame = () =>
	new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

/** Waits until Recharts has measured its container and drawn. */
async function settle(check: () => boolean, tries = 40): Promise<void> {
	for (let i = 0; i < tries && !check(); i++) {
		await act(async () => {
			await frame();
		});
	}
}

async function mount(
	node: ReactNode,
	size: { width: number; height: number } = { width: 600, height: 300 },
): Promise<HTMLDivElement> {
	host = document.createElement("div");
	host.style.width = `${size.width}px`;
	host.style.height = `${size.height}px`;
	document.body.appendChild(host);
	root = createRoot(host);
	await act(async () => {
		root?.render(<Provider forcedTheme="light">{node}</Provider>);
	});
	await settle(() => !!host?.querySelector("svg.recharts-surface"), 20);
	return host;
}

/** Renders `node` again into the mounted root, as a data update does. */
async function rerender(node: ReactNode): Promise<void> {
	await act(async () => {
		root?.render(<Provider forcedTheme="light">{node}</Provider>);
	});
}

/** Lets real time pass, with React's updates flushed. */
async function wait(ms: number): Promise<void> {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, ms));
	});
}

afterEach(() => {
	act(() => root?.unmount());
	host?.remove();
	root = undefined;
	host = undefined;
});

const figure = (el: HTMLElement, name: string) => {
	const found = el.querySelector<HTMLElement>(
		`[role='figure'][aria-label='${name}']`,
	);
	if (!found) throw new Error(`no figure named ${name}`);
	return found;
};

const lines = (el: HTMLElement) => [
	...el.querySelectorAll<SVGPathElement>("path.recharts-line-curve"),
];
const areas = (el: HTMLElement) => [
	...el.querySelectorAll<SVGPathElement>("path.recharts-area-area"),
];
/** The text of an axis' ticks, once Recharts has drawn them. */
async function tickTexts(el: HTMLElement, axis: "x" | "y"): Promise<string[]> {
	const read = () =>
		[...el.querySelectorAll(`.recharts-${axis}Axis-tick-labels text`)].map(
			(t) => t.textContent ?? "",
		);
	await settle(() => read().length > 0);
	return read();
}

describe("LineChart — structure and series colours", () => {
	it("renders a named figure with one line per series, coloured by palette slot", async () => {
		const el = await mount(
			<LineChart
				aria-label="Load over time"
				data={DATA}
				xKey="at"
				series={SERIES}
			/>,
		);
		const fig = figure(el, "Load over time");
		expect(fig.dataset.chart).toBe("line");
		expect(fig.dataset.state).toBe("ready");
		const paths = lines(el);
		expect(paths).toHaveLength(3);
		expect(paths.map((p) => p.getAttribute("stroke"))).toEqual([
			"var(--chakra-colors-chart-series-1)",
			"var(--chakra-colors-chart-series-2)",
			"var(--chakra-colors-chart-series-3)",
		]);
	});

	it("paints a series with a tone in the tone's token instead of its slot", async () => {
		const el = await mount(
			<LineChart
				aria-label="Load"
				data={DATA}
				xKey="at"
				series={[
					{ key: "load", label: "Load" },
					{ key: "limit", label: "Limit", tone: "warning" },
					{ key: "cpu", label: "CPU", tone: "neutral" },
				]}
			/>,
		);
		expect(lines(el).map((p) => p.getAttribute("stroke"))).toEqual([
			"var(--chakra-colors-chart-series-1)",
			"var(--chakra-colors-warning-fg)",
			"var(--chakra-colors-subtle)",
		]);
	});

	it("a hidden series keeps the others' colours", async () => {
		const el = await mount(
			<LineChart
				aria-label="Load"
				data={DATA}
				xKey="at"
				series={[
					{ key: "cpu", label: "CPU", hidden: true },
					{ key: "memory", label: "Memory" },
					{ key: "load", label: "Load" },
				]}
			/>,
		);
		expect(lines(el).map((p) => p.getAttribute("stroke"))).toEqual([
			"var(--chakra-colors-chart-series-2)",
			"var(--chakra-colors-chart-series-3)",
		]);
	});

	it("paints series past the palette neutral and warns", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const many = Array.from(
			{ length: CHART_SERIES_PALETTE_SIZE + 1 },
			(_, i) => ({ key: `s${i}`, label: `S${i}` }),
		);
		const rows = DATA.map((r) =>
			Object.fromEntries([["at", r.at], ...many.map((s, i) => [s.key, i])]),
		);
		const el = await mount(
			<LineChart aria-label="Many" data={rows} xKey="at" series={many} />,
		);
		expect(lines(el).at(-1)?.getAttribute("stroke")).toBe(
			"var(--chakra-colors-subtle)",
		);
		expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Other/));
		warn.mockRestore();
	});

	it("shows a legend for two or more series, none for one, and obeys `legend`", async () => {
		const el = await mount(
			<>
				<LineChart aria-label="Two" data={DATA} xKey="at" series={SERIES} />
				<LineChart
					aria-label="One"
					data={DATA}
					xKey="at"
					series={[{ key: "load", label: "Load" }]}
				/>
				<LineChart
					aria-label="Forced"
					data={DATA}
					xKey="at"
					series={[{ key: "load", label: "Load" }]}
					legend
				/>
			</>,
			{ width: 600, height: 900 },
		);
		const legendOf = (name: string) =>
			figure(el, name).querySelector("[data-chart-legend]");
		const items = [...(legendOf("Two")?.querySelectorAll("li") ?? [])];
		expect(items.map((li) => li.textContent)).toEqual([
			"CPU",
			"Memory",
			"Load",
		]);
		expect(legendOf("One")).toBeNull();
		expect(legendOf("Forced")?.textContent).toBe("Load");
	});
});

describe.each<ColorMode>([
	"light",
	"dark",
])("series colours resolve in %s mode", (mode) => {
	const token = (name: string) =>
		toComputedRgb(resolveColor(system, name, mode));
	const Wrap = mode === "dark" ? DarkMode : LightMode;

	it("line strokes resolve to their palette slot or tone", async () => {
		const el = await mount(
			<Wrap>
				<LineChart
					aria-label="Load"
					data={DATA}
					xKey="at"
					series={[
						{ key: "cpu" },
						{ key: "memory" },
						{ key: "load" },
						{ key: "limit", tone: "danger" },
					]}
				/>
			</Wrap>,
		);
		const strokes = lines(el).map((p) => getComputedStyle(p).stroke);
		expect(strokes).toEqual([
			token("chart.series.1"),
			token("chart.series.2"),
			token("chart.series.3"),
			token("danger.fg"),
		]);
	});

	it("area fills resolve to their palette slot or tone", async () => {
		const el = await mount(
			<Wrap>
				<AreaChart
					aria-label="Spend"
					data={DATA}
					xKey="at"
					series={[{ key: "cpu" }, { key: "load", tone: "accent" }]}
				/>
			</Wrap>,
		);
		const fills = areas(el).map((p) => getComputedStyle(p).fill);
		expect(fills).toEqual([token("chart.series.1"), token("accent")]);
	});

	it("axis text is muted, in anker's xs size and body font", async () => {
		const el = await mount(
			<Wrap>
				<LineChart aria-label="Load" data={DATA} xKey="at" series={SERIES} />
			</Wrap>,
		);
		await tickTexts(el, "x");
		const tick = el.querySelector(".recharts-xAxis-tick-labels text");
		const legend = el.querySelector("[data-chart-legend] li");
		if (!tick || !legend) throw new Error("no tick or legend");
		const t = getComputedStyle(tick);
		expect(t.fill).toBe(token("muted"));
		expect(t.fontSize).toBe(getComputedStyle(legend).fontSize);
		expect(t.fontSize).toBe("12px");
		expect(t.fontFamily).toBe(getComputedStyle(legend).fontFamily);
	});

	it("legend swatches resolve to the series colours, text stays muted", async () => {
		const el = await mount(
			<Wrap>
				<LineChart aria-label="Load" data={DATA} xKey="at" series={SERIES} />
			</Wrap>,
		);
		const swatches = [
			...el.querySelectorAll<HTMLElement>(
				"[data-chart-legend] [data-chart-swatch]",
			),
		].map((s) => getComputedStyle(s).backgroundColor);
		expect(swatches).toEqual([
			token("chart.series.1"),
			token("chart.series.2"),
			token("chart.series.3"),
		]);
		const legend = el.querySelector<HTMLElement>("[data-chart-legend]");
		expect(legend && getComputedStyle(legend).color).toBe(token("muted"));
	});
});

describe("AreaChart", () => {
	it("renders one area per series, unstacked by default", async () => {
		const el = await mount(
			<AreaChart aria-label="Spend" data={DATA} xKey="at" series={SERIES} />,
		);
		expect(figure(el, "Spend").dataset.chart).toBe("area");
		expect(areas(el)).toHaveLength(3);
		expect(areas(el)[0].getAttribute("fill-opacity")).toBe("0.15");
	});

	it("`stacked` puts each series on top of the one before", async () => {
		const flat = (d: Reading) => ({ at: d.at, a: 1, b: 1 });
		const el = await mount(
			<AreaChart
				aria-label="Stacked"
				data={DATA.map(flat)}
				xKey="at"
				series={[{ key: "a" }, { key: "b" }]}
				stacked
				formatValue={(v) => String(v)}
			/>,
		);
		// Stacked, the y axis has to reach the sum (2), not the largest value (1).
		const ticks = (await tickTexts(el, "y")).map(Number);
		expect(Math.max(...ticks)).toBeGreaterThanOrEqual(2);
	});
});

describe("formatters", () => {
	it("formatValue and formatX apply to the axes", async () => {
		const el = await mount(
			<LineChart
				aria-label="CPU"
				data={DATA}
				xKey="at"
				xType="time"
				series={[{ key: "cpu", label: "CPU" }]}
				formatValue={numberFormatter({
					locale: "en",
					style: "percent",
					maximumFractionDigits: 0,
				})}
				formatX={timeFormatter({
					locale: "en",
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
					timeZone: "UTC",
				})}
			/>,
		);
		const y = await tickTexts(el, "y");
		expect(y.length).toBeGreaterThan(1);
		for (const t of y) expect(t).toMatch(/^\d+%$/);
		const x = await tickTexts(el, "x");
		expect(x.length).toBeGreaterThan(1);
		for (const t of x) expect(t).toMatch(/^\d\d:\d\d$/);
		for (const t of x)
			expect(["09:00", "09:10", "09:20", "09:30", "09:40", "09:50"]).toContain(
				t,
			);
	});

	it("a time axis reads Dates and ISO strings like epoch milliseconds", async () => {
		const rows = DATA.map((r, i) => ({
			...r,
			at: i % 2 ? new Date(r.at) : new Date(r.at).toISOString(),
		}));
		const el = await mount(
			<LineChart
				aria-label="Mixed"
				data={rows}
				xKey="at"
				xType="time"
				series={[{ key: "load" }]}
				formatX={timeFormatter({
					locale: "en",
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
					timeZone: "UTC",
				})}
			/>,
		);
		// Recharts may drop a tick that does not fit; every one it draws is a
		// reading's time, read from a Date or an ISO string alike.
		const readings = ["09:00", "09:10", "09:20", "09:30", "09:40", "09:50"];
		const x = await tickTexts(el, "x");
		expect(x.length).toBeGreaterThan(1);
		for (const t of x) expect(readings).toContain(t);
	});

	it("the tooltip shows the formatted x as heading and each series' formatted value", async () => {
		const el = await mount(
			<LineChart
				aria-label="CPU"
				data={DATA}
				xKey="at"
				xType="time"
				series={[
					{ key: "cpu", label: "CPU" },
					{ key: "memory", label: "Memory" },
				]}
				formatValue={(v) => `${Number(v) * 100} pct`}
				formatX={(v) => `at ${new Date(v).toISOString().slice(11, 16)}`}
			/>,
		);
		const surface = el.querySelector<SVGSVGElement>("svg.recharts-surface");
		if (!surface) throw new Error("no chart surface");
		const box = surface.getBoundingClientRect();
		// Hover the right-hand end of the plot: the last reading.
		const target = el.querySelector(".recharts-wrapper") ?? surface;
		await act(async () => {
			for (const type of ["mouseenter", "mousemove"]) {
				target.dispatchEvent(
					new MouseEvent(type, {
						bubbles: true,
						clientX: box.right - 10,
						clientY: box.top + box.height / 2,
					}),
				);
			}
		});
		await settle(() => !!el.querySelector("[data-chart-tooltip]"));
		const tip = el.querySelector<HTMLElement>("[data-chart-tooltip]");
		expect(tip).not.toBeNull();
		expect(tip?.textContent).toContain("at 09:50");
		expect(tip?.textContent).toContain("CPU");
		expect(tip?.textContent).toContain("70 pct");
		expect(tip?.textContent).toContain("Memory");
		expect(tip?.textContent).toContain("50 pct");
	});
});

describe("UI language", () => {
	it("formats with the language of the nearest I18nextProvider", async () => {
		const i18n = i18next.createInstance();
		await i18n.init({ lng: "de", resources: {} });
		const el = await mount(
			<I18nextProvider i18n={i18n}>
				<LineChart
					aria-label="Spend"
					data={[
						{ day: "Mon", spend: 0 },
						{ day: "Tue", spend: 3000 },
					]}
					xKey="day"
					series={[{ key: "spend" }]}
				/>
			</I18nextProvider>,
		);
		const y = await tickTexts(el, "y");
		expect(y).toContain("3.000");
	});
});

describe("time axis data", () => {
	it("drops a row whose x is no time; only such rows is the empty state", async () => {
		const el = await mount(
			<>
				<LineChart
					aria-label="Some bad"
					data={[
						...DATA,
						{ ...DATA[0], at: "not a time" as unknown as number },
					]}
					xKey="at"
					xType="time"
					series={[{ key: "load" }]}
				/>
				<LineChart
					aria-label="All bad"
					data={[{ at: "never", load: 1 }]}
					xKey="at"
					xType="time"
					series={[{ key: "load" }]}
				/>
			</>,
			{ width: 600, height: 600 },
		);
		expect(figure(el, "Some bad").dataset.state).toBe("ready");
		expect(lines(el)[0].getAttribute("d")).not.toMatch(/NaN/);
		expect(figure(el, "All bad").dataset.state).toBe("empty");
	});
});

describe("sizing", () => {
	it("fills its container's width and height by default", async () => {
		const el = await mount(
			<LineChart
				aria-label="Fill"
				data={DATA}
				xKey="at"
				series={[{ key: "load" }]}
			/>,
			{ width: 480, height: 260 },
		);
		const fig = figure(el, "Fill").getBoundingClientRect();
		expect(fig.width).toBe(480);
		expect(fig.height).toBe(260);
		const svg = el
			.querySelector("svg.recharts-surface")
			?.getBoundingClientRect();
		expect(svg?.width).toBe(480);
		expect(svg?.height).toBe(260);
	});

	it("fills the body of a dashboard Widget, below its heading", async () => {
		const el = await mount(
			<Widget heading="Machine load" icon={null}>
				<LineChart
					aria-label="In widget"
					data={DATA}
					xKey="at"
					series={SERIES}
				/>
			</Widget>,
			{ width: 480, height: 320 },
		);
		const card = el
			.querySelector(".chakra-card__root")
			?.getBoundingClientRect();
		const fig = figure(el, "In widget").getBoundingClientRect();
		if (!card) throw new Error("no widget");
		expect(fig.height).toBeGreaterThan(160);
		expect(fig.bottom).toBeLessThanOrEqual(card.bottom);
		expect(fig.width).toBeLessThan(card.width);
	});

	it("follows its container when it resizes", async () => {
		const el = await mount(
			<LineChart
				aria-label="Resize"
				data={DATA}
				xKey="at"
				series={[{ key: "load" }]}
			/>,
			{ width: 480, height: 260 },
		);
		el.style.width = "320px";
		await settle(
			() =>
				el.querySelector("svg.recharts-surface")?.getBoundingClientRect()
					.width === 320,
		);
		expect(
			el.querySelector("svg.recharts-surface")?.getBoundingClientRect().width,
		).toBe(320);
	});

	it("takes an explicit height where the container has none", async () => {
		const el = await mount(
			<LineChart
				aria-label="Fixed"
				data={DATA}
				xKey="at"
				series={[{ key: "load" }]}
				height={200}
			/>,
			{ width: 480, height: 600 },
		);
		expect(figure(el, "Fixed").getBoundingClientRect().height).toBe(200);
	});

	it("never collapses below minHeight in a container without height", async () => {
		host = document.createElement("div");
		host.style.width = "400px";
		document.body.appendChild(host);
		root = createRoot(host);
		await act(async () => {
			root?.render(
				<Provider forcedTheme="light">
					<LineChart
						aria-label="Min"
						data={DATA}
						xKey="at"
						series={[{ key: "load" }]}
					/>
				</Provider>,
			);
		});
		expect(figure(host, "Min").getBoundingClientRect().height).toBe(160);
		// …and the plot inside it is drawn, not collapsed to nothing.
		const el = host;
		await settle(() => !!el.querySelector("svg.recharts-surface"));
		expect(
			el.querySelector("svg.recharts-surface")?.getBoundingClientRect().height,
		).toBeGreaterThan(100);
	});
});

describe("empty and loading states", () => {
	it("shows the empty state when there are no rows", async () => {
		const el = await mount(
			<>
				<LineChart aria-label="Empty" data={[]} xKey="at" series={SERIES} />
				<AreaChart
					aria-label="Custom"
					data={[]}
					xKey="at"
					series={SERIES}
					emptyLabel="No spend yet"
				/>
			</>,
			{ width: 600, height: 600 },
		);
		const empty = figure(el, "Empty");
		expect(empty.dataset.state).toBe("empty");
		expect(empty.textContent).toBe("No data");
		expect(empty.querySelector("svg")).toBeNull();
		expect(figure(el, "Custom").textContent).toBe("No spend yet");
	});

	it("shows the empty state when every series is hidden", async () => {
		const el = await mount(
			<LineChart
				aria-label="Hidden"
				data={DATA}
				xKey="at"
				series={[{ key: "load", hidden: true }]}
			/>,
		);
		expect(figure(el, "Hidden").dataset.state).toBe("empty");
	});

	it("shows a busy placeholder the chart's size while loading", async () => {
		const el = await mount(
			<LineChart
				aria-label="Loading"
				data={DATA}
				xKey="at"
				series={SERIES}
				loading
				loadingLabel="Loading load"
			/>,
			{ width: 480, height: 260 },
		);
		const fig = figure(el, "Loading");
		expect(fig.getAttribute("aria-busy")).toBe("true");
		expect(fig.dataset.state).toBe("loading");
		expect(fig.querySelector("svg")).toBeNull();
		const status = fig.querySelector<HTMLElement>("[role='status']");
		expect(status?.getAttribute("aria-label")).toBe("Loading load");
		expect(status?.getBoundingClientRect().height).toBe(260);
	});
});

const bars = (el: HTMLElement) => [
	...el.querySelectorAll<SVGPathElement>(".recharts-bar-rectangle path"),
];
/** The bars of each series, in series order. */
const barsBySeries = (el: HTMLElement) =>
	[...el.querySelectorAll(".recharts-bar")].map((g) => [
		...g.querySelectorAll<SVGPathElement>(".recharts-bar-rectangle path"),
	]);

interface Spend {
	day: string;
	core: number;
	shell: number;
	odon: number;
}

const SPEND: Spend[] = [
	{ day: "Mon", core: 4, shell: 2, odon: 1 },
	{ day: "Tue", core: 5, shell: 3, odon: 1 },
	{ day: "Wed", core: 3, shell: 2, odon: 2 },
];

const SPEND_SERIES: ChartSeries<Spend>[] = [
	{ key: "core", label: "Core" },
	{ key: "shell", label: "Shell" },
	{ key: "odon", label: "Odon" },
];

describe("BarChart", () => {
	it("renders a named figure with one bar per series and row, coloured by palette slot", async () => {
		const el = await mount(
			<BarChart
				aria-label="Spend per day"
				data={SPEND}
				xKey="day"
				series={SPEND_SERIES}
			/>,
		);
		const fig = figure(el, "Spend per day");
		expect(fig.dataset.chart).toBe("bar");
		expect(fig.dataset.state).toBe("ready");
		await settle(() => bars(el).length === 9);
		const groups = barsBySeries(el);
		expect(groups.map((g) => g.length)).toEqual([3, 3, 3]);
		expect(groups.map((g) => g[0].getAttribute("fill"))).toEqual([
			"var(--chakra-colors-chart-series-1)",
			"var(--chakra-colors-chart-series-2)",
			"var(--chakra-colors-chart-series-3)",
		]);
		expect(
			[...el.querySelectorAll("[data-chart-legend] li")].map(
				(li) => li.textContent,
			),
		).toEqual(["Core", "Shell", "Odon"]);
	});

	it("groups the series side by side by default, on a common baseline", async () => {
		const el = await mount(
			<BarChart
				aria-label="Grouped"
				data={SPEND}
				xKey="day"
				series={SPEND_SERIES}
			/>,
		);
		await settle(() => bars(el).length === 9);
		const monday = barsBySeries(el).map((g) => g[0].getBoundingClientRect());
		for (let i = 1; i < monday.length; i++) {
			expect(monday[i].left).toBeGreaterThanOrEqual(monday[i - 1].right);
			expect(monday[i].bottom).toBeCloseTo(monday[0].bottom, 0);
		}
	});

	it("`stacked` puts each series on top of the one before, in one bar", async () => {
		const el = await mount(
			<BarChart
				aria-label="Stacked"
				data={SPEND}
				xKey="day"
				series={SPEND_SERIES}
				stacked
			/>,
		);
		await settle(() => bars(el).length === 9);
		const monday = barsBySeries(el).map((g) => g[0].getBoundingClientRect());
		for (let i = 1; i < monday.length; i++) {
			expect(monday[i].left).toBeCloseTo(monday[0].left, 0);
			expect(monday[i].bottom).toBeCloseTo(monday[i - 1].top, 0);
		}
	});

	it("paints a tone in its token and a hidden series keeps the others' slots", async () => {
		const el = await mount(
			<BarChart
				aria-label="Tones"
				data={SPEND}
				xKey="day"
				series={[
					{ key: "core", hidden: true },
					{ key: "shell" },
					{ key: "odon", tone: "danger" },
				]}
			/>,
		);
		await settle(() => bars(el).length === 6);
		expect(barsBySeries(el).map((g) => g[0].getAttribute("fill"))).toEqual([
			"var(--chakra-colors-chart-series-2)",
			"var(--chakra-colors-danger-fg)",
		]);
	});

	it("gives each reading of a time axis its own bar, labelled as a time", async () => {
		const el = await mount(
			<BarChart
				aria-label="Load per slot"
				data={DATA}
				xKey="at"
				xType="time"
				series={[{ key: "load" }]}
				formatX={timeFormatter({
					locale: "en",
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
					timeZone: "UTC",
				})}
			/>,
		);
		await settle(() => bars(el).length === DATA.length);
		expect(bars(el)).toHaveLength(DATA.length);
		const x = await tickTexts(el, "x");
		expect(x[0]).toBe("09:00");
	});

	it("shows the empty and loading states like the other charts", async () => {
		const el = await mount(
			<>
				<BarChart
					aria-label="Empty"
					data={[]}
					xKey="day"
					series={SPEND_SERIES}
				/>
				<BarChart
					aria-label="Loading"
					data={SPEND}
					xKey="day"
					series={SPEND_SERIES}
					loading
				/>
			</>,
			{ width: 600, height: 600 },
		);
		expect(figure(el, "Empty").dataset.state).toBe("empty");
		expect(figure(el, "Loading").getAttribute("aria-busy")).toBe("true");
	});
});

describe.each<ColorMode>([
	"light",
	"dark",
])("bar and threshold colours resolve in %s mode", (mode) => {
	const token = (name: string) =>
		toComputedRgb(resolveColor(system, name, mode));
	const Wrap = mode === "dark" ? DarkMode : LightMode;

	it("bar fills resolve to their palette slot or tone", async () => {
		const el = await mount(
			<Wrap>
				<BarChart
					aria-label="Spend"
					data={SPEND}
					xKey="day"
					series={[
						{ key: "core" },
						{ key: "shell" },
						{ key: "odon", tone: "success" },
					]}
				/>
			</Wrap>,
		);
		await settle(() => bars(el).length === 9);
		expect(barsBySeries(el).map((g) => getComputedStyle(g[0]).fill)).toEqual([
			token("chart.series.1"),
			token("chart.series.2"),
			token("success.fg"),
		]);
	});

	it("a threshold line and band paint in their tone, labels too", async () => {
		const el = await mount(
			<Wrap>
				<LineChart
					aria-label="Load"
					data={DATA}
					xKey="at"
					series={[{ key: "load" }]}
					thresholds={[
						{ value: 5, label: "Admission limit", tone: "danger" },
						{ value: 2, to: 3, label: "Target" },
					]}
				/>
			</Wrap>,
		);
		const read = () => ({
			line: el.querySelector<SVGLineElement>(".recharts-reference-line line"),
			area: el.querySelector<SVGPathElement>(
				".recharts-reference-area path, .recharts-reference-area rect",
			),
		});
		await settle(() => !!read().line && !!read().area);
		const { line, area } = read();
		if (!line || !area) throw new Error("no threshold drawn");
		expect(getComputedStyle(line).stroke).toBe(token("danger.fg"));
		expect(getComputedStyle(area).fill).toBe(token("warning.fg"));
		const labels = [
			...el.querySelectorAll<SVGTextElement>("text.recharts-label"),
		];
		expect(labels.map((l) => l.textContent)).toEqual([
			"Admission limit",
			"Target",
		]);
		expect(labels.map((l) => getComputedStyle(l).fill)).toEqual([
			token("danger.fg"),
			token("warning.fg"),
		]);
	});
});

describe("thresholds", () => {
	it.each([
		["line", LineChart],
		["area", AreaChart],
		["bar", BarChart],
	] as const)("draw on a %s chart", async (_, Chart) => {
		const el = await mount(
			<Chart
				aria-label="With limit"
				data={DATA}
				xKey="at"
				series={[{ key: "load" }]}
				thresholds={[
					{ value: 4, label: "Budget" },
					{ value: 1, to: 2, label: "Calm", tone: "success" },
				]}
			/>,
		);
		await settle(() => !!el.querySelector(".recharts-reference-line line"));
		expect(
			el.querySelector(".recharts-reference-line line")?.getAttribute("stroke"),
		).toBe("var(--chakra-colors-warning-fg)");
		expect(el.querySelectorAll(".recharts-reference-area")).toHaveLength(1);
	});

	it("the y axis grows to show a threshold above the data", async () => {
		const el = await mount(
			<LineChart
				aria-label="Budget"
				data={DATA}
				xKey="at"
				series={[{ key: "load" }]}
				formatValue={numberFormatter({ locale: "en" })}
				thresholds={[{ value: 20, label: "Budget limit" }]}
			/>,
		);
		const y = (await tickTexts(el, "y")).map(Number);
		expect(Math.max(...y)).toBeGreaterThanOrEqual(20);
	});
});

describe("accessible text alternative", () => {
	it("holds the data as a visually hidden table in the figure, in the axis formats", async () => {
		const el = await mount(
			<BarChart
				aria-label="Spend per day"
				data={SPEND}
				xKey="day"
				xLabel="Day"
				series={[
					{ key: "core", label: "Core" },
					{ key: "shell", label: "Shell", hidden: true },
					{ key: "odon", label: "Odon" },
				]}
				formatValue={(v) => `${v} EUR`}
			/>,
		);
		const fig = figure(el, "Spend per day");
		const table = fig.querySelector("table");
		const wrapper = fig.querySelector("[data-chart-table]");
		if (!table || !wrapper) throw new Error("no data table");
		expect(table.querySelector("caption")?.textContent).toBe("Spend per day");
		expect(
			[...table.querySelectorAll("thead th")].map((th) => th.textContent),
		).toEqual(["Day", "Core", "Odon"]);
		const rows = [...table.querySelectorAll("tbody tr")].map((tr) =>
			[...tr.children].map((c) => c.textContent),
		);
		expect(rows).toEqual([
			["Mon", "4 EUR", "1 EUR"],
			["Tue", "5 EUR", "1 EUR"],
			["Wed", "3 EUR", "2 EUR"],
		]);
		expect(table.querySelector("tbody th")?.getAttribute("scope")).toBe("row");
		// Read by screen readers, not seen: the plot shows the same.
		const box = wrapper.getBoundingClientRect();
		expect(box.width * box.height).toBeLessThanOrEqual(1);
	});

	it("describes the figure with its summary and thresholds", async () => {
		const el = await mount(
			<LineChart
				aria-label="Load"
				data={DATA}
				xKey="at"
				series={[{ key: "load" }]}
				summary="Load rose from 1 to 6 within the hour."
				formatValue={numberFormatter({ locale: "en" })}
				thresholds={[
					{ value: 4, label: "Admission limit" },
					{ value: 1, to: 2, label: "Calm" },
				]}
			/>,
		);
		const fig = figure(el, "Load");
		const id = fig.getAttribute("aria-describedby");
		expect(id).toBeTruthy();
		const description = document.getElementById(id ?? "");
		expect(fig.contains(description)).toBe(true);
		expect(description?.textContent).toContain(
			"Load rose from 1 to 6 within the hour.",
		);
		expect(description?.textContent).toContain("Admission limit: 4");
		expect(description?.textContent).toContain("Calm: 1 – 2");
	});

	it("has no description without a summary or thresholds, and no table while empty or loading", async () => {
		const el = await mount(
			<>
				<LineChart aria-label="Plain" data={DATA} xKey="at" series={SERIES} />
				<LineChart aria-label="Empty" data={[]} xKey="at" series={SERIES} />
				<LineChart
					aria-label="Loading"
					data={DATA}
					xKey="at"
					series={SERIES}
					loading
				/>
			</>,
			{ width: 600, height: 900 },
		);
		expect(figure(el, "Plain").hasAttribute("aria-describedby")).toBe(false);
		expect(figure(el, "Plain").querySelector("table")).not.toBeNull();
		expect(figure(el, "Empty").querySelector("table")).toBeNull();
		expect(figure(el, "Loading").querySelector("table")).toBeNull();
	});
});

describe("live updates", () => {
	const more = (n: number): Reading[] =>
		Array.from({ length: n }, (_, i) => ({
			at: START + i * 10 * MINUTE,
			cpu: 0.2,
			memory: 0.5,
			load: 1 + (i % 4),
			limit: 4,
		}));

	it("the first draw animates when `animate` is set", async () => {
		const el = await mount(
			<LineChart
				aria-label="Live"
				data={more(6)}
				xKey="at"
				series={[{ key: "load" }]}
				animate
			/>,
		);
		await settle(() => lines(el).length > 0);
		// The line draws itself in: its dash grows from nothing to its length.
		const early = lines(el)[0].outerHTML;
		await wait(1800);
		expect(lines(el)[0].outerHTML).not.toBe(early);
	});

	it.each([
		["animated", true],
		["still", false],
	])("appending a point to a line chart (%s) draws it in place, without re-animating", async (_, animate) => {
		const chart = (data: Reading[]) => (
			<LineChart
				aria-label="Live"
				data={data}
				xKey="at"
				series={[
					{ key: "load", label: "Load" },
					{ key: "limit", label: "Limit" },
				]}
				animate={animate}
			/>
		);
		const el = await mount(chart(more(6)));
		await wait(animate ? 1800 : 50);
		const fig = figure(el, "Live");
		const before = fig.getBoundingClientRect();
		const legend = el.querySelector("[data-chart-legend]");

		await rerender(chart(more(7)));
		await act(async () => {
			await frame();
		});
		// Seven points, drawn at once: the path is final on the first frame…
		const drawn = lines(el).map((l) => l.outerHTML);
		expect(el.querySelectorAll("table tbody tr")).toHaveLength(7);
		await wait(600);
		// …and does not move afterwards, as an animation would.
		expect(lines(el).map((l) => l.outerHTML)).toEqual(drawn);
		// No layout jump: the frame keeps its size and the legend its node.
		expect(figure(el, "Live").getBoundingClientRect()).toEqual(before);
		expect(el.querySelector("[data-chart-legend]")).toBe(legend);
	});

	it("appending a point to an animated bar chart draws the new bar at once", async () => {
		const chart = (data: Reading[]) => (
			<BarChart
				aria-label="Live bars"
				data={data}
				xKey="at"
				xType="time"
				series={[{ key: "load" }]}
				thresholds={[{ value: 5, label: "Limit" }]}
				animate
			/>
		);
		const el = await mount(chart(more(6)));
		await wait(1000);
		await rerender(chart(more(7)));
		await act(async () => {
			await frame();
		});
		const heights = () =>
			bars(el).map((b) => Math.round(b.getBoundingClientRect().height));
		const first = heights();
		expect(first).toHaveLength(7);
		expect(first.every((h) => h > 0)).toBe(true);
		await wait(500);
		expect(heights()).toEqual(first);
	});
});
