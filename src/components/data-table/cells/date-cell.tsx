import dayjs from "dayjs";
import type React from "react";
import { formatDateAndTime } from "../../../atoms/datetime/utils/format-date-time-utils";
import { formatRelativeDateTime } from "../../../atoms/datetime/utils/relative-date-time-utils";
import { Tooltip } from "../../../primitives/tooltip";
import { useUiLocale } from "../../../utils/ui-locale";
import { emptyCellValue } from "./cell-utils";

export interface DateCellProps {
	value: string | Date | number | null | undefined;
	/**
	 * A Day.js format template. Omit it to show the date the way the UI
	 * language writes one ("Feb 28, 2026" in English, "28.02.2026" in German);
	 * a template is applied as given, in English.
	 */
	format?: string;
	/**
	 * A BCP 47 locale to format in. Omit it to follow the UI language a hub
	 * sets through react-i18next (English when none is set).
	 */
	locale?: string;
	showRelative?: boolean;
}

export const DateCell: React.FC<DateCellProps> = ({
	value,
	format,
	locale,
	showRelative,
}) => {
	const language = useUiLocale(locale);

	if (value == null) return <span>{emptyCellValue}</span>;

	const parsed = dayjs(value);
	if (!parsed.isValid()) return <span>{emptyCellValue}</span>;

	const formatted = format
		? parsed.format(format)
		: formatDateAndTime(value, "day", language);

	if (showRelative) {
		const relative = formatRelativeDateTime(value);
		return (
			<Tooltip content={formatted}>
				<span>{relative}</span>
			</Tooltip>
		);
	}

	return <span>{formatted}</span>;
};
DateCell.displayName = "DateCell";
