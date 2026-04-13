import { Ellipsis } from "lucide-react";
import type React from "react";
import { Button, IconButton } from "../../../atoms/button";
import { HStack } from "../../../primitives/layout";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "../../../primitives/menu";
import { Tooltip } from "../../../primitives/tooltip";

export interface MenuCellAction {
	/** Display label — shown as menu item text or as tooltip for inline buttons */
	label: string;
	/** Handler called when the action is triggered */
	onClick: () => void;
	/** Lucide icon component — shown in menu items and inline buttons */
	icon?: React.ElementType;
	/** Disables the action */
	disabled?: boolean;
	/** Color palette override (e.g., "red" for destructive actions) */
	colorPalette?: string;
}

export interface MenuCellProps {
	/** List of actions to render */
	actions: MenuCellAction[];
	/**
	 * Max number of actions to render inline.
	 * If actions.length > menuThreshold, all actions collapse into a dropdown.
	 * @default 1
	 */
	menuThreshold?: number;
	/** Override the default menu trigger icon (Ellipsis) */
	menuIcon?: React.ElementType;
}

export const MenuCell: React.FC<MenuCellProps> = ({
	actions,
	menuThreshold = 1,
	menuIcon: MenuIcon = Ellipsis,
}) => {
	if (actions.length === 0) return null;

	const useMenu = actions.length > menuThreshold;

	if (useMenu) {
		return (
			<MenuRoot>
				<MenuTrigger asChild>
					<IconButton
						aria-label="Actions"
						size="sm"
						variant="ghost"
						onClick={(e: React.MouseEvent) => e.stopPropagation()}
					>
						<MenuIcon size={16} />
					</IconButton>
				</MenuTrigger>
				<MenuContent>
					{actions.map((action) => (
						<MenuItem
							key={action.label}
							value={action.label}
							onClick={action.onClick}
							disabled={action.disabled}
							colorPalette={action.colorPalette}
						>
							{action.icon && <action.icon size={16} />}
							{action.label}
						</MenuItem>
					))}
				</MenuContent>
			</MenuRoot>
		);
	}

	return (
		<HStack gap={1} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
			{actions.map((action) =>
				action.icon ? (
					<Tooltip key={action.label} content={action.label}>
						<IconButton
							aria-label={action.label}
							size="sm"
							variant="ghost"
							colorPalette={action.colorPalette}
							onClick={action.onClick}
							disabled={action.disabled}
						>
							<action.icon size={16} />
						</IconButton>
					</Tooltip>
				) : (
					<Button
						key={action.label}
						size="sm"
						variant="ghost"
						colorPalette={action.colorPalette}
						onClick={action.onClick}
						disabled={action.disabled}
					>
						{action.label}
					</Button>
				),
			)}
		</HStack>
	);
};
MenuCell.displayName = "MenuCell";
