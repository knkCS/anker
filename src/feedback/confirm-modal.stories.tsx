import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../atoms/button/button";
import { Text } from "../primitives/typography";
import { ConfirmModalProvider, useConfirmModal } from "./confirm-modal";

const meta = {
	title: "Feedback/ConfirmModal",
	component: ConfirmModalProvider,
	decorators: [
		(Story) => (
			<ConfirmModalProvider>
				<Story />
			</ConfirmModalProvider>
		),
	],
} satisfies Meta<typeof ConfirmModalProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

const ConfirmDemo = () => {
	const { confirm } = useConfirmModal();
	const [result, setResult] = useState<string>("");

	const handleDelete = async () => {
		const confirmed = await confirm({
			title: "Delete item",
			message:
				"Are you sure you want to delete this item? This action cannot be undone.",
		});
		setResult(confirmed ? "Confirmed" : "Cancelled");
	};

	return (
		<>
			<Button colorPalette="red" onClick={handleDelete}>
				Delete item
			</Button>
			{result && <Text mt={4}>Result: {result}</Text>}
		</>
	);
};

export const Default: Story = {
	render: () => <ConfirmDemo />,
};

const CustomLabelsDemo = () => {
	const { confirm } = useConfirmModal();
	const [result, setResult] = useState<string>("");

	const handlePublish = async () => {
		const confirmed = await confirm({
			title: "Publish changes",
			message: "This will make your changes visible to all users.",
			confirmLabel: "Publish",
			cancelLabel: "Go back",
			colorPalette: "green",
		});
		setResult(confirmed ? "Published" : "Cancelled");
	};

	return (
		<>
			<Button colorPalette="green" onClick={handlePublish}>
				Publish
			</Button>
			{result && <Text mt={4}>Result: {result}</Text>}
		</>
	);
};

export const CustomLabels: Story = {
	render: () => <CustomLabelsDemo />,
};

const RichMessageDemo = () => {
	const { confirm } = useConfirmModal();

	const handleClick = async () => {
		await confirm({
			title: "Confirm action",
			message: (
				<>
					<Text fontWeight="bold">This is a rich message.</Text>
					<Text>It supports any React node as content.</Text>
				</>
			),
			confirmLabel: "Proceed",
		});
	};

	return <Button onClick={handleClick}>Show rich message</Button>;
};

export const RichMessage: Story = {
	render: () => <RichMessageDemo />,
};
