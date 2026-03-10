import type { InputProps } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import TextInput from "../atoms/text-input/text-input";
import { FormField, type FormFieldProps } from "./form-field";

export interface InputFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	placeholder?: string;
	type?: InputProps["type"];
	append?: string | React.ReactElement;
	prepend?: string | React.ReactElement;
	inputProps?: InputProps;
}

export function InputField<T extends FieldValues>({
	ref,
	...props
}: InputFieldProps<T> & { ref?: React.Ref<HTMLInputElement> }) {
	const {
		name,
		label,
		placeholder,
		type,
		append,
		prepend,
		inputProps,
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
				<TextInput
					{...field}
					value={field.value ?? ""}
					id={name}
					placeholder={placeholder}
					type={type}
					append={append}
					prepend={prepend}
					readOnly={readOnly}
					disabled={disabled}
					opacity={readOnly ? 0.8 : 1}
					ref={ref}
					{...inputProps}
				/>
			)}
		</FormField>
	);
}
(InputField as { displayName?: string }).displayName = "InputField";
