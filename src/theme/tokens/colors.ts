/**
 * Raw color scales for the design system.
 *
 * `primary` is the UI blue (optimized for web contrast/readability),
 * `secondary` is the brand orange (anchored to brand guideline #e9580c),
 * `gray` is a blue-tinted gray scale, and `brand` contains the exact
 * hex values from the knk Brand Guidelines (October 2021) for use in
 * branding elements like headers, logos, and about pages.
 *
 * NOTE: The primary UI blue (#2087d7) intentionally differs from the brand
 * guideline blue (#004576). The brand blue is a deep navy designed for print;
 * the UI blue is brighter for web accessibility and matches the existing Core app.
 */
const colors = {
	primary: {
		"50": { value: "#eff6fc" },
		"100": { value: "#d9eafa" },
		"200": { value: "#b8d6f5" },
		"300": { value: "#88baeb" },
		"400": { value: "#5995dc" },
		"500": { value: "#2f6fbf" },
		"600": { value: "#1c5aa8" },
		"700": { value: "#134788" },
		"800": { value: "#0f395d" },
		"900": { value: "#0a2740" },
		"950": { value: "#061a2c" },
	},
	secondary: {
		"50": { value: "#FEF0E6" },
		"100": { value: "#FCD9BF" },
		"200": { value: "#F9B888" },
		"300": { value: "#F59651" },
		"400": { value: "#F27726" },
		"500": { value: "#e9580c" },
		"600": { value: "#C54A0A" },
		"700": { value: "#9A3A08" },
		"800": { value: "#6F2A06" },
		"900": { value: "#441A03" },
	},
	// Exact brand guideline colors for branding elements (headers, logos, about pages).
	// See: knk Brand Guidelines, October 2021
	brand: {
		blue: { value: "#004576" },
		navy: { value: "#0f395d" },
		"light-blue": { value: "#6fa7d1" },
		orange: { value: "#e9580c" },
		gold: { value: "#f4b235" },
		"light-gray": { value: "#f2f2f2" },
	},
	// Blue-tinted gray
	gray: {
		"50": { value: "#f8fafc" },
		"100": { value: "#f1f5f9" },
		"200": { value: "#e2e8f0" },
		"300": { value: "#cbd5e1" },
		"400": { value: "#94a3b8" },
		"500": { value: "#64748b" },
		"600": { value: "#475569" },
		"700": { value: "#334155" },
		"800": { value: "#1e293b" },
		"900": { value: "#0f172a" },
	},
};

export default colors;
