/**
 * Motion tokens for consistent animation timing across components.
 */
export const durations = {
	fast: { value: "150ms" },
	normal: { value: "200ms" },
	slow: { value: "300ms" },
	slower: { value: "400ms" },
	entrance: { value: "250ms" },
	exit: { value: "200ms" },
};

export const easings = {
	"ease-in": { value: "cubic-bezier(0.4, 0, 1, 1)" },
	"ease-out": { value: "cubic-bezier(0, 0, 0.2, 1)" },
	"ease-in-out": { value: "cubic-bezier(0.4, 0, 0.2, 1)" },
	spring: { value: "cubic-bezier(0.175, 0.885, 0.32, 1.275)" },
};

/**
 * Reusable keyframe definitions for component animations.
 * These are CSS keyframe strings intended for use in globalCss or recipes.
 */
export const keyframes = {
	fadeIn: {
		from: { opacity: 0 },
		to: { opacity: 1 },
	},
	fadeOut: {
		from: { opacity: 1 },
		to: { opacity: 0 },
	},
	slideUp: {
		from: { opacity: 0, transform: "translateY(4px)" },
		to: { opacity: 1, transform: "translateY(0)" },
	},
	slideDown: {
		from: { opacity: 0, transform: "translateY(-4px)" },
		to: { opacity: 1, transform: "translateY(0)" },
	},
	scaleIn: {
		from: { opacity: 0, transform: "scale(0.95)" },
		to: { opacity: 1, transform: "scale(1)" },
	},
};
