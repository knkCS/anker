// src/templates/detail-page-template.tsx
//
// DetailPageTemplate — the canonical "single entity" page layout.
//
// Composition:
//
//   ┌─────────────────────────────────────────┐
//   │ PageHeader  (breadcrumbs · title · …)   │
//   ├─────────────────────────────────────────┤
//   │ Tabs (optional — pinned beneath header) │
//   ├─────────────────────────────────────────┤
//   │ children (identity card · panes · …)    │
//   └─────────────────────────────────────────┘
//
// Use for pages that show one entity: a single user, a single OAuth client,
// a single audit-event detail. Detail pages often have an identity Card at
// the top followed by tabbed sections — DetailPageTemplate is intentionally
// thin so consumers can compose those freely under `children`.

import type { ReactNode } from "react";
import { Box, Flex } from "../primitives/layout";
import { PageHeader, type PageHeaderProps } from "../components/page-header";
import { useRegisteredPageActions } from "./app-shell";

export interface DetailPageTemplateProps
	extends Pick<
		PageHeaderProps,
		"breadcrumbs" | "title" | "subtitle" | "eyebrow"
	> {
	actions?: ReactNode;
	/**
	 * Tab strip rendered immediately under the PageHeader. Typically a
	 * `<Tabs.Root>` containing a `<Tabs.List>` and one `<Tabs.Content>` per
	 * pane. The template does not render `<Tabs.Content>` separately —
	 * consumers control the tab body composition entirely.
	 */
	tabs?: ReactNode;
	/**
	 * Page body — the entity's identity card, tab bodies, edit forms, etc.
	 * Rendered with horizontal padding (`px="8"`) and top padding (`pt="6"`)
	 * so cards inside don't sit flush against the page edges. Override by
	 * passing a `<Box px="0" pt="0">…</Box>` if you need a flush layout.
	 */
	children: ReactNode;
	/**
	 * When `true`, removes the default `px="8" pt="6"` padding around
	 * `children`. Use for detail pages whose body is itself a full-bleed
	 * surface (e.g. a code editor). @default false
	 */
	flush?: boolean;
}

export function DetailPageTemplate({
	breadcrumbs,
	title,
	subtitle,
	eyebrow,
	actions,
	tabs,
	children,
	flush = false,
}: DetailPageTemplateProps) {
	const registered = useRegisteredPageActions();
	const resolvedActions = actions ?? registered;
	return (
		<Flex
			data-testid="detail-page-template"
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
			{tabs ? <Box>{tabs}</Box> : null}
			<Box flex="1" minH="0" px={flush ? "0" : "8"} pt={flush ? "0" : "6"}>
				{children}
			</Box>
		</Flex>
	);
}
DetailPageTemplate.displayName = "DetailPageTemplate";
