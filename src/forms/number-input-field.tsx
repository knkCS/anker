import { mergeRefs } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import {
	NumberInputField as NumberInputInput,
	type NumberInputProps,
	NumberInputRoot,
} from "../primitives/number-input";
import { FormField, type FormFieldProps } from "./form-field";

export interface NumberInputFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	min?: number;
	max?: number;
	step?: number;
	showStepper?: boolean;
	numberInputProps?: NumberInputProps;
}

export function NumberInputField<T extends FieldValues>({
	ref,
	...props
}: NumberInputFieldProps<T> & { ref?: React.Ref<HTMLInputElement> }) {
	const {
		name,
		label,
		min,
		max,
		step,
		showStepper = true,
		numberInputProps,
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
				<NumberInputRoot
					min={min}
					max={max}
					step={step}
					value={String(field.value ?? 0)}
					onValueChange={(details) => {
						field.onChange(
							details.value === "" ? 0 : Number.parseFloat(details.value),
						);
					}}
					id={name}
					readOnly={readOnly}
					disabled={disabled}
					showStepper={showStepper && !readOnly}
					opacity={readOnly ? 0.8 : 1}
					{...numberInputProps}
				>
					<NumberInputInput
						name={field.name}
						// Merge rather than override: this control cherry-picks field
						// props instead of spreading `{...field}`, but `field.ref` still
						// needs to reach the real input, or RHF never registers it
						// (setFocus/focus-on-error dead).
						ref={mergeRefs(field.ref, ref)}
						onBlur={field.onBlur}
						aria-describedby={field["aria-describedby"]}
					/>
				</NumberInputRoot>
			)}
		</FormField>
	);
}
(NumberInputField as { displayName?: string }).displayName = "NumberInputField";
