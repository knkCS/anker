import {
	ButtonGroup,
	Editable,
	IconButton,
	useEditableContext,
} from "@chakra-ui/react";
import { Pencil } from "lucide-react";
import type React from "react";
import { useRef } from "react";

export interface InlineEditProps {
	value?: string;
	onSubmit?: (nextValue: string) => void;
	onChange?: (nextValue: string) => void;
	onCancel?: (previousValue: string) => void;
	/** @default "input" */
	variant?: "input" | "textarea";
	placeholder?: string;
	/** @default "md" */
	fontSize?: string;
	fontWeight?: string;
	maxW?: string;
	disabled?: boolean;
	/** When false, submitting an empty value reverts to the previous value. @default false */
	allowEmpty?: boolean;
	/** Number of rows used to calculate minH for textarea variant. @default 3 */
	rows?: number;
	/** Aria label for the edit button. @default "Edit" */
	editLabel?: string;
}

interface CancelRefCaptureProps {
	cancelRef: React.MutableRefObject<(() => void) | null>;
}

const CancelRefCapture: React.FC<CancelRefCaptureProps> = ({ cancelRef }) => {
	const { cancel } = useEditableContext();
	cancelRef.current = cancel;
	return null;
};

const EditControls: React.FC<{ editLabel: string }> = ({ editLabel }) => {
	const { editing } = useEditableContext();

	if (editing) return null;

	return (
		<ButtonGroup>
			<Editable.EditTrigger asChild>
				<IconButton
					variant="ghost"
					marginInlineStart={2}
					aria-label={editLabel}
				>
					<Pencil size={16} />
				</IconButton>
			</Editable.EditTrigger>
		</ButtonGroup>
	);
};

export const InlineEdit: React.FC<InlineEditProps> = ({
	value,
	onSubmit,
	onChange,
	onCancel,
	variant = "input",
	placeholder,
	fontSize = "md",
	fontWeight,
	maxW,
	disabled,
	allowEmpty = false,
	rows = 3,
	editLabel = "Edit",
}) => {
	const cancelRef = useRef<(() => void) | null>(null);

	const handleSubmit = (details: { value: string }) => {
		const trimmed = details.value.trim();
		if (!allowEmpty && trimmed === "") {
			cancelRef.current?.();
			return;
		}
		onSubmit?.(trimmed);
	};

	return (
		<Editable.Root
			fontSize={fontSize}
			fontWeight={fontWeight}
			maxW={maxW}
			value={String(value ?? "")}
			onValueChange={(d) => onChange?.(d.value)}
			onValueRevert={(d) => onCancel?.(d.value)}
			onValueCommit={handleSubmit}
			disabled={disabled}
			placeholder={placeholder}
		>
			<CancelRefCapture cancelRef={cancelRef} />
			<Editable.Preview />
			{variant === "textarea" ? (
				<Editable.Textarea minH={`${rows * 1.5}em`} />
			) : (
				<Editable.Input />
			)}
			<EditControls editLabel={editLabel} />
		</Editable.Root>
	);
};
InlineEdit.displayName = "InlineEdit";
