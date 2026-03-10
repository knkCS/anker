import { Button, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./modal";

const meta = {
	title: "Components/Modal",
	component: Modal,
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render() {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Modal</Button>
				<Modal
					open={open}
					onClose={() => setOpen(false)}
					header="Edit Item"
					onSave={() => setOpen(false)}
				>
					<Text>Modal body content goes here.</Text>
				</Modal>
			</>
		);
	},
};

export const WithCustomFooter: Story = {
	render() {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Modal</Button>
				<Modal
					open={open}
					onClose={() => setOpen(false)}
					header="Confirmation"
					footer={
						<Button
							variant="solid"
							colorPalette="red"
							onClick={() => setOpen(false)}
						>
							Delete
						</Button>
					}
				>
					<Text>Are you sure you want to delete this item?</Text>
				</Modal>
			</>
		);
	},
};

export const NoFooter: Story = {
	render() {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Modal</Button>
				<Modal
					open={open}
					onClose={() => setOpen(false)}
					header="Information"
				>
					<Text>This modal has no footer buttons.</Text>
				</Modal>
			</>
		);
	},
};
