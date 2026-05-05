// src/templates/app-shell.tsx
//
// AppShell — top-level layout for authenticated knkCMS pages.
//
// Composition: a 3-column CSS grid with a fixed-width sidebar, a fluid main
// content column, and an optional fixed-width context rail.
//
//     ┌─────────┬───────────────────────────┬─────────┐
//     │         │                           │         │
//     │ sidebar │         children          │  rail   │
//     │         │  (page header / content)  │         │
//     │         │                           │         │
//     └─────────┴───────────────────────────┴─────────┘
//
// Slot mechanism
// --------------
// AppShell installs an external slot store on its descendants via context.
// Two named slots are exposed:
//
//   - "actions" — registered via `usePageActions(node)` — surfaced by page
//     templates inside their <PageHeader actions=…> slot.
//   - "rail"    — registered via `usePageRail(node)`    — surfaced by AppShell
//     as the content of the right rail column.
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

type SlotName = "actions" | "rail";

interface SlotStore {
	get(slot: SlotName): ReactNode;
	set(slot: SlotName, node: ReactNode): void;
	clear(slot: SlotName): void;
	subscribe(slot: SlotName, listener: () => void): () => void;
}

function createSlotStore(): SlotStore {
	const values: Record<SlotName, ReactNode> = {
		actions: null,
		rail: null,
	};
	const listeners: Record<SlotName, Set<() => void>> = {
		actions: new Set(),
		rail: new Set(),
	};

	function notify(slot: SlotName) {
		for (const listener of listeners[slot]) listener();
	}

	return {
		get(slot) {
			return values[slot];
		},
		set(slot, node) {
			if (values[slot] === node) return;
			values[slot] = node;
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
function useSlotValue(slot: SlotName): ReactNode {
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
 * Internal hook used by page templates to read the currently-registered
 * page-actions ReactNode. Page templates fall back to a locally-passed
 * `actions` prop when nothing is registered.
 */
export function useRegisteredPageActions(): ReactNode {
	return useSlotValue("actions");
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
	const railNode = useSlotValue("rail");

	// Precedence: registered rail content wins, fall back to the `rail` prop.
	// The rail column is enabled when *either* the consumer passed a `rail`
	// element *or* a descendant registered content via `usePageRail`.
	const renderedRail = railNode ?? rail;
	const showRailColumn =
		renderedRail !== undefined &&
		renderedRail !== null &&
		renderedRail !== false;

	return (
		<Grid
			data-testid="app-shell"
			data-rail={showRailColumn ? "true" : "false"}
			templateColumns={showRailColumn ? "auto 1fr auto" : "auto 1fr"}
			minH="100vh"
			bg="bg-canvas"
		>
			<Box gridColumn="1" minW="0">
				{sidebar}
			</Box>
			<Flex gridColumn="2" direction="column" minW="0" minH="100vh">
				{children}
			</Flex>
			{showRailColumn ? (
				<Box gridColumn="3" minW="0">
					{renderedRail}
				</Box>
			) : null}
		</Grid>
	);
}
AppShellInner.displayName = "AppShellInner";
