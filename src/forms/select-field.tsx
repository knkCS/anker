import type { NativeSelectFieldProps } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import { NativeSelect } from "../primitives/native-select";
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
				<NativeSelect
					disabled={readOnly || disabled}
					placeholder={placeholder}
					{...field}
					value={String(field.value ?? "")}
					id={name}
					ref={ref}
					{...selectProps}
				>
					{children}
				</NativeSelect>
			)}
		</FormField>
	);
}
(SelectField as { displayName?: string }).displayName = "SelectField";
