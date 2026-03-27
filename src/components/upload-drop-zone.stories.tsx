import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "../primitives/typography";
import { UploadDropZone } from "./upload-drop-zone";

const meta = {
	title: "Components/UploadDropZone",
	component: UploadDropZone,
} satisfies Meta<typeof UploadDropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onFiles: (files) => console.log("Files:", files),
	},
};

export const Compact: Story = {
	args: {
		onFiles: (files) => console.log("Files:", files),
		compact: true,
	},
};

export const Disabled: Story = {
	args: {
		onFiles: (files) => console.log("Files:", files),
		disabled: true,
	},
};

export const WithMaxSize: Story = {
	args: {
		onFiles: (files) => console.log("Files:", files),
		maxSize: 1024 * 1024,
		onError: (e) => console.log("Rejected:", e.file.name, e.reason),
	},
};

export const CustomContent: Story = {
	args: {
		onFiles: (files) => console.log("Files:", files),
		children: (
			<Text color="fg.muted" fontSize="sm">
				Drop your files anywhere in this zone to upload them.
			</Text>
		),
	},
};
