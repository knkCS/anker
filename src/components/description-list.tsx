import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { Box, Flex } from "../primitives/layout";
import { Text } from "../primitives/typography";

export interface DescriptionListProps {
	orientation?: "horizontal" | "vertical";
	gap?: string;
	children: ReactNode;
}

interface DescriptionListContextShape {
	orientation: "horizontal" | "vertical";
}

const DescriptionListContext = createContext<DescriptionListContextShape>({
	orientation: "horizontal",
});

export function DescriptionList({
	orientation = "horizontal",
	gap = "3",
	children,
}: DescriptionListProps) {
	return (
		<DescriptionListContext.Provider value={{ orientation }}>
			<Box>
				<Flex direction="column" gap={gap}>
					{children}
				</Flex>
			</Box>
		</DescriptionListContext.Provider>
	);
}
DescriptionList.displayName = "DescriptionList";

export interface DescriptionListRowProps {
	label: ReactNode;
	mono?: boolean;
	children: ReactNode;
}

function DescriptionListRow({
	label,
	mono,
	children,
}: DescriptionListRowProps) {
	const { orientation } = useContext(DescriptionListContext);

	if (orientation === "vertical") {
		return (
			<Box>
				<Text fontSize="xs" color="muted" mb="0.5">
					{label}
				</Text>
				<Text
					fontSize="sm"
					fontFamily={mono ? "mono" : undefined}
					wordBreak="break-all"
				>
					{children}
				</Text>
			</Box>
		);
	}

	return (
		<Flex justify="space-between" align="baseline" gap="3">
			<Text color="muted" fontSize="sm">
				{label}
			</Text>
			<Text
				fontSize="sm"
				fontFamily={mono ? "mono" : undefined}
				textAlign="right"
				wordBreak="break-all"
			>
				{children}
			</Text>
		</Flex>
	);
}
DescriptionListRow.displayName = "DescriptionList.Row";

DescriptionList.Row = DescriptionListRow;
