import type React from "react";
import { Code } from "../../../primitives/typography";
import { emptyCellValue, truncateText } from "./cell-utils";

export interface CodeCellProps {
	value: string | null | undefined;
	maxLength?: number;
}

export const CodeCell: React.FC<CodeCellProps> = ({
	value,
	maxLength = 80,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const display = truncateText(value, maxLength);
	return (
		<Code title={value} fontSize="0.85em">
			{display}
		</Code>
	);
};
CodeCell.displayName = "CodeCell";
