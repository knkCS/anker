import type React from "react";
import { Box, HStack, Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { DrawerRoot } from "../drawer";
import type { WidgetDefinition } from "./types";

export interface WidgetCatalogProps {
	open: boolean;
	onClose: () => void;
	definitions: WidgetDefinition[];
	onSelect: (def: WidgetDefinition) => void;
	title?: string;
}

export const WidgetCatalog: React.FC<WidgetCatalogProps> = ({
	open,
	onClose,
	definitions,
	onSelect,
	title = "Add a widget",
}) => {
	const groups = new Map<string, WidgetDefinition[]>();
	for (const def of definitions) {
		const key = def.category ?? "Other";
		const list = groups.get(key) ?? [];
		list.push(def);
		groups.set(key, list);
	}

	return (
		<DrawerRoot open={open} onClose={onClose} title={title}>
			<Stack gap={6}>
				{Array.from(groups.entries()).map(([category, defs]) => (
					<Stack key={category} gap={2}>
						<Text
							fontSize="xs"
							fontWeight="semibold"
							color="muted"
							textTransform="uppercase"
						>
							{category}
						</Text>
						{defs.map((def) => (
							<Box
								as="button"
								key={def.type}
								{...({ type: "button" } as object)}
								textAlign="start"
								width="full"
								borderWidth="1px"
								borderColor="border"
								borderRadius="md"
								padding={3}
								bg="bg-surface"
								_hover={{ bg: "bg-subtle" }}
								onClick={() => {
									onSelect(def);
									onClose();
								}}
								aria-label={def.name}
							>
								<HStack gap={3} align="start">
									<Box color="subtle">{def.icon}</Box>
									<Stack gap={0}>
										<Text fontWeight="medium" fontSize="sm">
											{def.name}
										</Text>
										{def.description && (
											<Text fontSize="xs" color="muted">
												{def.description}
											</Text>
										)}
									</Stack>
								</HStack>
							</Box>
						))}
					</Stack>
				))}
			</Stack>
		</DrawerRoot>
	);
};
WidgetCatalog.displayName = "WidgetCatalog";
