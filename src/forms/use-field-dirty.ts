import { useFormContext } from "react-hook-form";

export interface UseFieldDirtyOptions {
	/** Set to false to never report dirty (opt-out per field). */
	showDirtyState?: boolean;
}

/**
 * useFieldDirty returns true when the field at `name` is dirty (changed
 * from its react-hook-form default) AND visual marking isn't suppressed.
 * Safe to call outside a FormProvider — returns false in that case.
 */
export function useFieldDirty(
	name: string,
	opts: UseFieldDirtyOptions = {},
): boolean {
	const { showDirtyState = true } = opts;
	if (!showDirtyState) return false;
	const ctx = useFormContext();
	if (!ctx) return false;
	const dirty = ctx.formState.dirtyFields as Record<string, unknown>;
	return Boolean(dirty[name]);
}
