// StatusBadge and StatusBadgeCell as a consumer sees them (#305), in a real
// browser.
//
// A consumer passes a `tone` and expects the matching status palette in light
// and dark mode; a consumer passing a data-driven `color` expects the badge
// to paint exactly that colour, as before tones existed. jsdom resolves
// neither CSS variables nor cascade layers, so the computed colours are asked
// of Chromium (the `layout` project of `vitest.config.ts`) and compared with
// the tokens they should resolve to.
import { readableColor } from "color2k";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { StatusBadgeCell } from "../../components/data-table/cells/status-badge-cell";
import { DarkMode, LightMode } from "../../primitives/color-mode";
import { Provider } from "../../primitives/provider";
import {
	type ColorMode,
	resolveColor,
	toComputedRgb,
} from "../../test/color-tokens";
import system from "../../theme";
import { STATUS_BADGE_TONES, StatusBadge, type StatusBadgeTone } from ".";

const MODES: ColorMode[] = ["light", "dark"];

/** The palette each tone paints with. */
const PALETTE: Record<StatusBadgeTone, string> = {
	success: "success",
	warning: "warning",
	danger: "danger",
	info: "info",
	neutral: "gray",
	accent: "primary",
};

const DATA_COLOR = "#7c3aed";

let root: Root | undefined;
let host: HTMLDivElement | undefined;

const frame = () =>
	new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

const id = (...parts: string[]) => parts.join("-");

/** A wrapper whose first child is the badge under test. */
function Labelled({
	testId,
	children,
}: {
	testId: string;
	children: ReactNode;
}) {
	return <span data-testid={testId}>{children}</span>;
}

