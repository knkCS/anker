import type React from "react";
import { Code } from "../../../primitives/typography";
import { emptyCellValue } from "./cell-utils";

export interface SlugCellProps {
	value: string | null | undefined;
}

export const SlugCell: React.FC<SlugCellProps> = ({ value }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return <Code>{value}</Code>;
};
SlugCell.displayName = "SlugCell";
