import { transparentize as setTransparency, toHex } from "color2k";

type Dict = { [key: string]: unknown };

/**
 * Get the color raw value from a theme/token dictionary.
 *
 * Supports both Chakra v3 system token structure (where tokens are wrapped in
 * `{ value: "..." }`) and flat color dictionaries (e.g., `{ primary: { 500: "#2087d7" } }`).
 *
 * @param theme - the theme or token object
 * @param color - the color path ("green.200")
 * @param fallback - the fallback color
 */
export const getColor = (theme: Dict, color: string, fallback?: string) => {
	const hex = get(theme, `colors.${color}`, color);
	try {
		toHex(hex);
		return hex;
	} catch {
		// returning black to stay consistent with TinyColor behaviour so as to prevent breaking change
		return fallback ?? "#000000";
	}
};

/**
 * Make a color transparent
 * @param color - the color in hex, rgb, or hsl
 * @param opacity - the amount of opacity the color should have (0-1)
 */
export const transparentize =
	(color: string, opacity: number) => (theme: Dict) => {
		const raw = getColor(theme, color);
		return setTransparency(raw, 1 - opacity);
	};

/**
 * Minimal deep-get utility (replaces `dlv` dependency).
 *
 * Unwraps Chakra v3 `{ value: "..." }` token wrappers automatically.
 */
function get(obj: unknown, path: string, fallback: unknown): string {
	const keys = path.split(".");
	let current: unknown = obj;
	for (const key of keys) {
		if (current == null || typeof current !== "object") return String(fallback);
		current = (current as Record<string, unknown>)[key];
		// Unwrap Chakra v3 token wrapper { value: "..." }
		if (
			current != null &&
			typeof current === "object" &&
			"value" in (current as Record<string, unknown>)
		) {
			const val = (current as Record<string, unknown>).value;
			if (typeof val === "string") {
				current = val;
			}
		}
	}
	return current != null ? String(current) : String(fallback);
}
