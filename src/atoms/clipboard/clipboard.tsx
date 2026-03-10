import {
	Clipboard as ChakraClipboard,
	IconButton,
	Input,
	type InputProps,
} from "@chakra-ui/react";
import { Check, Clipboard, Link } from "lucide-react";
import type * as React from "react";

export interface ClipboardButtonProps extends ChakraClipboard.RootProps {
	/** Label for the copy button. @default "Copy" */
	label?: string;
}

export const ClipboardButton = function ClipboardButton({
	ref,
	...props
}: ClipboardButtonProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { label = "Copy", ...rest } = props;
	return (
		<ChakraClipboard.Root ref={ref} {...rest}>
			<ChakraClipboard.Trigger asChild>
				<IconButton variant="ghost" size="sm" aria-label={label}>
					<ChakraClipboard.Indicator copied={<Check size={16} />}>
						<Clipboard size={16} />
					</ChakraClipboard.Indicator>
				</IconButton>
			</ChakraClipboard.Trigger>
		</ChakraClipboard.Root>
	);
};
ClipboardButton.displayName = "ClipboardButton";

export interface ClipboardInputProps extends ChakraClipboard.RootProps {
	/** Props passed to the input element. */
	inputProps?: InputProps;
	/** Label for the copy button. @default "Copy" */
	label?: string;
}

export const ClipboardInput = function ClipboardInput({
	ref,
	...props
}: ClipboardInputProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { inputProps, label = "Copy", ...rest } = props;
	return (
		<ChakraClipboard.Root ref={ref} {...rest}>
			<ChakraClipboard.Control>
				<ChakraClipboard.Input asChild>
					<Input readOnly {...inputProps} />
				</ChakraClipboard.Input>
				<ChakraClipboard.Trigger asChild>
					<IconButton variant="outline" size="sm" aria-label={label}>
						<ChakraClipboard.Indicator copied={<Check size={16} />}>
							<Clipboard size={16} />
						</ChakraClipboard.Indicator>
					</IconButton>
				</ChakraClipboard.Trigger>
			</ChakraClipboard.Control>
		</ChakraClipboard.Root>
	);
};
ClipboardInput.displayName = "ClipboardInput";

export interface ClipboardLinkProps extends ChakraClipboard.RootProps {
	/** Label for the copy link button. @default "Copy Link" */
	label?: string;
}

export const ClipboardLink = function ClipboardLink({
	ref,
	...props
}: ClipboardLinkProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { label = "Copy Link", ...rest } = props;
	return (
		<ChakraClipboard.Root ref={ref} {...rest}>
			<ChakraClipboard.Trigger asChild>
				<IconButton variant="ghost" size="xs" aria-label={label}>
					<ChakraClipboard.Indicator copied={<Check size={14} />}>
						<Link size={14} />
					</ChakraClipboard.Indicator>
				</IconButton>
			</ChakraClipboard.Trigger>
		</ChakraClipboard.Root>
	);
};
ClipboardLink.displayName = "ClipboardLink";
