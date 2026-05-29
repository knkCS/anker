import { LeavePageConfirmation } from "../primitives/leave-page-confirmation";
import {
	type UnsavedChangesBlockerOptions,
	useUnsavedChangesBlocker,
} from "./use-unsaved-changes-blocker";

export interface UnsavedChangesGuardProps
	extends UnsavedChangesBlockerOptions {
	/** Source of truth for whether there's unsaved work. */
	isDirty: boolean;
	/** Dialog title. @default "You have unsaved changes" */
	title?: string;
	/** Dialog message body. @default "Are you sure you want to leave this page? You have unsaved changes." */
	message?: string;
	/** Confirm/leave label. @default "Leave" */
	confirmLabel?: string;
	/** Cancel/stay label. @default "Stay" */
	cancelLabel?: string;
}

/**
 * Blocks in-app navigation while `isDirty` is true and renders
 * `LeavePageConfirmation` to ask the user to confirm. Non-form-aware —
 * pass any boolean (form `formState.isDirty`, Monaco buffer state, etc.).
 * For react-hook-form pages use `<DirtyFormGuard/>` which sources `isDirty`
 * from `useFormContext()` automatically.
 *
 * Use `safePathPrefix` to exempt sibling tabs of the same detail page:
 *
 * ```tsx
 * <UnsavedChangesGuard
 *   isDirty={editor.hasAnyDirty}
 *   safePathPrefix={`/template/templates/${templateId}/`}
 * />
 * ```
 */
export function UnsavedChangesGuard({
	isDirty,
	safePathPrefix,
	shouldBlock,
	title,
	message,
	confirmLabel,
	cancelLabel,
}: UnsavedChangesGuardProps) {
	const blocker = useUnsavedChangesBlocker(isDirty, {
		safePathPrefix,
		shouldBlock,
	});
	return (
		<LeavePageConfirmation
			blocked={blocker.state === "blocked"}
			onConfirmLeave={() => blocker.proceed?.()}
			onCancelLeave={() => blocker.reset?.()}
			title={title}
			message={message}
			confirmLabel={confirmLabel}
			cancelLabel={cancelLabel}
		/>
	);
}
UnsavedChangesGuard.displayName = "UnsavedChangesGuard";
