// src/components/auth-card.tsx
import type React from "react";
import { Box, Flex } from "../primitives/layout";
import { Heading, Text } from "../primitives/typography";

export interface AuthCardProps {
	/** Logo or wordmark, far-left of the topbar. */
	logo?: React.ReactNode;
	/** Right-side topbar content (help link, locale switcher, etc.). */
	topBarRight?: React.ReactNode;
	/** Hide the topbar entirely (rare — e.g. embedded preview). */
	hideTopBar?: boolean;
	/** Hide the dot-grid background (rare — e.g. printable). */
	hideBackground?: boolean;
	/** Small uppercase eyebrow above the title. */
	eyebrow?: React.ReactNode;
	/** Card title (h3, 24px, semibold, default color). */
	title?: React.ReactNode;
	/** Subtitle below title (14px, muted color, centered). */
	subtitle?: React.ReactNode;
	/** Card width preset. md = 440px (default), lg = 480px. */
	size?: "md" | "lg";
	/** Card footer slot. Bottom-bordered inside the card. */
	footer?: React.ReactNode;
	/** Page content inside the card body. */
	children: React.ReactNode;
}

const SIZE_TO_WIDTH: Record<NonNullable<AuthCardProps["size"]>, string> = {
	md: "440px",
	lg: "480px",
};

const DOT_PATTERN_BG =
	"radial-gradient(var(--chakra-colors-primary-200) 1px, transparent 1px)";

export const AuthCard = ({
	logo,
	topBarRight,
	hideTopBar = false,
	hideBackground = false,
	eyebrow,
	title,
	subtitle,
	size = "md",
	footer,
	children,
}: AuthCardProps) => {
	return (
		<Box data-testid="auth-card" data-size={size} minH="100vh" bg="bg-canvas">
			<Box
				data-testid="auth-card-canvas"
				data-background={hideBackground ? "hidden" : "visible"}
				minH="100vh"
				bgImage={hideBackground ? undefined : DOT_PATTERN_BG}
				bgSize="24px 24px"
			>
				{!hideTopBar && (
					<Flex
						align="center"
						justify="space-between"
						px="8"
						py="4"
						bg="rgba(255,255,255,0.85)"
						backdropFilter="blur(4px)"
						borderBottom="1px solid"
						borderColor="border"
					>
						<Box>{logo}</Box>
						<Flex gap="4" fontSize="xs" color="muted">
							{topBarRight}
						</Flex>
					</Flex>
				)}

				<Flex justify="center" pt="16" px="4">
					<Box
						w="full"
						maxW={SIZE_TO_WIDTH[size]}
						bg="bg-surface"
						borderRadius="lg"
						shadow="md"
						p="8"
					>
						{eyebrow && (
							<Text
								textStyle="overline"
								color="muted"
								textAlign="center"
								mb="2"
							>
								{eyebrow}
							</Text>
						)}
						{title && (
							<Heading
								as="h3"
								size="2xl"
								fontWeight="semibold"
								color="default"
								textAlign="center"
								mb="2"
								letterSpacing="-0.02em"
							>
								{title}
							</Heading>
						)}
						{subtitle && (
							<Text color="muted" textAlign="center" fontSize="sm" mb="6">
								{subtitle}
							</Text>
						)}

						<Box>{children}</Box>

						{footer && (
							<Box
								data-testid="auth-card-footer"
								mt="6"
								pt="4"
								borderTop="1px solid"
								borderColor="border"
								textAlign="center"
								fontSize="xs"
								color="emphasized"
							>
								{footer}
							</Box>
						)}
					</Box>
				</Flex>
			</Box>
		</Box>
	);
};
AuthCard.displayName = "AuthCard";
