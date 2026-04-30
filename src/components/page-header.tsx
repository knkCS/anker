// src/components/page-header.tsx
import type React from "react";
import { Box, Flex } from "../primitives/layout";
import { Heading, Link, Text } from "../primitives/typography";

export interface PageHeaderBreadcrumb {
	label: string;
	to?: string;
}

export interface PageHeaderProps {
	breadcrumbs?: PageHeaderBreadcrumb[];
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	actions?: React.ReactNode;
	eyebrow?: React.ReactNode;
}

export const PageHeader = ({
	breadcrumbs,
	title,
	subtitle,
	actions,
	eyebrow,
}: PageHeaderProps) => {
	const hasCrumbs = !!breadcrumbs && breadcrumbs.length > 0;
	const hasActions = !!actions;

	return (
		<Box
			py="4"
			px="8"
			borderBottomWidth="1px"
			borderBottomColor="border"
			bg="bg-surface"
		>
			{eyebrow && (
				<Text
					fontSize="2xs"
					fontWeight="semibold"
					letterSpacing="wider"
					textTransform="uppercase"
					color="muted"
					mb="1"
				>
					{eyebrow}
				</Text>
			)}

			{hasCrumbs && (
				<Flex
					data-testid="page-header-breadcrumbs"
					align="center"
					gap="1"
					mb="1"
					fontSize="xs"
					color="muted"
				>
					{breadcrumbs.map((c, idx) => {
						const isLast = idx === breadcrumbs.length - 1;
						const sep = !isLast ? <span aria-hidden> › </span> : null;
						const node = c.to ? (
							<Link
								key={`crumb-link-${c.label}`}
								href={c.to}
								color="muted"
								_hover={{ color: "default" }}
							>
								{c.label}
							</Link>
						) : (
							<Text
								key={`crumb-text-${c.label}`}
								as="span"
								color={isLast ? "default" : "muted"}
								fontWeight={isLast ? "medium" : "normal"}
							>
								{c.label}
							</Text>
						);
						return (
							<Flex key={`crumb-wrap-${c.label}`} align="center" gap="1">
								{node}
								{sep}
							</Flex>
						);
					})}
				</Flex>
			)}

			<Flex align="center" justify="space-between" gap="4">
				<Box flex="1" minW="0">
					<Heading
						as="h1"
						fontSize="2xl"
						fontWeight="semibold"
						color="default"
						letterSpacing="-0.02em"
					>
						{title}
					</Heading>
					{subtitle && (
						<Text
							data-testid="page-header-subtitle"
							fontSize="sm"
							color="muted"
							mt="1"
						>
							{subtitle}
						</Text>
					)}
				</Box>
				{hasActions && (
					<Flex align="center" gap="2" flexShrink={0}>
						{actions}
					</Flex>
				)}
			</Flex>
		</Box>
	);
};
PageHeader.displayName = "PageHeader";
