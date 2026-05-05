// src/templates/maintenance-page.tsx
//
// MaintenancePage — full-bleed maintenance/down-for-upgrade screen. No app
// shell. Surfaces a clear message, an optional ETA, and an optional link
// to a status page. Operators serve this from a static asset or a
// fallback handler when the app is offline.

import type { ReactNode } from "react";
import { Box, Flex } from "../primitives/layout";
import { Heading, Text } from "../primitives/typography";

export interface MaintenancePageProps {
	/** Logo rendered top-left. */
	logo?: ReactNode;
	/** Headline — e.g. "We'll be right back". */
	title?: ReactNode;
	/**
	 * One-paragraph message explaining what's happening and what users
	 * should do (typically "wait, we'll be back shortly").
	 */
	description?: ReactNode;
	/**
	 * Estimated-time-of-restoration banner. Pass a string like
	 * "Estimated back online: 14:30 UTC". Rendered below the description.
	 */
	eta?: ReactNode;
	/**
	 * Optional link to a status page or twitter status. Pass a fully-
	 * styled `<Link>` or an `<a>` element.
	 */
	statusLink?: ReactNode;
}

export function MaintenancePage({
	logo,
	title = "We'll be right back",
	description = "We're upgrading the service. Please refresh in a few minutes.",
	eta,
	statusLink,
}: MaintenancePageProps) {
	return (
		<Flex
			data-testid="maintenance-page"
			direction="column"
			minH="100vh"
			bg="bg-canvas"
		>
			{logo && (
				<Box px="8" py="6">
					{logo}
				</Box>
			)}
			<Flex
				flex="1"
				direction="column"
				align="center"
				justify="center"
				px="8"
				pb="16"
				textAlign="center"
			>
				<Heading
					as="h1"
					fontSize="3xl"
					fontWeight="semibold"
					color="default"
					letterSpacing="-0.02em"
					mb="4"
				>
					{title}
				</Heading>
				{description && (
					<Text fontSize="md" color="muted" lineHeight="1.6" maxW="lg" mb="6">
						{description}
					</Text>
				)}
				{eta && (
					<Box
						px="4"
						py="2"
						borderWidth="1px"
						borderColor="border"
						borderRadius="md"
						bg="bg-surface"
						mb="6"
					>
						<Text fontSize="sm" fontWeight="medium" color="emphasized">
							{eta}
						</Text>
					</Box>
				)}
				{statusLink && <Box>{statusLink}</Box>}
			</Flex>
		</Flex>
	);
}
MaintenancePage.displayName = "MaintenancePage";
