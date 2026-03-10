import { Box, Flex, Grid, GridItem, Menu, Portal } from "@chakra-ui/react";
import { Ellipsis } from "lucide-react";
import { Children } from "react";

export interface TableMenuItem<T = string> {
	label: string;
	onClick: () => void;
	icon?: React.ReactNode;
	color?: string;
	value?: T;
}

export interface TableItemProps<T = string> {
	isActive?: boolean;
	handleItemClick?: () => void;
	handleItemDoubleClick?: () => void;
	menuItems?: TableMenuItem<T>[];
	componentLeft?: React.ReactNode;
	children: React.ReactNode;
	/** Total number of grid columns. Defaults to 12. */
	columnCount?: number;
}

export const TableItem = <T extends string = string>({
	isActive,
	handleItemClick,
	handleItemDoubleClick,
	menuItems,
	componentLeft,
	children,
	columnCount = 12,
}: TableItemProps<T>) => {
	const colSpan = Math.floor(columnCount / Children.count(children));

	return (
		<Flex
			role="row"
			boxShadow="base"
			bg="bg-surface"
			borderRadius="2xl"
			alignItems="stretch"
			overflow="hidden"
			transition="all 200ms ease"
			outline="solid 3px transparent"
			outlineColor={isActive ? "accent" : "transparent"}
		>
			<Flex
				width="100%"
				transition="all 200ms ease"
				_hover={{ bg: "bg-subtle", cursor: "pointer" }}
				alignItems="stretch"
				overflow="hidden"
				onClick={handleItemClick}
				onDoubleClick={handleItemDoubleClick}
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
