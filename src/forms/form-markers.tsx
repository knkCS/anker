import { Field } from "@chakra-ui/react";
import type React from "react";
import { createContext, useContext } from "react";
import { Text } from "../primitives/typography";

/** Form-level defaults for field-label adornments: the §10
 * required/optional markers and the dirty-dot announcement. */
export interface FormMarkers {
	/** Appended after the label in muted color when the field is NOT required. */
	optionalText?: React.ReactNode;
	/** When false, suppresses the required asterisk. @default true */
	showRequiredIndicator?: boolean;
	/** aria-label default for the per-field dirty dot. @default "Unsaved changes" */
	dirtyLabel?: string;
}

const FormMarkersContext = createContext<FormMarkers>({});

/** Internal: read the form-level marker defaults. Not exported from the barrel. */
export function useFormMarkers(): FormMarkers {
	return useContext(FormMarkersContext);
}

export interface FormMarkersProviderProps {
	value: FormMarkers;
	children: React.ReactNode;
}

/**
 * Sets form-level marker defaults so a whole form follows ONE §10
 * convention: mostly-required forms pass
 * `{ showRequiredIndicator: false, optionalText: "(optional)" }`;
 * mostly-optional forms need no provider (asterisk is the default).
 * Explicit `FormField` props always win over the provider.
 */
export function FormMarkersProvider({
	value,
	children,
}: FormMarkersProviderProps) {
	return (
		<FormMarkersContext.Provider value={value}>
			{children}
		</FormMarkersContext.Provider>
	);
}
FormMarkersProvider.displayName = "FormMarkersProvider";

export interface FieldLabelMarkersProps extends FormMarkers {
	required?: boolean;
}

/**
 * Internal: the marker fragment rendered inside a string label by
 * FormField and ControlledFormField. Resolution per value:
 * explicit prop → FormMarkersProvider → default (indicator on).
 * Must render inside a Chakra `Field.Root` (the indicator reads its
 * required state from field context).
 */
export function FieldLabelMarkers({
	required,
	showRequiredIndicator,
	optionalText,
}: FieldLabelMarkersProps) {
	const ctx = useFormMarkers();
	const show = showRequiredIndicator ?? ctx.showRequiredIndicator ?? true;
	const text = optionalText ?? ctx.optionalText;
	return (
		<>
			{show && <Field.RequiredIndicator />}
			{!required && text != null && (
				<Text as="span" color="muted" fontWeight="normal" ms="1">
					{text}
				</Text>
			)}
		</>
	);
}
FieldLabelMarkers.displayName = "FieldLabelMarkers";
