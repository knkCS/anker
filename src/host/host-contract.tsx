// src/host/host-contract.tsx
//
// The host contract — what a host provides once and what every screen
// reports. Rationale: docs/adr/0003-host-owns-the-frame-anker-owns-the-contract.md
// (origin: knkcms/core ADR 0003).
//
// Four things flow through one context:
//
//   - **Page frame** (screen → host). A screen built on anker's page
//     templates calls `usePageFrame(frame)` with structured state — title,
//     subtitle, eyebrow, breadcrumbs, avatar, badges, meta, tabs, actions —
//     that mirrors `<PageHeader>`'s props. The host renders that state in
//     its own page frame however it likes; anker's `<AppShell>` renders it
//     as a `<PageHeader>` band, so a screen behaves identically under its
//     standalone shell and under a foreign host.
//   - **Side rail** (screen → host). A screen calls `usePageRail(node)`
//     with the content of its side rail — status tiles, activity, secondary
//     actions. The rail is not part of `PageFrame` (which mirrors the page
//     header exactly); it travels on its own channel of the same contract.
//     The host renders it wherever its layout puts rails; `<AppShell>`
//     renders it in its rail column.
//   - **Screen actions** (screen → host). A screen calls
//     `useScreenActions(actions)` with the actions that belong to it — plain
//     data (`ScreenAction`: id, label, icon, shortcut, permission predicate,
//     and a handler or a route), not markup, so a host draws them in its own
//     controls. odon-ui's `HostSidebar` shows them as "On this page". The
//     host reads them with `useReportedScreenActions()` anywhere under the
//     same provider, or receives them through `onActionsChange`.
//   - **Identity** (host → screen). `HostIdentity` — the user id, the
//     workspace id, and a members accessor — provided once at the app root
//     and read through `useHostIdentity()` instead of arriving as props on
//     every mount.
//
// Outside any provider the reporting hooks are no-ops, the identity hook
// returns `emptyHostIdentity` and `useReportedScreenActions()` returns an
// empty list, so stories and isolated tests keep working.

