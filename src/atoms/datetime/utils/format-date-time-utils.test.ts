import i18next from "i18next";
import { initReactI18next, setI18n } from "react-i18next";
import { afterEach, describe, expect, it } from "vitest";
import { formatDate, formatDateAndTime } from "./format-date-time-utils";

// A local date-time, so no format here depends on the machine's time zone.
const at = new Date(2021, 7, 17, 15, 45, 7);

async function uiLanguage(lng: string) {
	const i18n = i18next.createInstance();
	await i18n.use(initReactI18next).init({ lng, resources: {} });
	return i18n;
}

afterEach(() => {
	setI18n(undefined as never);
});

describe("formatDateAndTime in English", () => {
	it("formats a day as the language's medium date (changed from `DD MMM YYYY`)", () => {
		expect(formatDateAndTime("2026-02-28", "day", "en")).toBe("Feb 28, 2026");
		expect(formatDate(at)).toBe("Aug 17, 2021");
	});

	it("keeps the other formats' English output", () => {
		expect(formatDateAndTime(at, "full", "en")).toBe(
			"Tue, 17 Aug 2021 at 3:45 PM",
		);
		expect(formatDateAndTime(at, "fullWithSeconds", "en")).toBe(
			"Tue, 17 Aug 2021 at 3:45:07 PM",
		);
		expect(formatDateAndTime(at, "weekday", "en")).toBe("Tue, 17 Aug");
		expect(formatDateAndTime(at, "time", "en")).toBe("3:45 PM");
	});

	it("is English when no locale is given and no UI language is set", () => {
		expect(formatDateAndTime(at, "day")).toBe("Aug 17, 2021");
		expect(formatDateAndTime(at)).toBe("Tue, 17 Aug 2021 at 3:45 PM");
	});
});

describe("formatDateAndTime in German", () => {
	it("formats every format in the language", () => {
		expect(formatDateAndTime("2026-02-28", "day", "de")).toBe("28.02.2026");
		expect(formatDateAndTime(at, "full", "de")).toBe("Di., 17.08.2021, 15:45");
		expect(formatDateAndTime(at, "fullWithSeconds", "de")).toBe(
			"Di., 17.08.2021, 15:45:07",
		);
		expect(formatDateAndTime(at, "weekday", "de")).toBe("Di., 17.08.");
		expect(formatDateAndTime(at, "time", "de")).toBe("15:45");
	});

	it("follows the UI language when no locale is given", async () => {
		const i18n = await uiLanguage("de");
		expect(formatDateAndTime("2026-02-28", "day")).toBe("28.02.2026");
		await i18n.changeLanguage("en");
		expect(formatDateAndTime("2026-02-28", "day")).toBe("Feb 28, 2026");
	});

	it("lets an explicit locale win over the UI language", async () => {
		await uiLanguage("de");
		expect(formatDateAndTime("2026-02-28", "day", "en")).toBe("Feb 28, 2026");
	});

	it("falls back to English for a language Intl does not know", () => {
		expect(formatDateAndTime("2026-02-28", "day", "cimode")).toBe(
			"Feb 28, 2026",
		);
		expect(formatDateAndTime("2026-02-28", "day", "not a locale")).toBe(
			"Feb 28, 2026",
		);
	});
});

describe("a date-only value", () => {
	const zones = [
		"America/Los_Angeles",
		"UTC",
		"Europe/Berlin",
		"Pacific/Kiritimati",
	];
	const original = process.env.TZ;
	afterEach(() => {
		process.env.TZ = original;
	});

	it.each(zones)("is the same day in %s", (zone) => {
		process.env.TZ = zone;
		expect(formatDateAndTime("2026-02-28", "day", "de")).toBe("28.02.2026");
		expect(formatDateAndTime("2026-02-28", "day", "en")).toBe("Feb 28, 2026");
		expect(formatDateAndTime("2026-02-28", "weekday", "de")).toBe(
			"Sa., 28.02.",
		);
	});
});

describe("an invalid value", () => {
	it("still reads `Invalid Date`", () => {
		expect(formatDateAndTime("not-a-date", "day", "de")).toBe("Invalid Date");
		expect(formatDateAndTime("not-a-date", "full", "en")).toBe("Invalid Date");
	});
});
