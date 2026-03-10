import { Badge } from "@chakra-ui/react";
import type React from "react";

export interface TypeBadgeProps {
	/** The display name for the badge */
	name: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = (props) => {
	const { name } = props;

	return (
		<Badge rounded="base" px={2} ml={1}>
			{name}
		</Badge>
	);
};

TypeBadge.displayName = "TypeBadge";
