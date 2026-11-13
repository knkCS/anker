import type { Meta, StoryObj } from "@storybook/react";
import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../atoms";
import { Widget } from "../components/widget";
import { DarkMode, LightMode } from "../primitives/color-mode";
import { Box, Grid, HStack } from "../primitives/layout";
import { AreaChart } from "./area-chart";
import { BarChart } from "./bar-chart";
import { numberFormatter, timeFormatter } from "./format";
import { LineChart } from "./line-chart";
import type { ChartSeries, ChartThreshold } from "./types";

/**
 * `BarChart` from `@knkcs/anker/charts` — grouped or `stacked` — and what
 * every chart takes besides its series: threshold lines and bands, a text
 * alternative for screen readers, and calm live updates. Series take their
 * colours from the palette (or a `tone`), never from the call site. Open
 * "Light and dark" to see both modes.
 */
const meta = {
	title: "Charts/Bar, Thresholds and Live",
	component: BarChart,
	parameters: { layout: "padded" },
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

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

const SERVICES: ChartSeries<Spend>[] = [
	{ key: "core", label: "Core" },
	{ key: "shell", label: "Shell" },
	{ key: "odon", label: "Odon" },
	{ key: "template", label: "Template" },
];

const BUDGET: ChartThreshold[] = [{ value: 40, label: "Daily budget" }];

const euros = numberFormatter({ style: "currency", currency: "EUR" });
const clock = timeFormatter({ hour: "2-digit", minute: "2-digit" });

const args = {
	"aria-label": "Spend per service and day",
	data: SPEND,
	xKey: "day",
	xLabel: "Day",
	series: SERVICES.slice(0, 2),
	formatValue: euros,
	height: 280,
} as const;

/** Grouped: the series of a day stand side by side, to compare them. */
export const Grouped: Story = {
	args: args as unknown as Story["args"],
};

/** `stacked`: one bar per day whose height is the day's total. */
export const Stacked: Story = {
	args: {
		...args,
		series: SERVICES,
		stacked: true,
	} as unknown as Story["args"],
};

/**
 * A threshold line — a budget limit — in a tone (`warning` by default), with
 * its label on the plot. The y axis grows to show it.
 */
export const WithThreshold: Story = {
	args: {
		...args,
		series: SERVICES,
		stacked: true,
		thresholds: BUDGET,
		summary: "Spend rose every day and passed the daily budget on Sunday.",
	} as unknown as Story["args"],
};

interface Reading {
	at: number;
	load: number;
}

const START = Date.UTC(2026, 10, 13, 8, 0);
const STEP = 5 * 60_000;

const reading = (i: number): Reading => ({
	at: START + i * STEP,
	load: Number((2 + Math.sin(i / 3) * 1.2 + (i % 5) * 0.1).toFixed(2)),
});

/**
 * Lines and bands on every chart type: a limit as a `danger` line, a target
 * range as a `success` band.
 */
export const ThresholdsOnEveryChart: Story = {
	render: () => {
		const data = Array.from({ length: 24 }, (_, i) => reading(i));
		const thresholds: ChartThreshold[] = [
			{ value: 3.5, label: "Admission limit", tone: "danger" },
			{ value: 1.5, to: 2.5, label: "Target", tone: "success" },
		];
		const common = {
			data,
			xKey: "at" as const,
			xType: "time" as const,
			series: [{ key: "load" as const, label: "1-minute load" }],
			formatX: clock,
			thresholds,
			height: 220,
		};
		return (
			<Grid templateColumns={{ base: "1fr", lg: "1fr 1fr 1fr" }} gap="6">
				<LineChart aria-label="Load as a line" {...common} />
				<AreaChart aria-label="Load as an area" {...common} />
				<BarChart aria-label="Load as bars" {...common} />
			</Grid>
		);
	},
};

/**
 * The text alternative. Every chart is a figure named by its `aria-label`,
 * described by its `summary` and thresholds, and holds its data as a
 * visually hidden table (x column headed by `xLabel`) — what a screen reader
 * reads instead of the plot. This story shows the table for sighted review;
 * in the chart it is hidden.
 */
export const AccessibleText: Story = {
	args: {
		...args,
		thresholds: BUDGET,
		summary: "Core spend grew every day; Shell stayed between 8 and 12 EUR.",
	} as unknown as Story["args"],
	render: (storyArgs) => (
		<Box
			css={{
				"& [data-chart-table], & [data-chart-description]": {
					position: "static",
					width: "auto",
					height: "auto",
					clip: "auto",
					overflow: "visible",
					whiteSpace: "normal",
					marginBlockStart: "4",
				},
				"& th, & td": { paddingInline: "2", textAlign: "start" },
			}}
		>
			<BarChart {...storyArgs} />
		</Box>
	),
};

/**
 * Live data: a reading every second, the oldest dropped. Only the first
 * draw animates (`animate`); a new point is drawn in place, the rest stay
 * still, and the frame never jumps.
 */
export const LiveUpdates: Story = {
	render: function Live() {
		const [count, setCount] = useState(24);
		const [running, setRunning] = useState(true);
		useEffect(() => {
			if (!running) return;
			const timer = setInterval(() => setCount((c) => c + 1), 1000);
			return () => clearInterval(timer);
		}, [running]);
		const data = Array.from({ length: 24 }, (_, i) => reading(count - 24 + i));
		const common = {
			data,
			xKey: "at" as const,
			xType: "time" as const,
			series: [{ key: "load" as const, label: "1-minute load" }],
			formatX: clock,
			thresholds: [{ value: 3.5, label: "Admission limit" }],
			animate: true,
		};
		return (
			<Box display="grid" gap="4">
				<HStack>
					<Button size="sm" onClick={() => setRunning((r) => !r)}>
						{running ? "Pause" : "Resume"}
					</Button>
				</HStack>
				<Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
					<Box height="280px">
						<Widget heading="Load" icon={<BarChart3 size={16} />}>
							<LineChart aria-label="Live load as a line" {...common} />
						</Widget>
					</Box>
					<Box height="280px">
						<Widget heading="Load per slot" icon={<BarChart3 size={16} />}>
							<BarChart aria-label="Live load as bars" {...common} />
						</Widget>
					</Box>
				</Grid>
			</Box>
		);
	},
};

/** Bars and thresholds in light and dark mode side by side. */
export const LightAndDark: Story = {
	parameters: { layout: "fullscreen" },
	render: () => (
		<Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="0">
			{[LightMode, DarkMode].map((Mode, i) => (
				<Mode key={i === 0 ? "light" : "dark"}>
					<Box bg="bg-surface" color="default" p="6" display="grid" gap="8">
						<BarChart
							aria-label="Spend per service and day"
							data={SPEND}
							xKey="day"
							series={SERVICES.slice(0, 3)}
							formatValue={euros}
							height={240}
						/>
						<BarChart
							aria-label="Total spend against the budget"
							data={SPEND}
							xKey="day"
							series={SERVICES}
							formatValue={euros}
							thresholds={[
								...BUDGET,
								{ value: 20, to: 30, label: "Usual range", tone: "info" },
							]}
							stacked
							height={240}
						/>
					</Box>
				</Mode>
			))}
		</Grid>
	),
};
