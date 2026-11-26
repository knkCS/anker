import type React from "react";
import { useCallback, useRef } from "react";
import { Tooltip } from "../../../primitives/tooltip";
import { Code, Text } from "../../../primitives/typography";

/** Whether `el` draws less of its text than it holds: CSS cut it with "…". */
function isClipped(el: HTMLElement | null): boolean {
	return el != null && el.scrollWidth > el.clientWidth;
}

export interface ClippedTextProps {
	/** What the tooltip shows: the whole value. */
	whole: React.ReactNode;
	/** What the line shows; `whole` when the value was not cut beforehand. */
	children: React.ReactNode;
	/**
	 * The value was cut before rendering (a `maxLength`), so the tooltip opens
	 * whether or not CSS cuts the line as well.
	 */
	cut?: boolean;
	/** Render the line as anker's `Code` instead of text. */
	code?: boolean;
	/** Style props for the line (font size, colour). */
	lineProps?: React.ComponentProps<typeof Text>;
}

/**
 * One line of a cell's text (#361, #369). A line wider than its column ends
 * in "…" at the column's edge, and hovering it shows the whole value in
 * anker's tooltip. A line that fits shows no tooltip. Internal to the cells:
 * TruncatedTextCell's value and subText, SlugCell and CodeCell share it.
 */
export function ClippedText({
	whole,
	children,
	cut = false,
	code = false,
	lineProps,
}: ClippedTextProps): React.ReactElement {
	// Chakra types the ref as a paragraph's, though it renders a span here.
	const lineRef = useRef<HTMLParagraphElement>(null);

	// A line that fits must never open the tooltip, so the pointer events
	// that would open it are stopped before zag sees them: its trigger
	// handlers return on `defaultPrevented`, and React runs these capture
	// handlers on the same element first. A controlled `open={false}` does
	// not hold: zag's closed state opens straight away, ignoring `open`, when
	// another tooltip is still visible — moving from a cut cell to one that
	// fits showed the fitting one's tooltip too (caught in Chromium, #361).
	//
	// Whether the line is clipped is asked on hover, not watched: a table
	// holds hundreds of these cells, and a ResizeObserver on each would
	// measure them all on every resize to answer a question only a hover
	// asks.
	const suppressIfWhole = useCallback(
		(event: React.PointerEvent) => {
			if (!cut && !isClipped(lineRef.current)) event.preventDefault();
		},
		[cut],
	);

	// `display: block` and `maxW="full"` let the line take its column's
	// width and no more, so `text-overflow` has an edge to cut at — also
	// inside a stack whose `align="start"` would otherwise size the line to
	// its whole text.
	const line = {
		ref: lineRef,
		onPointerMoveCapture: suppressIfWhole,
		onPointerOverCapture: suppressIfWhole,
		display: "block",
		maxW: "full",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	} as const;

	return (
		<Tooltip
			content={whole}
			contentProps={{
				maxW: "md",
				whiteSpace: "normal",
				wordBreak: "break-word",
			}}
		>
			{code ? (
				<Code {...line} {...(lineProps as React.ComponentProps<typeof Code>)}>
					{children}
				</Code>
			) : (
				<Text as="span" {...line} {...lineProps}>
					{children}
				</Text>
			)}
		</Tooltip>
	);
}

/**
 * The line's content when a `maxLength` cut the value itself: a screen
 * reader hears the whole value (the tooltip describes the trigger only while
 * open, and a non-focusable span never opens it from the keyboard), sighted
 * readers the cut one.
 */
export function CutValue({
	display,
	whole,
}: {
	display: string;
	whole: string;
}): React.ReactElement {
	return (
		<>
			<span aria-hidden="true">{display}</span>
			<Text as="span" srOnly>
				{whole}
			</Text>
		</>
	);
}
