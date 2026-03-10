import { Switch as ChakraSwitch } from "@chakra-ui/react";
import type * as React from "react";

export interface SwitchProps extends ChakraSwitch.RootProps {
	inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
	rootRef?: React.RefObject<HTMLLabelElement | null>;
	trackLabel?: { on: React.ReactNode; off: React.ReactNode };
	thumbLabel?: { on: React.ReactNode; off: React.ReactNode };
}

export const Switch = function Switch({
	ref,
	...props
}: SwitchProps & { ref?: React.Ref<HTMLInputElement> }) {
	const { inputProps, children, rootRef, trackLabel, thumbLabel, ...rest } =
		props;

	return (
		<ChakraSwitch.Root ref={rootRef} {...rest}>
			<ChakraSwitch.HiddenInput ref={ref} {...inputProps} />
			<ChakraSwitch.Control>
				<ChakraSwitch.Thumb>
					{thumbLabel && (
						<ChakraSwitch.ThumbIndicator fallback={thumbLabel?.off}>
							{thumbLabel?.on}
						</ChakraSwitch.ThumbIndicator>
					)}
				</ChakraSwitch.Thumb>
				{trackLabel && (
					<ChakraSwitch.Indicator fallback={trackLabel.off}>
						{trackLabel.on}
					</ChakraSwitch.Indicator>
				)}
			</ChakraSwitch.Control>
			{children != null && <ChakraSwitch.Label>{children}</ChakraSwitch.Label>}
		</ChakraSwitch.Root>
	);
};
