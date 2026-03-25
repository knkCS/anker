import type React from "react";
import { StatusBadge } from "../../../atoms/status-badge";
import { VStack } from "../../../primitives/layout";
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
}

export const StatusBadgeCell: React.FC<StatusBadgeCellProps> = ({
	value,
	colorMap,
	fallbackColor = "gray",
	detail,
	detailColor = "fg.error",
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const color = colorMap?.[value] ?? fallbackColor;
	const badge = <StatusBadge label={value} color={color} />;

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

	return badge;
};
StatusBadgeCell.displayName = "StatusBadgeCell";
