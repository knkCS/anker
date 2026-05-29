import type { Blocker, Location } from "react-router-dom";
import { useBlocker } from "react-router-dom";

export interface UnsavedChangesBlockerOptions {
	/**
	 * Pathname prefix considered "safe" — navigation to a path starting with
	 * this prefix does NOT trigger the block. Use for sibling tabs of the
	 * same detail page (e.g. `/foo/bar/${id}/`). Trailing slash matters.
	 */
	safePathPrefix?: string;
	/**
	 * Custom predicate. Receives react-router's blocker args. Takes
	 * precedence over `safePathPrefix`. Default: block iff
	 * `isDirty && nextLocation.pathname !== currentLocation.pathname`.
	 */
	shouldBlock?: (args: {
		currentLocation: Location;
		nextLocation: Location;
	}) => boolean;
}

/**
 * Block in-app navigation while there are unsaved changes.
 *
 * Returns the raw react-router `Blocker` so the caller can render their own
 * dialog. For the conventional dialog UX use `<UnsavedChangesGuard/>` (which
 * composes this hook with `<LeavePageConfirmation/>`).
 *
 * Requires a react-router-dom **data router** (`createBrowserRouter` /
 * `createMemoryRouter` + `<RouterProvider/>`). The legacy `<BrowserRouter>` /
 * `<MemoryRouter>` JSX routers do not implement `useBlocker`.
 */
export function useUnsavedChangesBlocker(
	isDirty: boolean,
	opts?: UnsavedChangesBlockerOptions,
): Blocker {
	const blocker = useBlocker(({ currentLocation, nextLocation }) => {
		if (!isDirty) return false;
		if (opts?.shouldBlock) {
			return opts.shouldBlock({ currentLocation, nextLocation });
		}
		if (
			opts?.safePathPrefix &&
			nextLocation.pathname.startsWith(opts.safePathPrefix)
		) {
			return false;
		}
		if (nextLocation.pathname === currentLocation.pathname) return false;
		return true;
	});
	return blocker;
}
