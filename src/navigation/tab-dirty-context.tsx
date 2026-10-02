import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

export interface TabDirtyState {
	/** Returns true if a tab key has been marked dirty. */
	isTabDirty: (key: string) => boolean;
	/** Mark a tab key as dirty (true) or clean (false). */
	setTabDirty: (key: string, dirty: boolean) => void;
	/**
	 * The keys of every dirty tab, in the order they became dirty. Feeds the
	 * page header's one Save ("Save · 2 tabs changed") and the leave-page
	 * guard (`dirtyTabs.length > 0`). Stable reference while nothing changes.
	 */
	dirtyTabs: readonly string[];
}

const NO_DIRTY_TABS: readonly string[] = Object.freeze([]);

const Ctx = createContext<TabDirtyState>({
	isTabDirty: () => false,
	setTabDirty: () => undefined,
	dirtyTabs: NO_DIRTY_TABS,
});

/**
 * Multi-key registry for per-tab dirty state. Mount at the layout level
 * of a tabbed detail page; have each tab's content publish its dirty
 * state via `setTabDirty(tabKey, isDirty)` and render `<DirtyDot
 * active={isTabDirty(tab.value)}/>` inside each `Tabs.Trigger`.
 *
 * Mount it *above* the component that renders the page template, so the
 * header's one Save can read `dirtyTabs` and close over it — a reported
 * header action renders outside the screen's providers (ADR 0004).
 *
 * The no-provider fallback returns clean state and a no-op setter so
 * consumers don't have to defensively check.
 */
export function TabDirtyProvider({ children }: { children: ReactNode }) {
	const [dirtyTabs, setDirtyTabs] = useState<readonly string[]>(NO_DIRTY_TABS);

	const setTabDirty = useCallback((key: string, v: boolean) => {
		setDirtyTabs((prev) => {
			if (prev.includes(key) === v) return prev;
			return v ? [...prev, key] : prev.filter((k) => k !== key);
		});
	}, []);

	const isTabDirty = useCallback(
		(key: string) => dirtyTabs.includes(key),
		[dirtyTabs],
	);

	const value = useMemo<TabDirtyState>(
		() => ({ isTabDirty, setTabDirty, dirtyTabs }),
		[isTabDirty, setTabDirty, dirtyTabs],
	);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabDirty(): TabDirtyState {
	return useContext(Ctx);
}
