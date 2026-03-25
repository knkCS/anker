import type React from "react";
import { StatusBadge } from "../../../atoms/status-badge";
import { emptyCellValue } from "./cell-utils";

export interface StatusBadgeCellProps {
	value: string | null | undefined;
	colorMap?: Record<string, string>;
	/** Fallback color when value has no entry in colorMap. @default "gray" */
	fallbackColor?: string;
}

export const StatusBadgeCell: React.FC<StatusBadgeCellProps> = ({
	value,
	colorMap,
	fallbackColor = "gray",
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const color = colorMap?.[value] ?? fallbackColor;
	return <StatusBadge label={value} color={color} />;
};
StatusBadgeCell.displayName = "StatusBadgeCell";
