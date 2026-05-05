// src/templates/marketing-page-template.tsx
//
// MarketingPageTemplate — full-bleed landing-page chrome. No app shell, no
// sidebar, no rail. Used for product landing pages, "about us", coming-
// soon teasers, and other unauthenticated marketing surfaces.
//
// Composition (top to bottom):
//
//   ┌──────────────────────────────────────────┐
//   │ topbar (logo · nav · CTA)                │
//   ├──────────────────────────────────────────┤
//   │ hero (eyebrow · title · subtitle · CTAs) │
//   ├──────────────────────────────────────────┤
//   │ children (feature sections, testimonials) │
//   ├──────────────────────────────────────────┤
//   │ footer (copyright, links)                │
//   └──────────────────────────────────────────┘
//
// The template aims for the same refined-minimalism aesthetic as the rest
// of anker — calm surfaces, generous spacing on the hero only, brand
// colors used as accents rather than full backgrounds. No carousels, no
// animated parallax, no auto-rotating testimonials.

import type { ReactNode } from "react";
import { Box, Flex } from "../primitives/layout";
import { Heading, Text } from "../primitives/typography";

export interface MarketingPageTemplateProps {
	/** Logo or wordmark, far-left of the topbar. */
	logo?: ReactNode;
	/** Navigation links and/or sign-in CTA, far-right of the topbar. */
	topBarRight?: ReactNode;
	/** Hide the topbar (rare). */
	hideTopBar?: boolean;
	/** Eyebrow above the hero title (uppercase, muted). */
	heroEyebrow?: ReactNode;
	/** Hero title — large display text. */
	heroTitle?: ReactNode;
	/** Hero subtitle — one-paragraph value statement. */
	heroSubtitle?: ReactNode;
	/** Hero CTAs — typically one solid button + one ghost link. */
	heroActions?: ReactNode;
	/** Optional visual rendered to the right of the hero copy on wide viewports. */
	heroVisual?: ReactNode;
	/**
	 * Feature sections, testimonials, etc. Rendered with `maxW="6xl"` and
	 * `marginInline="auto"` so content tracks a consistent reading column.
	 */
	children?: ReactNode;
	/** Footer content — copyright, secondary nav, contact. */
	footer?: ReactNode;
}

export function MarketingPageTemplate({
	logo,
	topBarRight,
	hideTopBar,
	heroEyebrow,
	heroTitle,
	heroSubtitle,
	heroActions,
	heroVisual,
	children,
	footer,
}: MarketingPageTemplateProps) {
	return (
		<Box data-testid="marketing-page-template" minH="100vh" bg="bg-canvas">
			{!hideTopBar && (
				<Flex
					align="center"
					justify="space-between"
					px="8"
					py="4"
					bg="bg-surface"
					borderBottomWidth="1px"
					borderBottomColor="border"
				>
					<Box>{logo}</Box>
					<Flex gap="6" align="center" fontSize="sm" color="emphasized">
						{topBarRight}
					</Flex>
				</Flex>
			)}

			{(heroEyebrow || heroTitle || heroSubtitle || heroActions) && (
				<Box px="8" py="20" bg="bg-canvas">
					<Flex
						maxW="6xl"
						marginInline="auto"
						align="center"
						gap="12"
						direction={{ base: "column", md: "row" }}
					>
						<Box flex="1" minW="0">
							{heroEyebrow && (
								<Text
									fontSize="2xs"
									fontWeight="semibold"
									letterSpacing="wider"
									textTransform="uppercase"
									color="muted"
									mb="3"
								>
									{heroEyebrow}
								</Text>
							)}
							{heroTitle && (
								<Heading
									as="h1"
									fontSize={{ base: "4xl", md: "6xl" }}
									fontWeight="semibold"
									color="default"
									letterSpacing="-0.02em"
									lineHeight="1.05"
									mb="5"
								>
									{heroTitle}
								</Heading>
							)}
							{heroSubtitle && (
								<Text
									fontSize="lg"
									color="muted"
									lineHeight="1.6"
									maxW="2xl"
									mb="8"
								>
									{heroSubtitle}
								</Text>
							)}
							{heroActions && (
								<Flex gap="3" align="center">
									{heroActions}
								</Flex>
							)}
						</Box>
						{heroVisual && (
							<Box flex="1" minW="0" display={{ base: "none", md: "block" }}>
								{heroVisual}
							</Box>
						)}
					</Flex>
				</Box>
			)}

			{children && (
				<Box px="8" py="16">
					<Box maxW="6xl" marginInline="auto">
						{children}
					</Box>
				</Box>
			)}

			{footer && (
				<Box
					px="8"
					py="8"
					bg="bg-subtle"
					borderTopWidth="1px"
					borderTopColor="border"
				>
					<Box maxW="6xl" marginInline="auto">
						{footer}
					</Box>
				</Box>
			)}
		</Box>
	);
}
MarketingPageTemplate.displayName = "MarketingPageTemplate";
