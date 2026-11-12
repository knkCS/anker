import { readableColor } from "color2k";
import type React from "react";
import { useMemo } from "react";
import { Badge } from "../../primitives/badge";

/**
 * What a status badge means: the four status palettes (see
 * `docs/page-patterns.md` §11 Status palettes) plus `neutral` (a status with
 * no meaning beyond "it exists") and `accent` (the action hue).
 */
export const STATUS_BADGE_TONES = [
	"success",
	"warning",
	"danger",
	"info",
	"neutral",
	"accent",
] as const;

export type StatusBadgeTone = (typeof STATUS_BADGE_TONES)[number];

/** The `colorPalette` each tone paints with. */
const TONE_PALETTE: Record<StatusBadgeTone, string> = {
	success: "success",
	warning: "warning",
	danger: "danger",
	info: "info",
	neutral: "gray",
	accent: "primary",
};

export interface StatusBadgeProps {
	/** The display label for the badge */
	label: string;
	/**
	 * What the status means — the preferred API. Paints the matching palette
	 * (subtle surface, `fg` text), so the badge follows the theme in light and
	 * dark mode. Wins over `color` when both are given.
	 */
	tone?: StatusBadgeTone;
	/**
	 * A **data-driven** background colour only — e.g. a user-picked status
	 * colour stored in the backend (hex, e.g. `"#ff0000"`); the text colour is
	 * picked for readability. A status written in code takes `tone`: a hex
	 * literal breaks the no-hex rule. Ignored when `tone` is given; with
	 * neither, the badge is `neutral`.
	 */
	color?: string;
	/** Optional icon rendered inline before the label inside the badge. */
	icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
	const { label, tone, color, icon } = props;
	const dataColor = tone == null ? color : undefined;

	const textColor = useMemo(() => {
		if (dataColor == null) return undefined;
		try {
			return readableColor(dataColor);
		} catch {
			return "black";
		}
	}, [dataColor]);

	const paint =
		dataColor != null
			? { bg: dataColor, color: textColor }
			: {
					colorPalette: TONE_PALETTE[tone ?? "neutral"],
					variant: "subtle" as const,
				};

	return (
		<Badge {...paint} rounded="base" px={2} marginInlineStart={1} gap={1}>
			{icon}
			{label}
		</Badge>
	);
};

StatusBadge.displayName = "StatusBadge";
