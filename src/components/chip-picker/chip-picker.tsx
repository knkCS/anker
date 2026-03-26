import { Box, Flex, Text } from "@chakra-ui/react";
import { Plus, X } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { IconButton } from "../../atoms/button";
import { TextInput } from "../../atoms/text-input";
import {
	Popover,
	PopoverBody,
	PopoverContent,
	PopoverTrigger,
} from "../../primitives/popover";

export interface ChipPickerProps<T> {
	assigned: T[];
	available: T[];
	onAdd: (item: T) => void;
	onRemove: (item: T) => void;
	getItemId: (item: T) => string;
	getItemLabel: (item: T) => string;
	getItemColor?: (item: T) => string | undefined;
	/** Label for the add button. @default "Add" */
	addLabel?: string;
	/** Label shown when nothing is assigned. @default "None" */
	emptyLabel?: string;
	/** Whether to show a search input inside the popover. @default false */
	searchable?: boolean;
	disabled?: boolean;
	loading?: boolean;
}

function ChipPickerInner<T>(props: ChipPickerProps<T>) {
	const {
		assigned,
		available,
		onAdd,
		onRemove,
		getItemId,
		getItemLabel,
		getItemColor,
		addLabel = "Add",
		emptyLabel = "None",
		searchable = false,
		disabled = false,
	} = props;

	const [search, setSearch] = useState("");

	const assignedIds = new Set(assigned.map(getItemId));
	const unassigned = available.filter(
		(item) => !assignedIds.has(getItemId(item)),
	);

	const filteredUnassigned =
		searchable && search.trim()
			? unassigned.filter((item) =>
					getItemLabel(item).toLowerCase().includes(search.toLowerCase()),
				)
			: unassigned;

	return (
		<Flex wrap="wrap" gap={2} align="center">
			{assigned.length === 0 && (
				<Text fontSize="sm" color="fg.muted">
					{emptyLabel}
				</Text>
			)}

			{assigned.map((item) => {
				const id = getItemId(item);
				const label = getItemLabel(item);
				const color = getItemColor?.(item);

				return (
					<Flex
						key={id}
						borderRadius="full"
						px={3}
						py={1}
						fontSize="sm"
						display="inline-flex"
						align="center"
						gap={1}
						bg={color ? `${color}33` : "bg.muted"}
						color={color ?? "fg.default"}
					>
						<Text as="span" lineHeight="1">
							{label}
						</Text>
						{!disabled && (
							<button
								type="button"
								style={{
									display: "inline-flex",
									alignItems: "center",
									cursor: "pointer",
									lineHeight: 1,
									padding: 0,
									border: "none",
									background: "transparent",
									color: "inherit",
								}}
								aria-label={`Remove ${label}`}
								onClick={() => onRemove(item)}
							>
								<X size={12} />
							</button>
						)}
					</Flex>
				);
			})}

			{unassigned.length > 0 && !disabled && (
				<Popover>
					<PopoverTrigger asChild>
						<IconButton
							variant="ghost"
							size="sm"
							aria-label={addLabel}
							minWidth="44px"
							minHeight="44px"
						>
							<Plus size={14} />
						</IconButton>
					</PopoverTrigger>
					<PopoverContent portalled>
						<PopoverBody>
							{searchable && (
								<TextInput
									placeholder="Search..."
									size="sm"
									mb={2}
									value={search}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setSearch(e.target.value)
									}
								/>
							)}
							{filteredUnassigned.map((item) => (
								<Box
									key={getItemId(item)}
									px={2}
									py={1.5}
									rounded="md"
									cursor="pointer"
									fontSize="sm"
									_hover={{ bg: "bg.subtle" }}
									onClick={() => {
										onAdd(item);
										setSearch("");
									}}
								>
									{getItemLabel(item)}
								</Box>
							))}
							{filteredUnassigned.length === 0 && (
								<Text fontSize="sm" color="fg.muted" px={2} py={1.5}>
									No results
								</Text>
							)}
						</PopoverBody>
					</PopoverContent>
				</Popover>
			)}
		</Flex>
	);
}

export const ChipPicker = ChipPickerInner as <T>(
	props: ChipPickerProps<T>,
) => React.ReactElement;
(ChipPicker as { displayName?: string }).displayName = "ChipPicker";
