// src/components/sidebar/sidebar.tsx

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Button, IconButton } from "../../atoms/button";
import { Box, Flex } from "../../primitives/layout";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "../../primitives/menu";
import { Tooltip } from "../../primitives/tooltip";
import { Heading, Text } from "../../primitives/typography";

const COLLAPSED_WIDTH = "64px";
const EXPANDED_WIDTH = "240px";
const COLLAPSE_BREAKPOINT = 1440;

interface SidebarContextValue {
	collapsed: boolean;
	toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebarContext(): SidebarContextValue {
	const ctx = React.useContext(SidebarContext);
	if (!ctx) {
		throw new Error("useSidebarContext must be used inside <Sidebar>");
	}
	return ctx;
}

function getInitialCollapsed(
	storageKey: string | undefined,
	defaultCollapsed: boolean | undefined,
): boolean {
	if (typeof window === "undefined") return defaultCollapsed ?? false;
	if (storageKey) {
		const stored = window.localStorage.getItem(storageKey);
		if (stored === "true") return true;
		if (stored === "false") return false;
	}
	if (defaultCollapsed !== undefined) return defaultCollapsed;
	return window.innerWidth < COLLAPSE_BREAKPOINT;
}

// Root
export interface SidebarProps {
	storageKey?: string;
	defaultCollapsed?: boolean;
	children: React.ReactNode;
}

const SidebarRoot = ({
	storageKey,
	defaultCollapsed,
	children,
}: SidebarProps) => {
	const [collapsed, setCollapsed] = useState(() =>
		getInitialCollapsed(storageKey, defaultCollapsed),
	);

	useEffect(() => {
		if (storageKey) {
			window.localStorage.setItem(storageKey, String(collapsed));
		}
	}, [collapsed, storageKey]);

	const ctx = useMemo<SidebarContextValue>(
		() => ({
			collapsed,
			toggle: () => setCollapsed((c) => !c),
		}),
		[collapsed],
	);

	return (
		<SidebarContext.Provider value={ctx}>
			<Flex
				data-testid="sidebar"
				data-collapsed={collapsed ? "true" : "false"}
				direction="column"
				w={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
				minH="100vh"
				bg="bg-canvas"
				borderRightWidth="1px"
				borderRightColor="border"
				transition="width 250ms ease-out"
				overflow="hidden"
				position="relative"
			>
				<Flex justify="flex-end" px="2" pt="2">
					<IconButton
						data-testid="sidebar-toggle"
						aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
						variant="ghost"
						size="sm"
						onClick={() => setCollapsed((c) => !c)}
					>
						{collapsed ? (
							<PanelLeftOpen size={16} />
						) : (
							<PanelLeftClose size={16} />
						)}
					</IconButton>
				</Flex>
				{children}
			</Flex>
		</SidebarContext.Provider>
	);
};
SidebarRoot.displayName = "Sidebar";

// Header / Body / Footer
const SidebarHeader = ({ children }: { children: React.ReactNode }) => (
	<Box p="4" borderBottomWidth="1px" borderBottomColor="border">
		{children}
	</Box>
);
SidebarHeader.displayName = "Sidebar.Header";

const SidebarBody = ({ children }: { children?: React.ReactNode }) => (
	<Box flex="1" overflowY="auto" py="3">
		{children}
	</Box>
);
SidebarBody.displayName = "Sidebar.Body";

const SidebarFooter = ({ children }: { children: React.ReactNode }) => (
	<Box p="3" borderTopWidth="1px" borderTopColor="border">
		{children}
	</Box>
);
SidebarFooter.displayName = "Sidebar.Footer";

// Logo
export interface SidebarLogoProps {
	wordmark: string;
	subtitle?: string;
}

const SidebarLogo = ({ wordmark, subtitle }: SidebarLogoProps) => {
	const { collapsed } = useSidebarContext();
	if (collapsed) {
		return (
			<Box>
				<Heading
					as="span"
					fontSize="lg"
					fontWeight="bold"
					color="primary.700"
					letterSpacing="tight"
				>
					{wordmark.charAt(0)}
				</Heading>
			</Box>
		);
	}
	return (
		<Box mb={subtitle ? "3" : "0"}>
			<Heading
				as="span"
				fontSize="lg"
				fontWeight="bold"
				color="primary.700"
				letterSpacing="tight"
			>
				{wordmark}
			</Heading>
			{subtitle && (
				<Text
					fontSize="2xs"
					fontWeight="semibold"
					letterSpacing="wider"
					textTransform="uppercase"
					color="muted"
					mt="0.5"
				>
					{subtitle}
				</Text>
			)}
		</Box>
	);
};
SidebarLogo.displayName = "Sidebar.Logo";

// Slot
const SidebarSlot = ({ children }: { children: React.ReactNode }) => (
	<Box mt="3">{children}</Box>
);
SidebarSlot.displayName = "Sidebar.Slot";

// Section — nav group
export interface SidebarSectionProps {
	label: string;
	children: React.ReactNode;
}

const SidebarSection = ({ label, children }: SidebarSectionProps) => {
	const { collapsed } = useSidebarContext();
	return (
		<Box mb="4" px="3">
			{!collapsed && (
				<Text
					fontSize="2xs"
					fontWeight="semibold"
					letterSpacing="wider"
					textTransform="uppercase"
					color="muted"
					px="2"
					mb="1"
				>
					{label}
				</Text>
			)}
			<Flex direction="column" gap="0.5">
				{children}
			</Flex>
		</Box>
	);
};
SidebarSection.displayName = "Sidebar.Section";

// Item — nav link with active state
export interface SidebarItemProps {
	icon?: React.ReactNode;
	children: React.ReactNode;
	asChild?: boolean;
	active?: boolean;
	label?: string; // NEW — overrides children for tooltip text when collapsed
}

const SidebarItem = ({
	icon,
	children,
	asChild,
	active,
	label,
}: SidebarItemProps) => {
	const { collapsed } = useSidebarContext();

	// Styles must be plain CSS so they survive `style={...}` inline styling on
	// the cloned asChild element (e.g. <NavLink>). Chakra prop shorthand like
	// `bg="primary.50"` or `borderRadius="md"` is silently dropped by the
	// browser when applied as inline CSS — it only resolves through Chakra
	// components. We reference Chakra's emitted CSS variables directly.
	const itemStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		justifyContent: collapsed ? "center" : "flex-start",
		gap: "var(--chakra-spacing-2)",
		paddingInline: "var(--chakra-spacing-3)",
		paddingBlock: "var(--chakra-spacing-2)",
		borderRadius: "var(--chakra-radii-sm)",
		fontSize: "var(--chakra-font-sizes-sm)",
		fontWeight: active
			? "var(--chakra-font-weights-medium)"
			: "var(--chakra-font-weights-normal)",
		color: active
			? "var(--chakra-colors-primary-700)"
			: "var(--chakra-colors-default)",
		background: active ? "var(--chakra-colors-bg-surface)" : "transparent",
		boxShadow: active
			? "inset 0 0 0 1px var(--chakra-colors-border), 0 1px 2px rgba(0,0,0,0.04)"
			: undefined,
		position: "relative",
		textDecoration: "none",
	};

	const iconEl = icon ? (
		<Box display="inline-flex" alignItems="center" flexShrink={0}>
			{icon}
		</Box>
	) : null;

	// Right-tab indicator on active items, matching the design handoff
	// (3px × 14px primary.700 pill at the trailing edge of the row).
	// Hidden when collapsed (no room).
	const activeTab =
		active && !collapsed ? (
			<span
				aria-hidden="true"
				style={{
					width: 3,
					height: 14,
					background: "var(--chakra-colors-primary-700)",
					borderRadius: 999,
					flexShrink: 0,
					marginInlineStart: "auto",
				}}
			/>
		) : null;

	const tooltipLabel = label || (typeof children === "string" ? children : "");

	const wrapTooltip = (node: React.ReactElement) =>
		collapsed && tooltipLabel ? (
			<Tooltip content={tooltipLabel} positioning={{ placement: "right" }}>
				{node}
			</Tooltip>
		) : (
			node
		);

	if (asChild) {
		const child = React.Children.only(children) as React.ReactElement<
			React.HTMLAttributes<HTMLElement> & {
				href?: string;
				"data-testid"?: string;
				"data-active"?: string;
				children?: React.ReactNode;
			}
		>;
		const cloned = React.cloneElement(
			child,
			{
				"data-active": active ? "true" : "false",
				style: {
					...itemStyle,
					...(child.props.style as React.CSSProperties | undefined),
				},
			},
			iconEl,
			collapsed ? null : child.props.children,
			activeTab,
		);
		return wrapTooltip(cloned);
	}

	return wrapTooltip(
		<Box
			data-testid="sidebar-item"
			data-active={active ? "true" : "false"}
			style={itemStyle}
		>
			{iconEl}
			{!collapsed && children}
			{activeTab}
		</Box>,
	);
};
SidebarItem.displayName = "Sidebar.Item";

// UserMenu
export interface SidebarUserMenuProps {
	user: { name?: string; email?: string };
	children: React.ReactNode;
}

const SidebarUserMenu = ({ user, children }: SidebarUserMenuProps) => {
	const { collapsed } = useSidebarContext();
	const initials = (user.name ?? user.email ?? "")
		.split(/\s+/)
		.slice(0, 2)
		.map((s) => s[0]?.toUpperCase() ?? "")
		.join("");

	return (
		<MenuRoot>
			<MenuTrigger asChild>
				<Button
					data-testid="sidebar-user-menu-trigger"
					variant="ghost"
					size="md"
					w="full"
					justifyContent={collapsed ? "center" : "flex-start"}
					px="2"
				>
					<Flex align="center" gap="2" w={collapsed ? "auto" : "full"}>
						<Flex
							align="center"
							justify="center"
							w="32px"
							h="32px"
							borderRadius="full"
							bg="primary.700"
							color="white"
							fontSize="xs"
							fontWeight="semibold"
							flexShrink={0}
						>
							{initials || "?"}
						</Flex>
						{!collapsed && (
							<Box textAlign="start" flex="1" minW="0">
								<Text
									fontSize="sm"
									fontWeight="medium"
									color="default"
									lineClamp={1}
								>
									{user.name ?? user.email}
								</Text>
								{user.email && user.name && (
									<Text fontSize="xs" color="muted" lineClamp={1}>
										{user.email}
									</Text>
								)}
							</Box>
						)}
					</Flex>
				</Button>
			</MenuTrigger>
			<MenuContent portalled={false}>{children}</MenuContent>
		</MenuRoot>
	);
};
SidebarUserMenu.displayName = "Sidebar.UserMenu";

// UserMenuItem
export interface SidebarUserMenuItemProps {
	asChild?: boolean;
	onClick?: () => void;
	children: React.ReactNode;
}

const SidebarUserMenuItem = ({
	asChild,
	onClick,
	children,
}: SidebarUserMenuItemProps) => {
	if (asChild) {
		const child = React.Children.only(children) as React.ReactElement;
		return (
			<MenuItem value="link" onClick={onClick}>
				{React.cloneElement(child, {})}
			</MenuItem>
		);
	}
	return (
		<MenuItem
			value={typeof children === "string" ? children : "item"}
			onClick={onClick}
		>
			{children}
		</MenuItem>
	);
};
SidebarUserMenuItem.displayName = "Sidebar.UserMenuItem";

// Compose
export const Sidebar = Object.assign(SidebarRoot, {
	Header: SidebarHeader,
	Body: SidebarBody,
	Footer: SidebarFooter,
	Logo: SidebarLogo,
	Slot: SidebarSlot,
	Section: SidebarSection,
	Item: SidebarItem,
	UserMenu: SidebarUserMenu,
	UserMenuItem: SidebarUserMenuItem,
});
