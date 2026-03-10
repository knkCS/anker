import { Badge } from "@chakra-ui/react";
import { readableColor } from "color2k";
import type React from "react";
import { useMemo } from "react";

export interface StatusBadgeProps {
	/** The display label for the badge */
	label: string;
	/** The background color for the badge (hex format, e.g. "#ff0000") */
	color: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
	const { label, color } = props;

	const textColor = useMemo(() => {
		try {
			return readableColor(color);
		} catch {
			return "black";
		}
	}, [color]);

	return (
		<Badge bg={color} color={textColor} rounded="base" px={2} ml={1}>
			{label}
		</Badge>
	);
};

StatusBadge.displayName = "StatusBadge";
