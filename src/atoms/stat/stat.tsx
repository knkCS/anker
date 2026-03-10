import {
	Box,
	type BoxProps,
	Heading,
	HStack,
	Spinner,
	Square,
	Stack,
	Text,
} from "@chakra-ui/react";
import type React from "react";

export interface StatProps extends BoxProps {
	/** An icon element rendered as React node (e.g., a lucide-react icon) */
	icon?: React.ReactNode;
	label: string;
	value?: React.ReactNode;
	loading?: boolean;
}

export const Stat: React.FC<StatProps> = (props) => {
	const { label, value, icon, loading, ...boxProps } = props;

	return (
		<Box
			px={{ base: "4", md: "6" }}
			py={{ base: "5", md: "6" }}
			bg="bg-surface"
			borderRadius="lg"
			boxShadow="sm"
			{...boxProps}
		>
			<Stack gap={{ base: "5", md: "6" }}>
				<Stack direction="row" justify="space-between">
					<HStack gap="4">
						{icon && (
							<Square size="8" bg="bg-accent-subtle" borderRadius="md">
								{icon}
							</Square>
						)}
						<Text fontWeight="medium">{label}</Text>
					</HStack>
				</Stack>
				<Stack gap="4">
					{loading ? (
						<Spinner />
					) : (
						<Heading size={{ base: "sm", md: "md" }}>{value ?? 0}</Heading>
					)}
				</Stack>
			</Stack>
		</Box>
	);
};

Stat.displayName = "Stat";
