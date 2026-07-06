import { Field } from "@chakra-ui/react";
import type React from "react";
import { useId } from "react";
import { HStack } from "../primitives/layout";
import { FieldLabelMarkers } from "./form-markers";

export interface ControlledFormFieldProps {
	name: string;
	label?: React.ReactNode;
	helperText?: React.ReactNode;
	errorMessage?: React.ReactNode;
	required?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	/** Appended after the label in muted color when the field is NOT required.
	 * Form-level default via `FormMarkersProvider`. */
	optionalText?: React.ReactNode;
	/** When false, suppresses the required asterisk. Form-level default via
	 * `FormMarkersProvider`. @default true */
	showRequiredIndicator?: boolean;
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
	optionalText,
	showRequiredIndicator,
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
							<FieldLabelMarkers
								required={required}
								showRequiredIndicator={showRequiredIndicator}
								optionalText={optionalText}
							/>
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
ControlledFormField.displayName = "ControlledFormField";
