import dayjs from "dayjs";
import utcPlugin from "dayjs/plugin/utc.js";

dayjs.extend(utcPlugin);

import { resolveUiLocale } from "../../../utils/ui-locale";
import type { DateFormat, DateType } from "../types";

/**
 * How each format reads in a language other than English: the language's own
 * order and separators, from Intl.
 */
const fullOptions: Intl.DateTimeFormatOptions = {
	weekday: "short",
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
};

const intlOptions: Record<DateFormat, Intl.DateTimeFormatOptions> = {
	day: { dateStyle: "medium" }, // 17.08.2021
	weekday: { weekday: "short", day: "2-digit", month: "2-digit" }, // Di., 17.08.
	time: { timeStyle: "short" }, // 15:45
	full: fullOptions, // Di., 17.08.2021, 15:45
	fullWithSeconds: { ...fullOptions, second: "2-digit" }, // Di., 17.08.2021, 15:45:07
};

/**
 * How each format reads in English. Kept as the templates it always had, so an
 * English caller sees no change — except `day`, which is the language's medium
 * date in every language (`Aug 17, 2021`), the way `DateCell` shows a date.
 */
const englishTemplates: Record<Exclude<DateFormat, "day">, string> = {
	weekday: "ddd, DD MMM", // Tue, 17 Aug
	time: "h:mm A", // 3:45 PM
	full: "ddd, DD MMM YYYY [at] h:mm A", // Tue, 17 Aug 2021 at 3:45 PM
	fullWithSeconds: "ddd, DD MMM YYYY [at] h:mm:ss A", // Tue, 17 Aug 2021 at 3:45:07 PM
};

const isEnglish = (locale: string) => /^en(-|$)/i.test(locale);

/**
 * A function that will return a formatted date string in the UI language. The
 * format will depend on the option passed in the second argument.
 * By default, it will return a string with "full" format.
 *
 * The language is `locale` when given, else the UI language a hub sets through
 * react-i18next, else English. A date-only value (`YYYY-MM-DD`) is read as that
 * calendar day wherever the viewer is, never shifted by the time zone; any
 * other value is shown in the viewer's time zone.
 *
 * @param date - the date to be formatted
 * @param format - the desired format ("full", "fullWithSeconds", "day", "weekday", or "time")
 * @param locale - a BCP 47 locale overriding the UI language
 * @returns a formatted date, or "Invalid Date"
 *
 * @example
 * formatDateAndTime('2021-08-17T15:45:00', 'full', 'en') // "Tue, 17 Aug 2021 at 3:45 PM"
 * formatDateAndTime('2021-08-17T15:45:00', 'full', 'de') // "Di., 17.08.2021, 15:45"
 *
 * @example
 * formatDateAndTime('2021-08-17', 'day', 'en') // "Aug 17, 2021"
 * formatDateAndTime('2021-08-17', 'day', 'de') // "17.08.2021"
 */
export function formatDateAndTime(
	date: DateType,
	format: DateFormat = "full",
	locale?: string,
): string {
	// dayjs reads a date-only string as local midnight of that day, so the day
	// formatted in the local time zone is always the day the value names.
	const parsed = dayjs(date);
	if (!parsed.isValid()) return "Invalid Date";

	// The `?? …full` fallbacks keep the old `default:` branch for an untyped
	// caller passing an unknown format.
	const language = resolveUiLocale(locale);
	if (format !== "day" && isEnglish(language)) {
		return parsed.format(englishTemplates[format] ?? englishTemplates.full);
	}
	return new Intl.DateTimeFormat(
		language,
		intlOptions[format] ?? intlOptions.full,
	).format(parsed.toDate());
}

/**
 * A function that will return a machine-readable date string that should be passed to the `datetime` attribute of a `<time>` tag
 * By default, it will return a string with "YYYY-MM-DDTHH:mm:ss.SSS[Z]" format
 *
 * @param date - the date to be formatted
 * @param format - the desired format ("full", "day", "weekday", or "time")
 * @returns a formatted date
 *
 * @example
 * formatMachineReadableDateTime(date) // returns 2019-08-13T10:00:00.000Z
 *
 * @example
 * formatMachineReadableDateTime(date, 'day') // returns 2019-08-13
 */
export function formatMachineReadableDateTime(
	date: DateType,
	format: DateFormat = "full",
): string {
	let template: string;

	switch (format) {
		case "day":
			template = "YYYY-MM-DD"; // 2019-08-24
			break;
		case "weekday":
			template = "MM-DD"; // 08-24
			break;
		case "time":
			template = "HH:mm:ss.SSS"; // 15:44:07.000
			break;
		default:
			template = "YYYY-MM-DDTHH:mm:ss.SSS[Z]"; // 2019-08-24T15:44:07.000Z
	}

	return dayjs(date).utc().format(template);
}

/**
 * @example
 * > formatDate(date)
 * Aug 13, 2019 (English) · 13.08.2019 (German)
 */
export const formatDate = (date: DateType, locale?: string): string => {
	return formatDateAndTime(date, "day", locale);
};

/**
 * @example
 * > formatTime(date)
 * 8:00 AM (English) · 08:00 (German)
 */
export const formatTime = (date: DateType, locale?: string): string => {
	return formatDateAndTime(date, "time", locale);
};

/**
 * @example
 * > formatWeekdayDate(date)
 * Mon, 12 Aug (English) · Mo., 12.08. (German)
 */
export const formatWeekdayDate = (date: DateType, locale?: string): string => {
	return formatDateAndTime(date, "weekday", locale);
};
