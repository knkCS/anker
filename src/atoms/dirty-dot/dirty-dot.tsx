import type { BoxProps } from "../../primitives/layout";
import { Box } from "../../primitives/layout";

export interface DirtyDotProps {
	/** Render nothing when false. @default true */
	active?: boolean;
	/** aria-label for screen readers. @default "ungespeicherte Änderungen" */
	label?: string;
	/** Box prop overrides (ml, color, size if anyone needs them). */
	boxProps?: BoxProps;
}

export function DirtyDot({
	active = true,
	label = "ungespeicherte Änderungen",
	boxProps,
}: DirtyDotProps) {
	if (!active) return null;
	return (
		<Box
			as="span"
			display="inline-block"
			width="6px"
			height="6px"
			bg="yellow.500"
			borderRadius="full"
			ml="2"
			aria-label={label}
			{...boxProps}
		/>
	);
}
DirtyDot.displayName = "DirtyDot";
