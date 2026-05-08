// src/templates/settings-page-template.tsx
//
// SettingsPageTemplate — for any "preferences / configuration" page that
// uses a tabbed split between mixed form / list content.
//
//   ┌─────────────────────────────────────────┐
//   │ PageHeader  (breadcrumbs · title · …)   │
//   ├─────────────────────────────────────────┤
//   │ Tabs (required for settings)            │
//   ├─────────────────────────────────────────┤
//   │ children OR bodyTabs panes              │
//   └─────────────────────────────────────────┘
//
// Two ways to render tabs (mutually exclusive):
//
// 1. `bodyTabs` — declarative panels owned by the template. Template
//    wraps Tabs.Root with `lazyMount unmountOnExit`. Prefer this for
//    settings pages.
//
// 2. `tabs` + `children` — consumer owns Tabs.Root and Tabs.Content.
//    Retained for back-compat / advanced cases.

import type { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "../components/page-header";
import { Box, Flex } from "../primitives/layout";
import { Tabs } from "../primitives/tabs";
import { useRegisteredPageActions } from "./app-shell";
import type { BodyTabsProp } from "./detail-page-template";

export type { BodyTabsItem, BodyTabsProp } from "./detail-page-template";

export interface SettingsPageTemplateProps
	extends Pick<
		PageHeaderProps,
		"breadcrumbs" | "title" | "subtitle" | "eyebrow"
	> {
	actions?: ReactNode;
	/**
	 * Tab strip (consumer-owned). Mutually exclusive with `bodyTabs`.
	 * Settings pages should always have at least two tabs — if you only
	 * have one section, use DetailPageTemplate instead.
	 */
	tabs?: ReactNode;
	/**
	 * Owned-panel tabs. Template renders Tabs.Root with `lazyMount
	 * unmountOnExit`; only the active item's `content` mounts. Mutually
	 * exclusive with `tabs`.
	 */
	bodyTabs?: BodyTabsProp;
	/** Page body when `bodyTabs` is not set. */
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
	tabs,
	bodyTabs,
	children,
	maxBodyWidth = "3xl",
	bodyPadding = "default",
}: SettingsPageTemplateProps) {
	if (tabs && bodyTabs) {
		throw new Error(
			"SettingsPageTemplate: `tabs` and `bodyTabs` are mutually exclusive — use `bodyTabs` for owned panels, `tabs` for consumer-owned tab strips.",
		);
	}
	const registered = useRegisteredPageActions();
	const resolvedActions = actions ?? registered;
	const bodyPx = bodyPadding === "none" ? "0" : "8";
	const bodyPt = bodyPadding === "none" ? "0" : "6";

	const renderBody = (node: ReactNode) => (
		<Box flex="1" minH="0" px={bodyPx} pt={bodyPt}>
			<Box
				maxW={maxBodyWidth}
				marginInline={maxBodyWidth === "full" ? "0" : "auto"}
			>
				{node}
			</Box>
		</Box>
	);

	if (bodyTabs) {
		const tabsRootProps =
			bodyTabs.value !== undefined
				? {
						value: bodyTabs.value,
						onValueChange: (d: { value: string }) =>
							bodyTabs.onValueChange!(d.value),
					}
				: { defaultValue: bodyTabs.defaultValue };
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
				<Tabs.Root lazyMount unmountOnExit {...tabsRootProps}>
					<Box>
						<Tabs.List>
							{bodyTabs.items.map((item) => (
								<Tabs.Trigger key={item.value} value={item.value}>
									{item.label}
								</Tabs.Trigger>
							))}
						</Tabs.List>
					</Box>
					{renderBody(
						bodyTabs.items.map((item) => (
							<Tabs.Content key={item.value} value={item.value}>
								{item.content}
							</Tabs.Content>
						)),
					)}
				</Tabs.Root>
			</Flex>
		);
	}

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
			{renderBody(children)}
		</Flex>
	);
}
SettingsPageTemplate.displayName = "SettingsPageTemplate";
