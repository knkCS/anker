import type React from "react";
import { emptyCellValue, pluralize } from "./cell-utils";

export interface CountCellProps {
	value: unknown[] | Record<string, unknown> | number | null | undefined;
	singular: string;
	plural: string;
	countFn?: (value: unknown) => number;
}

export const CountCell: React.FC<CountCellProps> = ({
	value,
	singular,
	plural,
	countFn,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;

	let count: number;
	if (countFn) {
		count = countFn(value);
		if (!Number.isFinite(count)) return <span>{emptyCellValue}</span>;
	} else if (typeof value === "number") {
		count = value;
	} else if (Array.isArray(value)) {
		count = value.length;
	} else if (typeof value === "object") {
		count = Object.keys(value).length;
	} else {
		return <span>{emptyCellValue}</span>;
	}

	return (
		<span>
			{count} {pluralize(count, singular, plural)}
		</span>
	);
};
CountCell.displayName = "CountCell";
