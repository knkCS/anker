import { Circle } from "@chakra-ui/react";
import { Filter as FilterIcon } from "lucide-react";
import type React from "react";
import { Box } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { IconButton, type IconButtonProps } from "../button";

export type FilterProps = Omit<
	IconButtonProps,
	"aria-label" | "cursor" | "icon"
> & {
	activeFilterCount?: number;
	/** Accessible label for the filter button */
	filterLabel?: string;
};

export const Filter = ({
	ref,
	filterLabel = "Filter",
	...props
}: FilterProps & { ref?: React.Ref<HTMLButtonElement> }) => {
	const { activeFilterCount, ...rest } = props;

	return (
		<Box position="relative">
			<IconButton
				variant="ghost"
				cursor="pointer"
				ref={ref}
				aria-label={filterLabel}
				{...rest}
			>
				<FilterIcon />
			</IconButton>
			{activeFilterCount && activeFilterCount > 0 ? (
				<Circle
					size="24px"
					bg="accent"
					color="on-accent"
					position="absolute"
					top={5}
					insetInlineEnd={-1.5}
				>
					<Text fontSize="xs" fontWeight={800}>
						{activeFilterCount}
					</Text>
				</Circle>
			) : null}
		</Box>
	);
};
Filter.displayName = "Filter";
