// src/charts/index.ts
//
// `@knkcs/anker/charts`: token-coloured charts over Recharts. Recharts is an
// optional peer dependency reachable only through this entry
// (`scripts/check-optional-deps.ts`), so a consumer who never imports charts
// never loads it.
export { AreaChart, type AreaChartProps } from "./area-chart";
export { BarChart, type BarChartProps } from "./bar-chart";
export {
	CHART_SERIES_PALETTE_SIZE,
	CHART_TONES,
	chartSeriesColor,
	chartToneColor,
} from "./colors";
export {
	type NumberFormatterOptions,
	numberFormatter,
	type TimeFormatterOptions,
	timeFormatter,
} from "./format";
export { LineChart, type LineChartProps } from "./line-chart";
export type {
	ChartBaseProps,
	ChartDatum,
	ChartFormatter,
	ChartSeries,
	ChartThreshold,
	ChartTone,
	ChartValue,
	ChartXType,
} from "./types";
