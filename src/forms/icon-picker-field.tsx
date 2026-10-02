import { mergeRefs } from "@chakra-ui/react";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import { IconPicker, type IconPickerProps } from "../atoms/icon-picker";
import { FormField, type FormFieldProps } from "./form-field";

export interface IconPickerFieldProps<T extends FieldValues>
	extends Omit<FormFieldProps<T>, "children"> {
	/** Offer a button that empties the field. @default true */
	isClearable?: boolean;
	/**
	 * Passed through to `IconPicker`. The value and the change, blur and
	 * labelling wiring belong to the field, so they are absent here rather
	 * than accepted and overridden.
	 */
	pickerProps?: Omit<
		IconPickerProps,
		| "value"
		| "onChange"
		| "onBlur"
		| "id"
		| "name"
		| "disabled"
		| "readOnly"
		| "isClearable"
		| "aria-describedby"
		| "ref"
	>;
}

/**
 * A form-bound `IconPicker`. The form value is the lucide name as a plain
 * string (`"file-text"`), or null when empty — the same shape a text field
 * holding an icon name stored, so existing data needs no migration and a
 * schema reads `z.string().nullable()`.
 */
export function IconPickerField<T extends FieldValues>({
	ref,
	...props
}: IconPickerFieldProps<T> & { ref?: React.Ref<HTMLButtonElement> }) {
	const {
		name,
		label,
		isClearable = true,
		pickerProps,
		readOnly,
		disabled,
		showDirtyState,
		...rest
	} = props;

	return (
		<FormField<T>
			name={name}
			label={label}
			readOnly={readOnly}
			disabled={disabled}
			showDirtyState={showDirtyState}
			{...rest}
		>
			{(field) => (
				<IconPicker
					{...pickerProps}
					// Merge rather than override: RHF's field.ref is what makes
					// setFocus and focus-on-first-error reach the trigger.
					ref={mergeRefs(field.ref, ref)}
					id={name}
					name={field.name}
					value={typeof field.value === "string" ? field.value : null}
					onChange={field.onChange}
					onBlur={field.onBlur}
					isClearable={isClearable}
					disabled={disabled}
					readOnly={readOnly}
					aria-describedby={field["aria-describedby"]}
				/>
			)}
		</FormField>
	);
}
(IconPickerField as { displayName?: string }).displayName = "IconPickerField";
