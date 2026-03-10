import { Badge, type BadgeProps } from "@chakra-ui/react";
import type React from "react";

export interface TypeBadgeProps extends Omit<BadgeProps, "children"> {
	/** Display name for the badge. */
	name: string;
	/** Chakra color palette for visual differentiation. @default "gray" */
	colorPalette?: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({
	name,
	colorPalette = "gray",
	...rest
}) => {
	return (
		<Badge rounded="base" px={2} ml={1} colorPalette={colorPalette} {...rest}>
			{name}
		</Badge>
	);
};
