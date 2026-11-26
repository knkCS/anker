import { describe, expect, it } from "vitest";
import { browserApi } from "./browser-api-port";

describe("browserApi", () => {
	it("keeps vitest's default port when ACP_BROWSER_TEST_PORT is unset or empty", () => {
		expect(browserApi({})).toBeUndefined();
		expect(browserApi({ ACP_BROWSER_TEST_PORT: "" })).toBeUndefined();
	});

	it("binds the browser API on the port an agent run's sandbox keeps for it", () => {
		expect(browserApi({ ACP_BROWSER_TEST_PORT: "20019" })).toEqual({
			port: 20019,
			strictPort: true,
		});
	});

	it("fails on a malformed port rather than ignoring it", () => {
		expect(() => browserApi({ ACP_BROWSER_TEST_PORT: "abc" })).toThrow(
			/ACP_BROWSER_TEST_PORT/,
		);
		expect(() => browserApi({ ACP_BROWSER_TEST_PORT: "70000" })).toThrow(
			/ACP_BROWSER_TEST_PORT/,
		);
	});
});
