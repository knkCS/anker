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
export const RailModeContext = createContext<{ collapsed: boolean }>({
    collapsed: false,
});

/**
 * Hook used by rail atoms to read the rail's collapsed state. Returns
 * `{ collapsed: false }` when called outside a `<ContextRail>` Root —
 * atoms then render their expanded form.
 */
export function useContextRailMode(): { collapsed: boolean } {
    return useContext(RailModeContext);
}

/**
 * Sentinel placed on rail-atom component functions (e.g., ContextRail.IconButton)
 * so that `<ContextRail.Section>` can filter children in collapsed mode and
 * keep only the atom-tagged ones.
 */
export const RAIL_ATOM = Symbol.for("anker.contextRail.atom");

export function isRailAtom(child: React.ReactNode): boolean {
    if (!React.isValidElement(child)) return false;
    const type = child.type as { railAtom?: symbol } | string;
    return typeof type === "function" && type.railAtom === RAIL_ATOM;
}
