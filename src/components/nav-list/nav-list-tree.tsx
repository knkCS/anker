// src/components/nav-list/nav-list-tree.tsx
//
// The tree half of NavList: which nesting level an item sits at, whether any
// sibling at that level is expandable (so leaf labels line up with parent
// labels), and how a child hands focus back to its parent.
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

/** One nesting level of NavList items: a Group, or a parent's child list. */
export interface NavListTreeLevel {
	/** 0 for a Group's own items, 1 for their children, … */
	depth: number;
	/** True once any item at this level holds child items. */
	hasParents: boolean;
	/** An expandable item calls this while mounted; returns the cleanup. */
	registerParent: () => () => void;
	/** Moves focus to the parent of this level's items; absent at depth 0. */
	focusParent?: () => void;
}

const noop = () => () => {};

const NavListTreeContext = createContext<NavListTreeLevel>({
	depth: 0,
	hasParents: false,
	registerParent: noop,
});

export function useNavListTreeLevel(): NavListTreeLevel {
	return useContext(NavListTreeContext);
}

export interface NavListTreeLevelProviderProps {
	depth: number;
	focusParent?: () => void;
	children: ReactNode;
}

/** Opens a nesting level; its items register whether they are parents. */
export function NavListTreeLevelProvider({
	depth,
	focusParent,
	children,
}: NavListTreeLevelProviderProps) {
	const [parents, setParents] = useState(0);
	const registerParent = useCallback(() => {
		setParents((n) => n + 1);
		return () => setParents((n) => n - 1);
	}, []);
	const value = useMemo(
		() => ({ depth, hasParents: parents > 0, registerParent, focusParent }),
		[depth, parents, registerParent, focusParent],
	);
	return (
		<NavListTreeContext.Provider value={value}>
			{children}
		</NavListTreeContext.Provider>
	);
}

/** Marks an item's label element. */
export const LABEL_ATTR = "data-nav-list-label";
/** Marks an item's outermost row: a leaf's label, or a parent's row wrapper. */
export const ROW_ATTR = "data-nav-list-row";
/** Marks a parent's chevron. */
export const TOGGLE_ATTR = "data-nav-list-toggle";

/**
 * Focuses an item by its row: its label, or its chevron when the label
 * cannot take focus (a plain, non-`asChild` row).
 */
export function focusItemRow(row: HTMLElement | null) {
	if (!row) return;
	const candidates = row.hasAttribute(LABEL_ATTR)
		? [row]
		: [
				row.querySelector<HTMLElement>(`[${LABEL_ATTR}]`),
				row.querySelector<HTMLElement>(`[${TOGGLE_ATTR}]`),
			];
	for (const el of candidates) {
		if (!el) continue;
		el.focus();
		if (row.ownerDocument.activeElement === el) return;
	}
}
