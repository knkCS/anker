import { HStack } from "@chakra-ui/react";
import type React from "react";
import { IconButton } from "../../../atoms/button";
import { Tooltip } from "../../../primitives/tooltip";

export interface ActionCellAction {
	icon: React.ElementType;
	label: string;
	onClick: () => void;
	variant?: string;
	colorPalette?: string;
	disabled?: boolean;
}

export interface ActionCellProps {
	actions: ActionCellAction[];
}

export const ActionCell: React.FC<ActionCellProps> = ({ actions }) => {
	return (
		<HStack gap={1}>
			{actions.map((action, index) => (
				<Tooltip key={`${action.label}-${index}`} content={action.label}>
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
