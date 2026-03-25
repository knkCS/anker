import { Box, HStack } from "@chakra-ui/react";
import type React from "react";
import { emptyCellValue } from "./cell-utils";

export interface ColorSwatchCellProps {
	value: string | null | undefined;
}

export const ColorSwatchCell: React.FC<ColorSwatchCellProps> = ({ value }) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	return (
		<HStack gap={2}>
			<Box
				width="1rem"
				height="1rem"
				borderRadius="full"
				bg={value}
				borderWidth="1px"
				borderColor="border"
				flexShrink={0}
			/>
			<span>{value}</span>
		</HStack>
	);
};
ColorSwatchCell.displayName = "ColorSwatchCell";
