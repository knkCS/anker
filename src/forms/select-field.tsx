import {
	NativeSelect,
	type NativeSelectFieldProps,
} from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import { FormField, type FormFieldProps } from "./form-field";

export interface SelectFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	placeholder?: string;
	selectProps?: NativeSelectFieldProps;
	children: React.ReactNode;
}

export function SelectField<T extends FieldValues>({
	ref,
	...props
}: SelectFieldProps<T> & { ref?: React.Ref<HTMLSelectElement> }) {
	const {
		name,
		label,
		placeholder,
		selectProps,
		children,
		readOnly,
		disabled,
		...rest
	} = props;

	return (
		<FormField<T>
			name={name}
			label={label}
			readOnly={readOnly}
			disabled={disabled}
			{...rest}
		>
			{(field) => (
				<NativeSelect.Root disabled={readOnly || disabled}>
					<NativeSelect.Field
						{...field}
						value={String(field.value ?? "")}
						id={name}
						ref={ref}
						{...selectProps}
					>
						{placeholder && (
							<option value="" disabled>
								{placeholder}
							</option>
						)}
						{children}
					</NativeSelect.Field>
					<NativeSelect.Indicator />
				</NativeSelect.Root>
			)}
		</FormField>
	);
}
