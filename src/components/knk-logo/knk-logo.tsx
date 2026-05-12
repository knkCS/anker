// src/components/knk-logo/knk-logo.tsx
import { chakra, type HTMLChakraProps } from "@chakra-ui/react";
import knkLogoSvg from "../../assets/knk-logo.svg";

export interface KnkLogoProps
	extends Omit<
		HTMLChakraProps<"span">,
		"as" | "dangerouslySetInnerHTML" | "invert"
	> {
	/** Pixel or token size; controls width. Default 48. */
	boxSize?: number | string;
	/**
	 * When true, applies a CSS filter to render the logo in white,
	 * suitable for dark backgrounds like the primary-colored sidebar.
	 */
	invert?: boolean;
	/** Accessible label. Default "knkcms". */
	alt?: string;
}

/**
 * KnkLogo renders the knkcms brand mark by inlining the SVG into the
 * DOM (no image fetch, no data URL). This sidesteps both relative-URL
 * resolution issues across deep routes and CSP `img-src` restrictions
 * on data URIs.
 */
export const KnkLogo = ({
	boxSize = 48,
	invert = false,
	alt = "knkcms",
	...rest
}: KnkLogoProps) => (
	<chakra.span
		display="inline-flex"
		alignItems="center"
		role="img"
		aria-label={alt}
		width={boxSize}
		filter={invert ? "brightness(0) invert(1)" : undefined}
		css={{
			"& svg": {
				width: "100%",
				height: "auto",
				display: "block",
			},
		}}
		dangerouslySetInnerHTML={{ __html: knkLogoSvg }}
		{...rest}
	/>
);

KnkLogo.displayName = "KnkLogo";
