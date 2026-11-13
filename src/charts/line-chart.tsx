import type React from "react";
import {
	Line,
	LineChart as RechartsLineChart,
	ResponsiveContainer,
} from "recharts";
import { ChartFrame, useCartesianParts } from "./chart-frame";
import { tokenColor } from "./colors";
import type { ChartBaseProps, ChartDatum } from "./types";

export interface LineChartProps<TDatum extends ChartDatum = ChartDatum>
	extends ChartBaseProps<TDatum> {
	/** Draw a dot on every point, not only the hovered one. @default false */
	dots?: boolean;
}

/**
 * Values over an ordered x — usually time — as lines. Use it to compare how a
 * few series move; use `AreaChart` when the size of the whole matters.
 * Series take their colours from anker's series palette (or a `tone`);
 * axes, grid, tooltip and legend use anker's tokens and typography.
 */
export function LineChart<TDatum extends ChartDatum = ChartDatum>(
	props: LineChartProps<TDatum>,
): React.ReactElement {
	const { dots = false } = props;
	const { data, visible, parts, frame, animation, margin } =
		useCartesianParts(props);
	return (
		<ChartFrame kind="line" {...frame}>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsLineChart data={data} margin={margin}>
					{parts}
					{visible.map((s) => (
						<Line
							key={s.key}
							dataKey={s.key}
							name={s.label}
							type="monotone"
							stroke={s.color}
							strokeWidth={2}
							dot={dots ? { r: 3, fill: s.color, strokeWidth: 0 } : false}
							activeDot={{
								r: 4,
								fill: s.color,
								stroke: tokenColor("bg-surface"),
								strokeWidth: 2,
							}}
							{...animation}
						/>
					))}
				</RechartsLineChart>
			</ResponsiveContainer>
		</ChartFrame>
	);
}
LineChart.displayName = "LineChart";
