import {
	Box,
	type BoxProps,
	Stack,
	type StackProps,
	type UseCheckboxGroupProps,
	useCheckboxGroup,
} from "@chakra-ui/react";
import React from "react";

type CheckboxCardGroupProps = StackProps & {
	defaultValue?: UseCheckboxGroupProps["defaultValue"];
	value?: UseCheckboxGroupProps["value"];
	onValueChange?: (value: string[]) => void;
};

export const CheckboxCardGroup = (props: CheckboxCardGroupProps) => {
	const { children, defaultValue, value, onValueChange, ...rest } = props;
	const group = useCheckboxGroup({
		defaultValue,
		value,
		onValueChange,
	});

	const cards = React.useMemo(
		() =>
			React.Children.toArray(children)
				.filter<React.ReactElement<RadioCardProps>>(React.isValidElement)
				.map((card) => {
					return React.cloneElement(card, {
						checkboxProps: group.getItemProps({
							value: card.props.value,
						}),
					});
				}),
		[children, group],
	);

	return <Stack {...rest}>{cards}</Stack>;
};

CheckboxCardGroup.displayName = "CheckboxCardGroup";

// Infer the item props type directly from the hook to avoid invalid imports
type CheckboxItemProps = ReturnType<
	ReturnType<typeof useCheckboxGroup>["getItemProps"]
>;

interface RadioCardProps extends BoxProps {
	value: string;
	checkboxProps?: CheckboxItemProps;
}

export const CheckboxCard = (props: RadioCardProps) => {
	const { checkboxProps, children, ...rest } = props;

	const id = React.useId();

	return (
		<Box
			cursor="pointer"
			css={{
				"& .focus-visible + [data-focus]": {
					boxShadow: "outline",
					zIndex: 1,
				},
			}}
			asChild
		>
			<label>
				<input type="checkbox" aria-labelledby={id} {...checkboxProps} />
				<Box {...rest}>
					<Stack direction="row">
						<Box flex="1" id={id}>
							{children}
						</Box>
					</Stack>
				</Box>
			</label>
		</Box>
	);
};

CheckboxCard.displayName = "CheckboxCard";
