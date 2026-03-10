import { Button, Text } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DrawerRoot } from "./drawer";

const meta = {
	title: "Components/Drawer",
	component: DrawerRoot,
} satisfies Meta<typeof DrawerRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

const DefaultDemo = () => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button onClick={() => setOpen(true)}>Open Drawer</Button>
			<DrawerRoot
				open={open}
				onClose={() => setOpen(false)}
				title="Drawer Title"
				onSave={() => setOpen(false)}
			>
				<Text>Drawer body content goes here.</Text>
			</DrawerRoot>
		</>
	);
};

export const Default: Story = {
	render: () => <DefaultDemo />,
};

const WithFooterTextDemo = () => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button onClick={() => setOpen(true)}>Open Drawer</Button>
			<DrawerRoot
				open={open}
				onClose={() => setOpen(false)}
				title="Edit Item"
				footerText="Last saved 5 minutes ago"
				onSave={() => setOpen(false)}
				saveLabel="Update"
			>
				<Text>Form content goes here.</Text>
			</DrawerRoot>
		</>
	);
};

export const WithFooterText: Story = {
	render: () => <WithFooterTextDemo />,
};
