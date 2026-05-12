// src/components/knk-logo/knk-logo.tsx
import { chakra, type HTMLChakraProps } from "@chakra-ui/react";
import knkLogoUrl from "../../assets/knk-logo.svg";

export interface KnkLogoProps
	extends Omit<HTMLChakraProps<"img">, "as" | "src" | "alt" | "invert"> {
	/** Pixel or token size; controls width. Default 48. */
	boxSize?: number | string;
	/**
	 * When true, applies a CSS filter to render the logo in white,
	 * suitable for dark backgrounds like the primary-colored sidebar.
	 */
	invert?: boolean;
	/** Override the default "knkcms" alt text. */
	alt?: string;
}

/**
 * KnkLogo renders the knkcms brand mark via an <img> referencing the
 * SVG asset. Use the `invert` prop on dark backgrounds (e.g. the
 * primary-colored sidebar) until the source SVG is rewritten to use
 * `currentColor` for fills.
 */
export const KnkLogo = ({
	boxSize = 48,
	invert = false,
	alt = "knkcms",
	...rest
}: KnkLogoProps) => (
	<chakra.img
		src={knkLogoUrl}
		alt={alt}
		width={boxSize}
		height="auto"
		filter={invert ? "brightness(0) invert(1)" : undefined}
		{...rest}
	/>
);

KnkLogo.displayName = "KnkLogo";
