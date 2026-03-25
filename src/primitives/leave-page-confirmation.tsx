import { Button, ButtonGroup, Dialog, Portal } from "@chakra-ui/react";
import type React from "react";
import { useRef } from "react";

export interface LeavePageConfirmationProps {
	/** Whether the dialog is currently open (i.e., navigation is blocked). */
	blocked: boolean;
	/** Called when the user confirms they want to leave. */
	onConfirmLeave: () => void;
	/** Called when the user cancels and wants to stay. */
	onCancelLeave: () => void;
	/** Dialog title. Defaults to "You have unsaved changes". */
	title?: string;
	/** Dialog message body. Defaults to a generic unsaved-changes prompt. */
	message?: string;
	/** Label for the confirm/leave button. Defaults to "Leave". */
	confirmLabel?: string;
	/** Label for the cancel/stay button. Defaults to "Stay". */
	cancelLabel?: string;
}

export const LeavePageConfirmation: React.FC<LeavePageConfirmationProps> = (
	props,
) => {
	const {
		blocked,
		onConfirmLeave,
		onCancelLeave,
		title = "You have unsaved changes",
		message = "Are you sure you want to leave this page? You have unsaved changes.",
		confirmLabel = "Leave",
		cancelLabel = "Stay",
	} = props;

	const cancelRef = useRef<HTMLButtonElement | null>(null);

	return (
		<Dialog.Root
			open={blocked}
			initialFocusEl={() => cancelRef.current}
			role="alertdialog"
			onOpenChange={(e) => {
				if (!e.open) {
					onCancelLeave();
				}
			}}
		>
			<Portal>
				<Dialog.Backdrop>
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header fontSize="lg" fontWeight="bold">
								{title}
							</Dialog.Header>
							<Dialog.Body>{message}</Dialog.Body>
							<Dialog.Footer>
								<ButtonGroup>
									<Button variant="solid" onClick={onConfirmLeave}>
										{confirmLabel}
									</Button>
									<Button
										variant="outline"
										onClick={onCancelLeave}
										ref={cancelRef}
									>
										{cancelLabel}
									</Button>
								</ButtonGroup>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Positioner>
				</Dialog.Backdrop>
			</Portal>
		</Dialog.Root>
	);
};
LeavePageConfirmation.displayName = "LeavePageConfirmation";
