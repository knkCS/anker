// src/templates/detail-page-template.tsx
//
// DetailPageTemplate — the canonical "single entity" page layout.
//
// Composition:
//
//   ┌─────────────────────────────────────────┐
//   │ PageHeader  (breadcrumbs · title · …)   │
//   │   avatar · badges · meta (detail row)   │
//   │   tabs (optional third row)             │
//   └─────────────────────────────────────────┘
//   ┌─────────────────────────────────────────┐
//   │ children (body — flush, no padding)     │
//   └─────────────────────────────────────────┘
//
// The tab list renders inside the header band via the slot store.
// The active panel is provided as `children`. Use nav-link tabs:
// build a `<Tabs.Root value={current}>` with only `<Tabs.List>` inside,
// pass to `tabs`, and let the router render the active panel as children.

import type { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "../components/page-header";
import { Box, Flex } from "../primitives/layout";
import { usePageHeader, useRegisteredPageActions } from "./app-shell";

export interface DetailPageTemplateProps
	extends Pick<
		PageHeaderProps,
		"breadcrumbs" | "title" | "subtitle" | "eyebrow"
	> {
	/**
	 * Optional explicit page-action content. Falls back to the actions
	 * registered via `usePageActions` if not provided.
	 */
	actions?: ReactNode;
	/** Avatar slot for the page header's detail row. */
	avatar?: ReactNode;
	/** Badges shown inline next to the title. */
	badges?: ReactNode;
	/** Secondary meta line below the title (email, dept, ID, etc.). */
	meta?: ReactNode;
	/** Optional tab strip rendered as the third row of the page header band. */
	tabs?: ReactNode;
	children?: ReactNode;
	/**
	 * Pin the page-header band to the top of the viewport while the body
	 * scrolls. @default true
	 */
	stickyHeader?: boolean;
}

export function DetailPageTemplate({
	breadcrumbs,
	title,
	subtitle,
	eyebrow,
	actions,
	avatar,
	badges,
	meta,
	tabs,
	children,
	stickyHeader = true,
}: DetailPageTemplateProps) {
	const registered = useRegisteredPageActions();
	const resolvedActions = actions ?? registered;
	usePageHeader(
		<PageHeader
			breadcrumbs={breadcrumbs}
			title={title}
			subtitle={subtitle}
			eyebrow={eyebrow}
			actions={resolvedActions}
			avatar={avatar}
			badges={badges}
			meta={meta}
			tabs={tabs}
		/>,
		{ sticky: stickyHeader },
	);
	return (
		<Flex
			data-testid="detail-page-template"
			direction="column"
			flex="1"
			minH="0"
		>
			<Box flex="1" minH="0">
				{children}
			</Box>
		</Flex>
	);
}
DetailPageTemplate.displayName = "DetailPageTemplate";
