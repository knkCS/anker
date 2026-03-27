import type React from "react";
import { Checkbox } from "../../primitives/checkbox";
import { Box, Flex } from "../../primitives/layout";

export interface SelectableCardProps {
	/** Whether the card is currently selected. */
	selected?: boolean;
	/** Whether the checkbox is always visible (e.g. when any card in the grid is selected). */
	selectionVisible?: boolean;
	/** Called when the checkbox is toggled. When provided, a checkbox is rendered. */
	onSelect?: () => void;
	/** Called when the card body area is clicked (for navigation). */
	onClick?: () => void;
	/** Disables interaction. */
	disabled?: boolean;
	children: React.ReactNode;
}

export interface SelectableCardThumbnailProps {
	/** Height of the thumbnail area. Defaults to "160px". */
	height?: string;
	children: React.ReactNode;
}

export interface SelectableCardBodyProps {
	children: React.ReactNode;
}

export interface SelectableCardFooterProps {
	children: React.ReactNode;
}

const SelectableCardThumbnail = ({
	height = "160px",
	children,
}: SelectableCardThumbnailProps) => (
	<Box
		h={height}
		overflow="hidden"
		bg="bg.subtle"
		display="flex"
		alignItems="center"
		justifyContent="center"
	>
		{children}
	</Box>
);
SelectableCardThumbnail.displayName = "SelectableCard.Thumbnail";

const SelectableCardBody = ({ children }: SelectableCardBodyProps) => (
	<Box p={3}>{children}</Box>
);
SelectableCardBody.displayName = "SelectableCard.Body";

const SelectableCardFooter = ({ children }: SelectableCardFooterProps) => (
	<Flex
		p={3}
		borderTopWidth="1px"
		borderColor="border"
		justify="space-between"
		align="center"
	>
		{children}
	</Flex>
);
SelectableCardFooter.displayName = "SelectableCard.Footer";

export const SelectableCard = ({
	selected,
	selectionVisible,
	onSelect,
	onClick,
	disabled,
	children,
}: SelectableCardProps) => {
	return (
		<Box role="group" position="relative">
			<Box
				rounded="lg"
				overflow="hidden"
				borderWidth="1px"
				borderColor="border"
				bg="bg.surface"
				cursor={onClick ? "pointer" : undefined}
				onClick={disabled ? undefined : onClick}
				outline={selected ? "2px solid" : undefined}
				outlineColor={selected ? "accent" : undefined}
				outlineOffset={selected ? "-2px" : undefined}
				opacity={disabled ? 0.5 : undefined}
				transition="all 0.2s"
				_hover={{ shadow: "md" }}
			>
				{children}
			</Box>
			{onSelect && (
				<Box
					position="absolute"
					top={2}
					insetInlineStart={2}
					zIndex={1}
					opacity={selected || selectionVisible ? 1 : 0}
					_groupHover={{ opacity: 1 }}
					transition="opacity 0.15s"
				>
					<Checkbox
						checked={selected}
						onCheckedChange={() => onSelect()}
						onClick={(e: React.MouseEvent) => e.stopPropagation()}
						size="sm"
					/>
				</Box>
			)}
		</Box>
	);
};
SelectableCard.displayName = "SelectableCard";

SelectableCard.Thumbnail = SelectableCardThumbnail;
SelectableCard.Body = SelectableCardBody;
SelectableCard.Footer = SelectableCardFooter;
