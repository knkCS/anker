import { Slider as ChakraSlider } from "@chakra-ui/react";
import type * as React from "react";

export interface SliderProps extends ChakraSlider.RootProps {
	/** Whether to show the current value label. @default false */
	showValue?: boolean;
	/** Label text displayed alongside the slider. */
	label?: React.ReactNode;
	/** Marks to display on the track. */
	marks?: Array<number | { value: number; label: React.ReactNode }>;
}

export const Slider = function Slider({
	ref,
	...props
}: SliderProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { showValue, label, marks, ...rest } = props;
	return (
		<ChakraSlider.Root ref={ref} {...rest}>
			{(label || showValue) && (
				<ChakraSlider.Label>
					{label}
					{showValue && <ChakraSlider.ValueText />}
				</ChakraSlider.Label>
			)}
			<ChakraSlider.Control>
				<ChakraSlider.Track>
					<ChakraSlider.Range />
				</ChakraSlider.Track>
				<ChakraSlider.Thumbs />
			</ChakraSlider.Control>
			{marks && <ChakraSlider.Marks marks={marks} />}
		</ChakraSlider.Root>
	);
};
Slider.displayName = "Slider";
