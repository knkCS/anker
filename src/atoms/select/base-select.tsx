import { Circle } from "@chakra-ui/react";
import {
	type ActionMeta,
	chakraComponents,
	type GroupBase,
	type MultiValue,
	type MultiValueProps,
	type OptionProps,
	type Props,
	Select,
	type SelectInstance,
	type SingleValue,
	type SingleValueProps,
} from "chakra-react-select";
import type React from "react";
import { Avatar } from "../../primitives/avatar";
import { HStack } from "../../primitives/layout";
import { Text } from "../../primitives/typography";
import type { BaseOption } from "./types";

export interface BaseSelectProps<T extends BaseOption>
	extends Omit<
		Props<T, boolean, GroupBase<T>>,
		"value" | "onChange" | "isLoading" | "isDisabled"
	> {
	value: T | T[] | null;
	onChange?: (
		newValue: MultiValue<T> | SingleValue<T>,
		actionMeta: ActionMeta<T>,
	) => void;
	loading?: boolean;
	disabled?: boolean;
}

const BaseSingleValue = <T extends BaseOption>({
	data,
	...props
}: SingleValueProps<T, boolean, GroupBase<T>>) => {
	return (
		<chakraComponents.SingleValue data={data} {...props}>
			<HStack gap={2}>
				{data.avatar && <Avatar name={data.avatar} size="xs" />}
				{data.color && <Circle bg={data.color} size={5} />}
				{data.icon && data.icon}
				<Text>{data.label}</Text>
			</HStack>
		</chakraComponents.SingleValue>
	);
};

const BaseMultiValue = <T extends BaseOption>({
	children,
	...props
}: MultiValueProps<T, boolean, GroupBase<T>>) => {
	const { data } = props;

	return (
		// @ts-expect-error -- strict mode: duplicate property
		<chakraComponents.MultiValue data={data} {...props}>
			<HStack gap={2}>
				{data.avatar && <Avatar name={data.avatar} size="xs" />}
				{data.color && <Circle bg={data.color} size={5} />}
				{data.icon && data.icon}
				<Text>{data.label}</Text>
			</HStack>
		</chakraComponents.MultiValue>
	);
};

const BaseSelectOption = <T extends BaseOption>({
	data,
	...props
}: OptionProps<T, boolean, GroupBase<T>>) => {
	return (
		<chakraComponents.Option data={data} {...props}>
			<HStack gap={2}>
				{data.avatar && <Avatar name={data.avatar} size="xs" />}
				{data.color && <Circle bg={data.color} size={5} />}
				{data.icon && data.icon}
				<Text>{data.label}</Text>
			</HStack>
		</chakraComponents.Option>
	);
};

const getSelectComponents = (
	variant?: string,
	customComponents?: Record<string, React.ComponentType<unknown>>,
) => ({
	...(variant === "link"
		? {
				DropdownIndicator: null,
				IndicatorSeparator: null,
			}
		: {}),
	SingleValue: BaseSingleValue,
	MultiValue: BaseMultiValue,
	Option: BaseSelectOption,
	...customComponents,
});

export const BaseSelect = <T extends BaseOption>({
	ref,
	value,
	onChange,
	options,
	isMulti = false,
	loading = false,
	disabled = false,
	isClearable = true,
	placeholder,
	menuPortalTarget = document.body,
	variant = "outline",
	styles,
	...restSelectProps
}: BaseSelectProps<T> & {
	ref?: React.Ref<SelectInstance<T, boolean, GroupBase<T>>>;
}) => {
	return (
		<Select<T, boolean, GroupBase<T>>
			{...restSelectProps}
			ref={ref}
			value={value}
			variant={variant}
			onChange={onChange}
			options={options}
			isMulti={isMulti}
			isLoading={loading}
			isDisabled={disabled}
			isClearable={isClearable}
			placeholder={placeholder}
			menuPortalTarget={menuPortalTarget}
			styles={{
				menuPortal: (provided) => ({
					...provided,
					zIndex: 1800,
					pointerEvents: "auto" as const,
				}),
				...styles,
			}}
			getOptionValue={(option) => option.id}
			getOptionLabel={(option) => option.label}
			components={getSelectComponents(
				variant as string,
				// @ts-expect-error -- strict mode: argument type
				restSelectProps.components,
			)}
		/>
	);
};
(BaseSelect as { displayName?: string }).displayName = "BaseSelect";
