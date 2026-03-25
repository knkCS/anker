import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SwitchCell } from "./switch-cell";

const meta = {
	title: "Components/DataTable/Cells/SwitchCell",
	component: SwitchCell,
} satisfies Meta<typeof SwitchCell>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveSwitch = () => {
	const [checked, setChecked] = useState(true);
	return (
		<SwitchCell
			checked={checked}
			onChange={setChecked}
			label="Toggle enabled"
		/>
	);
};

export const Default: Story = {
	render: () => <InteractiveSwitch />,
};

export const Disabled: Story = {
	args: {
		checked: true,
		onChange: () => {},
		disabled: true,
		label: "Disabled toggle",
	},
};

export const Unchecked: Story = {
	args: {
		checked: false,
		onChange: () => {},
		label: "Unchecked toggle",
	},
};
