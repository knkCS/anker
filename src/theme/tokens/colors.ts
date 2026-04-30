/**
 * Raw color scales for the design system.
 *
 * `primary` is the UI blue (anchored at step 700 = #134788 — used for
 * action surfaces, links, focus rings). `secondary` is the brand orange
 * (anchored at step 600 = #e9580c — matches the brand guideline exactly).
 * `gray` is a blue-tinted neutral scale (~80% of UI pixels). `brand`
 * contains the exact hex values from the knk Brand Guidelines (October
 * 2021) for branding contexts like logos, headers, and about pages.
 *
 * `success`, `warning`, `danger`, `info` are explicit status palettes
 * owned by anker (rather than inheriting Chakra's defaults), so consumers
 * get stable status colors regardless of Chakra version.
 *
 * NOTE: The brand-guideline blue (#004576) lives at `primary.800`. The
 * action anchor (`primary.700` = #134788) is one step lighter for web
 * legibility — the original navy is too heavy as a CTA.
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
		"50": { value: "#fff5ed" },
		"100": { value: "#ffe6d4" },
		"200": { value: "#ffc8a8" },
		"300": { value: "#ffa170" },
		"400": { value: "#ff7c41" },
		"500": { value: "#f25f1c" },
		"600": { value: "#e9580c" },
		"700": { value: "#b73806" },
		"800": { value: "#912e0d" },
		"900": { value: "#762a0e" },
		"950": { value: "#411208" },
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
		"950": { value: "#020617" },
	},
	success: {
		"50": { value: "#ecfdf5" },
		"100": { value: "#d1fae5" },
		"500": { value: "#10b981" },
		"600": { value: "#059669" },
		"700": { value: "#047857" },
	},
	warning: {
		"50": { value: "#fffbeb" },
		"100": { value: "#fef3c7" },
		"500": { value: "#f59e0b" },
		"600": { value: "#d97706" },
		"700": { value: "#b45309" },
	},
	danger: {
		"50": { value: "#fef2f2" },
		"100": { value: "#fee2e2" },
		"500": { value: "#ef4444" },
		"600": { value: "#dc2626" },
		"700": { value: "#b91c1c" },
	},
	info: {
		"50": { value: "#eff6fc" },
		"100": { value: "#d9eafa" },
		"500": { value: "#2f6fbf" },
		"600": { value: "#1c5aa8" },
		"700": { value: "#134788" },
	},
};

export default colors;
