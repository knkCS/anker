import {
	Box,
	ButtonGroup,
	type CardRootProps,
	Collapsible,
	Flex,
	HStack,
	IconButton,
	Menu,
	Portal,
	Text,
} from "@chakra-ui/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { type MouseEventHandler } from "react";
import { Card } from "./card";

export interface FactBoxAction {
	id: number;
	type: "button" | "menuButton";
	ariaLabel: string;
	icon?: React.ReactElement;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	onSelect?: VoidFunction;
	items?: FactBoxAction[];
}

export interface FactBoxProps extends CardRootProps {
	name?: string | React.ReactNode;
	actions?: FactBoxAction[];
	children: React.ReactNode;
	collapsible?: boolean;
	/** Label for collapse button when expanded. @default "Collapse" */
	collapseLabel?: string;
	/** Label for collapse button when collapsed. @default "Expand" */
	expandLabel?: string;
}

export const FactBox: React.FC<FactBoxProps> = (props) => {
	const {
		name,
		actions,
		collapsible = true,
		collapseLabel = "Collapse",
		expandLabel = "Expand",
		...rest
	} = props;

	const [show, setShow] = React.useState(true);

	const handleToggle = () => {
		setShow(!show);
	};

	return (
		<Box w="full">
			{collapsible ? (
				<Flex
					flexDirection="column"
					mx="auto"
					borderBottom="1px solid"
					borderColor="border"
				>
					<Box
						display={{ md: "flex" }}
						alignItems={{ md: "center" }}
						justifyContent={{ md: "space-between" }}
					>
						<Box minW={0} flex="1 1 0%">
							<HStack>
								<IconButton
									aria-label={show ? collapseLabel : expandLabel}
									variant="ghost"
									size="sm"
									onClick={(e) => {
										e.preventDefault();
										handleToggle();
									}}
								>
									{show ? (
										<ChevronDown size={16} />
									) : (
										<ChevronRight size={16} />
									)}
								</IconButton>
								{typeof name === "string" ? <Text>{name}</Text> : name}
							</HStack>
						</Box>
						{actions ? (
							<Flex flexShrink={0} marginInlineStart={{ md: 4 }}>
								<ButtonGroup>
									{actions.map((action) =>
										action.type === "button" ? (
											<IconButton
												key={action.id}
												aria-label={action.ariaLabel}
												size="md"
												variant="ghost"
												onClick={action.onClick}
											>
												{action.icon}
											</IconButton>
										) : (
											<Menu.Root key={action.id}>
												<Menu.Trigger asChild>
													<IconButton
														aria-label={action.ariaLabel}
														size="md"
														variant="ghost"
													>
														{action.icon}
													</IconButton>
												</Menu.Trigger>
												<Portal>
													<Menu.Positioner>
														<Menu.Content>
															{action.items?.map((item) => (
																<Menu.Item
																	key={item.id}
																	onSelect={item.onSelect}
																	aria-label={item.ariaLabel}
																	value={`action-${item.id}`}
																>
																	{item.icon}
																	{item.ariaLabel}
																</Menu.Item>
															))}
														</Menu.Content>
													</Menu.Positioner>
												</Portal>
											</Menu.Root>
										),
									)}
								</ButtonGroup>
							</Flex>
						) : null}
					</Box>
				</Flex>
			) : null}
			<Collapsible.Root open={show}>
				<Collapsible.Content>
					<Card {...rest}>{rest.children}</Card>
				</Collapsible.Content>
			</Collapsible.Root>
		</Box>
	);
};
