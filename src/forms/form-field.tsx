import { Field, HStack, Text } from "@chakra-ui/react";
import type React from "react";
import { useId } from "react";
import {
	Controller,
	type ControllerRenderProps,
	type FieldValues,
	type Path,
	useFormContext,
} from "react-hook-form";

export interface FormFieldProps<T extends FieldValues> {
	name: Path<T>;
	label?: React.ReactNode;
	helperText?: React.ReactNode;
	/** Persistent description that shows even when there's an error. */
	description?: React.ReactNode;
	required?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	actions?: React.ReactNode;
	children: (
		field: ControllerRenderProps<T, Path<T>> & {
			/** Computed aria-describedby linking to helper/description/error elements. */
			"aria-describedby"?: string;
		},
	) => React.ReactNode;
}

export function FormField<T extends FieldValues>({
	name,
	label,
	helperText,
	description,
	required,
	disabled,
	readOnly,
	actions,
	children,
}: FormFieldProps<T>) {
	const { control } = useFormContext<T>();
	const uid = useId();
	const descriptionId = `${uid}-description`;
	const helperId = `${uid}-helper`;
	const errorId = `${uid}-error`;

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => {
				const describedBy =
					[
						description ? descriptionId : null,
						helperText ? helperId : null,
						fieldState.error ? errorId : null,
					]
						.filter(Boolean)
						.join(" ") || undefined;

				return (
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
						{children({ ...field, "aria-describedby": describedBy })}
						{description && (
							<Text id={descriptionId} fontSize="xs" color="muted">
								{description}
							</Text>
						)}
						{helperText &&
							(typeof helperText === "string" ? (
								<Field.HelperText id={helperId}>{helperText}</Field.HelperText>
							) : (
								<span id={helperId}>{helperText}</span>
							))}
						{fieldState.error && (
							<Field.ErrorText id={errorId} aria-live="polite">
								{fieldState.error.message}
							</Field.ErrorText>
						)}
					</Field.Root>
				);
			}}
		/>
	);
}
(FormField as { displayName?: string }).displayName = "FormField";
