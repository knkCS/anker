import {
	ButtonGroup,
	Editable,
	IconButton,
	useEditableContext,
} from "@chakra-ui/react";
import { Pencil } from "lucide-react";
import type React from "react";

export interface EditableHeadingProps {
	value?: string;
	onChange?: (nextValue: string) => void;
	onCancel?: (previousValue: string) => void;
	onSubmit?: (nextValue: string) => void;
	/** Aria label for the edit button. @default "Edit" */
	editLabel?: string;
	/** Font size for the heading. @default "3xl" */
	fontSize?: string;
	/** Max width constraint. @default "lg" */
	maxW?: string;
}

const EditableControls: React.FC<{ editLabel: string }> = ({ editLabel }) => {
	const { editing } = useEditableContext();

	if (editing) return null;

	return (
		<ButtonGroup>
			<Editable.EditTrigger asChild>
				<IconButton variant="ghost" ml={2} aria-label={editLabel}>
					<Pencil size={20} />
				</IconButton>
			</Editable.EditTrigger>
		</ButtonGroup>
	);
};

export const EditableHeading: React.FC<EditableHeadingProps> = ({
	value,
	onChange,
	onCancel,
	onSubmit,
	editLabel = "Edit",
	fontSize = "3xl",
	maxW = "lg",
}) => {
	return (
		<Editable.Root
			fontSize={fontSize}
			maxW={maxW}
			value={String(value ?? "")}
			onValueChange={(details) => onChange?.(details.value)}
			onValueRevert={(details) => onCancel?.(details.value)}
			onValueCommit={(details) => onSubmit?.(details.value)}
		>
			<Editable.Preview />
			<Editable.Input />
			<EditableControls editLabel={editLabel} />
		</Editable.Root>
	);
};
