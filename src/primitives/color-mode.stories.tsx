import { Stack, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import {
	ColorModeButton,
	ColorModeProvider,
	DarkMode,
	LightMode,
} from "./color-mode";

const meta = {
	title: "Primitives/ColorMode",
	decorators: [
		(Story) => (
			<ColorModeProvider>
				<Story />
			</ColorModeProvider>
		),
	],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const ToggleButton: Story = {
	render() {
		return (
			<Stack align="start" gap="4">
				<Text>Click the button to toggle color mode:</Text>
				<ColorModeButton />
			</Stack>
		);
	},
};

export const ForcedLightMode: Story = {
	render() {
		return (
			<LightMode>
				<Text>This content is always in light mode.</Text>
			</LightMode>
		);
	},
};

export const ForcedDarkMode: Story = {
	render() {
		return (
			<DarkMode>
				<Text>This content is always in dark mode.</Text>
			</DarkMode>
		);
	},
};
