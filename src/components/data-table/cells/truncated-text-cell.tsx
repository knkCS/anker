import type React from "react";
import { emptyCellValue, truncateText } from "./cell-utils";

export interface TruncatedTextCellProps {
	value: string | null | undefined;
	maxLength?: number;
}

export const TruncatedTextCell: React.FC<TruncatedTextCellProps> = ({
	value,
	maxLength,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const display = maxLength != null ? truncateText(value, maxLength) : value;
	return <span title={value}>{display}</span>;
};
TruncatedTextCell.displayName = "TruncatedTextCell";
