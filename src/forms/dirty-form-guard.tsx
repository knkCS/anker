import type React from "react";
import { useFormContext } from "react-hook-form";
import { useBlocker } from "react-router-dom";
import { LeavePageConfirmation } from "../primitives/leave-page-confirmation";

export interface DirtyFormGuardProps {
	/** Dialog title. @default "You have unsaved changes" */
	title?: string;
	/** Dialog message body. @default "Are you sure you want to leave this page? You have unsaved changes." */
	message?: string;
	/** Label for the confirm/leave button. @default "Leave" */
	confirmLabel?: string;
	/** Label for the cancel/stay button. @default "Stay" */
	cancelLabel?: string;
}

export const DirtyFormGuard: React.FC<DirtyFormGuardProps> = ({
	title,
	message,
	confirmLabel,
	cancelLabel,
}) => {
	const { formState } = useFormContext();
	const blocker = useBlocker(formState.isDirty);

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
};
DirtyFormGuard.displayName = "DirtyFormGuard";
