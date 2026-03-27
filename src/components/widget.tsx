import { Card } from "@chakra-ui/react";
import type React from "react";
import { Box, Flex } from "../primitives/layout";
import { Text } from "../primitives/typography";

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
				<Box marginBlockEnd="6">
					<Flex justifyContent="space-between" alignItems="center">
						<Text fontWeight="semibold">{heading}</Text>
						<Box color="subtle">{icon}</Box>
					</Flex>
					{subHeading && (
						<Text fontWeight="medium" fontSize="xs" color="muted">
							{subHeading}
						</Text>
					)}
				</Box>
				{children}
			</Card.Body>
		</Card.Root>
	);
};
Widget.displayName = "Widget";
