// src/templates/app-shell.tsx
//
// AppShell — top-level layout for authenticated knkCMS pages.
//
// Composition: a 3-column × 2-row CSS grid. The sidebar spans the full
// height on the left. The page header band (when registered) spans the
// main + rail columns across row 1. The main content sits in row 2
// column 2; the optional context rail sits in row 2 column 3, beginning
// below the header band.
//
//     ┌─────────┬───────────────────────────────────┐
//     │         │   page header band                │
//     │         │   ┌ breadcrumb ─────────────────┐ │
//     │         │   ┌ detail (avatar/title/etc.) ─┐ │
//     │         │   ┌ tabs (optional) ────────────┐ │
//     │         ├───────────────────────┬───────────┤
//     │ sidebar │       children        │   rail    │
//     │         │   (body / cards / …)  │           │
//     │         │                       │           │
//     └─────────┴───────────────────────┴───────────┘
//
// Slot mechanism
// --------------
// AppShell installs an external slot store on its descendants via context.
// Three named slots are exposed:
//
//   - "actions" — registered via `usePageActions(node)` — surfaced by page
//     templates inside their <PageHeader actions=…> slot.
//   - "header"  — registered via `usePageHeader(node)`  — surfaced by
//     AppShell as the content of grid row 1 (spanning the main + rail
//     columns). Page templates push their <PageHeader> here.
//   - "rail"    — registered via `usePageRail(node)`    — surfaced by
//     AppShell as the content of the right rail column (row 2 column 3).
//
// The store uses `useSyncExternalStore` so that producers (deep child
// components rendered after the consumer) and consumers (AppShell, the page
// templates) stay decoupled. A naive `useState`-based context would force the
// consumer to render in the same React commit as the producer, which causes
// the actions/rail to flicker on route changes (the Path-B fix originally
// shipped in odon as PR #115). The external-store pattern lets the producer
// register its content in a `useEffect`, the consumer re-reads on the next
// browser frame, and React's concurrent renderer is happy.

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";
import { Box, Flex, Grid } from "../primitives/layout";

type SlotName = "actions" | "header" | "rail";

interface HeaderSlotValue {
	node: ReactNode;
	sticky: boolean;
}

interface SlotStore {
	get(slot: SlotName): unknown;
	set(slot: SlotName, value: unknown): void;
	clear(slot: SlotName): void;
	subscribe(slot: SlotName, listener: () => void): () => void;
}

function createSlotStore(): SlotStore {
	const values: Record<SlotName, unknown> = {
		actions: null,
		header: null,
		rail: null,
	};
	const listeners: Record<SlotName, Set<() => void>> = {
		actions: new Set(),
		header: new Set(),
		rail: new Set(),
	};

	function notify(slot: SlotName) {
		for (const listener of listeners[slot]) listener();
	}

	return {
		get(slot) {
			return values[slot];
		},
		set(slot, value) {
			if (values[slot] === value) return;
			values[slot] = value;
			notify(slot);
		},
		clear(slot) {
			if (values[slot] === null) return;
			values[slot] = null;
			notify(slot);
		},
		subscribe(slot, listener) {
			listeners[slot].add(listener);
			return () => {
				listeners[slot].delete(listener);
			};
		},
	};
}

const SlotStoreContext = createContext<SlotStore | null>(null);

/**
 * Read-side hook used internally by AppShell and the page templates to
 * subscribe to a named slot's currently-registered ReactNode. Returns `null`
 * when no producer has registered content (or when called outside an AppShell).
 */
