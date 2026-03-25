import type React from "react";
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
		<code
			title={value}
			style={{
				fontFamily: "var(--chakra-fonts-mono)",
				fontSize: "0.85em",
				backgroundColor: "var(--chakra-colors-bg-subtle)",
				padding: "0.1em 0.4em",
				borderRadius: "var(--chakra-radii-sm)",
			}}
		>
			{display}
		</code>
	);
};
CodeCell.displayName = "CodeCell";
