import { PinInput as ChakraPinInput } from "@chakra-ui/react";
import type * as React from "react";

export interface PinInputProps
	extends Omit<ChakraPinInput.RootProps, "children"> {
	/** Number of input fields. @default 4 */
	length?: number;
}

export const PinInput = function PinInput({
	ref,
	...props
}: PinInputProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { length = 4, ...rest } = props;
	return (
		<ChakraPinInput.Root ref={ref} {...rest}>
			<ChakraPinInput.HiddenInput />
			<ChakraPinInput.Control>
				{Array.from({ length }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: index is the stable identity for pin input fields
					<ChakraPinInput.Input key={i} index={i} />
				))}
			</ChakraPinInput.Control>
		</ChakraPinInput.Root>
	);
};
PinInput.displayName = "PinInput";
