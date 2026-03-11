import { ChakraProvider } from "@chakra-ui/react";
import type { Preview } from "@storybook/react";
import type React from "react";
import system from "../src/theme";

const withChakra = (Story: React.ComponentType) => (
	<ChakraProvider value={system}>
		<Story />
	</ChakraProvider>
);

const preview: Preview = {
	decorators: [withChakra],
	tags: ["autodocs"],
	parameters: {
		options: {
			storySort: {
				order: [
					"Introduction",
					"Primitives",
					"Components",
					"Atoms",
					"Forms",
					"Feedback",
				],
			},
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
