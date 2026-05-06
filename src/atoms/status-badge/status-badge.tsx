import { readableColor } from "color2k";
import type React from "react";
import { useMemo } from "react";
import { Badge } from "../../primitives/badge";

export interface StatusBadgeProps {
	/** The display label for the badge */
	label: string;
	/** The background color for the badge (hex format, e.g. "#ff0000") */
	color: string;
	/** Optional icon rendered inline before the label inside the badge. */
	icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
	const { label, color, icon } = props;

	const textColor = useMemo(() => {
		try {
			return readableColor(color);
		} catch {
			return "black";
		}
	}, [color]);

	return (
		<Badge
			bg={color}
			color={textColor}
			rounded="base"
			px={2}
			marginInlineStart={1}
			gap={1}
		>
			{icon}
			{label}
		</Badge>
	);
};

StatusBadge.displayName = "StatusBadge";
