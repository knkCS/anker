import {
	Progress as ChakraProgress,
	ProgressCircle as ChakraProgressCircle,
} from "@chakra-ui/react";
import type * as React from "react";

export interface ProgressProps extends ChakraProgress.RootProps {
	/** Whether to show the percentage label. @default false */
	showValue?: boolean;
	/** Label text displayed above the progress bar. */
	label?: React.ReactNode;
}

export const Progress = function Progress({
	ref,
	...props
}: ProgressProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { showValue, label, ...rest } = props;
	return (
		<ChakraProgress.Root ref={ref} {...rest}>
			{(label || showValue) && (
				<ChakraProgress.Label>
					{label}
					{showValue && <ChakraProgress.ValueText />}
				</ChakraProgress.Label>
			)}
			<ChakraProgress.Track>
				<ChakraProgress.Range />
			</ChakraProgress.Track>
		</ChakraProgress.Root>
	);
};
Progress.displayName = "Progress";

export interface ProgressCircleProps extends ChakraProgressCircle.RootProps {
	/** Whether to show the percentage label. @default false */
	showValue?: boolean;
}

export const ProgressCircle = function ProgressCircle({
	ref,
	...props
}: ProgressCircleProps & { ref?: React.Ref<HTMLDivElement> }) {
	const { showValue, children, ...rest } = props;
	return (
		<ChakraProgressCircle.Root ref={ref} {...rest}>
			<ChakraProgressCircle.Circle>
				<ChakraProgressCircle.Track />
				<ChakraProgressCircle.Range />
			</ChakraProgressCircle.Circle>
			{showValue && <ChakraProgressCircle.ValueText />}
			{children}
		</ChakraProgressCircle.Root>
	);
};
ProgressCircle.displayName = "ProgressCircle";
