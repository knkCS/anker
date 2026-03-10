import { SegmentGroup as ChakraSegmentGroup } from "@chakra-ui/react";
import type * as React from "react";

export interface SegmentedControlItem {
	value: string;
	label: React.ReactNode;
	disabled?: boolean;
}

export interface SegmentedControlProps
	extends Omit<ChakraSegmentGroup.RootProps, "children"> {
	/** Items to render as segments. */
	items: Array<string | SegmentedControlItem>;
}

export const SegmentedControl = function SegmentedControl({
	ref,
	...props
}: SegmentedControlProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { items, ...rest } = props;
	return (
		<ChakraSegmentGroup.Root ref={ref} {...rest}>
			<ChakraSegmentGroup.Indicator />
			{items.map((item) => {
				const value = typeof item === "string" ? item : item.value;
				const label = typeof item === "string" ? item : item.label;
				const disabled = typeof item === "string" ? false : item.disabled;
				return (
					<ChakraSegmentGroup.Item
						key={value}
						value={value}
						disabled={disabled}
					>
						<ChakraSegmentGroup.ItemText>{label}</ChakraSegmentGroup.ItemText>
						<ChakraSegmentGroup.ItemHiddenInput />
					</ChakraSegmentGroup.Item>
				);
			})}
		</ChakraSegmentGroup.Root>
	);
};
SegmentedControl.displayName = "SegmentedControl";
