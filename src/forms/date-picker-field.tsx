import { Input } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import { FormField, type FormFieldProps } from "./form-field";

export interface DatePickerFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	/** Minimum date in YYYY-MM-DD format */
	min?: string;
	/** Maximum date in YYYY-MM-DD format */
	max?: string;
	/** Input type: "date", "datetime-local", or "time" */
	type?: "date" | "datetime-local" | "time";
}

export function DatePickerField<T extends FieldValues>({
	ref,
	...props
}: DatePickerFieldProps<T> & { ref?: React.Ref<HTMLInputElement> }) {
	const {
		name,
		label,
		min,
		max,
		type = "date",
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
				<Input
					{...field}
					value={field.value ?? ""}
					type={type}
					id={name}
					min={min}
					max={max}
					readOnly={readOnly}
					disabled={disabled}
					ref={ref}
				/>
			)}
		</FormField>
	);
}
