// src/components/context-rail/context-rail.tsx
import { ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { IconButton } from "../../atoms/button";
import { Box, Flex } from "../../primitives/layout";
import { Heading, Text } from "../../primitives/typography";
import {
	RAIL_ATOM,
	RailModeContext,
	isRailAtom,
	useContextRailMode,
} from "./context-rail-context";
import {
	ContextRailAvatar,
	ContextRailIconButton,
	ContextRailStatusIcon,
	ContextRailValueTile,
} from "./atoms";

export { RAIL_ATOM, useContextRailMode };

const COLLAPSED_WIDTH = "44px";
const EXPANDED_WIDTH = "360px";
const COLLAPSE_BREAKPOINT = 1440;

/**
 * Internal context that signals "I am a `<ContextRail>` Root". Used by
 * `<ContextRail.Header>` and `<ContextRail.Section>` to detect when they
 * are rendered outside the Root and emit a dev-mode warning.
 *
 * The value is intentionally minimal — presence is the signal.
 */
const RailRootContext = createContext<boolean>(false);

/**
 * Dev-mode helper: warn once per component-mount when a rail child is
 * rendered without a `<ContextRail>` Root ancestor. No-op in production.
 */
function isDevMode(): boolean {
	// `process` is a Node global; bundlers (Vite, tsup) replace
	// `process.env.NODE_ENV` at build time, so this works in both Node
	// (vitest, SSR) and browser bundles. We avoid `@types/node` by
	// reaching through `globalThis`.
	const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
		.process;
	return proc?.env?.NODE_ENV !== "production";
}

function useWarnIfOutsideRailRoot(componentName: string) {
	const insideRoot = useContext(RailRootContext);
	const warnedRef = useRef(false);
	useEffect(() => {
		if (!insideRoot && !warnedRef.current && isDevMode()) {
			warnedRef.current = true;
			console.warn(
				`${componentName} was rendered outside <ContextRail>. Wrap rail content in <ContextRail> to get column width, collapse toggle, inner padding, and persistence. See docs/page-patterns.md.`,
			);
		}
	}, [insideRoot, componentName]);
}

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
		<RailRootContext.Provider value={true}>
			<RailModeContext.Provider value={{ collapsed }}>
			<Box
				data-testid="context-rail"
				data-collapsed={collapsed ? "true" : "false"}
				w={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
				minH="100vh"
				transition="width 250ms ease-out"
				position="relative"
			>
				<IconButton
					data-testid="context-rail-toggle"
					aria-label={
						collapsed ? "Expand context rail" : "Collapse context rail"
					}
					onClick={() => setCollapsed((c) => !c)}
					variant="outline"
					size="xs"
					position="absolute"
					top="6"
					left="-3.5"
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
						<PanelRightOpen size={14} />
					) : (
						<PanelRightClose size={14} />
					)}
				</IconButton>
				{collapsed ? (
					<Flex
						data-testid="context-rail-collapsed-body"
						direction="column"
						align="center"
						gap="2"
						pt="14"
						pb="3"
						h="full"
						overflowY="auto"
					>
						{children}
					</Flex>
				) : (
					<Box h="full" overflowY="auto" px="4" pt="4" pb="4">
						{children}
					</Box>
				)}
			</Box>
			</RailModeContext.Provider>
		</RailRootContext.Provider>
	);
};
ContextRailRoot.displayName = "ContextRail";

// Header
export interface ContextRailHeaderProps {
	eyebrow?: React.ReactNode;
	title: React.ReactNode;
}

const ContextRailHeader = ({ eyebrow, title }: ContextRailHeaderProps) => {
	useWarnIfOutsideRailRoot("ContextRail.Header");
	const { collapsed } = useContextRailMode();
	if (collapsed) return null;
	return (
		<Box mb="4" pb="3" borderBottomWidth="1px" borderBottomColor="border">
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
};
ContextRailHeader.displayName = "ContextRail.Header";

// Section
export interface ContextRailSectionProps {
	id: string;
	icon?: React.ReactNode;
	label: string;
	defaultOpen?: boolean;
	action?: React.ReactNode;
	children: React.ReactNode;
}

const ContextRailSection = ({
	id,
	icon,
	label,
	defaultOpen = true,
	action,
	children,
}: ContextRailSectionProps) => {
	useWarnIfOutsideRailRoot("ContextRail.Section");
	const { collapsed } = useContextRailMode();
	const [open, setOpen] = useState(defaultOpen);

	if (collapsed) {
		const atomChildren = React.Children.toArray(children).filter(isRailAtom);
		if (atomChildren.length === 0) return null;
		return <>{atomChildren}</>;
	}

	return (
		<Box
			data-section-id={id}
			borderBottomWidth="1px"
			borderBottomColor="border-muted"
		>
			<Flex w="full" align="center" gap="2">
				<Flex
					as="button"
					{...({ type: "button" } as object)}
					onClick={() => setOpen((o) => !o)}
					aria-expanded={open}
					flex="1"
					align="center"
					gap="2"
					px="0"
					py="3"
					bg="transparent"
					border="none"
					cursor="pointer"
					textAlign="left"
					_hover={{ bg: "bg-subtle" }}
				>
					<Box
						display="inline-flex"
						alignItems="center"
						color="muted"
						transform={open ? "rotate(90deg)" : "none"}
						transition="transform 120ms ease-out"
					>
						<ChevronRight size={12} aria-hidden />
					</Box>
					{icon && (
						<Box display="inline-flex" alignItems="center" color="muted">
							{icon}
						</Box>
					)}
					<Heading
						as="h3"
						fontSize="2xs"
						fontWeight="semibold"
						letterSpacing="wider"
						textTransform="uppercase"
						color="muted"
						flex="1"
					>
						{label}
					</Heading>
				</Flex>
				{action && <Box py="3">{action}</Box>}
			</Flex>
			{open && <Box pb="3">{children}</Box>}
		</Box>
	);
};
ContextRailSection.displayName = "ContextRail.Section";

// Footer
const ContextRailFooter = ({ children }: { children: React.ReactNode }) => {
	const { collapsed } = useContextRailMode();
	return (
		<Box
			mt={collapsed ? "auto" : "4"}
			pt={collapsed ? "3" : "4"}
			borderTopWidth="1px"
			borderTopColor="border-muted"
			w="full"
		>
			{children}
		</Box>
	);
};
ContextRailFooter.displayName = "ContextRail.Footer";

// Compose
export const ContextRail = Object.assign(ContextRailRoot, {
	Header: ContextRailHeader,
	Section: ContextRailSection,
	Footer: ContextRailFooter,
	Avatar: ContextRailAvatar,
	IconButton: ContextRailIconButton,
	StatusIcon: ContextRailStatusIcon,
	ValueTile: ContextRailValueTile,
});
