import type React from "react";
import { emptyCellValue } from "./cell-utils";
import { ClippedText } from "./clipped-text";

export interface SlugCellProps {
	value: string | null | undefined;
}

/**
 * A slug, handle or code in monospace, on one line. A value wider than its
 * column ends in "…" at the column's edge and shows whole on hover (#369).
 */
export const SlugCell: React.FC<SlugCellProps> = ({ value }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return (
		<ClippedText whole={value} code>
			{value}
		</ClippedText>
	);
};
SlugCell.displayName = "SlugCell";
