import type { ReactNode } from "react";

/**
 * A semantic tone for a series whose meaning matters more than its identity —
 * "over budget" reads as `warning`, "failed" as `danger`. Same vocabulary as
 * `StatusBadge`'s `tone`.
 */
export type ChartTone =
	| "accent"
	| "success"
	| "warning"
	| "danger"
	| "info"
	| "neutral";

/** A value on an axis or in a tooltip, as a chart reads it from a row. */
export type ChartValue = string | number | Date;

/** Turns a value into the text an axis tick or a tooltip shows. */
export type ChartFormatter = (value: ChartValue) => string;

/** A data row: one point per series, plus the x value. */
export type ChartDatum = Record<string, unknown>;

/**
 * One series of a chart: which field of each row it plots and what it is
 * called. Never a colour — the series takes the palette slot of its position
 * in `series`, or the colour of its `tone`.
 */
export interface ChartSeries<TDatum extends ChartDatum = ChartDatum> {
	/** The row field this series plots. Also its identity (React key, legend). */
	key: Extract<keyof TDatum, string>;
	/** The name in the legend and the tooltip. @default key */
	label?: string;
	/**
	 * Paint the series in this tone instead of its palette slot — only when
	 * its meaning matters (a limit, a failure rate).
	 */
	tone?: ChartTone;
	/**
	 * Leave the series out without repainting the others: a hidden series
	 * keeps its palette slot, so toggling one never shifts the colours of the
	 * rest. Hide rather than remove when a filter changes what is shown.
	 */
	hidden?: boolean;
}

/** How the x axis reads its values. */
export type ChartXType = "category" | "time";

/** What every chart takes, whatever it draws. */
export interface ChartBaseProps<TDatum extends ChartDatum = ChartDatum> {
	/** The rows to plot, in x order. */
	data: readonly TDatum[];
	/** The series to draw, in palette order. */
	series: readonly ChartSeries<TDatum>[];
	/** The row field the x axis reads. */
	xKey: Extract<keyof TDatum, string>;
	/**
	 * `category` (the default) spaces x values evenly, as labels; `time`
	 * places them on a time scale and reads numbers (epoch milliseconds),
	 * `Date`s or ISO strings.
	 */
	xType?: ChartXType;
	/**
	 * The chart's accessible name — what it shows ("Load over time"). Required:
	 * only the call site knows it.
	 */
	"aria-label": string;
	/** Formats x values on the axis and as the tooltip's heading. */
	formatX?: ChartFormatter;
	/** Formats y values on the axis and in the tooltip. */
	formatValue?: ChartFormatter;
	/**
	 * The chart's height. The chart always fills its container's width; by
	 * default it fills its height too (`100%`), so a chart in a dashboard
	 * widget takes the widget's size. Give a height where the container has
	 * none of its own.
	 * @default "100%"
	 */
	height?: number | string;
	/** The height the chart never shrinks below. @default 160 */
	minHeight?: number | string;
	/** Show the legend. @default true for two or more series, false for one */
	legend?: boolean;
	/** Draw the horizontal grid lines. @default true */
	grid?: boolean;
	/** Show a placeholder the size of the chart while the data loads. */
	loading?: boolean;
	/** What an empty chart (no rows, or no visible series) says. @default "No data" */
	emptyLabel?: ReactNode;
	/** Accessible name of the loading placeholder. @default "Loading chart" */
	loadingLabel?: string;
	/** Animate the series when they first draw. @default false */
	animate?: boolean;
}
