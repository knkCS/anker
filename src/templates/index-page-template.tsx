// src/templates/index-page-template.tsx
//
// IndexPageTemplate — the canonical "list of items" page layout.
//
// Composition (top to bottom):
//
//   ┌─────────────────────────────────────────┐
//   │ PageHeader  (breadcrumbs · title · …)   │
//   ├─────────────────────────────────────────┤
//   │ Tabs (optional — under header)          │
//   ├─────────────────────────────────────────┤
//   │ Toolbar (search · filters · count)      │
//   ├─────────────────────────────────────────┤
//   │ children (DataTable, list, empty state) │
//   └─────────────────────────────────────────┘
//
// Use this template for any "browse a list" page: users index, OAuth-clients
// index, audit-log, etc. The template flushes its content (no horizontal
// padding) so a full-bleed DataTable sits cleanly under the toolbar. Pages
// that need padded content should wrap children in a `<Box px="8" py="6">`.

import type { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "../components/page-header";
import { Box, Flex } from "../primitives/layout";
import { useRegisteredPageActions } from "./app-shell";

export interface IndexPageTemplateProps
	extends Pick<
		PageHeaderProps,
		"breadcrumbs" | "title" | "subtitle" | "eyebrow"
	> {
	/**
	 * Optional explicit page-action content (rendered inside the PageHeader's
	 * actions slot). When omitted, the template falls back to whatever a
	 * descendant has registered via `usePageActions`.
	 */
	actions?: ReactNode;
	/**
	 * Optional tab strip rendered between the PageHeader and the toolbar.
	 * Pass an instance of `<Tabs.Root>` (with its own `<Tabs.List>` and
	 * `<Tabs.Content>`s). When omitted, no tab strip is rendered.
	 */
	tabs?: ReactNode;
	/**
	 * Toolbar element rendered between the tabs (if any) and the page body.
	 * Typically an instance of `<Toolbar>` from `@knkcs/anker/components`.
	 * Pass `null` to omit the toolbar entirely (rare).
	 */
	toolbar?: ReactNode;
	/**
	 * Page body — DataTable, list, empty state, or error/loading content.
	 * Rendered flush against the canvas. Add internal padding inside
	 * `children` if you need it.
	 */
	children: ReactNode;
}

/**
 * Canonical list-page layout. Renders PageHeader → optional Tabs → optional
 * Toolbar → children, full-bleed against the canvas.
 *
 * Page actions are sourced from (in priority order): `actions` prop →
 * registered slot via `usePageActions`. This lets a tab-pane component deep
 * inside `children` register its own actions without prop-drilling.
 */
export function IndexPageTemplate({
	breadcrumbs,
	title,
	subtitle,
	eyebrow,
	actions,
	tabs,
	toolbar,
	children,
}: IndexPageTemplateProps) {
	const registered = useRegisteredPageActions();
	const resolvedActions = actions ?? registered;
	return (
		<Flex
			data-testid="index-page-template"
			direction="column"
			flex="1"
			minH="0"
		>
			<PageHeader
				breadcrumbs={breadcrumbs}
				title={title}
				subtitle={subtitle}
				eyebrow={eyebrow}
				actions={resolvedActions}
			/>
			{tabs ? <Box>{tabs}</Box> : null}
			{toolbar ? <Box>{toolbar}</Box> : null}
			<Box flex="1" minH="0">
				{children}
			</Box>
		</Flex>
	);
}
IndexPageTemplate.displayName = "IndexPageTemplate";
