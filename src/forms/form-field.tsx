import { Field, HStack } from "@chakra-ui/react";
import type React from "react";
import {
	Controller,
	type FieldValues,
	type Path,
	useFormContext,
} from "react-hook-form";

export interface FormFieldProps<T extends FieldValues> {
	name: Path<T>;
	label?: React.ReactNode;
	helperText?: React.ReactNode;
	required?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	actions?: React.ReactNode;
	children: (field: {
		value: any;
		onChange: (...event: any[]) => void;
		onBlur: () => void;
		ref: React.Ref<any>;
		name: string;
	}) => React.ReactNode;
}

export function FormField<T extends FieldValues>({
	name,
	label,
	helperText,
	required,
	disabled,
	readOnly,
	actions,
	children,
}: FormFieldProps<T>) {
	const { control } = useFormContext<T>();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Field.Root
					invalid={!!fieldState.error}
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
					{children(field)}
					{helperText &&
						(typeof helperText === "string" ? (
							<Field.HelperText>{helperText}</Field.HelperText>
						) : (
							helperText
						))}
					{fieldState.error && (
						<Field.ErrorText>{fieldState.error.message}</Field.ErrorText>
					)}
				</Field.Root>
			)}
		/>
	);
}
