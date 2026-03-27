import type React from "react";
import { Stack } from "../../primitives/layout";
import { Heading, Text } from "../../primitives/typography";

export interface EmptyStateProps {
	/** Main heading text. */
	header: string;
	/** Description text or rich content. */
	description?: React.ReactNode;
	/** Optional icon displayed above the heading. */
	icon?: React.ReactNode;
	/** Optional action buttons below the description. */
	actions?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = (props) => {
	const { header, description, icon, actions } = props;

	return (
		<Stack
			justifyContent="center"
			alignItems="center"
			textAlign="center"
			gap={4}
			p={16}
			borderRadius="lg"
		>
			{icon}
			<Heading size="lg">{header}</Heading>
			{description && (
				<Text color="muted" fontSize="sm">
					{description}
				</Text>
			)}
			{actions && (
				<Stack pt={4} gap={2}>
					{actions}
				</Stack>
			)}
		</Stack>
	);
};

EmptyState.displayName = "EmptyState";
