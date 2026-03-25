import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface UrlCellProps {
	value: string | null | undefined;
	label?: string;
}

export const UrlCell: React.FC<UrlCellProps> = ({ value, label }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return (
		<a
			href={value}
			target="_blank"
			rel="noopener noreferrer"
			title={value}
			style={{ color: "var(--chakra-colors-accent)" }}
		>
			{label || value}
		</a>
	);
};
UrlCell.displayName = "UrlCell";
