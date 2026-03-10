import {
	Box,
	Button,
	ButtonGroup,
	Grid,
	GridItem,
	IconButton,
	Input,
	Stack,
	Text,
} from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import {
	type FieldValues,
	useFieldArray,
	useFormContext,
} from "react-hook-form";
import { FormField, type FormFieldProps } from "./form-field";

export interface ArrayFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	/**
	 * The mode of the array field.
	 * - `dynamic` — add/remove key-value pairs
	 * - `keyed` — fixed keys, editable values
	 * @default "dynamic"
	 */
	mode?: "dynamic" | "keyed";
	/** Header label for the value column. @default "Value" */
	valueHeader?: string;
	/** Header label for the key column. @default "Key" */
	keyHeader?: string;
	/** Fixed keys when mode is "keyed". */
	keys?: Array<{ key: string; value: string }>;
	/** Label for the add button. @default "Add Field" */
	addLabel?: string;
	/** Aria label for the remove button. @default "Remove Item" */
	removeLabel?: string;
	/** Content to display when there are no items. */
	emptyState?: React.ReactNode;
}

export function ArrayField<T extends FieldValues>(props: ArrayFieldProps<T>) {
	const {
		name,
		label,
		mode = "dynamic",
		valueHeader = "Value",
		keyHeader = "Key",
		keys = [],
		addLabel = "Add Field",
		removeLabel = "Remove Item",
		readOnly,
		emptyState,
		...rest
	} = props;

	return (
		<FormField<T> name={name} label={label} readOnly={readOnly} {...rest}>
			{(_field) => (
				<Box py={4} px={4} bg="bg" rounded="md">
					{mode === "dynamic" ? (
						<DynamicArray
							name={name}
							valueHeader={valueHeader}
							keyHeader={keyHeader}
							addLabel={addLabel}
							removeLabel={removeLabel}
							readOnly={readOnly}
							emptyState={emptyState}
						/>
					) : (
						<KeyedArray
							name={name}
							valueHeader={valueHeader}
							keyHeader={keyHeader}
							keys={keys}
							readOnly={readOnly}
						/>
					)}
				</Box>
			)}
		</FormField>
	);
}

ArrayField.displayName = "ArrayField";

interface DynamicArrayProps {
	name: string;
	valueHeader: string;
	keyHeader: string;
	addLabel: string;
	removeLabel: string;
	readOnly?: boolean;
	emptyState?: React.ReactNode;
}

const DynamicArray: React.FC<DynamicArrayProps> = React.memo((props) => {
	const {
		name,
		valueHeader,
		keyHeader,
		addLabel,
		removeLabel,
		readOnly,
		emptyState,
	} = props;

	const { control, register } = useFormContext();
	const { fields, append, remove } = useFieldArray({
		control,
		name: name as any,
	});

	return (
		<Stack gap={4}>
			<Grid templateColumns="200px 1fr 50px" gap={2}>
				<GridItem>
					<Text fontWeight={500}>{keyHeader}</Text>
				</GridItem>
				<GridItem colSpan={2}>
					<Text fontWeight={500}>{valueHeader}</Text>
				</GridItem>

				{fields.map((item, index) => (
					<React.Fragment key={item.id}>
						<Input
							{...register(`${name}.${index}.key` as any)}
							readOnly={readOnly}
						/>
						<Input
							{...register(`${name}.${index}.value` as any)}
							readOnly={readOnly}
						/>
						<IconButton
							size="sm"
							variant="ghost"
							colorPalette="red"
							aria-label={removeLabel}
							onClick={() => remove(index)}
							disabled={readOnly}
						>
							<Trash2 size={16} />
						</IconButton>
					</React.Fragment>
				))}
			</Grid>
			{fields.length === 0 && emptyState && (
				<Box py={4} textAlign="center">
					{emptyState}
				</Box>
			)}
			<ButtonGroup>
				<Button
					variant="outline"
					size="sm"
					onClick={() => append({ key: "", value: "" })}
					disabled={readOnly}
				>
					<Plus size={16} />
					{addLabel}
				</Button>
			</ButtonGroup>
		</Stack>
	);
});

DynamicArray.displayName = "DynamicArray";

interface KeyedArrayProps {
	name: string;
	valueHeader: string;
	keyHeader: string;
	keys: Array<{ key: string; value: string }>;
	readOnly?: boolean;
}

const KeyedArray: React.FC<KeyedArrayProps> = React.memo((props) => {
	const { name, valueHeader, keyHeader, keys, readOnly } = props;
	const { register } = useFormContext();

	return (
		<Stack gap={4}>
			<Grid templateColumns="200px 1fr" gap={2}>
				<GridItem>
					<Text fontWeight={500}>{keyHeader}</Text>
				</GridItem>
				<GridItem>
					<Text fontWeight={500}>{valueHeader}</Text>
				</GridItem>
				{keys.map((keyItem) => (
					<React.Fragment key={keyItem.key}>
						<Text py={2}>{keyItem.value ?? keyItem.key}</Text>
						<Input
							{...register(`${name}.${keyItem.key}` as any)}
							readOnly={readOnly}
						/>
					</React.Fragment>
				))}
			</Grid>
		</Stack>
	);
});

KeyedArray.displayName = "KeyedArray";
