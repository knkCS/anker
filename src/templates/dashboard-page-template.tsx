// src/templates/dashboard-page-template.tsx
//
// DashboardPageTemplate — for at-a-glance overview pages composed of a grid
// of widgets (Stat cards, mini-charts, recent-activity panes, etc.).
//
//   ┌─────────────────────────────────────────┐
//   │ PageHeader (greeting · range picker)    │
//   ├─────────────────────────────────────────┤
//   │ ┌──────┬──────┬──────┬──────┐           │
//   │ │ stat │ stat │ stat │ stat │           │
//   │ ├──────┴──────┼──────┴──────┤           │
//   │ │   widget    │   widget    │           │
//   │ │             │             │           │
//   │ ├─────────────┴─────────────┤           │
//   │ │       wide widget         │           │
//   │ └───────────────────────────┘           │
//   └─────────────────────────────────────────┘
//
// The template provides the page chrome and a 12-column responsive grid.
// Widgets opt into the column count via Chakra's `gridColumn` prop on each
// child. Inspired by Linear's "All issues" overview and GitHub's repo
// insights — calm surfaces, dense info, clear hierarchy.

import type { ReactNode } from "react";
import { Box, Flex, Grid } from "../primitives/layout";
import { PageHeader, type PageHeaderProps } from "../components/page-header";
import { useRegisteredPageActions } from "./app-shell";

export interface DashboardPageTemplateProps
	extends Pick<
		PageHeaderProps,
		"breadcrumbs" | "title" | "subtitle" | "eyebrow"
	> {
	actions?: ReactNode;
	/**
	 * Dashboard widgets. Children are placed inside a 12-column responsive
	 * CSS grid with `gap="4"`. Each child should set `gridColumn` (e.g.
	 * `"span 3"` for a quarter-width tile, `"span 6"` for half, `"span 12"`
	 * for full-width). The default per-child column span is `"span 12"`.
	 */
	children: ReactNode;
	/**
	 * Override the grid `gap` between widgets. @default "4" (= 16px)
	 */
	gap?: string;
}

export function DashboardPageTemplate({
	breadcrumbs,
	title,
	subtitle,
	eyebrow,
	actions,
	children,
	gap = "4",
}: DashboardPageTemplateProps) {
	const registered = useRegisteredPageActions();
	const resolvedActions = actions ?? registered;
	return (
		<Flex
			data-testid="dashboard-page-template"
			direction="column"
			flex="1"
			minH="0"
			bg="bg-canvas"
		>
			<PageHeader
				breadcrumbs={breadcrumbs}
				title={title}
				subtitle={subtitle}
				eyebrow={eyebrow}
				actions={resolvedActions}
			/>
			<Box flex="1" minH="0" px="8" py="6">
				<Grid
					data-testid="dashboard-grid"
					templateColumns="repeat(12, minmax(0, 1fr))"
					gap={gap}
				>
					{children}
				</Grid>
			</Box>
		</Flex>
	);
}
DashboardPageTemplate.displayName = "DashboardPageTemplate";
