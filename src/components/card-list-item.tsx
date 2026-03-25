import { Box, Flex, Grid, GridItem, Menu, Portal } from "@chakra-ui/react";
import { Ellipsis } from "lucide-react";
import type React from "react";
import { Children } from "react";

export interface CardListMenuItem<T = string> {
	/** Text label for the menu item. */
	label: string;
	/** Callback fired when the menu item is clicked. */
	onClick: () => void;
	/** Icon rendered before the label. */
	icon?: React.ReactNode;
	/** Text color override for the menu item. */
	color?: string;
	/** Value associated with the menu item. */
	value?: T;
}

export interface CardListItemProps<T = string> {
	/** Whether the item is visually selected. */
	isActive?: boolean;
	/** Callback fired when the row is clicked. */
	handleItemClick?: () => void;
	/** Callback fired when the row is double-clicked. */
	handleItemDoubleClick?: () => void;
	/** Menu items rendered in the row's action menu. */
	menuItems?: CardListMenuItem<T>[];
	/** Component rendered on the left side of the row (e.g., avatar). */
	componentLeft?: React.ReactNode;
	/** CardListData children to render as cells. */
	children: React.ReactNode;
	/** Total number of grid columns. Defaults to 12. */
	columnCount?: number;
}

export const CardListItem = <T extends string = string>({
	isActive,
	handleItemClick,
	handleItemDoubleClick,
	menuItems,
	componentLeft,
	children,
	columnCount = 12,
}: CardListItemProps<T>) => {
	const colSpan = Math.floor(columnCount / Children.count(children));

	return (
		<Flex
			role="row"
			boxShadow={isActive ? "0 0 0 2px token(colors.accent)" : "sm"}
			bg="bg-surface"
			borderRadius="lg"
			alignItems="stretch"
			overflow="hidden"
			transition="all 200ms ease"
		>
			<Flex
				width="100%"
				transition="all 200ms ease"
				_hover={{ bg: "bg-subtle", cursor: "pointer" }}
				alignItems="stretch"
				overflow="hidden"
				onClick={handleItemClick}
				onDoubleClick={handleItemDoubleClick}
				{...(handleItemClick && {
					role: "button",
					tabIndex: 0,
					onKeyDown: (e: React.KeyboardEvent) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							handleItemClick();
						}
					},
				})}
			>
				{componentLeft && (
					<Box
						width={75}
						px={6}
						display="flex"
						justifyContent="center"
						alignItems="center"
					>
						{componentLeft}
					</Box>
				)}

				<Grid
					px={componentLeft === undefined ? 6 : 0}
					py={4}
					width="100%"
					templateRows="repeat(1, 1fr)"
					templateColumns={`repeat(${columnCount}, 1fr)`}
					gap={4}
				>
					{Children.map(children, (child, index) => (
						<GridItem
							// biome-ignore lint/suspicious/noArrayIndexKey: no alternative for key
							key={index}
							colSpan={colSpan}
							display="flex"
							alignItems="center"
						>
							{child}
						</GridItem>
					))}
				</Grid>
			</Flex>
			{menuItems && (
				<Menu.Root>
					<Menu.Trigger
						width="80px"
						px={6}
						display="flex"
						bg="accent"
						color="on-accent"
						alignItems="center"
						justifyContent="center"
						_hover={{ opacity: 0.9 }}
						aria-label="Row actions"
					>
						<Ellipsis size={20} />
					</Menu.Trigger>
					<Portal>
						<Menu.Positioner>
							<Menu.Content>
								{menuItems.map((menuItem) => (
									<Menu.Item
										key={menuItem.label}
										onClick={menuItem.onClick}
										color={menuItem.color}
										value={menuItem.value ?? menuItem.label}
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
		</Flex>
	);
};
(CardListItem as { displayName?: string }).displayName = "CardListItem";
