import type { SystemContext } from "@chakra-ui/react";

/**
 * Colour-token helpers for tests: resolve a colour token of a Chakra system
 * to the hex it paints in light or dark mode, and measure WCAG contrast.
 *
 * Reusable by any test that pins what a token or a component looks like
 * (status palettes, StatusBadge tones, ContextRail.StatusIcon). Not shipped.
 */

export type ColorMode = "light" | "dark";

const REFERENCE = /^\{colors\.(.+)\}$/;

/**
 * The hex a colour token resolves to in `mode` — following semantic tokens
 * through their `base` / `_dark` conditions and `{colors.X}` references down
 * to a raw value. `name` is the token path without the category:
 * `"success.solid"`, `"gray.800"`, `"white"`.
 */
export function resolveColor(
	system: SystemContext,
	name: string,
	mode: ColorMode,
): string {
	const seen = new Set<string>();
	let current = name;
	for (;;) {
		if (seen.has(current)) {
			throw new Error(`colour token cycle at colors.${current}`);
		}
		seen.add(current);
		const token = system.tokens.getByName(`colors.${current}`);
		if (!token) throw new Error(`colors.${current} is not a token`);
		const conditions = token.extensions.conditions as
			| Record<string, string>
			| undefined;
		// anker writes `base` / `_dark`; Chakra's own palettes `_light` / `_dark`.
		const raw = conditions
			? mode === "dark"
				? (conditions._dark ?? conditions.base)
				: (conditions._light ?? conditions.base)
			: String(token.originalValue);
		const reference = REFERENCE.exec(raw);
		if (reference) {
			current = reference[1];
		} else if (/^#[0-9a-f]{3,8}$/i.test(raw)) {
			return normalizeHex(raw);
		} else {
			// A bare name ("white") names another colour token.
			current = raw;
		}
	}
}

/** The raw definition of a semantic colour token: `{ base, _dark }`. */
export function semanticConditions(
	system: SystemContext,
	name: string,
): Record<string, string> | undefined {
	return system.tokens.getByName(`colors.${name}`)?.extensions.conditions as
		| Record<string, string>
		| undefined;
}

function normalizeHex(hex: string): string {
	const h = hex.toLowerCase().slice(1);
	if (h.length === 3) {
		return `#${h
			.split("")
			.map((c) => c + c)
			.join("")}`;
	}
	return `#${h.slice(0, 6)}`;
}

function channels(hex: string): [number, number, number] {
	const h = normalizeHex(hex).slice(1);
	return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as [
		number,
		number,
		number,
	];
}

function luminance(hex: string): number {
	const [r, g, b] = channels(hex).map((c) => {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two hex colours (1 – 21). */
export function contrastRatio(a: string, b: string): number {
	const la = luminance(a);
	const lb = luminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** WCAG AA minimum for normal-size text. */
export const AA_TEXT = 4.5;
/** WCAG AA minimum for non-text UI components (borders, focus indicators). */
export const AA_NON_TEXT = 3;

/** A hex colour as the browser reports it in computed style: `rgb(r, g, b)`. */
export function toComputedRgb(hex: string): string {
	const [r, g, b] = channels(hex);
	return `rgb(${r}, ${g}, ${b})`;
}