import {
	createContext,
	isValidElement,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";

// ---------------------------------------------------------------------------
// Page frame
// ---------------------------------------------------------------------------

/** One crumb of a page frame's breadcrumb trail. Mirrors `PageHeaderBreadcrumb`. */
export interface PageFrameBreadcrumb {
	label: string;
	/** Link target. The last crumb is conventionally a plain label. */
	to?: string;
}

/**
 * The structured page-frame state a screen reports. It mirrors
 * `PageHeaderProps` one-to-one (pinned by `page-frame.mirror.test.ts`), so a
 * host can spread it straight into `<PageHeader>` — as `<AppShell>` does — or
 * read the fields into a header of its own.
 *
 * `actions`, `avatar`, `badges`, `meta` and `tabs` are opaque `ReactNode`s:
 * the screen owns what an action *is*; the host owns only where it goes.
 */
export interface PageFrame {
	/** Breadcrumb trail to the current page. */
	breadcrumbs?: PageFrameBreadcrumb[];
	/** Page or entity title. The one required field. */
	title: ReactNode;
	subtitle?: ReactNode;
	/** Small uppercase label above the title. */
	eyebrow?: ReactNode;
	/** Page-level actions — buttons, menus. Rendered by the host as given. */
	actions?: ReactNode;
	/** Entity avatar for the detail row. */
	avatar?: ReactNode;
	/** Badges shown inline next to the title. */
	badges?: ReactNode;
	/** Secondary meta line below the title. */
	meta?: ReactNode;
	/** Tab strip (nav-link tabs) for the third header row. */
	tabs?: ReactNode;
	/**
	 * Presentation hint: keep the frame pinned to the top while the body
	 * scrolls. `<AppShell>` honours it; a host may ignore it. @default true
	 */
	sticky?: boolean;
}

/** The host's frame sink: the current frame, or `null` once no screen reports. */
export type PageFrameSink = (frame: PageFrame | null) => void;

/**
 * The host's rail sink: the current rail node, or `null` once no screen
 * reports one.
 */
export type PageRailSink = (rail: ReactNode) => void;

// ---------------------------------------------------------------------------
// Screen actions
// ---------------------------------------------------------------------------

/** What every screen action carries, whichever way it runs. */
export interface ScreenActionBase {
	/**
	 * Stable within the screen's report — a host keys its controls by it, and
	 * a later command palette or shortcut binding may refer to it.
	 */
	id: string;
	/** What the host shows, e.g. "New task". */
	label: string;
	/**
	 * Leading icon, as anker's other icon props take one (`<Plus size={16} />`).
	 * The host may draw it at another size or leave it out.
	 */
	icon?: ReactNode;
	/**
	 * The key combination as shown next to the label, e.g. `"N"` or
	 * `"⇧ ⌘ N"`. A display label: the contract binds no key.
	 */
	shortcut?: string;
	/**
	 * Permission predicate. Absent means allowed; a host leaves out — does not
	 * disable — an action whose predicate returns `false`, and evaluates it
	 * whenever it draws.
	 */
	isAllowed?: () => boolean;
}

/** An action that runs a handler. */
export interface ScreenHandlerAction extends ScreenActionBase {
	onSelect: () => void;
	to?: never;
}

/** An action that navigates. The host follows the route with its own router. */
export interface ScreenRouteAction extends ScreenActionBase {
	to: string;
	onSelect?: never;
}

/**
 * An action that belongs to the current screen, reported through
 * `useScreenActions`. Plain data, not markup: the host decides how it is
 * drawn (odon-ui's `HostSidebar`: the "On this page" group of "+ New").
 * Either a handler (`onSelect`) or a route (`to`), never both.
 */
export type ScreenAction = ScreenHandlerAction | ScreenRouteAction;

/**
 * The host's actions sink: the current screen's actions, `[]` once no
 * screen reports any.
 */
export type ScreenActionsSink = (actions: readonly ScreenAction[]) => void;

const NO_ACTIONS: readonly ScreenAction[] = Object.freeze([]);

/** The provider's store of the last reported actions, read by `useReportedScreenActions`. */
interface ScreenActionsStore {
	get(): readonly ScreenAction[];
	set(actions: readonly ScreenAction[]): void;
	subscribe(listener: () => void): () => void;
}

function createScreenActionsStore(): ScreenActionsStore {
	let current = NO_ACTIONS;
	const listeners = new Set<() => void>();
	return {
		get: () => current,
		set: (next) => {
			current = next;
			for (const listener of listeners) listener();
		},
		subscribe: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}

const emptyScreenActionsStore: ScreenActionsStore = {
	get: () => NO_ACTIONS,
	set: () => undefined,
	subscribe: () => () => undefined,
};

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** One member of the current workspace, as the host knows them. */
export interface HostMember {
	/** The user's id — the same id `HostIdentity.userId` carries for the viewer. */
	userId: string;
	displayName: string;
	email?: string;
}

/** Read access to the workspace's members. Synchronous: the host fetches, the screen reads. */
export interface HostMembers {
	list(): readonly HostMember[];
	/** Lookup by user id. `undefined` when the id is not a member. */
	byId(userId: string): HostMember | undefined;
}

/** Who the viewer is, provided once by the host. */
export interface HostIdentity {
	/** The viewer's user id (the odon subject). Empty string when unknown. */
	userId: string;
	/** The active workspace's id. Empty string when unknown. */
	workspaceId: string;
	members: HostMembers;
}

/** Build a `HostMembers` accessor from a plain list. */
export function createHostMembers(members: readonly HostMember[]): HostMembers {
	const byId = new Map(members.map((m) => [m.userId, m] as const));
	return {
		list: () => members,
		byId: (userId) => byId.get(userId),
	};
}

/**
 * What `useHostIdentity()` returns outside any provider: empty ids and an
 * empty members list. A screen compares against `userId` and gets no match;
 * it never has to null-check.
 */
export const emptyHostIdentity: HostIdentity = Object.freeze({
	userId: "",
	workspaceId: "",
	members: createHostMembers([]),
});

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface HostContextValue {
	identity: HostIdentity;
	reportFrame: PageFrameSink;
	reportRail: PageRailSink;
	reportActions: ScreenActionsSink;
	actions: ScreenActionsStore;
}

const HostContext = createContext<HostContextValue | null>(null);

export interface HostProviderProps {
	/**
	 * The viewer's identity. Omit it in a nested provider to inherit the
	 * parent's (a standalone `<AppShell>` inside a host that already provides
	 * identity must not shadow it). Falls back to `emptyHostIdentity` at the
	 * root.
	 */
	identity?: HostIdentity;
	/**
	 * Receives every frame a descendant screen reports, and `null` when the
	 * reporting screen unmounts. Keep the state it feeds in a component that
	 * receives the screens as `children`, so storing the frame does not
	 * re-create the screen tree.
	 */
	onFrameChange?: PageFrameSink;
	/**
	 * Receives every side-rail node a descendant screen reports through
	 * `usePageRail`, and `null` when the reporting screen unmounts. The same
	 * state-placement rule as `onFrameChange` applies.
	 */
	onRailChange?: PageRailSink;
	/**
	 * Receives the actions a descendant screen reports through
	 * `useScreenActions`, and `[]` when the reporting screen unmounts. Optional:
	 * a host can instead read them with `useReportedScreenActions()` anywhere
	 * under this provider.
	 */
	onActionsChange?: ScreenActionsSink;
	children: ReactNode;
}

/**
 * Mount once, at the host's root. Descendant screens report their page
 * frame into `onFrameChange`, their side rail into `onRailChange`, their
 * actions into `onActionsChange` (and to `useReportedScreenActions()` under
 * this provider), and read `identity` through `useHostIdentity()`.
 */
export function HostProvider({
	identity,
	onFrameChange,
	onRailChange,
	onActionsChange,
	children,
}: HostProviderProps) {
	const parent = useContext(HostContext);
	// The sinks are read through refs so an inline `onFrameChange` arrow does
	// not change the context value — and therefore does not re-run every
	// reporting screen's effect — on each host render.
	const frameSink = useRef<PageFrameSink | undefined>(onFrameChange);
	frameSink.current = onFrameChange;
	const railSink = useRef<PageRailSink | undefined>(onRailChange);
	railSink.current = onRailChange;
	const actionsSink = useRef<ScreenActionsSink | undefined>(onActionsChange);
	actionsSink.current = onActionsChange;
	// One store for the provider's lifetime: a report notifies only the
	// components reading it, never the screen tree.
	const [actions] = useState(createScreenActionsStore);
	const resolvedIdentity = identity ?? parent?.identity ?? emptyHostIdentity;
	const value = useMemo<HostContextValue>(
		() => ({
			identity: resolvedIdentity,
			reportFrame: (frame) => frameSink.current?.(frame),
			reportRail: (rail) => railSink.current?.(rail),
			reportActions: (next) => {
				actions.set(next);
				actionsSink.current?.(next);
			},
			actions,
		}),
		[resolvedIdentity, actions],
	);
	return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}
HostProvider.displayName = "HostProvider";

/**
 * Read the host's `HostIdentity`. Returns `emptyHostIdentity` outside any
 * provider.
 */
export function useHostIdentity(): HostIdentity {
	return useContext(HostContext)?.identity ?? emptyHostIdentity;
}

function sameBreadcrumbs(
	a: PageFrameBreadcrumb[] | undefined,
	b: PageFrameBreadcrumb[] | undefined,
): boolean {
	if (a === b) return true;
	if (!a || !b || a.length !== b.length) return false;
	return a.every((c, i) => c.label === b[i].label && c.to === b[i].to);
}

// Every field compared by identity. A `Record` over `PageFrame`'s keys, so a
// field added to `PageFrame` and forgotten here is a type error rather than a
// frame change that silently never reaches the host.
const IDENTITY_COMPARED: Record<
	Exclude<keyof PageFrame, "breadcrumbs">,
	true
> = {
	title: true,
	subtitle: true,
	eyebrow: true,
	actions: true,
	avatar: true,
	badges: true,
	meta: true,
	tabs: true,
	sticky: true,
};
const FRAME_KEYS = Object.keys(IDENTITY_COMPARED) as Array<
	keyof typeof IDENTITY_COMPARED
>;

/**
 * Shallow frame equality: primitives and nodes by identity, breadcrumbs by
 * value. A body re-render that rebuilds the same strings must not reach
 * the host; a frame carrying a fresh element does (a node is opaque and
 * a host must re-render it).
 */
function isSameFrame(a: PageFrame | null, b: PageFrame): boolean {
	if (a === null) return false;
	if (a === b) return true;
	return (
		FRAME_KEYS.every((key) => Object.is(a[key], b[key])) &&
		sameBreadcrumbs(a.breadcrumbs, b.breadcrumbs)
	);
}

/**
 * Report the screen's page frame to the host. Call it once per screen with
 * the structured state; the host renders it. Re-reports when a value
 * changes and reports `null` on unmount. A no-op outside any provider.
 *
 * Only one screen should report at a time — the most recent report wins and
 * any reporting screen's unmount clears the frame — the same rule the
 * `usePageActions` slot follows.
 */
export function usePageFrame(frame: PageFrame): void {
	const ctx = useContext(HostContext);
	const reported = useRef<PageFrame | null>(null);
	useEffect(() => {
		if (!ctx) return;
		if (isSameFrame(reported.current, frame)) return;
		reported.current = frame;
		ctx.reportFrame(frame);
	});
	useEffect(() => {
		if (!ctx) return;
		return () => {
			reported.current = null;
			ctx.reportFrame(null);
		};
	}, [ctx]);
}

/**
 * Report the screen's side rail to the host — status tiles, activity,
 * secondary actions. The host renders the node wherever its layout puts
 * rails; `<AppShell>` renders it in its rail column, where it wins over the
 * shell's `rail` prop. Re-reports when the node changes (by identity) and
 * reports `null` on unmount. A no-op outside any provider.
 *
 * The host draws the node outside the screen's own providers: it must not
 * read screen-local context (a form context, a provider the screen mounts).
 * Close over the state it needs, or pass handlers.
 *
 * Only one screen should report at a time — the most recent report wins and
 * any reporting screen's unmount clears the rail.
 */
export function usePageRail(content: ReactNode): void {
	const ctx = useContext(HostContext);
	const reported = useRef<{ node: ReactNode } | null>(null);
	useEffect(() => {
		if (!ctx) return;
		if (reported.current && Object.is(reported.current.node, content)) return;
		reported.current = { node: content };
		ctx.reportRail(content);
	});
	useEffect(() => {
		if (!ctx) return;
		return () => {
			reported.current = null;
			ctx.reportRail(null);
		};
	}, [ctx]);
}

/**
 * Element equality one level deep: same type, same key, props equal by
 * identity. `<Plus size={16} />` rebuilt on every render is the same icon;
 * anything else is compared by identity.
 */
function sameNode(a: ReactNode, b: ReactNode): boolean {
	if (Object.is(a, b)) return true;
	if (!isValidElement(a) || !isValidElement(b)) return false;
	if (a.type !== b.type || a.key !== b.key) return false;
	const pa = a.props as Record<string, unknown>;
	const pb = b.props as Record<string, unknown>;
	const keys = Object.keys(pa);
	return (
		keys.length === Object.keys(pb).length &&
		keys.every((k) => Object.hasOwn(pb, k) && Object.is(pa[k], pb[k]))
	);
}

/**
 * Whether two reports would draw and behave the same. A handler is not
 * compared — the reported action calls the screen's latest one — only
 * whether there is one; the predicate is, by identity, so a screen whose
 * permissions changed reaches the host.
 */
function sameActions(
	a: readonly ScreenAction[],
	b: readonly ScreenAction[],
): boolean {
	if (a === b) return true;
	if (a.length !== b.length) return false;
	return a.every((x, i) => {
		const y = b[i];
		return (
			x.id === y.id &&
			x.label === y.label &&
			x.shortcut === y.shortcut &&
			x.to === y.to &&
			(typeof x.onSelect === "function") ===
				(typeof y.onSelect === "function") &&
			Object.is(x.isAllowed, y.isAllowed) &&
			sameNode(x.icon, y.icon)
		);
	});
}

/**
 * Report the actions that belong to the screen — what odon-ui's
 * `HostSidebar` shows as "On this page". Plain data: the host draws them in
 * its own controls and leaves out any whose `isAllowed()` returns `false`.
 * Re-reports when an action's data changes (a fresh `onSelect` alone is not a
 * change: the reported action always calls the screen's latest handler) and
 * reports `[]` on unmount. A no-op outside any provider.
 *
 * Only one screen should report at a time — the most recent report wins and
 * any reporting screen's unmount clears the actions, as with the frame and
 * the rail. A screen with no actions of its own does not call it.
 */
export function useScreenActions(actions: readonly ScreenAction[]): void {
	const ctx = useContext(HostContext);
	const latest = useRef(actions);
	const reported = useRef<readonly ScreenAction[] | null>(null);
	useEffect(() => {
		if (!ctx) return;
		latest.current = actions;
		if (reported.current && sameActions(reported.current, actions)) return;
		reported.current = actions;
		ctx.reportActions(
			actions.map((action, index): ScreenAction => {
				if (typeof action.to === "string") return { ...action };
				return {
					...action,
					// Positions match until the next report (`sameActions`), so
					// index into the latest list to run the latest handler.
					onSelect: () => latest.current[index]?.onSelect?.(),
				};
			}),
		);
	});
	useEffect(() => {
		if (!ctx) return;
		return () => {
			reported.current = null;
			ctx.reportActions(NO_ACTIONS);
		};
	}, [ctx]);
}

/**
 * Read the actions the current screen reports — for the host's own controls
 * (odon-ui's `HostSidebar`), from anywhere under the provider that captures
 * them; a sidebar passed to `<AppShell>` is. Exactly the current screen's
 * actions, `[]` while no screen reports any or outside any provider. Not
 * filtered: honour each action's `isAllowed` when drawing. Re-renders only
 * the reading component when the report changes.
 */
export function useReportedScreenActions(): readonly ScreenAction[] {
	const store = useContext(HostContext)?.actions ?? emptyScreenActionsStore;
	return useSyncExternalStore(store.subscribe, store.get, store.get);
}
