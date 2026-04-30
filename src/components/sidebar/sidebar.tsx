// src/components/sidebar/sidebar.tsx
import React from "react";
import { Button } from "../../atoms/button";
import { Box, Flex } from "../../primitives/layout";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "../../primitives/menu";
import { Heading, Text } from "../../primitives/typography";

// Root
export interface SidebarProps {
	children: React.ReactNode;
}

const SidebarRoot = ({ children }: SidebarProps) => (
	<Flex
		data-testid="sidebar"
		direction="column"
		w="240px"
		minH="100vh"
		bg="bg-canvas"
		borderRightWidth="1px"
		borderRightColor="border"
	>
		{children}
	</Flex>
);
SidebarRoot.displayName = "Sidebar";

// Header / Body / Footer
const SidebarHeader = ({ children }: { children: React.ReactNode }) => (
	<Box p="4" borderBottomWidth="1px" borderBottomColor="border-muted">
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
	<Box p="3" borderTopWidth="1px" borderTopColor="border-muted">
		{children}
	</Box>
);
SidebarFooter.displayName = "Sidebar.Footer";

// Logo
export interface SidebarLogoProps {
	wordmark: string;
	subtitle?: string;
}

const SidebarLogo = ({ wordmark, subtitle }: SidebarLogoProps) => (
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
	<Box mb="4" px="3">
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
		<Flex direction="column" gap="0.5">
			{children}
		</Flex>
	</Box>
);
SidebarSection.displayName = "Sidebar.Section";

// Item — nav link with active state
export interface SidebarItemProps {
	icon?: React.ReactNode;
	children: React.ReactNode;
	asChild?: boolean;
	active?: boolean;
}

const SidebarItem = ({ icon, children, asChild, active }: SidebarItemProps) => {
	// Styles must be plain CSS so they survive `style={...}` inline styling on
	// the cloned asChild element (e.g. <NavLink>). Chakra prop shorthand like
	// `bg="primary.50"` or `borderRadius="md"` is silently dropped by the
	// browser when applied as inline CSS — it only resolves through Chakra
	// components. We reference Chakra's emitted CSS variables directly.
	const itemStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
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
	const activeTab = active ? (
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

	if (asChild) {
		const child = React.Children.only(children) as React.ReactElement<
			React.HTMLAttributes<HTMLElement> & {
				href?: string;
				"data-testid"?: string;
				"data-active"?: string;
				children?: React.ReactNode;
			}
		>;
		return React.cloneElement(
			child,
			{
				"data-active": active ? "true" : "false",
				style: {
					...itemStyle,
					...(child.props.style as React.CSSProperties | undefined),
				},
			},
			iconEl,
			child.props.children,
			activeTab,
		);
	}

	return (
		<Box
			data-testid="sidebar-item"
			data-active={active ? "true" : "false"}
			style={itemStyle}
		>
			{iconEl}
			{children}
			{activeTab}
		</Box>
	);
};
SidebarItem.displayName = "Sidebar.Item";

// UserMenu
export interface SidebarUserMenuProps {
	user: { name?: string; email?: string };
	children: React.ReactNode;
}

const SidebarUserMenu = ({ user, children }: SidebarUserMenuProps) => {
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
					justifyContent="flex-start"
					px="2"
				>
					<Flex align="center" gap="2" w="full">
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
