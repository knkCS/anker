import { Textarea, type TextareaProps } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues, Path } from "react-hook-form";
import { FormField, type FormFieldProps } from "./form-field";

export interface TextareaFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	placeholder?: string;
	textareaProps?: TextareaProps;
}

export function TextareaField<T extends FieldValues>({
	ref,
	...props
}: TextareaFieldProps<T> & { ref?: React.Ref<HTMLTextAreaElement> }) {
	const {
		name,
		label,
		placeholder,
		textareaProps,
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
				<Textarea
					{...field}
					value={String(field.value ?? "")}
					id={name}
					placeholder={placeholder}
					readOnly={readOnly}
					disabled={disabled}
					ref={ref}
					{...textareaProps}
				/>
			)}
		</FormField>
	);
}
