// src/components/nav-list/nav-list-context.tsx
import { createContext, useContext } from "react";

export interface NavListMode {
	/** When true, NavList items render icon-only with tooltips. */
	collapsed: boolean;
}

const NavListModeContext = createContext<NavListMode | null>(null);

export const NavListModeProvider = NavListModeContext.Provider;

/**
 * Read the collapsed mode published by the nearest parent
 * (Sidebar, SubNavLayout, etc.). Returns `{ collapsed: false }`
 * when no provider is present — NavList is usable standalone.
 */
export function useNavListMode(): NavListMode {
	return useContext(NavListModeContext) ?? { collapsed: false };
}
