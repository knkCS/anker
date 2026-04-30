// src/components/sidebar/sidebar.tsx
import React, { useRef, useState } from "react";
import { Button } from "../../atoms/button";
import { Box, Flex } from "../../primitives/layout";
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
	const dataProps = {
		"data-testid": "sidebar-item",
		"data-active": active ? "true" : "false",
	};

	const styleProps = {
		display: "flex" as const,
		alignItems: "center",
		gap: "2",
		px: "3",
		py: "2",
		borderRadius: "md",
		fontSize: "sm",
		fontWeight: "medium",
		color: active ? "primary.700" : "default",
		bg: active ? "primary.50" : "transparent",
		position: "relative" as const,
		textDecoration: "none",
	};

	const iconEl = icon ? (
		<Box display="inline-flex" alignItems="center">
			{icon}
		</Box>
	) : null;

	if (asChild) {
		// Clone the single child, merging our style props onto it.
		// We do NOT override data-testid — the child's own props win.
		// We set data-active from our side.
		const child = React.Children.only(children) as React.ReactElement<
			React.HTMLAttributes<HTMLElement> & {
				href?: string;
				"data-testid"?: string;
				"data-active"?: string;
			}
		>;
		return React.cloneElement(child, {
			"data-active": active ? "true" : "false",
			style: {
				...styleProps,
				...(child.props.style as React.CSSProperties | undefined),
			},
		});
	}

	return (
		<Box {...dataProps} {...styleProps}>
			{iconEl}
			{children}
		</Box>
	);
};
SidebarItem.displayName = "Sidebar.Item";

// UserMenu — simple state-based dropdown (avoids Zag/Ark state machine incompatibility in jsdom)
export interface SidebarUserMenuProps {
	user: { name?: string; email?: string };
	children: React.ReactNode;
}

const SidebarUserMenu = ({ user, children }: SidebarUserMenuProps) => {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const initials = (user.name ?? user.email ?? "")
		.split(/\s+/)
		.slice(0, 2)
		.map((s) => s[0]?.toUpperCase() ?? "")
		.join("");

	return (
		<Box position="relative" ref={containerRef}>
			<Button
				data-testid="sidebar-user-menu-trigger"
				variant="ghost"
				size="md"
				w="full"
				justifyContent="flex-start"
				px="2"
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="menu"
				aria-expanded={open}
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
			{open && (
				<Box
					role="menu"
					position="absolute"
					bottom="100%"
					left="0"
					right="0"
					bg="bg-surface"
					borderWidth="1px"
					borderColor="border"
					borderRadius="md"
					shadow="md"
					py="1"
					zIndex="dropdown"
				>
					{children}
				</Box>
			)}
		</Box>
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
	asChild: _asChild,
	onClick,
	children,
}: SidebarUserMenuItemProps) => {
	return (
		<Button
			role="menuitem"
			variant="ghost"
			w="full"
			justifyContent="flex-start"
			px="3"
			py="2"
			fontSize="sm"
			fontWeight="normal"
			borderRadius="0"
			onClick={onClick}
		>
			{children}
		</Button>
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
