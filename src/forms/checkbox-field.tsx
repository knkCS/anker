import { Checkbox, Field } from "@chakra-ui/react";
import type React from "react";
import {
	Controller,
	type FieldValues,
	type Path,
	useFormContext,
} from "react-hook-form";

export interface CheckboxFieldProps<T extends FieldValues> {
	name: Path<T>;
	label?: string;
	/** When provided, the field is treated as an array of checked values. */
	value?: string | number;
	disabled?: boolean;
	helperText?: React.ReactNode;
	children?: React.ReactNode;
}

export function CheckboxField<T extends FieldValues>({
	ref,
	...props
}: CheckboxFieldProps<T> & { ref?: React.Ref<HTMLLabelElement> }) {
	const { name, label, value, disabled, helperText, children } = props;
	const { control } = useFormContext<T>();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => {
				// Array mode: field.value is an array, value prop identifies the item
				const isArrayMode = value !== undefined;

				const isChecked = isArrayMode
					? Array.isArray(field.value) && field.value.includes(value)
					: !!field.value;

				const handleCheckedChange = (details: {
					checked: boolean | "indeterminate";
				}) => {
					if (isArrayMode) {
						const currentValue = Array.isArray(field.value)
							? [...field.value]
							: [];
						if (details.checked) {
							if (!currentValue.includes(value)) {
								currentValue.push(value);
							}
						} else {
							const idx = currentValue.indexOf(value);
							if (idx > -1) currentValue.splice(idx, 1);
						}
						field.onChange(currentValue);
					} else {
						field.onChange(!!details.checked);
					}
				};

				const uniqueId = isArrayMode ? `${name}-${String(value)}` : name;

				return (
					<Field.Root invalid={!!fieldState.error} disabled={disabled}>
						<Checkbox.Root
							id={uniqueId}
							name={field.name}
							value={isArrayMode ? String(value) : undefined}
							invalid={!!fieldState.error}
							ref={ref}
							checked={isChecked}
							onCheckedChange={handleCheckedChange}
							onBlur={field.onBlur}
							disabled={disabled}
						>
							<Checkbox.HiddenInput />
							<Checkbox.Control>
								<Checkbox.Indicator />
							</Checkbox.Control>
							{(label || children) && (
								<Checkbox.Label>
									{label}
									{children}
								</Checkbox.Label>
							)}
						</Checkbox.Root>
						{helperText && <Field.HelperText>{helperText}</Field.HelperText>}
						{fieldState.error && (
							<Field.ErrorText aria-live="polite">
								{fieldState.error.message}
							</Field.ErrorText>
						)}
					</Field.Root>
				);
			}}
		/>
	);
}
(CheckboxField as { displayName?: string }).displayName = "CheckboxField";
