import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCellValue } from "./cell-utils";
import { DeviceCell } from "./device-cell";
import { formatUserAgent, parseUserAgent } from "./user-agent";

const CHROME_MAC =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const SAFARI_IOS =
	"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const EDGE_WIN =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0";
const FIREFOX_LINUX =
	"Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0";
const ANDROID_CHROME =
	"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const OPERA =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/110.0.0.0";

function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("parseUserAgent", () => {
	it.each([
		[CHROME_MAC, { browser: "Chrome", os: "macOS" }],
		[SAFARI_IOS, { browser: "Safari", os: "iOS" }],
		[EDGE_WIN, { browser: "Edge", os: "Windows" }],
		[FIREFOX_LINUX, { browser: "Firefox", os: "Linux" }],
		[ANDROID_CHROME, { browser: "Chrome", os: "Android" }],
		[OPERA, { browser: "Opera", os: "Windows" }],
	])("parses %s", (ua, expected) => {
		expect(parseUserAgent(ua)).toEqual(expected);
	});

	it("returns Unknown / empty for empty input", () => {
		expect(parseUserAgent("")).toEqual({ browser: "Unknown", os: "" });
		expect(parseUserAgent(undefined)).toEqual({ browser: "Unknown", os: "" });
		expect(parseUserAgent(null)).toEqual({ browser: "Unknown", os: "" });
	});
});

describe("formatUserAgent", () => {
	it('formats with "browser on os" when os is known', () => {
		expect(formatUserAgent(CHROME_MAC)).toBe("Chrome on macOS");
	});

	it("returns the bare browser name when os is unknown", () => {
		expect(formatUserAgent("SomeWeirdBot/1.0")).toBe("Unknown");
	});
});

describe("DeviceCell", () => {
	it("renders the formatted label and the raw UA", () => {
		renderWithChakra(<DeviceCell userAgent={CHROME_MAC} />);
		expect(screen.getByText("Chrome on macOS")).toBeInTheDocument();
		expect(screen.getAllByText(CHROME_MAC).length).toBeGreaterThan(0);
	});

	it("renders the optional badge", () => {
		renderWithChakra(
			<DeviceCell
				userAgent={CHROME_MAC}
				badge={{ label: "Current", colorPalette: "green" }}
			/>,
		);
		expect(screen.getByText("Current")).toBeInTheDocument();
	});

	it("renders the empty cell value when userAgent is null", () => {
		renderWithChakra(<DeviceCell userAgent={null} />);
		expect(screen.getByText(emptyCellValue)).toBeInTheDocument();
	});

	it("renders the empty cell value when userAgent is empty string", () => {
		renderWithChakra(<DeviceCell userAgent="" />);
		expect(screen.getByText(emptyCellValue)).toBeInTheDocument();
	});
});
