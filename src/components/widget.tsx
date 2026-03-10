import { Box, Card, Flex, Text } from "@chakra-ui/react";
import type React from "react";

export interface WidgetProps {
	heading: string;
	subHeading?: string;
	/** Icon element (e.g. a lucide-react icon component). */
	icon: React.ReactNode;
	children: React.ReactNode;
}

export const Widget: React.FC<WidgetProps> = ({
	heading,
	subHeading,
	icon,
	children,
}) => {
	return (
		<Card.Root height="100%" maxW="auto" overflow="hidden" bg="bg-surface">
			<Card.Body>
				<Box mb="6">
					<Flex justifyContent="space-between" alignItems="center">
						<Text fontWeight="bold">{heading}</Text>
						<Box color="subtle">{icon}</Box>
					</Flex>
					{subHeading && (
						<Text fontWeight="bold" fontSize="xs" color="muted">
							{subHeading}
						</Text>
					)}
				</Box>
				{children}
			</Card.Body>
		</Card.Root>
	);
};
