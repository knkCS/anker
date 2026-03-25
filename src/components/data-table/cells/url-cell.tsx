import type React from "react";
import { Link } from "../../../primitives/typography";
import { emptyCellValue } from "./cell-utils";

export interface UrlCellProps {
	value: string | null | undefined;
	label?: string;
}

export const UrlCell: React.FC<UrlCellProps> = ({ value, label }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return (
		<Link
			href={value}
			target="_blank"
			rel="noopener noreferrer"
			title={value}
			color="accent"
		>
			{label || value}
		</Link>
	);
};
UrlCell.displayName = "UrlCell";
