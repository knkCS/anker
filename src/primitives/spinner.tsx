import {
	Spinner as ChakraSpinner,
	type SpinnerProps as ChakraSpinnerProps,
} from "@chakra-ui/react";
import type React from "react";

export type SpinnerProps = ChakraSpinnerProps;

export const Spinner: React.FC<SpinnerProps> = (props) => {
	return <ChakraSpinner {...props} />;
};
Spinner.displayName = "Spinner";
