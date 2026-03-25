import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface NumberCellProps {
	value: number | string | null | undefined;
	locale?: string;
}

export const NumberCell: React.FC<NumberCellProps> = ({ value, locale }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const num = Number(value);
	const display = Number.isNaN(num)
		? String(value)
		: num.toLocaleString(locale);
	return <span>{display}</span>;
};
NumberCell.displayName = "NumberCell";
