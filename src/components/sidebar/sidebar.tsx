// src/components/sidebar/sidebar.tsx

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, IconButton } from "../../atoms/button";
import { Box, Flex } from "../../primitives/layout";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "../../primitives/menu";
import { Text } from "../../primitives/typography";
import { KnkLogo } from "../knk-logo/knk-logo";
import { NavList } from "../nav-list/nav-list";
import { NavListModeProvider } from "../nav-list/nav-list-context";

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

	const toggle = useCallback(() => setCollapsed((c) => !c), []);

	const ctx = useMemo<SidebarContextValue>(
		() => ({
			collapsed,
			toggle,
		}),
		[collapsed, toggle],
	);

	return (
		<SidebarContext.Provider value={ctx}>
			<NavListModeProvider value={{ collapsed }}>
				<Box
					position="relative"
					w={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
					transition="width 250ms ease-out"
					flexShrink={0}
					h="full"
				>
					<Flex
						data-testid="sidebar"
						data-collapsed={collapsed ? "true" : "false"}
						direction="column"
						w="full"
						h="full"
						bg="bg-canvas"
						borderRightWidth="1px"
						borderRightColor="border"
						overflow="hidden"
					>
						{children}
					</Flex>
					<IconButton
						data-testid="sidebar-toggle"
						aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
						onClick={toggle}
						variant="outline"
						size="xs"
						position="absolute"
						top="6"
						right="-3.5"
						width="7"
						height="7"
						minW="7"
						borderRadius="full"
						bg="bg-surface"
						borderColor="border"
						boxShadow="sm"
						zIndex={1}
						_hover={{ bg: "bg-muted" }}
					>
						{collapsed ? (
							<PanelLeftOpen size={14} />
						) : (
							<PanelLeftClose size={14} />
						)}
					</IconButton>
				</Box>
			</NavListModeProvider>
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
	<Box data-testid="sidebar-body" flex="1" minH="0" overflowY="auto" py="3">
		{children}
	</Box>
);
SidebarBody.displayName = "Sidebar.Body";

const SidebarFooter = ({ children }: { children: React.ReactNode }) => (
	<Box
		data-testid="sidebar-footer"
		flexShrink={0}
		p="3"
		borderTopWidth="1px"
		borderTopColor="border"
	>
		{children}
	</Box>
);
SidebarFooter.displayName = "Sidebar.Footer";

// Logo
export interface SidebarLogoProps {
	/** Lowercase product name, e.g. "odon", "core", "mediahub". */
	productName: string;
}

const SidebarLogo = ({ productName }: SidebarLogoProps) => {
	const { collapsed } = useSidebarContext();

	if (collapsed) {
		return (
			<Flex direction="column" align="center">
				<KnkLogo boxSize={22} />
			</Flex>
		);
	}

	return (
		<Flex direction="column" align="center" gap="2" w="full">
			<Flex direction="column" align="center" gap="2" pb="3">
				<KnkLogo boxSize={56} />
				<Text
					fontSize="sm"
					fontWeight="semibold"
					color="currentColor"
					lineHeight="1"
				>
					{productName}
				</Text>
			</Flex>
		</Flex>
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

const SidebarSection = ({ label, children }: SidebarSectionProps) => (
	<NavList.Group label={label}>{children}</NavList.Group>
);
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
}: SidebarItemProps) => (
	<NavList.Item
		icon={icon}
		active={active}
		asChild={asChild}
		label={label}
		testId="sidebar-item"
	>
		{children}
	</NavList.Item>
);
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
