import dayjs from "dayjs";
import type React from "react";
import { formatRelativeDateTime } from "../../../atoms/datetime/utils/relative-date-time-utils";
import { Tooltip } from "../../../primitives/tooltip";
import { emptyCellValue } from "./cell-utils";

export interface DateCellProps {
	value: string | Date | number | null | undefined;
	format?: string;
	showRelative?: boolean;
}

export const DateCell: React.FC<DateCellProps> = ({
	value,
	format = "MMM D, YYYY",
	showRelative,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;

	const formatted = dayjs(value).format(format);

	if (showRelative) {
		const relative = formatRelativeDateTime(value);
		return (
			<Tooltip content={relative}>
				<span>{formatted}</span>
			</Tooltip>
		);
	}

	return <span>{formatted}</span>;
};
DateCell.displayName = "DateCell";
