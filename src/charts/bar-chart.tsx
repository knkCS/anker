import type React from "react";
import {
	Bar,
	BarChart as RechartsBarChart,
	ResponsiveContainer,
} from "recharts";
import { ChartFrame, useCartesianParts } from "./chart-frame";
import type { ChartBaseProps, ChartDatum } from "./types";

export interface BarChartProps<TDatum extends ChartDatum = ChartDatum>
	extends ChartBaseProps<TDatum> {
	/**
	 * Stack the series in one bar per x value, so its height is their sum —
	 * for parts of a whole (spend per service per day). Unstacked, the
	 * series stand side by side in a group.
	 * @default false
	 */
	stacked?: boolean;
}

/** The corner radius of a bar's top edge. */
const TOP_RADIUS: [number, number, number, number] = [2, 2, 0, 0];

/**
 * Values per category — a day, a project, a service — as bars. Use it to
 * compare amounts between categories, grouped side by side, or `stacked`
 * when the series add up to a whole; use `LineChart` or `AreaChart` for a
 * trend over many points. A `time` x axis gives each reading its own bar.
 * Series take their colours from anker's series palette (or a `tone`);
 * axes, grid, tooltip and legend use anker's tokens and typography.
 */
export function BarChart<TDatum extends ChartDatum = ChartDatum>(
	props: BarChartProps<TDatum>,
): React.ReactElement {
	const { stacked = false } = props;
	const { data, visible, parts, frame, animation, margin } = useCartesianParts(
		props,
		{
			bands: true,
		},
	);
	const top = visible.at(-1)?.key;
	return (
		<ChartFrame kind="bar" {...frame}>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsBarChart
					data={data}
					margin={margin}
					barGap={2}
					barCategoryGap="20%"
				>
					{parts}
					{visible.map((s) => (
						<Bar
							key={s.key}
							dataKey={s.key}
							name={s.label}
							stackId={stacked ? "stack" : undefined}
							fill={s.color}
							maxBarSize={48}
							// Stacked, only the top segment is rounded: the stack reads as
							// one bar.
							radius={!stacked || s.key === top ? TOP_RADIUS : 0}
							{...animation}
						/>
					))}
				</RechartsBarChart>
			</ResponsiveContainer>
		</ChartFrame>
	);
}
BarChart.displayName = "BarChart";
