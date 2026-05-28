import { useFormContext } from "react-hook-form";
import { Box, HStack } from "../primitives/layout";
import { Text } from "../primitives/typography";

export interface DirtyCounterProps {
	/**
	 * Label template. The literal `{count}` is replaced with the dirty
	 * field count. @default "{count} ungespeicherte Änderungen"
	 */
	label?: string;
	/** Render nothing when no fields are dirty. @default true */
	hideWhenClean?: boolean;
}

export function DirtyCounter({
	label = "{count} ungespeicherte Änderungen",
	hideWhenClean = true,
}: DirtyCounterProps) {
	const ctx = useFormContext();
	const dirty = ctx
		? (ctx.formState.dirtyFields as Record<string, unknown>)
		: {};
	const count = Object.keys(dirty).length;
	if (count === 0 && hideWhenClean) return null;
	return (
		<HStack gap="2" fontSize="sm" color="yellow.700">
			<Box
				width="6px"
				height="6px"
				borderRadius="full"
				bg="yellow.500"
				aria-hidden
			/>
			<Text>{label.replace("{count}", String(count))}</Text>
		</HStack>
	);
}
DirtyCounter.displayName = "DirtyCounter";
