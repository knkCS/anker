import { Field } from "@chakra-ui/react";
import type React from "react";
import { useId } from "react";
import {
	Controller,
	type ControllerRenderProps,
	type FieldValues,
	type Path,
	useFormContext,
} from "react-hook-form";
import { Box, HStack } from "../primitives/layout";
import { Text } from "../primitives/typography";

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
	/** When false, the dirty-marker on the label is suppressed and the
	 * children-callback's `meta.isDirty` is forced to false. @default true */
	showDirtyState?: boolean;
	children: (
		field: ControllerRenderProps<T, Path<T>> & {
			/** Computed aria-describedby linking to helper/description/error elements. */
			"aria-describedby"?: string;
		},
		meta: { isDirty: boolean },
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
	showDirtyState = true,
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
				const isDirty = Boolean(showDirtyState && fieldState.isDirty);

				return (
					<Field.Root
						invalid={!!fieldState.error}
						required={required}
						disabled={disabled}
						readOnly={readOnly}
						data-dirty={isDirty ? "true" : undefined}
					>
						{label &&
							(typeof label === "string" ? (
								<HStack>
									<Field.Label flex="1" htmlFor={name}>
										{label}
										{isDirty && (
											<Box
												as="span"
												display="inline-block"
												width="6px"
												height="6px"
												borderRadius="full"
												bg="yellow.500"
												ml="2"
												aria-label="ungespeicherte Änderung"
											/>
										)}
									</Field.Label>
									{actions}
								</HStack>
							) : (
								label
							))}
						{children(
							{ ...field, "aria-describedby": describedBy },
							{ isDirty },
						)}
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