function useSlotValue(slot: SlotName): unknown {
	const store = useContext(SlotStoreContext);
	const subscribe = useCallback(
		(listener: () => void) => {
			if (!store) return () => undefined;
			return store.subscribe(slot, listener);
		},
		[store, slot],
	);
	const getSnapshot = useCallback(() => {
		if (!store) return null;
		return store.get(slot);
	}, [store, slot]);
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Register page-action content (typically buttons rendered to the right of
 * the page title) from any descendant of `<AppShell>`. The content is
 * surfaced by the active page template inside its `<PageHeader>` actions
 * slot.
 *
 * Pass `null` (or omit) to clear the registration. The hook is a no-op when
 * called outside an AppShell, which keeps it safe to use in stories and
 * isolated component tests.
 */
export function usePageActions(content: ReactNode): void {
	const store = useContext(SlotStoreContext);
	// Stash the most recent content in a ref so the effect can run on every
	// render without forcing a fresh effect-cleanup cycle for unstable nodes.
	const latest = useRef<ReactNode>(content);
	latest.current = content;
	useEffect(() => {
		if (!store) return;
		store.set("actions", latest.current);
		return () => {
			store.clear("actions");
		};
	}, [store]);
	// Re-register on every change of `content` (effect above only runs once
	// per mount; this second effect re-pushes the latest value).
	useEffect(() => {
		if (!store) return;
		store.set("actions", content);
	}, [store, content]);
}

/**
 * Register context-rail content from any descendant of `<AppShell>`. The
 * content is rendered in the rail column (assuming the AppShell has a rail
 * slot enabled).
 *
 * Pass `null` (or omit) to clear the registration. The hook is a no-op when
 * called outside an AppShell.
 */
export function usePageRail(content: ReactNode): void {
	const store = useContext(SlotStoreContext);
	const latest = useRef<ReactNode>(content);
	latest.current = content;
	useEffect(() => {
		if (!store) return;
		store.set("rail", latest.current);
		return () => {
			store.clear("rail");
		};
	}, [store]);
	useEffect(() => {
		if (!store) return;
		store.set("rail", content);
	}, [store, content]);
}

/**
 * Register page-header content (typically a <PageHeader>) from any descendant
 * of `<AppShell>`. The content is rendered by AppShell in grid row 1, spanning
 * the main column and the rail column (when present).
 *
 * Pass `options.sticky === false` to opt out of the default sticky behaviour
 * for the specific page. The hook is a no-op when called outside an AppShell.
 */
export function usePageHeader(
	content: ReactNode,
	options?: { sticky?: boolean },
): void {
	const store = useContext(SlotStoreContext);
	const sticky = options?.sticky ?? true;
	const value: HeaderSlotValue = { node: content, sticky };
	const latest = useRef<HeaderSlotValue>(value);
	latest.current = value;
	useEffect(() => {
		if (!store) return;
		store.set("header", latest.current);
		return () => {
			store.clear("header");
		};
	}, [store]);
	useEffect(() => {
		if (!store) return;
		store.set("header", { node: content, sticky });
	}, [store, content, sticky]);
}

/**
 * Internal hook used by page templates to read the currently-registered
 * page-actions ReactNode. Page templates fall back to a locally-passed
 * `actions` prop when nothing is registered.
 */
export function useRegisteredPageActions(): ReactNode {
	return useSlotValue("actions") as ReactNode;
}

export interface AppShellProps {
	/**
	 * Sidebar element — the navigation column. Required. Typically an instance
	 * of `<Sidebar>` from `@knkcs/anker/components`. AppShell does not own the
	 * sidebar's collapsed-state — pass it through the Sidebar's own props.
	 */
	sidebar: ReactNode;
	/**
	 * Context rail element. Acts as a *fallback* for the rail column: it
	 * renders when no descendant has registered rail content via
	 * `usePageRail`. Registered content always wins over the prop.
	 *
	 * The rail column is enabled — and a grid track is reserved — when *either*
	 * a `rail` prop is supplied *or* a descendant has registered rail content.
	 * Omit both (or pass `null`) to drop the rail column entirely.
	 */
	rail?: ReactNode;
	/** Page content. */
	children: ReactNode;
}

/**
 * AppShell is the top-level layout for authenticated knkCMS pages. It owns
 * the slot context that powers `usePageActions` and `usePageRail`, and
 * arranges sidebar / main / rail in a 3-column CSS grid.
 *
 * AppShell is layout-only — it does not render a PageHeader, and it does not
 * inject any business chrome. Pages compose `<IndexPageTemplate>`,
 * `<DetailPageTemplate>`, etc. inside `children`.
 *
 * Rail precedence: content registered by a descendant via `usePageRail` wins
 * over the static `rail` prop. The prop is the fallback when no descendant
 * has registered content. Rationale: a descendant explicitly registering
 * content is signaling "show this here", which should trump the static prop.
 */
export function AppShell({ sidebar, rail, children }: AppShellProps) {
	// AppShell is split into an outer Provider and an inner Renderer so the
	// renderer's `useContext(SlotStoreContext)` resolves to *our* store rather
	// than the parent context. (A naive single component that both provides
	// and consumes the context at the same level reads the parent context —
	// the Provider only takes effect for descendants.)
	const store = useMemo(() => createSlotStore(), []);
	return (
		<SlotStoreContext.Provider value={store}>
			<AppShellInner sidebar={sidebar} rail={rail}>
				{children}
			</AppShellInner>
		</SlotStoreContext.Provider>
	);
}
AppShell.displayName = "AppShell";

function AppShellInner({ sidebar, rail, children }: AppShellProps) {
	const railNode = useSlotValue("rail") as ReactNode;
	const headerSlot = useSlotValue("header") as HeaderSlotValue | null;

	const headerNode: ReactNode = headerSlot?.node ?? null;
	const headerSticky = headerSlot?.sticky ?? true;

	const renderedRail = railNode ?? rail;
	const showRailColumn =
		renderedRail !== undefined &&
		renderedRail !== null &&
		renderedRail !== false;
	const showHeaderRow = headerNode !== null && headerNode !== undefined;

	return (
		<Grid
			data-testid="app-shell"
			data-rail={showRailColumn ? "true" : "false"}
			data-header={showHeaderRow ? "true" : "false"}
			templateColumns={showRailColumn ? "auto 1fr auto" : "auto 1fr"}
			templateRows="auto 1fr"
			h="100vh"
			overflow="hidden"
			bg="bg-canvas"
		>
			<Box
				data-testid="app-shell-sidebar"
				gridColumn="1"
				gridRow="1 / 3"
				minW="0"
				// One above Chakra's `docked` (10) so the Sidebar's collapse
				// toggle — positioned with `right: -3.5` to protrude into the
				// next column — renders above the sticky page-header band.
				zIndex={11}
			>
				{sidebar}
			</Box>
			{showHeaderRow ? (
				<Box
					data-testid="app-shell-header"
					data-sticky-header={headerSticky ? "true" : "false"}
					gridColumn={showRailColumn ? "2 / 4" : "2 / 3"}
					gridRow="1"
					minW="0"
					position={headerSticky ? "sticky" : undefined}
					top={headerSticky ? "0" : undefined}
					zIndex={headerSticky ? "docked" : undefined}
				>
					{headerNode}
				</Box>
			) : null}
			<Flex
				data-testid="app-shell-main"
				gridColumn="2"
				gridRow="2"
				direction="column"
				minW="0"
				minH="0"
				overflowY="auto"
				bg="bg-canvas"
				borderLeftWidth="1px"
				borderColor="border"
			>
				{children}
			</Flex>
			{showRailColumn ? (
				<Box
					data-testid="app-shell-rail"
					gridColumn="3"
					gridRow="2"
					minW="0"
					minH="0"
					overflowY="auto"
					bg="bg-surface"
					borderLeftWidth="1px"
					borderColor="border"
				>
					{renderedRail}
				</Box>
			) : null}
		</Grid>
	);
}
AppShellInner.displayName = "AppShellInner";