function Matrix({ mode }: { mode: ColorMode }) {
	const items: ReactNode[] = [];
	for (const tone of STATUS_BADGE_TONES) {
		items.push(
			<Labelled key={id("tone", tone)} testId={id(mode, "tone", tone)}>
				<StatusBadge label={tone} tone={tone} />
			</Labelled>,
		);
	}
	items.push(
		<Labelled key="color" testId={id(mode, "color")}>
			<StatusBadge label="Custom" color={DATA_COLOR} />
		</Labelled>,
		<Labelled key="both" testId={id(mode, "both")}>
			<StatusBadge label="Both" tone="danger" color={DATA_COLOR} />
		</Labelled>,
		<Labelled key="none" testId={id(mode, "none")}>
			<StatusBadge label="None" />
		</Labelled>,
		// StatusBadgeCell
		<Labelled key="cell-tone" testId={id(mode, "cell-tone")}>
			<StatusBadgeCell value="failed" toneMap={{ failed: "danger" }} />
		</Labelled>,
		<Labelled key="cell-color" testId={id(mode, "cell-color")}>
			<StatusBadgeCell value="custom" colorMap={{ custom: DATA_COLOR }} />
		</Labelled>,
		<Labelled key="cell-both" testId={id(mode, "cell-both")}>
			<StatusBadgeCell
				value="failed"
				toneMap={{ failed: "danger" }}
				colorMap={{ failed: DATA_COLOR }}
			/>
		</Labelled>,
		<Labelled key="cell-fallback-tone" testId={id(mode, "cell-fallback-tone")}>
			<StatusBadgeCell
				value="unknown"
				toneMap={{ failed: "danger" }}
				fallbackTone="warning"
			/>
		</Labelled>,
		<Labelled
			key="cell-color-beats-fallback-tone"
			testId={id(mode, "cell-color-beats-fallback-tone")}
		>
			<StatusBadgeCell
				value="custom"
				colorMap={{ custom: DATA_COLOR }}
				fallbackTone="warning"
			/>
		</Labelled>,
		<Labelled
			key="cell-fallback-tone-beats-fallback-color"
			testId={id(mode, "cell-fallback-tone-beats-fallback-color")}
		>
			<StatusBadgeCell
				value="unknown"
				fallbackTone="info"
				fallbackColor={DATA_COLOR}
			/>
		</Labelled>,
		<Labelled
			key="cell-fallback-color"
			testId={id(mode, "cell-fallback-color")}
		>
			<StatusBadgeCell value="unknown" fallbackColor={DATA_COLOR} />
		</Labelled>,
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

function badge(testId: string): CSSStyleDeclaration {
	const wrapper = host?.querySelector<HTMLElement>(`[data-testid='${testId}']`);
	const found = wrapper?.firstElementChild as HTMLElement | null | undefined;
	if (!found) throw new Error(`no badge in ${testId}`);
	return getComputedStyle(found);
}

describe.each(MODES)("StatusBadge in %s mode", (mode) => {
	const token = (name: string) =>
		toComputedRgb(resolveColor(system, name, mode));
	const tonePaint = (tone: StatusBadgeTone) => ({
		bg: token(`${PALETTE[tone]}.subtle`),
		fg: token(`${PALETTE[tone]}.fg`),
	});

	it.each(
		STATUS_BADGE_TONES,
	)('tone="%s" paints its palette (subtle surface, fg text)', (tone) => {
		const s = badge(id(mode, "tone", tone));
		const { bg, fg } = tonePaint(tone);
		expect(s.backgroundColor).toBe(bg);
		expect(s.color).toBe(fg);
	});

	it("the status tones and neutral are five different paints", () => {
		// `accent` is the action hue, which `info` shares by design (#304:
		// "info stays the primary hue"), so the two paint alike.
		const tones = STATUS_BADGE_TONES.filter((tone) => tone !== "accent");
		const paints = new Set(
			tones.map((tone) => badge(id(mode, "tone", tone)).color),
		);
		expect(paints.size).toBe(tones.length);
	});

	it("color alone paints the colour with readable text, as before tones", () => {
		const s = badge(id(mode, "color"));
		expect(s.backgroundColor).toBe(toComputedRgb(DATA_COLOR));
		expect(s.color).toBe(toComputedRgb(readableColor(DATA_COLOR)));
	});

	it("tone wins over color", () => {
		const s = badge(id(mode, "both"));
		const { bg, fg } = tonePaint("danger");
		expect(s.backgroundColor).toBe(bg);
		expect(s.color).toBe(fg);
	});

	it("neither tone nor color paints neutral", () => {
		const s = badge(id(mode, "none"));
		const { bg, fg } = tonePaint("neutral");
		expect(s.backgroundColor).toBe(bg);
		expect(s.color).toBe(fg);
	});
});

describe.each(MODES)("StatusBadgeCell in %s mode", (mode) => {
	const token = (name: string) =>
		toComputedRgb(resolveColor(system, name, mode));
	const expectTone = (testId: string, palette: string) => {
		const s = badge(id(mode, testId));
		expect(s.backgroundColor).toBe(token(`${palette}.subtle`));
		expect(s.color).toBe(token(`${palette}.fg`));
	};
	const expectColor = (testId: string) => {
		const s = badge(id(mode, testId));
		expect(s.backgroundColor).toBe(toComputedRgb(DATA_COLOR));
		expect(s.color).toBe(toComputedRgb(readableColor(DATA_COLOR)));
	};

	it("toneMap maps the value to a tone", () => {
		expectTone("cell-tone", "danger");
	});

	it("colorMap maps the value to a colour, as before tones", () => {
		expectColor("cell-color");
	});

	it("tone wins when the value resolves through both maps", () => {
		expectTone("cell-both", "danger");
	});

	it("fallbackTone covers a value neither map knows", () => {
		expectTone("cell-fallback-tone", "warning");
	});

	it("a colorMap entry beats fallbackTone — a mapping beats a fallback", () => {
		expectColor("cell-color-beats-fallback-tone");
	});

	it("fallbackTone beats fallbackColor", () => {
		expectTone("cell-fallback-tone-beats-fallback-color", "info");
	});

	it("fallbackColor still covers an unknown value without tone props", () => {
		expectColor("cell-fallback-color");
	});
});
