import { Button } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LeavePageConfirmation } from "./leave-page-confirmation";

const meta = {
	title: "Primitives/LeavePageConfirmation",
	component: LeavePageConfirmation,
} satisfies Meta<typeof LeavePageConfirmation>;

export default meta;
type Story = StoryObj;

export const Default: Story = {
	render() {
		const [blocked, setBlocked] = useState(false);
		return (
			<>
				<Button onClick={() => setBlocked(true)}>Simulate navigation</Button>
				<LeavePageConfirmation
					blocked={blocked}
					onConfirmLeave={() => {
						setBlocked(false);
						console.log("User confirmed leave");
					}}
					onCancelLeave={() => {
						setBlocked(false);
						console.log("User cancelled leave");
					}}
				/>
			</>
		);
	},
};

export const CustomLabels: Story = {
	render() {
		const [blocked, setBlocked] = useState(false);
		return (
			<>
				<Button onClick={() => setBlocked(true)}>Trigger dialog</Button>
				<LeavePageConfirmation
					blocked={blocked}
					onConfirmLeave={() => setBlocked(false)}
					onCancelLeave={() => setBlocked(false)}
					title="Discard changes?"
					message="All unsaved work will be lost."
					confirmLabel="Discard"
					cancelLabel="Keep editing"
				/>
			</>
		);
	},
};
