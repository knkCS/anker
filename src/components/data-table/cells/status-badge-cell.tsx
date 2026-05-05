import type React from "react";
import { StatusBadge } from "../../../atoms/status-badge";
import { VStack } from "../../../primitives/layout";
import { Tooltip } from "../../../primitives/tooltip";
import { Text } from "../../../primitives/typography";
import { emptyCellValue } from "./cell-utils";

export interface StatusBadgeCellProps {
	value: string | null | undefined;
	colorMap?: Record<string, string>;
	/** Fallback color when value has no entry in colorMap. @default "gray" */
	fallbackColor?: string;
	/** Optional detail text displayed below the badge (e.g., error message). */
	detail?: string | null;
	/** Color for the detail text. @default "fg.error" */
	detailColor?: string;
	/**
	 * Optional tooltip content shown on hover/focus over the badge. Useful
	 * for status descriptions, full JSON payloads, or contextual hints that
	 * don't fit on the badge label.
	 */
	tooltip?: React.ReactNode;
}

export const StatusBadgeCell: React.FC<StatusBadgeCellProps> = ({
	value,
	colorMap,
	fallbackColor = "gray",
	detail,
	detailColor = "fg.error",
	tooltip,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const color = colorMap?.[value] ?? fallbackColor;
	let badge: React.ReactNode = <StatusBadge label={value} color={color} />;

	if (tooltip != null) {
		badge = (
			<Tooltip content={tooltip} showArrow>
				<span>{badge}</span>
			</Tooltip>
		);
	}

	if (detail) {
		return (
			<VStack align="start" gap={0.5}>
				{badge}
				<Text fontSize="xs" color={detailColor}>
					{detail}
				</Text>
			</VStack>
		);
	}

	return <>{badge}</>;
};
StatusBadgeCell.displayName = "StatusBadgeCell";
