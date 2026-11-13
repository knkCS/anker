// src/components/context-rail/context-rail-tabs.tsx
//
// Tabs for `<ContextRail>`: a rail splits its sections into tabs under the
// header. Controlled — the tab is the caller's state, so the tabs work in a
// rail reported through `usePageRail` and drawn by a foreign host, outside the
// screen's providers. Expanded, a tablist with one tabpanel holding only the
// selected tab's content; collapsed (44px), each tab is a
// `ContextRail.IconButton` that expands the rail on that tab.
import React, { useId, useRef } from "react";
import { Badge } from "../../primitives/badge";
import { Box, Flex, Stack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import { ContextRailDivider, ContextRailIconButton } from "./atoms";
import {
	isRailAtom,
	RAIL_SECTION,
	useContextRailMode,
} from "./context-rail-context";

/**
 * What a tab shows beside its label: a count badge or a dot. `label` is
 * the indicator's accessible label ("3 blockers", "A field has focus"); it is
 * added to the tab's accessible name. A badge with a `count` of 0 or less
 * shows nothing, so a caller may pass its count unconditionally.
 */
export type ContextRailTabIndicator =
	| { kind: "badge"; count: number; label: string }
	| { kind: "dot"; label: string };

export interface ContextRailTabProps {
	/** Identifies the tab; reported by `onValueChange`. */
	value: string;
	label: string;
	/** Drawn beside the label, and alone in a collapsed rail. */
	icon: React.ReactNode;
	indicator?: ContextRailTabIndicator;
	/** The tab's panel: its `ContextRail.Section`s. */
	children?: React.ReactNode;
}

/**
 * One tab of `<ContextRail.Tabs>`. Its props describe the tab; its children
 * are the panel, rendered only while the tab is selected.
 */
const ContextRailTab = ({ children }: ContextRailTabProps) => <>{children}</>;
ContextRailTab.displayName = "ContextRail.Tab";

export interface ContextRailTabsProps {
	/** The selected tab's `value`. A value naming no tab selects the first. */
	value: string;
	/** Reports the tab the user chose; the caller applies it to `value`. */
	onValueChange: (value: string) => void;
	/** Accessible name of the tablist. */
	label?: string;
	/** `<ContextRail.Tab>` elements. */
	children: React.ReactNode;
}

function readTabs(children: React.ReactNode) {
	return React.Children.toArray(children).filter(
		(child): child is TabElement =>
			React.isValidElement(child) && child.type === ContextRailTab,
	);
}

function visibleIndicator(
	indicator: ContextRailTabIndicator | undefined,
): ContextRailTabIndicator | undefined {
	if (indicator?.kind === "badge" && !(indicator.count > 0)) return undefined;
	return indicator;
}

type TabElement = React.ReactElement<ContextRailTabProps>;

/** What both renderings need of a tab: its indicator, if shown, and its name. */
function describeTab(tab: TabElement) {
	const indicator = visibleIndicator(tab.props.indicator);
	const name = indicator
		? `${tab.props.label}, ${indicator.label}`
		: tab.props.label;
	return { indicator, name };
}

/** Whether a collapsed panel would show anything: an atom, or a section with one. */
function hasCompactContent(children: React.ReactNode): boolean {
	return React.Children.toArray(children).some((child) => {
		if (isRailAtom(child)) return true;
		if (!React.isValidElement<{ children?: React.ReactNode }>(child)) {
			return false;
		}
		const type = child.type as { railSection?: symbol };
		return (
			type.railSection === RAIL_SECTION &&
			React.Children.toArray(child.props.children).some(isRailAtom)
		);
	});
}

/** Where an indicator sits on a collapsed tab's icon. */
const ON_ICON = {
	dot: { position: "absolute", top: "-0.5", insetInlineEnd: "-0.5" },
	badge: { position: "absolute", top: "-1.5", insetInlineEnd: "-2" },
} as const;

function IndicatorMark({
	indicator,
	onIcon,
}: {
	indicator: ContextRailTabIndicator;
	onIcon: boolean;
}) {
	const placement = onIcon ? ON_ICON[indicator.kind] : {};
	if (indicator.kind === "dot") {
		return (
			<Box
				data-testid="context-rail-tab-dot"
				aria-hidden
				w="2"
				h="2"
				borderRadius="full"
				bg="accent"
				flexShrink={0}
				{...placement}
			/>
		);
	}
	return (
		<Badge
			data-testid="context-rail-tab-badge"
			aria-hidden
			size="xs"
			variant="solid"
			colorPalette="gray"
			borderRadius="full"
			justifyContent="center"
			minW="4"
			flexShrink={0}
			{...placement}
		>
			{indicator.count}
		</Badge>
	);
}

interface TabsViewProps {
	tabs: TabElement[];
	selectedIndex: number;
	select: (value: string) => void;
}

/** Collapsed: a stack of icon buttons, each expanding the rail on its tab. */
function CollapsedTabs({ tabs, selectedIndex, select }: TabsViewProps) {
	const { expand } = useContextRailMode();
	const panel = tabs[selectedIndex].props.children;
	return (
		<>
			<Flex
				data-testid="context-rail-tabs-collapsed"
				direction="column"
				align="center"
				gap="2"
			>
				{tabs.map((tab, index) => {
					const { indicator, name } = describeTab(tab);
					return (
						<ContextRailIconButton
							key={tab.props.value}
							label={name}
							tone={index === selectedIndex ? "outline-primary" : "ghost"}
							icon={
								<Box
									as="span"
									position="relative"
									display="inline-flex"
									alignItems="center"
								>
									{tab.props.icon}
									{indicator ? (
										<IndicatorMark indicator={indicator} onIcon />
									) : null}
								</Box>
							}
							onClick={() => {
								select(tab.props.value);
								expand();
							}}
						/>
					);
				})}
			</Flex>
			{hasCompactContent(panel) ? (
				<>
					<ContextRailDivider />
					{panel}
				</>
			) : null}
		</>
	);
}

function isRtl(element: Element): boolean {
	return element.closest("[dir]")?.getAttribute("dir") === "rtl";
}

/** Expanded: a tablist and the selected tab's panel. */
function ExpandedTabs({
	tabs,
	selectedIndex,
	select,
	label,
}: TabsViewProps & { label?: string }) {
	const baseId = useId();
	const tabRefs = useRef<(HTMLElement | null)[]>([]);
	const tabId = (index: number) => `${baseId}-tab-${index}`;
	const panelId = `${baseId}-panel`;

	const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		// Count from the focused tab: a caller may decline a change, leaving
		// focus one step ahead of the selection.
		const focused = tabRefs.current.indexOf(
			document.activeElement as HTMLElement,
		);
		const from = focused === -1 ? selectedIndex : focused;
		const last = tabs.length - 1;
		const next = from === last ? 0 : from + 1;
		const previous = from === 0 ? last : from - 1;
		const rtl = isRtl(event.currentTarget);
		const target = {
			ArrowRight: rtl ? previous : next,
			ArrowLeft: rtl ? next : previous,
			Home: 0,
			End: last,
		}[event.key];
		if (target === undefined) return;
		event.preventDefault();
		tabRefs.current[target]?.focus();
		select(tabs[target].props.value);
	};

	return (
		<Stack gap="3">
			<Flex
				role="tablist"
				aria-label={label}
				aria-orientation="horizontal"
				onKeyDown={onKeyDown}
				gap="1"
				borderBottomWidth="1px"
				borderBottomColor="border"
			>
				{tabs.map((tab, index) => {
					const isSelected = index === selectedIndex;
					const { indicator, name } = describeTab(tab);
					return (
						<Flex
							key={tab.props.value}
							as="button"
							ref={(el: HTMLElement | null) => {
								tabRefs.current[index] = el;
							}}
							{...({ type: "button" } as object)}
							role="tab"
							id={tabId(index)}
							aria-selected={isSelected}
							aria-controls={panelId}
							aria-label={indicator ? name : undefined}
							tabIndex={isSelected ? 0 : -1}
							onClick={() => select(tab.props.value)}
							align="center"
							gap="1.5"
							minH="11"
							minW="11"
							px="2"
							// Overlap the tablist's border so the selected tab's
							// underline replaces it.
							mb="-1px"
							bg="transparent"
							// Longhands only: a `border="none"` shorthand here won over
							// the bottom width and style, so the underline never drew.
							borderStyle="solid"
							borderTopWidth="0"
							borderInlineStartWidth="0"
							borderInlineEndWidth="0"
							borderBottomWidth="2px"
							borderBottomColor={isSelected ? "accent" : "transparent"}
							color={isSelected ? "default" : "muted"}
							cursor="pointer"
							_hover={{ color: "default" }}
							_focusVisible={{ boxShadow: "focus-ring", outline: "none" }}
						>
							<Box
								as="span"
								display="inline-flex"
								alignItems="center"
								aria-hidden
							>
								{tab.props.icon}
							</Box>
							<Text
								as="span"
								fontSize="sm"
								fontWeight={isSelected ? "semibold" : "medium"}
							>
								{tab.props.label}
							</Text>
							{indicator ? (
								<IndicatorMark indicator={indicator} onIcon={false} />
							) : null}
						</Flex>
					);
				})}
			</Flex>
			<Stack
				role="tabpanel"
				id={panelId}
				aria-labelledby={tabId(selectedIndex)}
				gap="3"
			>
				{tabs[selectedIndex].props.children}
			</Stack>
		</Stack>
	);
}

/*
 * Hand-built rather than on the Tabs primitive: the collapsed rendering is
 * not a tablist at all (rail icon buttons that expand the rail), and the
 * expanded one must render only the selected panel inside the rail's own
 * layout. Chakra's Tabs would cover half of that and constrain the rest.
 */
const ContextRailTabs = ({
	value,
	onValueChange,
	label,
	children,
}: ContextRailTabsProps) => {
	const { collapsed } = useContextRailMode();
	const tabs = readTabs(children);
	if (tabs.length === 0) return null;

	const found = tabs.findIndex((tab) => tab.props.value === value);
	const selectedIndex = found === -1 ? 0 : found;
	const select = (next: string) => {
		if (next !== tabs[selectedIndex].props.value) onValueChange(next);
	};
	const view = { tabs, selectedIndex, select };

	return collapsed ? (
		<CollapsedTabs {...view} />
	) : (
		<ExpandedTabs {...view} label={label} />
	);
};
ContextRailTabs.displayName = "ContextRail.Tabs";

export { ContextRailTab, ContextRailTabs };
