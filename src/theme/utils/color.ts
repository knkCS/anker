import { transparentize as setTransparency, toHex } from "color2k";

type Dict = { [key: string]: unknown };

/**
 * Get the color raw value from theme
 * @param theme - the theme object
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
 */
function get(obj: unknown, path: string, fallback: unknown): string {
	const keys = path.split(".");
	let current: unknown = obj;
	for (const key of keys) {
		if (current == null || typeof current !== "object") return String(fallback);
		current = (current as Record<string, unknown>)[key];
	}
	return current != null ? String(current) : String(fallback);
}
