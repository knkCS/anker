import type { Meta, StoryObj } from "@storybook/react";
import { Activity } from "lucide-react";
import { Widget } from "../components/widget";
import { DarkMode, LightMode } from "../primitives/color-mode";
import { Box, Grid } from "../primitives/layout";
import { AreaChart } from "./area-chart";
import { numberFormatter, timeFormatter } from "./format";
import { LineChart } from "./line-chart";
import type { ChartSeries } from "./types";

/**
 * Token-coloured line and area charts from `@knkcs/anker/charts`. Pass data
 * and series definitions — never colours: a series takes the palette slot of
 * its position, or the colour of its `tone`. Axes, grid, tooltip and legend
 * use anker's tokens and typography; the chart fills its container. Hover a
 * chart for its tooltip; open "Light and dark" to see both modes.
 */
const meta = {
	title: "Charts/Line and Area",
	component: LineChart,
	parameters: { layout: "padded" },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

interface Reading {
	at: number;
	load: number;
	cpu: number;
	memory: number;
	limit: number;
}

const START = Date.UTC(2026, 10, 13, 8, 0);

const READINGS: Reading[] = Array.from({ length: 24 }, (_, i) => ({
	at: START + i * 5 * 60_000,
	load: Number((2 + Math.sin(i / 3) * 1.2 + i * 0.05).toFixed(2)),
	cpu: Number((0.35 + Math.sin(i / 4) * 0.2).toFixed(2)),
	memory: Number((0.55 + Math.cos(i / 5) * 0.1).toFixed(2)),
	limit: 3.5,
}));

interface Spend {
	day: string;
	core: number;
	shell: number;
	odon: number;
	template: number;
}

const SPEND: Spend[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
	(day, i) => ({
		day,
		core: 12 + i * 2,
		shell: 8 + ((i * 3) % 5),
		odon: 5 + ((i * 7) % 4),
		template: 3 + (i % 3),
	}),
);

const SHARES: ChartSeries<Reading>[] = [
	{ key: "cpu", label: "CPU" },
	{ key: "memory", label: "Memory in use" },
];

const percent = numberFormatter({ style: "percent", maximumFractionDigits: 0 });
const clock = timeFormatter({ hour: "2-digit", minute: "2-digit" });
const euros = numberFormatter({ style: "currency", currency: "EUR" });

const args = {
	"aria-label": "CPU and memory over time",
	data: READINGS,
	xKey: "at",
	xType: "time",
	series: SHARES,
	formatValue: percent,
	formatX: clock,
	height: 280,
} as const;

/** Two series over time: the palette's first two slots, a legend, the tooltip. */
export const Default: Story = {
	args: args as unknown as Story["args"],
};

/** One series needs no legend — the chart's title names it. */
export const SingleSeries: Story = {
	args: {
		...args,
		"aria-label": "1-minute load",
		series: [{ key: "load", label: "1-minute load" }],
		formatValue: numberFormatter({ maximumFractionDigits: 1 }),
	} as unknown as Story["args"],
};

/**
 * A series whose meaning matters takes a `tone`: the limit reads as a
 * warning, whatever slot it sits in.
 */
export const WithTone: Story = {
	args: {
		...args,
		"aria-label": "Load against the admission limit",
		series: [
			{ key: "load", label: "1-minute load" },
			{ key: "limit", label: "Admission limit", tone: "warning" },
		],
		formatValue: numberFormatter({ maximumFractionDigits: 1 }),
	} as unknown as Story["args"],
};

/** All six palette slots, in order. Past six, fold the rest into "Other". */
export const FullPalette: Story = {
	args: {
		"aria-label": "Six series",
		data: Array.from({ length: 12 }, (_, i) => ({
			x: `W${i + 1}`,
			...Object.fromEntries(
				Array.from({ length: 6 }, (_, s) => [
					`s${s + 1}`,
					10 + s * 6 + Math.round(Math.sin((i + s) / 2) * 4),
				]),
			),
		})),
		xKey: "x",
		series: Array.from({ length: 6 }, (_, s) => ({
			key: `s${s + 1}`,
			label: `Series ${s + 1}`,
		})),
		height: 300,
	} as unknown as Story["args"],
};

/** `hidden` leaves a series out without repainting the others. */
export const HiddenSeries: Story = {
	args: {
		...args,
		series: [
			{ key: "cpu", label: "CPU", hidden: true },
			{ key: "memory", label: "Memory in use" },
		],
	} as unknown as Story["args"],
};

/** Volume over time: an area chart, with currency on the axis and tooltip. */
export const Area: Story = {
	render: () => (
		<AreaChart
			aria-label="Spend per day"
			data={SPEND}
			xKey="day"
			series={[{ key: "core", label: "Core" }]}
			formatValue={euros}
			height={280}
		/>
	),
};

/** `stacked` areas add up to a whole: spend per service per day. */
export const StackedArea: Story = {
	render: () => (
		<AreaChart
			aria-label="Spend per service"
			data={SPEND}
			xKey="day"
			series={[
				{ key: "core", label: "Core" },
				{ key: "shell", label: "Shell" },
				{ key: "odon", label: "Odon" },
				{ key: "template", label: "Template" },
			]}
			formatValue={euros}
			stacked
			height={280}
		/>
	),
};

/**
 * In a dashboard widget the chart takes no height of its own: it fills the
 * widget's body, whatever size the grid cell has.
 */
export const InWidget: Story = {
	render: () => (
		<Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
			<Box height="320px">
				<Widget heading="Machine load" icon={<Activity size={16} />}>
					<LineChart
						aria-label="Load over time"
						data={READINGS}
						xKey="at"
						xType="time"
						series={[{ key: "load", label: "1-minute load" }]}
						formatX={clock}
					/>
				</Widget>
			</Box>
			<Box height="320px">
				<Widget heading="Spend" icon={<Activity size={16} />}>
					<AreaChart
						aria-label="Spend per service"
						data={SPEND}
						xKey="day"
						series={[
							{ key: "core", label: "Core" },
							{ key: "shell", label: "Shell" },
						]}
						formatValue={euros}
						stacked
					/>
				</Widget>
			</Box>
		</Grid>
	),
};

/** No rows (or every series hidden): the empty state, the chart's size. */
export const Empty: Story = {
	args: {
		...args,
		data: [],
		emptyLabel: "No readings yet",
	} as unknown as Story["args"],
};

/** `loading`: a placeholder the chart's size, marked busy. */
export const Loading: Story = {
	args: { ...args, loading: true } as unknown as Story["args"],
};

/** Both charts in light and dark mode side by side: the palette is selected per mode. */
export const LightAndDark: Story = {
	parameters: { layout: "fullscreen" },
	render: () => (
		<Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
			{[LightMode, DarkMode].map((Mode, i) => (
				<Mode key={i === 0 ? "light" : "dark"}>
					<Box bg="bg-surface" color="default" p="6" display="grid" gap="8">
						<LineChart
							aria-label="Load against the admission limit"
							data={READINGS}
							xKey="at"
							xType="time"
							series={[
								{ key: "load", label: "1-minute load" },
								{ key: "limit", label: "Admission limit", tone: "warning" },
							]}
							formatX={clock}
							height={240}
						/>
						<AreaChart
							aria-label="Spend per service"
							data={SPEND}
							xKey="day"
							series={[
								{ key: "core", label: "Core" },
								{ key: "shell", label: "Shell" },
								{ key: "odon", label: "Odon" },
								{ key: "template", label: "Template" },
							]}
							formatValue={euros}
							stacked
							height={240}
						/>
					</Box>
				</Mode>
			))}
		</Grid>
	),
};
