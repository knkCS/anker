import { Field, HStack } from "@chakra-ui/react";
import type React from "react";

export interface ControlledFormFieldProps {
	name: string;
	label?: React.ReactNode;
	helperText?: React.ReactNode;
	errorMessage?: React.ReactNode;
	required?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	actions?: React.ReactNode;
	children: React.ReactNode;
}

export const ControlledFormField: React.FC<ControlledFormFieldProps> = ({
	name,
	label,
	helperText,
	errorMessage,
	required,
	disabled,
	readOnly,
	actions,
	children,
}) => {
	return (
		<Field.Root
			invalid={!!errorMessage}
			required={required}
			disabled={disabled}
			readOnly={readOnly}
		>
			{label &&
				(typeof label === "string" ? (
					<HStack>
						<Field.Label flex="1" htmlFor={name}>
							{label}
						</Field.Label>
						{actions}
					</HStack>
				) : (
					label
				))}
			{children}
			{helperText &&
				(typeof helperText === "string" ? (
					<Field.HelperText>{helperText}</Field.HelperText>
				) : (
					helperText
				))}
			{errorMessage && <Field.ErrorText>{errorMessage}</Field.ErrorText>}
		</Field.Root>
	);
};
