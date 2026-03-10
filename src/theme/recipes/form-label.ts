import { defineRecipe } from "@chakra-ui/react";

export default defineRecipe({
	base: {
		color: "emphasized",
		mb: "1.5",
		fontSize: "sm",
	},
	variants: {
		size: {
			sm: {
				_peerPlaceholderShown: {
					fontSize: "sm",
					top: "1.5",
					left: "4",
				},
			},
			md: {
				_peerPlaceholderShown: {
					fontSize: "md",
					top: "2",
					left: "4",
				},
			},
			lg: {
				_peerPlaceholderShown: {
					fontSize: "lg",
					top: "2.5",
					left: "4",
				},
			},
		},
		variant: {
			inline: {
				margin: 0,
				minW: "2xs",
			},
			floating: {
				position: "absolute",
				transition: "all 0.12s ease-in",
				pointerEvents: "none",
				top: "-27px",
				left: "0",
				_peerPlaceholderShown: {
					fontWeight: "normal",
					color: "subtle",
				},
				_peerFocus: {
					fontSize: "sm",
					fontWeight: "medium",
					top: "-27px",
					left: "0",
					color: "muted",
				},
			},
		},
	},
	defaultVariants: {
		size: "md",
	},
});
