import type React from "react";
import { VStack } from "../../../primitives/layout";
import { emptyCellValue, truncateText } from "./cell-utils";
import { ClippedText, CutValue } from "./clipped-text";

export interface TruncatedTextCellProps {
	value: string | null | undefined;
	/**
	 * Cut the value after this many characters, with a `…` suffix. Without it
	 * the value is shortened only where its column ends.
	 */
	maxLength?: number;
	/**
	 * Optional secondary line rendered below the primary value in smaller,
	 * muted text (e.g. "created 2 days ago", target ID, contextual hint).
	 * Sub-text is one line, ends in `…` where its column ends and shows whole on
	 * hover; it is not affected by `maxLength`.
	 */
	subText?: React.ReactNode;
}

/**
 * A text value on one line. A value wider than its column ends in "…" at the
 * column's edge, and hovering it shows the whole value in anker's tooltip
 * (#361) — as does a value `maxLength` cut. A value that fits shows no
 * tooltip. Its `subText` line behaves the same way (#369).
 */
export const TruncatedTextCell: React.FC<TruncatedTextCellProps> = ({
	value,
	maxLength,
	subText,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	const isCut = maxLength != null && value.length > maxLength;
	const primary = (
		<ClippedText whole={value} cut={isCut}>
			{isCut ? (
				<CutValue display={truncateText(value, maxLength)} whole={value} />
			) : (
				value
			)}
		</ClippedText>
	);

	if (subText == null) return primary;

	return (
		<VStack align="start" gap={0} minW={0} maxW="full">
			{primary}
			<ClippedText
				whole={subText}
				lineProps={{ fontSize: "xs", color: "fg.muted" }}
			>
				{subText}
			</ClippedText>
		</VStack>
	);
};
TruncatedTextCell.displayName = "TruncatedTextCell";
