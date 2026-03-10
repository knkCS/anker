import {
	Popover as ChakraPopover,
	IconButton,
	type IconButtonProps,
	Portal,
} from "@chakra-ui/react";
import { Info } from "lucide-react";
import type * as React from "react";

export interface ToggleTipProps extends ChakraPopover.RootProps {
	showArrow?: boolean;
	portalled?: boolean;
	portalRef?: React.RefObject<HTMLElement | null>;
	content?: React.ReactNode;
	contentProps?: ChakraPopover.ContentProps;
}

export const ToggleTip = function ToggleTip({
	ref,
	...props
}: ToggleTipProps & { ref?: React.Ref<HTMLDivElement> }) {
	const {
		showArrow,
		children,
		portalled = true,
		content,
		contentProps,
		portalRef,
		...rest
	} = props;

	return (
		<ChakraPopover.Root
			{...rest}
			positioning={{ ...rest.positioning, gutter: 4 }}
		>
			<ChakraPopover.Trigger asChild>{children}</ChakraPopover.Trigger>
			<Portal disabled={!portalled} container={portalRef}>
				<ChakraPopover.Positioner>
					<ChakraPopover.Content
						width="auto"
						px="2"
						py="1"
						textStyle="xs"
						rounded="sm"
						ref={ref}
						{...contentProps}
					>
						{showArrow && (
							<ChakraPopover.Arrow>
								<ChakraPopover.ArrowTip />
							</ChakraPopover.Arrow>
						)}
						{content}
					</ChakraPopover.Content>
				</ChakraPopover.Positioner>
			</Portal>
		</ChakraPopover.Root>
	);
};

export interface InfoTipProps extends Partial<ToggleTipProps> {
	buttonProps?: IconButtonProps | undefined;
}

export const InfoTip = function InfoTip({
	ref,
	...props
}: InfoTipProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { children, buttonProps, ...rest } = props;
	return (
		<ToggleTip content={children} {...rest} ref={ref}>
			<IconButton
				variant="ghost"
				aria-label="info"
				size="2xs"
				colorPalette="gray"
				{...buttonProps}
			>
				<Info />
			</IconButton>
		</ToggleTip>
	);
};
