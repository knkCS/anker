import type React from "react";
import { useCallback, useRef } from "react";
import { VStack } from "../../../primitives/layout";
import { Tooltip } from "../../../primitives/tooltip";
import { Text } from "../../../primitives/typography";
import { emptyCellValue, truncateText } from "./cell-utils";

export interface TruncatedTextCellProps {
	value: string | null | undefined;
	/**
	 * Cut the value after this many characters, with a `…` suffix. Without it
	 * the value is shortened only where its column ends.
	 */
	maxLength?: number;
	/**
	 * Optional secondary line rendered below the primary value in smaller,
	 * muted text (e.g. "created 2 days ago", target ID, contextual hint).
	 * Sub-text is `lineClamp={1}` and is not affected by `maxLength`.
	 */
	subText?: React.ReactNode;
}

/** Whether `el` draws less of its text than it holds: CSS cut it with "…". */
function isClipped(el: HTMLElement | null): boolean {
	return el != null && el.scrollWidth > el.clientWidth;
}

/**
 * A text value on one line. A value wider than its column ends in "…" at the
 * column's edge, and hovering it shows the whole value in anker's tooltip
 * (#361) — as does a value `maxLength` cut. A value that fits shows no
 * tooltip.
 */
export const TruncatedTextCell: React.FC<TruncatedTextCellProps> = ({
	value,
	maxLength,
	subText,
}) => {
	// Chakra types `Text`'s ref as a paragraph's, though it renders a span here.
	const textRef = useRef<HTMLParagraphElement>(null);
	const isCut = value != null && maxLength != null && value.length > maxLength;

	// A value that fits must never open the tooltip, so the pointer events
	// that would open it are stopped before zag sees them: its trigger
	// handlers return on `defaultPrevented`, and React runs these capture
	// handlers on the same element first. A controlled `open={false}` does
	// not hold: zag's closed state opens straight away, ignoring `open`, when
	// another tooltip is still visible — moving from a cut cell to one that
	// fits showed the fitting one's tooltip too (caught in Chromium, #361).
	//
	// Whether the value is clipped is asked on hover, not watched: a table
	// holds hundreds of these cells, and a ResizeObserver on each would
	// measure them all on every resize to answer a question only a hover
	// asks.
	const suppressIfWhole = useCallback(
		(event: React.PointerEvent) => {
			if (!isCut && !isClipped(textRef.current)) event.preventDefault();
		},
		[isCut],
	);

	if (value == null) return <span>{emptyCellValue}</span>;
	const display = isCut ? truncateText(value, maxLength) : value;
	const primary = (
		<Tooltip
			content={value}
			contentProps={{
				maxW: "md",
				whiteSpace: "normal",
				wordBreak: "break-word",
			}}
		>
			{/* `display: block` and `maxW="full"` let the line take its column's
			    width and no more, so `text-overflow` has an edge to cut at —
			    also inside the subText stack, whose `align="start"` would
			    otherwise size the line to its whole text. */}
			<Text
				as="span"
				ref={textRef}
				onPointerMoveCapture={suppressIfWhole}
				onPointerOverCapture={suppressIfWhole}
				display="block"
				maxW="full"
				overflow="hidden"
				textOverflow="ellipsis"
				whiteSpace="nowrap"
			>
				{isCut ? (
					// `maxLength` cut the text itself, so a screen reader would hear
					// only the cut value: the tooltip describes the trigger only while
					// it is open, and a non-focusable span never opens it from the
					// keyboard. It reads the whole value instead (the `title` this
					// replaced did that).
					<>
						<span aria-hidden="true">{display}</span>
						<Text as="span" srOnly>
							{value}
						</Text>
					</>
				) : (
					display
				)}
			</Text>
		</Tooltip>
	);

	if (subText == null) return primary;

	return (
		<VStack align="start" gap={0} minW={0} maxW="full">
			{primary}
			<Text fontSize="xs" color="fg.muted" lineClamp={1}>
				{subText}
			</Text>
		</VStack>
	);
};
TruncatedTextCell.displayName = "TruncatedTextCell";
