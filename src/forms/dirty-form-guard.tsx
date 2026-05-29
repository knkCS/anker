import type React from "react";
import { useFormContext } from "react-hook-form";
import {
	UnsavedChangesGuard,
	type UnsavedChangesGuardProps,
} from "../navigation/unsaved-changes-guard";

export interface DirtyFormGuardProps
	extends Omit<UnsavedChangesGuardProps, "isDirty"> {
	// Inherits title/message/confirmLabel/cancelLabel/safePathPrefix/shouldBlock
	// from UnsavedChangesGuardProps; `isDirty` is resolved from
	// `useFormContext().formState.isDirty`.
}

/**
 * Form-aware shortcut for `<UnsavedChangesGuard/>`: sources `isDirty` from
 * the surrounding `useFormContext()`. Must be mounted inside a
 * `<FormProvider/>`. For non-form dirty sources (Monaco buffer, custom
 * hook) use `<UnsavedChangesGuard isDirty={…}/>` directly.
 *
 * Pass `safePathPrefix` to exempt sibling tabs of the same detail page
 * from the leave-confirmation modal.
 */
export const DirtyFormGuard: React.FC<DirtyFormGuardProps> = (props) => {
	const { formState } = useFormContext();
	return <UnsavedChangesGuard isDirty={formState.isDirty} {...props} />;
};
DirtyFormGuard.displayName = "DirtyFormGuard";
