// src/components/context-rail/context-rail.tsx
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { IconButton } from "../../atoms/button";
import { Box, Flex } from "../../primitives/layout";
import { Heading, Text } from "../../primitives/typography";

const COLLAPSED_WIDTH = "44px";
const EXPANDED_WIDTH = "360px";
const COLLAPSE_BREAKPOINT = 1440;

function getInitialCollapsed(storageKey?: string): boolean {
	if (typeof window === "undefined") return false;
	if (storageKey) {
		const stored = window.localStorage.getItem(storageKey);
		if (stored === "true") return true;
		if (stored === "false") return false;
	}
	return window.innerWidth < COLLAPSE_BREAKPOINT;
}

export interface ContextRailProps {
	storageKey?: string;
	children: React.ReactNode;
}

const ContextRailRoot = ({ storageKey, children }: ContextRailProps) => {
	const [collapsed, setCollapsed] = useState(() =>
		getInitialCollapsed(storageKey),
	);

	useEffect(() => {
		if (storageKey) {
			window.localStorage.setItem(storageKey, String(collapsed));
		}
	}, [collapsed, storageKey]);

	return (
		<Box
			data-testid="context-rail"
			data-collapsed={collapsed ? "true" : "false"}
			w={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
			minH="100vh"
			bg="bg-surface"
			borderLeftWidth="1px"
			borderLeftColor="border"
			transition="width 250ms ease-out"
			overflow="hidden"
			position="relative"
		>
			{collapsed ? (
				<Flex direction="column" align="center" pt="3" gap="3">
					<IconButton
						data-testid="context-rail-toggle"
						aria-label="Expand context rail"
						variant="ghost"
						size="sm"
						onClick={() => setCollapsed(false)}
					>
						<PanelRightOpen size={16} />
					</IconButton>
				</Flex>
			) : (
				<Flex direction="column" h="full">
					<Flex justify="flex-end" px="3" pt="3">
						<IconButton
							data-testid="context-rail-toggle"
							aria-label="Collapse context rail"
							variant="ghost"
							size="sm"
							onClick={() => setCollapsed(true)}
						>
							<PanelRightClose size={16} />
						</IconButton>
					</Flex>
					<Box flex="1" overflowY="auto" px="4" pb="4">
						{children}
					</Box>
				</Flex>
			)}
		</Box>
	);
};
ContextRailRoot.displayName = "ContextRail";

// Header
export interface ContextRailHeaderProps {
	eyebrow?: React.ReactNode;
	title: React.ReactNode;
	onClose?: () => void;
}

const ContextRailHeader = ({
	eyebrow,
	title,
	onClose: _onClose,
}: ContextRailHeaderProps) => (
	<Box mb="4">
		{eyebrow && (
			<Text
				fontSize="2xs"
				fontWeight="semibold"
				letterSpacing="wider"
				textTransform="uppercase"
				color="muted"
				mb="1"
			>
				{eyebrow}
			</Text>
		)}
		<Heading
			as="h2"
			fontSize="lg"
			fontWeight="semibold"
			color="default"
			letterSpacing="-0.01em"
		>
			{title}
		</Heading>
	</Box>
);
ContextRailHeader.displayName = "ContextRail.Header";

// Section
export interface ContextRailSectionProps {
	id: string;
	icon?: React.ReactNode;
	label: string;
	children: React.ReactNode;
}

const ContextRailSection = ({
	id,
	icon,
	label,
	children,
}: ContextRailSectionProps) => (
	<Box mb="4" data-section-id={id}>
		<Flex align="center" gap="2" mb="2">
			{icon && (
				<Box display="inline-flex" alignItems="center" color="muted">
					{icon}
				</Box>
			)}
			<Heading as="h3" fontSize="sm" fontWeight="semibold" color="default">
				{label}
			</Heading>
		</Flex>
		<Box>{children}</Box>
	</Box>
);
ContextRailSection.displayName = "ContextRail.Section";

// Footer
const ContextRailFooter = ({ children }: { children: React.ReactNode }) => (
	<Box mt="4" pt="4" borderTopWidth="1px" borderTopColor="border-muted">
		{children}
	</Box>
);
ContextRailFooter.displayName = "ContextRail.Footer";

// Compose
export const ContextRail = Object.assign(ContextRailRoot, {
	Header: ContextRailHeader,
	Section: ContextRailSection,
	Footer: ContextRailFooter,
});
