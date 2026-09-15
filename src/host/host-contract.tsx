// src/host/host-contract.tsx
//
// The host contract — what a host provides once and what every screen
// reports. Rationale: docs/adr/0003-host-owns-the-frame-anker-owns-the-contract.md
// (origin: knkcms/core ADR 0003).
//
// Three things flow through one context:
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
//   - **Identity** (host → screen). `HostIdentity` — the user id, the
//     workspace id, and a members accessor — provided once at the app root
//     and read through `useHostIdentity()` instead of arriving as props on
//     every mount.
//
// Outside any provider the reporting hooks are no-ops and the identity hook
// returns `emptyHostIdentity`, so stories and isolated tests keep working.

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
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
	children: ReactNode;
}

/**
 * Mount once, at the host's root. Descendant screens report their page
 * frame into `onFrameChange`, their side rail into `onRailChange`, and read `identity` through `useHostIdentity()`.
 */
export function HostProvider({
	identity,
	onFrameChange,
	onRailChange,
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
	const resolvedIdentity = identity ?? parent?.identity ?? emptyHostIdentity;
	const value = useMemo<HostContextValue>(
		() => ({
			identity: resolvedIdentity,
			reportFrame: (frame) => frameSink.current?.(frame),
			reportRail: (rail) => railSink.current?.(rail),
		}),
		[resolvedIdentity],
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
