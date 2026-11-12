/**
 * Semantic tokens for colors and shadows.
 *
 * These map abstract names (bg-canvas, accent, border, etc.) to raw color
 * scale values, with automatic light/dark mode variants.
 *
 * Cross-token references must use {colors.X} brace syntax so Chakra v3
 * emits them as `var(--chakra-colors-X)` references. Bare strings like
 * `"gray.50"` are stored verbatim into the CSS custom property and yield
 * invalid CSS at runtime.
 */
import { statusPaletteTokens } from "./status-palettes";

const semanticTokens = {
	colors: {
		"bg-canvas": {
			value: { base: "{colors.gray.50}", _dark: "{colors.gray.900}" },
		},
		"bg-surface": {
			value: { base: "{colors.white}", _dark: "{colors.gray.800}" },
		},
		"bg-subtle": {
			value: { base: "{colors.gray.50}", _dark: "{colors.gray.700}" },
		},
		"bg-muted": {
			value: { base: "{colors.gray.100}", _dark: "{colors.gray.600}" },
		},
		default: {
			value: { base: "{colors.gray.900}", _dark: "{colors.white}" },
		},
		inverted: {
			value: { base: "{colors.white}", _dark: "{colors.gray.900}" },
		},
		emphasized: {
			value: { base: "{colors.gray.700}", _dark: "{colors.gray.100}" },
		},
		muted: {
			value: { base: "{colors.gray.600}", _dark: "{colors.gray.300}" },
		},
		subtle: {
			value: { base: "{colors.gray.500}", _dark: "{colors.gray.400}" },
		},
		border: {
			value: { base: "{colors.gray.200}", _dark: "{colors.gray.700}" },
		},
		// A border that must stay visible on a sunken surface (`bg-canvas`)
		// in both modes — e.g. a quiet Kanban card's dashes — where `border`
		// (gray.700 on gray.900 in dark mode) all but vanishes.
		"border-emphasized": {
			value: { base: "{colors.gray.300}", _dark: "{colors.gray.600}" },
		},
		"border-muted": {
			value: { base: "{colors.gray.100}", _dark: "{colors.gray.800}" },
		},
		accent: {
			value: { base: "{colors.primary.700}", _dark: "{colors.primary.300}" },
		},
		// `success` is both a flat token (`color="success"`, unchanged since
		// before the status palettes: Chakra's green 600 / 200) and the
		// `success` status palette. `DEFAULT` keeps the flat value — Chakra
		// registers it as `colors.success` itself — while the palette keys
		// sit beside it as `colors.success.solid` etc.
		success: {
			DEFAULT: {
				value: { base: "{colors.green.600}", _dark: "{colors.green.200}" },
			},
			...statusPaletteTokens.success,
		},
		error: {
			value: { base: "{colors.red.600}", _dark: "{colors.red.200}" },
		},
		// Status palettes for colorPalette="warning" / "danger" / "info" (and
		// "success" above) — see status-palettes.ts.
		warning: statusPaletteTokens.warning,
		danger: statusPaletteTokens.danger,
		info: statusPaletteTokens.info,
		// Color palette tokens for colorPalette="primary" (required by Chakra v3
		// for solid/subtle/outline/ghost button variants and other components)
		primary: {
			contrast: { value: { base: "white", _dark: "white" } },
			fg: {
				value: {
					base: "{colors.primary.700}",
					_dark: "{colors.primary.300}",
				},
			},
			subtle: {
				value: {
					base: "{colors.primary.100}",
					_dark: "{colors.primary.900}",
				},
			},
			muted: {
				value: {
					base: "{colors.primary.200}",
					_dark: "{colors.primary.800}",
				},
			},
			emphasized: {
				value: {
					base: "{colors.primary.300}",
					_dark: "{colors.primary.700}",
				},
			},
			// solid + focusRing intentionally keep dark at step 500 (not 700)
			// so the action color stays visible on dark canvas. This breaks the
			// "same step both modes" pattern that held before the 1.0 anchor
			// shift. Do not "fix" the asymmetry — see design-system spec §5.2.
			solid: {
				value: {
					base: "{colors.primary.700}",
					_dark: "{colors.primary.500}",
				},
			},
			focusRing: {
				value: {
					base: "{colors.primary.700}",
					_dark: "{colors.primary.500}",
				},
			},
			border: {
				value: {
					base: "{colors.primary.700}",
					_dark: "{colors.primary.400}",
				},
			},
		},
		// Secondary color palette tokens (for colorPalette="secondary")
		secondary: {
			contrast: { value: { base: "white", _dark: "white" } },
			fg: {
				value: {
					base: "{colors.secondary.700}",
					_dark: "{colors.secondary.300}",
				},
			},
			subtle: {
				value: {
					base: "{colors.secondary.100}",
					_dark: "{colors.secondary.900}",
				},
			},
			muted: {
				value: {
					base: "{colors.secondary.200}",
					_dark: "{colors.secondary.800}",
				},
			},
			emphasized: {
				value: {
					base: "{colors.secondary.300}",
					_dark: "{colors.secondary.700}",
				},
			},
			solid: {
				value: {
					base: "{colors.secondary.600}",
					_dark: "{colors.secondary.500}",
				},
			},
			focusRing: {
				value: {
					base: "{colors.secondary.600}",
					_dark: "{colors.secondary.500}",
				},
			},
			border: {
				value: {
					base: "{colors.secondary.600}",
					_dark: "{colors.secondary.400}",
				},
			},
		},
		// Accent surface tokens
		"bg-accent": {
			value: { base: "{colors.primary.700}", _dark: "{colors.primary.400}" },
		},
		"bg-accent-subtle": {
			value: { base: "{colors.primary.700}", _dark: "{colors.primary.500}" },
		},
		"bg-accent-muted": {
			value: { base: "{colors.primary.500}", _dark: "{colors.primary.600}" },
		},
		"on-accent": { value: { base: "white", _dark: "white" } },
		"on-accent-muted": {
			value: { base: "{colors.primary.50}", _dark: "{colors.primary.100}" },
		},
		"on-accent-subtle": {
			value: { base: "{colors.primary.100}", _dark: "{colors.primary.200}" },
		},
	},
	shadows: {
		xs: {
			value: {
				base: "0 1px 2px rgba(0, 0, 0, 0.04)",
				_dark: "0 1px 2px rgba(0, 0, 0, 0.4)",
			},
		},
		sm: {
			value: {
				base: "0 1px 2px rgba(0, 0, 0, 0.06)",
				_dark: "0 1px 2px rgba(0, 0, 0, 0.5)",
			},
		},
		md: {
			value: {
				base: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
				_dark:
					"0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
			},
		},
		lg: {
			value: {
				base: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
				_dark:
					"0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
			},
		},
		xl: {
			value: {
				base: "0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
				_dark:
					"0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
			},
		},
		"2xl": {
			value: {
				base: "0 25px 50px -12px rgba(0, 0, 0, 0.18)",
				_dark: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
			},
		},
		"focus-ring": {
			value: {
				base: "0 0 0 3px rgba(19, 71, 136, 0.18)",
				_dark: "0 0 0 3px rgba(47, 111, 191, 0.4)",
			},
		},
	},
	opacity: {
		disabled: { value: 0.4 },
		readOnly: { value: 0.8 },
	},
};

export default semanticTokens;
