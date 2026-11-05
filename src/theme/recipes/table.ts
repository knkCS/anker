import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * A header's and a cell's padding on each side, a spacing token. One value,
 * because `DataTable` adds it to a column's `size` — the column is its
 * content's width plus this twice — and so must read the same one (#271).
 */
export const TABLE_CELL_PADDING_X = "3";

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
			px: TABLE_CELL_PADDING_X,
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
			px: TABLE_CELL_PADDING_X,
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
					bg: "bg-surface",
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
