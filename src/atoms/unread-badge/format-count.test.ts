import { describe, expect, it } from "vitest";
import { formatUnreadCount } from "./format-count";

/**
 * The cap/hide decision is the whole of UnreadBadge's logic, so it lives in a
 * pure function rather than inside the render path — `null` is the single
 * signal for "render nothing".
 */
describe("formatUnreadCount", () => {
	it("renders a plain count below the cap", () => {
		expect(formatUnreadCount(1, 99)).toBe("1");
		expect(formatUnreadCount(7, 99)).toBe("7");
		expect(formatUnreadCount(42, 99)).toBe("42");
	});

	it("renders the cap itself uncapped (99 is not 99+)", () => {
		expect(formatUnreadCount(99, 99)).toBe("99");
	});

	it("caps anything above max as `{max}+`", () => {
		expect(formatUnreadCount(100, 99)).toBe("99+");
		expect(formatUnreadCount(1284, 99)).toBe("99+");
	});

	it("honours a custom max", () => {
		expect(formatUnreadCount(9, 9)).toBe("9");
		expect(formatUnreadCount(10, 9)).toBe("9+");
	});

	it("returns null for zero and negative counts (nothing to show)", () => {
		expect(formatUnreadCount(0, 99)).toBeNull();
		expect(formatUnreadCount(-1, 99)).toBeNull();
	});

	it("returns null for non-finite counts instead of rendering NaN", () => {
		expect(formatUnreadCount(Number.NaN, 99)).toBeNull();
		expect(formatUnreadCount(Number.POSITIVE_INFINITY, 99)).toBeNull();
	});

	it("floors fractional counts rather than printing a decimal", () => {
		expect(formatUnreadCount(3.7, 99)).toBe("3");
		// Floors below 1 — a fraction of a message is not an unread message.
		expect(formatUnreadCount(0.4, 99)).toBeNull();
	});

	it("clamps a nonsensical max to 1 so the cap label stays meaningful", () => {
		expect(formatUnreadCount(5, 0)).toBe("1+");
		expect(formatUnreadCount(5, -3)).toBe("1+");
	});

	it("never caps when max is infinite", () => {
		expect(formatUnreadCount(4321, Number.POSITIVE_INFINITY)).toBe("4321");
	});
});
