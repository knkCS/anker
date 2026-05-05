import type React from "react";
import { VStack } from "../../../primitives/layout";
import { Text } from "../../../primitives/typography";
import { emptyCellValue, truncateText } from "./cell-utils";

export interface TruncatedTextCellProps {
	value: string | null | undefined;
	maxLength?: number;
	/**
	 * Optional secondary line rendered below the primary value in smaller,
	 * muted text (e.g. "created 2 days ago", target ID, contextual hint).
	 * Sub-text is `lineClamp={1}` and is not affected by `maxLength`.
	 */
	subText?: React.ReactNode;
}

export const TruncatedTextCell: React.FC<TruncatedTextCellProps> = ({
	value,
	maxLength,
	subText,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const isTruncated = maxLength != null && value.length > maxLength;
	const display = isTruncated ? truncateText(value, maxLength) : value;
	const primary = (
		<span title={isTruncated ? value : undefined}>{display}</span>
	);

	if (subText == null) return primary;

	return (
		<VStack align="start" gap={0}>
			{primary}
			<Text fontSize="xs" color="fg.muted" lineClamp={1}>
				{subText}
			</Text>
		</VStack>
	);
};
TruncatedTextCell.displayName = "TruncatedTextCell";
