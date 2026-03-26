import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ColorSwatchPicker } from "./color-swatch-picker";

const meta = {
	title: "Atoms/ColorSwatchPicker",
	component: ColorSwatchPicker,
} satisfies Meta<typeof ColorSwatchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultDemo() {
	const [color, setColor] = useState<string | undefined>(undefined);
	return <ColorSwatchPicker value={color} onChange={setColor} />;
}

function WithHexInputDemo() {
	const [color, setColor] = useState<string | undefined>("#3b82f6");
	return <ColorSwatchPicker value={color} onChange={setColor} showHexInput />;
}

function WithPreviewDemo() {
	const [color, setColor] = useState<string | undefined>("#3b82f6");
	return (
		<ColorSwatchPicker
			value={color}
			onChange={setColor}
			showHexInput
			showPreview
		/>
	);
}

function CustomPresetsDemo() {
	const [color, setColor] = useState<string | undefined>(undefined);
	return (
		<ColorSwatchPicker
			value={color}
			onChange={setColor}
			presets={["#ff0000", "#00ff00", "#0000ff", "#ffff00"]}
		/>
	);
}

function SmallSizeDemo() {
	const [color, setColor] = useState<string | undefined>(undefined);
	return <ColorSwatchPicker value={color} onChange={setColor} size="sm" />;
}

function NoSelectionDemo() {
	const [color, setColor] = useState<string | undefined>(undefined);
	return <ColorSwatchPicker value={color} onChange={setColor} />;
}

export const Default: Story = {
	render: () => <DefaultDemo />,
};

export const WithHexInput: Story = {
	render: () => <WithHexInputDemo />,
};

export const WithPreview: Story = {
	render: () => <WithPreviewDemo />,
};

export const CustomPresets: Story = {
	render: () => <CustomPresetsDemo />,
};

export const SmallSize: Story = {
	render: () => <SmallSizeDemo />,
};

export const NoSelection: Story = {
	render: () => <NoSelectionDemo />,
};
