import {
	RadioGroup as ChakraRadioGroup,
	type RadioGroupRootProps,
	Stack,
	type StackProps,
} from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import { Radio } from "../primitives/radio";
import { FormField, type FormFieldProps } from "./form-field";

export interface RadioOption {
	label: React.ReactNode;
	value: string;
}

export interface RadioGroupFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	options: RadioOption[];
	radioGroupProps?: RadioGroupRootProps;
	stackProps?: StackProps;
}

export function RadioGroupField<T extends FieldValues>(
	props: RadioGroupFieldProps<T>,
) {
	const {
		name,
		label,
		options,
		radioGroupProps,
		stackProps,
		...rest
	} = props;

	return (
		<FormField<T> name={name} label={label} {...rest}>
			{(field) => (
				<ChakraRadioGroup.Root
					value={String(field.value ?? "")}
					onValueChange={(e) => field.onChange(e.value)}
					{...radioGroupProps}
				>
					<Stack direction="row" {...stackProps}>
						{options.map((option) => (
							<Radio key={option.value} value={option.value}>
								{option.label}
							</Radio>
						))}
					</Stack>
				</ChakraRadioGroup.Root>
			)}
		</FormField>
	);
}
