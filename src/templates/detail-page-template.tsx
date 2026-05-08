// src/templates/detail-page-template.tsx
//
// DetailPageTemplate — the canonical "single entity" page layout.
//
// Composition:
//
//   ┌─────────────────────────────────────────┐
//   │ PageHeader  (breadcrumbs · title · …)   │
//   ├─────────────────────────────────────────┤
//   │ subheader (optional — e.g. identity card)│
//   ├─────────────────────────────────────────┤
//   │ Tabs (optional — pinned beneath subhead) │
//   ├─────────────────────────────────────────┤
//   │ children OR bodyTabs panes               │
//   └─────────────────────────────────────────┘
//
// Two ways to render tabs:
//
// 1. `bodyTabs` — declarative panels owned by the template. Template wraps
//    Tabs.Root with `lazyMount unmountOnExit` so only the active panel
//    mounts. Use this for any case where each tab has its own body
//    component (Members, Security, Sessions panes).
//
// 2. `tabs` — ReactNode slot for nav-mode or filter-mode tab strips
//    (Tabs.List with no Tabs.Content; the body comes from `children`,
//    typically a route's outlet). Use this when each tab is a separate
//    route or when tab state is controlled externally.
//
// `bodyTabs` and `tabs` are mutually exclusive. Passing both throws.

import type { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "../components/page-header";
import { Tabs } from "../primitives/tabs";
import { Box, Flex } from "../primitives/layout";
import { useRegisteredPageActions } from "./app-shell";

export interface BodyTabsItem {
	value: string;
	label: ReactNode;
	content: ReactNode;
}

export type BodyTabsProp =
	| {
			items: BodyTabsItem[];
			defaultValue: string;
			value?: never;
			onValueChange?: never;
	  }
	| {
			items: BodyTabsItem[];
			value: string;
			onValueChange: (next: string) => void;
			defaultValue?: never;
	  };

export interface DetailPageTemplateProps
	extends Pick<
		PageHeaderProps,
		"breadcrumbs" | "title" | "subtitle" | "eyebrow"
	> {
	actions?: ReactNode;
	/**
	 * Tab strip rendered immediately under the PageHeader / subheader.
	 * Use this for nav-mode/filter-mode tabs (Tabs.List, no Tabs.Content);
	 * the body comes from `children`. For owned-panel tabs, use `bodyTabs`
	 * instead. Mutually exclusive with `bodyTabs`.
	 */
	tabs?: ReactNode;
	/**
	 * Owned-panel tabs. Template renders Tabs.Root with `lazyMount
	 * unmountOnExit`; only the active item's `content` mounts. Mutually
	 * exclusive with `tabs` and `children` is ignored when this is set.
	 */
	bodyTabs?: BodyTabsProp;
	/**
	 * ReactNode rendered between the PageHeader and the tabs (or the body
	 * if no tabs). Use for identity-card-style summaries.
	 */
	subheader?: ReactNode;
	/**
	 * Page body — rendered when `bodyTabs` is not set. Flush against the
	 * canvas; add internal padding inside `children` if you need it.
	 */
	children?: ReactNode;
}

export function DetailPageTemplate({
	breadcrumbs,
	title,
	subtitle,
	eyebrow,
	actions,
	tabs,
	bodyTabs,
	subheader,
	children,
}: DetailPageTemplateProps) {
	if (tabs && bodyTabs) {
		throw new Error(
			"DetailPageTemplate: `tabs` and `bodyTabs` are mutually exclusive — use `bodyTabs` for owned panels, `tabs` for nav/filter strips.",
		);
	}
	const registered = useRegisteredPageActions();
	const resolvedActions = actions ?? registered;

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
				data-testid="detail-page-template"
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
				{subheader ? <Box>{subheader}</Box> : null}
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
					<Box flex="1" minH="0">
						{bodyTabs.items.map((item) => (
							<Tabs.Content key={item.value} value={item.value}>
								{item.content}
							</Tabs.Content>
						))}
					</Box>
				</Tabs.Root>
			</Flex>
		);
	}

	return (
		<Flex
			data-testid="detail-page-template"
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
			{subheader ? <Box>{subheader}</Box> : null}
			{tabs ? <Box>{tabs}</Box> : null}
			<Box flex="1" minH="0">
				{children}
			</Box>
		</Flex>
	);
}
DetailPageTemplate.displayName = "DetailPageTemplate";
