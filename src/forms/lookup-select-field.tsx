import { mergeRefs } from "@chakra-ui/react";
import type { GroupBase, SelectInstance } from "chakra-react-select";
import type React from "react";
import type { FieldValues } from "react-hook-form";
import {
	LookupSelect,
	type LookupSelectProps,
} from "../atoms/select/lookup-select";
import type { BaseOption } from "../atoms/select/types";
import { dirtyStyles } from "./base-select-field";
import {
	DescribedByContext,
	DescribedSelectInput,
} from "./described-select-input";
import { FormField, type FormFieldProps } from "./form-field";

export interface LookupSelectFieldProps<
	T extends FieldValues,
	O extends BaseOption = BaseOption,
> extends Omit<FormFieldProps<T>, "children">,
		Pick<
			LookupSelectProps<O>,
			| "search"
			| "resolve"
			| "debounceMs"
			| "emptyMessage"
			| "errorMessage"
			| "loadingMessage"
		> {
	/**
	 * Pick several. The form value is then an array of ids (`[]` when empty)
	 * instead of one id or `null`.
	 */
	isMulti?: boolean;
	/** Offer a control that empties the field. @default true */
	isClearable?: boolean;
	placeholder?: string;
	/**
	 * Passed through to `LookupSelect`. The value, the change and blur wiring
	 * and the Source belong to the field, so they are absent here rather than
	 * accepted and overridden.
	 */
	selectProps?: Omit<
		LookupSelectProps<O>,
		| "value"
		| "onChange"
		| "onBlur"
		| "search"
		| "resolve"
		| "debounceMs"
		| "emptyMessage"
		| "errorMessage"
		| "loadingMessage"
		| "isMulti"
		| "isClearable"
		| "placeholder"
		| "name"
		| "inputId"
		| "disabled"
	>;
}

/**
 * A form-bound `LookupSelect`: the select for a form whose options live on a
 * server. Stores the picked items' ids; `resolve` turns a stored id back into
 * its label when the form loads.
 */
export function LookupSelectField<
	T extends FieldValues,
	O extends BaseOption = BaseOption,
>({
	ref,
	...props
}: LookupSelectFieldProps<T, O> & {
	ref?: React.Ref<SelectInstance<O, boolean, GroupBase<O>>>;
}) {
	const {
		name,
		label,
		search,
		resolve,
		debounceMs,
		emptyMessage,
		errorMessage,
		loadingMessage,
		isMulti = false,
		isClearable = true,
		placeholder,
		selectProps,
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
			{(field, { isDirty }) => {
				const value = field.value as unknown;
				return (
					<DescribedByContext.Provider value={field["aria-describedby"]}>
						<LookupSelect<O>
							{...selectProps}
							// Merge rather than override: RHF's field.ref is what makes
							// setFocus and focus-on-first-error reach this control.
							ref={mergeRefs(field.ref, ref)}
							name={field.name}
							inputId={name}
							search={search}
							resolve={resolve}
							debounceMs={debounceMs}
							emptyMessage={emptyMessage}
							errorMessage={errorMessage}
							loadingMessage={loadingMessage}
							isMulti={isMulti}
							isClearable={isClearable}
							placeholder={placeholder}
							disabled={disabled}
							value={
								isMulti
									? Array.isArray(value)
										? value.map(String)
										: []
									: value == null || value === ""
										? null
										: String(value)
							}
							onChange={(next) => {
								field.onChange(
									Array.isArray(next)
										? next.map((o) => o.id)
										: (next?.id ?? null),
								);
							}}
							onBlur={field.onBlur}
							chakraStyles={dirtyStyles(selectProps?.chakraStyles, isDirty)}
							components={{
								Input: DescribedSelectInput,
								...selectProps?.components,
							}}
						/>
					</DescribedByContext.Provider>
				);
			}}
		</FormField>
	);
}
(LookupSelectField as { displayName?: string }).displayName =
	"LookupSelectField";
