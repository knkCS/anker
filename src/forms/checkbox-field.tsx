import { Checkbox } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import type { FormFieldProps } from "./form-field";
import { FormField } from "./form-field";

export interface CheckboxFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	/** When provided, the field is treated as an array of checked values. */
	value?: string | number;
	/** Content to display after the checkbox. */
	children?: React.ReactNode;
}

export function CheckboxField<T extends FieldValues>({
	...props
}: CheckboxFieldProps<T>) {
	const {
		name,
		label,
		value,
		disabled,
		showDirtyState,
		helperText,
		children,
		...rest
	} = props;

	return (
		<FormField<T>
			name={name}
			label={label}
			disabled={disabled}
			showDirtyState={showDirtyState}
			helperText={helperText}
			{...rest}
		>
			{(field) => {
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
					<Checkbox.Root
						id={uniqueId}
						name={field.name}
						value={isArrayMode ? String(value) : undefined}
						checked={isChecked}
						onCheckedChange={handleCheckedChange}
						onBlur={field.onBlur}
						disabled={disabled}
						aria-describedby={field["aria-describedby"]}
					>
						<Checkbox.HiddenInput />
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
						{(label || children) && <Checkbox.Label>{children}</Checkbox.Label>}
					</Checkbox.Root>
				);
			}}
		</FormField>
	);
}
(CheckboxField as { displayName?: string }).displayName = "CheckboxField";
