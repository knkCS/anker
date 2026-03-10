import {
	Button,
	ButtonGroup,
	type ButtonProps,
	Dialog,
	Portal,
} from "@chakra-ui/react";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";

export interface ConfirmOptions {
	title: string;
	message: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	colorPalette?: ButtonProps["colorPalette"];
	beforeConfirmActions?: React.ReactNode;
}

interface ConfirmModalContextType {
	confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmModalContext = createContext<ConfirmModalContextType | undefined>(
	undefined,
);

interface ConfirmModalProviderProps {
	children: React.ReactNode;
}

export const ConfirmModalProvider: React.FC<ConfirmModalProviderProps> = ({
	children,
}) => {
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions>({
		title: "",
		message: "",
	});
	const resolveRef = useRef<((value: boolean) => void) | null>(null);

	const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
		setOptions(opts);
		setOpen(true);
		return new Promise<boolean>((resolve) => {
			resolveRef.current = resolve;
		});
	}, []);

	const handleClose = useCallback(() => {
		setOpen(false);
		resolveRef.current?.(false);
		resolveRef.current = null;
	}, []);

	const handleConfirm = useCallback(() => {
		setOpen(false);
		resolveRef.current?.(true);
		resolveRef.current = null;
	}, []);

	return (
		<ConfirmModalContext.Provider value={{ confirm }}>
			{children}
			<ConfirmModalDialog
				open={open}
				options={options}
				onClose={handleClose}
				onConfirm={handleConfirm}
			/>
		</ConfirmModalContext.Provider>
	);
};

ConfirmModalProvider.displayName = "ConfirmModalProvider";

export const useConfirmModal = (): ConfirmModalContextType => {
	const context = useContext(ConfirmModalContext);
	if (!context) {
		throw new Error(
			"useConfirmModal must be used within a ConfirmModalProvider",
		);
	}
	return context;
};

interface ConfirmModalDialogProps {
	open: boolean;
	options: ConfirmOptions;
	onClose: () => void;
	onConfirm: () => void;
}

const ConfirmModalDialog: React.FC<ConfirmModalDialogProps> = ({
	open,
	options,
	onClose,
	onConfirm,
}) => {
	const cancelRef = useRef<HTMLButtonElement>(null);
	const {
		title,
		message,
		confirmLabel = "Confirm",
		cancelLabel = "Cancel",
		colorPalette = "red",
		beforeConfirmActions,
	} = options;

	return (
		<Dialog.Root
			open={open}
			initialFocusEl={() => cancelRef.current}
			placement="center"
			role="alertdialog"
			onOpenChange={(e) => {
				if (!e.open) {
					onClose();
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
								<ButtonGroup size="sm">
									<Button ref={cancelRef} variant="outline" onClick={onClose}>
										{cancelLabel}
									</Button>
									{beforeConfirmActions}
									<Button colorPalette={colorPalette} onClick={onConfirm}>
										{confirmLabel}
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
