// src/templates/settings-page-template.tsx
//
// SettingsPageTemplate — for any "preferences / configuration" page.
//
//   ┌─────────────────────────────────────────┐
//   │ PageHeader  (breadcrumbs · title · …)   │
//   │   avatar · badges · meta (detail row)   │
//   │   tabs (optional third row)             │
//   └─────────────────────────────────────────┘
//   ┌─────────────────────────────────────────┐
//   │ children (body — constrained width)     │
//   └─────────────────────────────────────────┘
//
// Pass a `<Tabs.Root value={current}>` with only `<Tabs.List>` inside to
// `tabs`; let the router (or parent) render the active panel as `children`.

import type { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "../components/page-header";
import { Box, Flex } from "../primitives/layout";
import { usePageHeader, useRegisteredPageActions } from "./app-shell";

export interface SettingsPageTemplateProps
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
	/** Tab strip rendered as the third row of the page header band. */
	tabs?: ReactNode;
	/** Page body content. */
	children?: ReactNode;
	/**
	 * Constrain the body width for readability. @default "3xl" (= 768px).
	 * Pass `"full"` to disable the constraint entirely.
	 */
	maxBodyWidth?: string;
	/**
	 * Padding applied to the body between the tab strip and the page
	 * content. @default "default" (`px="8" pt="6"`). Pass `"none"` to
	 * render flush.
	 */
	bodyPadding?: "default" | "none";
}

export function SettingsPageTemplate({
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
	maxBodyWidth = "3xl",
	bodyPadding = "default",
}: SettingsPageTemplateProps) {
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
	);

	const bodyPx = bodyPadding === "none" ? "0" : "8";
	const bodyPt = bodyPadding === "none" ? "0" : "6";

	return (
		<Flex
			data-testid="settings-page-template"
			direction="column"
			flex="1"
			minH="0"
		>
			<Box flex="1" minH="0" px={bodyPx} pt={bodyPt}>
				<Box
					maxW={maxBodyWidth}
					marginInline={maxBodyWidth === "full" ? "0" : "auto"}
				>
					{children}
				</Box>
			</Box>
		</Flex>
	);
}
SettingsPageTemplate.displayName = "SettingsPageTemplate";
