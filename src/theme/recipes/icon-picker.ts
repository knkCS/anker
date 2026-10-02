import { defineSlotRecipe } from "@chakra-ui/react";

/**
 * IconPicker: a trigger showing the chosen icon, and the popover panel with
 * search, category chips and the virtualised icon grid.
 *
 * Grid geometry is fixed and mirrored in `icon-picker.tsx` (`COLUMNS`,
 * `ROW_HEIGHT`, `HEADER_HEIGHT`): the virtualiser positions rows by those
 * numbers, so change them together. Cells are 44px outright — the WCAG 2.5.8
 * touch target met directly, as the reaction quick set does — eight to a row.
 *
 * The active cell (keyboard position, `data-active`) and the chosen one
 * (`aria-selected`) are marked differently so they never rest on one cue: the
 * focus-ring glow is the cursor, the soft `primary.subtle` tint the value
 * (never `bg-accent-subtle`, which is an inverted surface).
 */
export const iconPickerTheme = defineSlotRecipe({
	slots: [
		"root",
		"trigger",
		"triggerLabel",
		"panel",
		"search",
		"chips",
		"chip",
		"viewport",
		"header",
		"row",
		"option",
		"empty",
	],
	base: {
		root: {
			display: "inline-flex",
			alignItems: "center",
			gap: 1,
			maxWidth: "100%",
		},
		trigger: {
			display: "inline-flex",
			alignItems: "center",
			gap: 2,
			minWidth: "12rem",
			maxWidth: "100%",
			minHeight: "10",
			paddingInline: 3,
			borderWidth: "1px",
			borderColor: "border",
			borderRadius: "md",
			bg: "bg-surface",
			color: "default",
			fontSize: "sm",
			textAlign: "start",
			cursor: "pointer",
			transitionProperty: "common",
			transitionDuration: "fast",
			_hover: { borderColor: { base: "gray.300", _dark: "gray.600" } },
			_focusVisible: { boxShadow: "focus-ring", outline: "none" },
			_disabled: { opacity: 0.5, cursor: "not-allowed" },
			_invalid: { borderColor: "error" },
			"&[data-readonly]": { cursor: "default" },
			// The dirty tint every other `*Field` puts on its input, keyed off
			// the `data-dirty` that `FormField`'s Field.Root carries.
			'[data-dirty="true"] &': {
				borderColor: "yellow.400",
				bg: "yellow.50",
			},
		},
		triggerLabel: {
			flex: "1",
			minWidth: 0,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
			"&[data-placeholder]": { color: "muted" },
		},
		panel: {
			display: "flex",
			flexDirection: "column",
			gap: 2,
			// Eight 44px cells plus gaps, plus the panel's padding.
			width: "calc(8 * 44px + 7 * 4px + 2 * var(--chakra-spacing-3))",
			maxWidth: "calc(100vw - 2rem)",
			padding: 3,
		},
		search: {},
		chips: {
			display: "flex",
			gap: 1,
			overflowX: "auto",
			paddingBlock: 1,
			// The strip scrolls sideways; hide the bar, keep the scrolling.
			scrollbarWidth: "none",
		},
		chip: {
			flexShrink: 0,
			paddingInline: 2.5,
			minHeight: "7",
			borderRadius: "full",
			borderWidth: "1px",
			borderColor: "border",
			fontSize: "xs",
			whiteSpace: "nowrap",
			color: "muted",
			cursor: "pointer",
			_hover: { bg: "bg-subtle" },
			_focusVisible: { boxShadow: "focus-ring", outline: "none" },
			'&[aria-checked="true"]': {
				bg: "primary.subtle",
				borderColor: "primary.muted",
				color: "default",
				fontWeight: "medium",
			},
		},
		viewport: {
			height: "18rem",
			overflowY: "auto",
			position: "relative",
			borderRadius: "md",
			_focusVisible: { boxShadow: "focus-ring", outline: "none" },
		},
		header: {
			display: "flex",
			alignItems: "end",
			paddingBottom: 1,
			textStyle: "overline",
			color: "muted",
		},
		row: {
			display: "grid",
			gridTemplateColumns: "repeat(8, 44px)",
			gap: 1,
		},
		option: {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			width: "44px",
			height: "44px",
			borderRadius: "md",
			color: "default",
			cursor: "pointer",
			_hover: { bg: "bg-muted" },
			'&[aria-selected="true"]': {
				bg: "primary.subtle",
				color: "primary.fg",
			},
			"&[data-active]": {
				boxShadow: "focus-ring",
			},
		},
		empty: {
			paddingBlock: 8,
			textAlign: "center",
			color: "muted",
			fontSize: "sm",
		},
	},
});
