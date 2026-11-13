// Value and time formatters for chart axes and tooltips. Like every value
// anker formats itself, they write in the UI language: a `locale` when given,
// else the language a hub set through react-i18next, else English
// (`src/utils/ui-locale.ts`). The language is read when a value is formatted,
// so a formatter created once follows a language switch.
import { resolveUiLocale } from "../utils/ui-locale";
import type { ChartFormatter, ChartValue } from "./types";

/** A locale to format in, on top of the Intl options. */
interface LocaleOption {
	/** Format in this locale instead of the UI language. */
	locale?: string;
}

export type NumberFormatterOptions = Intl.NumberFormatOptions & LocaleOption;
export type TimeFormatterOptions = Intl.DateTimeFormatOptions & LocaleOption;

/** Caches one Intl formatter per locale, so an axis does not build one per tick. */
function perLocale<T>(make: (locale: string) => T): (locale: string) => T {
	const cache = new Map<string, T>();
	return (locale) => {
		let found = cache.get(locale);
		if (!found) {
			found = make(locale);
			cache.set(locale, found);
		}
		return found;
	};
}

/**
 * A formatter for numbers — counts, currency, percentages — with
 * `Intl.NumberFormat` options: `numberFormatter({ style: "currency", currency:
 * "EUR" })`, `numberFormatter({ style: "percent" })` (which reads 0.42 as 42 %).
 * A value that is no number is shown as it is.
 */
export function numberFormatter(
	options: NumberFormatterOptions = {},
): ChartFormatter {
	const { locale, ...intl } = options;
	const get = perLocale((l) => new Intl.NumberFormat(l, intl));
	return (value: ChartValue) => {
		const n = typeof value === "number" ? value : Number(value);
		if (value instanceof Date || value === "" || !Number.isFinite(n)) {
			return String(value);
		}
		return get(resolveUiLocale(locale)).format(n);
	};
}

/**
 * Reads a time value — epoch milliseconds, a `Date`, or a string `Date`
 * parses (ISO) — as epoch milliseconds; `undefined` when it is no time.
 */
export function toTime(value: unknown): number | undefined {
	if (typeof value === "number")
		return Number.isFinite(value) ? value : undefined;
	if (value instanceof Date) {
		const t = value.getTime();
		return Number.isNaN(t) ? undefined : t;
	}
	if (typeof value === "string") {
		const t = Date.parse(value);
		return Number.isNaN(t) ? undefined : t;
	}
	return undefined;
}

/**
 * A formatter for points in time with `Intl.DateTimeFormat` options:
 * `timeFormatter({ hour: "2-digit", minute: "2-digit" })`. Reads epoch
 * milliseconds, `Date`s and ISO strings; anything else is shown as it is.
 * Without options it shows hours and minutes.
 */
export function timeFormatter(
	options: TimeFormatterOptions = {},
): ChartFormatter {
	const { locale, ...rest } = options;
	const intl: Intl.DateTimeFormatOptions =
		Object.keys(rest).length > 0
			? rest
			: { hour: "2-digit", minute: "2-digit" };
	const get = perLocale((l) => new Intl.DateTimeFormat(l, intl));
	return (value: ChartValue) => {
		const t = toTime(value);
		if (t === undefined) return String(value);
		return get(resolveUiLocale(locale)).format(t);
	};
}
