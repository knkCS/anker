import { DataList as ChakraDataList } from "@chakra-ui/react";
import type * as React from "react";

export interface DataListItemType {
	label: React.ReactNode;
	value: React.ReactNode;
}

export interface DataListProps extends ChakraDataList.RootProps {
	/** Items to render as label-value pairs. If provided, renders automatically. */
	items?: DataListItemType[];
}

export const DataList = function DataList({
	ref,
	...props
}: DataListProps & { ref?: React.Ref<HTMLDListElement> }) {
	const { items, children, ...rest } = props;
	return (
		<ChakraDataList.Root ref={ref} {...rest}>
			{items
				? items.map((item, i) => (
						<ChakraDataList.Item key={i}>
							<ChakraDataList.ItemLabel>{item.label}</ChakraDataList.ItemLabel>
							<ChakraDataList.ItemValue>{item.value}</ChakraDataList.ItemValue>
						</ChakraDataList.Item>
					))
				: children}
		</ChakraDataList.Root>
	);
};
DataList.displayName = "DataList";

// Pass-through exports for manual composition
export const DataListItem = ChakraDataList.Item;
DataListItem.displayName = "DataListItem";

export const DataListItemLabel = ChakraDataList.ItemLabel;
DataListItemLabel.displayName = "DataListItemLabel";

export const DataListItemValue = ChakraDataList.ItemValue;
DataListItemValue.displayName = "DataListItemValue";

export type DataListRootProps = ChakraDataList.RootProps;
