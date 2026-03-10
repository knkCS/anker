import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import type React from "react";

export interface EmptyPanelProps {
	header: string;
	description: React.ReactNode;
}

export const EmptyPanel: React.FC<EmptyPanelProps> = ({
	header,
	description,
}) => {
	return (
		<Box>
			<Stack
				direction="column"
				align="center"
				justify="center"
				textAlign="center"
				gap={4}
			>
				<Heading fontSize="lg" color="gray.500" as="h3">
					{header}
				</Heading>

				<Text color="gray.500" fontSize="sm">
					{description}
				</Text>
			</Stack>
		</Box>
	);
};

EmptyPanel.displayName = "EmptyPanel";
