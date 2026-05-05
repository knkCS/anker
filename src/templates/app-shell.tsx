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
	 * Context rail element. Pass an instance of `<ContextRail>` to enable the
	 * rail column. Pass `null` (or omit) to disable the column entirely (no
	 * grid track is reserved). Pages can still register rail content via
	 * `usePageRail` — when the rail column is disabled, registered content is
	 * dropped silently.
	 *
	 * Tip: pass an _empty_ `<ContextRail>` if you want the column to exist
	 * (so child pages can populate it via `usePageRail`) without rendering
	 * any default content.
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
 */
export function AppShell({ sidebar, rail, children }: AppShellProps) {
	const store = useMemo(() => createSlotStore(), []);
	const railNode = useSlotValue("rail");

	// The rail column is enabled when the consumer passed a `rail` element.
	// We use the consumer-supplied element as a *container* for the
	// dynamically-registered rail content: anything registered via
	// `usePageRail` is appended into that container at render time. This
	// keeps the framing chrome (collapse toggle, scrolling, borders) under
	// the consumer's control while letting pages contribute body content.
	//
	// Implementation note: we render `rail` as-is and tee its `children`
	// across (a) whatever the consumer passed and (b) whatever a page
	// registered via `usePageRail`. The simplest, escape-hatch-friendly
	// behavior is: if a page has registered rail content, render that;
	// otherwise render the consumer's `rail` as-is. Consumers that want
	// "default + page-specific" content can wire that themselves.
	const showRailColumn = rail !== undefined && rail !== null;
	const renderedRail = railNode ?? rail;

	return (
		<SlotStoreContext.Provider value={store}>
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
		</SlotStoreContext.Provider>
	);
}
AppShell.displayName = "AppShell";
