import dayjs from "dayjs";
import calendarPlugin from "dayjs/plugin/calendar.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import utcPlugin from "dayjs/plugin/utc.js";
import type React from "react";
import type { DateType } from "./types";
import { formatMachineReadableDateTime } from "./utils/format-date-time-utils";
import {
	formatRelativeDateTime,
	formatRelativeToCurrentWeekDateTime,
} from "./utils/relative-date-time-utils";

dayjs.extend(utcPlugin);
dayjs.extend(relativeTime);
dayjs.extend(calendarPlugin);

export interface RelativeDateTimeProps {
	/**
	 * The date that will be displayed. It accepts a JS Date, an ISO8601 Timestamp string, or Unix Epoch Milliseconds number
	 */
	date: DateType;
	/**
	 * If a value is passed to baseDate, then the component will compare both dates and return the time between them.
	 * If no value is passed then the date will be compared to "now"
	 *
	 * @default "Now"
	 */
	baseDate?: DateType;
	/**
	 * Sets the date to be relative only if it is in the current week
	 * @default false
	 */
	isRelativeToCurrentWeek?: boolean;
}

export const RelativeDateTime: React.FC<RelativeDateTimeProps> = (props) => {
	const { date, baseDate, isRelativeToCurrentWeek, ...otherProps } = props;

	const now = new Date();
	const referenceDate = baseDate ?? now;
	const dayjsDate = dayjs(date);
	const machineReadableDate = formatMachineReadableDateTime(date);

	let relativeDate: string;

	if (isRelativeToCurrentWeek && !dayjsDate.isSame(referenceDate, "day")) {
		relativeDate = formatRelativeToCurrentWeekDateTime(date, referenceDate);
	} else {
		relativeDate = formatRelativeDateTime(date, referenceDate);
	}

	return (
		<time dateTime={machineReadableDate} {...otherProps}>
			{relativeDate}
		</time>
	);
};
RelativeDateTime.displayName = "RelativeDateTime";
