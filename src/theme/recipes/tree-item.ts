import { defineSlotRecipe } from "@chakra-ui/react";

export default defineSlotRecipe({
	slots: [
		"treeItem",
		"treeItemElement",
		"treeItemToggle",
		"treeItemIcon",
		"treeItemContent",
		"treeItemLabel",
		"treeItemActions",
		"treeItemChildren",
	],
	base: {
		treeItem: {},
		treeItemElement: {
			height: "42px",
			display: "grid",
			gridTemplateColumns: "30px 24px 20px auto 50px",
			gridGap: "2px",
			alignItems: "center",
			alignContent: "center",
			padding: 0,
			fontSize: "xs",
			color: { base: "gray.700", _dark: "gray.300" },
			borderRadius: "base",
			_hover: {
				bg: { base: "gray.100", _dark: "gray.700" },
			},
			".is--no-checkbox &": {
				gridTemplateColumns: "30px 0 24px auto 50px",
			},
		},
		treeItemToggle: {
			width: "15px",
			height: "24px",
			lineHeight: "20px",
			textAlign: "center",
			position: "relative",
			cursor: "pointer",
			userSelect: "none",
			justifySelf: "center",
			_expanded: {
				color: "primary.400",
			},
		},
		treeItemIcon: {
			width: "45px",
			height: "22px",
			color: "primary.700",
			"&[aria-leaf=true],&[data-leaf]": {
				color: "gray.400",
			},
		},
		treeItemContent: {},
		treeItemLabel: {
			color: { base: "gray.700", _dark: "gray.300" },
		},
		treeItemActions: {
			textAlign: "end",
			marginInlineStart: "4px",
		},
		treeItemChildren: {
			position: "relative",
			paddingInlineStart: 12,
			_before: {
				content: '""',
				position: "absolute",
				insetInlineStart: "16px",
				height: "100%",
				width: "1px",
				bg: { base: "gray.200", _dark: "gray.600" },
			},
		},
	},
});
