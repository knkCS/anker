import { Heading, Stack, Text } from "@chakra-ui/react";
import type React from "react";

export interface EmptyStateProps {
	header: string;
	description?: string;
	actions?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = (props) => {
	const { header, description, actions } = props;

	return (
		<Stack
			justifyContent="center"
			alignItems="center"
			gap={2}
			p={16}
			borderRadius={8}
		>
			<Heading size="lg">{header}</Heading>
			<Text textAlign="center">{description}</Text>
			{actions && (
				<Stack pt={4} gap={2}>
					{actions}
				</Stack>
			)}
		</Stack>
	);
};

EmptyState.displayName = "EmptyState";
