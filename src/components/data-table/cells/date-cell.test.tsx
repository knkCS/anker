import { ChakraProvider } from "@chakra-ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import i18next, { type i18n as I18n } from "i18next";
import type React from "react";
import { I18nextProvider, initReactI18next, setI18n } from "react-i18next";
import { afterEach, describe, expect, it } from "vitest";
import system from "../../../theme";
import { DateCell } from "./date-cell";

const wrap = (ui: React.ReactElement) =>
	render(<ChakraProvider value={system}>{ui}</ChakraProvider>);

async function uiLanguage(lng: string): Promise<I18n> {
	const i18n = i18next.createInstance();
	await i18n.use(initReactI18next).init({ lng, resources: {} });
	return i18n;
}

afterEach(() => {
	setI18n(undefined as never);
});

describe("DateCell", () => {
	it("is English when no UI language is set", () => {
		wrap(<DateCell value="2026-02-28" />);
		expect(screen.getByText("Feb 28, 2026")).toBeInTheDocument();
	});

	it("formats in the UI language a hub sets through react-i18next", async () => {
		await uiLanguage("de");
		wrap(<DateCell value="2026-02-28" />);
		expect(screen.getByText("28.02.2026")).toBeInTheDocument();
	});

	it("formats in the language of an I18nextProvider", async () => {
		const i18n = i18next.createInstance();
		await i18n.init({ lng: "de", resources: {} });
		wrap(
			<I18nextProvider i18n={i18n}>
				<DateCell value="2026-02-28" />
			</I18nextProvider>,
		);
		expect(screen.getByText("28.02.2026")).toBeInTheDocument();
	});

	it("follows a language switch", async () => {
		const i18n = await uiLanguage("en");
		wrap(<DateCell value="2026-02-28" />);
		expect(screen.getByText("Feb 28, 2026")).toBeInTheDocument();
		await act(() => i18n.changeLanguage("de"));
		expect(screen.getByText("28.02.2026")).toBeInTheDocument();
	});

	it("lets an explicit locale win", async () => {
		await uiLanguage("de");
		wrap(<DateCell value="2026-02-28" locale="en" />);
		expect(screen.getByText("Feb 28, 2026")).toBeInTheDocument();
	});

	it("keeps a custom dayjs format as given", async () => {
		await uiLanguage("de");
		wrap(<DateCell value="2025-11-15T10:30:00" format="DD/MM/YYYY HH:mm" />);
		expect(screen.getByText("15/11/2025 10:30")).toBeInTheDocument();
	});

	describe("a date-only value", () => {
		const original = process.env.TZ;
		afterEach(() => {
			process.env.TZ = original;
		});

		it.each([
			"America/Los_Angeles",
			"UTC",
			"Pacific/Kiritimati",
		])("is the same day in %s", async (zone) => {
			process.env.TZ = zone;
			await uiLanguage("de");
			wrap(<DateCell value="2026-02-28" />);
			expect(screen.getByText("28.02.2026")).toBeInTheDocument();
		});
	});

	it("renders the empty value for null and never `Invalid Date` (#34)", async () => {
		await uiLanguage("de");
		const { container } = wrap(
			<>
				<DateCell value={null} />
				<DateCell value="not-a-date" />
			</>,
		);
		expect(screen.getAllByText("—")).toHaveLength(2);
		expect(container.textContent).not.toContain("Invalid Date");
	});

	it("shows the relative time with the date, in the UI language, in its tooltip (#33)", async () => {
		await uiLanguage("de");
		const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
		const day = new Intl.DateTimeFormat("de", { dateStyle: "medium" }).format(
			recent,
		);
		wrap(<DateCell value={recent} showRelative />);
		const trigger = screen.getByText("3 days ago");
		expect(screen.queryByText(day)).not.toBeInTheDocument();
		fireEvent.pointerMove(trigger);
		expect(
			await screen.findByText(day, undefined, { timeout: 2000 }),
		).toBeInTheDocument();
	});
});
