import { describe, expect, it } from "vitest";
import { numberFormatter, timeFormatter, toTime } from "./format";

describe("numberFormatter", () => {
	it("formats in the given locale", () => {
		expect(numberFormatter({ locale: "de" })(1234.5)).toBe("1.234,5");
		expect(numberFormatter({ locale: "en" })(1234.5)).toBe("1,234.5");
	});

	it("takes Intl options: currency and percent", () => {
		expect(
			numberFormatter({ locale: "en", style: "currency", currency: "USD" })(
				12.5,
			),
		).toBe("$12.50");
		expect(
			numberFormatter({
				locale: "en",
				style: "percent",
				maximumFractionDigits: 0,
			})(0.42),
		).toBe("42%");
	});

	it("falls back to English without a locale or UI language", () => {
		expect(numberFormatter()(1234.5)).toBe("1,234.5");
	});

	it("reads a numeric string and passes anything else through", () => {
		expect(numberFormatter({ locale: "en" })("2000")).toBe("2,000");
		expect(numberFormatter({ locale: "en" })("n/a")).toBe("n/a");
	});
});

describe("timeFormatter", () => {
	const at = Date.UTC(2026, 10, 13, 14, 5);

	it("formats epoch milliseconds, Dates and ISO strings alike", () => {
		const format = timeFormatter({
			locale: "en",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone: "UTC",
		});
		expect(format(at)).toBe("14:05");
		expect(format(new Date(at))).toBe("14:05");
		expect(format(new Date(at).toISOString())).toBe("14:05");
	});

	it("formats in the given locale", () => {
		const options = {
			day: "numeric",
			month: "short",
			timeZone: "UTC",
		} as const;
		expect(timeFormatter({ ...options, locale: "en" })(at)).toBe("Nov 13");
		expect(timeFormatter({ ...options, locale: "de" })(at)).toBe("13. Nov.");
	});

	it("passes a value that is no time through as text", () => {
		expect(timeFormatter({ locale: "en" })("yesterday")).toBe("yesterday");
	});
});

describe("toTime", () => {
	it("reads numbers, Dates and ISO strings as epoch milliseconds", () => {
		expect(toTime(5)).toBe(5);
		expect(toTime(new Date(7))).toBe(7);
		expect(toTime("1970-01-01T00:00:00.009Z")).toBe(9);
		expect(toTime("soon")).toBeUndefined();
	});
});
