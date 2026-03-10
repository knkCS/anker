import { Box, Flex, Grid, GridItem } from "@chakra-ui/react";

export interface TableProps {
	headers: string[];
	hasComponentLeft?: boolean;
	hasMenu?: boolean;
	children?: React.ReactNode;
	/** Total number of grid columns. Defaults to 12. */
	columnCount?: number;
}

export const Table: React.FC<TableProps> = ({
	children,
	headers,
	hasComponentLeft,
	hasMenu,
	columnCount = 12,
}) => {
	const colSpan = Math.floor(columnCount / headers.length);

	return (
		<Box role="grid" aria-colcount={headers.length}>
			<Flex pb={2} px={hasComponentLeft ? 0 : 6}>
				{hasComponentLeft && <Box minWidth={75} px={6} />}
				<Grid
					w="100%"
					templateRows="repeat(1, 1fr)"
					templateColumns={`repeat(${columnCount}, 1fr)`}
					gap={4}
					fontWeight="semibold"
					color="muted"
				>
					{headers.map((header) => (
						<GridItem key={header} colSpan={colSpan} role="columnheader">
							{header}
						</GridItem>
					))}
				</Grid>
				{hasMenu && <Box minWidth="80px" px={6} />}
			</Flex>

			<Flex direction="column" gap="3">
				{children}
			</Flex>
		</Box>
	);
};
