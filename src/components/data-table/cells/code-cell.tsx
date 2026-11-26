import type React from "react";
import { emptyCellValue, truncateText } from "./cell-utils";
import { ClippedText, CutValue } from "./clipped-text";

export interface CodeCellProps {
	value: string | null | undefined;
	maxLength?: number;
}

/**
 * A code value in monospace, on one line. A value wider than its column ends
 * in "…" at the column's edge, and hovering it shows the whole value in
 * anker's tooltip — as does a value `maxLength` cut (#369). A value that fits
 * shows no tooltip.
 */
export const CodeCell: React.FC<CodeCellProps> = ({
	value,
	maxLength = 80,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const cut = value.length > maxLength;
	return (
		<ClippedText
			whole={value}
			cut={cut}
			code
			lineProps={{ fontSize: "0.85em" }}
		>
			{cut ? (
				<CutValue display={truncateText(value, maxLength)} whole={value} />
			) : (
				value
			)}
		</ClippedText>
	);
};
CodeCell.displayName = "CodeCell";
