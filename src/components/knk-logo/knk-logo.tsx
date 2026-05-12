// src/components/knk-logo/knk-logo.tsx
import { chakra, type HTMLChakraProps } from "@chakra-ui/react";
import rawKnkLogoSvg from "../../assets/knk-logo.svg";

// The SVG asset has hard-coded width/height attributes that win over CSS in
// some renderers. Strip them so the wrapper's `boxSize` is authoritative.
const knkLogoSvg = rawKnkLogoSvg
	.replace(/\swidth="[^"]*"/, "")
	.replace(/\sheight="[^"]*"/, "");

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
		flexShrink={0}
		filter={invert ? "brightness(0) invert(1)" : undefined}
		css={{
			"& svg": {
				width: "100%",
				height: "auto",
				display: "block",
			},
		}}
		// biome-ignore lint/security/noDangerouslySetInnerHtml: bundled brand asset, not user input
		dangerouslySetInnerHTML={{ __html: knkLogoSvg }}
		{...rest}
	/>
);

KnkLogo.displayName = "KnkLogo";
