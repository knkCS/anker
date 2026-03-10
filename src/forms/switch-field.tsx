import { Box, Flex } from "@chakra-ui/react";
import type React from "react";
import {
	Controller,
	type FieldValues,
	type Path,
	useFormContext,
} from "react-hook-form";
import { Switch, type SwitchProps } from "../primitives/switch";
import { FormField, type FormFieldProps } from "./form-field";

export interface SwitchFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	switchProps?: SwitchProps;
}

export function SwitchField<T extends FieldValues>({
	ref,
	...props
}: SwitchFieldProps<T> & { ref?: React.Ref<HTMLInputElement> }) {
	const { name, label, readOnly, disabled, switchProps, ...rest } = props;

	return (
		<FormField<T>
			name={name}
			label={label}
			readOnly={readOnly}
			disabled={disabled}
			{...rest}
		>
			{(field) => (
				<Switch
					id={name}
					name={field.name}
					checked={field.value || false}
					onCheckedChange={(details) =>
						field.onChange(!!details.checked)
					}
					onBlur={field.onBlur}
					disabled={disabled}
					readOnly={readOnly}
					opacity={readOnly ? 0.8 : 1}
					ref={ref}
					{...switchProps}
				/>
			)}
		</FormField>
	);
}
