import type React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Link as ChakraLink } from "../../../primitives/typography";
import { emptyCellValue } from "./cell-utils";

export interface LinkCellProps {
	/** Route path for navigation. Renders em-dash when null/undefined. */
	to: string | null | undefined;
	/** Display text or node. Falls back to `to` value if not provided. */
	label?: React.ReactNode;
}

export const LinkCell: React.FC<LinkCellProps> = ({ to, label }) => {
	if (to == null) return <span>{emptyCellValue}</span>;
	return (
		<ChakraLink color="accent" asChild>
			<RouterLink
				to={to}
				onClick={(e: React.MouseEvent) => e.stopPropagation()}
			>
				{label || to}
			</RouterLink>
		</ChakraLink>
	);
};
LinkCell.displayName = "LinkCell";
