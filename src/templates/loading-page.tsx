// src/templates/loading-page.tsx
//
// LoadingPage — full-bleed initial-boot loading screen. Used while the
// authenticated app shell is being hydrated (auth check, theme loading,
// initial data fetch). For in-page loading states (e.g. tab switch),
// prefer a centered <Spinner /> inside the page body — this template is
// only for the very first frame of the app.

import type { ReactNode } from "react";
import { Box, Flex } from "../primitives/layout";
import { Spinner } from "../primitives/spinner";
import { Text } from "../primitives/typography";

export interface LoadingPageProps {
	/** Optional logo rendered above the spinner. */
	logo?: ReactNode;
	/**
	 * Optional message rendered below the spinner. Keep it short
	 * (e.g. "Loading your workspace…").
	 */
	message?: ReactNode;
}

export function LoadingPage({ logo, message }: LoadingPageProps) {
	return (
		<Flex
			data-testid="loading-page"
			direction="column"
			align="center"
			justify="center"
			minH="100vh"
			bg="bg-canvas"
			gap="6"
			textAlign="center"
		>
			{logo && <Box>{logo}</Box>}
			<Spinner size="lg" color="accent" />
			{message && (
				<Text fontSize="sm" color="muted">
					{message}
				</Text>
			)}
		</Flex>
	);
}
LoadingPage.displayName = "LoadingPage";
