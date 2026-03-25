import { HStack } from "@chakra-ui/react";
import { ChevronDown, Plus } from "lucide-react";
import type React from "react";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "../../primitives/menu";
import { Button, type ButtonProps } from "../button";

export interface SplitButtonMenuItem {
	label: string;
	onClick: () => void;
	icon?: React.ReactNode;
	color?: string;
}

export interface SplitButtonProps extends ButtonProps {
	label: string;
	menuItems?: SplitButtonMenuItem[];
}

export const SplitButton: React.FC<SplitButtonProps> = (props) => {
	const { label, menuItems, onClick, ...rest } = props;
	const hasMenuItems = menuItems && menuItems.length > 0;

	return (
		<HStack gap={0.5}>
			{onClick && (
				<Button
					{...rest}
					colorPalette="blue"
					onClick={onClick}
					size="lg"
					borderEndRadius={hasMenuItems ? "none" : undefined}
				>
					<Plus size={16} />
					{label}
				</Button>
			)}
			{hasMenuItems && (
				<MenuRoot>
					<MenuTrigger asChild>
						<Button
							{...rest}
							size="lg"
							colorPalette="blue"
							borderStartRadius={onClick ? "none" : undefined}
						>
							<ChevronDown size={16} />
							{onClick ? null : label}
						</Button>
					</MenuTrigger>
					<MenuContent>
						{menuItems.map((menuItem) => (
							<MenuItem
								key={menuItem.label}
								value={menuItem.label}
								onClick={menuItem.onClick}
								color={menuItem.color}
							>
								{menuItem.icon}
								{menuItem.label}
							</MenuItem>
						))}
					</MenuContent>
				</MenuRoot>
			)}
		</HStack>
	);
};
SplitButton.displayName = "SplitButton";
