import { RadioGroup as ChakraRadioGroup } from "@chakra-ui/react";
import type * as React from "react";

export interface RadioProps extends ChakraRadioGroup.ItemProps {
	/** Ref attached to the root element. */
	rootRef?: React.RefObject<HTMLDivElement | null>;
	/** Additional props forwarded to the hidden input element. */
	inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const Radio = function Radio({
	ref,
	...props
}: RadioProps & { ref?: React.Ref<HTMLInputElement> }) {
	const { children, inputProps, rootRef, ...rest } = props;
	return (
		<ChakraRadioGroup.Item ref={rootRef} {...rest}>
			<ChakraRadioGroup.ItemHiddenInput ref={ref} {...inputProps} />
			<ChakraRadioGroup.ItemIndicator />
			{children && (
				<ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>
			)}
		</ChakraRadioGroup.Item>
	);
};
Radio.displayName = "Radio";

export const RadioGroup = ChakraRadioGroup.Root;
RadioGroup.displayName = "RadioGroup";
