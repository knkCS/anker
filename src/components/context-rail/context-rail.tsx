// src/components/context-rail/context-rail.tsx
import { ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { IconButton } from "../../atoms/button";
import { Box, Flex, Stack } from "../../primitives/layout";
import { Heading, Text } from "../../primitives/typography";
import {
	readStoredFlag,
	readStoredValue,
	writeStoredFlag,
	writeStoredValue,
} from "../../utils/safe-storage";
import {
	ContextRailAvatar,
	ContextRailDivider,
	ContextRailIconButton,
	ContextRailStatusIcon,
	ContextRailValueTile,
} from "./atoms";
import {
	isRailAtom,
	RAIL_ATOM,
	RAIL_SECTION,
	RailModeContext,
	useContextRailMode,
} from "./context-rail-context";
import { ContextRailTab, ContextRailTabs } from "./context-rail-tabs";

export { RAIL_ATOM, useContextRailMode };
export type {
	ContextRailStatusIconProps,
	ContextRailStatusIconTone,
} from "./atoms";
export type {
	ContextRailTabIndicator,
	ContextRailTabProps,
	ContextRailTabsProps,
} from "./context-rail-tabs";

const COLLAPSED_WIDTH = "44px";
const EXPANDED_WIDTH = "360px";
const COLLAPSE_BREAKPOINT = 1440;
/** Pixels one arrow-key press moves the resize handle. */
const RESIZE_KEY_STEP = 16;

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
		const stored = readStoredFlag(storageKey);
		if (stored !== undefined) return stored;
	}
	return window.innerWidth < COLLAPSE_BREAKPOINT;
}

/**
 * The opt-in resizable width of a `<ContextRail>`. All widths are pixels.
 *
 * `maxWidth` is either a fixed number or a function of the **space** the
 * rail shares with the main column (the rail's right edge minus the left
 * edge of the element before the rail's column — AppShell's main column),
 * e.g. `(space) => space / 2` for "half of the main area". While that space
 * cannot be measured the function form imposes no maximum. When the maximum
 * falls below the minimum, the maximum wins: the main column keeps its room.
 */
export interface ContextRailResizable {
	defaultWidth: number;
	minWidth: number;
	maxWidth: number | ((space: number) => number);
}

export interface ContextRailProps {
	storageKey?: string;
	/**
	 * Opt in to a user-resizable width. Without it the rail keeps its fixed
	 * 360px. The width is remembered under `${storageKey}:width`.
	 */
	resizable?: ContextRailResizable;
	/**
	 * Opens the rail from the screen: whenever this value **changes** to
	 * anything but `null`, `undefined` or `false`, a collapsed rail expands —
	 * as if the user pressed expand, so it is stored under `storageKey`. The
	 * value on mount does not expand (a remembered collapse survives a
	 * reload), a change to `null`/`undefined`/`false` does nothing, and focus
	 * is not moved. Pass e.g. the selected item's id so selecting an item
	 * opens the rail; the user's own collapse holds until the value changes.
	 * Values compare by identity: pass a stable value (an id), not an object
	 * created on every render, which would re-open the rail on each render.
	 */
	expandOn?: unknown;
	children: React.ReactNode;
}

function isOpenSignal(value: unknown): boolean {
	return value !== null && value !== undefined && value !== false;
}

function widthStorageKey(storageKey: string): string {
	return `${storageKey}:width`;
}

function readStoredWidth(storageKey?: string): number | undefined {
	if (!storageKey) return undefined;
	const stored = Number.parseFloat(
		readStoredValue(widthStorageKey(storageKey)) ?? "",
	);
	return Number.isFinite(stored) ? stored : undefined;
}

/**
 * The space the rail shares with the main column, or `undefined` when it
 * cannot be measured (no main column, or nothing laid out yet).
 */
function measureSharedSpace(rail: HTMLElement | null): number | undefined {
	const main = rail?.parentElement?.previousElementSibling;
	if (!rail || !main) return undefined;
	const space =
		rail.getBoundingClientRect().right - main.getBoundingClientRect().left;
	return space > 0 ? space : undefined;
}

/** The maximum width, or `undefined` while the function form cannot measure. */
function resolveMaxWidth(
	resizable: ContextRailResizable,
	space: number | undefined,
): number | undefined {
	if (typeof resizable.maxWidth === "number") return resizable.maxWidth;
	return space === undefined ? undefined : resizable.maxWidth(space);
}

/** Clamp into [min, max]; the maximum wins when the two cross. */
function clampWidth(
	width: number,
	min: number,
	max: number | undefined,
): number {
	const atLeastMin = Math.max(min, width);
	return max === undefined ? atLeastMin : Math.min(max, atLeastMin);
}

const KEY_DELTAS: Record<string, number> = {
	ArrowLeft: RESIZE_KEY_STEP,
	ArrowRight: -RESIZE_KEY_STEP,
};

/**
 * Width state for a resizable rail: the remembered width, clamped to the
 * current bounds, plus the handlers for the resize handle. Only a user's
 * action stores a width, so a narrow window never overwrites the stored one.
 */
