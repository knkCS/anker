import type { IconButtonProps } from "@chakra-ui/react";
import { Box, Circle, IconButton, Text } from "@chakra-ui/react";
import { Filter as FilterIcon } from "lucide-react";
import type React from "react";

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
			<IconButton cursor="pointer" ref={ref} aria-label={filterLabel} {...rest}>
				<FilterIcon />
			</IconButton>
			{activeFilterCount && activeFilterCount > 0 ? (
				<Circle
					size="24px"
					bg="primary.500"
					color="white"
					position="absolute"
					top={5}
					right={-1.5}
				>
					<Text fontSize="xs" fontWeight={800}>
						{activeFilterCount}
					</Text>
				</Circle>
			) : null}
		</Box>
	);
};
