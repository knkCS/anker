import type React from "react";
import {
	Area,
	AreaChart as RechartsAreaChart,
	ResponsiveContainer,
} from "recharts";
import { ChartFrame, useCartesianParts } from "./chart-frame";
import { tokenColor } from "./colors";
import type { ChartBaseProps, ChartDatum } from "./types";

export interface AreaChartProps<TDatum extends ChartDatum = ChartDatum>
	extends ChartBaseProps<TDatum> {
	/**
	 * Stack the series on each other, so the top edge is their sum — for
	 * parts of a whole (spend per project). Unstacked areas overlap.
	 * @default false
	 */
	stacked?: boolean;
}

/**
 * Values over an ordered x — usually time — as filled areas. Use it when the
 * volume matters (load, spend), and `stacked` when the series add up to a
 * whole; use `LineChart` to compare series that overlap. Series take their
 * colours from anker's series palette (or a `tone`); axes, grid, tooltip and
 * legend use anker's tokens and typography.
 */
export function AreaChart<TDatum extends ChartDatum = ChartDatum>(
	props: AreaChartProps<TDatum>,
): React.ReactElement {
	const { stacked = false, animate = false } = props;
	const { data, visible, parts } = useCartesianParts(props);
	const showLegend = props.legend ?? visible.length > 1;
	return (
		<ChartFrame
			kind="area"
			label={props["aria-label"]}
			height={props.height}
			minHeight={props.minHeight}
			loading={props.loading}
			loadingLabel={props.loadingLabel}
			empty={data.length === 0 || visible.length === 0}
			emptyLabel={props.emptyLabel}
			legend={showLegend ? visible : undefined}
		>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsAreaChart
					data={data}
					margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
				>
					{parts}
					{visible.map((s) => (
						<Area
							key={s.key}
							dataKey={s.key}
							name={s.label}
							type="monotone"
							stackId={stacked ? "stack" : undefined}
							stroke={s.color}
							strokeWidth={2}
							fill={s.color}
							fillOpacity={stacked ? 0.45 : 0.15}
							dot={false}
							activeDot={{
								r: 4,
								fill: s.color,
								stroke: tokenColor("bg-surface"),
								strokeWidth: 2,
							}}
							isAnimationActive={animate}
						/>
					))}
				</RechartsAreaChart>
			</ResponsiveContainer>
		</ChartFrame>
	);
}
AreaChart.displayName = "AreaChart";
