import {
	Button,
	type ButtonProps,
	HStack,
	Menu,
	Portal,
} from "@chakra-ui/react";
import { ChevronDown, Plus } from "lucide-react";
import type React from "react";

export interface SelectActionMenuItem {
	label: string;
	onClick: () => void;
	icon?: React.ReactNode;
	color?: string;
}

export interface SelectActionFieldProps extends ButtonProps {
	label: string;
	menuItems?: SelectActionMenuItem[];
}

export const SelectActionField: React.FC<SelectActionFieldProps> = (props) => {
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
					roundedRight={hasMenuItems ? "none" : undefined}
				>
					<Plus size={16} />
					{label}
				</Button>
			)}
			{hasMenuItems && (
				<Menu.Root>
					<Menu.Trigger asChild>
						<Button
							{...rest}
							size="lg"
							colorPalette="blue"
							roundedLeft={onClick ? "none" : undefined}
						>
							<ChevronDown size={16} />
							{onClick ? null : label}
						</Button>
					</Menu.Trigger>
					<Portal>
						<Menu.Positioner>
							<Menu.Content>
								{menuItems.map((menuItem) => (
									<Menu.Item
										key={menuItem.label}
										value={menuItem.label}
										onClick={menuItem.onClick}
										color={menuItem.color}
									>
										{menuItem.icon}
										{menuItem.label}
									</Menu.Item>
								))}
							</Menu.Content>
						</Menu.Positioner>
					</Portal>
				</Menu.Root>
			)}
		</HStack>
	);
};
SelectActionField.displayName = "SelectActionField";
