import { mergeRefs } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import { Textarea, type TextareaProps } from "../primitives/textarea";
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
		showDirtyState,
		...rest
	} = props;

	return (
		<FormField<T>
			name={name}
			label={label}
			readOnly={readOnly}
			disabled={disabled}
			showDirtyState={showDirtyState}
			{...rest}
		>
			{(field, { isDirty }) => (
				<Textarea
					{...field}
					value={String(field.value ?? "")}
					id={name}
					placeholder={placeholder}
					readOnly={readOnly}
					disabled={disabled}
					opacity={readOnly ? 0.8 : 1}
					borderColor={isDirty ? "yellow.400" : undefined}
					bg={isDirty ? "yellow.50" : undefined}
					// Merge rather than override: `{...field}` spreads RHF's own
					// field.ref, and a later `ref={ref}` would DISCARD it — leaving
					// react-hook-form unregistered (setFocus/focus-on-error dead).
					ref={mergeRefs(field.ref, ref)}
					{...textareaProps}
				/>
			)}
		</FormField>
	);
}
(TextareaField as { displayName?: string }).displayName = "TextareaField";
