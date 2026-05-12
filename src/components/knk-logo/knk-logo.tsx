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
	/**
	 * Width of the rendered brand mark. Matches HTML element semantics:
	 * a number is interpreted as **pixels** (e.g. `56` → `"56px"`), a
	 * string is passed through as a CSS length (`"3.5rem"`, `"2em"`).
	 *
	 * Chakra spacing tokens are intentionally NOT accepted — the brand
	 * mark needs a precise size, not one tied to layout rhythm. (Chakra's
	 * sizes scale resolves `56` to `14rem`/224px, which is the trap this
	 * prop's contract exists to prevent.)
	 *
	 * Default `48` (= `48px`).
	 */
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
const toCssLength = (v: number | string): string =>
	typeof v === "number" ? `${v}px` : v;

export const KnkLogo = ({
	boxSize = 48,
	invert = false,
	alt = "knkcms",
	color,
	...rest
}: KnkLogoProps) => (
	<chakra.span
		display="inline-flex"
		alignItems="center"
		role="img"
		aria-label={alt}
		width={toCssLength(boxSize)}
		flexShrink={0}
		color={color ?? "primary.700"}
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
