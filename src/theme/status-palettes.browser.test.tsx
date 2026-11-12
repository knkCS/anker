// Status palettes as a consumer sees them (#304), in a real browser.
//
// A consumer writes `colorPalette="success"` (or warning / danger / info) on
// a palette-aware component and expects status colours, in light and dark
// mode. jsdom resolves neither CSS variables nor cascade layers, so the
// computed colour each component paints is asked of Chromium (the `layout`
// project of `vitest.config.ts`) and compared with the palette token it
// should resolve to — external behaviour, not recipe internals. Before the
// palette tokens existed every one of these painted gray.
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Button } from "../atoms/button";
import { Alert } from "../primitives/alert";
import { Badge } from "../primitives/badge";
import { DarkMode, LightMode } from "../primitives/color-mode";
import { Progress } from "../primitives/progress";
import { Provider } from "../primitives/provider";
import {
	type ColorMode,
	resolveColor,
	toComputedRgb,
} from "../test/color-tokens";
import system from "./index";
import { STATUS_PALETTES } from "./tokens/status-palettes";

const MODES: ColorMode[] = ["light", "dark"];
const VARIANTS = ["solid", "subtle", "outline"] as const;

let root: Root | undefined;
let host: HTMLDivElement | undefined;

const frame = () =>
	new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

const id = (...parts: string[]) => parts.join("-");

function Matrix({ mode }: { mode: ColorMode }) {
	const items: ReactNode[] = [];
	for (const palette of STATUS_PALETTES) {
		for (const variant of VARIANTS) {
			items.push(
				<Badge
					key={id("badge", palette, variant)}
					data-testid={id(mode, "badge", palette, variant)}
					colorPalette={palette}
					variant={variant}
				>
					Badge
				</Badge>,
				<Button
					key={id("button", palette, variant)}
					data-testid={id(mode, "button", palette, variant)}
					colorPalette={palette}
					variant={variant}
				>
					Button
				</Button>,
				<Alert
					key={id("alert", palette, variant)}
					data-testid={id(mode, "alert", palette, variant)}
					colorPalette={palette}
					variant={variant}
					title="Alert"
				/>,
			);
		}
		for (const variant of ["outline", "subtle"] as const) {
			items.push(
				<Progress
					key={id("progress", palette, variant)}
					data-testid={id(mode, "progress", palette, variant)}
					colorPalette={palette}
					variant={variant}
					value={50}
				/>,
			);
		}
	}
	// Chakra's `status` picks Chakra's palette; page-patterns.md tells
	// consumers to keep `status` for the icon and pass anker's palette.
	items.push(
		<Alert
			key="alert-status-error"
			data-testid={id(mode, "alert", "status-error")}
			status="error"
			colorPalette="danger"
			title="Failed"
		/>,
	);
	const Wrap = mode === "dark" ? DarkMode : LightMode;
	return <Wrap>{items}</Wrap>;
}

beforeAll(async () => {
	host = document.createElement("div");
	document.body.appendChild(host);
	root = createRoot(host);
	await act(async () => {
		root?.render(
			<Provider forcedTheme="light">
				<Matrix mode="light" />
				<Matrix mode="dark" />
			</Provider>,
		);
	});
	await frame();
});

afterAll(() => {
	act(() => root?.unmount());
	host?.remove();
});

function el(testId: string, part?: string): HTMLElement {
	const found = host?.querySelector<HTMLElement>(`[data-testid='${testId}']`);
	if (!found) throw new Error(`no ${testId}`);
	if (!part) return found;
	const inner = found.querySelector<HTMLElement>(`[data-part='${part}']`);
	if (!inner) throw new Error(`no ${part} in ${testId}`);
	return inner;
}

const style = (node: HTMLElement) => getComputedStyle(node);

describe.each(MODES)("status palettes in %s mode", (mode) => {
	const token = (name: string) =>
		toComputedRgb(resolveColor(system, name, mode));

	it('an explicit colorPalette wins over Alert\'s status (status="error" colorPalette="danger")', () => {
		const s = style(el(id(mode, "alert", "status-error")));
		expect(s.backgroundColor).toBe(token("danger.subtle"));
		expect(s.color).toBe(token("danger.fg"));
	});

	describe.each(STATUS_PALETTES)('colorPalette="%s"', (palette) => {
		const solid = token(`${palette}.solid`);
		const contrast = token(`${palette}.contrast`);
		const subtle = token(`${palette}.subtle`);
		const fg = token(`${palette}.fg`);
		const muted = token(`${palette}.muted`);
		const border = token(`${palette}.border`);

		it("does not paint gray", () => {
			expect(solid).not.toBe(token("gray.solid"));
			expect(fg).not.toBe(token("gray.fg"));
		});

		it("Badge solid / subtle / outline", () => {
			const s = style(el(id(mode, "badge", palette, "solid")));
			expect(s.backgroundColor).toBe(solid);
			expect(s.color).toBe(contrast);

			const t = style(el(id(mode, "badge", palette, "subtle")));
			expect(t.backgroundColor).toBe(subtle);
			expect(t.color).toBe(fg);

			const o = style(el(id(mode, "badge", palette, "outline")));
			expect(o.color).toBe(fg);
			expect(o.boxShadow).toContain(border);
		});

		it("Button solid / subtle / outline", () => {
			const s = style(el(id(mode, "button", palette, "solid")));
			expect(s.backgroundColor).toBe(solid);
			expect(s.color).toBe(contrast);

			const t = style(el(id(mode, "button", palette, "subtle")));
			expect(t.backgroundColor).toBe(subtle);
			expect(t.color).toBe(fg);

			const o = style(el(id(mode, "button", palette, "outline")));
			expect(o.color).toBe(fg);
			expect(o.borderTopColor).toBe(border);
		});

		it("Alert solid / subtle / outline", () => {
			const s = style(el(id(mode, "alert", palette, "solid")));
			expect(s.backgroundColor).toBe(solid);
			expect(s.color).toBe(contrast);

			const t = style(el(id(mode, "alert", palette, "subtle")));
			expect(t.backgroundColor).toBe(subtle);
			expect(t.color).toBe(fg);

			const o = style(el(id(mode, "alert", palette, "outline")));
			expect(o.color).toBe(fg);
			expect(o.boxShadow).toContain(border);
		});

		it("Progress outline / subtle", () => {
			expect(
				style(el(id(mode, "progress", palette, "outline"), "range"))
					.backgroundColor,
			).toBe(solid);
			expect(
				style(el(id(mode, "progress", palette, "subtle"), "track"))
					.backgroundColor,
			).toBe(muted);
		});
	});
});
