// Note: UploadToastStack uses position="fixed" — it renders in the bottom-right
// corner of the Storybook iframe. This is intentional and works correctly in preview.
import type { Meta, StoryObj } from "@storybook/react";
import { UploadToastStack } from "./upload-toast-stack";

const meta = {
	title: "Feedback/UploadToastStack",
	component: UploadToastStack,
	args: {
		autoDismissMs: 0,
		onDismiss: () => console.log("Dismissed"),
	},
} satisfies Meta<typeof UploadToastStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Uploading: Story = {
	args: {
		files: [
			{ id: "1", filename: "photo.jpg", status: "done", progress: 100 },
			{ id: "2", filename: "video.mp4", status: "uploading", progress: 60 },
			{ id: "3", filename: "document.pdf", status: "pending" },
		],
	},
};

export const AllDone: Story = {
	args: {
		files: [
			{ id: "1", filename: "photo.jpg", status: "done", progress: 100 },
			{ id: "2", filename: "video.mp4", status: "done", progress: 100 },
			{ id: "3", filename: "document.pdf", status: "done", progress: 100 },
		],
	},
};

export const WithErrors: Story = {
	args: {
		files: [
			{ id: "1", filename: "photo.jpg", status: "done", progress: 100 },
			{
				id: "2",
				filename: "video.mp4",
				status: "error",
				error: "Network timeout",
			},
			{ id: "3", filename: "document.pdf", status: "done", progress: 100 },
		],
	},
};

export const Collapsed: Story = {
	args: {
		defaultExpanded: false,
		files: [
			{ id: "1", filename: "archive.zip", status: "uploading", progress: 30 },
			{
				id: "2",
				filename: "spreadsheet.xlsx",
				status: "uploading",
				progress: 10,
			},
		],
	},
};

export const SingleFile: Story = {
	args: {
		files: [
			{ id: "1", filename: "report.pdf", status: "uploading", progress: 45 },
		],
	},
};
