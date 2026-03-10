import { HoverCard as ChakraHoverCard, Portal } from "@chakra-ui/react";
import type * as React from "react";

export interface HoverCardProps extends ChakraHoverCard.RootProps {
	/** Content displayed in the hover card. */
	content: React.ReactNode;
	/** Whether to show an arrow. @default false */
	showArrow?: boolean;
	/** Whether to render in a portal. @default true */
	portalled?: boolean;
	/** Container ref for portal. */
	portalRef?: React.RefObject<HTMLElement | null>;
	/** Props passed to the content element. */
	contentProps?: ChakraHoverCard.ContentProps;
}

export const HoverCard = function HoverCard(props: HoverCardProps) {
	const {
		content,
		showArrow,
		children,
		portalled = true,
		portalRef,
		contentProps,
		...rest
	} = props;
	return (
		<ChakraHoverCard.Root {...rest}>
			<ChakraHoverCard.Trigger asChild>{children}</ChakraHoverCard.Trigger>
			<Portal disabled={!portalled} container={portalRef}>
				<ChakraHoverCard.Positioner>
					<ChakraHoverCard.Content {...contentProps}>
						{showArrow && (
							<ChakraHoverCard.Arrow>
								<ChakraHoverCard.ArrowTip />
							</ChakraHoverCard.Arrow>
						)}
						{content}
					</ChakraHoverCard.Content>
				</ChakraHoverCard.Positioner>
			</Portal>
		</ChakraHoverCard.Root>
	);
};
HoverCard.displayName = "HoverCard";
