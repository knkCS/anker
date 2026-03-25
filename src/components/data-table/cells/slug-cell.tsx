import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface SlugCellProps {
	value: string | null | undefined;
}

export const SlugCell: React.FC<SlugCellProps> = ({ value }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return (
		<span style={{ fontFamily: "var(--chakra-fonts-mono)" }}>{value}</span>
	);
};
SlugCell.displayName = "SlugCell";
