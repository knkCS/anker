import { configDefaults, defineConfig } from "vitest/config";

// Two projects, one `npm test`.
//
// `unit` is the suite as it always was: jsdom. jsdom lays nothing out, so a
// question about where something IS on the page — whether a cell stays inside
// its column, whether a table scrolls — passes there whatever the answer
// (#271). `layout` answers those in a real Chromium, driven by Playwright
// through vitest's browser mode: only `*.browser.test.tsx` files, and without
// `src/test/setup.ts`, whose shims fake what that project has for real.
//
// The browser is Playwright's own Chromium; `pretest` installs it when it is
// missing (a no-op when it is there), so CI and a fresh clone need no step of
// their own. It needs Chromium's usual system libraries on the machine.
const BROWSER_TESTS = "src/**/*.browser.test.tsx";

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "unit",
					environment: "jsdom",
					environmentOptions: {
						jsdom: {
							url: "http://localhost/",
						},
					},
					setupFiles: ["./src/test/setup.ts"],
					globals: true,
					css: false,
					passWithNoTests: true,
					exclude: [...configDefaults.exclude, BROWSER_TESTS],
					// Node 25 defines a global `localStorage` that only works with
					// `--localstorage-file`, and jsdom does not replace a global that
					// already exists, so tests would see Node's half-working object.
					// With Node's Web Storage off, jsdom's `localStorage` is the one in
					// place on every Node, as on CI (Node 22). Accepted by Node 22.4
					// and later (knkCS/odon#350).
					poolOptions: {
						forks: { execArgv: ["--no-experimental-webstorage"] },
					},
				},
			},
			{
				test: {
					name: "layout",
					include: [BROWSER_TESTS],
					browser: {
						enabled: true,
						provider: "playwright",
						headless: true,
						instances: [{ browser: "chromium" }],
						// A fixed viewport, so "the container is narrower than the
						// table" is the test's decision and not the machine's.
						viewport: { width: 1280, height: 900 },
					},
				},
			},
		],
	},
});
