import { NumberInput as ChakraNumberInput } from "@chakra-ui/react";
import type * as React from "react";

export interface NumberInputProps extends ChakraNumberInput.RootProps {
	showStepper?: boolean;
}

export const NumberInputRoot = function NumberInput({
	ref,
	...props
}: NumberInputProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { children, showStepper = true, ...rest } = props;
	return (
		<ChakraNumberInput.Root ref={ref} variant="outline" {...rest}>
			{children}
			{showStepper && (
				<ChakraNumberInput.Control>
					<ChakraNumberInput.IncrementTrigger />
					<ChakraNumberInput.DecrementTrigger />
				</ChakraNumberInput.Control>
			)}
		</ChakraNumberInput.Root>
	);
};
NumberInputRoot.displayName = "NumberInputRoot";

export const NumberInputField = ChakraNumberInput.Input;
NumberInputField.displayName = "NumberInputField";
export const NumberInputScrubber = ChakraNumberInput.Scrubber;
NumberInputScrubber.displayName = "NumberInputScrubber";
export const NumberInputLabel = ChakraNumberInput.Label;
NumberInputLabel.displayName = "NumberInputLabel";
