import { type CardRootProps, Card as ChakraCard } from "@chakra-ui/react";
import type React from "react";
import { Heading } from "../primitives/typography";

export interface CardProps extends Omit<CardRootProps, "title"> {
	maxW?: CardRootProps["maxW"];
	/** Card title rendered in Card.Header. */
	title?: React.ReactNode;
	/** Custom header content. Overrides title if both provided. */
	header?: React.ReactNode;
	/** Footer content rendered in Card.Footer. */
	footer?: React.ReactNode;
	children: React.ReactNode;
}

export const Card = ({
	ref,
	maxW = "full",
	title,
	header,
	footer,
	children,
	...props
}: CardProps & { ref?: React.Ref<HTMLDivElement> }) => {
	return (
		<ChakraCard.Root
			ref={ref}
			bg="bg-surface"
			w="full"
			height="full"
			maxW={maxW}
			marginInline="auto"
			overflow="hidden"
			{...props}
		>
			{(header || title) && (
				<ChakraCard.Header>
					{header ?? <Heading size="md">{title}</Heading>}
				</ChakraCard.Header>
			)}
			<ChakraCard.Body overflow="hidden">{children}</ChakraCard.Body>
			{footer && <ChakraCard.Footer>{footer}</ChakraCard.Footer>}
		</ChakraCard.Root>
	);
};
Card.displayName = "Card";
