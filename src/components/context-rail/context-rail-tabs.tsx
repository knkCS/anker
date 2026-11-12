// src/components/context-rail/context-rail-tabs.tsx
//
// Tabs for `<ContextRail>`: a rail splits its sections into tabs under the
// header. Controlled — the tab is the caller's state, so the tabs work in a
// rail reported through `usePageRail` and drawn by a foreign host, outside the
// screen's providers. Expanded, a tablist with one tabpanel holding only the
// selected tab's content; collapsed (44px), each tab is a
// `ContextRail.IconButton` that expands the rail on that tab.
import React, { useId, useRef } from "react";
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
		(child): child is React.ReactElement<ContextRailTabProps> =>
			React.isValidElement(child) && child.type === ContextRailTab,
	);
}

function visibleIndicator(
	indicator: ContextRailTabIndicator | undefined,
): ContextRailTabIndicator | undefined {
	if (indicator?.kind === "badge" && !(indicator.count > 0)) return undefined;
	return indicator;
}

function accessibleName(
	label: string,
	indicator: ContextRailTabIndicator | undefined,
): string {
	return indicator ? `${label}, ${indicator.label}` : label;
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

function IndicatorMark({
	indicator,
	compact,
}: {
	indicator: ContextRailTabIndicator;
	compact: boolean;
}) {
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
				{...(compact
					? { position: "absolute", top: "-0.5", insetInlineEnd: "-0.5" }
					: {})}
			/>
		);
	}
	return (
		<Box
			data-testid="context-rail-tab-badge"
			aria-hidden
			minW="4"
			h="4"
			px="1"
			borderRadius="full"
			bg="gray.solid"
			color="gray.contrast"
			fontSize="2xs"
			fontWeight="bold"
			lineHeight="4"
			textAlign="center"
			flexShrink={0}
			{...(compact
				? { position: "absolute", top: "-1.5", insetInlineEnd: "-2" }
				: {})}
		>
			{indicator.count}
		</Box>
	);
}

const ContextRailTabs = ({
	value,
	onValueChange,
	label,
	children,
}: ContextRailTabsProps) => {
	const { collapsed, expand } = useContextRailMode();
	const baseId = useId();
	const tabRefs = useRef<(HTMLElement | null)[]>([]);
	const tabs = readTabs(children);
	if (tabs.length === 0) return null;

	const found = tabs.findIndex((tab) => tab.props.value === value);
	const selectedIndex = found === -1 ? 0 : found;
	const selected = tabs[selectedIndex];
	const select = (next: string) => {
		if (next !== selected.props.value) onValueChange(next);
	};

	if (collapsed) {
		const panel = selected.props.children;
		return (
			<>
				<Flex
					data-testid="context-rail-tabs-collapsed"
					direction="column"
					align="center"
					gap="2"
				>
					{tabs.map((tab) => {
						const indicator = visibleIndicator(tab.props.indicator);
						return (
							<ContextRailIconButton
								key={tab.props.value}
								label={accessibleName(tab.props.label, indicator)}
								tone={tab === selected ? "outline-primary" : "ghost"}
								icon={
									<Box
										as="span"
										position="relative"
										display="inline-flex"
										alignItems="center"
									>
										{tab.props.icon}
										{indicator ? (
											<IndicatorMark indicator={indicator} compact />
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

	const tabId = (index: number) => `${baseId}-tab-${index}`;
	const panelId = `${baseId}-panel`;

	const onKeyDown = (event: React.KeyboardEvent) => {
		const last = tabs.length - 1;
		const target = {
			ArrowRight: selectedIndex === last ? 0 : selectedIndex + 1,
			ArrowLeft: selectedIndex === 0 ? last : selectedIndex - 1,
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
					const indicator = visibleIndicator(tab.props.indicator);
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
							aria-label={
								indicator
									? accessibleName(tab.props.label, indicator)
									: undefined
							}
							tabIndex={isSelected ? 0 : -1}
							onClick={() => select(tab.props.value)}
							align="center"
							gap="1.5"
							minH="11"
							px="2"
							mb="-1px"
							bg="transparent"
							border="none"
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
							<Text as="span" fontSize="sm" fontWeight="medium">
								{tab.props.label}
							</Text>
							{indicator ? (
								<IndicatorMark indicator={indicator} compact={false} />
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
				{selected.props.children}
			</Stack>
		</Stack>
	);
};
ContextRailTabs.displayName = "ContextRail.Tabs";

export { ContextRailTab, ContextRailTabs };
