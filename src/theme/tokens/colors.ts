/**
 * Raw color scales for the design system.
 *
 * `primary` is the brand blue, `secondary` is the brand orange,
 * and `gray` is a blue-tinted gray scale.
 *
 * NOTE: The Core monolith had a duplicate `blue` scale in semantic tokens
 * that was identical to `primary`. That duplication is intentionally removed
 * here --- `primary` IS the blue.
 */
const colors = {
	primary: {
		"50": { value: "#f1f7fe" },
		"100": { value: "#e2effc" },
		"200": { value: "#bfddf8" },
		"300": { value: "#87c1f2" },
		"400": { value: "#48a3e8" },
		"500": { value: "#2087d7" },
		"600": { value: "#126ab7" },
		"700": { value: "#105595" },
		"800": { value: "#11497b" },
		"900": { value: "#143e66" },
		"950": { value: "#0d2744" },
	},
	secondary: {
		"50": { value: "#F8D6BC" },
		"100": { value: "#F6CAA9" },
		"200": { value: "#F2B484" },
		"300": { value: "#EE9D5F" },
		"400": { value: "#EA863A" },
		"500": { value: "#E47018" },
		"600": { value: "#B15713" },
		"700": { value: "#7E3E0D" },
		"800": { value: "#4C2508" },
		"900": { value: "#190C03" },
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
