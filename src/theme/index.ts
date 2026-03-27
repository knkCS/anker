import { createAnkerTheme } from "./create-theme";

const system = createAnkerTheme();

export type CustomTheme = typeof system;

export default system;

export { createAnkerTheme } from "./create-theme";
export type { ThemePreset } from "./presets";
export { defaultPreset } from "./presets";
// Re-export all tokens and utilities for consumer overrides
export {
	colors,
	durations,
	easings,
	fonts,
	keyframes,
	radii,
	semanticTokens,
	space,
	textStyles,
	zIndex,
} from "./tokens";
export { getColor, transparentize } from "./utils";
