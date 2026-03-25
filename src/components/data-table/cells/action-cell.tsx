import type React from "react";
import { IconButton, type IconButtonProps } from "../../../atoms/button";
import { HStack } from "../../../primitives/layout";
import { Tooltip } from "../../../primitives/tooltip";

export interface ActionCellAction {
	icon: React.ElementType;
	label: string;
	onClick?: () => void;
	/** Renders the action as a link. Mutually exclusive with onClick. */
	href?: string;
	/** Adds a download attribute to the link. Only used with href. */
	download?: boolean | string;
	/** Link target (e.g., "_blank"). Only used with href. */
	target?: string;
	variant?: IconButtonProps["variant"];
	colorPalette?: string;
	disabled?: boolean;
}

export interface ActionCellProps {
	actions: ActionCellAction[];
}

export const ActionCell: React.FC<ActionCellProps> = ({ actions }) => {
	return (
		<HStack gap={1}>
			{actions.map((action) => (
				<Tooltip key={action.label} content={action.label}>
					{action.href ? (
						<IconButton
							aria-label={action.label}
							size="sm"
							variant={action.variant ?? "ghost"}
							colorPalette={action.colorPalette}
							disabled={action.disabled}
							asChild
						>
							<a
								href={action.href}
								download={action.download}
								target={action.target}
								rel={
									action.target === "_blank" ? "noopener noreferrer" : undefined
								}
							>
								<action.icon size={16} />
							</a>
						</IconButton>
					) : (
						<IconButton
							aria-label={action.label}
							size="sm"
							variant={action.variant ?? "ghost"}
							colorPalette={action.colorPalette}
							onClick={action.onClick}
							disabled={action.disabled}
						>
							<action.icon size={16} />
						</IconButton>
					)}
				</Tooltip>
			))}
		</HStack>
	);
};
ActionCell.displayName = "ActionCell";
