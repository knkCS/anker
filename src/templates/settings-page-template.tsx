// src/templates/settings-page-template.tsx
//
// SettingsPageTemplate — for any "preferences / configuration" page that
// uses a tabbed split between mixed form / list content. Visually identical
// to DetailPageTemplate today, but exposed as a separate template so its
// authoring rules (tabs are required, body is padded, max-width on forms)
// can evolve independently.
//
//   ┌─────────────────────────────────────────┐
//   │ PageHeader  (breadcrumbs · title · …)   │
//   ├─────────────────────────────────────────┤
//   │ Tabs (required for settings)            │
//   ├─────────────────────────────────────────┤
//   │ children (form cards · lists · …)       │
//   └─────────────────────────────────────────┘
//
// Use this template for: personal-settings (profile, password, MFA tabs),
// organization settings, identity-provider settings, admin → general.

import type { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "../components/page-header";
import { Box, Flex } from "../primitives/layout";
import { useRegisteredPageActions } from "./app-shell";

export interface SettingsPageTemplateProps
	extends Pick<
		PageHeaderProps,
		"breadcrumbs" | "title" | "subtitle" | "eyebrow"
	> {
	actions?: ReactNode;
	/**
	 * Tab strip. Settings pages should always have at least two tabs — if
	 * you only have one section, use DetailPageTemplate instead.
	 */
	tabs: ReactNode;
	/** Page body — typically Card-wrapped forms or DataLists. */
	children: ReactNode;
	/**
	 * Constrain the body width for readability. Settings forms read better
	 * at ~720px even on wide viewports. Pass a Chakra width token (`"3xl"`,
	 * `"4xl"`) or any CSS length. @default "3xl" (= 768px)
	 *
	 * Pass `"full"` to disable the constraint entirely.
	 */
	maxBodyWidth?: string;
}

export function SettingsPageTemplate({
	breadcrumbs,
	title,
	subtitle,
	eyebrow,
	actions,
	tabs,
	children,
	maxBodyWidth = "3xl",
}: SettingsPageTemplateProps) {
	const registered = useRegisteredPageActions();
	const resolvedActions = actions ?? registered;
	return (
		<Flex
			data-testid="settings-page-template"
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
			<Box>{tabs}</Box>
			<Box flex="1" minH="0" px="8" pt="6">
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
