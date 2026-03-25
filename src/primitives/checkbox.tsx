import { Checkbox as ChakraCheckbox } from "@chakra-ui/react";
import type * as React from "react";

export interface CheckboxProps extends ChakraCheckbox.RootProps {
	/** Checkbox label text or content. */
	children?: React.ReactNode;
	/** Additional props forwarded to the hidden input element. */
	inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
	/** Ref attached to the root element. */
	rootRef?: React.RefObject<HTMLLabelElement | null>;
}

export const Checkbox = function Checkbox({
	ref,
	...props
}: CheckboxProps & { ref?: React.Ref<HTMLInputElement> }) {
	const { children, inputProps, rootRef, ...rest } = props;
	return (
		<ChakraCheckbox.Root ref={rootRef} {...rest}>
			<ChakraCheckbox.HiddenInput ref={ref} {...inputProps} />
			<ChakraCheckbox.Control>
				<ChakraCheckbox.Indicator />
			</ChakraCheckbox.Control>
			{children != null && (
				<ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>
			)}
		</ChakraCheckbox.Root>
	);
};
Checkbox.displayName = "Checkbox";

export const CheckboxGroup = ChakraCheckbox.Group;
CheckboxGroup.displayName = "CheckboxGroup";
