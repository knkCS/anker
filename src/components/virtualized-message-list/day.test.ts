import { describe, expect, it } from "vitest";
import { defaultFormatDayLabel } from "./day";

describe("defaultFormatDayLabel", () => {
	it("labels the current local day Today", () => {
		const now = new Date("2026-07-28T15:00:00");
		expect(defaultFormatDayLabel(new Date("2026-07-28T00:05:00"), now)).toBe(
			"Today",
		);
	});

	it("labels the previous calendar day Yesterday even minutes apart across midnight", () => {
		const now = new Date("2026-01-01T00:30:00");
		expect(defaultFormatDayLabel(new Date("2025-12-31T23:50:00"), now)).toBe(
			"Yesterday",
		);
	});

	it("labels a day further back with a dated string, not Today/Yesterday", () => {
		const now = new Date("2026-07-28T15:00:00");
		const label = defaultFormatDayLabel(new Date("2026-07-20T12:00:00"), now);
		expect(label).not.toBe("Today");
		expect(label).not.toBe("Yesterday");
		expect(label).toContain("2026");
	});

	it("labels a future day with a dated string", () => {
		const now = new Date("2026-07-28T15:00:00");
		const label = defaultFormatDayLabel(new Date("2026-07-29T09:00:00"), now);
		expect(label).not.toBe("Today");
		expect(label).not.toBe("Yesterday");
		expect(label).toContain("2026");
	});
});
