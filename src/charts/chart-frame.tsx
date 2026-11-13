// The parts every cartesian chart shares: the frame (sizing, loading, empty,
// legend), the themed axes, grid and tooltip, and the series resolved to
// their colours. `LineChart` and `AreaChart` add only their marks; the bar
// charts, thresholds and the accessible summary (#329) plug in here.
import { type ReactNode, useMemo } from "react";
import { CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Box, Flex, HStack } from "../primitives/layout";
import { Skeleton } from "../primitives/skeleton";
import { Text } from "../primitives/typography";
import {
	CHART_SERIES_PALETTE_SIZE,
	resolveSeriesColor,
	tokenColor,
} from "./colors";
import { numberFormatter, timeFormatter, toTime } from "./format";
import type {
	ChartBaseProps,
	ChartDatum,
	ChartFormatter,
	ChartSeries,
	ChartValue,
} from "./types";

/** What the legend and the tooltip need of a series. */
export interface PaintedSeries {
	key: string;
	label: string;
	color: string;
	/** Its position in `series` — the palette slot it takes without a tone. */
	index: number;
}

/** A series with the colour it paints in and its place in `series`. */
export type ResolvedSeries<TDatum extends ChartDatum = ChartDatum> = Omit<
	ChartSeries<TDatum>,
	"label"
> &
	PaintedSeries & { key: Extract<keyof TDatum, string> };

const defaultValueFormat = numberFormatter();
const defaultTimeFormat = timeFormatter();
const defaultCategoryFormat: ChartFormatter = (value) => String(value);

/** Axis text: anker's `xs` size in the `muted` ink, never a series colour. */
const TICK = {
	fill: tokenColor("muted"),
	fontSize: "var(--chakra-font-sizes-xs)",
};

/** Not a production build — the same check as ContextRail's dev warning. */
function isDevMode(): boolean {
	const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
		.process;
	return proc?.env?.NODE_ENV !== "production";
}

/** Colours every series by its position (or tone) and drops the hidden ones. */
export function resolveSeries<TDatum extends ChartDatum>(
	series: readonly ChartSeries<TDatum>[],
): ResolvedSeries<TDatum>[] {
	// A series takes the slot of its position, so one past the palette's end
	// without a tone has no colour of its own.
	const overflow = series.filter(
		(s, i) => !s.tone && i >= CHART_SERIES_PALETTE_SIZE,
	).length;
	if (overflow > 0 && isDevMode()) {
		console.warn(
			`anker charts: ${series.length} series, but the palette has ${CHART_SERIES_PALETTE_SIZE} colours. ${overflow} series past it are painted neutral — fold them into an "Other" series or give them a tone.`,
		);
	}
	return series
		.map((s, index) => ({
			...s,
			label: s.label ?? s.key,
			color: resolveSeriesColor(s, index),
			index,
		}))
		.filter((s) => !s.hidden);
}

/** What a chart component hands to its Recharts root besides its marks. */
export interface CartesianParts<TDatum extends ChartDatum> {
	data: TDatum[];
	visible: ResolvedSeries<TDatum>[];
	/** Grid, axes and tooltip, keyed, to render inside the Recharts chart. */
	parts: ReactNode[];
}

/**
 * The data, the visible series and the themed grid, axes and tooltip of a
 * cartesian chart.
 */
export function useCartesianParts<TDatum extends ChartDatum>(
	props: ChartBaseProps<TDatum>,
): CartesianParts<TDatum> {
	const {
		data,
		series,
		xKey,
		xType = "category",
		formatX,
		formatValue = defaultValueFormat,
		grid = true,
	} = props;
	const time = xType === "time";
	const formatXValue =
		formatX ?? (time ? defaultTimeFormat : defaultCategoryFormat);

	const visible = useMemo(() => resolveSeries(series), [series]);

	// A time axis is numeric: read Dates and ISO strings as epoch milliseconds.
	const plotted = useMemo(
		() =>
			time
				? data.map((row) => ({ ...row, [xKey]: toTime(row[xKey]) }) as TDatum)
				: [...data],
		[data, time, xKey],
	);

	const parts = [
		grid ? (
			<CartesianGrid
				key="grid"
				vertical={false}
				stroke={tokenColor("border")}
				strokeDasharray="3 3"
			/>
		) : null,
		<XAxis
			key="x"
			dataKey={xKey}
			type={time ? "number" : "category"}
			scale={time ? "time" : "auto"}
			domain={time ? ["dataMin", "dataMax"] : undefined}
			tickFormatter={(v: ChartValue) => formatXValue(v)}
			tick={TICK}
			tickLine={false}
			axisLine={{ stroke: tokenColor("border") }}
			minTickGap={24}
		/>,
		<YAxis
			key="y"
			width="auto"
			tickFormatter={(v: ChartValue) => formatValue(v)}
			tick={TICK}
			tickLine={false}
			axisLine={false}
		/>,
		<Tooltip
			key="tooltip"
			cursor={{ stroke: tokenColor("border-emphasized") }}
			isAnimationActive={false}
			content={({ active, label, payload }) => (
				<ChartTooltip
					active={active}
					label={label}
					payload={payload as readonly TooltipEntry[] | undefined}
					series={visible}
					formatX={formatXValue}
					formatValue={formatValue}
				/>
			)}
		/>,
	];

	return { data: plotted, visible, parts };
}

