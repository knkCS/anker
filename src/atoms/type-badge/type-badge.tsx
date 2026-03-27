import type React from "react";
import { Badge, type BadgeProps } from "../../primitives/badge";

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
		<Badge
			rounded="base"
			px={2}
			marginInlineStart={1}
			colorPalette={colorPalette}
			{...rest}
		>
			{name}
		</Badge>
	);
};
TypeBadge.displayName = "TypeBadge";
