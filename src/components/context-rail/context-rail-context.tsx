// src/components/context-rail/context-rail-context.tsx
//
// Shared context primitives for <ContextRail>. Extracted into their own
// module so that atoms.tsx can import them without creating a circular
// dependency with context-rail.tsx.
import React, { createContext, useContext } from "react";

/**
 * Carries the rail's collapsed state to atom subcomponents. Atoms read this
 * to decide between their expanded and compact renderings. Provided by
 * `<ContextRail>`; defaults to `{ collapsed: false }` when used outside.
 */
export interface RailMode {
	collapsed: boolean;
	/**
	 * Expands the rail, exactly as the collapse toggle would (stored under
	 * the rail's `storageKey`). A no-op outside a `<ContextRail>` Root.
	 */
	expand: () => void;
}

export const RailModeContext = createContext<RailMode>({
	collapsed: false,
	expand: () => {},
});

/**
 * Hook used by rail atoms to read the rail's collapsed state. Returns
 * `{ collapsed: false }` when called outside a `<ContextRail>` Root —
 * atoms then render their expanded form.
 */
export function useContextRailMode(): RailMode {
	return useContext(RailModeContext);
}

/**
 * Sentinel placed on rail-atom component functions (e.g., ContextRail.IconButton)
 * so that `<ContextRail.Section>` can filter children in collapsed mode and
 * keep only the atom-tagged ones.
 */
export const RAIL_ATOM = Symbol.for("anker.contextRail.atom");

/**
 * Sentinel placed on `ContextRail.Section` so code that cannot import it
 * without a cycle (the tabs) can recognise a section among children.
 */
export const RAIL_SECTION = Symbol.for("anker.contextRail.section");

export function isRailAtom(child: React.ReactNode): boolean {
	if (!React.isValidElement(child)) return false;
	const type = child.type;
	if (typeof type !== "function") return false;
	return (type as { railAtom?: symbol }).railAtom === RAIL_ATOM;
}