interface TooltipEntry {
	dataKey?: unknown;
	value?: unknown;
}

interface ChartTooltipProps {
	active?: boolean;
	label?: unknown;
	payload?: readonly TooltipEntry[];
	series: readonly PaintedSeries[];
	formatX: ChartFormatter;
	formatValue: ChartFormatter;
}

/**
 * The tooltip: the formatted x value as its heading and one row per series —
 * a swatch carries the colour, the text stays in text tokens.
 */
export function ChartTooltip({
	active,
	label,
	payload,
	series,
	formatX,
	formatValue,
}: ChartTooltipProps) {
	if (!active || !payload?.length) return null;
	const rows = series.flatMap((s) => {
		const entry = payload.find((p) => p.dataKey === s.key);
		return entry && entry.value != null ? [{ s, value: entry.value }] : [];
	});
	return (
		<Box
			data-chart-tooltip=""
			bg="bg-surface"
			borderWidth="1px"
			borderColor="border"
			borderRadius="md"
			boxShadow="md"
			paddingInline="3"
			paddingBlock="2"
			fontSize="xs"
			color="default"
		>
			{label != null && (
				<Text fontWeight="semibold" marginBlockEnd="1">
					{formatX(label as ChartValue)}
				</Text>
			)}
			{rows.map(({ s, value }) => (
				<HStack key={s.key} gap="2" justify="space-between">
					<HStack gap="1.5">
						<Swatch color={s.color} />
						<Text color="muted">{s.label}</Text>
					</HStack>
					<Text fontVariantNumeric="tabular-nums">
						{formatValue(value as ChartValue)}
					</Text>
				</HStack>
			))}
		</Box>
	);
}

function Swatch({ color }: { color: string }) {
	return (
		<Box
			aria-hidden
			data-chart-swatch=""
			flexShrink={0}
			width="2.5"
			height="2.5"
			borderRadius="xs"
			style={{ background: color }}
		/>
	);
}

/** The legend: a list of series names, each beside its swatch. */
function ChartLegend({ series }: { series: readonly PaintedSeries[] }) {
	return (
		<Flex
			as="ul"
			data-chart-legend=""
			listStyleType="none"
			wrap="wrap"
			columnGap="4"
			rowGap="1"
			fontSize="xs"
			color="muted"
		>
			{series.map((s) => (
				<HStack as="li" key={s.key} gap="1.5" data-series={s.key}>
					<Swatch color={s.color} />
					<Text>{s.label}</Text>
				</HStack>
			))}
		</Flex>
	);
}

interface ChartFrameProps {
	label: string;
	/** Which chart this is, for `data-chart` (e.g. `line`). */
	kind: string;
	height?: number | string;
	minHeight?: number | string;
	loading?: boolean;
	loadingLabel?: string;
	empty: boolean;
	emptyLabel?: ReactNode;
	legend?: readonly PaintedSeries[];
	children: ReactNode;
}

/**
 * The chart's box: fills its container's width (and height, unless given
 * one), and shows the loading placeholder, the empty state or the legend and
 * the plot.
 */
export function ChartFrame({
	label,
	kind,
	height = "100%",
	minHeight = 160,
	loading = false,
	loadingLabel = "Loading chart",
	empty,
	emptyLabel = "No data",
	legend,
	children,
}: ChartFrameProps) {
	const state = loading ? "loading" : empty ? "empty" : "ready";
	return (
		<Flex
			role="figure"
			aria-label={label}
			aria-busy={loading || undefined}
			data-chart={kind}
			data-state={state}
			direction="column"
			gap="2"
			width="100%"
			height={height}
			minHeight={minHeight}
			fontFamily="body"
		>
			{state === "loading" && (
				<Skeleton
					role="status"
					aria-label={loadingLabel}
					flex="1"
					width="100%"
					borderRadius="md"
				/>
			)}
			{state === "empty" && (
				<Flex
					flex="1"
					align="center"
					justify="center"
					borderWidth="1px"
					borderStyle="dashed"
					borderColor="border"
					borderRadius="md"
				>
					<Text color="muted" fontSize="sm">
						{emptyLabel}
					</Text>
				</Flex>
			)}
			{state === "ready" && (
				<>
					{legend && legend.length > 0 && <ChartLegend series={legend} />}
					<Box flex="1" minHeight="0" position="relative">
						{children}
					</Box>
				</>
			)}
		</Flex>
	);
}
