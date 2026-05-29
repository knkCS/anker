import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface TabDirtyState {
	/** Returns true if a tab key has been marked dirty. */
	isTabDirty: (key: string) => boolean;
	/** Mark a tab key as dirty (true) or clean (false). */
	setTabDirty: (key: string, dirty: boolean) => void;
}

const Ctx = createContext<TabDirtyState>({
	isTabDirty: () => false,
	setTabDirty: () => undefined,
});

/**
 * Multi-key registry for per-tab dirty state. Mount at the layout level
 * of a tabbed detail page; have each tab's content publish its dirty
 * state via `setTabDirty(tabKey, isDirty)` and render `<DirtyDot
 * active={isTabDirty(tab.value)}/>` inside each `Tabs.Trigger`.
 *
 * The no-provider fallback returns clean state and a no-op setter so
 * consumers don't have to defensively check.
 */
export function TabDirtyProvider({ children }: { children: ReactNode }) {
	const [dirty, setDirty] = useState<Record<string, boolean>>({});

	const setTabDirty = useCallback((key: string, v: boolean) => {
		setDirty((prev) => (prev[key] === v ? prev : { ...prev, [key]: v }));
	}, []);

	const isTabDirty = useCallback(
		(key: string) => Boolean(dirty[key]),
		[dirty],
	);

	const value = useMemo<TabDirtyState>(
		() => ({ isTabDirty, setTabDirty }),
		[isTabDirty, setTabDirty],
	);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabDirty(): TabDirtyState {
	return useContext(Ctx);
}
