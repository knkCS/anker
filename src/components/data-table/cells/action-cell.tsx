import type React from "react";
import { IconButton, type IconButtonProps } from "../../../atoms/button";
import { HStack } from "../../../primitives/layout";
import { Tooltip } from "../../../primitives/tooltip";

export interface ActionCellAction {
	icon: React.ElementType;
	label: string;
	onClick: () => void;
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
				</Tooltip>
			))}
		</HStack>
	);
};
ActionCell.displayName = "ActionCell";
