// src/templates/error-page.tsx
//
// ErrorPage — full-bleed error layout for 404 / 403 / 500 / generic
// failures. Centered status code + message + suggested next step. No app
// shell, no sidebar.
//
// We keep it deliberately spare — an enterprise B2B error screen does not
// need a 404-illustration of an astronaut. The optional `illustration`
// slot is there for the rare case where a product wants to reach for one
// (e.g. a dedicated brand "OOPS" SVG).

import type { ReactNode } from "react";
import { Box, Flex } from "../primitives/layout";
import { Heading, Text } from "../primitives/typography";

export interface ErrorPageProps {
	/**
	 * Status code (404, 500, 403, …) shown as the page's largest piece of
	 * type. Pass any string — non-numeric codes like "OOPS" work too.
	 */
	statusCode: ReactNode;
	/** Short headline — e.g. "Page not found" or "Something went wrong". */
	title: ReactNode;
	/**
	 * One-paragraph explanation. Keep it short — the user is already in a
	 * frustrated state.
	 */
	description?: ReactNode;
	/**
	 * Action(s) — typically one solid button (back home / retry) plus an
	 * optional secondary link.
	 */
	actions?: ReactNode;
	/**
	 * Optional illustration rendered above the status code. Use sparingly.
	 */
	illustration?: ReactNode;
	/**
	 * Logo or wordmark rendered top-left. Useful for branded error pages
	 * served from the root domain.
	 */
	logo?: ReactNode;
}

export function ErrorPage({
	statusCode,
	title,
	description,
	actions,
	illustration,
	logo,
}: ErrorPageProps) {
	return (
		<Flex
			data-testid="error-page"
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
				{illustration && <Box mb="8">{illustration}</Box>}
				<Text
					fontSize="7xl"
					fontWeight="semibold"
					color="muted"
					letterSpacing="-0.04em"
					lineHeight="1"
					mb="4"
				>
					{statusCode}
				</Text>
				<Heading
					as="h1"
					fontSize="2xl"
					fontWeight="semibold"
					color="default"
					letterSpacing="-0.02em"
					mb="3"
				>
					{title}
				</Heading>
				{description && (
					<Text
						fontSize="md"
						color="muted"
						lineHeight="1.6"
						maxW="lg"
						mb="8"
					>
						{description}
					</Text>
				)}
				{actions && (
					<Flex gap="3" align="center" justify="center">
						{actions}
					</Flex>
				)}
			</Flex>
		</Flex>
	);
}
ErrorPage.displayName = "ErrorPage";
