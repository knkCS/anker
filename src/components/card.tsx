import { Card, type CardRootProps } from "@chakra-ui/react";

export interface CardProps extends CardRootProps {
	children: React.ReactNode;
	/** Maximum width of the card. Defaults to "full". */
	maxW?: CardRootProps["maxW"];
}

export const CardRoot: React.FC<CardProps> = ({
	maxW = "full",
	children,
	...props
}) => {
	return (
		<Card.Root w="full" maxW={maxW} bg="bg-surface" margin="0 auto" {...props}>
			<Card.Body height="full" overflow="hidden">
				{children}
			</Card.Body>
		</Card.Root>
	);
};
