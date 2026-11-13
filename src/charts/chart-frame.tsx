// The parts every cartesian chart shares: the frame (sizing, loading, empty,
// legend), the themed axes, grid and tooltip, and the series resolved to
// their colours, the threshold lines and bands, the accessible description
// and data table, and the first-draw-only animation. `LineChart`,
// `AreaChart` and `BarChart` add only their marks.
import {
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useState,
} from "react";
import {
	CartesianGrid,
	ReferenceArea,
	ReferenceLine,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Box, Flex, HStack } from "../primitives/layout";
import { Skeleton } from "../primitives/skeleton";
import { Text } from "../primitives/typography";
import { isDevMode } from "../utils/dev-mode";
import { useUiLocale } from "../utils/ui-locale";
import {
	CHART_SERIES_PALETTE_SIZE,
	chartToneColor,
	resolveSeriesColor,
	tokenColor,
} from "./colors";
import { numberFormatter, timeFormatter, toTime } from "./format";
import type {
	ChartBaseProps,
	ChartDatum,
	ChartFormatter,
	ChartSeries,
	ChartThreshold,
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

/**
 * Axis text in the `muted` ink, never a series colour. Its size is inherited
 * from the frame (`xs`): an SVG `font-size` attribute does not resolve a CSS
 * variable, so the size cannot be passed here.
 */
const TICK = { fill: tokenColor("muted") };

/** Colours every series by its position (or tone) and drops the hidden ones. */
export function resolveSeries<TDatum extends ChartDatum>(
	series: readonly ChartSeries<TDatum>[],
): ResolvedSeries<TDatum>[] {
	return series
		.map((s, index) => ({
			...s,
			label: s.label ?? s.key,
			color: resolveSeriesColor(s, index),
			index,
		}))
		.filter((s) => !s.hidden);
}

/** A series of any row type, as the untyped helpers read it. */
type SeriesShape = Pick<ChartSeries, "label" | "tone" | "hidden"> & {
	key: string;
};

/**
 * How many series sit past the palette's end without a tone — a series takes
 * the slot of its position, so those have no colour of their own.
 */
export function paletteOverflow(series: readonly SeriesShape[]): number {
	return series.filter((s, i) => !s.tone && i >= CHART_SERIES_PALETTE_SIZE)
		.length;
}

/** A stable identity for `series`, so an inline array does not recompute. */
function seriesSignature(series: readonly SeriesShape[]): string {
	return JSON.stringify(
		series.map((s) => [s.key, s.label, s.tone, s.hidden ?? false]),
	);
}

/** The tone a threshold takes when it names none. */
const DEFAULT_THRESHOLD_TONE = "warning";

/** A threshold in words: "Budget limit: 4", "Target: 2 – 3". */
function describeThreshold(
	threshold: ChartThreshold,
	format: (value: ChartValue) => string,
): string {
	const { label, value, to } = threshold;
	return to === undefined
		? `${label}: ${format(value)}`
		: `${label}: ${format(value)} – ${format(to)}`;
}

/**
 * Where thresholds sit among Recharts' layers: a band behind the marks (over
 * the grid), a line over them — a limit stays visible across the bars it
 * cuts. Their labels sit on Recharts' label layer, above both.
 */
const BAND_Z = -75;
const LINE_Z = 450;

/** The space above the plot: room for a line threshold's label at the top. */
const PLOT_TOP = 8;
const PLOT_TOP_WITH_LABEL = 20;

/** A threshold's label: its tone on a halo of the surface, legible on marks. */
function thresholdLabel(
	label: string,
	color: string,
	position: "insideBottomRight" | "insideTopLeft",
) {
	return {
		value: label,
		position,
		fill: color,
		stroke: tokenColor("bg-surface"),
		strokeWidth: 3,
		paintOrder: "stroke",
	};
}

/** The threshold lines and bands, keyed, to render inside a Recharts chart. */
function thresholdParts(thresholds: readonly ChartThreshold[]): ReactNode[] {
	return thresholds.map((t, i) => {
		const color = chartToneColor(t.tone ?? DEFAULT_THRESHOLD_TONE);
		const key = `threshold-${i}`;
		// `extendDomain`: the y axis grows to show the threshold, so a limit
		// the data has not reached yet is still on the plot.
		return t.to === undefined ? (
			<ReferenceLine
				key={key}
				y={t.value}
				className="anker-chart-threshold"
				stroke={color}
				strokeWidth={1.5}
				strokeDasharray="4 4"
				ifOverflow="extendDomain"
				zIndex={LINE_Z}
				label={thresholdLabel(t.label, color, "insideBottomRight")}
			/>
		) : (
			<ReferenceArea
				key={key}
				y1={t.value}
				y2={t.to}
				className="anker-chart-threshold"
				fill={color}
				fillOpacity={0.12}
				stroke="none"
				ifOverflow="extendDomain"
				zIndex={BAND_Z}
				label={thresholdLabel(t.label, color, "insideTopLeft")}
			/>
		);
	});
}

/**
 * Animate a chart's marks on its first draw only. Once the first animation
 * ends, data that changes (a live point appended) is drawn in place: the
 * marks never re-animate from scratch and nothing on the plot moves but what
 * changed.
 */
function useFirstDrawAnimation(animate: boolean): ChartAnimation {
	const [drawn, setDrawn] = useState(false);
	const onAnimationEnd = useCallback(() => setDrawn(true), []);
	return { isAnimationActive: animate && !drawn, onAnimationEnd };
}

/** What a chart spreads onto each of its Recharts marks. */
export interface ChartAnimation {
	isAnimationActive: boolean;
	onAnimationEnd: () => void;
}

/** What a chart component hands to its Recharts root besides its marks. */
export interface CartesianParts<TDatum extends ChartDatum> {
	data: TDatum[];
	visible: ResolvedSeries<TDatum>[];
	/** Grid, axes, thresholds and tooltip, keyed, to render inside the Recharts chart. */
	parts: ReactNode[];
	/** What the chart spreads onto its `ChartFrame`, besides `kind`. */
	frame: Omit<ChartFrameProps, "kind" | "children">;
	/** What the chart spreads onto each of its marks. */
	animation: ChartAnimation;
	/** The Recharts root's margin: room above the plot for threshold labels. */
	margin: { top: number; right: number; bottom: number; left: number };
}

/** How a chart's marks shape the shared parts. */
export interface CartesianOptions {
	/**
	 * Marks that sit in bands (bars): the x axis stays a category axis even
	 * for time — each reading is a band, formatted as a time — and the
	 * tooltip's cursor fills the band instead of drawing a line.
	 */
	bands?: boolean;
}

/**
 * The data, the visible series, the themed grid, axes, thresholds and
 * tooltip, the frame and the animation of a cartesian chart.
 */
export function useCartesianParts<TDatum extends ChartDatum>(
	props: ChartBaseProps<TDatum>,
	options: CartesianOptions = {},
): CartesianParts<TDatum> {
	const {
		data,
		series,
		xKey,
		xType = "category",
		xLabel,
		summary,
		thresholds,
		formatX,
		formatValue = defaultValueFormat,
		grid = true,
		animate = false,
	} = props;
	const { bands = false } = options;
	const time = xType === "time";
	// A numeric time scale, unless the marks sit in bands.
	const timeScale = time && !bands;
	const formatXValue =
		formatX ?? (time ? defaultTimeFormat : defaultCategoryFormat);

	// The UI language, read here so the chart re-renders when it changes and
	// formats in the language of the nearest I18nextProvider.
	const locale = useUiLocale();

	const signature = seriesSignature(series);
	// biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the signature, not the array's identity
	const visible = useMemo(() => resolveSeries(series), [signature]);

	const overflow = paletteOverflow(series);
	useEffect(() => {
		if (overflow > 0 && isDevMode()) {
			console.warn(
				`anker charts: the palette has ${CHART_SERIES_PALETTE_SIZE} colours. ${overflow} series past it are painted neutral — fold them into an "Other" series or give them a tone.`,
			);
		}
	}, [overflow]);

	// A time axis is numeric: read Dates and ISO strings as epoch
	// milliseconds, and drop a row whose x is no time rather than plot NaN.
	const plotted = useMemo(
		() =>
			time
				? data.flatMap((row) => {
						const at = toTime(row[xKey]);
						return at === undefined ? [] : [{ ...row, [xKey]: at } as TDatum];
					})
				: [...data],
		[data, time, xKey],
	);

	const fx = useCallback(
		(v: ChartValue) => formatXValue(v, locale),
		[formatXValue, locale],
	);
	const fy = useCallback(
		(v: ChartValue) => formatValue(v, locale),
		[formatValue, locale],
	);

	const thresholdSignature = JSON.stringify(thresholds ?? []);
	// biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the signature, not the array's identity
	const thresholdList = useMemo(() => thresholds ?? [], [thresholdSignature]);

	const parts = useMemo(() => {
		return [
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
				type={timeScale ? "number" : "category"}
				scale={timeScale ? "time" : "auto"}
				domain={timeScale ? ["dataMin", "dataMax"] : undefined}
				tickFormatter={fx}
				tick={TICK}
				tickLine={false}
				axisLine={{ stroke: tokenColor("border") }}
				minTickGap={24}
			/>,
			<YAxis
				key="y"
				width="auto"
				tickFormatter={fy}
				tick={TICK}
				tickLine={false}
				axisLine={false}
			/>,
			...thresholdParts(thresholdList),
			<Tooltip
				key="tooltip"
				cursor={
					bands
						? { fill: tokenColor("bg-subtle") }
						: { stroke: tokenColor("border-emphasized") }
				}
				isAnimationActive={false}
				content={({ active, label, payload }) => (
					<ChartTooltip
						active={active}
						label={label}
						payload={payload as readonly TooltipEntry[] | undefined}
						series={visible}
						formatX={fx}
						formatValue={fy}
					/>
				)}
			/>,
		];
	}, [grid, xKey, timeScale, bands, fx, fy, visible, thresholdList]);

	// The text alternative: one row per datum, one column per visible series,
	// in the formats the axes and tooltip use.
	const table = useMemo<ChartTable>(
		() => ({
			columns: [xLabel ?? xKey, ...visible.map((s) => s.label)],
			rows: plotted.map((row) => [
				fx(row[xKey] as ChartValue),
				...visible.map((s) => {
					const value = row[s.key];
					return value == null ? "" : fy(value as ChartValue);
				}),
			]),
		}),
		[plotted, visible, xKey, xLabel, fx, fy],
	);
	const notes = useMemo(
		() => thresholdList.map((t) => describeThreshold(t, fy)),
		[thresholdList, fy],
	);

	const animation = useFirstDrawAnimation(animate);
	const lineLabel = thresholdList.some((t) => t.to === undefined);
	const margin = useMemo(
		() => ({
			top: lineLabel ? PLOT_TOP_WITH_LABEL : PLOT_TOP,
			right: 8,
			bottom: 0,
			left: 0,
		}),
		[lineLabel],
	);
	const showLegend = props.legend ?? visible.length > 1;

	return {
		data: plotted,
		visible,
		parts,
		animation,
		margin,
		frame: {
			label: props["aria-label"],
			height: props.height,
			minHeight: props.minHeight,
			loading: props.loading,
			loadingLabel: props.loadingLabel,
			empty: plotted.length === 0 || visible.length === 0,
			emptyLabel: props.emptyLabel,
			legend: showLegend ? visible : undefined,
			summary,
			notes,
			table,
		},
	};
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

/** The chart's data as text: column headings and formatted cells. */
export interface ChartTable {
	columns: string[];
	rows: string[][];
}

/**
 * What screen readers read instead of the plot: the summary and the
 * thresholds as the figure's description, then the data as a table. Visually
 * hidden; the plot carries the same for sighted users.
 */
function ChartText({
	label,
	descriptionId,
	summary,
	notes,
	table,
}: {
	label: string;
	descriptionId?: string;
	summary?: string;
	notes: readonly string[];
	table?: ChartTable;
}) {
	return (
		<>
			{descriptionId && (
				<Box id={descriptionId} srOnly data-chart-description="">
					{summary && <Text>{summary}</Text>}
					{notes.length > 0 && (
						<Box as="ul">
							{notes.map((note, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: two thresholds may read alike
								<Box as="li" key={i}>
									{note}
								</Box>
							))}
						</Box>
					)}
				</Box>
			)}
			{table && (
				<Box srOnly data-chart-table="">
					<table>
						<caption>{label}</caption>
						<thead>
							<tr>
								{table.columns.map((c, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: columns are positional; two series may share a label
									<th key={i} scope="col">
										{c}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{table.rows.map((row, r) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: rows are the data in order
								<tr key={r}>
									{row.map((cell, c) =>
										c === 0 ? (
											// biome-ignore lint/suspicious/noArrayIndexKey: cells are positional
											<th key={c} scope="row">
												{cell}
											</th>
										) : (
											// biome-ignore lint/suspicious/noArrayIndexKey: cells are positional
											<td key={c}>{cell}</td>
										),
									)}
								</tr>
							))}
						</tbody>
					</table>
				</Box>
			)}
		</>
	);
}

export interface ChartFrameProps {
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
	/** A sentence on what the chart shows, read as the figure's description. */
	summary?: string;
	/** Further description lines — the thresholds in words. */
	notes?: readonly string[];
	/** The data as text, the plot's alternative for screen readers. */
	table?: ChartTable;
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
	summary,
	notes = [],
	table,
	children,
}: ChartFrameProps) {
	const state = loading ? "loading" : empty ? "empty" : "ready";
	const id = useId();
	const described = state === "ready" && (!!summary || notes.length > 0);
	const descriptionId = described ? `${id}-description` : undefined;
	return (
		<Flex
			role="figure"
			aria-label={label}
			aria-describedby={descriptionId}
			aria-busy={loading || undefined}
			data-chart={kind}
			data-state={state}
			direction="column"
			gap="2"
			width="100%"
			height={height}
			minHeight={minHeight}
			fontFamily="body"
			fontSize="xs"
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
					{/* The plot fills what the legend leaves. Absolutely placed, so the
					    chart measures the flex item's size even when the frame has
					    only a min-height and no definite height to resolve 100% in. */}
					<Box flex="1" minHeight="0" position="relative">
						<Box position="absolute" inset="0">
							{children}
						</Box>
					</Box>
					<ChartText
						label={label}
						descriptionId={descriptionId}
						summary={summary}
						notes={notes}
						table={table}
					/>
				</>
			)}
		</Flex>
	);
}
