import { Field, HStack } from "@chakra-ui/react";
import type React from "react";
import { useId } from "react";

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
	const uid = useId();
	const helperId = `${uid}-helper`;
	const errorId = `${uid}-error`;

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
			{/* aria-describedby must be set manually by the consumer since children is ReactNode, not a render function. */}
			{children}
			{helperText &&
				(typeof helperText === "string" ? (
					<Field.HelperText id={helperId}>{helperText}</Field.HelperText>
				) : (
					<span id={helperId}>{helperText}</span>
				))}
			{errorMessage && (
				<Field.ErrorText id={errorId} aria-live="polite">
					{errorMessage}
				</Field.ErrorText>
			)}
		</Field.Root>
	);
};
