import { Collapsible, Flex, HStack, Text } from "@chakra-ui/react";
import { X } from "lucide-react";
import type React from "react";
import { Button, IconButton } from "../../atoms/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../../primitives/popover";

export interface BulkActionBarProps {
	/** Number of currently selected items. */
	selectedCount: number;
	/** Called when the user clicks the clear-selection button. */
	onClear: () => void;
	/** Explicitly control visibility. Defaults to `selectedCount > 0`. */
	visible?: boolean;
	/** CSS position for the bar. @default "fixed" */
	position?: "fixed" | "sticky";
	/** Action buttons / popover actions to display. */
	children: React.ReactNode;
	/** Custom label renderer. Defaults to `"{n} items selected"`. */
	countLabel?: (count: number) => string;
}

export interface BulkActionProps {
	/** Visible button label. */
	label: string;
	/** Optional icon rendered before the label. */
	icon?: React.ReactNode;
	/** Called when the button is clicked. */
	onClick: () => void;
	/** Chakra color palette for the button. */
	colorPalette?: string;
	/** Whether the button is disabled. */
	disabled?: boolean;
	/** Whether the button shows a loading spinner. */
	loading?: boolean;
}

export interface BulkPopoverActionProps {
	/** Visible trigger label. */
	label: string;
	/** Optional icon rendered before the label. */
	icon?: React.ReactNode;
	/** Content rendered inside the popover. */
	children: React.ReactNode;
	/** Whether the trigger button is disabled. */
	disabled?: boolean;
}

const BulkAction = ({
	label,
	icon,
	onClick,
	colorPalette,
	disabled,
	loading,
}: BulkActionProps) => (
	<Button
		size="sm"
		onClick={onClick}
		colorPalette={colorPalette}
		disabled={disabled}
		loading={loading}
	>
		{icon}
		{label}
	</Button>
);
BulkAction.displayName = "BulkActionBar.Action";

const BulkPopoverAction = ({
	label,
	icon,
	children,
	disabled,
}: BulkPopoverActionProps) => (
	<Popover>
		<PopoverTrigger asChild>
			<Button size="sm" disabled={disabled}>
				{icon}
				{label}
			</Button>
		</PopoverTrigger>
		<PopoverContent>{children}</PopoverContent>
	</Popover>
);
BulkPopoverAction.displayName = "BulkActionBar.PopoverAction";

export const BulkActionBar = ({
	selectedCount,
	onClear,
	visible,
	position = "fixed",
	children,
	countLabel,
}: BulkActionBarProps) => {
	const isVisible = visible ?? selectedCount > 0;
	const label = countLabel
		? countLabel(selectedCount)
		: `${selectedCount} items selected`;

	return (
		<Collapsible.Root open={isVisible}>
			<Collapsible.Content>
				<Flex
					position={position}
					bottom={0}
					insetInline={0}
					zIndex="sticky"
					bg="bg.surface"
					borderTopWidth="1px"
					borderColor="border"
					shadow="lg"
					px={4}
					py={3}
					align="center"
					justify="space-between"
				>
					<HStack gap={2}>
						<Text fontWeight="medium" fontSize="sm">
							{label}
						</Text>
						<IconButton
							aria-label="Clear selection"
							size="sm"
							variant="ghost"
							onClick={onClear}
						>
							<X size={14} />
						</IconButton>
					</HStack>
					<HStack gap={2}>{children}</HStack>
				</Flex>
			</Collapsible.Content>
		</Collapsible.Root>
	);
};
BulkActionBar.displayName = "BulkActionBar";

BulkActionBar.Action = BulkAction;
BulkActionBar.PopoverAction = BulkPopoverAction;