function useResizableWidth(
	resizable: ContextRailResizable | undefined,
	storageKey: string | undefined,
	railRef: React.RefObject<HTMLDivElement | null>,
) {
	const [width, setWidth] = useState<number | undefined>(() =>
		resizable
			? (readStoredWidth(storageKey) ?? resizable.defaultWidth)
			: undefined,
	);
	const [space, setSpace] = useState<number | undefined>(undefined);
	const [resizing, setResizing] = useState(false);
	const isResizable = resizable !== undefined;

	const measure = useCallback(() => {
		const measured = measureSharedSpace(railRef.current);
		setSpace(measured);
		return measured;
	}, [railRef]);

	useLayoutEffect(() => {
		if (!isResizable) return;
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [isResizable, measure]);

	const max = resizable ? resolveMaxWidth(resizable, space) : undefined;
	// When the maximum falls below the minimum the maximum wins; the
	// announced minimum follows so the separator's value stays in range.
	const min = Math.min(resizable?.minWidth ?? 0, max ?? Number.MAX_VALUE);
	const shown = width === undefined ? 0 : clampWidth(width, min, max);

	const commit = (next: number) => {
		setWidth(next);
		if (storageKey) {
			writeStoredValue(widthStorageKey(storageKey), String(next));
		}
	};

	const onKeyDown = (event: React.KeyboardEvent) => {
		const delta = KEY_DELTAS[event.key];
		if (!resizable || delta === undefined) return;
		event.preventDefault();
		const currentMax = resolveMaxWidth(resizable, measure());
		commit(clampWidth(shown + delta, min, currentMax));
	};

	const onPointerDown = (event: React.PointerEvent) => {
		if (!resizable || event.button !== 0) return;
		event.preventDefault();
		const startX = event.clientX;
		const startWidth = shown;
		const dragMax = resolveMaxWidth(resizable, measure());
		let last = startWidth;
		setResizing(true);
		const onMove = (move: PointerEvent) => {
			// The handle sits on the leading (left) edge: moving left widens.
			last = clampWidth(startWidth + startX - move.clientX, min, dragMax);
			setWidth(last);
		};
		const onUp = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			setResizing(false);
			commit(last);
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	};

	const onDoubleClick = () => {
		if (resizable) commit(resizable.defaultWidth);
	};

	return { shown, min, max, resizing, onKeyDown, onPointerDown, onDoubleClick };
}

const ContextRailRoot = ({
	storageKey,
	resizable,
	expandOn,
	children,
}: ContextRailProps) => {
	const [collapsed, setCollapsed] = useState(() =>
		getInitialCollapsed(storageKey),
	);
	// Adjust state while rendering when `expandOn` changes, so the expanded
	// rail paints in the same frame as the change (no collapsed flash). The
	// initial value is the baseline: mounting never expands.
	const [seenExpandOn, setSeenExpandOn] = useState(expandOn);
	if (!Object.is(seenExpandOn, expandOn)) {
		setSeenExpandOn(expandOn);
		if (isOpenSignal(expandOn)) setCollapsed(false);
	}
	const railRef = useRef<HTMLDivElement>(null);
	const resize = useResizableWidth(resizable, storageKey, railRef);
	const showHandle = resizable !== undefined && !collapsed;

	useEffect(() => {
		if (storageKey) {
			writeStoredFlag(storageKey, collapsed);
		}
	}, [collapsed, storageKey]);
	const expand = useCallback(() => setCollapsed(false), []);

	return (
		<RailRootContext.Provider value={true}>
			<RailModeContext.Provider value={{ collapsed, expand }}>
				<Box
					ref={railRef}
					data-testid="context-rail"
					data-collapsed={collapsed ? "true" : "false"}
					w={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
					// A resizable rail's width changes on every pointer move; an
					// inline style avoids minting a CSS class per pixel.
					style={showHandle ? { width: `${resize.shown}px` } : undefined}
					h="full"
					transition={resize.resizing ? "none" : "width 250ms ease-out"}
					position="relative"
				>
					{showHandle ? (
						<Box
							role="separator"
							aria-label="Resize context rail"
							aria-orientation="vertical"
							aria-valuenow={resize.shown}
							aria-valuemin={resize.min}
							aria-valuemax={resize.max}
							tabIndex={0}
							data-testid="context-rail-resize-handle"
							onKeyDown={resize.onKeyDown}
							onPointerDown={resize.onPointerDown}
							onDoubleClick={resize.onDoubleClick}
							position="absolute"
							top="0"
							bottom="0"
							left="-1"
							width="2"
							cursor="col-resize"
							touchAction="none"
							_hover={{ bg: "border" }}
							_focusVisible={{ boxShadow: "focus-ring", outline: "none" }}
							bg={resize.resizing ? "border-emphasized" : "transparent"}
						/>
					) : null}
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
						<Stack h="full" overflowY="auto" px="4" pt="4" pb="4" gap="3">
							{children}
						</Stack>
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
			{open && (
				<Stack pb="3" gap="2">
					{children}
				</Stack>
			)}
		</Box>
	);
};
ContextRailSection.displayName = "ContextRail.Section";
(ContextRailSection as unknown as { railSection: symbol }).railSection =
	RAIL_SECTION;

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
	Tabs: ContextRailTabs,
	Tab: ContextRailTab,
	Avatar: ContextRailAvatar,
	Divider: ContextRailDivider,
	IconButton: ContextRailIconButton,
	StatusIcon: ContextRailStatusIcon,
	ValueTile: ContextRailValueTile,
});
