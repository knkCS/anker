import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface BooleanCellProps {
	value: boolean | null | undefined;
	trueLabel?: string;
	falseLabel?: string;
}

export const BooleanCell: React.FC<BooleanCellProps> = ({
	value,
	trueLabel = "Yes",
	falseLabel = "No",
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return <span>{value ? trueLabel : falseLabel}</span>;
};
BooleanCell.displayName = "BooleanCell";
