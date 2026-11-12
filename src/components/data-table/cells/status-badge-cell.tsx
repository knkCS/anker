import type React from "react";
import { StatusBadge, type StatusBadgeTone } from "../../../atoms/status-badge";
import { VStack } from "../../../primitives/layout";
import { Tooltip } from "../../../primitives/tooltip";
import { Text } from "../../../primitives/typography";
import { emptyCellValue } from "./cell-utils";

export interface StatusBadgeCellProps {
	value: string | null | undefined;
	/**
	 * Maps a value to a `StatusBadge` tone — the preferred mapping for
	 * statuses known in code (`{ failed: "danger", done: "success" }`). Wins
	 * over `colorMap` when the value is in both.
	 */
	toneMap?: Record<string, StatusBadgeTone>;
	/**
	 * Tone for a value in neither `toneMap` nor `colorMap`. Wins over
	 * `fallbackColor`; a `colorMap` entry still wins over it.
	 */
	fallbackTone?: StatusBadgeTone;
	/**
	 * Maps a value to a **data-driven** colour (e.g. user-picked status
	 * colours from the backend). For statuses known in code use `toneMap`.
	 */
	colorMap?: Record<string, string>;
	/**
	 * Fallback colour when the value resolves through no map and no
	 * `fallbackTone` is given. @default "gray"
	 */
	fallbackColor?: string;
	/** Optional detail text displayed below the badge (e.g., error message). */
	detail?: string | null;
	/** Color for the detail text. @default "fg.error" */
	detailColor?: string;
	/**
	 * Optional tooltip content shown on hover/focus over the badge. Useful
	 * for status descriptions, full JSON payloads, or contextual hints that
	 * don't fit on the badge label.
	 */
	tooltip?: React.ReactNode;
	/**
	 * Optional icon rendered inline before the label inside the badge (e.g.
	 * a `lucide-react` glyph). A small gap separates it from the label.
	 */
	icon?: React.ReactNode;
}

export const StatusBadgeCell: React.FC<StatusBadgeCellProps> = ({
	value,
	toneMap,
	fallbackTone,
	colorMap,
	fallbackColor = "gray",
	detail,
	detailColor = "fg.error",
	tooltip,
	icon,
}) => {
	if (value == null) return <span>{emptyCellValue}</span>;
	// A mapping beats a fallback; within each level, a tone beats a colour.
	const mappedTone = toneMap?.[value];
	const mappedColor = colorMap?.[value];
	const tone = mappedTone ?? (mappedColor == null ? fallbackTone : undefined);
	const color = mappedColor ?? fallbackColor;
	let badge: React.ReactNode = (
		<StatusBadge label={value} tone={tone} color={color} icon={icon} />
	);

	if (tooltip != null) {
		badge = (
			<Tooltip content={tooltip} showArrow>
				<span>{badge}</span>
			</Tooltip>
		);
	}

	if (detail) {
		return (
			<VStack align="start" gap={0.5}>
				{badge}
				<Text fontSize="xs" color={detailColor}>
					{detail}
				</Text>
			</VStack>
		);
	}

	return <>{badge}</>;
};
StatusBadgeCell.displayName = "StatusBadgeCell";
