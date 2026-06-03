// src/templates/subnav-layout.tsx
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IconButton } from "../atoms/button";
import { NavListModeProvider } from "../components/nav-list/nav-list-context";
import { Box, Grid } from "../primitives/layout";

const EXPANDED_NAV = "220px";
const COLLAPSED_NAV = "56px";

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
	return defaultCollapsed ?? false;
}

export interface SubNavLayoutProps {
	storageKey?: string;
	defaultCollapsed?: boolean;
	/** Overrides the toggle's aria-label. */
	toggleAriaLabel?: string;
	children: ReactNode;
}

const SubNavLayoutRoot = ({
	storageKey,
	defaultCollapsed,
	toggleAriaLabel,
	children,
}: SubNavLayoutProps) => {
	const [collapsed, setCollapsed] = useState(() =>
		getInitialCollapsed(storageKey, defaultCollapsed),
	);

	useEffect(() => {
		if (storageKey) {
			window.localStorage.setItem(storageKey, String(collapsed));
		}
	}, [collapsed, storageKey]);

	const toggle = useCallback(() => setCollapsed((c) => !c), []);
	const navMode = useMemo(() => ({ collapsed }), [collapsed]);
	const label =
		toggleAriaLabel ?? (collapsed ? "Expand sub-nav" : "Collapse sub-nav");

	return (
		<NavListModeProvider value={navMode}>
			<Box
				data-testid="subnav-layout-stretch"
				h="100%"
				display="flex"
				flexDirection="column"
				minH="0"
			>
				<Grid
					data-testid="subnav-layout"
					data-collapsed={collapsed ? "true" : "false"}
					gridTemplateColumns={`${collapsed ? COLLAPSED_NAV : EXPANDED_NAV} 1fr`}
					alignItems="stretch"
					minH="0"
					flex="1"
					position="relative"
					transition="grid-template-columns 250ms ease-out"
				>
					{children}
					<IconButton
						data-testid="subnav-toggle"
						aria-label={label}
						onClick={toggle}
						variant="outline"
						size="xs"
						position="absolute"
						top="3"
						left={collapsed ? "44px" : "208px"}
						width="7"
						height="7"
						minW="7"
						borderRadius="full"
						bg="bg-surface"
						borderColor="border"
						boxShadow="sm"
						zIndex={4}
						_hover={{ bg: "bg-muted" }}
						transition="left 250ms ease-out"
					>
						{collapsed ? (
							<PanelLeftOpen size={14} />
						) : (
							<PanelLeftClose size={14} />
						)}
					</IconButton>
				</Grid>
			</Box>
		</NavListModeProvider>
	);
};
SubNavLayoutRoot.displayName = "SubNavLayout";

export interface SubNavLayoutNavProps {
	"aria-label"?: string;
	children: ReactNode;
}

const SubNavLayoutNav = ({ children, ...rest }: SubNavLayoutNavProps) => (
	<Box
		as="nav"
		aria-label={rest["aria-label"]}
		data-testid="subnav-layout-nav"
		py="3"
		px="1"
		minW="0"
	>
		{children}
	</Box>
);
SubNavLayoutNav.displayName = "SubNavLayout.Nav";

export interface SubNavLayoutDetailProps {
	children: ReactNode;
}

const SubNavLayoutDetail = ({ children }: SubNavLayoutDetailProps) => (
	<Box
		data-testid="subnav-layout-detail"
		borderLeftWidth="1px"
		borderColor="border"
		minW="0"
		display="flex"
		flexDirection="column"
	>
		{children}
	</Box>
);
SubNavLayoutDetail.displayName = "SubNavLayout.Detail";

export interface SubNavLayoutToolbarProps {
	children: ReactNode;
}

const SubNavLayoutToolbar = ({ children }: SubNavLayoutToolbarProps) => (
	<Box
		data-testid="subnav-layout-toolbar"
		display="flex"
		alignItems="center"
		gap="3"
		px="5"
		py="3"
		borderBottomWidth="1px"
		borderColor="border-muted"
		bg="bg-canvas"
	>
		{children}
	</Box>
);
SubNavLayoutToolbar.displayName = "SubNavLayout.Toolbar";

export const SubNavLayout = Object.assign(SubNavLayoutRoot, {
	Nav: SubNavLayoutNav,
	Detail: SubNavLayoutDetail,
	Toolbar: SubNavLayoutToolbar,
});
