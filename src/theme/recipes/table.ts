import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * FIX: Replaced `blue.50` in the hoverable variant body with `primary.50`
 * to use the primary palette consistently.
 */
export const tableTheme = defineSlotRecipe({
	slots: [
		"root",
		"header",
		"body",
		"footer",
		"row",
		"columnHeader",
		"cell",
		"caption",
	],
	base: {
		root: {
			whiteSpace: "nowrap",
			tableLayout: "fixed",
			textIndent: 0,
		},
		columnHeader: {
			py: 3,
			px: 3,
			textAlign: "start",
			fontSize: "xs",
			fontWeight: "600",
			textTransform: "uppercase",
			letterSpacing: "wider",
			color: "gray.500",
			bg: "gray.50",
			borderBottomWidth: "1px",
			borderColor: "border",
		},
		cell: {
			fontSize: "sm",
			py: 3,
			px: 3,
			whiteSpace: "nowrap",
			borderColor: "border",
		},
		row: {
			bg: "bg-surface",
			_hover: {
				bg: "gray.50",
			},
		},
	},
	variants: {
		variant: {
			line: {
				columnHeader: {
					borderBottomWidth: "1px",
					borderColor: "border",
				},
				cell: {
					borderBottomWidth: "1px",
					borderColor: "border",
				},
				row: {
					bg: "bg",
				},
			},
			striped: {
				body: {
					"& tr:nth-of-type(odd) td": {
						bg: "gray.50",
					},
				},
			},
			hoverable: {
				body: {
					"& tr:hover": {
						bg: "primary.50",
					},
				},
			},
		},
	},
	defaultVariants: {
		variant: "line",
	},
});
