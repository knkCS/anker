import type { SystemContext } from "@chakra-ui/react";
import { ChakraProvider } from "@chakra-ui/react";
import defaultSystem from "../theme";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

export interface ProviderProps extends ColorModeProviderProps {
	/** Override the default anker theme system. */
	system?: SystemContext;
}

export function Provider({ system, ...props }: ProviderProps) {
	return (
		<ChakraProvider value={system ?? defaultSystem}>
			<ColorModeProvider {...props} />
		</ChakraProvider>
	);
}
