import { Accordion as ChakraAccordion } from "@chakra-ui/react";
import type * as React from "react";

export interface AccordionItemProps extends ChakraAccordion.ItemProps {
	/** The trigger label shown in the accordion header. */
	label: React.ReactNode;
	/** Content revealed when the item is expanded. */
	children: React.ReactNode;
}

export const AccordionItem = function AccordionItem({
	ref,
	...props
}: AccordionItemProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { label, children, ...rest } = props;
	return (
		<ChakraAccordion.Item ref={ref} {...rest}>
			<ChakraAccordion.ItemTrigger>
				{label}
				<ChakraAccordion.ItemIndicator />
			</ChakraAccordion.ItemTrigger>
			<ChakraAccordion.ItemContent>
				<ChakraAccordion.ItemBody>{children}</ChakraAccordion.ItemBody>
			</ChakraAccordion.ItemContent>
		</ChakraAccordion.Item>
	);
};
AccordionItem.displayName = "AccordionItem";

// Pass-through exports for composition
export const AccordionRoot = ChakraAccordion.Root;
AccordionRoot.displayName = "AccordionRoot";

export type AccordionRootProps = ChakraAccordion.RootProps;
