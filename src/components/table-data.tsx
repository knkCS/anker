import { Text, type TextProps } from "@chakra-ui/react";
import { Tooltip } from "../primitives/tooltip";

export interface TableDataProps extends TextProps {
	children: React.ReactNode;
}

export const TableData: React.FC<TableDataProps> = ({
	children,
	...restProps
}) => {
	const textContent =
		typeof children === "string" || typeof children === "number"
			? String(children)
			: null;

	return (
		<Tooltip content={textContent ?? ""} disabled={!textContent}>
			<Text lineClamp={1} color="muted" {...restProps}>
				{children}
			</Text>
		</Tooltip>
	);
};
TableData.displayName = "TableData";
