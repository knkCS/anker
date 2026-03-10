import {
	Button,
	Dialog,
	type DialogRootProps,
	Flex,
	IconButton,
	Portal,
	Separator,
	Spacer,
} from "@chakra-ui/react";
import { X } from "lucide-react";

export interface ModalProps
	extends Omit<DialogRootProps, "open" | "onOpenChange"> {
	/** Whether the modal is open. */
	open: boolean;
	/** Called when the modal should close. */
	onClose: () => void;
	/** Header content (string or ReactNode). */
	header: string | React.ReactNode;
	/** Modal body content. */
	children: React.ReactNode;
	/** Custom footer. If provided, replaces the default Cancel/Save buttons. */
	footer?: React.ReactNode;
	/** Dialog size variant. */
	size?: DialogRootProps["size"];
	/** Label for the close button. */
	closeLabel?: string;
	/** Label for the save button. */
	saveLabel?: string;
	/** Label for the cancel button. */
	cancelLabel?: string;
	/** Called when the save button is clicked. If not provided, no default footer is shown. */
	onSave?: () => void;
	/** Whether the save button is disabled. */
	saveDisabled?: boolean;
	/** Whether the save action is in progress. Shows spinner on save button. */
	loading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
	open,
	onClose,
	header,
	children,
	footer,
	size = "xl",
	closeLabel = "Close",
	saveLabel = "Save",
	cancelLabel = "Cancel",
	onSave,
	saveDisabled = false,
	loading = false,
	...rest
}) => {
	const defaultFooter = onSave ? (
		<Flex gap={3} justify="flex-end" w="full">
			<Button variant="outline" onClick={onClose}>
				{cancelLabel}
			</Button>
			<Button
				variant="solid"
				colorPalette="primary"
				onClick={onSave}
				disabled={saveDisabled || loading}
				loading={loading}
			>
				{saveLabel}
			</Button>
		</Flex>
	) : null;

	const footerContent = footer !== undefined ? footer : defaultFooter;

	return (
		<Dialog.Root
			{...rest}
			open={open}
			size={size}
			onOpenChange={(details) => {
				if (!details.open) {
					onClose();
				}
			}}
		>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							{header}
							<Spacer />
							<Dialog.CloseTrigger asChild>
								<IconButton variant="ghost" size="sm" aria-label={closeLabel}>
									<X size={16} />
								</IconButton>
							</Dialog.CloseTrigger>
						</Dialog.Header>

						<Separator />

						<Dialog.Body>{children}</Dialog.Body>

						{footerContent && (
							<>
								<Separator />
								<Dialog.Footer>{footerContent}</Dialog.Footer>
							</>
						)}
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};
Modal.displayName = "Modal";
