import { Popover as ChakraPopover, Portal } from "@chakra-ui/react";
import type * as React from "react";

export type PopoverProps = ChakraPopover.RootProps;

export const Popover = function Popover(props: PopoverProps) {
	return <ChakraPopover.Root {...props}>{props.children}</ChakraPopover.Root>;
};
Popover.displayName = "Popover";

export const PopoverTrigger = ChakraPopover.Trigger;
PopoverTrigger.displayName = "PopoverTrigger";

export interface PopoverContentProps extends ChakraPopover.ContentProps {
	/** Whether to show an arrow. @default false */
	showArrow?: boolean;
	/** Whether to render in a portal. @default true */
	portalled?: boolean;
	/** Container ref for portal. */
	portalRef?: React.RefObject<HTMLElement | null>;
}

export const PopoverContent = function PopoverContent({
	ref,
	...props
}: PopoverContentProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { showArrow, portalled = true, portalRef, children, ...rest } = props;
	return (
		<Portal disabled={!portalled} container={portalRef}>
			<ChakraPopover.Positioner>
				<ChakraPopover.Content ref={ref} {...rest}>
					{showArrow && (
						<ChakraPopover.Arrow>
							<ChakraPopover.ArrowTip />
						</ChakraPopover.Arrow>
					)}
					{children}
				</ChakraPopover.Content>
			</ChakraPopover.Positioner>
		</Portal>
	);
};
PopoverContent.displayName = "PopoverContent";

export const PopoverHeader = ChakraPopover.Header;
PopoverHeader.displayName = "PopoverHeader";

export const PopoverBody = ChakraPopover.Body;
PopoverBody.displayName = "PopoverBody";

export const PopoverFooter = ChakraPopover.Footer;
PopoverFooter.displayName = "PopoverFooter";

export const PopoverCloseTrigger = ChakraPopover.CloseTrigger;
PopoverCloseTrigger.displayName = "PopoverCloseTrigger";

export const PopoverTitle = ChakraPopover.Title;
PopoverTitle.displayName = "PopoverTitle";

export const PopoverDescription = ChakraPopover.Description;
PopoverDescription.displayName = "PopoverDescription";
