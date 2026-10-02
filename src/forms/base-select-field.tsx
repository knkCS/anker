import { mergeRefs } from "@chakra-ui/react";
import type {
	ChakraStylesConfig,
	GroupBase,
	MultiValue,
	SelectInstance,
	SingleValue,
} from "chakra-react-select";
import type React from "react";
import { useMemo } from "react";
import type { FieldValues } from "react-hook-form";
import { BaseSelect, type BaseSelectProps } from "../atoms/select/base-select";
import type { BaseOption } from "../atoms/select/types";
import {
	DescribedByContext,
	DescribedSelectInput,
} from "./described-select-input";
import { FormField, type FormFieldProps } from "./form-field";

/** The options a `BaseSelectField` offers: flat, or in labelled groups. */
export type BaseSelectFieldOptions<O extends BaseOption> = ReadonlyArray<
	O | GroupBase<O>
>;

export interface BaseSelectFieldProps<
	T extends FieldValues,
	O extends BaseOption = BaseOption,
> extends Omit<FormFieldProps<T>, "children"> {
	/**
	 * The options, already in hand — flat, or as `{ label, options }` groups.
	 * Options that live on a server belong in `LookupSelectField`.
	 */
	options: BaseSelectFieldOptions<O>;
	/**
	 * Pick several. The form value is then an array of ids (`[]` when empty)
	 * instead of one id or `null`.
	 */
	isMulti?: boolean;
	/** Offer a control that empties the field. @default true */
	isClearable?: boolean;
	placeholder?: string;
	/**
	 * Passed through to `BaseSelect`. The value, the options and the change and
	 * blur wiring belong to the field, so they are absent here rather than
	 * accepted and overridden.
	 */
	selectProps?: Omit<
		BaseSelectProps<O>,
		| "value"
		| "onChange"
		| "onBlur"
		| "options"
		| "isMulti"
		| "isClearable"
		| "placeholder"
		| "name"
		| "inputId"
		| "disabled"
	>;
}

function isGroup<O extends BaseOption>(
	entry: O | GroupBase<O>,
): entry is GroupBase<O> {
	return "options" in entry && Array.isArray(entry.options);
}

function flatten<O extends BaseOption>(options: BaseSelectFieldOptions<O>) {
	const byId = new Map<string, O>();
	for (const entry of options) {
		for (const option of isGroup(entry) ? entry.options : [entry]) {
			byId.set(option.id, option);
		}
	}
	return byId;
}

/**
 * The form value is the option's id — a string, or an array of them with
 * `isMulti` — so a schema reads `z.string()` and a payload carries the id.
 * An id with no option is shown as itself: visibly stale rather than blank.
 */
function toOptions<O extends BaseOption>(
	value: unknown,
	byId: Map<string, O>,
	isMulti: boolean,
): O | O[] | null {
	const find = (id: string) => byId.get(id) ?? ({ id, label: id } as O);
	if (isMulti) {
		return Array.isArray(value) ? value.map((id) => find(String(id))) : [];
	}
	return value == null || value === "" ? null : find(String(value));
}

/**
 * A form-bound `BaseSelect`: the select for a form whose options are already
 * in hand. Stores option ids, so the form value round-trips through a schema
 * and a payload unchanged.
 */
export function BaseSelectField<
	T extends FieldValues,
	O extends BaseOption = BaseOption,
>({
	ref,
	...props
}: BaseSelectFieldProps<T, O> & {
	ref?: React.Ref<SelectInstance<O, boolean, GroupBase<O>>>;
}) {
	const {
		name,
		label,
		options,
		isMulti = false,
		isClearable = true,
		placeholder,
		selectProps,
		readOnly,
		disabled,
		showDirtyState,
		...rest
	} = props;

	const byId = useMemo(() => flatten(options), [options]);

	return (
		<FormField<T>
			name={name}
			label={label}
			readOnly={readOnly}
			disabled={disabled}
			showDirtyState={showDirtyState}
			{...rest}
		>
			{(field, { isDirty }) => (
				<DescribedByContext.Provider value={field["aria-describedby"]}>
					<BaseSelect<O>
						{...selectProps}
						// Merge rather than override: RHF's field.ref is what makes
						// setFocus and focus-on-first-error reach this control.
						ref={mergeRefs(field.ref, ref)}
						name={field.name}
						inputId={name}
						options={options}
						isMulti={isMulti}
						isClearable={isClearable}
						placeholder={placeholder}
						disabled={disabled}
						value={toOptions(field.value, byId, isMulti)}
						onChange={(next: MultiValue<O> | SingleValue<O>) => {
							field.onChange(
								isMulti
									? (next as MultiValue<O>).map((o) => o.id)
									: ((next as SingleValue<O>)?.id ?? null),
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
			)}
		</FormField>
	);
}
(BaseSelectField as { displayName?: string }).displayName = "BaseSelectField";

/** The dirty tint the other `*Field`s put on their input, on the control. */
export function dirtyStyles<O extends BaseOption>(
	own: ChakraStylesConfig<O, boolean, GroupBase<O>> | undefined,
	isDirty: boolean,
): ChakraStylesConfig<O, boolean, GroupBase<O>> | undefined {
	if (!isDirty) return own;
	return {
		...own,
		control: (base, state) => ({
			...(own?.control ? own.control(base, state) : base),
			borderColor: "yellow.400",
			bg: "yellow.50",
		}),
	};
}
